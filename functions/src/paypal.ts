const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

type AccessTokenResponse = {
  access_token: string;
};

export const getAccessToken = async (
  clientId: string,
  clientSecret: string,
): Promise<string> => {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${await response.text()}`);
  }

  const data = (await response.json()) as AccessTokenResponse;
  return data.access_token;
};

export const createOrder = async (
  accessToken: string,
  amountCents: number,
  campaignId: string,
) => {
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: campaignId,
          amount: {
            currency_code: "USD",
            value: (amountCents / 100).toFixed(2),
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`PayPal order creation failed: ${await response.text()}`);
  }

  return response.json() as Promise<{ id: string }>;
};

export const captureOrder = async (accessToken: string, orderId: string) => {
  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`PayPal order capture failed: ${await response.text()}`);
  }

  return response.json() as Promise<{
    status: string;
    purchase_units: {
      payments: {
        captures: { id: string; amount: { value: string } }[];
      };
    }[];
  }>;
};

export const refundCapture = async (
  accessToken: string,
  captureId: string,
) => {
  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`PayPal refund failed: ${await response.text()}`);
  }

  return response.json() as Promise<{ status: string; id: string }>;
};
