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

// Hardcoded Nimbus JSON POST API endpoint (not dependent on NIMBUS_API_BASE_URL)
const NIMBUS_SMS_URL = "http://nimbusit.biz/Api/smsapi/SendSms";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, role } = await req.json();

    const cleanPhone = phone?.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number. Enter 10 digits." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullPhone = `+91${cleanPhone}`;

    // Validate all required secrets
    const userId = Deno.env.get("NIMBUS_USER_ID");
    const password = Deno.env.get("NIMBUS_PASSWORD");
    const senderId = Deno.env.get("NIMBUS_SENDER_ID");
    const entityId = Deno.env.get("NIMBUS_ENTITY_ID");
    const templateId = Deno.env.get("NIMBUS_TEMPLATE_ID");

    if (!userId || !password || !senderId || !entityId || !templateId) {
      console.error("Missing Nimbus SMS secrets");
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

    // Build SMS message - MUST match DLT-registered template exactly
    const message = `Your OTP For Ahmad Mart Account is ${otp} Do not share this OTP with anyone for security reasons. AHMAD ENTERPRISES`;

    // Use Nimbus JSON POST API
    const smsPayload = {
      UserId: userId,
      Password: password,
      SenderID: senderId,
      Phno: cleanPhone,
      Msg: message,
      EntityID: entityId,
      TemplateID: templateId,
    };

    console.log("Sending SMS via JSON POST to:", maskPhone(fullPhone));

    let smsResponse: Response;
    let smsResult: { Status?: string; Response?: { Message?: string } };

    try {
      smsResponse = await fetch(NIMBUS_SMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smsPayload),
      });

      smsResult = await smsResponse.json();
    } catch (fetchErr) {
      console.error("SMS fetch error:", fetchErr);
      await supabaseAdmin.from("otp_codes").delete().eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: "SMS service unreachable. Please try again later." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SMS API response:", JSON.stringify(smsResult));

    // Check structured response: only "OK" means accepted
    if (smsResult.Status !== "OK") {
      const providerMsg = smsResult.Response?.Message || "Unknown provider error";
      console.error("SMS provider rejected:", providerMsg);
      await supabaseAdmin.from("otp_codes").delete().eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: `Failed to send SMS: ${providerMsg}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SMS accepted by provider for:", maskPhone(fullPhone), "MsgID:", smsResult.Response?.Message);

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
