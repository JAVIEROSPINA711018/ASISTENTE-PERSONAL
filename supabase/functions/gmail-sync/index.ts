import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

async function gmailGet(path: string, token: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error?.message || `Gmail API ${res.status}`);
  return data;
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || "Refresh token failed");
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + Number(data.expires_in || 3600) * 1000 - 120_000).toISOString(),
  };
}

function headerVal(headers: Array<{ name: string; value: string }>, name: string) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function extractEmail(from: string) {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1].trim() : from.trim();
}

function stripHtml(html: string) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBase64Url(data = "") {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(normalized), (c) => c.charCodeAt(0)));
  } catch {
    return "";
  }
}

function findBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data && (payload.mimeType || "").includes("text/plain")) return decodeBase64Url(payload.body.data);
  if (payload.body?.data && (payload.mimeType || "").includes("text/html")) return stripHtml(decodeBase64Url(payload.body.data));
  for (const part of payload.parts || []) {
    const body = findBody(part);
    if (body) return body;
  }
  return "";
}

function labelToTab(labelIds: string[] = []) {
  if (labelIds.includes("CATEGORY_PROMOTIONS")) return "promociones";
  if (labelIds.includes("CATEGORY_SOCIAL"))     return "social";
  if (labelIds.includes("CATEGORY_UPDATES"))    return "actualizaciones";
  return "primario";
}

function messageToEmail(msg: any) {
  const headers = msg.payload?.headers || [];
  const from = headerVal(headers, "From");
  const subject = headerVal(headers, "Subject") || "(Sin asunto)";
  const dateHeader = headerVal(headers, "Date");
  const timestamp = dateHeader ? new Date(dateHeader).getTime() : Number(msg.internalDate || Date.now());
  const body = findBody(msg.payload).slice(0, 1200);
  return {
    id: msg.id,
    gmailId: msg.id,
    threadId: msg.threadId,
    sender: from,
    senderEmail: extractEmail(from),
    subj: subject,
    body,
    time: new Date(timestamp).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }),
    timestamp,
    tab: labelToTab(msg.labelIds || []),
    leido: !(msg.labelIds || []).includes("UNREAD"),
    eliminado: false,
  };
}

async function getConnection(admin: any, userId: string) {
  const { data, error } = await admin
    .from("gmail_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await userFromAuth(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "list";
    const admin = adminClient();

    if (action === "disconnect") {
      await admin.from("gmail_connections").delete().eq("user_id", user.id);
      return json({ ok: true });
    }

    const conn = await getConnection(admin, user.id);
    if (!conn) return json({ connected: false, emails: [], error: "Gmail no está conectado en modo persistente." }, 200);

    if (action === "status") {
      return json({ connected: true, email: conn.email, expiresAt: conn.expires_at });
    }

    let accessToken = conn.access_token;
    if (!accessToken || !conn.expires_at || new Date(conn.expires_at).getTime() < Date.now() + 60_000) {
      const refreshed = await refreshAccessToken(conn.refresh_token);
      accessToken = refreshed.accessToken;
      await admin.from("gmail_connections").update({
        access_token: refreshed.accessToken,
        expires_at: refreshed.expiresAt,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    }

    const maxResults = Math.min(Number(body.maxResults || 30), 50);
    const days = Math.min(Number(body.days || 30), 90);
    const list = await gmailGet(`/users/me/messages?maxResults=${maxResults}&labelIds=INBOX&q=newer_than:${days}d`, accessToken);
    const ids = (list.messages || []).map((m: any) => m.id);
    const messages = await Promise.all(ids.map((id: string) =>
      gmailGet(`/users/me/messages/${id}?format=full`, accessToken).catch(() => null)
    ));
    const emails = messages.filter(Boolean).map(messageToEmail).sort((a, b) => b.timestamp - a.timestamp);
    return json({ connected: true, email: conn.email, emails });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, message === "UNAUTHENTICATED" ? 401 : 400);
  }
});
