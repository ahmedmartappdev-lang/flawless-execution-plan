import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();

    const cleanPhone = phone?.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return jsonResponse({ error: "Invalid phone number." }, 400);
    }
    if (!otp || otp.length !== 6) {
      return jsonResponse({ error: "Invalid OTP. Must be 6 digits." }, 400);
    }

    const fullPhone = `+91${cleanPhone}`;
    const fakeEmail = `${cleanPhone}@phone.ahmedmart.local`;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Validate OTP (do NOT mark as verified yet)
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
      return jsonResponse({ error: "Wrong OTP. Please try again." }, 400);
    }

    // 2. Resolve existing user via profiles table (fast, no pagination)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("phone", fullPhone)
      .limit(1)
      .maybeSingle();

    let userId: string;
    const tempPassword = crypto.randomUUID();

    if (profile?.user_id) {
      // Existing user found — update with temp password for sign-in
      userId = profile.user_id;
      const updateRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: fakeEmail,
            password: tempPassword,
            email_confirm: true,
          }),
        }
      );
      if (!updateRes.ok) {
        const err = await updateRes.json();
        console.error("Update existing user error:", err);
        return jsonResponse({ error: "Verification failed. Please try again." }, 500);
      }
    } else {
      // No profile found — create new auth user
      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
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
        const errCode = createData?.error_code || "";
        if (errCode === "phone_exists" || errCode === "email_exists") {
          // Conflict: the user exists but profile lookup missed them.
          // The handle_new_user trigger should have created a profile — re-query.
          console.warn("Create conflict, recovering via profiles:", errCode);

          // Small delay to let any pending trigger finish
          await new Promise((r) => setTimeout(r, 500));

          const { data: retryProfile } = await supabaseAdmin
            .from("profiles")
            .select("user_id")
            .eq("phone", fullPhone)
            .limit(1)
            .maybeSingle();

          if (retryProfile?.user_id) {
            userId = retryProfile.user_id;
            const retryRes = await fetch(
              `${supabaseUrl}/auth/v1/admin/users/${userId}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${serviceRoleKey}`,
                  apikey: serviceRoleKey,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: fakeEmail,
                  password: tempPassword,
                  email_confirm: true,
                }),
              }
            );
            if (!retryRes.ok) {
              const retryErr = await retryRes.json();
              console.error("Recovery update error:", retryErr);
              return jsonResponse({ error: "Verification failed. Please try again." }, 500);
            }
          } else {
            console.error("Recovery profile lookup failed after conflict");
            return jsonResponse({ error: "Verification failed. Please try again." }, 500);
          }
        } else {
          console.error("Create user error:", createData);
          return jsonResponse({ error: "Verification failed. Please try again." }, 500);
        }
      } else {
        userId = createData.id;
      }
    }

    // 3. Sign in to get session tokens
    const signInRes = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: fakeEmail, password: tempPassword }),
      }
    );
    const signInData = await signInRes.json();

    if (!signInRes.ok || !signInData.access_token) {
      console.error("Sign in error:", signInData);
      return jsonResponse({ error: "Verification failed. Please try again." }, 500);
    }

    // 4. Mark OTP as verified ONLY after successful session
    await supabaseAdmin
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    return jsonResponse({
      success: true,
      access_token: signInData.access_token,
      refresh_token: signInData.refresh_token,
      user: {
        id: signInData.user?.id || userId!,
        phone: fullPhone,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return jsonResponse({ error: "Verification failed. Please try again." }, 500);
  }
});
