import { useState, useEffect, useMemo, useCallback } from "react";
import { callAI } from "../lib/ai.js";

// ── Temas — CRM Design System — RED=#901B2F  BLUE=#1F3A52 ────────────────────
import { LIGHT, DARK } from "../lib/theme.js";

// ── Utilidades de fecha ───────────────────────────────────────────────────────
function getHoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getLunesISO() {
  const d = new Date(); const dow = d.getDay();
  d.setDate(d.getDate() - ((dow + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getSieteDiasISO() {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmtPesos(n) {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n/1_000)}k`;
  return `$${n}`;
}
function getTituloTarea(t) { return t.datos?.titulo || t.titulo || t.texto || "Sin título"; }
function fmtFechaCorta(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  const hoy = getHoyISO();
  if (iso === hoy) return "Hoy";
  const man = (() => {
    const t = new Date(); t.setDate(t.getDate()+1);
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  })();
  if (iso === man) return "Mañana";
  return `${d} ${["","ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][m]}`;
}

// ── Iconos SVG ────────────────────────────────────────────────────────────────
const IcoCalendar   = ({c}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoCheckCircle= ({c}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IcoWallet     = ({c}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/></svg>;
const IcoMail       = ({c}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcoNote       = ({c}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IcoTask       = ({c}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>;
const IcoDollar     = ({c}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
const IcoEvent      = ({c}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoPlus       = ({c,s=20}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoVideo      = ({c}) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;

// ── Componente principal ──────────────────────────────────────────────────────
export default function ViewDashboard({
  items = [], onNavigate, onOpenDrawer, darkMode = false,
  apiKey = "", aiConfig, googleConnectedEmail = "",
  gmailEmails = [], fetchingEmails = false, onRefreshEmails,
}) {
  const G = darkMode ? DARK : LIGHT;

  // Reloj en vivo
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Índices de fecha
  const hoyISO    = useMemo(() => getHoyISO(), []);
  const en7ISO    = useMemo(() => getSieteDiasISO(), []);
  const mesActual = useMemo(() => hoyISO.slice(0, 7), [hoyISO]);

  // Datos derivados
  const tareasPendientes = useMemo(() => items.filter(i => (i.tipo==="tarea"||i.tipo==="recordatorio") && !i.hecho), [items]);
  const tareasTotal      = useMemo(() => items.filter(i => i.tipo==="tarea"||i.tipo==="recordatorio"), [items]);
  const tareasHechas     = useMemo(() => tareasTotal.filter(i => i.hecho), [tareasTotal]);
  const progresoTareas   = tareasTotal.length > 0 ? Math.round((tareasHechas.length / tareasTotal.length) * 100) : 0;

  const notas      = useMemo(() => items.filter(i => i.tipo==="nota"), [items]);
  const gastosMes  = useMemo(() => items.filter(i => i.tipo==="gasto" && i.creado?.startsWith(mesActual)), [items, mesActual]);
  const totalGastos= useMemo(() => gastosMes.reduce((s, i) => s+(Number(i.datos?.monto)||0), 0), [gastosMes]);
  const ingresosMes= useMemo(() => items.filter(i => i.tipo==="ingreso" && i.creado?.startsWith(mesActual)).reduce((s, i) => s+(Number(i.datos?.monto)||0), 0), [items, mesActual]);

  // Agenda: próximas tareas con fecha en los 7 días
  const agendaItems = useMemo(() =>
    tareasPendientes
      .filter(i => i.fecha && i.fecha.slice(0,10) >= hoyISO && i.fecha.slice(0,10) <= en7ISO)
      .sort((a, b) => (a.fecha||"").localeCompare(b.fecha||""))
      .slice(0, 4),
  [tareasPendientes, hoyISO, en7ISO]);

  const topTareas = useMemo(() => tareasPendientes.slice(0, 3), [tareasPendientes]);

  // ── Briefing IA ──────────────────────────────────────────────────────────────
  const [briefing, setBriefing] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cerebro_briefing") || "null"); } catch { return null; }
  });
  const [briefingCargando, setBriefingCargando] = useState(false);
  const [briefingError, setBriefingError] = useState(null);

  // Clave de API activa para cualquier proveedor seleccionado
  const activeKey = useMemo(() => {
    return aiConfig?.apiKey || apiKey || localStorage.getItem("gemini_api_key") || localStorage.getItem("ai_openai_key") || localStorage.getItem("ai_claude_key") || "";
  }, [aiConfig, apiKey]);

  const generarBriefing = useCallback(async () => {
    if (!activeKey || briefingCargando) return;
    setBriefingCargando(true);
    setBriefingError(null);
    try {
      const hoy = getHoyISO();
      const vencidas = tareasPendientes.filter(i => i.fecha && i.fecha.slice(0,10) < hoy);
      const paraHoy  = tareasPendientes.filter(i => i.fecha && i.fecha.slice(0,10) === hoy);
      const proximas = tareasPendientes.filter(i => i.fecha && i.fecha.slice(0,10) > hoy).slice(0, 5);
      const noLeidos = gmailEmails.filter(e => !e.leido && !e.eliminado);

      const fmtT = t => `- "${t.datos?.titulo || t.texto}" [${t.datos?.prioridad || "media"}${t.datos?.hora ? ` @ ${t.datos.hora}` : ""}]`;

      const prompt = `Eres el asistente personal del Ing. Javier Ospina. Genera un briefing ejecutivo en español para el día de hoy (${hoy}).

TAREAS VENCIDAS (${vencidas.length}):
${vencidas.slice(0,5).map(fmtT).join("\n") || "Ninguna"}

TAREAS PARA HOY (${paraHoy.length}):
${paraHoy.map(fmtT).join("\n") || "Ninguna programada"}

PRÓXIMAS TAREAS (${proximas.length}):
${proximas.map(fmtT).join("\n") || "Sin tareas próximas"}

CORREOS NO LEÍDOS: ${noLeidos.length}${noLeidos.length > 0 ? `\n${noLeidos.slice(0,3).map(e => `- "${e.subj}" de ${e.sender}`).join("\n")}` : ""}

Responde en JSON con este formato exacto:
{
  "resumen": "2-3 frases ejecutivas del panorama del día",
  "urgentes": [{"texto": "ítem urgente", "tipo": "vencida|hoy|correo", "prioridad": "alta|media"}],
  "recomendacion": "una recomendación clave de acción inmediata"
}`;

      const cfg = aiConfig || { apiKey: activeKey, provider: "gemini" };
      if (!cfg.apiKey) cfg.apiKey = activeKey;

      const txt = await callAI(prompt, cfg);
      const jsonMatch = txt.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Respuesta inválida de la IA");
      const data = JSON.parse(jsonMatch[0]);
      data.generado = new Date().toISOString();
      setBriefing(data);
      localStorage.setItem("cerebro_briefing", JSON.stringify(data));
    } catch(e) {
      console.error("Error al generar briefing:", e);
      const raw = e.message || "";
      let msg = raw;
      if (raw.toLowerCase().includes("failed to fetch")) {
        msg = "Error de Red: No se pudo conectar con el proveedor de IA. " +
              (aiConfig?.provider === "claude" 
                ? "La API oficial de Anthropic (Claude) bloquea peticiones directas desde el navegador debido a políticas de CORS. Te recomendamos usar OpenRouter (OpenAI-compatible) en Ajustes → API." 
                : "Verifica tu conexión a internet, si un bloqueador de publicidad o DNS está impidiendo la llamada, o si el servidor de la IA está temporalmente inactivo.");
      } else if (raw.toLowerCase().includes("api key not valid") || raw.toLowerCase().includes("invalid api key")) {
        msg = "API Key inválida. Vaya a Ajustes → API y verifique la clave.";
      } else if (raw.includes("Sin API Key")) {
        msg = "Configure su API Key en Ajustes → API.";
      }
      setBriefingError(msg);
    } finally {
      setBriefingCargando(false);
    }
  }, [activeKey, aiConfig, tareasPendientes, gmailEmails, briefingCargando]);

  // Auto-generar briefing al montar si hay activeKey y no hay uno reciente
  useEffect(() => {
    if (!activeKey) return;
    const ultimo = briefing?.generado ? new Date(briefing.generado) : null;
    const hace6h = new Date(Date.now() - 6 * 60 * 60 * 1000);
    if (!ultimo || ultimo < hace6h) {
      generarBriefing();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const topEmails = useMemo(() => {
    const activos = gmailEmails.filter(e => !e.eliminado);
    const noLeidos = activos.filter(e => !e.leido);
    return (noLeidos.length > 0 ? noLeidos : activos).slice(0, 3);
  }, [gmailEmails]);

  // Mini gráfico de gastos (últimos 6 meses)
  const miniBarHeights = useMemo(() => {
    const meses = Array.from({length: 6}, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5-i));
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    });
    const vals = meses.map(m => items.filter(i => i.tipo==="gasto" && i.creado?.startsWith(m)).reduce((s, i) => s+(Number(i.datos?.monto)||0), 0));
    const mx = Math.max(...vals, 1);
    return vals.map(v => Math.max(8, Math.round((v/mx)*100)));
  }, [items]);

  // Saludo dinámico
  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 12) return "¡Buenos días";
    if (h < 19) return "¡Buenas tardes";
    return "¡Buenas noches";
  }, [now]);
  const dateLabel = useMemo(() => now.toLocaleDateString("es-CO", { weekday:"long", day:"numeric", month:"long" }), [now]);
  const timeLabel = useMemo(() => now.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" }), [now]);

  // Nombre corto del usuario
  const userName = useMemo(() => {
    if (!googleConnectedEmail) return "";
    const name = googleConnectedEmail.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [googleConnectedEmail]);

  // ── Estilos base ────────────────────────────────────────────────────────────
  const glassCard = {
    background: darkMode ? G.glass : "#ffffff",
    border: `1px solid ${G.glassBorder}`,
    borderRadius: 20,
    boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.28)" : "0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
  };

  function onCardIn(e)  { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = darkMode ? "0 12px 40px rgba(0,0,0,0.45)" : "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)"; }
  function onCardOut(e) { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = darkMode ? "0 4px 20px rgba(0,0,0,0.28)"  : "0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)"; }

  const AGENDA_COLORS = [G.accent, G.amber, G.purple, G.textTertiary];
  const EMAIL_BORDERS = [G.amber, G.teal, G.purple];

  return (
    <div className="view-scroll-pad" style={{ flex: 1, overflowY: "auto", paddingBottom: 120, background: "transparent", transition: "background 0.25s" }}>

      {/* ── Encabezado de saludo — texto directo, sin caja ───────────────────── */}
      <header className="apple-hero-container" style={{ position:"relative" }}>
        <h2 className="apple-hero-title">
          {greeting}{userName ? `, ${userName}` : ""}!
        </h2>
        <p className="apple-hero-subtitle">
          <span style={{ textTransform: "capitalize" }}>{dateLabel}</span>
          <span className="apple-hero-clock"> · {timeLabel}</span>
        </p>
        {activeKey && (
          <button
            onClick={generarBriefing}
            disabled={briefingCargando}
            style={{
              position:"absolute", top:0, right:0,
              height:32, padding:"0 14px", borderRadius:10,
              border:`1px solid ${briefingCargando ? G.border : G.accent}`,
              background:"transparent", color: briefingCargando ? G.textTertiary : G.accent,
              fontWeight:600, fontSize:12, cursor: briefingCargando ? "default" : "pointer",
              display:"flex", alignItems:"center", gap:6, transition:"all 0.15s",
            }}
          >
            <span style={{ fontSize:13 }}>{briefingCargando ? "⟳" : "↻"}</span>
            {briefingCargando ? "Actualizando…" : "Actualizar Dashboard"}
          </button>
        )}
      </header>

      {/* ── Bento Grid 3 columnas ────────────────────────────────────────────── */}
      <div className="apple-card-grid">

        {/* ── Tarjeta 1: Agenda y Reuniones (doble altura) ─────────────────── */}
        <section className="apple-card apple-bento-main" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: G.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <IcoCalendar c={G.accent}/>
              Agenda y Reuniones
            </h4>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {agendaItems.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: G.textTertiary, padding: "24px 0" }}>
                <IcoCalendar c={G.textTertiary}/>
                <span style={{ fontSize: 13 }}>Sin eventos próximos</span>
                <span style={{ fontSize: 11, color: G.textTertiary }}>Los próximos 7 días están libres</span>
              </div>
            ) : agendaItems.map((t, i) => {
              const color     = AGENDA_COLORS[i] || G.textTertiary;
              const isFirst   = i === 0;
              const faded     = i === agendaItems.length - 1 && i > 1;
              const fechaDate = t.fecha ? new Date(t.fecha + "T12:00:00") : null;
              const dia       = fechaDate ? fechaDate.getDate() : "?";
              const mesCorto  = fechaDate ? ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][fechaDate.getMonth()] : "";

              return (
                <div key={t.id||i}
                  style={{
                    display: "flex", gap: 12, padding: "10px 12px",
                    background: isFirst ? `${G.accent}08` : "transparent",
                    borderRadius: 12,
                    border: `1px solid ${isFirst ? G.accent+"18" : "transparent"}`,
                    opacity: faded ? 0.5 : 1,
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isFirst) e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.04)" : G.surfaceLow; }}
                  onMouseLeave={e => { if (!isFirst) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Cuadro de fecha */}
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>{dia}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{mesCorto}</span>
                  </div>

                  {/* Texto */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: G.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {getTituloTarea(t)}
                    </p>
                    <p style={{ fontSize: 12, color: G.textTertiary, margin: "2px 0 0" }}>
                      {fmtFechaCorta(t.fecha?.slice(0,10))}
                    </p>
                    {isFirst && (
                      <button
                        onClick={() => onNavigate("tareas")}
                        className="apple-btn-pill"
                        style={{ marginTop: 6, fontSize: 10, padding: "4px 12px" }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <IcoVideo c="#fff"/>
                          Ver tarea
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onNavigate("calendario")}
            className="apple-btn-pill-secondary"
            style={{ marginTop: 16, width: "100%" }}
          >
            Ver Calendario Completo
          </button>
        </section>

        {/* ── Tarjeta 2: Tareas Activas ────────────────────────────────────── */}
        <section className="apple-card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: G.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <IcoCheckCircle c={G.accent}/>
              Tareas Activas
            </h4>
            <span style={{ fontSize: 24, fontWeight: 800, color: G.accent, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {progresoTareas}%
            </span>
          </div>

          {/* Barra de progreso elegante */}
          <div className="apple-progress-bar" style={{ marginBottom: 18 }}>
            <div className="apple-progress-fill" style={{ width: `${progresoTareas}%` }} />
          </div>

          {/* Lista de tareas */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {topTareas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: G.textTertiary, fontSize: 12 }}>
                Sin tareas pendientes
              </div>
            ) : topTareas.map((t, i) => (
              <div key={t.id||i}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                  borderRadius: 12, cursor: "pointer",
                  border: `1px solid ${G.glassBorder}`,
                  transition: "background 0.15s",
                }}
                onClick={() => onNavigate("tareas")}
                onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"}
              >
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${G.accent}`, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: G.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {getTituloTarea(t)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tarjeta 3: Finanzas ──────────────────────────────────────────── */}
        <section className="apple-card-dark" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: G.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <IcoWallet c={G.green}/>
              Finanzas
            </h4>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>
              Gastos del Mes
            </p>
            <h5 style={{ fontSize: 32, fontWeight: 800, color: G.textPrimary, margin: 0, letterSpacing: "-0.03em" }}>
              {fmtPesos(totalGastos)}
            </h5>
          </div>

          {/* Chips ingresos / gastos */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Ingresos", value: `+${fmtPesos(ingresosMes)}`, color: G.green },
              { label: "Gastos",   value: `-${fmtPesos(totalGastos)}`, color: G.coral },
            ].map(chip => (
              <div key={chip.label} style={{
                flex: 1, padding: "8px 12px", borderRadius: 12,
                background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"}`,
              }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>{chip.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: chip.color, margin: 0 }}>{chip.value}</p>
              </div>
            ))}
          </div>

          {/* Mini gráfico de barras */}
          <div style={{ height: 52, display: "flex", alignItems: "flex-end", gap: 3, marginTop: "auto" }}>
            {miniBarHeights.map((h, i) => (
              <div key={i} style={{
                flex: 1, borderRadius: "3px 3px 0 0",
                background: i === miniBarHeights.length-1
                  ? G.green
                  : `${G.green}${i > 3 ? "66" : "33"}`,
                height: `${h}%`, transition: "height 0.5s ease",
              }}/>
            ))}
          </div>
        </section>

        {/* ── Tarjeta 4: Correos Importantes ──────────────────────────────── */}
        <section className="apple-card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: G.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <IcoMail c={G.amber}/>
              Correos Importantes
            </h4>
            <span className="apple-badge" style={{ background: G.amberSoft, color: G.amber, borderColor: `${G.amber}30` }}>
              Resumen IA
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {topEmails.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: G.textTertiary, fontSize: 12, textAlign: "center" }}>
                {googleConnectedEmail ? (fetchingEmails ? "Cargando correos…" : "Sin correos recientes") : "Conecta Gmail para ver correos"}
              </div>
            ) : topEmails.map((email, i) => {
              const borde  = EMAIL_BORDERS[i % 3];
              const sender = email.sender || email.de || "Desconocido";
              const subj   = email.subj   || email.asunto || email.subject || "(sin asunto)";
              const preview= email.resumen || email.body  || email.fragmento || email.snippet || "";
              return (
                <div key={email.id||i}
                  onClick={() => onNavigate("correos")}
                  style={{
                    display: "flex", gap: 10, padding: "9px 10px",
                    borderLeft: `3px solid ${borde}`,
                    background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    borderRadius: "0 10px 10px 0",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}
                >
                  {/* Dot no-leído */}
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: email.leido ? "transparent" : borde, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ fontSize: 12, fontWeight: email.leido ? 500 : 700, color: G.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {sender}
                      </p>
                      {email.time && <span style={{ fontSize: 10, color: G.textTertiary, flexShrink: 0 }}>{email.time}</span>}
                    </div>
                    <p style={{ fontSize: 11.5, fontWeight: email.leido ? 400 : 600, color: G.textSecondary, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {subj}
                    </p>
                    {preview && (
                      <p style={{ fontSize: 11, color: G.textTertiary, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {preview.slice(0, 90)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {googleConnectedEmail && (
            <div style={{ marginTop: 14 }}>
              <span onClick={() => onNavigate("correos")} className="apple-link-arrow">
                Ver todos los correos
              </span>
            </div>
          )}
        </section>

        {/* ── Tarjeta 5: Notas Recientes ───────────────────────────────────── */}
        <section className="apple-card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: G.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <IcoNote c={G.purple}/>
              Notas Recientes
            </h4>
            <button
              onClick={() => onNavigate("notas")}
              style={{ background: "none", border: "none", color: G.accent, cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
            >
              <IcoPlus c={G.accent} s={22}/>
            </button>
          </div>

          {notas.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: G.textTertiary, fontSize: 12, textAlign: "center" }}>
              Sin notas guardadas
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {notas.slice(0, 4).map((nota, i) => {
                const NC = [G.amber, G.purple, G.teal, G.accent][i % 4];
                return (
                  <div key={nota.id||i}
                    onClick={() => onNavigate("notas")}
                    style={{
                      padding: "10px 12px",
                      background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                      borderLeft: `3px solid ${NC}`,
                      borderRadius: "0 12px 12px 0",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"}
                  >
                    <h5 style={{ fontSize: 13, fontWeight: 700, color: G.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {nota.datos?.titulo || nota.titulo || "Nota"}
                    </h5>
                    <p style={{ fontSize: 11, color: G.textTertiary, margin: "3px 0 0", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {nota.datos?.contenido || nota.contenido || nota.texto || ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>{/* fin bento grid */}

      {/* ── Briefing IA del Día ─────────────────────────────────────────────── */}
      {activeKey && (
        <div style={{ marginTop: 32 }}>

          {/* ── Header: solo título ── */}
          <div style={{ marginBottom:14 }}>
            <h4 style={{ fontSize:11, fontWeight:600, color:G.textTertiary, margin:0, letterSpacing:"0.08em", textTransform:"uppercase" }}>✦ Briefing IA del Día</h4>
          </div>

          {briefingError && (
            <div style={{ padding:"12px 16px", borderRadius:14, background:darkMode?"rgba(255,69,58,0.12)":"rgba(255,59,48,0.07)", border:`1px solid ${darkMode?"rgba(255,69,58,0.25)":"rgba(255,59,48,0.2)"}`, color:G.coral, fontSize:13 }}>
              {briefingError}
            </div>
          )}

          {briefingCargando && !briefing && (
            <div style={{ padding:"20px", borderRadius:14, background: darkMode ? G.glass : "#ffffff", border:`1px solid ${G.glassBorder}`, display:"flex", alignItems:"center", gap:12, color:G.textTertiary, fontSize:13 }}>
              <span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⟳</span>
              Analizando tareas y correos del día…
            </div>
          )}

          {briefing && !briefingCargando && (
            <div style={{ ...glassCard, padding:"20px 24px" }}>
              {/* Resumen general */}
              <p style={{ fontSize:14, color:G.textPrimary, margin:"0 0 16px", lineHeight:1.6, fontWeight:500 }}>
                {briefing.resumen}
              </p>

              {/* Ítems urgentes */}
              {briefing.urgentes?.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:G.textTertiary, letterSpacing:"0.07em", margin:"0 0 8px", textTransform:"uppercase" }}>Atención inmediata</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {briefing.urgentes.map((u, i) => {
                      const isAlta = u.prioridad === "alta";
                      const dotColor = u.tipo === "vencida" ? G.coral : u.tipo === "correo" ? G.amber : G.accent;
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 12px", borderRadius:10, background: isAlta ? (darkMode?"rgba(255,69,58,0.08)":"rgba(255,59,48,0.05)") : (darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.02)"), border:`1px solid ${isAlta?(darkMode?"rgba(255,69,58,0.2)":"rgba(255,59,48,0.12)"):(darkMode?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)")}` }}>
                          <span style={{ width:7, height:7, borderRadius:"50%", background:dotColor, flexShrink:0, marginTop:5 }} />
                          <span style={{ fontSize:13, color:G.textPrimary, lineHeight:1.5 }}>{u.texto}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recomendación */}
              {briefing.recomendacion && (
                <div style={{ padding:"10px 14px", borderRadius:10, background: darkMode?"rgba(10,132,255,0.10)":"rgba(0,113,227,0.06)", border:`1px solid ${darkMode?"rgba(10,132,255,0.2)":"rgba(0,113,227,0.12)"}`, display:"flex", alignItems:"flex-start", gap:8 }}>
                  <span style={{ fontSize:14 }}>💡</span>
                  <span style={{ fontSize:13, color:G.accent, fontWeight:600, lineHeight:1.5 }}>{briefing.recomendacion}</span>
                </div>
              )}

              {/* Timestamp */}
              {briefing.generado && (
                <p style={{ fontSize:10, color:G.textTertiary, margin:"10px 0 0", textAlign:"right" }}>
                  Generado {new Date(briefing.generado).toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" })}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Acciones Rápidas ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: 36 }}>
        <h4 style={{ fontSize: 11, fontWeight: 600, color: G.textTertiary, marginBottom: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>Acciones rápidas</h4>
        <div className="dash-quick-grid">
          {[
            { label: "Nueva Tarea",     icon: <IcoTask    c="#fff"/>, iconBg: "#0071e3", action: () => onNavigate("tareas")     },
            { label: "Crear Nota",      icon: <IcoNote    c="#fff"/>, iconBg: "#ff9500", action: () => onNavigate("notas")      },
            { label: "Registrar Gasto", icon: <IcoDollar  c="#fff"/>, iconBg: "#34c759", action: () => onNavigate("finanzas")   },
            { label: "Nuevo Evento",    icon: <IcoEvent   c="#fff"/>, iconBg: "#5e5ce6", action: () => onNavigate("calendario") },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="apple-quick-action" style={{ border: "none" }}>
              <div className="apple-quick-action-icon" style={{ background: a.iconBg }}>
                {a.icon}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: G.textPrimary, letterSpacing: "-0.01em" }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
