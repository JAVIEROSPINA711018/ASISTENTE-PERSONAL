// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────────────────────
// Capa de sincronización entre React state y Supabase.
// Las vistas NO importan de este archivo — solo App.jsx lo usa.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

// ── Cliente ──────────────────────────────────────────────────────────────────
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Carga inicial (todo en paralelo) ─────────────────────────────────────────
export async function loadAllUserData(userId) {
  const [
    { data: items,     error: e1 },
    { data: contactos, error: e2 },
    { data: eventos,   error: e3 },
    { data: messages,  error: e4 },
    { data: settingsArr, error: e5 },
  ] = await Promise.all([
    supabase.from("items").select("*").eq("user_id", userId).order("creado", { ascending: false }),
    supabase.from("contactos").select("*").eq("user_id", userId).order("nombre"),
    supabase.from("eventos").select("*").eq("user_id", userId).order("fecha"),
    supabase.from("messages").select("*").eq("user_id", userId).order("created_at").limit(100),
    supabase.from("settings").select("*").eq("user_id", userId).single(),
  ]);

  if (e1) console.error("[supabase] loadItems:", e1.message);
  if (e2) console.error("[supabase] loadContactos:", e2.message);
  if (e3) console.error("[supabase] loadEventos:", e3.message);
  if (e4) console.error("[supabase] loadMessages:", e4.message);
  if (e5 && e5.code !== "PGRST116") console.error("[supabase] loadSettings:", e5.message);

  return {
    items:     items     || [],
    contactos: contactos || [],
    eventos:   eventos   || [],
    messages:  messages  || [],
    settings:  settingsArr || null,
  };
}

