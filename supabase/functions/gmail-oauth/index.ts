import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SCOPES = "https://www.googleapis.com/auth/gmail.modify";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function functionUrl(name: string) {
  return `${env("SUPABASE_URL").replace(/\/$/, "")}/functions/v1/${name}`;
}

function adminClient() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
}

async function userFromAuth(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("UNAUTHENTICATED");
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "start";

  try {
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state) throw new Error("Missing OAuth callback data");

      const admin = adminClient();
      const { data: stateRow, error: stateError } = await admin
        .from("gmail_oauth_states")
        .select("*")
        .eq("state", state)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (stateError || !stateRow) throw new Error("OAuth state expired or invalid");

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: env("GOOGLE_CLIENT_ID"),
          client_secret: env("GOOGLE_CLIENT_SECRET"),
          redirect_uri: functionUrl("gmail-oauth") + "?action=callback",
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error_description || tokenData.error || "Token exchange failed");
      if (!tokenData.refresh_token) throw new Error("Google did not return a refresh token. Revoke access and connect again with consent.");

      const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await profileRes.json();
      if (!profileRes.ok) throw new Error(profile.error?.message || "Could not read Gmail profile");

      const expiresAt = new Date(Date.now() + Number(tokenData.expires_in || 3600) * 1000 - 120_000).toISOString();
      await admin.from("gmail_connections").upsert({
        user_id: stateRow.user_id,
        email: profile.emailAddress,
        refresh_token: tokenData.refresh_token,
        access_token: tokenData.access_token,
        expires_at: expiresAt,
        scope: tokenData.scope || SCOPES,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      await admin.from("gmail_oauth_states").delete().eq("state", state);

      const origin = stateRow.app_origin || "http://localhost:5173";
      const redirectUrl = `${origin.replace(/\/$/, "")}/?oauth_callback=gmail&email=${encodeURIComponent(profile.emailAddress)}`;
      return new Response(null, {
        status: 302,
        headers: {
          "Location": redirectUrl,
        }
      });
    }

    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const user = await userFromAuth(req);
    const body = await req.json().catch(() => ({}));
    const appOrigin = body.appOrigin || req.headers.get("Origin") || "http://127.0.0.1:5173";
    const state = crypto.randomUUID();

    const admin = adminClient();
    await admin.from("gmail_oauth_states").insert({
      state,
      user_id: user.id,
      app_origin: appOrigin,
    });

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", env("GOOGLE_CLIENT_ID"));
    authUrl.searchParams.set("redirect_uri", functionUrl("gmail-oauth") + "?action=callback");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("include_granted_scopes", "true");
    authUrl.searchParams.set("state", state);

    return json({ authUrl: authUrl.toString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (action === "callback") {
      let fallbackOrigin = "http://localhost:5173";
      try {
        const stateVal = url.searchParams.get("state");
        if (stateVal) {
          const { data } = await adminClient()
            .from("gmail_oauth_states")
            .select("app_origin")
            .eq("state", stateVal)
            .maybeSingle();
          if (data?.app_origin) fallbackOrigin = data.app_origin;
        }
      } catch {}
      const errorUrl = `${fallbackOrigin.replace(/\/$/, "")}/?oauth_callback=gmail&error=${encodeURIComponent(message)}`;
      return new Response(null, {
        status: 302,
        headers: { "Location": errorUrl }
      });
    }
    return json({ error: message }, message === "UNAUTHENTICATED" ? 401 : 400);
  }
});
