import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();

    const cleanPhone = phone?.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otp || otp.length !== 6) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP. Must be 6 digits." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullPhone = `+91${cleanPhone}`;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("phone", fullPhone)
      .eq("otp", otp)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Wrong OTP. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await supabaseAdmin
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Check if user exists with this phone - paginate through all users
    let existingUser: any = null;
    let page = 1;
    while (!existingUser) {
      const listUsersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=100`, {
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
        },
      });
      const listUsersData = await listUsersRes.json();
      const users = listUsersData?.users || [];
      if (users.length === 0) break;
      existingUser = users.find((u: any) => u.phone === fullPhone);
      if (!existingUser && users.length < 100) break;
      page++;
    }

    let userId: string;
    const fakeEmail = `${cleanPhone}@phone.ahmedmart.local`;
    const tempPassword = crypto.randomUUID();

    if (existingUser) {
      userId = existingUser.id;

      // Update user with temp password via GoTrue Admin API
      const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: fakeEmail,
          password: tempPassword,
          email_confirm: true,
        }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        console.error("Update user error:", updateData);
        return new Response(
          JSON.stringify({ error: "Failed to prepare session." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Create new user via GoTrue Admin API
      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: fullPhone,
          email: fakeEmail,
          password: tempPassword,
          phone_confirm: true,
          email_confirm: true,
          user_metadata: { full_name: "User" },
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.id) {
        console.error("Create user error:", createData);
        return new Response(
          JSON.stringify({ error: "Failed to create user account." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = createData.id;
    }

    // Sign in with email/password to get session tokens
    const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "apikey": Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: fakeEmail,
        password: tempPassword,
      }),
    });
    const signInData = await signInRes.json();

    if (!signInRes.ok || !signInData.access_token) {
      console.error("Sign in error:", signInData);
      return new Response(
        JSON.stringify({ error: "Failed to create session." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_token: signInData.access_token,
        refresh_token: signInData.refresh_token,
        user: {
          id: signInData.user?.id || userId,
          phone: fullPhone,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
