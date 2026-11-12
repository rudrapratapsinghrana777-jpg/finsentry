import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { convertInrToUsd } from "@/lib/budget-rules";
import { paypalRequest } from "@/lib/paypal.server";

const checkoutInput = z.object({
  itemName: z.string().trim().min(1).max(80),
  amountInr: z.number().int().positive().max(10_000_000),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url(),
}).refine((input) => new URL(input.returnUrl).origin === new URL(input.cancelUrl).origin, {
  message: "Checkout return URLs must share an origin.",
});

export const createPayPalOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => checkoutInput.parse(input))
  .handler(async ({ data }) => {
    const lovableApiKey = process.env["LOVABLE_API_KEY"];
    const paypalApiKey = process.env["PAYPAL_API_KEY"];
    if (!lovableApiKey || !paypalApiKey) throw new Error("PayPal checkout is not configured.");

    const order = await paypalRequest<{
      id: string;
      links?: { href: string; rel: string }[];
    }>(
      "/v2/checkout/orders",
      {
        method: "POST",
        headers: { "PayPal-Request-Id": crypto.randomUUID() },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            description: data.itemName,
            amount: { currency_code: "USD", value: convertInrToUsd(data.amountInr) },
          }],
          application_context: {
            brand_name: "FinSentry",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: data.returnUrl,
            cancel_url: data.cancelUrl,
          },
        }),
      },
      lovableApiKey,
      paypalApiKey,
    );
    const approvalUrl = order.links?.find((link) => link.rel === "approve" || link.rel === "payer-action")?.href;
    if (!order.id || !approvalUrl) throw new Error("PayPal did not provide an approval link.");
    return { orderId: order.id, approvalUrl };
  });

export const capturePayPalOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ orderId: z.string().regex(/^[A-Z0-9-]{1,36}$/) }).parse(input))
  .handler(async ({ data }) => {
    const lovableApiKey = process.env["LOVABLE_API_KEY"];
    const paypalApiKey = process.env["PAYPAL_API_KEY"];
    if (!lovableApiKey || !paypalApiKey) throw new Error("PayPal checkout is not configured.");

    const result = await paypalRequest<{
      status?: string;
      purchase_units?: { payments?: { captures?: { id?: string; status?: string }[] } }[];
    }>(
      `/v2/checkout/orders/${data.orderId}/capture`,
      {
        method: "POST",
        headers: { "PayPal-Request-Id": `capture-${data.orderId}` },
        body: JSON.stringify({}),
      },
      lovableApiKey,
      paypalApiKey,
    );
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    if (result.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
      throw new Error("PayPal has not confirmed this payment.");
    }
    return { orderId: data.orderId, captureId: capture.id ?? "", status: capture.status };
  });