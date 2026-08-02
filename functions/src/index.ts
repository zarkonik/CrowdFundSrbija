import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

initializeApp();

export const paypalClientSecret = defineSecret("PAYPAL_CLIENT_SECRET");

// Temporary health-check endpoint, confirms the Functions project deploys
// and is reachable. Will be replaced by the real PayPal order/webhook/
// settlement functions next.
export const ping = onRequest((req, res) => {
  res.json({ ok: true });
});
