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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("Missing MERCADOPAGO_ACCESS_TOKEN");
      throw new Error("Payment service not configured");
    }

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // Mercado Pago sends different notification types
    if (body.type !== "payment" && body.action !== "payment.updated") {
      console.log("Ignoring non-payment notification:", body.type || body.action);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get payment ID from webhook
    const paymentId = body.data?.id;
    if (!paymentId) {
      console.error("No payment ID in webhook body");
      return new Response(JSON.stringify({ error: "No payment ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
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
      console.error("Failed to fetch payment from MP:", await mpResponse.text());
      throw new Error("Failed to fetch payment details");
    }

    const payment = await mpResponse.json();
    console.log("Payment status:", payment.status);
    console.log("External reference (participation ID):", payment.external_reference);

    const participationId = payment.external_reference;
    if (!participationId) {
      console.error("No external reference in payment");
      return new Response(JSON.stringify({ error: "No participation ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
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
      throw new Error("Failed to update participation");
    }

    console.log("Participation updated successfully");

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
