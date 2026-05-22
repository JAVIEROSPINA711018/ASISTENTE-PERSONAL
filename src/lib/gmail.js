// src/lib/gmail.js — Real Gmail API integration via Google Identity Services
// Scope: gmail.modify (includes read + labels + drafts; no send)

const SCOPES = "https://www.googleapis.com/auth/gmail.modify";
const TOKEN_KEY     = "cerebro_gmail_token";
const TOKEN_EXP_KEY = "cerebro_gmail_token_exp";

// ── Script loader ─────────────────────────────────────────────────────────────
let _gisLoaded = false;
export function loadGIS() {
  if (_gisLoaded || document.getElementById("gis-script")) {
    _gisLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.id = "gis-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = () => { _gisLoaded = true; resolve(); };
    s.onerror = () => reject(new Error("No se pudo cargar Google Identity Services"));
    document.head.appendChild(s);
  });
}

// ── Token storage ─────────────────────────────────────────────────────────────
export function saveToken(token, expiresIn = 3600) {
  const exp = Date.now() + expiresIn * 1000 - 120_000; // 2 min de margen
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXP_KEY, String(exp));
}

/** Devuelve el token almacenado si aún no expiró, o null si expiró */
export function getStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  const exp   = Number(localStorage.getItem(TOKEN_EXP_KEY) || 0);
  if (!token) return null;
  if (Date.now() > exp - 30_000) return null;
  return token;
}

/** Devuelve el token aunque haya expirado según localStorage */
export function getRawToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
}

export function isTokenNearExpiry() {
  const exp = Number(localStorage.getItem(TOKEN_EXP_KEY) || 0);
  return exp > 0 && Date.now() > exp - 5 * 60 * 1000;
}

// ── OAuth request ─────────────────────────────────────────────────────────────
export function requestGmailToken(clientId) {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGIS();
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
          saveToken(resp.access_token, resp.expires_in);
          resolve(resp.access_token);
        },
      });
      client.requestAccessToken({ prompt: "select_account" });
    } catch (e) { reject(e); }
  });
}

/** Renueva el token silenciosamente (sin diálogo de selección de cuenta) */
export function refreshGmailToken(clientId) {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGIS();
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
          saveToken(resp.access_token, resp.expires_in);
          resolve(resp.access_token);
        },
      });
      client.requestAccessToken({ prompt: "" });
    } catch (e) { reject(e); }
  });
}

export function revokeGmailToken(token) {
  if (!token) return;
  clearToken();
  fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" });
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
async function gmailGet(path, token) {
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    if (r.status === 401) { clearToken(); throw new Error("TOKEN_EXPIRED"); }
    const body = await r.text().catch(() => "");
    throw new Error(`Gmail API error ${r.status}: ${body.slice(0, 200)}`);
  }
  return r.json();
}

async function gmailPost(path, token, payload, method = "POST") {
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    if (r.status === 401) { clearToken(); throw new Error("TOKEN_EXPIRED"); }
    if (r.status === 403) throw new Error("SCOPE_INSUFICIENTE");
    const body = await r.text().catch(() => "");
    throw new Error(`Gmail API error ${r.status}: ${body.slice(0, 200)}`);
  }
  const text = await r.text();
  return text ? JSON.parse(text) : {};
}

