// src/lib/ai.js — Provider-agnostic AI wrapper
// Supports: Google Gemini, and any OpenAI-compatible API
// (OpenRouter, Qwen, Kimi/Moonshot, Groq, OpenAI, etc.)

const GEMINI_MODEL_DEFAULT = "gemini-2.5-flash";
const OPENAI_MODEL_DEFAULT = "gpt-4o-mini";
const TIMEOUT_MS = 30_000;

// ── Single-turn prompt ────────────────────────────────────────────────────────
/**
 * Send a single prompt and return the response text.
 * @param {string} prompt
 * @param {{ apiKey: string, provider?: "gemini"|"openai"|"claude", baseUrl?: string, model?: string }} config
 */
export async function callAI(prompt, config = {}) {
  const { apiKey, provider = "gemini", baseUrl, model } = config;
  if (!apiKey) throw new Error("Sin API Key configurada. Ve a Ajustes → API.");
  if (provider === "openai") {
    return _openaiCall([{ role: "user", content: prompt }], null, { apiKey, baseUrl, model });
  } else if (provider === "claude") {
    return _claudeCall(prompt, null, { apiKey, model });
  } else {
    return _geminiCall(prompt, null, { apiKey, model });
  }
}

// ── Multi-turn chat ───────────────────────────────────────────────────────────
/**
 * Send a conversation with optional system prompt.
 * messages: [{ role: "user"|"assistant"|"model", content: string }]
 * Returns the raw response text (caller parses JSON if needed).
 */
export async function callChatAI(messages, systemPrompt, config = {}) {
  const { apiKey, provider = "gemini", baseUrl, model } = config;
  if (!apiKey) throw new Error("Sin API Key configurada. Ve a Ajustes → API.");
  if (provider === "openai") {
    return _openaiCall(messages, systemPrompt, { apiKey, baseUrl, model });
  } else if (provider === "claude") {
    return _claudeChatCall(messages, systemPrompt, { apiKey, model });
  } else {
    return _geminiChatCall(messages, systemPrompt, { apiKey, model });
  }
}

// ── Gemini implementation ─────────────────────────────────────────────────────
async function _geminiCall(prompt, _systemPrompt, { apiKey, model }) {
  const m = model || GEMINI_MODEL_DEFAULT;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: ctrl.signal }
    );
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message ?? `Error Gemini ${r.status}`); }
    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!text) throw new Error("Gemini no devolvió texto.");
    return text;
  } finally { clearTimeout(timer); }
}

async function _geminiChatCall(messages, systemPrompt, { apiKey, model }) {
  const m = model || GEMINI_MODEL_DEFAULT;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const contents = messages.map(msg => ({
    role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));
  const body = {
    contents,
    generationConfig: { responseMimeType: "application/json", temperature: 1.0 },
  };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal }
    );
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message ?? `Error Gemini ${r.status}`); }
    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!text) throw new Error("Gemini no devolvió texto.");
    return text;
  } finally { clearTimeout(timer); }
}

// ── Anthropic Claude implementation ───────────────────────────────────────────
async function _claudeCall(prompt, _systemPrompt, { apiKey, model }) {
  return _claudeChatCall([{ role: "user", content: prompt }], null, { apiKey, model });
}

async function _claudeChatCall(messages, systemPrompt, { apiKey, model }) {
  const m = model || "claude-3-5-sonnet-latest";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const formattedMessages = messages.map(msg => ({
    role: msg.role === "assistant" || msg.role === "model" ? "assistant" : "user",
    content: msg.content
  }));
  const body = {
    model: m,
    max_tokens: 4096,
    messages: formattedMessages
  };
  if (systemPrompt) body.system = systemPrompt;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message ?? `Error Claude ${r.status}`); }
    const d = await r.json();
    const text = d.content?.[0]?.text?.trim() ?? "";
    if (!text) throw new Error("Claude no devolvió texto.");
    return text;
  } finally { clearTimeout(timer); }
}

// ── OpenAI-compatible implementation ─────────────────────────────────────────
async function _openaiCall(messages, systemPrompt, { apiKey, baseUrl, model }) {
  const base = (baseUrl ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const mod  = model || OPENAI_MODEL_DEFAULT;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const msgs = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages.map(_normalizeRole)]
    : messages.map(_normalizeRole);
  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://cerebro.app",
        "X-Title": "Cerebro Personal",
      },
      body: JSON.stringify({ model: mod, messages: msgs, temperature: 1.0 }),
      signal: ctrl.signal,
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message ?? `Error ${r.status}`); }
    const d = await r.json();
    const text = d.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("La IA no devolvió texto.");
    return text;
  } finally { clearTimeout(timer); }
}

function _normalizeRole(msg) {
  return { role: msg.role === "model" ? "assistant" : msg.role, content: msg.content };
}

// ── Preset providers ──────────────────────────────────────────────────────────
export const AI_PROVIDERS = [
  { id: "gemini", label: "Google Gemini",       placeholder: "AIzaSy...",  defaultModel: "gemini-2.5-flash" },
  { id: "claude", label: "Anthropic Claude",    placeholder: "sk-ant-...", defaultModel: "claude-3-5-sonnet-latest" },
  { id: "openai", label: "OpenAI-compatible",   placeholder: "sk-...",     defaultModel: "gpt-4o-mini" },
];

export const OPENAI_PRESETS = [
  { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1",                      model: "qwen/qwen3-235b-a22b:free" },
  { label: "OpenAI",     baseUrl: "https://api.openai.com/v1",                         model: "gpt-4o-mini" },
  { label: "Qwen",       baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-max" },
  { label: "Kimi",       baseUrl: "https://api.moonshot.cn/v1",                        model: "moonshot-v1-8k" },
  { label: "Groq",       baseUrl: "https://api.groq.com/openai/v1",                    model: "llama-3.3-70b-versatile" },
];
