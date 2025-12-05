// @ts-nocheck - Deno Edge Function
// Supabase Edge Function: Rollback Failed Registration
// Deletes user from auth.users if profile creation failed during registration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authorization header required"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the JWT token and get user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth verification failed:", authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired token"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    console.log(`Rollback registration request for user: ${userId}`);

    // Safety check 1: User must be recently created (within last 5 minutes)
    const userCreatedAt = new Date(user.created_at);
    const now = new Date();
    const minutesSinceCreation =
      (now.getTime() - userCreatedAt.getTime()) / 1000 / 60;

    if (minutesSinceCreation > 5) {
      console.log(
        `User ${userId} was created ${minutesSinceCreation} minutes ago. Too old to rollback.`
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "User account is too old to rollback. Please contact admin.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Safety check 2: Check if user has profile data
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from("users")
      .select("id, role, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (userDataError) {
      console.error("Error checking user profile:", userDataError);
      // Continue anyway, might be the case where users table insert failed
    }

    // If user has complete profile, don't allow deletion
    if (userData) {
      // Check if user has role-specific data
      let hasRoleData = false;
      const role = userData.role;

      if (role === "mahasiswa") {
        const { data: mahasiswaData } = await supabaseAdmin
          .from("mahasiswa")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        hasRoleData = !!mahasiswaData;
      } else if (role === "dosen") {
        const { data: dosenData } = await supabaseAdmin
          .from("dosen")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        hasRoleData = !!dosenData;
      } else if (role === "laboran") {
        const { data: laboranData } = await supabaseAdmin
          .from("laboran")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        hasRoleData = !!laboranData;
      } else if (role === "admin") {
        const { data: adminData } = await supabaseAdmin
          .from("admin")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        hasRoleData = !!adminData;
      }

      // If user has complete profile (users table + role-specific table), don't delete
      if (hasRoleData) {
        console.log(
          `User ${userId} has complete profile. Cannot rollback registration.`
        );
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "User profile is complete. Cannot rollback. Please contact admin if you need to delete this account.",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // All checks passed, proceed with deletion
    console.log(`Deleting incomplete user registration: ${userId}`);

    // Delete from role-specific tables first (if any)
    await supabaseAdmin.from("mahasiswa").delete().eq("user_id", userId);
    await supabaseAdmin.from("dosen").delete().eq("user_id", userId);
    await supabaseAdmin.from("laboran").delete().eq("user_id", userId);
    await supabaseAdmin.from("admin").delete().eq("user_id", userId);

    // Delete from users table
    await supabaseAdmin.from("users").delete().eq("id", userId);

    // Delete from auth.users (most important)
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("Failed to delete user from auth:", deleteAuthError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to delete auth user: ${deleteAuthError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully rolled back registration for user: ${userId}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Registration rolled back successfully. User deleted.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in rollback-registration function:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
