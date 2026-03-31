import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    const cleanPhone = phone?.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number. Enter 10 digits." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullPhone = `+91${cleanPhone}`;

    // Validate all required secrets
    const apiBaseUrl = Deno.env.get("NIMBUS_API_BASE_URL");
    const userId = Deno.env.get("NIMBUS_USER_ID");
    const password = Deno.env.get("NIMBUS_PASSWORD");
    const senderId = Deno.env.get("NIMBUS_SENDER_ID");
    const entityId = Deno.env.get("NIMBUS_ENTITY_ID");
    const templateId = Deno.env.get("NIMBUS_TEMPLATE_ID");

    if (!apiBaseUrl || !userId || !password || !senderId || !entityId || !templateId) {
      console.error("Missing Nimbus SMS secrets. Check NIMBUS_API_BASE_URL, NIMBUS_USER_ID, NIMBUS_PASSWORD, NIMBUS_SENDER_ID, NIMBUS_ENTITY_ID, NIMBUS_TEMPLATE_ID");
      return new Response(
        JSON.stringify({ error: "SMS service not configured. Contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Store OTP and capture the row id
    const { data: otpRecord, error: insertError } = await supabaseAdmin
      .from("otp_codes")
      .insert({
        phone: fullPhone,
        otp,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !otpRecord) {
      console.error("OTP insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build SMS message - must match DLT-registered template exactly
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
    console.log("Sending SMS to:", maskPhone(fullPhone));

    let smsResponse: Response;
    let smsResult: string;

    try {
      smsResponse = await fetch(smsUrl);
      smsResult = await smsResponse.text();
    } catch (fetchErr) {
      console.error("SMS fetch error:", fetchErr);
      // Cleanup the OTP since SMS was not sent
      await supabaseAdmin.from("otp_codes").delete().eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: "SMS service unreachable. Please try again later." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SMS API status:", smsResponse.status, "response:", smsResult);

    // Strict validation: treat non-2xx or known error indicators as failure
    const isHttpOk = smsResponse.ok;
    const lowerResult = smsResult.toLowerCase();
    const hasErrorIndicator =
      lowerResult.includes("error") ||
      lowerResult.includes("fail") ||
      lowerResult.includes("invalid") ||
      lowerResult.includes("rejected") ||
      lowerResult.includes("blocked") ||
      lowerResult.includes("insufficient");

    if (!isHttpOk || hasErrorIndicator) {
      console.error("SMS provider rejected. Status:", smsResponse.status, "Body:", smsResult);
      // Cleanup unusable OTP
      const { error: delErr } = await supabaseAdmin.from("otp_codes").delete().eq("id", otpRecord.id);
      console.log("OTP cleanup after SMS failure:", delErr ? `failed: ${delErr.message}` : "success");

      return new Response(
        JSON.stringify({ error: "Failed to send SMS. Please try again or contact support." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SMS sent successfully to:", maskPhone(fullPhone));

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
