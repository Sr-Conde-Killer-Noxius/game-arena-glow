import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// Helper to log webhook request - uses any type to avoid Supabase type issues in edge functions
async function logWebhook(
  // deno-lint-ignore no-explicit-any
  supabaseClient: any,
  source: string,
  method: string,
  headers: Record<string, string>,
  body: unknown,
  queryParams: Record<string, string>,
  statusCode: number,
  response: unknown,
  errorMessage?: string
) {
  try {
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
    console.error("Failed to log webhook:", e);
  }
}

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const headers = extractHeaders(req);
  const url = new URL(req.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    await logWebhook(supabaseClient, "mercadopago", "OPTIONS", headers, null, queryParams, 200, { message: "CORS preflight" });
    return new Response(null, { headers: corsHeaders });
  }

  let body: unknown = null;
  let statusCode = 200;
  let responseData: unknown = { received: true };
  let errorMessage: string | undefined;

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("Missing MERCADOPAGO_ACCESS_TOKEN");
      throw new Error("Payment service not configured");
    }

    // Try to parse body, handle empty body gracefully
    const rawBody = await req.text();
    console.log("Raw body received:", rawBody);
    
    if (!rawBody || rawBody.trim() === "") {
      console.log("Empty body received - possibly a verification request");
      statusCode = 200;
      responseData = { received: true, message: "Empty body acknowledged" };
      await logWebhook(supabaseClient, "mercadopago", req.method, headers, null, queryParams, statusCode, responseData);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse JSON body:", parseError);
      statusCode = 400;
      responseData = { error: "Invalid JSON body" };
      errorMessage = "Failed to parse JSON body";
      await logWebhook(supabaseClient, "mercadopago", req.method, headers, rawBody, queryParams, statusCode, responseData, errorMessage);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    console.log("Webhook received:", JSON.stringify(body));

    const webhookBody = body as Record<string, unknown>;
    
    // Mercado Pago sends different notification types
    if (webhookBody.type !== "payment" && webhookBody.action !== "payment.updated") {
      console.log("Ignoring non-payment notification:", webhookBody.type || webhookBody.action);
      responseData = { received: true, ignored: true, reason: "non-payment notification" };
      await logWebhook(supabaseClient, "mercadopago", req.method, headers, body, queryParams, statusCode, responseData);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    // Get payment ID from webhook
    const data = webhookBody.data as Record<string, unknown> | undefined;
    const paymentId = data?.id;
    if (!paymentId) {
      console.error("No payment ID in webhook body");
      statusCode = 400;
      responseData = { error: "No payment ID" };
      errorMessage = "No payment ID in webhook body";
      await logWebhook(supabaseClient, "mercadopago", req.method, headers, body, queryParams, statusCode, responseData, errorMessage);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    console.log("Fetching payment details for ID:", paymentId);

    // Fetch payment details from Mercado Pago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!mpResponse.ok) {
      const mpError = await mpResponse.text();
      console.error("Failed to fetch payment from MP:", mpError);
      throw new Error(`Failed to fetch payment details: ${mpError}`);
    }

    const payment = await mpResponse.json();
    console.log("Payment status:", payment.status);
    console.log("External reference (participation ID):", payment.external_reference);

    const participationId = payment.external_reference;
    if (!participationId) {
      console.error("No external reference in payment");
      statusCode = 400;
      responseData = { error: "No participation ID", payment_id: paymentId };
      errorMessage = "No external reference in payment";
      await logWebhook(supabaseClient, "mercadopago", req.method, headers, body, queryParams, statusCode, responseData, errorMessage);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
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

    console.log("Updating participation status to:", newStatus);

    // Update participation with new status
    const updateData: Record<string, unknown> = {
      payment_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // If payment is approved, generate unique token
    if (newStatus === "paid") {
      const uniqueToken = generateUniqueToken();
      updateData.unique_token = uniqueToken;
      console.log("Generated unique token:", uniqueToken);
    }

    const { error: updateError } = await supabaseClient
      .from("participations")
      .update(updateData)
      .eq("id", participationId);

    if (updateError) {
      console.error("Error updating participation:", updateError);
      throw new Error(`Failed to update participation: ${updateError.message}`);
    }

    console.log("Participation updated successfully");

    responseData = { 
      success: true, 
      status: newStatus, 
      participation_id: participationId,
      payment_id: paymentId,
      mp_status: payment.status
    };

    await logWebhook(supabaseClient, "mercadopago", req.method, headers, body, queryParams, statusCode, responseData);

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      }
    );
  } catch (error: unknown) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", errorMessage);
    statusCode = 500;
    responseData = { error: errorMessage };
    
    await logWebhook(supabaseClient, "mercadopago", req.method, headers, body, queryParams, statusCode, responseData, errorMessage);
    
    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      }
    );
  }
});