// ── Metadata helpers ──────────────────────────────────────────────────────────
function headerVal(headers, name) {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractEmail(from) {
  const m = from.match(/<([^>]+)>/);
  return m ? m[1].trim() : from.trim();
}

function extractSenderName(from) {
  if (!from) return "";
  const withQuotes = from.match(/^"(.+?)"\s*</);
  if (withQuotes) return withQuotes[1].trim();
  const withoutQuotes = from.match(/^([^<]+)<[^>]+>/);
  if (withoutQuotes) {
    const name = withoutQuotes[1].trim();
    if (name.length > 0) return name;
  }
  return extractEmail(from);
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function parseTimestamp(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function labelToTab(labelIds = []) {
  if (labelIds.includes("CATEGORY_PROMOTIONS")) return "promociones";
  if (labelIds.includes("CATEGORY_SOCIAL"))     return "social";
  if (labelIds.includes("CATEGORY_UPDATES"))    return "actualizaciones";
  return "primario";
}

function messageToEmail(msg) {
  const h           = msg.payload?.headers ?? [];
  const from        = headerVal(h, "From");
  const senderEmail = extractEmail(from);
  const sender      = extractSenderName(from) || senderEmail;
  const subj        = headerVal(h, "Subject") || "(sin asunto)";
  const date        = headerVal(h, "Date");
  const tab         = labelToTab(msg.labelIds);

  return {
    id:          `gmail-${msg.id}`,
    gmailId:     msg.id,
    threadId:    msg.threadId,
    sender,
    senderEmail,
    subj,
    body:        msg.snippet ?? "",
    time:        formatTime(date),
    timestamp:   parseTimestamp(date),
    tab,
    badgeText:   null,
    badgeBg:     null,
    badgeColor:  null,
    resumen:     null,
    prioridad:   null,   // urgente | responder | info | archivar (set by AI)
    leido:       !(msg.labelIds?.includes("UNREAD")),
    eliminado:   false,
  };
}

// ── Fetch inbox ───────────────────────────────────────────────────────────────
export async function fetchInboxEmails(token, maxResults = 30) {
  if (!token) throw new Error("No hay token de Gmail");

  const list = await gmailGet(
    `/users/me/messages?maxResults=${maxResults}&labelIds=INBOX&q=newer_than:30d`,
    token
  );

  const ids = (list.messages ?? []).map(m => m.id);
  if (!ids.length) return [];

  const batches = [];
  for (let i = 0; i < ids.length; i += 10) batches.push(ids.slice(i, i + 10));

  const allMsgs = (await Promise.all(
    batches.flatMap(batch =>
      batch.map(id =>
        gmailGet(
          `/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          token
        ).catch(() => null)
      )
    )
  )).filter(Boolean);

  const emails = allMsgs.map(msg => messageToEmail(msg));
  emails.sort((a, b) => b.timestamp - a.timestamp);
  return emails;
}

// ── Get authenticated user email ──────────────────────────────────────────────
export async function getGmailUserEmail(token) {
  const profile = await gmailGet("/users/me/profile", token);
  return profile.emailAddress ?? "";
}

// ── Mark as read (API) ────────────────────────────────────────────────────────
export async function markAsReadAPI(token, gmailId) {
  if (!token || !gmailId) return;
  await gmailPost(`/users/me/messages/${gmailId}/modify`, token, {
    removeLabelIds: ["UNREAD"],
  });
}

// ── Labels ────────────────────────────────────────────────────────────────────
const _labelCache = {}; // token → { name → id }

/** Obtiene el ID de una etiqueta existente o la crea si no existe */
export async function getOrCreateLabel(token, name) {
  if (!_labelCache[token]) _labelCache[token] = {};
  if (_labelCache[token][name]) return _labelCache[token][name];

  // Buscar entre etiquetas existentes
  const { labels = [] } = await gmailGet("/users/me/labels", token);
  const existing = labels.find(l => l.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    _labelCache[token][name] = existing.id;
    return existing.id;
  }

  // Crear nueva etiqueta
  const created = await gmailPost("/users/me/labels", token, {
    name,
    labelListVisibility: "labelShow",
    messageListVisibility: "show",
  });
  _labelCache[token][name] = created.id;
  return created.id;
}

/** Aplica una etiqueta a un mensaje */
export async function applyLabelToMessage(token, gmailId, labelId) {
  if (!token || !gmailId || !labelId) return;
  await gmailPost(`/users/me/messages/${gmailId}/modify`, token, {
    addLabelIds: [labelId],
  });
}

/** Quita una etiqueta de un mensaje */
export async function removeLabelFromMessage(token, gmailId, labelId) {
  if (!token || !gmailId || !labelId) return;
  await gmailPost(`/users/me/messages/${gmailId}/modify`, token, {
    removeLabelIds: [labelId],
  });
}

// Mapa de prioridad → nombre de etiqueta en Gmail
export const PRIORIDAD_LABEL_NAMES = {
  urgente:  "Cerebro/Urgente",
  responder:"Cerebro/Responder",
  info:     "Cerebro/Info",
  archivar: "Cerebro/Archivar",
};

/** Aplica la etiqueta de prioridad IA al mensaje (crea la etiqueta si no existe) */
export async function aplicarPrioridadLabel(token, gmailId, prioridad) {
  if (!token || !gmailId || !prioridad) return;
  const labelName = PRIORIDAD_LABEL_NAMES[prioridad];
  if (!labelName) return;
  try {
    const labelId = await getOrCreateLabel(token, labelName);
    await applyLabelToMessage(token, gmailId, labelId);
  } catch (e) {
    // No fatal — si falla el label, continuar
    console.warn("aplicarPrioridadLabel:", e.message);
  }
}

// ── Create Draft (API) ────────────────────────────────────────────────────────
/** Encodes MIME message as base64url for Gmail API */
function buildRawMime({ from, to, subject, body, threadId: _t }) {
  const subjectB64 = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const lines = [
    from ? `From: ${from}` : null,
    `To: ${to}`,
    `Subject: ${subjectB64}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].filter(l => l !== null).join("\r\n");

  // base64url encode (browser-compatible TextEncoder)
  const bytes = new TextEncoder().encode(lines);
  let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Crea un borrador real en Gmail.
 * @param {string} token - access token
 * @param {{ to: string, subject: string, body: string, from?: string, threadId?: string }} opts
 * @returns {Promise<{ id: string, message: object }>}
 */
export async function createDraftAPI(token, { to, subject, body, from = "", threadId }) {
  if (!token) throw new Error("No hay token de Gmail");
  const raw = buildRawMime({ from, to, subject, body });
  const payload = { message: { raw } };
  if (threadId) payload.message.threadId = threadId;
  return gmailPost("/users/me/drafts", token, payload);
}

// ── Attachments ──────────────────────────────────────────────────────────────

/**
 * Obtiene el mensaje completo con payload (para leer adjuntos).
 */
export async function getMessageFull(token, messageId) {
  return gmailGet(`/users/me/messages/${messageId}?format=full`, token);
}

/**
 * Descarga los datos de un adjunto (devuelve base64url en .data).
 */
export async function fetchAttachment(token, messageId, attachmentId) {
  return gmailGet(`/users/me/messages/${messageId}/attachments/${attachmentId}`, token);
}

/**
 * Recorre el árbol de partes del mensaje y devuelve la lista de adjuntos.
 */
export function extractAttachments(fullMessage) {
  const result = [];
  function traverse(part) {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      result.push({
        filename:     part.filename,
        mimeType:     part.mimeType || "application/octet-stream",
        size:         part.body.size || 0,
        attachmentId: part.body.attachmentId,
      });
    }
    (part.parts || []).forEach(traverse);
  }
  if (fullMessage.payload) traverse(fullMessage.payload);
  return result;
}

// ── Fetch new emails since last check (for routine) ───────────────────────────
/**
 * Obtiene correos no leídos de las últimas N horas (para la rutina automática)
 */
export async function fetchUnreadSince(token, horasAtras = 8, maxResults = 20) {
  if (!token) throw new Error("No hay token de Gmail");
  const list = await gmailGet(
    `/users/me/messages?maxResults=${maxResults}&labelIds=INBOX&q=is:unread newer_than:${Math.ceil(horasAtras/24)}d`,
    token
  );
  const ids = (list.messages ?? []).map(m => m.id);
  if (!ids.length) return [];

  const msgs = (await Promise.all(
    ids.map(id =>
      gmailGet(
        `/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        token
      ).catch(() => null)
    )
  )).filter(Boolean);

  return msgs.map(m => messageToEmail(m)).sort((a, b) => b.timestamp - a.timestamp);
}
