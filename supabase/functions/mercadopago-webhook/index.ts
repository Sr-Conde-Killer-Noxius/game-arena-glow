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

serve(async (req) => {
  // Initialize Supabase client at the very start
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
      console.log(`[WEBHOOK LOG] ${method} from ${source} - Status: ${statusCode}`);
      const { error } = await supabaseClient.from("webhook_logs").insert({
        source,
        method,
        headers,
        body,
        query_params: queryParams,
        status_code: statusCode,
        response,
        error_message: errorMessage,
      });
      if (error) {
        console.error("Failed to save webhook log:", error);
      } else {
        console.log("Webhook log saved successfully");
      }
    } catch (e) {
      console.error("Exception saving webhook log:", e);
    }
  };

  console.log("=== WEBHOOK REQUEST RECEIVED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(reqHeaders));

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    await logWebhook("mercadopago", "OPTIONS", reqHeaders, null, 200, { message: "CORS preflight" });
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  let body: unknown = null;
  let statusCode = 200;
  let responseData: unknown = { received: true };
  let errorMessage: string | undefined;

  try {
    // Read raw body first
    const rawBody = await req.text();
    console.log("Raw body length:", rawBody.length);
    console.log("Raw body:", rawBody.substring(0, 500));

    // Handle empty body
    if (!rawBody || rawBody.trim() === "") {
      console.log("Empty body received");
      statusCode = 200;
      responseData = { received: true, message: "Empty body acknowledged" };
      await logWebhook("mercadopago", req.method, reqHeaders, { raw: "EMPTY" }, statusCode, responseData);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    // Try to parse JSON
    try {
      body = JSON.parse(rawBody);
      console.log("Parsed body:", JSON.stringify(body));
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      statusCode = 200; // Still return 200 to acknowledge
      responseData = { received: true, error: "Invalid JSON", raw_preview: rawBody.substring(0, 200) };
      await logWebhook("mercadopago", req.method, reqHeaders, { raw: rawBody }, statusCode, responseData, "Invalid JSON body");
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    const webhookBody = body as Record<string, unknown>;
    
    // Log all webhook notifications
    console.log("Webhook type:", webhookBody.type);
    console.log("Webhook action:", webhookBody.action);

    // Check if this is a payment notification
    if (webhookBody.type !== "payment" && webhookBody.action !== "payment.updated" && webhookBody.action !== "payment.created") {
      console.log("Non-payment notification, acknowledging");
      responseData = { received: true, ignored: true, reason: "non-payment notification", type: webhookBody.type, action: webhookBody.action };
      await logWebhook("mercadopago", req.method, reqHeaders, body, statusCode, responseData);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    // Get payment ID
    const data = webhookBody.data as Record<string, unknown> | undefined;
    const paymentId = data?.id;
    
    if (!paymentId) {
      console.log("No payment ID found");
      statusCode = 200;
      responseData = { received: true, error: "No payment ID in body" };
      await logWebhook("mercadopago", req.method, reqHeaders, body, statusCode, responseData, "No payment ID");
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    console.log("Processing payment ID:", paymentId);

    // Get access token
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("Missing MERCADOPAGO_ACCESS_TOKEN");
      statusCode = 500;
      responseData = { error: "Payment service not configured" };
      await logWebhook("mercadopago", req.method, reqHeaders, body, statusCode, responseData, "Missing access token");
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    // Fetch payment from Mercado Pago
    console.log("Fetching payment details from MP...");
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!mpResponse.ok) {
      const mpError = await mpResponse.text();
      console.error("MP API error:", mpError);
      statusCode = 200;
      responseData = { received: true, mp_error: mpError, payment_id: paymentId };
      await logWebhook("mercadopago", req.method, reqHeaders, body, statusCode, responseData, `MP API error: ${mpError}`);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    const payment = await mpResponse.json();
    console.log("Payment status from MP:", payment.status);
    console.log("External reference:", payment.external_reference);

    const participationId = payment.external_reference;
    
    if (!participationId) {
      console.log("No external reference in payment");
      statusCode = 200;
      responseData = { received: true, warning: "No external reference", payment_id: paymentId, mp_status: payment.status };
      await logWebhook("mercadopago", req.method, reqHeaders, body, statusCode, responseData, "No external reference");
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      });
    }

    // Map status
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

    console.log("Updating participation to status:", newStatus);

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
      statusCode = 200;
      responseData = { received: true, update_error: updateError.message, participation_id: participationId };
      await logWebhook("mercadopago", req.method, reqHeaders, body, statusCode, responseData, updateError.message);
    } else {
      console.log("Participation updated successfully!");
      responseData = { 
        success: true, 
        status: newStatus, 
        participation_id: participationId,
        payment_id: paymentId,
        mp_status: payment.status
      };
      await logWebhook("mercadopago", req.method, reqHeaders, body, statusCode, responseData);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });

  } catch (error: unknown) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook exception:", errorMessage);
    statusCode = 500;
    responseData = { error: errorMessage };
    
    await logWebhook("mercadopago", req.method, reqHeaders, body, statusCode, responseData, errorMessage);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
