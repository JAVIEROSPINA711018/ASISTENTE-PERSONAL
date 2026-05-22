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
  if (!userId) throw new Error("[supabase] userId is required");
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
    supabase.from("settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (e1) console.error("[supabase] loadItems:", e1.message);
  if (e2) console.error("[supabase] loadContactos:", e2.message);
  if (e3) console.error("[supabase] loadEventos:", e3.message);
  if (e4) console.error("[supabase] loadMessages:", e4.message);
  if (e5) console.error("[supabase] loadSettings:", e5.message);

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
  if (!userId) throw new Error("[supabase] userId is required");
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
  if (!userId) throw new Error("[supabase] userId is required");
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
  if (!userId) throw new Error("[supabase] userId is required");
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
  if (!userId) throw new Error("[supabase] userId is required");
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function upsertSettings(patch, userId) {
  if (!userId) throw new Error("[supabase] userId is required");
  const { error } = await supabase
    .from("settings")
    .upsert({ ...patch, user_id: userId }, { onConflict: "user_id" });
  if (error) {
    // Si es un error de columna no existente (código 42703 en Postgres) o contiene la palabra "column", reintentamos solo con columnas base
    if (error.code === "42703" || error.message?.includes("column") || error.message?.includes("does not exist")) {
      console.warn("[supabase] Columnas de IA ausentes en la tabla settings. Guardando solo campos base en Supabase.");
      const basePatch = {};
      const baseKeys = ["dark_mode", "mood", "diario", "habits", "personality", "google_email"];
      baseKeys.forEach(k => {
        if (patch[k] !== undefined) basePatch[k] = patch[k];
      });
      if (Object.keys(basePatch).length > 0) {
        const { error: baseError } = await supabase
          .from("settings")
          .upsert({ ...basePatch, user_id: userId }, { onConflict: "user_id" });
        if (baseError) throw baseError;
      }
      return;
    }
    throw error;
  }
}

// ── Messages ──────────────────────────────────────────────────────────────────
export async function appendMessage({ role, content }, userId) {
  if (!userId) throw new Error("[supabase] userId is required");
  const { error } = await supabase.from("messages").insert({
    user_id: userId,
    role,
    content,
  });
  if (error) throw error;
}

export async function bulkInsertMessages(messages, userId) {
  if (!userId) throw new Error("[supabase] userId is required");
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

  try {
    // 1. Verificar si el usuario ya tiene registros de configuración en Supabase
    // Si ya existe una fila, significa que ya está inicializado en la nube y no debemos sobreescribir.
    const { data: existingSettings, error: errSettings } = await supabase
      .from("settings")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (errSettings) {
      console.warn("[supabase] Error al verificar settings existentes:", errSettings.message);
    }

    if (existingSettings) {
      localStorage.setItem(migKey, "1");
      console.info("[supabase] El usuario ya tiene configuración en Supabase. Saltando migración local para proteger los datos en la nube.");
      return;
    }

    // 2. Verificar si hay datos locales reales para migrar
    const localItems = localStorage.getItem("cerebro_items");
    const localContactos = localStorage.getItem("cerebro_contactos");
    const localEventos = localStorage.getItem("cerebro_eventos");
    const localMessages = localStorage.getItem("cerebro_messages");
    const localDark = localStorage.getItem("cerebro_dark");
    const localMood = localStorage.getItem("cerebro_mood");
    const localDiario = localStorage.getItem("cerebro_diario");
    const localHabits = localStorage.getItem("cerebro_habits");
    const localPersonality = localStorage.getItem("cerebro_personality");
    const localGoogleEmail = localStorage.getItem("cerebro_google_email");
    const localGeminiKey = localStorage.getItem("gemini_api_key");
    const localOpenaiKey = localStorage.getItem("ai_openai_key");
    const localClaudeKey = localStorage.getItem("ai_claude_key");
    const localAiProvider = localStorage.getItem("ai_provider");
    const localAiBaseUrl = localStorage.getItem("ai_base_url");
    const localGeminiModel = localStorage.getItem("ai_gemini_model");
    const localOpenaiModel = localStorage.getItem("ai_openai_model");
    const localClaudeModel = localStorage.getItem("ai_claude_model");

    const hasAnyData = localItems || localContactos || localEventos || localMessages ||
                       localDark || localMood || localDiario || localHabits ||
                       localPersonality || localGoogleEmail || localGeminiKey ||
                       localOpenaiKey || localClaudeKey || localAiProvider ||
                       localAiBaseUrl || localGeminiModel || localOpenaiModel ||
                       localClaudeModel;

    if (!hasAnyData) {
      localStorage.setItem(migKey, "1");
      console.info("[supabase] No hay datos locales para migrar. Saltando de forma segura.");
      return;
    }

    // 3. Proceder con la migración de datos locales
    let items     = [];
    let contactos = [];
    let eventos   = [];
    let messages  = [];
    let settings  = {};

    try { if (localItems) items = JSON.parse(localItems); } catch {}
    try { if (localContactos) contactos = JSON.parse(localContactos); } catch {}
    try { if (localEventos) eventos = JSON.parse(localEventos); } catch {}
    try { if (localMessages) messages = JSON.parse(localMessages); } catch {}

    // Construir los settings dinámicamente con lo que exista en localStorage
    if (localDark !== null && localDark !== undefined) {
      settings.dark_mode = localDark === "true";
    }
    if (localMood) settings.mood = localMood;
    if (localDiario) settings.diario = localDiario;
    if (localHabits) {
      try { settings.habits = JSON.parse(localHabits); } catch {}
    }
    if (localPersonality) settings.personality = localPersonality;
    if (localGoogleEmail) settings.google_email = localGoogleEmail;
    
    // Migrar llaves de API si existen en localStorage
    if (localGeminiKey) settings.gemini_api_key = localGeminiKey;
    if (localOpenaiKey) settings.ai_openai_key = localOpenaiKey;
    if (localClaudeKey) settings.ai_claude_key = localClaudeKey;

    // Migrar configuraciones adicionales de IA
    if (localAiProvider) settings.ai_provider = localAiProvider;
    if (localAiBaseUrl) settings.ai_base_url = localAiBaseUrl;
    if (localGeminiModel) settings.ai_gemini_model = localGeminiModel;
    if (localOpenaiModel) settings.ai_openai_model = localOpenaiModel;
    if (localClaudeModel) settings.ai_claude_model = localClaudeModel;

    await Promise.all([
      items.length     ? syncItems(items, userId)               : null,
      contactos.length ? syncContactos(contactos, userId)       : null,
      eventos.length   ? syncEventos(eventos, userId)           : null,
      upsertSettings(settings, userId).catch(err => {
        console.error("[supabase] Error migrando settings locales (posiblemente por columnas ausentes):", err.message);
      }),
    ].filter(Boolean));

    // Messages use INSERT (not upsert) — migrate separately with deduplication guard
    if (messages.length) {
      const msgKey = `cerebro_messages_migrated_${userId}`;
      if (!localStorage.getItem(msgKey)) {
        await bulkInsertMessages(messages, userId);
        localStorage.setItem(msgKey, "1");
      }
    }

    localStorage.setItem(migKey, "1");
    console.info("[supabase] Migración completada para userId:", userId);
  } catch (err) {
    console.error("[supabase] Migración parcialmente fallida, se reintentará:", err.message);
    // Do NOT set migKey — will retry on next login
  }
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
let _flushing = false;

export async function flushSyncQueue(userId) {
  if (_flushing) return;
  _flushing = true;
  const raw = localStorage.getItem("cerebro_sync_queue");
  if (!raw) { _flushing = false; return; }
  let queue;
  try { queue = JSON.parse(raw); } catch { _flushing = false; return; }
  if (!queue.length) { _flushing = false; return; }

  const remaining = [];
  try {
    for (const op of queue) {
      try {
        if (op.table === "items"     && op.operation === "upsert") await syncItems(op.payload.items, op.payload.userId || userId);
        if (op.table === "contactos" && op.operation === "upsert") await syncContactos(op.payload.contactos, op.payload.userId || userId);
      } catch {
        remaining.push(op);
      }
    }
    if (remaining.length) {
      localStorage.setItem("cerebro_sync_queue", JSON.stringify(remaining));
    } else {
      localStorage.removeItem("cerebro_sync_queue");
    }
  } finally {
    _flushing = false;
  }
}

// ── Realtime subscriptions ────────────────────────────────────────────────────
// handlers: { onItemsChange(items), onContactosChange(contactos), onSettingsChange(settings) }
export function subscribeUserData(userId, handlers) {
  const channel = supabase
    .channel(`user-data-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "items", filter: `user_id=eq.${userId}` },
      async () => {
        // Al recibir cualquier cambio en items, recargar la lista completa
        const { data, error } = await supabase
          .from("items")
          .select("*")
          .eq("user_id", userId)
          .order("creado", { ascending: false });
        if (error) console.error("[supabase] realtime refetch items:", error.message);
        if (data && handlers.onItemsChange) handlers.onItemsChange(data);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contactos", filter: `user_id=eq.${userId}` },
      async () => {
        const { data, error } = await supabase
          .from("contactos")
          .select("*")
          .eq("user_id", userId)
          .order("nombre");
        if (error) console.error("[supabase] realtime refetch contactos:", error.message);
        if (data && handlers.onContactosChange) handlers.onContactosChange(data);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "settings", filter: `user_id=eq.${userId}` },
      async () => {
        const { data } = await supabase
          .from("settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (data && handlers.onSettingsChange) handlers.onSettingsChange(data);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeUserData(channel) {
  if (channel) supabase.removeChannel(channel);
}
