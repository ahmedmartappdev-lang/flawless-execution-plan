import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    // Validate phone format: must be 10-digit Indian number
    const cleanPhone = phone?.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number. Enter 10 digits." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullPhone = `+91${cleanPhone}`;

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limiting: max 3 OTPs per phone in last 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("phone", fullPhone)
      .gte("created_at", tenMinAgo);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please wait before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP in database
    const { error: insertError } = await supabaseAdmin.from("otp_codes").insert({
      phone: fullPhone,
      otp,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    if (insertError) {
      console.error("OTP insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send SMS via Nimbus IT Solutions API
    const apiBaseUrl = Deno.env.get("NIMBUS_API_BASE_URL")!;
    const userId = Deno.env.get("NIMBUS_USER_ID")!;
    const password = Deno.env.get("NIMBUS_PASSWORD")!;
    const senderId = Deno.env.get("NIMBUS_SENDER_ID")!;
    const entityId = Deno.env.get("NIMBUS_ENTITY_ID")!;
    const templateId = Deno.env.get("NIMBUS_TEMPLATE_ID")!;

    // Build OTP message - adjust to match your DLT-registered template
    const message = `Your OTP for login is ${otp}. Valid for 5 minutes.`;

    const params = new URLSearchParams({
      UserID: userId,
      Password: password,
      SenderID: senderId,
      Phno: cleanPhone,
      Msg: message,
      EntityID: entityId,
      TemplateID: templateId,
    });

    const smsUrl = `${apiBaseUrl}?${params.toString()}`;
    console.log("Sending SMS to:", cleanPhone);

    const smsResponse = await fetch(smsUrl);
    const smsResult = await smsResponse.text();
    console.log("SMS API response:", smsResult);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
