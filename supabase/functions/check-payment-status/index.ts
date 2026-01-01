import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { participationId } = await req.json();
    console.log("Checking payment status for participation:", participationId);

    // Fetch participation from database
    const { data: participation, error } = await supabaseClient
      .from("participations")
      .select("payment_status, unique_token, mercado_pago_payment_id")
      .eq("id", participationId)
      .single();

    if (error) {
      console.error("Error fetching participation:", error);
      throw new Error("Participation not found");
    }

    console.log("Current payment status:", participation.payment_status);

    // If already paid, return immediately
    if (participation.payment_status === "paid") {
      return new Response(
        JSON.stringify({
          status: participation.payment_status,
          token: participation.unique_token,
          isPaid: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // If pending and has payment_id, check Mercado Pago API directly
    if (participation.payment_status === "pending" && participation.mercado_pago_payment_id) {
      const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      
      if (accessToken) {
        console.log("Checking Mercado Pago API for payment:", participation.mercado_pago_payment_id);
        
        try {
          const mpResponse = await fetch(
            `https://api.mercadopago.com/v1/payments/${participation.mercado_pago_payment_id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (mpResponse.ok) {
            const mpPayment = await mpResponse.json();
            console.log("Mercado Pago payment status:", mpPayment.status);

            // If approved in MP but not in our DB, update it
            if (mpPayment.status === "approved") {
              console.log("Payment approved in MP! Updating database...");
              
              const { data: updatedParticipation, error: updateError } = await supabaseClient
                .from("participations")
                .update({
                  payment_status: "paid",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", participationId)
                .select("unique_token")
                .single();

              if (updateError) {
                console.error("Error updating participation:", updateError);
              } else {
                console.log("Participation updated to paid, token:", updatedParticipation.unique_token);
                
                return new Response(
                  JSON.stringify({
                    status: "paid",
                    token: updatedParticipation.unique_token,
                    isPaid: true,
                  }),
                  {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                  }
                );
              }
            } else if (mpPayment.status === "rejected" || mpPayment.status === "cancelled") {
              console.log("Payment rejected/cancelled in MP, updating database...");
              
              await supabaseClient
                .from("participations")
                .update({
                  payment_status: "failed",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", participationId);
            }
          } else {
            console.log("Failed to fetch from MP API:", mpResponse.status);
          }
        } catch (mpError) {
          console.error("Error checking Mercado Pago API:", mpError);
        }
      }
    }

    // Return current status from database
    return new Response(
      JSON.stringify({
        status: participation.payment_status,
        token: participation.unique_token,
        isPaid: participation.payment_status === "paid",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error checking status:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
