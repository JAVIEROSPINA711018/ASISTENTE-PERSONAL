// src/views/ViewCorreos.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { getDynamicWorkspaceData } from "../lib/workspaceData.js";
import { callAI } from "../lib/ai.js";
import { markAsReadAPI, aplicarPrioridadLabel, createDraftAPI, getMessageFull, fetchAttachment, extractAttachments } from "../lib/gmail.js";
import { pickProjectsFolder, getOrRequestFolderHandle, getSavedFolderName, saveFileToFolder, downloadFallback, base64ToBlob, sanitizeFilename, isFileSystemSupported } from "../lib/fileSystem.js";

// CRM Design System — RED=#901B2F  BLUE=#1F3A52
import { LIGHT as LIGHT_C, DARK as DARK_C } from "../lib/theme.js";
let G = LIGHT_C;

// ── Helpers ──────────────────────────────────────────────────────────────────
// sender puede ser display name ("Claudia Bedoya") o email ("claudia@gmail.com")
function parseSender(sender) {
  if (!sender) return "Sin remitente";
  // Si contiene @ probablemente es un email → formatear desde local part
  if (sender.includes("@")) {
    const local = sender.split("@")[0];
    return local.split(/[._-]/).filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  // Ya es un display name — devolverlo tal cual
  return sender.trim();
}
function getInitials(sender) {
  const nombre = parseSender(sender);
  const p = nombre.split(" ").filter(Boolean);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0,2).toUpperCase();
}
function senderColor(sender) {
  const colors = ["#0071e3","#34c759","#ff9500","#5e5ce6","#ff3b30","#24b495","#bf5af2"];
  let h = 0;
  const key = sender || "";
  for (let i=0; i<key.length; i++) h = key.charCodeAt(i) + ((h<<5)-h);
  return colors[Math.abs(h) % colors.length];
}
// Para URLs de Gmail siempre usamos el email real (senderEmail si existe, si no sender)
function getSenderEmail(correo) {
  return correo.senderEmail || correo.sender;
}
function gmailSearchUrl(correo, auth) {
  const email = getSenderEmail(correo);
  const qs = auth ? `?authuser=${encodeURIComponent(auth)}` : "";
  return `https://mail.google.com/mail/${qs}#search/from:${email}`;
}
function gmailComposeUrl(correo, body, auth) {
  const to = getSenderEmail(correo);
  const au = auth ? `?authuser=${encodeURIComponent(auth)}&` : "?";
  return `https://mail.google.com/mail/${au}view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(`Re: ${correo.subj}`)}&body=${encodeURIComponent(body)}`;
}

// ── AI helpers (provider-agnostic) ───────────────────────────────────────────
function resumirCorreo(c, cfg) {
  return callAI(
    `Eres asistente ejecutivo personal. Resume en máximo 2 frases concisas en español, sin emojis, la acción requerida o información clave de este correo.\nDe: ${c.sender}\nAsunto: ${c.subj}\nContenido: ${c.body}`,
    cfg
  );
}
function redactarRespuesta(c, cfg) {
  return callAI(
    `Eres el asistente personal del Ing. Javier Ospina (Ingeniero Civil/Estructural, Colombia). Redacta una respuesta profesional breve en español. Saludo formal, cuerpo conciso (2-4 oraciones), cierre y firma. Sin placeholders ni corchetes.\n\nCorreo original:\nDe: ${c.sender}\nAsunto: ${c.subj}\nContenido: ${c.body}`,
    cfg
  );
}

// ── Prioridad IA ─────────────────────────────────────────────────────────────
export const PRIORIDAD_META = {
  urgente:  { label: "Urgente",  color: "#ff3b30", bg: "rgba(255,59,48,0.10)",   dark: "rgba(255,69,58,0.15)"  },
  responder:{ label: "Responder",color: "#ff9500", bg: "rgba(255,149,0,0.10)",  dark: "rgba(255,159,10,0.15)" },
  info:     { label: "Info",     color: "#0071e3", bg: "rgba(0,113,227,0.10)",  dark: "rgba(10,132,255,0.15)" },
  archivar: { label: "Archivar", color: "#86868b", bg: "rgba(134,134,139,0.10)",dark: "rgba(99,99,102,0.15)"  },
};

async function clasificarCorreoIA(correo, cfg) {
  const resp = await callAI(
    `Clasifica este correo en UNA de estas categorías:
- urgente: requiere acción o respuesta HOY, tiene plazo inminente o es crítico.
- responder: requiere respuesta pero no urgente.
- info: solo información, sin acción requerida.
- archivar: newsletters, promociones, notificaciones automáticas, listas de correo.

Remitente: ${correo.sender}
Asunto: ${correo.subj}
Cuerpo: ${(correo.body || "").slice(0, 400)}

Responde SOLO con una de estas palabras exactas: urgente, responder, info, archivar`,
    cfg
  );
  const r = resp.trim().toLowerCase().replace(/[^a-z]/g, "");
  return ["urgente", "responder", "info", "archivar"].includes(r) ? r : "info";
}

// ── Iconos SVG ────────────────────────────────────────────────────────────────
const IcoMail    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcoBrain   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const IcoRefresh = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IcoCheck   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcoReply   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>;
const IcoOpen    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IcoSpinner = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" style={{animation:"spin 1s linear infinite",transformOrigin:"center"}}/></svg>;
const IcoSend       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IcoFolderDown = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polyline points="12 11 12 17"/><polyline points="9 14 12 17 15 14"/></svg>;

// ── Vista principal ───────────────────────────────────────────────────────────
// ── Persistencia de resúmenes ─────────────────────────────────────────────────
const RESUMENES_KEY = "cerebro_email_resumenes";
function loadResumenes() {
  try { return JSON.parse(localStorage.getItem(RESUMENES_KEY) || "{}"); } catch { return {}; }
}
function saveResumenes(map) {
  try { localStorage.setItem(RESUMENES_KEY, JSON.stringify(map)); } catch {}
}

