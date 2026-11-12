const GATEWAY_URL = "https://connector-gateway.lovable.dev/paypal";

export async function paypalRequest<T>(
  path: string,
  init: RequestInit,
  lovableApiKey: string,
  paypalApiKey: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${lovableApiKey}`);
  headers.set("X-Connection-Api-Key", paypalApiKey);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const response = await fetch(`${GATEWAY_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`PayPal gateway request failed [${response.status}]: ${errorBody}`);
    throw new Error("PayPal request failed.");
  }

  return (await response.json()) as T;
}