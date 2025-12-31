import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestPaymentRequest {
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

    // Get access token from settings table
    const { data: settings, error: settingsError } = await supabaseClient
      .from("settings")
      .select("key, value")
      .eq("key", "mp_access_token")
      .single();

    if (settingsError || !settings?.value) {
      console.error("Missing access token in settings:", settingsError);
      throw new Error("Access Token do Mercado Pago não configurado. Configure nas Integrações.");
    }

    const accessToken = settings.value;

    const body: TestPaymentRequest = await req.json();
    console.log("Creating test PIX payment:", body);

    // Validate required fields
    if (!body.amount || body.amount < 0.01) {
      throw new Error("Valor mínimo é R$ 0,01");
    }
    if (!body.payerEmail) {
      throw new Error("Email é obrigatório");
    }
    if (!body.payerCpf || body.payerCpf.replace(/\D/g, "").length !== 11) {
      throw new Error("CPF inválido");
    }

    // Generate unique idempotency key
    const idempotencyKey = crypto.randomUUID();

    // Create PIX payment via Mercado Pago API
    const paymentData = {
      transaction_amount: body.amount,
      description: body.description || "Teste de Integração JPG",
      payment_method_id: "pix",
      payer: {
        email: body.payerEmail,
        first_name: body.payerName?.split(" ")[0] || "Teste",
        last_name: body.payerName?.split(" ").slice(1).join(" ") || "Usuario",
        identification: {
          type: "CPF",
          number: body.payerCpf.replace(/\D/g, ""),
        },
      },
      external_reference: `test_${Date.now()}`,
    };

    console.log("Sending test request to Mercado Pago...");

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
      const errorMsg = mpResult.message || mpResult.cause?.[0]?.description || "Erro ao criar pagamento";
      throw new Error(errorMsg);
    }

    // Extract PIX data
    const pixData = mpResult.point_of_interaction?.transaction_data;
    
    if (!pixData) {
      console.error("No PIX data in response:", mpResult);
      throw new Error("Falha ao gerar código PIX");
    }

    console.log("Test PIX payment created successfully, payment ID:", mpResult.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: mpResult.id,
        pixCopyPaste: pixData.qr_code,
        pixQrCodeBase64: pixData.qr_code_base64,
        expirationDate: mpResult.date_of_expiration,
        status: mpResult.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Falha ao criar pagamento de teste";
    console.error("Error creating test payment:", errorMessage);
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