// ── Items ─────────────────────────────────────────────────────────────────────
export async function syncItems(items, userId) {
  if (!items.length) return;
  const rows = items.map(item => ({ ...item, user_id: userId }));
  const { error } = await supabase.from("items").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteItem(id, userId) {
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Contactos ─────────────────────────────────────────────────────────────────
export async function syncContactos(contactos, userId) {
  if (!contactos.length) return;
  const rows = contactos.map(c => ({ ...c, user_id: userId }));
  const { error } = await supabase.from("contactos").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteContacto(id, userId) {
  const { error } = await supabase
    .from("contactos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Eventos ───────────────────────────────────────────────────────────────────
export async function syncEventos(eventos, userId) {
  if (!eventos.length) return;
  const rows = eventos.map(e => ({ ...e, user_id: userId }));
  const { error } = await supabase.from("eventos").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteEvento(id, userId) {
  const { error } = await supabase
    .from("eventos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function loadSettings(userId) {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  // PGRST116 = no row found, expected the first time
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

export async function upsertSettings(patch, userId) {
  const { error } = await supabase
    .from("settings")
    .upsert({ ...patch, user_id: userId }, { onConflict: "user_id" });
  if (error) throw error;
}

// ── Messages ──────────────────────────────────────────────────────────────────
export async function appendMessage({ role, content }, userId) {
  const { error } = await supabase.from("messages").insert({
    user_id: userId,
    role,
    content,
  });
  if (error) throw error;
}

export async function bulkInsertMessages(messages, userId) {
  if (!messages.length) return;
  const rows = messages.map(m => ({
    user_id: userId,
    role: m.role,
    content: m.content,
    created_at: m.time || new Date().toISOString(),
  }));
  const { error } = await supabase.from("messages").insert(rows);
  if (error) throw error;
}

// ── Migración automática de localStorage → Supabase ──────────────────────────
// Corre una sola vez por usuario, identificada por la clave cerebro_migrated_<userId>
export async function migrateLocalStorageToSupabase(userId) {
  const migKey = `cerebro_migrated_${userId}`;
  if (localStorage.getItem(migKey)) return; // ya migró

  let items     = [];
  let contactos = [];
  let eventos   = [];
  let messages  = [];
  let settings  = {};

  try { items     = JSON.parse(localStorage.getItem("cerebro_items")     || "[]"); } catch {}
  try { contactos = JSON.parse(localStorage.getItem("cerebro_contactos") || "[]"); } catch {}
  try { eventos   = JSON.parse(localStorage.getItem("cerebro_eventos")   || "[]"); } catch {}
  try { messages  = JSON.parse(localStorage.getItem("cerebro_messages")  || "[]"); } catch {}

  settings = {
    dark_mode:    localStorage.getItem("cerebro_dark")        === "true",
    mood:         localStorage.getItem("cerebro_mood")         || null,
    diario:       localStorage.getItem("cerebro_diario")       || null,
    habits:       (() => { try { return JSON.parse(localStorage.getItem("cerebro_habits") || "null"); } catch { return null; } })(),
    personality:  localStorage.getItem("cerebro_personality")  || "profesional",
    google_email: localStorage.getItem("cerebro_google_email") || null,
    gemini_api_key: null, // nunca migrar la API key desde localStorage por seguridad
  };

  await Promise.all([
    items.length     ? syncItems(items, userId)               : null,
    contactos.length ? syncContactos(contactos, userId)       : null,
    eventos.length   ? syncEventos(eventos, userId)           : null,
    messages.length  ? bulkInsertMessages(messages, userId)   : null,
    upsertSettings(settings, userId),
  ].filter(Boolean));

  localStorage.setItem(migKey, "1");
  console.info("[supabase] Migración completada para userId:", userId);
}

// ── Cola offline ──────────────────────────────────────────────────────────────
// Se usa cuando Supabase no está disponible (sin conexión)
function enqueueOperation(table, operation, payload) {
  try {
    const queue = JSON.parse(localStorage.getItem("cerebro_sync_queue") || "[]");
    queue.push({ table, operation, payload, timestamp: Date.now() });
    localStorage.setItem("cerebro_sync_queue", JSON.stringify(queue));
  } catch (err) {
    console.error("[supabase] Error enqueueing:", err);
  }
}

export function enqueueItems(items, userId) {
  enqueueOperation("items", "upsert", { items, userId });
}

export function enqueueContactos(contactos, userId) {
  enqueueOperation("contactos", "upsert", { contactos, userId });
}

// Procesar cola pendiente al recuperar conexión
export async function flushSyncQueue(userId) {
  const raw = localStorage.getItem("cerebro_sync_queue");
  if (!raw) return;
  let queue;
  try { queue = JSON.parse(raw); } catch { return; }
  if (!queue.length) return;

  const remaining = [];
  for (const op of queue) {
    try {
      if (op.table === "items"     && op.operation === "upsert") await syncItems(op.payload.items, userId);
      if (op.table === "contactos" && op.operation === "upsert") await syncContactos(op.payload.contactos, userId);
    } catch {
      remaining.push(op); // reencolar si sigue fallando
    }
  }

  if (remaining.length) {
    localStorage.setItem("cerebro_sync_queue", JSON.stringify(remaining));
  } else {
    localStorage.removeItem("cerebro_sync_queue");
  }
}

// ── Realtime subscriptions ────────────────────────────────────────────────────
// handlers: { onItemsChange(items), onContactosChange(contactos) }
export function subscribeUserData(userId, handlers) {
  const channel = supabase
    .channel(`user-data-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "items", filter: `user_id=eq.${userId}` },
      async () => {
        // Al recibir cualquier cambio en items, recargar la lista completa
        const { data } = await supabase
          .from("items")
          .select("*")
          .eq("user_id", userId)
          .order("creado", { ascending: false });
        if (data && handlers.onItemsChange) handlers.onItemsChange(data);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contactos", filter: `user_id=eq.${userId}` },
      async () => {
        const { data } = await supabase
          .from("contactos")
          .select("*")
          .eq("user_id", userId)
          .order("nombre");
        if (data && handlers.onContactosChange) handlers.onContactosChange(data);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeUserData(channel) {
  if (channel) supabase.removeChannel(channel);
}