export default function ViewCorreos({ googleConnectedEmail, apiKey, aiConfig, darkMode = false, gmailEmails = [], fetchingEmails = false, gmailSyncError = "", gmailTokenActive = true, gmailToken = null, onRefreshEmails, onMarkRead, onReconnectGmail, onOpenConnections }) {
  // Stable config ref — avoids recreating callbacks on every parent render
  const cfgRef = useRef(aiConfig ?? { apiKey, provider: "gemini" });
  useEffect(() => { cfgRef.current = aiConfig ?? { apiKey, provider: "gemini" }; }, [aiConfig, apiKey]);
  // Snapshot for render (only read apiKey for conditional rendering)
  const cfgApiKey = (aiConfig ?? { apiKey }).apiKey;

  G = darkMode ? DARK_C : LIGHT_C;

  const hasRealEmails  = gmailEmails.length > 0;
  // Conectado = tiene email conocido O ya llegaron correos reales (gmail-sync funciona aunque no sepamos el email)
  const isConnected    = !!googleConnectedEmail || hasRealEmails;
  // Solo usar mock si NO hay cuenta conectada. Con cuenta conectada esperamos correos reales.
  const wsData     = getDynamicWorkspaceData(googleConnectedEmail);
  const srcEmails  = hasRealEmails
    ? gmailEmails
    : (!isConnected ? wsData.gmail : []);

  const [correos, setCorreos] = useState(() => {
    const saved = loadResumenes();
    return srcEmails.map((m, i) => ({
      ...m, id: m.id ?? `mail-${i}`, leido: m.leido ?? false, eliminado: false,
      resumen: saved[m.id ?? `mail-${i}`] ?? null,
    }));
  });
  const [seleccionados, setSeleccionados]   = useState(new Set());
  const [cargandoResumenes, setCargando]    = useState(false);
  const [ultimaActualizacion, setUltima]    = useState(null);
  const [respondiendo, setRespondiendo]     = useState(null); // { id, draft, loading }
  const [vistaMode, setVistaMode]           = useState("lista"); // "lista" | "resumen"
  const [tabActivo, setTabActivo]           = useState("todos");
  const [error, setError]                   = useState(null);
  const intervalRef                         = useRef(null);
  const [conectando, setConectando]         = useState(false);
  const [conectarError, setConectarError]   = useState(null);

  async function handleConectar() {
    if (!onReconnectGmail) return;
    setConectando(true);
    setConectarError(null);
    try {
      await onReconnectGmail();
    } catch (e) {
      setConectarError(e?.message || "Error al conectar con Google");
    } finally {
      setConectando(false);
    }
  }
  // Ref to correos so generarResumenes doesn't need it as dependency
  const correosRef                          = useRef(correos);
  useEffect(() => { correosRef.current = correos; }, [correos]);

  useEffect(() => {
    const s = document.createElement("style"); s.id = "correos-anim";
    s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    if (!document.getElementById("correos-anim")) document.head.appendChild(s);
  }, []);

  // Sync correos when email source changes — preserves existing resúmenes
  useEffect(() => {
    let src;
    if (gmailEmails.length > 0) {
      src = gmailEmails; // correos reales de Gmail
    } else if (!googleConnectedEmail) {
      src = getDynamicWorkspaceData(googleConnectedEmail).gmail; // demo sin cuenta
    } else {
      src = []; // cuenta conectada pero aún cargando — no mostrar mock
    }
    const saved = loadResumenes();
    setCorreos(prev => {
      const prevMap = Object.fromEntries(prev.map(c => [c.id ?? c.gmailId, c]));
      return src.map((m, i) => {
        const key = m.id ?? m.gmailId ?? `mail-${i}`;
        const existing = prevMap[key];
        return { ...m, id: key, leido: m.leido ?? false, eliminado: false,
          resumen: existing?.resumen ?? saved[key] ?? null };
      });
    });
    if (gmailEmails.length > 0) setUltima(new Date());
    setSeleccionados(new Set()); setRespondiendo(null);
  }, [googleConnectedEmail, gmailEmails]);

  // Stable summarizer — uses refs, NO correos/cfg in deps → interval never cascades
  const generarResumenes = useCallback(async () => {
    const cfg = cfgRef.current;
    if (!cfg?.apiKey) return; // no key → skip silently
    const sinResumen = correosRef.current.filter(c => !c.eliminado && !c.resumen);
    if (!sinResumen.length) return; // all already summarized → no API call
    setCargando(true); setError(null);
    try {
      const actualizados = await Promise.all(
        sinResumen.map(async c => {
          try { return { ...c, resumen: await resumirCorreo(c, cfg) }; }
          catch { return c; } // keep original on error — never overwrite with error text
        })
      );
      setCorreos(prev => {
        const next = prev.map(c => actualizados.find(a => a.id === c.id) || c);
        // Persistir resúmenes en localStorage
        const saved = loadResumenes();
        next.forEach(c => { if (c.resumen) saved[c.id] = c.resumen; });
        saveResumenes(saved);
        return next;
      });
      setUltima(new Date());
    } catch (e) { setError("Error IA: " + e.message); }
    finally { setCargando(false); }
  }, []); // ← stable: no deps that change on every render

  // One-time interval setup — never resets unless component unmounts
  useEffect(() => {
    intervalRef.current = setInterval(generarResumenes, 30 * 60 * 1000); // 30 min
    return () => clearInterval(intervalRef.current);
  }, [generarResumenes]); // generarResumenes is now stable ([] deps)

  // Summarize once on mount if API key present — guarded by ref so no re-fire
  const didAutoSummarize = useRef(false);
  useEffect(() => {
    if (cfgApiKey && !didAutoSummarize.current) {
      didAutoSummarize.current = true;
      generarResumenes();
    }
  }, [cfgApiKey, generarResumenes]);

  // ── Clasificación IA de prioridad ─────────────────────────────────────────
  const [clasificando, setClasificando] = useState(false);
  const gmailTokenRef = useRef(gmailToken);
  useEffect(() => { gmailTokenRef.current = gmailToken; }, [gmailToken]);

  const clasificarTodos = useCallback(async () => {
    const cfg = cfgRef.current;
    if (!cfg?.apiKey || clasificando) return;
    const sinClasificar = correosRef.current.filter(c => !c.eliminado && !c.prioridad);
    if (!sinClasificar.length) return;
    setClasificando(true);
    try {
      // Clasificar en lotes de 5 para no saturar la API
      for (let i = 0; i < sinClasificar.length; i += 5) {
        const lote = sinClasificar.slice(i, i + 5);
        const resultados = await Promise.all(
          lote.map(async c => {
            try {
              const p = await clasificarCorreoIA(c, cfg);
              // Aplicar etiqueta en Gmail si hay token
              if (gmailTokenRef.current && c.gmailId) {
                aplicarPrioridadLabel(gmailTokenRef.current, c.gmailId, p).catch(() => {});
              }
              return { id: c.id, prioridad: p };
            } catch { return { id: c.id, prioridad: "info" }; }
          })
        );
        setCorreos(prev => prev.map(c => {
          const r = resultados.find(r => r.id === c.id);
          return r ? { ...c, prioridad: r.prioridad } : c;
        }));
      }
    } finally { setClasificando(false); }
  }, [clasificando]);

  // Acciones correo individual
  const marcarLeido = id => {
    setCorreos(prev => prev.map(c => c.id===id ? {...c, leido:true} : c));
    if (onMarkRead) onMarkRead(id);
    // Marcar como leído vía API si hay token
    const correo = correosRef.current.find(c => c.id === id);
    if (gmailToken && correo?.gmailId) {
      markAsReadAPI(gmailToken, correo.gmailId).catch(() => {});
    }
  };
  const eliminarCorreo = id => { setCorreos(prev => prev.map(c => c.id===id ? {...c, eliminado:true} : c)); if(respondiendo?.id===id) setRespondiendo(null); };

  // Respuesta IA
  async function iniciarRespuesta(correo) {
    if (!cfgRef.current.apiKey) { setError("Configure la API Key en Ajustes → API para generar respuestas."); return; }
    setRespondiendo({ id: correo.id, draft: null, loading: true });
    try {
      const draft = await redactarRespuesta(correo, cfgRef.current);
      setRespondiendo({ id: correo.id, draft, loading: false });
    } catch (e) {
      setRespondiendo(null);
      setError("Error al redactar respuesta: " + (e.message ?? "desconocido"));
    }
  }
  async function enviarRespuesta(correo) {
    const draft = respondiendo?.draft;
    if (!draft) return;

    // Si hay token de Gmail → crear borrador real en la API
    if (gmailToken && correo.gmailId) {
      try {
        await createDraftAPI(gmailToken, {
          to: getSenderEmail(correo),
          subject: correo.subj?.startsWith("Re:") ? correo.subj : `Re: ${correo.subj}`,
          body: draft,
          from: googleConnectedEmail,
          threadId: correo.threadId,
        });
        setRespondiendo(null);
        marcarLeido(correo.id);
        setError(null);
        // Pequeña notificación visual de éxito
        setCorreos(prev => prev.map(c => c.id===correo.id ? {...c, _draftCreado: true} : c));
        setTimeout(() => setCorreos(prev => prev.map(c => c.id===correo.id ? {...c, _draftCreado: false} : c)), 3000);
        return;
      } catch (e) {
        if (e.message === "SCOPE_INSUFICIENTE") {
          // Fallback: abrir compose en el navegador
          window.open(gmailComposeUrl(correo, draft, googleConnectedEmail), "_blank");
        } else {
          setError("Error al crear borrador: " + e.message);
        }
      }
    } else {
      // Sin token → abrir Gmail compose en navegador
      window.open(gmailComposeUrl(correo, draft, googleConnectedEmail), "_blank");
    }
    setRespondiendo(null);
    marcarLeido(correo.id);
  }

  // Bulk
  const toggleSel      = id => setSeleccionados(prev => { const s=new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });
  const marcarLeidosBulk = () => { setCorreos(prev=>prev.map(c=>seleccionados.has(c.id)?{...c,leido:true}:c)); setSeleccionados(new Set()); };
  const eliminarBulk     = () => { setCorreos(prev=>prev.map(c=>seleccionados.has(c.id)?{...c,eliminado:true}:c)); setSeleccionados(new Set()); };

  const todos     = correos.filter(c => !c.eliminado);
  const noLeidos  = todos.filter(c => !c.leido).length;
  const filtrarTab = arr => tabActivo === "todos" ? arr : arr.filter(c => (c.tab ?? "primario") === tabActivo);
  const visibles  = filtrarTab(todos);
  const conteoPorTab = id => id === "todos" ? todos.length : todos.filter(c => (c.tab ?? "primario") === id).length;

  // ── Panel IA derecho ────────────────────────────────────────────────────────
  const [panelIA, setPanelIA]           = useState({ loading: false, data: null, error: null });
  const [panelTab, setPanelTab]         = useState("todos");
  const [savedFiles, setSavedFiles]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("cerebro_saved_files") || "[]"); } catch { return []; }
  });
  const [proyectos, setProyectos]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("cerebro_proyectos") || "[]"); } catch { return []; }
  });
  const [modalProyecto, setModalProyecto] = useState(null); // correo seleccionado

  // Detectar archivos adjuntos y referencias en correos
  function detectarArchivos(correos) {
    const EXT_RE = /\.(pdf|dwg|dxf|docx?|xlsx?|pptx?|zip|rar|png|jpg|jpeg|svg|ai|sketch|fig)\b/gi;
    const WORK_RE = /plano|autocad|dwg|presupuesto|contrato|informe|propuesta|licitaci[oó]n|cotizaci[oó]n|obra|estructur|ciment|memoria/gi;
    const archivos = [];
    correos.forEach(c => {
      const texto = `${c.subj || ""} ${c.body || ""} ${c.resumen || ""}`;
      const exts = [...(texto.matchAll(EXT_RE) || [])].map(m => m[0].toLowerCase());
      const esLaboral = WORK_RE.test(texto);
      if (exts.length > 0 || esLaboral) {
        archivos.push({
          id: c.id, sender: parseSender(c.sender), subj: c.subj,
          archivos: [...new Set(exts)], esLaboral,
          gmailUrl: gmailSearchUrl(c, googleConnectedEmail),
        });
      }
    });
    return archivos;
  }

  async function generarResumenPanel() {
    const cfg = cfgRef.current;
    if (!cfg?.apiKey) return;
    const hoy = new Date().toLocaleDateString("es-CO", { day:"numeric", month:"long" });
    const correosHoy = todos.filter(c => {
      if (!c.date && !c.fecha) return true;
      const d = new Date(c.date || c.fecha);
      const hoyStr = new Date().toDateString();
      return d.toDateString() === hoyStr;
    });
    const muestra = correosHoy.length > 0 ? correosHoy : todos.slice(0, 15);
    if (muestra.length === 0) return;

    setPanelIA({ loading: true, data: null, error: null });
    try {
      // Agrupar por pestaña
      const porTab = {};
      TABS.forEach(t => {
        const grupo = muestra.filter(c => t.id === "todos" || (c.tab ?? "primario") === t.id);
        if (grupo.length > 0) porTab[t.id] = { label: t.label, color: t.color, correos: grupo };
      });

      const resumen = await callAI(
        `Analiza estos correos del día ${hoy} y genera un resumen ejecutivo en español.
Para cada categoría con correos, indica:
1. Un resumen de 1-2 oraciones de los temas más importantes
2. Acciones requeridas (si las hay)
3. Documentos o archivos mencionados (extensiones .pdf, .dwg, .docx, etc.)

Correos: ${JSON.stringify(muestra.slice(0,10).map(c => ({ de: parseSender(c.sender), asunto: c.subj, resumen: c.resumen, cuerpo: (c.body||"").slice(0,200) })))}

Responde en JSON: {"resumenGeneral":"...","categorias":[{"nombre":"...","resumen":"...","acciones":["..."],"archivos":["..."]}]}`,
        cfg
      );

      let parsed;
      try {
        const match = resumen.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : resumen);
      } catch {
        parsed = { resumenGeneral: resumen, categorias: [] };
      }

      const archivosDetectados = detectarArchivos(muestra);
      setPanelIA({ loading: false, data: { ...parsed, archivosDetectados }, error: null });
    } catch (e) {
      const raw = e.message || "";
      const msg = raw.toLowerCase().includes("api key not valid") || raw.toLowerCase().includes("invalid api key")
        ? "API Key inválida. Vaya a Ajustes → API y verifique que la clave sea correcta para el proveedor seleccionado."
        : raw.includes("Sin API Key")
          ? "Configure su API Key en Ajustes → API antes de generar resúmenes."
          : raw;
      setPanelIA({ loading: false, data: null, error: msg });
    }
  }

  function guardarArchivo(item) {
    const entry = { ...item, savedAt: new Date().toISOString() };
    const next = [entry, ...savedFiles.filter(f => f.id !== item.id)];
    setSavedFiles(next);
    try { localStorage.setItem("cerebro_saved_files", JSON.stringify(next)); } catch {}
  }

  function registrarProyecto(meta) {
    const next = [meta, ...proyectos.filter(p => p.correoId !== meta.correoId)];
    setProyectos(next);
    try { localStorage.setItem("cerebro_proyectos", JSON.stringify(next)); } catch {}
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100%", background:G.bg, overflow:"hidden" }}>

      {/* ── Modal Guardar Proyecto ───────────────────────────────────────────── */}
      {modalProyecto && (
        <ProyectoModal
          correo={modalProyecto}
          gmailToken={gmailToken}
          googleConnectedEmail={googleConnectedEmail}
          cfg={cfgRef.current}
          darkMode={darkMode}
          onCerrar={() => setModalProyecto(null)}
          onGuardado={meta => { registrarProyecto(meta); setModalProyecto(null); }}
        />
      )}

      {/* Header */}
      <div style={{ background: G.bg, flexShrink: 0, borderBottom: `1px solid ${G.border}` }}>

        {/* Fila 1: título + botones */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px 12px" }}>
          {/* Izquierda: título + cuentas */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.02em", color:G.textPrimary }}>Correos</span>
                {noLeidos > 0 && (
                  <span style={{ fontSize:10, fontWeight:700, background:G.accent, color:"#fff", borderRadius:20, padding:"2px 8px" }}>
                    {noLeidos}
                  </span>
                )}
              </div>
              {/* Cuentas conectadas */}
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5, flexWrap:"wrap" }}>
                {isConnected ? (
                  /* Cuenta conectada */
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px 3px 7px",
                      borderRadius:20, background:"rgba(22,163,74,0.10)", border:"1px solid rgba(22,163,74,0.25)" }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:G.green, flexShrink:0 }} />
                      <span style={{ fontSize:11, color:G.green, fontWeight:700 }}>
                        {googleConnectedEmail || "Gmail conectado"}
                      </span>
                    </div>
                    <button onClick={handleConectar} disabled={conectando}
                      title="Cambiar cuenta"
                      style={{ fontSize:10, color:G.textTertiary, background:"none", border:"none", cursor:"pointer", padding:"2px 4px" }}>
                      {conectando ? "…" : "cambiar"}
                    </button>
                    {ultimaActualizacion && (
                      <span style={{ fontSize:10, color:G.textTertiary }}>
                        · sync {ultimaActualizacion.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"})}
                      </span>
                    )}
                  </div>
                ) : (
                  /* Sin cuenta */
                  <button onClick={handleConectar} disabled={conectando}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:20,
                      background:"rgba(37,99,235,0.08)", border:"1px solid rgba(37,99,235,0.2)",
                      color:G.accent, fontSize:11, fontWeight:700, cursor:conectando?"default":"pointer" }}>
                    {conectando ? "Conectando…" : "Conectar correo"}
                  </button>
                )}
                {conectarError && (
                  <span style={{ fontSize:11, color:G.coral }}>{conectarError}</span>
                )}
              </div>
            </div>
          </div>

          {/* Derecha: botones */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {seleccionados.size > 0 && (
              <>
                <span style={{ fontSize:11, fontWeight:600, color:G.accent }}>
                  {seleccionados.size} seleccionado{seleccionados.size!==1?"s":""}
                </span>
                <button onClick={marcarLeidosBulk} style={bulkBtnStyle(G)}><IcoCheck /> Leídos</button>
                <button onClick={eliminarBulk} style={{ ...bulkBtnStyle(G), color:G.coral }}><IcoTrash /> Eliminar</button>
                <div style={{ width:1, height:20, background:G.border }} />
              </>
            )}
            {onRefreshEmails && (
              <button onClick={onRefreshEmails} disabled={fetchingEmails}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9,
                  background: darkMode ? "rgba(255,255,255,0.06)" : "#ffffff",
                  color:G.textSecondary, border:`1px solid ${G.border}`,
                  fontSize:11, fontWeight:600, cursor:fetchingEmails?"default":"pointer" }}>
                {fetchingEmails ? <IcoSpinner /> : <IcoRefresh />}
                {fetchingEmails ? "Cargando…" : "Actualizar correos"}
              </button>
            )}
            <button onClick={generarResumenes} disabled={cargandoResumenes||!cfgApiKey}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9,
                background:cargandoResumenes?G.accentSoft:G.accent, color:cargandoResumenes?G.accent:"#fff",
                border:`1px solid ${G.accent}`, fontSize:11, fontWeight:700,
                cursor:(cargandoResumenes||!cfgApiKey)?"default":"pointer", opacity:!cfgApiKey?0.5:1 }}>
              {cargandoResumenes ? <IcoSpinner /> : <IcoBrain />}
              {cargandoResumenes ? "Analizando…" : "Actualizar IA"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ fontSize:11, color:G.coral, background:G.coralSoft, border:`1px solid ${G.coral}33`,
            borderRadius:8, padding:"8px 12px", margin:"0 24px 10px" }}>
            {error}
          </div>
        )}

        {/* Fila 2: toggle vista + filtros en la misma línea */}
        <div style={{ display:"flex", alignItems:"center", gap:0, padding:"0 24px 12px", overflowX:"auto" }}>
          {/* Toggle Lista / Resumen IA */}
          <div style={{ display:"flex", gap:2, background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderRadius:10, padding:3, marginRight:16, flexShrink:0 }}>
            {[{id:"lista",label:"Lista"},{id:"resumen",label:"Resumen IA"}].map(v => (
              <button key={v.id} onClick={() => setVistaMode(v.id)}
                style={{ padding:"5px 14px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", border:"none",
                  background: vistaMode===v.id ? (darkMode?"#ffffff":"#ffffff") : "transparent",
                  color: vistaMode===v.id ? (darkMode?"#000000":G.textPrimary) : G.textTertiary,
                  boxShadow: vistaMode===v.id ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                  transition:"all 0.15s" }}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Separador */}
          <div style={{ width:1, height:20, background:G.border, marginRight:16, flexShrink:0 }} />

          {/* Pestañas por categoría */}
          <div style={{ display:"flex", gap:4, overflowX:"auto" }}>
            {TABS.map(t => {
              const cnt    = conteoPorTab(t.id);
              const active = tabActivo === t.id;
              return (
                <button key={t.id} onClick={() => setTabActivo(t.id)}
                  style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 12px",
                    borderRadius:20, flexShrink:0,
                    background: active ? G.textPrimary : "transparent",
                    color: active ? (darkMode?"#000000":"#ffffff") : G.textTertiary,
                    border:`1px solid ${active ? G.textPrimary : G.border}`,
                    fontSize:11, fontWeight:active?700:500, cursor:"pointer", transition:"all 0.15s" }}>
                  {t.label}
                  {cnt > 0 && (
                    <span style={{ fontSize:9, fontWeight:700,
                      background: active ? "rgba(255,255,255,0.25)" : `${G.textTertiary}22`,
                      color: active ? (darkMode?"#000":"#fff") : G.textTertiary,
                      borderRadius:10, padding:"1px 5px" }}>
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Banner token expirado */}
      {isConnected && !gmailTokenActive && (
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"10px 24px", background: darkMode ? "rgba(255,159,10,0.15)" : "rgba(255,149,0,0.10)",
          borderBottom:`1px solid ${darkMode ? "rgba(255,159,10,0.35)" : "rgba(255,149,0,0.30)"}`,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={darkMode?"#ffb340":"#b36000"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontSize:13, color: darkMode ? "#ffb340" : "#b36000", flex:1 }}>
            La sesión de Gmail expiró. Reconecta para ver tus correos más recientes.
          </span>
          {onReconnectGmail && (
            <button
              onClick={onReconnectGmail}
              style={{
                padding:"6px 14px", borderRadius:8,
                border:"1px solid " + (darkMode ? "#ffb340" : "#b36000"),
                background:"transparent",
                color: darkMode ? "#ffb340" : "#b36000",
                fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
              }}
            >
              Reconectar Gmail
            </button>
          )}
        </div>
      )}

      {isConnected && gmailSyncError && gmailTokenActive && (
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"10px 24px", background: darkMode ? "rgba(248,113,113,0.15)" : "rgba(220,38,38,0.08)",
          borderBottom:`1px solid ${darkMode ? "rgba(248,113,113,0.35)" : "rgba(220,38,38,0.18)"}`,
        }}>
          <span style={{ fontSize:13, color:G.coral, flex:1 }}>{gmailSyncError}</span>
          {onRefreshEmails && (
            <button onClick={onRefreshEmails} disabled={fetchingEmails}
              style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${G.coral}`, background:"transparent", color:G.coral, fontSize:12, fontWeight:700, cursor:fetchingEmails?"default":"pointer" }}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* ── Banner de conexión cuando no hay cuenta ni correos ─────────── */}
      {!isConnected && (
        <div style={{ flexShrink:0, padding:"12px 24px", borderBottom:`1px solid ${G.border}`,
          background: darkMode ? "rgba(37,99,235,0.06)" : "rgba(37,99,235,0.04)",
          display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:12, color:G.textSecondary, flex:1 }}>
            Conecta tu Gmail para leer y gestionar correos desde aquí.
          </span>
          <button onClick={handleConectar} disabled={conectando}
            style={{ padding:"8px 16px", borderRadius:9, background: conectando ? G.border : G.accent,
              color:"#fff", border:"none", fontSize:12, fontWeight:700, cursor:conectando?"default":"pointer", flexShrink:0 }}>
            {conectando ? "Conectando…" : "Conectar correo"}
          </button>
        </div>
      )}

      {/* Contenido: dos columnas */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── Izquierda: lista de correos ───────────────────────────────── */}
        <div style={{ flex:1, overflowY:"auto", padding:"10px 24px 32px" }}>
          {fetchingEmails ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:200, gap:10 }}>
              <IcoSpinner />
              <span style={{ fontSize:13, color:G.textTertiary }}>Cargando correos desde Gmail…</span>
            </div>
          ) : visibles.length === 0 && isConnected && !hasRealEmails ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:200, gap:12 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.4}}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span style={{ fontSize:14, fontWeight:700, color:G.textSecondary }}>Sin correos recientes</span>
              <span style={{ fontSize:12, color:G.textTertiary, textAlign:"center", maxWidth:280 }}>No se encontraron mensajes de los últimos 3 días en tu bandeja de entrada.</span>
              <button onClick={onRefreshEmails} style={{ marginTop:4, padding:"8px 18px", borderRadius:10, border:`1px solid ${G.accent}`, background:"transparent", color:G.accent, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                Buscar de nuevo
              </button>
            </div>
          ) : visibles.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:200, gap:10 }}>
              <span style={{ color:G.textTertiary, opacity:0.35 }}><IcoMail /></span>
              <span style={{ fontSize:13, color:G.textTertiary }}>No hay correos en esta categoría</span>
            </div>
          ) : vistaMode === "resumen" ? (
            /* ── Vista Resumen IA ─────────────────────────────────────────── */
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:11, fontWeight:700, color:G.accent }}>
                  {visibles.filter(c=>!c.leido).length} sin leer
                </span>
                <span style={{ fontSize:10, color:G.textTertiary }}>
                  · Marca como leído o responde para quitarlos del dashboard
                </span>
              </div>
              {visibles.map(correo => (
                <ResumenCard
                  key={correo.id}
                  correo={correo}
                  cargandoResumen={cargandoResumenes && !correo.resumen}
                  respondiendo={respondiendo?.id === correo.id ? respondiendo : null}
                  googleConnectedEmail={googleConnectedEmail}
                  onAbrir={() => window.open(gmailSearchUrl(correo, googleConnectedEmail), "_blank")}
                  onMarcarLeido={() => marcarLeido(correo.id)}
                  onEliminar={() => eliminarCorreo(correo.id)}
                  onResponder={() => iniciarRespuesta(correo)}
                  onEnviar={() => enviarRespuesta(correo)}
                  onCancelar={() => setRespondiendo(null)}
                  onGuardarProyecto={() => setModalProyecto(correo)}
                />
              ))}
            </div>
          ) : (
            /* ── Vista Lista ──────────────────────────────────────────────── */
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {visibles.map(correo => (
                <CorreoCard
                  key={correo.id}
                  correo={correo}
                  seleccionado={seleccionados.has(correo.id)}
                  cargandoResumen={cargandoResumenes && !correo.resumen}
                  respondiendo={respondiendo?.id === correo.id ? respondiendo : null}
                  googleConnectedEmail={googleConnectedEmail}
                  onToggle={() => toggleSel(correo.id)}
                  onMarcarLeido={() => marcarLeido(correo.id)}
                  onEliminar={() => eliminarCorreo(correo.id)}
                  onAbrir={() => window.open(gmailSearchUrl(correo, googleConnectedEmail), "_blank")}
                  onResponder={() => iniciarRespuesta(correo)}
                  onEnviar={() => enviarRespuesta(correo)}
                  onCancelar={() => setRespondiendo(null)}
                  onGuardarProyecto={() => setModalProyecto(correo)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Derecha: Panel Resumen IA del Día ────────────────────────────── */}
        <div className="correos-right-panel" style={{
          width: 300, flexShrink: 0,
          borderLeft: `1px solid ${G.border}`,
          background: G.surface,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Cabecera del panel */}
          <div style={{
            padding: "13px 14px 10px",
            borderBottom: `1px solid ${G.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={G.accent} style={{flexShrink:0}}>
                <path d="M12 3C12 3 13.8 8.6 19.2 11C13.8 13.4 12 19 12 19C12 19 10.2 13.4 4.8 11C10.2 8.6 12 3 12 3Z"/>
              </svg>
              <span style={{ fontSize:12, fontWeight:700, color:G.textPrimary }}>Asistente IA</span>
            </div>
            <div style={{ display:"flex", gap:4 }}>
              {/* Botón clasificar prioridad */}
              <button
                onClick={clasificarTodos}
                disabled={clasificando || !cfgApiKey}
                title="Clasificar correos por prioridad IA"
                style={{
                  display:"flex", alignItems:"center", gap:3,
                  padding:"5px 8px", borderRadius:7,
                  background: clasificando ? G.amberSoft : "rgba(255,149,0,0.10)",
                  color: G.amber,
                  border: `1px solid ${G.amber}44`,
                  fontSize:10, fontWeight:700,
                  cursor: (clasificando || !cfgApiKey) ? "default" : "pointer",
                  opacity: !cfgApiKey ? 0.5 : 1,
                }}
              >
                {clasificando ? <IcoSpinner /> : <span>⚡</span>}
                <span style={{ marginLeft:1 }}>{clasificando ? "…" : "Clasificar"}</span>
              </button>
              {/* Botón resumen */}
              <button
                onClick={generarResumenPanel}
                disabled={panelIA.loading || !cfgApiKey}
                style={{
                  display:"flex", alignItems:"center", gap:4,
                  padding:"5px 10px", borderRadius:7,
                  background: panelIA.loading ? G.accentSoft : G.accent,
                  color: panelIA.loading ? G.accent : "#fff",
                  border: `1px solid ${G.accent}`,
                  fontSize:10, fontWeight:700,
                  cursor: (panelIA.loading || !cfgApiKey) ? "default" : "pointer",
                  opacity: !cfgApiKey ? 0.5 : 1,
                }}
              >
                {panelIA.loading ? <IcoSpinner /> : <IcoBrain />}
                <span style={{ marginLeft:2 }}>{panelIA.loading ? "…" : "Resumen"}</span>
              </button>
            </div>
          </div>

          {/* Cuerpo del panel */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px 14px 24px" }}>

            {/* Estado: cargando */}
            {panelIA.loading && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:120, gap:8 }}>
                <IcoSpinner />
                <span style={{ fontSize:11, color:G.textTertiary }}>Analizando correos…</span>
              </div>
            )}

            {/* Estado: error */}
            {panelIA.error && !panelIA.loading && (
              <div style={{ fontSize:11, color:G.coral, background:G.coralSoft, border:`1px solid ${G.coral}33`, borderRadius:8, padding:"8px 10px" }}>
                {panelIA.error}
              </div>
            )}

            {/* Estado: vacío (sin datos aún) */}
            {!panelIA.loading && !panelIA.error && !panelIA.data && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:160, gap:10 }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.35}}>
                  <path d="M12 3C12 3 13.8 8.6 19.2 11C13.8 13.4 12 19 12 19C12 19 10.2 13.4 4.8 11C10.2 8.6 12 3 12 3Z"/>
                </svg>
                <span style={{ fontSize:11, color:G.textTertiary, textAlign:"center", lineHeight:1.5 }}>
                  Genera un resumen IA de tus correos del día
                </span>
                {!cfgApiKey && (
                  <span style={{ fontSize:10, color:G.amber, textAlign:"center", lineHeight:1.4 }}>
                    Configura la API Key en Ajustes
                  </span>
                )}
              </div>
            )}

            {/* Estado: datos disponibles */}
            {!panelIA.loading && panelIA.data && (
              <>
                {/* Resumen general */}
                {panelIA.data.resumenGeneral && (
                  <div style={{
                    background: G.accentSoft, border:`1px solid ${G.accent}22`,
                    borderRadius:10, padding:"10px 12px", marginBottom:14,
                  }}>
                    <div style={{ fontSize:9.5, fontWeight:700, color:G.accent, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:5 }}>
                      Resumen general
                    </div>
                    <p style={{ fontSize:11.5, color:G.textPrimary, lineHeight:1.6, margin:0 }}>
                      {panelIA.data.resumenGeneral}
                    </p>
                  </div>
                )}

                {/* Por categorías */}
                {panelIA.data.categorias?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:9.5, fontWeight:700, color:G.textTertiary, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:7 }}>
                      Por categoría
                    </div>
                    {panelIA.data.categorias.map((cat, i) => (
                      <div key={i} style={{
                        borderRadius:9, border:`1px solid ${G.border}`,
                        background: G.bg, padding:"8px 10px", marginBottom:6,
                      }}>
                        <div style={{ fontSize:11, fontWeight:700, color:G.textPrimary, marginBottom:3 }}>
                          {cat.nombre}
                        </div>
                        {cat.resumen && (
                          <p style={{ fontSize:11, color:G.textSecondary, lineHeight:1.5, margin:"0 0 4px" }}>
                            {cat.resumen}
                          </p>
                        )}
                        {cat.acciones?.length > 0 && (
                          <div style={{ marginTop:5 }}>
                            {cat.acciones.map((a, j) => (
                              <div key={j} style={{ display:"flex", alignItems:"flex-start", gap:5, marginBottom:3 }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={G.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0, marginTop:2}}>
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <span style={{ fontSize:10.5, color:G.textSecondary, lineHeight:1.45 }}>{a}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {cat.archivos?.length > 0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginTop:6 }}>
                            {cat.archivos.map((f, j) => (
                              <span key={j} style={{
                                fontSize:9.5, fontWeight:600,
                                background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                color:G.textTertiary, borderRadius:5, padding:"2px 6px",
                                fontFamily:"monospace",
                              }}>
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Documentos detectados */}
                {panelIA.data.archivosDetectados?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:9.5, fontWeight:700, color:G.textTertiary, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:7 }}>
                      Documentos detectados
                    </div>
                    {panelIA.data.archivosDetectados.map((item, i) => {
                      const guardado = savedFiles.some(f => f.id === item.id);
                      return (
                        <div key={i} style={{
                          borderRadius:9, border:`1px solid ${G.border}`,
                          background: G.surface, padding:"8px 10px",
                          marginBottom:6, display:"flex", alignItems:"flex-start", gap:8,
                        }}>
                          {/* Ícono de tipo */}
                          <div style={{
                            width:28, height:28, borderRadius:6, flexShrink:0,
                            background: item.esLaboral ? "rgba(0,113,227,0.10)" : "rgba(52,199,89,0.10)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                          }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                              stroke={item.esLaboral ? G.accent : G.green}
                              strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          {/* Info */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:10.5, fontWeight:600, color:G.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {item.sender}
                            </div>
                            <div style={{ fontSize:10, color:G.textTertiary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:1 }}>
                              {item.subj}
                            </div>
                            {item.archivos.length > 0 && (
                              <div style={{ display:"flex", flexWrap:"wrap", gap:2, marginTop:4 }}>
                                {item.archivos.map((ext, j) => (
                                  <span key={j} style={{
                                    fontSize:9, fontWeight:700,
                                    background: /dwg|dxf/.test(ext) ? "rgba(255,149,0,0.15)" :
                                                /pdf/.test(ext) ? "rgba(255,59,48,0.12)" : "rgba(0,0,0,0.06)",
                                    color: /dwg|dxf/.test(ext) ? G.amber :
                                           /pdf/.test(ext) ? G.coral : G.textTertiary,
                                    borderRadius:4, padding:"1px 5px", fontFamily:"monospace",
                                  }}>
                                    {ext}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Botón guardar */}
                          <button
                            onClick={() => guardarArchivo(item)}
                            disabled={guardado}
                            title={guardado ? "Ya guardado" : "Guardar referencia"}
                            style={{
                              flexShrink:0, width:26, height:26, borderRadius:6,
                              border:`1px solid ${guardado ? G.border : G.green}`,
                              background: guardado ? "transparent" : `${G.green}14`,
                              color: guardado ? G.textTertiary : G.green,
                              display:"flex", alignItems:"center", justifyContent:"center",
                              cursor: guardado ? "default" : "pointer",
                              transition:"all 0.15s",
                            }}
                          >
                            {guardado ? (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Archivos guardados — siempre visibles si hay alguno */}
            {savedFiles.length > 0 && (
              <div>
                <div style={{
                  fontSize:9.5, fontWeight:700, color:G.textTertiary,
                  letterSpacing:"0.06em", textTransform:"uppercase",
                  marginBottom:7,
                  paddingTop: panelIA.data ? 4 : 0,
                  borderTop: panelIA.data ? `1px solid ${G.border}` : "none",
                  marginTop: panelIA.data ? 4 : 0,
                }}>
                  Guardados ({savedFiles.length})
                </div>
                {savedFiles.slice(0, 5).map((item, i) => (
                  <div key={i} style={{
                    borderRadius:8, border:`1px solid ${G.border}`,
                    background: G.bg, padding:"6px 10px",
                    marginBottom:4, display:"flex", alignItems:"center", gap:6,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={G.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:10, fontWeight:600, color:G.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {item.sender}
                      </div>
                      <div style={{ fontSize:9.5, color:G.textTertiary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {item.subj}
                      </div>
                    </div>
                    <a href={item.gmailUrl} target="_blank" rel="noreferrer"
                      style={{ color:G.accent, flexShrink:0, display:"flex", alignItems:"center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>
                ))}
                {savedFiles.length > 5 && (
                  <div style={{ fontSize:10, color:G.textTertiary, textAlign:"center", marginTop:4 }}>
                    +{savedFiles.length - 5} más guardados
                  </div>
                )}
              </div>
            )}

            {/* ── Proyectos recibidos ───────────────────────────────────────── */}
            {proyectos.length > 0 && (
              <div style={{ marginTop: savedFiles.length > 0 ? 10 : 0 }}>
                <div style={{ fontSize:9.5, fontWeight:700, color:G.textTertiary, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:7, paddingTop:8, borderTop:`1px solid ${G.border}` }}>
                  📁 Proyectos guardados ({proyectos.length})
                </div>
                {proyectos.slice(0, 6).map((p, i) => (
                  <div key={i} style={{ borderRadius:8, border:`1px solid ${G.border}`, background:G.bg, padding:"6px 10px", marginBottom:4 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:G.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {p.cliente || p.senderName}
                    </div>
                    <div style={{ fontSize:9.5, color:G.accent, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {p.proyecto}
                    </div>
                    <div style={{ fontSize:9, color:G.textTertiary, marginTop:2, display:"flex", justifyContent:"space-between" }}>
                      <span>{p.filename?.split(".").pop()?.toUpperCase() || "FILE"} · {new Date(p.fecha).toLocaleDateString("es-CO", { day:"2-digit", month:"short" })}</span>
                      {p.carpeta && <span title={p.carpeta} style={{ overflow:"hidden", textOverflow:"ellipsis", maxWidth:80 }}>📂 {p.carpeta}</span>}
                    </div>
                  </div>
                ))}
                {proyectos.length > 6 && (
                  <div style={{ fontSize:10, color:G.textTertiary, textAlign:"center", marginTop:4 }}>+{proyectos.length - 6} más</div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Modal Guardar Proyecto ────────────────────────────────────────────────────
function ProyectoModal({ correo, gmailToken, googleConnectedEmail, cfg, darkMode, onCerrar, onGuardado }) {
  const MG = darkMode ? DARK_C : LIGHT_C;
  const [paso, setPaso]           = useState("cargando"); // cargando | revisar | guardando | listo | error
  const [adjuntos, setAdjuntos]   = useState([]);
  const [adjuntoSel, setAdjuntoSel] = useState(null);
  const [infoIA, setInfoIA]       = useState(null);
  const [carpetaHandle, setCarpetaHandle] = useState(null);
  const [carpetaNombre, setCarpetaNombre] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [errorMsg, setErrorMsg]   = useState("");
  const [guardandoMsg, setGuardandoMsg] = useState("");

  const hoy = new Date().toISOString().slice(0, 10);

  // ── Paso 1: cargar info al montar ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Adjuntos vía API
        let atts = [];
        if (gmailToken && correo.gmailId) {
          try {
            const full = await getMessageFull(gmailToken, correo.gmailId);
            atts = extractAttachments(full);
          } catch { /* sin adjuntos API */ }
        }
        setAdjuntos(atts);
        if (atts.length > 0) setAdjuntoSel(atts[0]);

        // Análisis IA del correo
        let info = { cliente: parseSender(correo.sender), proyecto: correo.subj, tipo: "Proyecto", descripcion: correo.body?.slice(0,120) || "" };
        if (cfg?.apiKey) {
          try {
            const resp = await callAI(
              `Analiza este correo y extrae la información del proyecto en JSON.
Remitente: ${correo.sender}
Asunto: ${correo.subj}
Cuerpo: ${(correo.body || "").slice(0, 500)}

Responde SOLO con este JSON (sin markdown):
{"cliente":"nombre del cliente o empresa","proyecto":"nombre o descripción del proyecto","tipo":"tipo de proyecto (cálculo estructural, diseño arquitectónico, presupuesto, etc.)","descripcion":"resumen en 1 frase"}`,
              cfg
            );
            const match = resp.match(/\{[\s\S]*\}/);
            if (match) info = { ...info, ...JSON.parse(match[0]) };
          } catch { /* usar info básica */ }
        }
        setInfoIA(info);

        // Nombre de archivo sugerido
        const ext = atts[0]?.filename?.split(".").pop() || "";
        const nombre = sanitizeFilename(`${hoy} - ${info.cliente} - ${info.proyecto}${ext ? "." + ext : ""}`);
        setNombreArchivo(nombre);

        // Carpeta guardada
        const handle = await getOrRequestFolderHandle();
        setCarpetaHandle(handle);
        if (handle) setCarpetaNombre(handle.name);
        else {
          const saved = await getSavedFolderName();
          if (saved) setCarpetaNombre(saved);
        }

        setPaso("revisar");
      } catch (e) {
        setErrorMsg(e.message || "Error al cargar información");
        setPaso("error");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function elegirCarpeta() {
    try {
      const handle = await pickProjectsFolder();
      setCarpetaHandle(handle);
      setCarpetaNombre(handle.name);
    } catch (e) {
      if (!e.message?.includes("aborted")) setErrorMsg(e.message);
    }
  }

  async function guardar() {
    if (!adjuntoSel && adjuntos.length === 0) {
      // No hay adjunto API — solo registrar metadatos
      onGuardado({ correoId:correo.id, senderName:parseSender(correo.sender), sender:correo.senderEmail||correo.sender, subj:correo.subj, cliente:infoIA?.cliente, proyecto:infoIA?.proyecto, tipo:infoIA?.tipo, filename:nombreArchivo, carpeta:carpetaNombre||"Descargas", fecha:new Date().toISOString() });
      return;
    }

    setPaso("guardando");
    try {
      const att = adjuntoSel || adjuntos[0];
      setGuardandoMsg(`Descargando ${att.filename}…`);
      const attData = await fetchAttachment(gmailToken, correo.gmailId, att.attachmentId);
      const blob    = base64ToBlob(attData.data, att.mimeType);

      // Nombre final con extensión correcta
      const ext = att.filename.includes(".") ? att.filename.split(".").pop() : "";
      const finalName = sanitizeFilename(
        nombreArchivo.includes(".") ? nombreArchivo : `${nombreArchivo}${ext ? "." + ext : ""}`
      );

      setGuardandoMsg(`Guardando ${finalName}…`);
      if (carpetaHandle) {
        await saveFileToFolder(carpetaHandle, finalName, blob);
      } else {
        downloadFallback(finalName, blob);
      }

      const meta = {
        correoId: correo.id, senderName: parseSender(correo.sender),
        sender: correo.senderEmail || correo.sender, subj: correo.subj,
        cliente: infoIA?.cliente, proyecto: infoIA?.proyecto,
        tipo: infoIA?.tipo, filename: finalName,
        carpeta: carpetaHandle ? carpetaHandle.name : "Descargas",
        fecha: new Date().toISOString(),
      };
      onGuardado(meta);
    } catch (e) {
      setErrorMsg(e.message || "Error al guardar");
      setPaso("error");
    }
  }

  const campo = { width:"100%", padding:"10px 12px", borderRadius:10, border:`1px solid ${MG.border}`, background:darkMode?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.03)", fontSize:13, color:MG.textPrimary, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(6px)" }}
      onClick={e => { if (e.target===e.currentTarget) onCerrar(); }}>
      <div style={{ background:darkMode?"#1c1c1e":"#ffffff", borderRadius:20, width:"100%", maxWidth:500, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.35)", border:`1px solid ${MG.border}` }}>

        {/* Header */}
        <div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${MG.border}`, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#ff9500", letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 }}>📁 Guardar Proyecto</div>
            <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:MG.textPrimary }}>{parseSender(correo.sender)}</h3>
            <p style={{ margin:"3px 0 0", fontSize:12, color:MG.textSecondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:380 }}>{correo.subj}</p>
          </div>
          <button onClick={onCerrar} style={{ background:"none", border:"none", cursor:"pointer", color:MG.textTertiary, fontSize:18, padding:4, lineHeight:1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px 20px" }}>

          {/* Cargando */}
          {paso === "cargando" && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:160, gap:12, color:MG.textTertiary }}>
              <IcoSpinner />
              <span style={{ fontSize:13 }}>Analizando correo con IA…</span>
            </div>
          )}

          {/* Error */}
          {paso === "error" && (
            <div style={{ padding:14, borderRadius:12, background:"rgba(255,59,48,0.08)", border:"1px solid rgba(255,59,48,0.2)", color:"#ff3b30", fontSize:13 }}>
              {errorMsg}
            </div>
          )}

          {/* Guardando */}
          {paso === "guardando" && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:160, gap:12, color:MG.textTertiary }}>
              <IcoSpinner />
              <span style={{ fontSize:13 }}>{guardandoMsg}</span>
            </div>
          )}

          {/* Revisar */}
          {paso === "revisar" && infoIA && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Info IA extraída */}
              <div style={{ padding:"12px 14px", borderRadius:12, background:darkMode?"rgba(255,149,0,0.08)":"rgba(255,149,0,0.06)", border:"1px solid rgba(255,149,0,0.2)" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#ff9500", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>✦ Información extraída por IA</div>
                <div style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:"5px 10px", fontSize:12 }}>
                  <span style={{ color:MG.textTertiary, fontWeight:600 }}>Cliente:</span>  <span style={{ color:MG.textPrimary, fontWeight:700 }}>{infoIA.cliente}</span>
                  <span style={{ color:MG.textTertiary, fontWeight:600 }}>Proyecto:</span> <span style={{ color:MG.textPrimary }}>{infoIA.proyecto}</span>
                  <span style={{ color:MG.textTertiary, fontWeight:600 }}>Tipo:</span>     <span style={{ color:MG.textPrimary }}>{infoIA.tipo}</span>
                  {infoIA.descripcion && <><span style={{ color:MG.textTertiary, fontWeight:600 }}>Resumen:</span><span style={{ color:MG.textSecondary, lineHeight:1.4 }}>{infoIA.descripcion}</span></>}
                </div>
              </div>

              {/* Adjuntos disponibles */}
              {adjuntos.length > 0 ? (
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:MG.textTertiary, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:7 }}>Archivo adjunto</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {adjuntos.map((a, i) => (
                      <div key={i} onClick={() => setAdjuntoSel(a)}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:10, border:`1.5px solid ${adjuntoSel?.attachmentId===a.attachmentId ? "#ff9500" : MG.border}`, background: adjuntoSel?.attachmentId===a.attachmentId ? "rgba(255,149,0,0.07)" : "transparent", cursor:"pointer" }}>
                        <IcoFolderDown />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:MG.textPrimary }}>{a.filename}</div>
                          <div style={{ fontSize:10, color:MG.textTertiary }}>{a.mimeType} · {(a.size/1024).toFixed(0)} KB</div>
                        </div>
                        {adjuntoSel?.attachmentId===a.attachmentId && <span style={{ color:"#ff9500", fontSize:14 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding:"10px 12px", borderRadius:10, background:darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)", border:`1px solid ${MG.border}`, fontSize:12, color:MG.textTertiary }}>
                  ℹ️ No se detectaron adjuntos en este correo vía API. Se guardará solo el registro del proyecto.
                </div>
              )}

              {/* Nombre del archivo */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:MG.textTertiary, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:7 }}>Nombre del archivo</label>
                <input value={nombreArchivo} onChange={e => setNombreArchivo(e.target.value)} style={campo} />
              </div>

              {/* Carpeta destino */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:MG.textTertiary, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:7 }}>Carpeta destino</label>
                {isFileSystemSupported() ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, padding:"10px 12px", borderRadius:10, border:`1px solid ${carpetaNombre ? "#ff9500" : MG.border}`, background: carpetaNombre ? "rgba(255,149,0,0.07)" : "transparent", fontSize:13, color: carpetaNombre ? "#ff9500" : MG.textTertiary, fontWeight: carpetaNombre ? 600 : 400 }}>
                      {carpetaNombre ? `📂 ${carpetaNombre}` : "No has elegido una carpeta aún"}
                    </div>
                    <button onClick={elegirCarpeta} style={{ padding:"10px 14px", borderRadius:10, border:`1px solid #ff9500`, background:"rgba(255,149,0,0.10)", color:"#ff9500", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                      {carpetaNombre ? "Cambiar" : "Elegir carpeta"}
                    </button>
                  </div>
                ) : (
                  <div style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${MG.border}`, fontSize:12, color:MG.textTertiary }}>
                    ⬇️ El archivo se descargará en tu carpeta de <strong>Descargas</strong> con el nombre indicado arriba. (Tu navegador no soporta selección de carpeta — usa Chrome o Edge para elegir destino)
                  </div>
                )}
              </div>

              {errorMsg && (
                <div style={{ fontSize:12, color:"#ff3b30", padding:"8px 12px", borderRadius:8, background:"rgba(255,59,48,0.08)" }}>{errorMsg}</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(paso === "revisar") && (
          <div style={{ padding:"14px 20px", borderTop:`1px solid ${MG.border}`, display:"flex", gap:8, justifyContent:"flex-end", flexShrink:0 }}>
            <button onClick={onCerrar} style={{ padding:"10px 18px", borderRadius:10, border:`1px solid ${MG.border}`, background:"transparent", color:MG.textTertiary, fontSize:13, fontWeight:600, cursor:"pointer" }}>
              Cancelar
            </button>
            <button onClick={guardar} style={{ padding:"10px 22px", borderRadius:10, border:"none", background:"#ff9500", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <IcoFolderDown /> {carpetaHandle ? `Guardar en ${carpetaHandle.name}` : adjuntos.length > 0 ? "Descargar archivo" : "Registrar proyecto"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Config de pestañas ────────────────────────────────────────────────────────
const TABS = [
  { id:"todos",          label:"Todos",          color:"#636366" },
  { id:"primario",       label:"Primarios",      color:"#0071e3" },
  { id:"actualizaciones",label:"Actualizaciones",color:"#34c759" },
  { id:"social",         label:"Social",         color:"#0a66c2" },
  { id:"promociones",    label:"Promociones",    color:"#ff9500" },
];

// ── Tarjeta Resumen IA ────────────────────────────────────────────────────────
const TAB_COLORS = { primario:"#0071e3", actualizaciones:"#34c759", social:"#0a66c2", promociones:"#ff9500" };

function ResumenCard({ correo, cargandoResumen, respondiendo, googleConnectedEmail,
  onAbrir, onMarcarLeido, onEliminar, onResponder, onEnviar, onCancelar, onGuardarProyecto }) {
  const [hovered, setHovered] = useState(false);
  const color    = senderColor(correo.sender);
  const ini      = getInitials(correo.sender);
  const nombre   = parseSender(correo.sender);
  const tabColor = TAB_COLORS[correo.tab ?? "primario"] ?? "#636366";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius:10, overflow:"hidden",
        border:`1px solid ${hovered ? `${tabColor}44` : (correo.leido ? G.border : `${tabColor}33`)}`,
        background: correo.leido ? G.surface : (G===DARK_C ? `${tabColor}0d` : `${tabColor}06`),
        opacity: correo.leido ? 0.55 : 1,
        borderLeft:`3px solid ${correo.leido ? G.border : tabColor}`,
        transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateX(4px)" : "translateX(0)",
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.07)" : "none",
      }}>
      {/* Fila compacta: avatar + info + hora */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px 6px" }}>
        {/* Avatar */}
        <div onClick={onAbrir} title="Abrir en Gmail"
          style={{ width:28, height:28, borderRadius:7, flexShrink:0, background:color,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:9, fontWeight:800, color:"#fff", cursor:"pointer" }}>
          {ini}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:11.5, fontWeight:correo.leido?500:700, color:G.textPrimary,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:140 }}>
              {nombre}
            </span>
            <span style={{ fontSize:9, fontWeight:700, color:tabColor,
              background:`${tabColor}18`, borderRadius:8, padding:"1px 6px", flexShrink:0 }}>
              {correo.tab ?? "primario"}
            </span>
            {!correo.leido && <div style={{ width:5, height:5, borderRadius:"50%", background:tabColor, flexShrink:0 }} />}
            <span style={{ fontSize:10, color:G.textTertiary, marginLeft:"auto", flexShrink:0 }}>{correo.time}</span>
          </div>
          <div style={{ fontSize:11, fontWeight:correo.leido?400:600, color:G.textSecondary,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:1 }}>
            {correo.subj}
          </div>
        </div>
      </div>

      {/* Bloque resumen compacto — badge IA estilo Stitch */}
      <div style={{ margin:"0 12px 6px", borderRadius:8,
        background: correo.resumen && !correo.resumen.startsWith("⚠")
          ? (G===DARK_C ? `${tabColor}14` : `${tabColor}09`)
          : (G===DARK_C ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)"),
        border:`1px solid ${correo.resumen && !correo.resumen.startsWith("⚠") ? `${tabColor}28` : G.border}`,
        padding:"6px 10px",
        display:"flex", alignItems:"flex-start", gap:6 }}>
        {correo.resumen && !correo.resumen.startsWith("⚠") && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill={tabColor} style={{ flexShrink:0, marginTop:1 }}>
            <path d="M12 3C12 3 13.8 8.6 19.2 11C13.8 13.4 12 19 12 19C12 19 10.2 13.4 4.8 11C10.2 8.6 12 3 12 3Z"/>
          </svg>
        )}
        {cargandoResumen ? (
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:10.5, color:G.textTertiary }}>
            <IcoSpinner />Generando resumen…
          </span>
        ) : correo.resumen && !correo.resumen.startsWith("⚠") ? (
          <span style={{
            fontSize:11,
            color: G===DARK_C
              ? (hovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)")
              : (hovered ? "#111111" : "#555555"),
            lineHeight:1.5,
            fontWeight: hovered ? 500 : 400,
            transition:"color 0.2s ease"
          }}>
            {correo.resumen}
          </span>
        ) : (
          <span style={{ fontSize:10.5, fontStyle:"italic", color:G.textTertiary }}>
            {correo.body ? correo.body.slice(0,160) + (correo.body.length>160?"…":"") : "Sin vista previa disponible"}
          </span>
        )}
      </div>

      {/* Acciones */}
      {!respondiendo ? (
        <div style={{ display:"flex", gap:4, padding:"0 12px 8px" }}>
          <ActionBtn ico={<IcoOpen />}  title="Abrir en Gmail"   color={G.accent} fn={onAbrir} />
          <ActionBtn ico={<IcoCheck />} title="Marcar leído"     color={G.green}  fn={onMarcarLeido} />
          <ActionBtn ico={<IcoReply />} title="Responder con IA" color={G.accent} fn={onResponder} />
          <ActionBtn ico={<IcoFolderDown />} title="Guardar proyecto" color="#ff9500" fn={onGuardarProyecto} />
          <ActionBtn ico={<IcoTrash />} title="Eliminar"         color={G.coral}  fn={onEliminar} />
        </div>
      ) : (
        <div style={{ margin:"0 12px 8px", borderRadius:8,
          background:G===DARK_C?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.025)",
          border:`1px solid ${G.accent}30` }}>
          <div style={{ padding:"5px 10px", borderBottom:`1px solid ${G.accent}20`,
            background:G===DARK_C?"rgba(10,132,255,0.08)":"rgba(0,113,227,0.05)",
            fontSize:9.5, fontWeight:700, color:G.accent, letterSpacing:"0.05em", textTransform:"uppercase" }}>
            Respuesta sugerida por IA
          </div>
          <div style={{ padding:"7px 10px" }}>
            {respondiendo.loading ? (
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:G.textTertiary }}>
                <IcoSpinner />Redactando…
              </div>
            ) : (
              <>
                <p style={{ fontSize:11, color:G.textSecondary, lineHeight:1.6, margin:0,
                  whiteSpace:"pre-wrap", maxHeight:100, overflowY:"auto" }}>
                  {respondiendo.draft}
                </p>
                <div style={{ display:"flex", gap:6, marginTop:6 }}>
                  <button onClick={e=>{e.stopPropagation();onEnviar();}}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
                      borderRadius:7, background:G.accent, color:"#fff", border:"none",
                      fontSize:11, fontWeight:700, cursor:"pointer" }}>
                    <IcoSend />Enviar en Gmail
                  </button>
                  <button onClick={e=>{e.stopPropagation();onCancelar();}}
                    style={{ padding:"5px 12px", borderRadius:7, background:"transparent",
                      color:G.textTertiary, border:`1px solid ${G.border}`,
                      fontSize:11, fontWeight:600, cursor:"pointer" }}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function bulkBtnStyle(G) {
  return { display:"flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:7,
    background:G.surface, border:`1px solid ${G.border}`, fontSize:11, fontWeight:600, cursor:"pointer", color:G.textSecondary };
}

// ── Tarjeta de correo (vista Lista — fila compacta) ───────────────────────────
function CorreoCard({ correo, seleccionado, cargandoResumen, respondiendo,
  googleConnectedEmail, onToggle, onMarcarLeido, onEliminar, onAbrir, onResponder, onEnviar, onCancelar, onGuardarProyecto }) {
  const [hover, setHover] = useState(false);
  const color  = senderColor(correo.sender);
  const ini    = getInitials(correo.sender);
  const nombre = parseSender(correo.sender);

  return (
    <div style={{ borderRadius:8, overflow:"hidden",
      border:`1px solid ${seleccionado ? `${G.accent}44` : G.border}`,
      background: seleccionado ? G.accentSoft : G.surface,
      opacity: correo.leido ? 0.55 : 1, transition:"opacity 0.2s" }}>

      {/* Fila única compacta */}
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px",
          background: hover ? (G===LIGHT_C?"rgba(0,0,0,0.013)":"rgba(255,255,255,0.025)") : "transparent",
          transition:"background 0.12s" }}>

        {/* Punto no-leído */}
        <div style={{ width:5, height:5, borderRadius:"50%", flexShrink:0,
          background: correo.leido ? "transparent" : G.accent }} />

        {/* Checkbox */}
        <div onClick={e => { e.stopPropagation(); onToggle(); }}
          style={{ width:14, height:14, borderRadius:4, flexShrink:0, cursor:"pointer",
            border:`1.5px solid ${seleccionado?G.accent:G.border}`,
            background:seleccionado?G.accent:"transparent",
            display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
          {seleccionado && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>

        {/* Avatar pequeño */}
        <div onClick={onAbrir}
          style={{ width:26, height:26, borderRadius:6, flexShrink:0, background:color,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:9, fontWeight:800, color:"#fff", cursor:"pointer" }}>
          {ini}
        </div>

        {/* Sender */}
        <span onClick={onAbrir} style={{ fontSize:11.5, fontWeight:correo.leido?500:700, color:G.textPrimary,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", width:130, flexShrink:0, cursor:"pointer" }}>
          {nombre}
        </span>

        {/* Asunto + snippet */}
        <span onClick={onAbrir} style={{ flex:1, fontSize:11, color:G.textSecondary,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", cursor:"pointer" }}>
          <span style={{ fontWeight: correo.leido?400:600 }}>{correo.subj}</span>
          {correo.body && <span style={{ color:G.textTertiary }}> — {correo.body.slice(0,80)}</span>}
        </span>

        {/* Badge prioridad IA */}
        {correo.prioridad && (() => {
          const m = PRIORIDAD_META[correo.prioridad];
          return m ? (
            <span style={{
              flexShrink:0, fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:5,
              background: G===DARK_C ? m.dark : m.bg, color: m.color,
              letterSpacing:"0.03em", textTransform:"uppercase",
            }}>{m.label}</span>
          ) : null;
        })()}

        {/* Indicador borrador creado */}
        {correo._draftCreado && (
          <span style={{ flexShrink:0, fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:5,
            background:"rgba(52,199,89,0.12)", color:"#34c759" }}>✓ Borrador</span>
        )}

        {/* Hora */}
        <span style={{ fontSize:10, color:G.textTertiary, flexShrink:0, width:52, textAlign:"right" }}>{correo.time}</span>

        {/* Acciones hover */}
        <div style={{ display:"flex", gap:3, flexShrink:0, opacity:hover?1:0, transition:"opacity 0.15s" }}>
          {[
            { ico:<IcoOpen />,       title:"Abrir",           color:G.accent,  fn:onAbrir },
            { ico:<IcoCheck />,      title:"Leído",           color:G.green,   fn:onMarcarLeido },
            { ico:<IcoReply />,      title:"Responder",       color:G.accent,  fn:onResponder },
            { ico:<IcoFolderDown />, title:"Guardar proyecto",color:"#ff9500", fn:onGuardarProyecto },
            { ico:<IcoTrash />,      title:"Eliminar",        color:G.coral,   fn:onEliminar },
          ].map(b => <ActionBtn key={b.title} ico={b.ico} title={b.title} color={b.color} fn={b.fn} />)}
        </div>
      </div>

      {/* Panel respuesta IA (solo si activo) */}
      {respondiendo && (
        <div style={{ margin:"0 10px 8px", borderRadius:8,
          background:G===DARK_C?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.025)",
          border:`1px solid ${G.accent}30` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
            borderBottom:`1px solid ${G.accent}20`,
            background:G===DARK_C?"rgba(10,132,255,0.08)":"rgba(0,113,227,0.05)",
            fontSize:9.5, fontWeight:700, color:G.accent, textTransform:"uppercase" }}>
            Respuesta IA
          </div>
          <div style={{ padding:"8px 10px" }}>
            {respondiendo.loading
              ? <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:G.textTertiary }}><IcoSpinner />Redactando…</div>
              : <>
                  <p style={{ fontSize:11, color:G.textSecondary, lineHeight:1.6, margin:0, whiteSpace:"pre-wrap", maxHeight:100, overflowY:"auto" }}>{respondiendo.draft}</p>
                  <div style={{ display:"flex", gap:6, marginTop:7, alignItems:"center" }}>
                    <button onClick={e=>{e.stopPropagation();onEnviar();}} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:7, background:G.accent, color:"#fff", border:"none", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                      <IcoSend />{correo?.gmailId ? "Guardar borrador" : "Abrir en Gmail"}
                    </button>
                    <button onClick={onCancelar} style={{ padding:"5px 12px", borderRadius:7, background:"transparent", color:G.textTertiary, border:`1px solid ${G.border}`, fontSize:11, cursor:"pointer" }}>Cancelar</button>
                  </div>
                </>}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ ico, title, color, fn }) {
  const [h, setH] = useState(false);
  return (
    <button title={title} onClick={e => { e.stopPropagation(); fn(); }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width:28, height:28, borderRadius:7, border:`1px solid ${h?color:G.border}`,
        background:h?`${color}18`:"transparent", color:h?color:G.textTertiary,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", transition:"all 0.15s" }}>
      {ico}
    </button>
  );
}
