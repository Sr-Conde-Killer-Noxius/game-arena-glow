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

    const { data, error } = await supabaseClient
      .from("participations")
      .select("payment_status, unique_token")
      .eq("id", participationId)
      .single();

    if (error) {
      console.error("Error fetching participation:", error);
      throw new Error("Participation not found");
    }

    console.log("Payment status:", data.payment_status);

    return new Response(
      JSON.stringify({
        status: data.payment_status,
        token: data.unique_token,
        isPaid: data.payment_status === "paid",
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
