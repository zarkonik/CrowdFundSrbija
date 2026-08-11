import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret, defineString } from "firebase-functions/params";
import {
  SANDBOX_API_BASE,
  LIVE_API_BASE,
  getAccessToken,
  createOrder as createPayPalOrder,
  captureOrder as capturePayPalOrder,
  refundCapture,
} from "./paypal.js";

initializeApp();
const db = getFirestore();

const paypalSandboxClientId = defineString("PAYPAL_CLIENT_ID");
const paypalSandboxClientSecret = defineSecret("PAYPAL_CLIENT_SECRET");
const paypalLiveClientId = defineString("PAYPAL_LIVE_CLIENT_ID");
const paypalLiveClientSecret = defineSecret("PAYPAL_LIVE_CLIENT_SECRET");

type PaypalEnv = "sandbox" | "live";

// The platform's PayPal mode is a single Firestore doc the admin toggles
// from the app (Profile page). Missing doc = sandbox, so nothing changes
// for existing deployments/tests until someone explicitly flips it.
async function getPaypalMode(): Promise<PaypalEnv> {
  const snap = await db.doc("config/paypal").get();
  return snap.data()?.mode === "live" ? "live" : "sandbox";
}

function credentialsFor(env: PaypalEnv) {
  return env === "live"
    ? {
        apiBase: LIVE_API_BASE,
        clientId: paypalLiveClientId.value(),
        clientSecret: paypalLiveClientSecret.value(),
      }
    : {
        apiBase: SANDBOX_API_BASE,
        clientId: paypalSandboxClientId.value(),
        clientSecret: paypalSandboxClientSecret.value(),
      };
}

// Temporary health-check endpoint, confirms the Functions project deploys
// and is reachable.
export const ping = onRequest((_req, res) => {
  res.json({ ok: true });
});

export const createOrder = onCall(
  { secrets: [paypalSandboxClientSecret, paypalLiveClientSecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to donate");
    }

    const { campaignId, amountCents } = request.data as {
      campaignId: string;
      amountCents: number;
    };

    if (!campaignId || !Number.isFinite(amountCents) || amountCents <= 0) {
      throw new HttpsError("invalid-argument", "Missing or invalid fields");
    }

    const campaignSnap = await db.doc(`campaigns/${campaignId}`).get();
    if (!campaignSnap.exists) {
      throw new HttpsError("not-found", "Campaign not found");
    }

    const campaign = campaignSnap.data()!;
    if (Date.now() >= campaign.deadline * 1000) {
      throw new HttpsError(
        "failed-precondition",
        "This campaign's deadline has passed",
      );
    }
    if (campaign.ownerAddress === request.auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "You can't donate to your own campaign",
      );
    }

    const env = await getPaypalMode();
    const { apiBase, clientId, clientSecret } = credentialsFor(env);
    const accessToken = await getAccessToken(apiBase, clientId, clientSecret);
    const order = await createPayPalOrder(
      apiBase,
      accessToken,
      amountCents,
      campaignId,
    );

    return { orderId: order.id };
  },
);

export const captureOrder = onCall(
  { secrets: [paypalSandboxClientSecret, paypalLiveClientSecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to donate");
    }

    const { orderId, campaignId, donatorName } = request.data as {
      orderId: string;
      campaignId: string;
      donatorName?: string;
    };

    if (!orderId || !campaignId) {
      throw new HttpsError("invalid-argument", "Missing or invalid fields");
    }

    const env = await getPaypalMode();
    const { apiBase, clientId, clientSecret } = credentialsFor(env);
    const accessToken = await getAccessToken(apiBase, clientId, clientSecret);
    const capture = await capturePayPalOrder(apiBase, accessToken, orderId);

    if (capture.status !== "COMPLETED") {
      throw new HttpsError("aborted", "Payment was not completed");
    }

    const captured = capture.purchase_units[0].payments.captures[0];
    const amountCents = Math.round(parseFloat(captured.amount.value) * 100);
    const address = request.auth.uid;

    const campaignRef = db.doc(`campaigns/${campaignId}`);
    const donationRef = campaignRef.collection("donations").doc();

    await db.runTransaction(async (tx) => {
      const campaignSnap = await tx.get(campaignRef);
      const currentCollected = campaignSnap.data()?.amountCollectedCents ?? 0;

      tx.update(campaignRef, {
        amountCollectedCents: currentCollected + amountCents,
      });
      tx.set(donationRef, {
        donatorAddress: address,
        donatorName: donatorName?.trim() || address,
        amountCents,
        isRealPayment: true,
        paypalEnv: env,
        paypalOrderId: orderId,
        paypalCaptureId: captured.id,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true, amountCents };
  },
);

async function settleDueCampaigns() {
  const nowSeconds = Math.floor(Date.now() / 1000);

  const dueCampaigns = await db
    .collection("campaigns")
    .where("deadline", "<=", nowSeconds)
    .where("settledAt", "==", null)
    .get();

  if (dueCampaigns.empty) return { settled: 0 };

  // Refunds must use whichever environment (sandbox/live) each donation was
  // actually captured in, not the platform's current mode — the two can
  // differ if the admin toggles mode between a donation and the deadline.
  const accessTokenCache = new Map<PaypalEnv, Promise<string>>();
  const getAccessTokenFor = (env: PaypalEnv) => {
    if (!accessTokenCache.has(env)) {
      const { apiBase, clientId, clientSecret } = credentialsFor(env);
      accessTokenCache.set(
        env,
        getAccessToken(apiBase, clientId, clientSecret),
      );
    }
    return accessTokenCache.get(env)!;
  };

  for (const campaignDoc of dueCampaigns.docs) {
    const campaign = campaignDoc.data();
    const successful =
      (campaign.amountCollectedCents ?? 0) >= campaign.targetCents;

    if (successful) {
      await campaignDoc.ref.update({
        settledAt: FieldValue.serverTimestamp(),
        fundingSuccessful: true,
      });
      continue;
    }

    const donationsSnap = await campaignDoc.ref
      .collection("donations")
      .where("isRealPayment", "==", true)
      .get();

    for (const donationDoc of donationsSnap.docs) {
      const donation = donationDoc.data();
      if (donation.refundedAt || !donation.paypalCaptureId) continue;

      const env: PaypalEnv = donation.paypalEnv === "live" ? "live" : "sandbox";

      try {
        const accessToken = await getAccessTokenFor(env);
        const { apiBase } = credentialsFor(env);
        const refund = await refundCapture(
          apiBase,
          accessToken,
          donation.paypalCaptureId,
        );
        await donationDoc.ref.update({
          refundedAt: FieldValue.serverTimestamp(),
          refundId: refund.id,
        });
      } catch (err) {
        console.error(
          `Refund failed for donation ${donationDoc.id} on campaign ${campaignDoc.id}`,
          err,
        );
      }
    }

    await campaignDoc.ref.update({
      settledAt: FieldValue.serverTimestamp(),
      fundingSuccessful: false,
    });
  }

  return { settled: dueCampaigns.size };
}

// Runs hourly: settles any campaign whose deadline has passed and hasn't
// been settled yet. Successful campaigns just get flagged (the admin
// payout panel in the app takes it from there). Failed campaigns get every
// real PayPal donation refunded automatically.
export const settleCampaigns = onSchedule(
  {
    schedule: "every 60 minutes",
    secrets: [paypalSandboxClientSecret, paypalLiveClientSecret],
  },
  async () => {
    await settleDueCampaigns();
  },
);
