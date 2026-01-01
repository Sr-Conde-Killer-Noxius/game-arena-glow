import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Generate unique token like JPG-FF-12345
function generateUniqueToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `JPG-FF-${randomPart}`;
}

// Helper to safely extract headers
function extractHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

// Validate Mercado Pago webhook signature
async function validateSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): Promise<boolean> {
  try {
    // Parse x-signature header: ts=xxx,v1=xxx
    const parts: Record<string, string> = {};
    xSignature.split(",").forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        parts[key.trim()] = value.trim();
      }
    });

    const ts = parts["ts"];
    const v1 = parts["v1"];

    if (!ts || !v1) {
      console.log("Missing ts or v1 in signature");
      return false;
    }

    // Build the manifest string
    // template: id:[data.id];request-id:[x-request-id];ts:[ts];
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    console.log("Manifest for HMAC:", manifest);

    // Create HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(manifest)
    );

    // Convert to hex
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    console.log("Computed signature:", computedSignature);
    console.log("Received v1:", v1);

    return computedSignature === v1;
  } catch (error) {
    console.error("Error validating signature:", error);
    return false;
  }
}

serve(async (req) => {
  // Initialize Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const reqHeaders = extractHeaders(req);
  const url = new URL(req.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  // Log function to save to database
  const logWebhook = async (
    source: string,
    method: string,
    headers: Record<string, string>,
    body: unknown,
    statusCode: number,
    response: unknown,
    errorMessage?: string
  ) => {
    try {
      console.log(`[LOG] ${method} ${source} -> ${statusCode}`);
      await supabaseClient.from("webhook_logs").insert({
        source,
        method,
        headers,
        body,
        query_params: queryParams,
        status_code: statusCode,
        response,
        error_message: errorMessage,
      });
    } catch (e) {
      console.error("Failed to save log:", e);
    }
  };

  console.log("========================================");
  console.log("WEBHOOK REQUEST RECEIVED");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(reqHeaders, null, 2));
  console.log("========================================");

  // Handle CORS preflight - return 200 immediately
  if (req.method === "OPTIONS") {
    await logWebhook("mercadopago", "OPTIONS", reqHeaders, null, 200, { cors: true });
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Read body immediately
  const rawBody = await req.text();
  console.log("Raw body:", rawBody);

  // ALWAYS return 200 to Mercado Pago to prevent retries
  const successResponse = () =>
    new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  try {
    // Handle empty body (verification request from MP)
    if (!rawBody || rawBody.trim() === "") {
      console.log("Empty body - verification request");
      await logWebhook("mercadopago", req.method, reqHeaders, null, 200, { type: "verification" });
      return successResponse();
    }

    // Parse body
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.log("Invalid JSON body");
      await logWebhook("mercadopago", req.method, reqHeaders, { raw: rawBody }, 200, { error: "invalid_json" });
      return successResponse();
    }

    console.log("Parsed body:", JSON.stringify(body, null, 2));

    // Get signature headers
    const xSignature = reqHeaders["x-signature"] || "";
    const xRequestId = reqHeaders["x-request-id"] || "";
    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET") || "";

    console.log("x-signature:", xSignature);
    console.log("x-request-id:", xRequestId);
    console.log("Has webhook secret:", !!webhookSecret);

    // Get data.id for signature validation
    const dataId = (body.data as Record<string, unknown>)?.id?.toString() || queryParams["data.id"] || "";
    console.log("data.id:", dataId);

    // Validate signature if secret is configured
    if (webhookSecret && xSignature) {
      const isValid = await validateSignature(xSignature, xRequestId, dataId, webhookSecret);
      console.log("Signature valid:", isValid);

      if (!isValid) {
        console.log("INVALID SIGNATURE - rejecting but returning 200");
        await logWebhook("mercadopago", req.method, reqHeaders, body, 200, { error: "invalid_signature" }, "Invalid webhook signature");
        return successResponse();
      }
      console.log("Signature validated successfully!");
    } else if (webhookSecret) {
      console.log("WARNING: Secret configured but no x-signature header received");
    } else {
      console.log("WARNING: No webhook secret configured - skipping signature validation");
    }

    // Log the webhook
    await logWebhook("mercadopago", req.method, reqHeaders, body, 200, { processing: true });

    // Check notification type
    const notificationType = body.type || body.action;
    console.log("Notification type:", notificationType);

    if (notificationType !== "payment" && 
        body.action !== "payment.updated" && 
        body.action !== "payment.created") {
      console.log("Non-payment notification, ignoring");
      await logWebhook("mercadopago", req.method, reqHeaders, body, 200, { ignored: true, type: notificationType });
      return successResponse();
    }

    // Get payment ID
    const paymentId = (body.data as Record<string, unknown>)?.id;
    if (!paymentId) {
      console.log("No payment ID found");
      await logWebhook("mercadopago", req.method, reqHeaders, body, 200, { error: "no_payment_id" });
      return successResponse();
    }

    console.log("Processing payment ID:", paymentId);

    // Get access token
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("Missing MERCADOPAGO_ACCESS_TOKEN");
      await logWebhook("mercadopago", req.method, reqHeaders, body, 200, { error: "no_access_token" }, "Missing access token");
      return successResponse();
    }

    // Fetch payment from Mercado Pago API
    console.log("Fetching payment details from Mercado Pago...");
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!mpResponse.ok) {
      const mpError = await mpResponse.text();
      console.error("MP API error:", mpResponse.status, mpError);
      await logWebhook("mercadopago", req.method, reqHeaders, body, 200, { mp_error: mpError, mp_status: mpResponse.status });
      return successResponse();
    }

    const payment = await mpResponse.json();
    console.log("Payment from MP:", JSON.stringify({
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      transaction_amount: payment.transaction_amount,
    }));

    let participationId = payment.external_reference;
    
    // If no external_reference, try to find by mercado_pago_payment_id
    if (!participationId) {
      console.log("No external_reference, searching by mercado_pago_payment_id...");
      
      const { data: foundParticipation, error: findError } = await supabaseClient
        .from("participations")
        .select("id")
        .eq("mercado_pago_payment_id", paymentId.toString())
        .single();

      if (findError || !foundParticipation) {
        console.log("Participation not found by payment_id either");
        await logWebhook("mercadopago", req.method, reqHeaders, body, 200, { 
          warning: "participation_not_found", 
          payment_id: paymentId,
          mp_status: payment.status 
        });
        return successResponse();
      }

      participationId = foundParticipation.id;
      console.log("Found participation by payment_id:", participationId);
    }

    // Map Mercado Pago status to our status
    let newStatus: string;
    switch (payment.status) {
      case "approved":
        newStatus = "paid";
        break;
      case "pending":
      case "in_process":
        newStatus = "pending";
        break;
      case "rejected":
      case "cancelled":
        newStatus = "failed";
        break;
      case "refunded":
        newStatus = "refunded";
        break;
      default:
        newStatus = "pending";
    }

    console.log("Updating participation", participationId, "to status:", newStatus);

    // Update participation
    const updateData: Record<string, unknown> = {
      payment_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "paid") {
      updateData.unique_token = generateUniqueToken();
      console.log("Generated token:", updateData.unique_token);
    }

    const { error: updateError } = await supabaseClient
      .from("participations")
      .update(updateData)
      .eq("id", participationId);

    if (updateError) {
      console.error("Update error:", updateError);
      await logWebhook("mercadopago", req.method, reqHeaders, body, 200, { 
        error: "update_failed", 
        message: updateError.message,
        participation_id: participationId 
      }, updateError.message);
    } else {
      console.log("SUCCESS! Participation updated to:", newStatus);
      await logWebhook("mercadopago", req.method, reqHeaders, body, 200, { 
        success: true, 
        new_status: newStatus,
        participation_id: participationId,
        payment_id: paymentId
      });
    }

    return successResponse();

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook exception:", errorMessage);
    await logWebhook("mercadopago", req.method, reqHeaders, { raw: rawBody }, 200, { exception: errorMessage }, errorMessage);
    // Still return 200 to prevent MP retries
    return successResponse();
  }
});
