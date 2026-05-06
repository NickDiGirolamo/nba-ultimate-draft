import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

interface CheckoutRequestBody {
  packSlug?: string;
  successUrl?: string;
  cancelUrl?: string;
}

const getRequiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = getRequiredEnv("STRIPE_SECRET_KEY");
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse({ error: "You must be signed in to buy tokens." }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "You must be signed in to buy tokens." }, 401);
    }

    const body = (await request.json()) as CheckoutRequestBody;
    const packSlug = body.packSlug?.trim();

    if (!packSlug) {
      return jsonResponse({ error: "Missing token pack." }, 400);
    }

    const { data: pack, error: packError } = await adminClient
      .from("token_pack_products")
      .select("id, slug, name, token_amount, usd_cents, currency, stripe_price_id, active")
      .eq("slug", packSlug)
      .eq("active", true)
      .maybeSingle();

    if (packError) {
      console.error("Unable to load token pack", packError);
      return jsonResponse({ error: `Unable to load token pack: ${packError.message}` }, 500);
    }

    if (!pack?.stripe_price_id) {
      return jsonResponse({ error: "This token pack is not ready for checkout yet." }, 400);
    }

    const origin = request.headers.get("Origin") ?? "http://localhost:5173";
    const successUrl = body.successUrl ?? `${origin}/?checkout=success`;
    const cancelUrl = body.cancelUrl ?? `${origin}/?checkout=cancelled`;

    const { data: purchase, error: purchaseError } = await adminClient
      .from("token_purchase_records")
      .insert({
        user_id: user.id,
        token_pack_product_id: pack.id,
        token_pack_slug: pack.slug,
        token_amount: pack.token_amount,
        usd_cents: pack.usd_cents,
        currency: pack.currency,
        status: "created",
        payment_provider: "stripe",
        metadata: {
          user_email: user.email,
        },
      })
      .select("id")
      .single();

    if (purchaseError || !purchase) {
      console.error("Unable to create purchase record", purchaseError);
      return jsonResponse({ error: "Unable to create purchase record." }, 500);
    }

    const checkoutParams = new URLSearchParams();
    checkoutParams.set("mode", "payment");
    checkoutParams.set("success_url", successUrl);
    checkoutParams.set("cancel_url", cancelUrl);
    checkoutParams.set("client_reference_id", purchase.id);
    if (user.email) {
      checkoutParams.set("customer_email", user.email);
    }
    checkoutParams.set("line_items[0][price]", pack.stripe_price_id);
    checkoutParams.set("line_items[0][quantity]", "1");
    checkoutParams.set("metadata[purchase_id]", purchase.id);
    checkoutParams.set("metadata[user_id]", user.id);
    checkoutParams.set("metadata[token_pack_slug]", pack.slug);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: checkoutParams,
    });

    const checkoutSession = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe Checkout error", checkoutSession);
      await adminClient
        .from("token_purchase_records")
        .update({
          status: "failed",
          metadata: {
            user_email: user.email,
            stripe_error: checkoutSession,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchase.id);

      return jsonResponse({ error: "Unable to create Stripe Checkout session." }, 500);
    }

    await adminClient
      .from("token_purchase_records")
      .update({
        status: "pending",
        provider_checkout_session_id: checkoutSession.id,
        provider_customer_id: typeof checkoutSession.customer === "string" ? checkoutSession.customer : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", purchase.id);

    return jsonResponse({
      checkoutUrl: checkoutSession.url,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error("create-checkout-session failed", error);
    return jsonResponse({ error: "Unexpected checkout error." }, 500);
  }
});
