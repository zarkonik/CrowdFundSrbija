import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret, defineString } from "firebase-functions/params";
import {
  getAccessToken,
  createOrder as createPayPalOrder,
  captureOrder as capturePayPalOrder,
  refundCapture,
} from "./paypal.js";

initializeApp();
const db = getFirestore();

const paypalClientId = defineString("PAYPAL_CLIENT_ID");
const paypalClientSecret = defineSecret("PAYPAL_CLIENT_SECRET");

// Temporary health-check endpoint, confirms the Functions project deploys
// and is reachable.
export const ping = onRequest((_req, res) => {
  res.json({ ok: true });
});

export const createOrder = onCall(
  { secrets: [paypalClientSecret] },
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

    const accessToken = await getAccessToken(
      paypalClientId.value(),
      paypalClientSecret.value(),
    );
    const order = await createPayPalOrder(accessToken, amountCents, campaignId);

    return { orderId: order.id };
  },
);

export const captureOrder = onCall(
  { secrets: [paypalClientSecret] },
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

    const accessToken = await getAccessToken(
      paypalClientId.value(),
      paypalClientSecret.value(),
    );
    const capture = await capturePayPalOrder(accessToken, orderId);

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

  const accessToken = await getAccessToken(
    paypalClientId.value(),
    paypalClientSecret.value(),
  );

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

      try {
        const refund = await refundCapture(
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
  { schedule: "every 60 minutes", secrets: [paypalClientSecret] },
  async () => {
    await settleDueCampaigns();
  },
);

