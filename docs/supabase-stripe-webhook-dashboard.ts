import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const encoder = new TextEncoder();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const getRequiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const timingSafeEqual = (left: Uint8Array, right: Uint8Array) => {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }

  return result === 0;
};

const hexToBytes = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

const verifyStripeSignature = async (payload: string, signatureHeader: string, secret: string) => {
  const parts = signatureHeader.split(",").reduce<Record<string, string[]>>((accumulator, part) => {
    const [key, value] = part.split("=");
    if (!key || !value) return accumulator;
    accumulator[key] = [...(accumulator[key] ?? []), value];
    return accumulator;
  }, {});
  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];

  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(signedPayload));
  const expected = new Uint8Array(signature);

  return signatures.some((candidate) => timingSafeEqual(expected, hexToBytes(candidate)));
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const webhookSecret = getRequiredEnv("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const signature = request.headers.get("stripe-signature");
    const payload = await request.text();

    if (!signature) {
      return jsonResponse({ error: "Missing Stripe signature." }, 400);
    }

    const signatureValid = await verifyStripeSignature(payload, signature, webhookSecret);
    if (!signatureValid) {
      return jsonResponse({ error: "Invalid Stripe signature." }, 400);
    }

    const event = JSON.parse(payload);

    if (event.type !== "checkout.session.completed") {
      return jsonResponse({ received: true, ignored: event.type });
    }

    const session = event.data?.object;
    const purchaseId = session?.metadata?.purchase_id ?? session?.client_reference_id;

    if (!purchaseId || typeof purchaseId !== "string") {
      return jsonResponse({ error: "Missing purchase ID on checkout session." }, 400);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error } = await adminClient.rpc("credit_token_purchase", {
      purchase_id: purchaseId,
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
      stripe_event_id: typeof event.id === "string" ? event.id : null,
    });

    if (error) {
      console.error("Unable to credit token purchase", error);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ received: true, credited: true });
  } catch (error) {
    console.error("stripe-webhook failed", error);
    return jsonResponse({ error: "Unexpected webhook error." }, 500);
  }
});
