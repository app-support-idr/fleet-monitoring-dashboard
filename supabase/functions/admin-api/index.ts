import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MonitoringUser {
  id: number;
  user_id: string;
  email: string;
  status: string;
  role: string;
  created_at: string;
  activated_at: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", ""), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: adminRecord, error: adminError } = await adminClient
      .from("monitoring_users")
      .select("status, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !adminRecord) {
      return new Response(
        JSON.stringify({ error: "User not found in monitoring_users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (adminRecord.status !== "ACTIVE" || adminRecord.role !== "ADMIN") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/admin-api", "").replace("/admin-api", "");

    // GET /users — list all monitoring users with email from auth.users
    if (req.method === "GET" && (path === "/users" || path === "")) {
      const { data: users, error: usersError } = await adminClient
        .from("monitoring_users")
        .select("id, user_id, status, role, created_at, activated_at")
        .order("created_at", { ascending: false });

      if (usersError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch emails from auth.users via admin API
      const userIds = (users ?? []).map((u) => u.user_id);
      if (userIds.length === 0) {
        return new Response(
          JSON.stringify([]),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });

      if (authError) {
        // Fallback: return users without emails
        const fallback: MonitoringUser[] = (users ?? []).map((u) => ({
          ...u,
          email: "—",
        }));
        return new Response(
          JSON.stringify(fallback),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const emailMap = new Map<string, string>();
      for (const au of authUsers.users ?? []) {
        emailMap.set(au.id, au.email ?? "—");
      }

      const result: MonitoringUser[] = (users ?? []).map((u) => ({
        ...u,
        email: emailMap.get(u.user_id) ?? "—",
      }));

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT /users/:userId — update status or role
    if (req.method === "PUT") {
      const match = path.match(/^\/users\/(.+)$/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: "Invalid path" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const targetUserId = match[1];
      const body = await req.json();
      const updates: Record<string, string> = {};

      if (body.status && ["PENDING", "ACTIVE", "DISABLED"].includes(body.status)) {
        updates.status = body.status;
        if (body.status === "ACTIVE" && !body.activated_at) {
          updates.activated_at = new Date().toISOString();
        }
      }

      if (body.role && ["ADMIN", "USER"].includes(body.role)) {
        // Prevent self-demotion if it would leave no admins
        if (targetUserId === user.id && body.role === "USER") {
          const { data: otherAdmins } = await adminClient
            .from("monitoring_users")
            .select("id")
            .eq("role", "ADMIN")
            .eq("status", "ACTIVE")
            .neq("user_id", user.id)
            .limit(1);

          if (!otherAdmins || otherAdmins.length === 0) {
            return new Response(
              JSON.stringify({ error: "Cannot demote yourself — you are the only active admin" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        updates.role = body.role;
      }

      if (Object.keys(updates).length === 0) {
        return new Response(
          JSON.stringify({ error: "No valid fields to update" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: updated, error: updateError } = await adminClient
        .from("monitoring_users")
        .update(updates)
        .eq("user_id", targetUserId)
        .select("id, user_id, status, role, created_at, activated_at")
        .maybeSingle();

      if (updateError || !updated) {
        return new Response(
          JSON.stringify({ error: "Failed to update user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get email
      const { data: authUser } = await adminClient.auth.admin.getUserById(targetUserId);
      const result: MonitoringUser = {
        ...updated,
        email: authUser?.user?.email ?? "—",
      };

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
