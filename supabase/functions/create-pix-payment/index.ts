import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  participationId: string;
  amount: number;
  description: string;
  payerEmail: string;
  payerName: string;
  payerCpf: string;
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

    const body: PaymentRequest = await req.json();
    console.log("Creating PIX payment for participation:", body.participationId);

    // Generate unique idempotency key
    const idempotencyKey = crypto.randomUUID();

    // Create PIX payment via Mercado Pago API
    const paymentData = {
      transaction_amount: body.amount,
      description: body.description,
      payment_method_id: "pix",
      payer: {
        email: body.payerEmail,
        first_name: body.payerName.split(" ")[0],
        last_name: body.payerName.split(" ").slice(1).join(" ") || "User",
        identification: {
          type: "CPF",
          number: body.payerCpf.replace(/\D/g, ""),
        },
      },
      external_reference: body.participationId,
    };

    console.log("Sending request to Mercado Pago...");

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    const mpResult = await mpResponse.json();
    console.log("Mercado Pago response status:", mpResponse.status);

    if (!mpResponse.ok) {
      console.error("Mercado Pago error:", mpResult);
      throw new Error(mpResult.message || "Failed to create payment");
    }

    // Extract PIX data
    const pixData = mpResult.point_of_interaction?.transaction_data;
    
    if (!pixData) {
      console.error("No PIX data in response:", mpResult);
      throw new Error("Failed to generate PIX code");
    }

    // Update participation with payment ID
    const { error: updateError } = await supabaseClient
      .from("participations")
      .update({
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.participationId);

    if (updateError) {
      console.error("Error updating participation:", updateError);
    }

    console.log("PIX payment created successfully, payment ID:", mpResult.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: mpResult.id,
        pixCopyPaste: pixData.qr_code,
        pixQrCodeBase64: pixData.qr_code_base64,
        expirationDate: mpResult.date_of_expiration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create payment";
    console.error("Error creating payment:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
