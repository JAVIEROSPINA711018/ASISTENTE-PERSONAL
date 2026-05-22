// src/views/DashboardEmailPanel.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { getDynamicWorkspaceData } from "../lib/workspaceData.js";
import { callAI } from "../lib/ai.js";

// ── Utilidades ───────────────────────────────────────────────────────────────
function diaISO(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function parseSender(email) {
  const local = email.split("@")[0];
  return local.split(/[._-]/).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
function initials(email) {
  const p = parseSender(email).split(" ");
  return p.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : parseSender(email).slice(0,2).toUpperCase();
}
function avatarColor(email) {
  const pal = ["#0071e3","#34c759","#ff9500","#5e5ce6","#ff3b30","#24b495","#bf5af2","#0a66c2","#25d366"];
  let h = 0; for (let i=0;i<email.length;i++) h = email.charCodeAt(i)+((h<<5)-h);
  return pal[Math.abs(h)%pal.length];
}
function gmailSearchUrl(sender, auth) {
  const qs = auth ? `?authuser=${encodeURIComponent(auth)}` : "";
  return `https://mail.google.com/mail/${qs}#search/from:${sender}`;
}
function gmailComposeUrl(to, subj, body, auth) {
  const au = auth ? `?authuser=${encodeURIComponent(auth)}&` : "?";
  return `https://mail.google.com/mail/${au}view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(`Re: ${subj}`)}&body=${encodeURIComponent(body)}`;
}

// ── AI helpers (provider-agnostic) ───────────────────────────────────────────
const aiResumen   = (c, cfg) => callAI(
  `Asistente ejecutivo personal. Resume en UNA frase (máx 16 palabras, español, sin emojis) la acción clave de este correo.\nDe: ${c.sender}\nAsunto: ${c.subj}\nCuerpo: ${c.body}`, cfg);
const aiRespuesta = (c, cfg) => callAI(
  `Eres el asistente personal del Ing. Javier Ospina (Ing. Civil/Estructural, Colombia). Redacta una respuesta profesional breve en español: saludo formal, cuerpo conciso (2-3 oraciones), cierre y firma. Sin placeholders.\n\nDe: ${c.sender}\nAsunto: ${c.subj}\nContenido: ${c.body}`, cfg);

// ── Config de pestañas ────────────────────────────────────────────────────────
const TABS = [
  { id:"todos",          label:"Todos",         color:"#636366" },
  { id:"primario",       label:"Primarios",     color:"#0071e3" },
  { id:"actualizaciones",label:"Actualizaciones",color:"#34c759" },
  { id:"social",         label:"Social",        color:"#0a66c2" },
  { id:"promociones",    label:"Promociones",   color:"#ff9500" },
];

// ── Iconos ────────────────────────────────────────────────────────────────────
const IcoMail    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcoRefresh = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IcoCheck   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoTrash   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcoReply   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>;
const IcoOpen    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IcoSpin    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" style={{animation:"spin 1s linear infinite",transformOrigin:"center"}}/></svg>;
const IcoSend    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IcoWarn    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoChevron = ({ open }) => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points={open ? "6 9 12 15 18 9" : "6 15 12 9 18 15"}/></svg>;

// ── Componente principal ──────────────────────────────────────────────────────
export default function DashboardEmailPanel({ googleConnectedEmail, apiKey, aiConfig, onNavigate, darkMode, G, gmailEmails = [], fetchingEmails = false, onRefreshEmails }) {
  const cfg = aiConfig ?? { apiKey, provider: "gemini" };
  const hoyKey  = `cerebro_email_${diaISO(0)}`;
  const ayerKey = `cerebro_email_${diaISO(-1)}`;

  // Use real Gmail emails when available, otherwise fall back to mock data
  const hasRealEmails = gmailEmails.length > 0;
  const mockSrc = getDynamicWorkspaceData(googleConnectedEmail).gmail;
  const gmailSrc = hasRealEmails ? gmailEmails : mockSrc;

  const [estado,       setEstado]      = useState(() => { try { return JSON.parse(localStorage.getItem(hoyKey)||"{}"); } catch { return {}; } });
  const [cargando,     setCargando]    = useState(false);
  const [ultimaHora,   setUltimaHora]  = useState(estado.ultimaHora ?? null);
  const [errorMsg,     setErrorMsg]    = useState(null);
  const [tabActivo,    setTabActivo]   = useState("todos");
  const [ayerOpen,     setAyerOpen]    = useState(true);
  const [respondiendo, setRespondiendo]= useState(null); // { id, draft, loading }
  const intervalRef = useRef(null);

  // When real emails arrive, reset IA summaries state
  useEffect(() => {
    if (hasRealEmails) {
      setEstado({});
      setUltimaHora(null);
    }
  }, [hasRealEmails, gmailEmails.length]); // eslint-disable-line

  // Ayer — estado persistido (only used for mock mode)
  const ayerRaw = (() => { try { return JSON.parse(localStorage.getItem(ayerKey)||"{}"); } catch { return {}; } })();
  const ayerNoLeidos = hasRealEmails ? [] : (getDynamicWorkspaceData(googleConnectedEmail).gmail
    .map((m,i) => ({ ...m, id:`ayer-${i}` }))
    .filter(m => !(ayerRaw.leidos??[]).includes(m.id) && !(ayerRaw.eliminados??[]).includes(m.id)));

  // Correos hoy fusionados con estado
  const correos = gmailSrc.map((m,i) => ({
    ...m, id:`hoy-${i}`,
    leido:     (estado.leidos     ??[]).includes(`hoy-${i}`),
    eliminado: (estado.eliminados ??[]).includes(`hoy-${i}`),
    resumen:   (estado.resumenes  ??{})[`hoy-${i}`] ?? null,
  }));

  const persistir = useCallback((leidos, eliminados, resumenes, hora) => {
    const s = { leidos, eliminados, resumenes, ultimaHora: hora ?? estado.ultimaHora };
    localStorage.setItem(hoyKey, JSON.stringify(s)); setEstado(s);
  }, [hoyKey, estado.ultimaHora]);

  // IA: generar resúmenes
  const actualizarIA = useCallback(async () => {
    if (!cfg.apiKey) { setErrorMsg("Configure la API Key en Ajustes → API."); return; }
    if (onRefreshEmails) onRefreshEmails();
    setCargando(true); setErrorMsg(null);
    const leidos    = estado.leidos    ?? [];
    const eliminados= estado.eliminados?? [];
    const resumenes = { ...(estado.resumenes??{}) };
    try {
      await Promise.all(gmailSrc.map(async (m,i) => {
        const id = `hoy-${i}`;
        if (eliminados.includes(id)) return;
        try { resumenes[id] = await aiResumen(m, cfg); } catch (e) { resumenes[id]="⚠ " + (e.message ?? "Error"); }
      }));
      const hora = new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"});
      persistir(leidos, eliminados, resumenes, hora); setUltimaHora(hora);
    } catch (e) { setErrorMsg("Error IA: " + e.message); }
    finally { setCargando(false); }
  }, [cfg.apiKey, cfg.provider, cfg.baseUrl, cfg.model, gmailSrc, estado, persistir]); // eslint-disable-line

  useEffect(() => { clearInterval(intervalRef.current); intervalRef.current=setInterval(actualizarIA,3_600_000); return ()=>clearInterval(intervalRef.current); }, [actualizarIA]);
  useEffect(() => { if (cfg.apiKey && !estado.ultimaHora) actualizarIA(); }, []); // eslint-disable-line

  // Acciones hoy
  const marcarLeido = id => persistir([...(estado.leidos??[]),id], estado.eliminados??[], estado.resumenes??{}, null);
  const eliminar    = id => { persistir(estado.leidos??[], [...(estado.eliminados??[]),id], estado.resumenes??{}, null); if(respondiendo?.id===id) setRespondiendo(null); };

  // Acciones ayer
  const ayerMarcarLeido = id => { const s={...ayerRaw,leidos:[...(ayerRaw.leidos??[]),id]}; localStorage.setItem(ayerKey,JSON.stringify(s)); setEstado({...estado}); };
  const ayerEliminar    = id => { const s={...ayerRaw,eliminados:[...(ayerRaw.eliminados??[]),id]}; localStorage.setItem(ayerKey,JSON.stringify(s)); setEstado({...estado}); };

  // Respuesta IA
  const iniciarRespuesta = async correo => {
    if (!cfg.apiKey) { setErrorMsg("Configure la API Key en Ajustes → API."); return; }
    setRespondiendo({ id:correo.id, draft:null, loading:true });
    try { setRespondiendo({ id:correo.id, draft: await aiRespuesta(correo, cfg), loading:false }); }
    catch (e) { setRespondiendo(null); setErrorMsg("Error al redactar: " + (e.message ?? "desconocido")); }
  };
  const enviarRespuesta = correo => { window.open(gmailComposeUrl(correo.sender,correo.subj,respondiendo.draft,googleConnectedEmail),"_blank"); setRespondiendo(null); };

  // Filtrado por pestaña
  const filtrar = arr => tabActivo==="todos" ? arr : arr.filter(c => (c.tab ?? "primario") === tabActivo);

  const hoyVisibles  = filtrar(correos.filter(c => !c.eliminado && !c.leido));
  const ayerVisibles = filtrar(ayerNoLeidos);
  const sinLeerHoy   = correos.filter(c => !c.eliminado && !c.leido).length;

  // Conteos por pestaña para los badges
  const conteoPorTab = id => {
    const src = correos.filter(c=>!c.eliminado);
    return id==="todos" ? src.length : src.filter(c=>(c.tab??"primario")===id).length;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:G.surface, borderRadius:14, border:`1px solid ${G.border}`,
      boxShadow:darkMode?"none":"0 1px 3px rgba(0,0,0,0.05)", overflow:"hidden" }}>

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div style={{ padding:"12px 18px 0", borderBottom:`1px solid ${G.border}` }}>
        {/* Fila título */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <span style={{ color:G.accent }}><IcoMail /></span>
          <span style={{ fontSize:10, fontWeight:800, color:G.textTertiary, letterSpacing:"0.08em", textTransform:"uppercase" }}>
            Correos de Hoy
          </span>
          {sinLeerHoy > 0 && (
            <span style={{ fontSize:9.5, fontWeight:700, background:G.accent, color:"#fff", borderRadius:20, padding:"1px 7px" }}>
              {sinLeerHoy} sin leer
            </span>
          )}
          {ayerVisibles.length > 0 && (
            <span style={{ fontSize:9.5, fontWeight:700, background:"#ff9500", color:"#fff", borderRadius:20, padding:"1px 7px" }}
              title="Pendientes de ayer sin leer">
              {ayerVisibles.length} de ayer
            </span>
          )}
          {googleConnectedEmail && (
            <span style={{ fontSize:9.5, color:G.textTertiary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:150 }}>
              · {googleConnectedEmail}
            </span>
          )}
          <div style={{ flex:1 }} />
          {ultimaHora && !cargando && <span style={{ fontSize:9.5, color:G.textTertiary, flexShrink:0 }}>IA {ultimaHora}</span>}
          {onRefreshEmails && (
            <button onClick={onRefreshEmails} disabled={fetchingEmails}
              title="Buscar correos nuevos en Gmail"
              style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:7,
                background:"transparent", color:G.textTertiary, border:`1px solid ${G.border}`,
                fontSize:10, fontWeight:600, cursor:fetchingEmails?"default":"pointer", flexShrink:0 }}>
              {fetchingEmails ? <IcoSpin /> : <IcoRefresh />} {fetchingEmails ? "Cargando…" : "Correos"}
            </button>
          )}
          <button onClick={actualizarIA} disabled={cargando||!cfg.apiKey}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:7,
              background:G.accentSoft, color:G.accent, border:`1px solid ${G.accent}33`,
              fontSize:10, fontWeight:700, cursor:(cargando||!cfg.apiKey)?"default":"pointer", opacity:!cfg.apiKey?0.4:1, flexShrink:0 }}>
            {cargando ? <IcoSpin /> : <IcoRefresh />} {cargando?"Analizando…":"Actualizar IA"}
          </button>
          <button onClick={() => onNavigate("correos")}
            style={{ fontSize:10.5, color:G.accent, fontWeight:700, cursor:"pointer", border:"none", background:"none", padding:"4px 6px", flexShrink:0 }}>
            Ver todos →
          </button>
        </div>

        {/* Filtro pestañas Gmail */}
        <div style={{ display:"flex", gap:4, paddingBottom:10, overflowX:"auto" }}>
          {TABS.map(t => {
            const cnt = conteoPorTab(t.id);
            const active = tabActivo === t.id;
            return (
              <button key={t.id} onClick={() => setTabActivo(t.id)}
                style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:20, flexShrink:0,
                  background: active ? t.color : "transparent",
                  color: active ? "#fff" : G.textTertiary,
                  border: `1px solid ${active ? t.color : G.border}`,
                  fontSize:10, fontWeight:active?700:500, cursor:"pointer", transition:"all 0.15s" }}>
                {t.label}
                {cnt > 0 && (
                  <span style={{ fontSize:9, fontWeight:700,
                    background: active ? "rgba(255,255,255,0.25)" : `${t.color}22`,
                    color: active ? "#fff" : t.color,
                    borderRadius:10, padding:"1px 5px" }}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div style={{ fontSize:10.5, color:G.coral, background:`${G.coral}12`,
          borderBottom:`1px solid ${G.coral}22`, padding:"5px 18px" }}>
          {errorMsg}
        </div>
      )}

      {/* ── Sección AYER (ámbar, visualmente diferente) ───────────────────── */}
      {ayerVisibles.length > 0 && (
        <div style={{ borderLeft:"3px solid #ff9500",
          background: darkMode ? "rgba(255,149,0,0.07)" : "rgba(255,149,0,0.05)",
          borderBottom:`1px solid rgba(255,149,0,0.2)` }}>
          {/* Header ayer */}
          <button onClick={() => setAyerOpen(v=>!v)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:8,
              padding:"8px 16px", background:"transparent", border:"none", cursor:"pointer" }}>
            <span style={{ color:"#ff9500" }}><IcoWarn /></span>
            <span style={{ fontSize:10, fontWeight:800, color:"#ff9500", letterSpacing:"0.07em", flex:1, textTransform:"uppercase" }}>
              Pendientes de ayer · {ayerVisibles.length} sin leer
            </span>
            <span style={{ color:"#ff9500", opacity:0.7 }}><IcoChevron open={ayerOpen} /></span>
          </button>
          {ayerOpen && (
            <div style={{ maxHeight:148, overflowY:"auto" }}>
              {ayerVisibles.map((c,idx) => (
                <EmailRow key={c.id} correo={c} G={G} darkMode={darkMode}
                  isAyer esUltimo={idx===ayerVisibles.length-1}
                  cargandoResumen={false}
                  respondiendo={respondiendo?.id===c.id ? respondiendo : null}
                  googleConnectedEmail={googleConnectedEmail}
                  onAbrir={() => window.open(gmailSearchUrl(c.sender,googleConnectedEmail),"_blank")}
                  onLeido={() => ayerMarcarLeido(c.id)}
                  onEliminar={() => ayerEliminar(c.id)}
                  onResponder={() => iniciarRespuesta(c)}
                  onEnviar={() => enviarRespuesta(c)}
                  onCancelar={() => setRespondiendo(null)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sección HOY ─────────────────────────────────────────────────── */}
      {hoyVisibles.length > 0 && (
        <div style={{ borderLeft:"3px solid transparent" }}>
          {/* Separador de sección si también hay ayer */}
          {ayerVisibles.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 16px",
              borderBottom:`1px solid ${G.border}`,
              background: darkMode?"rgba(10,132,255,0.05)":"rgba(0,113,227,0.03)" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:G.accent }} />
              <span style={{ fontSize:10, fontWeight:700, color:G.accent, letterSpacing:"0.07em", textTransform:"uppercase" }}>
                Hoy · {hoyVisibles.length} correo{hoyVisibles.length!==1?"s":""} · {hoyVisibles.filter(c=>!c.leido).length} sin leer
              </span>
            </div>
          )}
          <div style={{ maxHeight: ayerVisibles.length>0 ? 200 : 280, overflowY:"auto" }}>
            {hoyVisibles.map((c,idx) => (
              <EmailRow key={c.id} correo={c} G={G} darkMode={darkMode}
                esUltimo={idx===hoyVisibles.length-1}
                cargandoResumen={cargando && !c.resumen}
                respondiendo={respondiendo?.id===c.id ? respondiendo : null}
                googleConnectedEmail={googleConnectedEmail}
                onAbrir={() => window.open(gmailSearchUrl(c.sender,googleConnectedEmail),"_blank")}
                onLeido={() => marcarLeido(c.id)}
                onEliminar={() => eliminar(c.id)}
                onResponder={() => iniciarRespuesta(c)}
                onEnviar={() => enviarRespuesta(c)}
                onCancelar={() => setRespondiendo(null)}
              />
            ))}
          </div>
        </div>
      )}

      {hoyVisibles.length === 0 && ayerVisibles.length === 0 && (
        <div style={{ padding:"20px 0", textAlign:"center", fontSize:12, color:G.textTertiary }}>
          Sin correos en esta pestaña
        </div>
      )}
    </div>
  );
}

// ── Fila de correo ────────────────────────────────────────────────────────────
function EmailRow({ correo, G, darkMode, isAyer, esUltimo,
  cargandoResumen, respondiendo, googleConnectedEmail,
  onAbrir, onLeido, onEliminar, onResponder, onEnviar, onCancelar }) {
  const [hov, setHov] = useState(false);
  const color  = avatarColor(correo.sender);
  const ini    = initials(correo.sender);
  const nombre = parseSender(correo.sender);
  const tab    = correo.tab ?? "primario";
  const tabCfg = TABS.find(t=>t.id===tab) ?? TABS[1];

  return (
    <div style={{ borderBottom: esUltimo && !respondiendo ? "none" : `1px solid ${isAyer?"rgba(255,149,0,0.15)":G.border}` }}>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px",
          background: hov ? (darkMode?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.014)") : "transparent",
          opacity: correo.leido ? 0.5 : 1, transition:"background 0.12s", cursor:"pointer" }}>

        {/* Indicador no-leído */}
        <div style={{ width:6, height:6, borderRadius:"50%", flexShrink:0,
          background: correo.leido ? "transparent" : (isAyer?"#ff9500":G.accent) }} />

        {/* Avatar */}
        <div onClick={onAbrir}
          style={{ width:28, height:28, borderRadius:7, background:color, flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:9.5, fontWeight:800, color:"#fff", cursor:"pointer" }}>
          {ini}
        </div>

        {/* Contenido */}
        <div onClick={onAbrir} style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11.5, fontWeight:correo.leido?500:700, color:G.textPrimary,
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:130 }}>
              {nombre}
            </span>
            {/* Badge de pestaña */}
            <span style={{ fontSize:9, fontWeight:700, color:tabCfg.color,
              background:`${tabCfg.color}18`, borderRadius:10, padding:"1px 6px", flexShrink:0 }}>
              {tabCfg.label}
            </span>
            <span style={{ fontSize:10.5, color:G.textTertiary, overflow:"hidden",
              textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
              {correo.subj}
            </span>
          </div>
          <div style={{ fontSize:10.5, color:G.textSecondary, overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:1, lineHeight:1.4 }}>
            {cargandoResumen
              ? <span style={{ color:G.textTertiary, display:"inline-flex", alignItems:"center", gap:4 }}><IcoSpin />generando…</span>
              : correo.resumen || <span style={{ fontStyle:"italic", color:G.textTertiary }}>Presione Actualizar IA</span>}
          </div>
        </div>

        {/* Hora */}
        <span style={{ fontSize:9.5, color:isAyer?"#ff9500":G.textTertiary, flexShrink:0, fontWeight:isAyer?600:400 }}>
          {isAyer?"ayer":correo.time}
        </span>

        {/* Botones hover */}
        <div style={{ display:"flex", gap:3, flexShrink:0, opacity:hov?1:0.15, transition:"opacity 0.15s" }}>
          {[
            { ico:<IcoOpen  />, title:"Abrir en Gmail",   c:G.accent, fn:onAbrir },
            { ico:<IcoCheck />, title:"Marcar leído",     c:G.green,  fn:onLeido },
            { ico:<IcoReply />, title:"Responder con IA", c:G.accent, fn:onResponder },
            { ico:<IcoTrash />, title:"Eliminar",         c:G.coral,  fn:onEliminar },
          ].map(b=><MiniBtn key={b.title} ico={b.ico} title={b.title} color={b.c} fn={b.fn} G={G}/>)}
        </div>
      </div>

      {/* Panel respuesta IA */}
      {respondiendo && (
        <div style={{ margin:"0 16px 10px", borderRadius:9,
          background:darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.025)",
          border:`1px solid ${G.accent}30` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px",
            borderBottom:`1px solid ${G.accent}20`,
            background:darkMode?"rgba(10,132,255,0.08)":"rgba(0,113,227,0.05)" }}>
            <span style={{ fontSize:9, fontWeight:800, color:G.accent, letterSpacing:"0.07em", textTransform:"uppercase", flex:1 }}>
              Respuesta sugerida por IA · {correo.sender}
            </span>
          </div>
          <div style={{ padding:"9px 12px" }}>
            {respondiendo.loading
              ? <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:G.textTertiary }}><IcoSpin />Redactando…</div>
              : <>
                  <p style={{ fontSize:11, color:G.textSecondary, lineHeight:1.6, margin:0,
                    whiteSpace:"pre-wrap", maxHeight:110, overflowY:"auto" }}>
                    {respondiendo.draft}
                  </p>
                  <div style={{ display:"flex", gap:8, marginTop:8 }}>
                    <button onClick={()=>{e=>e.stopPropagation(); onEnviar();}}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 13px",
                        borderRadius:7, background:G.accent, color:"#fff", border:"none",
                        fontSize:11, fontWeight:700, cursor:"pointer" }}>
                      <IcoSend /> Enviar en Gmail
                    </button>
                    <button onClick={onCancelar}
                      style={{ padding:"5px 13px", borderRadius:7, background:"transparent",
                        color:G.textTertiary, border:`1px solid ${G.border}`,
                        fontSize:11, fontWeight:600, cursor:"pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </>}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniBtn({ ico, title, color, fn, G }) {
  const [h, setH] = useState(false);
  return (
    <button title={title} onClick={e=>{e.stopPropagation();fn();}}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ width:24, height:24, borderRadius:6, cursor:"pointer",
        border:`1px solid ${h?color:G.border}`, background:h?`${color}18`:"transparent",
        color:h?color:G.textTertiary, display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 0.12s" }}>
      {ico}
    </button>
  );
}
