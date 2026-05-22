// src/views/ViewTareas.jsx — Rediseño Stitch M3 v3 (referencia tareas html)
import { useState, useRef, useEffect } from "react";

// ── Paletas — CRM Design System ───────────────────────────────────────────────
import { LIGHT as LIGHT_T, DARK as DARK_T } from "../lib/theme.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid()    { return Math.random().toString(36).slice(2, 9); }
function nowISO() { return new Date().toISOString(); }
function hoyISO() { return new Date().toISOString().slice(0, 10); }
function semanaDe(dias) {
  const d = new Date(); d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}
function horaActual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

const COLUMNAS = [
  { id: "todo",       label: "POR HACER",   btnLabel: "Por Hacer",
    cardBg: "#fff5f5", cardBorder: "#fecaca", cardBgDark: "#1e0e0e", cardBorderDark: "rgba(239,68,68,0.22)" },
  { id: "inprogress", label: "EN PROGRESO", btnLabel: "En Progreso",
    cardBg: "#fffbeb", cardBorder: "#fde68a", cardBgDark: "#1a1500", cardBorderDark: "rgba(245,158,11,0.22)" },
  { id: "revision",   label: "EN REVISIÓN", btnLabel: "En Revisión",
    cardBg: "#eff6ff", cardBorder: "#bfdbfe", cardBgDark: "#0a1220", cardBorderDark: "rgba(37,99,235,0.22)" },
  { id: "hecho",      label: "COMPLETADO",  btnLabel: "Hecho",
    cardBg: "#f0fdf4", cardBorder: "#bbf7d0", cardBgDark: "#091a0e", cardBorderDark: "rgba(22,163,74,0.22)" },
];

const FASE_OPCIONES = [
  { value: "todo",       label: "Pendiente / Por Hacer",  color: "#d97706", bg: "rgba(245,158,11,0.12)" },
  { value: "inprogress", label: "Activo / En Progreso",   color: "#0059b5", bg: "rgba(0,89,181,0.10)" },
  { value: "revision",   label: "Revisión / En Espera",   color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
  { value: "hecho",      label: "Cerrado / Completado",   color: "#16a34a", bg: "rgba(22,163,74,0.10)" },
];
const PRIORIDAD_OPCIONES = [
  { value: "alta",  label: "Operaciones / Alta",  color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
  { value: "media", label: "Operaciones / Media", color: "#0059b5", bg: "rgba(0,89,181,0.10)" },
  { value: "baja",  label: "Operaciones / Baja",  color: "#16a34a", bg: "rgba(22,163,74,0.10)" },
];
const FLUJO_OPCIONES = ["Corporativo","Personal","Proyecto","Reunión","Recordatorio","Obra / NSR-10"];

function legacyToNew(item) {
  if (item.hecho)                return "hecho";
  if (item.columna === "hoy")    return "inprogress";
  if (item.columna === "semana") return "revision";
  return "todo";
}

// ── Iconos ────────────────────────────────────────────────────────────────────
const IcoPlus      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoMic       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>;
const IcoX         = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoTrash     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcoCheck     = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoSend      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IcoPencil    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTablero   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>;
const IcoLista     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IcoBento     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="11" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="16" width="8" height="5" rx="1"/></svg>;
const IcoCalendar  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoSort      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="9" y2="6"/><line x1="21" y1="14" x2="9" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>;
const IcoFlag      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;
const IcoEvent     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoChevron   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoLink      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IcoSearch    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoBolt      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/></svg>;
const IcoPriHigh   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoPriLow    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>;

// ── Modal Editar Tarea ────────────────────────────────────────────────────────
function ModalEditarTarea({ item, onCerrar, onGuardar, darkMode }) {
  const G = darkMode ? DARK_T : LIGHT_T;
  const [titulo,      setTitulo]      = useState(item.datos?.titulo || item.texto || "");
  const [descripcion, setDescripcion] = useState(item.datos?.descripcion || "");
  const [fase,        setFase]        = useState(item.datos?._kanban || legacyToNew(item));
  const [prioridad,   setPrioridad]   = useState(item.datos?.prioridad || "media");
  const [flujo,       setFlujo]       = useState(item.datos?.categoria || "Corporativo");
  const [fecha,       setFecha]       = useState(item.fecha?.slice(0, 10) || hoyISO());
  const [hora,        setHora]        = useState(item.datos?.hora || horaActual());
  const [responsable, setResponsable] = useState(item.datos?.responsable || "");
  const [recordatorio,setRecordatorio]= useState(item.datos?.recordatorio || "none");

  const faseOpt      = FASE_OPCIONES.find(p => p.value === fase);
  const prioridadOpt = PRIORIDAD_OPCIONES.find(p => p.value === prioridad);
  const campo = { width:"100%", padding:"14px 16px", borderRadius:12, border:"none", background:G.fieldBg, fontSize:14, outline:"none", color:G.textPrimary, boxSizing:"border-box", resize:"none", fontFamily:"inherit" };
  const label = { fontSize:11, fontWeight:700, color:G.textTertiary, letterSpacing:"0.07em", display:"block", marginBottom:8 };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}
      onClick={e => { if(e.target===e.currentTarget) onCerrar(); }}>
      <div style={{ background:G.glass, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderRadius:24, width:"100%", maxWidth:520, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,0.3)", border:`1px solid ${G.glassBorder}`, animation:"fadeIn 0.18s ease" }}>
        <div style={{ padding:"24px 24px 20px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            <div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:900, letterSpacing:"-0.02em", color:G.textPrimary }}>Editar Tarea</h2>
              <p style={{ margin:"4px 0 0", fontSize:12, color:G.textSecondary }}>Actualiza los parámetros de la tarea.</p>
            </div>
            <button onClick={onCerrar} style={{ background:"none", border:"none", cursor:"pointer", color:G.textTertiary, padding:4, display:"flex", borderRadius:8 }}><IcoX /></button>
          </div>
        </div>
        <div style={{ width:"100%", height:1, background:G.border, flexShrink:0 }} />
        <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
          <div style={{ marginBottom:18 }}><label style={label}>OBJETIVO</label><input type="text" autoFocus value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Título..." style={{ ...campo, fontWeight:600 }} /></div>
          <div style={{ marginBottom:20 }}><label style={label}>DESCRIPCIÓN</label><textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} rows={3} style={{ ...campo, lineHeight:1.5 }} /></div>
          <div className="modal-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
            <div><label style={label}>ESTADO</label><select value={fase} onChange={e=>setFase(e.target.value)} style={{ ...campo, background:faseOpt.bg, color:faseOpt.color, fontWeight:700, fontSize:12, appearance:"none" }}>{FASE_OPCIONES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div><label style={label}>PRIORIDAD</label><select value={prioridad} onChange={e=>setPrioridad(e.target.value)} style={{ ...campo, background:prioridadOpt.bg, color:prioridadOpt.color, fontWeight:700, fontSize:12, appearance:"none" }}>{PRIORIDAD_OPCIONES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          </div>
          <div className="modal-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
            <div><label style={label}>FLUJO</label><select value={flujo} onChange={e=>setFlujo(e.target.value)} style={{ ...campo, fontWeight:600, appearance:"none" }}>{FLUJO_OPCIONES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div><label style={label}>FECHA LÍMITE</label><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={{ ...campo, fontWeight:600, fontSize:12 }} /></div>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={label}>🔔 RECORDATORIO</label>
            <select value={recordatorio} onChange={e=>setRecordatorio(e.target.value)} style={{ ...campo, fontWeight:600, appearance:"none", border: recordatorio!=="none" ? `1.5px solid ${G.accent}` : undefined, background: recordatorio!=="none" ? G.accentSoft : G.fieldBg, color: recordatorio!=="none" ? G.accent : G.textPrimary }}>
              <option value="none">Sin recordatorio</option>
              <option value="0">En el momento exacto</option>
              <option value="15">15 minutos antes</option>
              <option value="30">30 minutos antes</option>
              <option value="60">1 hora antes</option>
              <option value="120">2 horas antes</option>
              <option value="1440">1 día antes</option>
              <option value="2880">2 días antes</option>
            </select>
            {recordatorio !== "none" && <p style={{ margin:"6px 0 0", fontSize:11, color:G.accent, fontWeight:600 }}>✓ El asistente le notificará {recordatorio==="0"?"al momento":recordatorio==="1440"?"1 día antes":recordatorio==="2880"?"2 días antes":`${recordatorio} min antes`} a las {hora}.</p>}
          </div>
          <div style={{ marginBottom:8 }}><label style={label}>RESPONSABLE</label><input type="text" value={responsable} onChange={e=>setResponsable(e.target.value)} placeholder="Sin asignar" style={{ ...campo, fontWeight:600 }} /></div>
        </div>
        <div style={{ padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:`1px solid ${G.border}`, flexShrink:0 }}>
          <button onClick={onCerrar} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, color:G.textTertiary, padding:"10px 16px" }}>Cancelar</button>
          <button onClick={()=>titulo.trim()&&onGuardar({titulo,descripcion,fase,prioridad,flujo,fecha,hora,responsable,recordatorio})} disabled={!titulo.trim()}
            style={{ height:44, padding:"0 24px", borderRadius:12, border:"none", background:titulo.trim()?G.accent:G.fieldBg, color:titulo.trim()?"#fff":G.textTertiary, fontWeight:700, fontSize:13, cursor:titulo.trim()?"pointer":"not-allowed", display:"flex", alignItems:"center", gap:8, transition:"all 0.15s" }}>
            Guardar <IcoSend />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Nueva Tarea ─────────────────────────────────────────────────────────
function ModalNuevaTarea({ onCerrar, onGuardar, darkMode, tituloInicial="" }) {
  const G = darkMode ? DARK_T : LIGHT_T;
  const [titulo,      setTitulo]      = useState(tituloInicial);
  const [descripcion, setDescripcion] = useState("");
  const [fase,        setFase]        = useState("todo");
  const [prioridad,   setPrioridad]   = useState("media");
  const [flujo,       setFlujo]       = useState("Corporativo");
  const [fecha,       setFecha]       = useState(hoyISO());
  const [hora,        setHora]        = useState(horaActual());
  const [responsable, setResponsable] = useState("");
  const [recordatorio,setRecordatorio]= useState("none");

  const faseOpt      = FASE_OPCIONES.find(p => p.value === fase);
  const prioridadOpt = PRIORIDAD_OPCIONES.find(p => p.value === prioridad);
  const campo = { width:"100%", padding:"14px 16px", borderRadius:12, border:"none", background:G.fieldBg, fontSize:14, outline:"none", color:G.textPrimary, boxSizing:"border-box", resize:"none", fontFamily:"inherit" };
  const label = { fontSize:11, fontWeight:700, color:G.textTertiary, letterSpacing:"0.07em", display:"block", marginBottom:8 };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}
      onClick={e=>{ if(e.target===e.currentTarget) onCerrar(); }}>
      <div style={{ background:G.glass, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderRadius:24, width:"100%", maxWidth:520, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,0.3)", border:`1px solid ${G.glassBorder}`, animation:"fadeIn 0.18s ease" }}>
        <div style={{ padding:"24px 24px 20px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            <div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:900, letterSpacing:"-0.02em", color:G.textPrimary }}>Nueva Tarea</h2>
              <p style={{ margin:"4px 0 0", fontSize:12, color:G.textSecondary }}>Define los parámetros de la misión.</p>
            </div>
            <button onClick={onCerrar} style={{ background:"none", border:"none", cursor:"pointer", color:G.textTertiary, padding:4, display:"flex", borderRadius:8 }}><IcoX /></button>
          </div>
        </div>
        <div style={{ width:"100%", height:1, background:G.border, flexShrink:0 }} />
        <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
          <div style={{ marginBottom:18 }}><label style={label}>OBJETIVO</label><input type="text" autoFocus value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Título breve del objetivo..." style={{ ...campo, fontWeight:600 }} /></div>
          <div style={{ marginBottom:20 }}><label style={label}>DESCRIPCIÓN</label><textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} rows={3} placeholder="Instrucciones o contexto..." style={{ ...campo, lineHeight:1.5 }} /></div>
          <div className="modal-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
            <div><label style={label}>ESTADO</label><select value={fase} onChange={e=>setFase(e.target.value)} style={{ ...campo, background:faseOpt.bg, color:faseOpt.color, fontWeight:700, fontSize:12, appearance:"none" }}>{FASE_OPCIONES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div><label style={label}>PRIORIDAD</label><select value={prioridad} onChange={e=>setPrioridad(e.target.value)} style={{ ...campo, background:prioridadOpt.bg, color:prioridadOpt.color, fontWeight:700, fontSize:12, appearance:"none" }}>{PRIORIDAD_OPCIONES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          </div>
          <div className="modal-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
            <div><label style={label}>FLUJO</label><select value={flujo} onChange={e=>setFlujo(e.target.value)} style={{ ...campo, fontWeight:600, appearance:"none" }}>{FLUJO_OPCIONES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div><label style={label}>FECHA LÍMITE</label><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={{ ...campo, fontWeight:600, fontSize:12 }} /></div>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={label}>🔔 RECORDATORIO</label>
            <select value={recordatorio} onChange={e=>setRecordatorio(e.target.value)} style={{ ...campo, fontWeight:600, appearance:"none", border: recordatorio!=="none" ? `1.5px solid ${G.accent}` : undefined, background: recordatorio!=="none" ? G.accentSoft : G.fieldBg, color: recordatorio!=="none" ? G.accent : G.textPrimary }}>
              <option value="none">Sin recordatorio</option>
              <option value="0">En el momento exacto</option>
              <option value="15">15 minutos antes</option>
              <option value="30">30 minutos antes</option>
              <option value="60">1 hora antes</option>
              <option value="120">2 horas antes</option>
              <option value="1440">1 día antes</option>
              <option value="2880">2 días antes</option>
            </select>
            {recordatorio !== "none" && <p style={{ margin:"6px 0 0", fontSize:11, color:G.accent, fontWeight:600 }}>✓ El asistente le notificará {recordatorio==="0"?"al momento":recordatorio==="1440"?"1 día antes":recordatorio==="2880"?"2 días antes":`${recordatorio} min antes`} a las {hora}.</p>}
          </div>
          <div style={{ marginBottom:8 }}><label style={label}>RESPONSABLE</label><input type="text" value={responsable} onChange={e=>setResponsable(e.target.value)} placeholder="Sin asignar" style={{ ...campo, fontWeight:600 }} /></div>
        </div>
        <div style={{ padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:`1px solid ${G.border}`, flexShrink:0 }}>
          <button onClick={onCerrar} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, color:G.textTertiary, padding:"10px 16px" }}>Cancelar</button>
          <button onClick={()=>titulo.trim()&&onGuardar({titulo,descripcion,fase,prioridad,flujo,fecha,hora,responsable,recordatorio})} disabled={!titulo.trim()}
            style={{ height:44, padding:"0 24px", borderRadius:12, border:"none", background:titulo.trim()?G.accent:G.fieldBg, color:titulo.trim()?"#fff":G.textTertiary, fontWeight:700, fontSize:13, cursor:titulo.trim()?"pointer":"not-allowed", display:"flex", alignItems:"center", gap:8, transition:"all 0.15s" }}>
            Crear Tarea <IcoSend />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card Alta (bento principal) ───────────────────────────────────────────────
function CardAlta({ item, onMover, onEliminar, onEditar, darkMode }) {
  const G = darkMode ? DARK_T : LIGHT_T;
  const [hov, setHov] = useState(false);
  const estaHecho = (item.datos?._kanban || legacyToNew(item)) === "hecho";
  const fechaItem = item.fecha?.slice(0,10);
  const vencida   = fechaItem && fechaItem < hoyISO() && !estaHecho;
  const isDone    = estaHecho;

  function toggleCheck() {
    onMover(item.id, isDone ? "todo" : "hecho");
  }

  return (
    <div style={{
      background: G.cardBg,
      border: `1px solid ${G.cardBorder}`,
      borderRadius: 20,
      padding: "20px",
      boxShadow: hov ? "0 8px 28px rgba(0,0,0,0.10)" : "0 2px 8px rgba(0,0,0,0.05)",
      transform: hov ? "translateY(-2px)" : "translateY(0)",
      transition: "all 0.25s ease",
      cursor: "default",
      animation: "fadeIn 0.2s ease",
    }}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
    >
      <div style={{ display:"flex", gap:16 }}>
        {/* Circle checkbox */}
        <button onClick={toggleCheck}
          style={{ marginTop:2, width:24, height:24, flexShrink:0, borderRadius:"50%", border:`2px solid ${isDone ? G.green : G.cardBorder}`, background:isDone ? G.green : "transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, transition:"all 0.18s", color:"#fff" }}>
          {isDone && <IcoCheck />}
        </button>

        {/* Content */}
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:6 }}>
            <h4 style={{ margin:0, fontSize:15, fontWeight:700, color:G.textPrimary, letterSpacing:"-0.01em", textDecoration:isDone?"line-through":"none", opacity:isDone?0.45:1, flex:1, paddingRight:12 }}>
              {item.datos?.titulo || item.texto}
            </h4>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              <span style={{ fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:99, background:G.coralSoft, border:`1px solid ${G.coralBorder}`, color:G.coral, letterSpacing:"0.05em" }}>HIGH</span>
              <button onClick={()=>onEditar(item)} style={{ background:"none", border:"none", cursor:"pointer", color:G.textTertiary, display:"flex", padding:3, borderRadius:6, opacity: hov?1:0, transition:"opacity 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.color=G.accent} onMouseLeave={e=>e.currentTarget.style.color=G.textTertiary}><IcoPencil /></button>
              <button onClick={()=>onEliminar(item.id)} style={{ background:"none", border:"none", cursor:"pointer", color:G.textTertiary, display:"flex", padding:3, borderRadius:6, opacity: hov?1:0, transition:"opacity 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.color=G.coral} onMouseLeave={e=>e.currentTarget.style.color=G.textTertiary}><IcoTrash /></button>
            </div>
          </div>

          {item.datos?.descripcion && (
            <p style={{ margin:"0 0 14px", fontSize:12, color:G.textSecondary, lineHeight:1.55, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
              {item.datos.descripcion}
            </p>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:14, marginTop: item.datos?.descripcion ? 0 : 8 }}>
            {fechaItem && (
              <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:vencida ? G.coral : G.textTertiary }}>
                <IcoCalendar />
                <span>{vencida ? "⚠ " : ""}{fechaItem}{item.datos?.hora ? `, ${item.datos.hora}` : ""}</span>
              </div>
            )}
            {item.datos?.categoria && (
              <span style={{ fontSize:10, fontWeight:600, color:G.textTertiary, background:G.chipBg, padding:"2px 8px", borderRadius:99 }}>
                {item.datos.categoria}
              </span>
            )}
            {item.datos?.responsable && (
              <div style={{ marginLeft:"auto", width:22, height:22, borderRadius:"50%", background:`linear-gradient(135deg, ${G.accent}, ${G.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff", flexShrink:0 }}>
                {item.datos.responsable.slice(0,2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Card Compacta (media/baja) ────────────────────────────────────────────────
function CardCompacta({ item, onMover, onEliminar, onEditar, darkMode }) {
  const G = darkMode ? DARK_T : LIGHT_T;
  const [hov, setHov] = useState(false);
  const prio      = item.datos?.prioridad || "media";
  const estaHecho = (item.datos?._kanban || legacyToNew(item)) === "hecho";
  const fechaItem = item.fecha?.slice(0,10);
  const iconColor = prio === "alta" ? G.coral : prio === "baja" ? G.green : G.amber;

  return (
    <div style={{
      background: G.cardBg,
      border: `1px solid ${G.cardBorder}`,
      borderRadius: 16,
      padding: "14px 16px",
      display: "flex", alignItems: "flex-start", gap: 12,
      boxShadow: hov ? "0 4px 14px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
      transform: hov ? "translateY(-1px)" : "translateY(0)",
      transition: "all 0.2s ease",
      cursor: "default",
      opacity: estaHecho ? 0.8 : 1,
    }}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
    >
      <span style={{ color: iconColor, display:"flex", flexShrink:0, marginTop:1 }}>
        {prio === "baja" ? <IcoPriLow /> : <IcoPriHigh />}
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:G.textPrimary, textDecoration:estaHecho?"line-through":"none", opacity:estaHecho?0.45:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {item.datos?.titulo || item.texto}
        </div>
        <div style={{ fontSize:11, color:G.textTertiary, marginTop:2 }}>
          {estaHecho ? "Completado" : fechaItem || (item.datos?.categoria || "")}
        </div>
      </div>
      <div style={{ display:"flex", gap:4, flexShrink:0, opacity: hov?1:0, transition:"opacity 0.15s" }}>
        <button onClick={()=>onEditar(item)} style={{ background:"none", border:"none", cursor:"pointer", color:G.textTertiary, display:"flex", padding:2 }}
          onMouseEnter={e=>e.currentTarget.style.color=G.accent} onMouseLeave={e=>e.currentTarget.style.color=G.textTertiary}><IcoPencil /></button>
        <button onClick={()=>onMover(item.id, estaHecho?"todo":"hecho")}
          style={{ width:18, height:18, borderRadius:"50%", border:`1.5px solid ${estaHecho ? G.green : G.cardBorder}`, background:estaHecho ? G.green : "transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, transition:"all 0.12s", color:"#fff" }}>
          {estaHecho && <IcoCheck />}
        </button>
      </div>
    </div>
  );
}

// ── TarjetaTarea (tablero kanban) ─────────────────────────────────────────────
function TarjetaTarea({ item, colActualId, onMover, onEliminar, onEditar, darkMode, saliendo, dragging, arrived, onDragStart, onDragEnd }) {
  const col       = COLUMNAS.find(c => c.id === colActualId) || COLUMNAS[0];
  const prio      = item.datos?.prioridad || "media";
  const prioLabel = prio === "alta" ? "ALTA" : prio === "baja" ? "BAJA" : "MEDIA";
  const prioColor = prio === "alta" ? "#ef4444" : prio === "baja" ? "#16a34a" : "#0059b5";
  const fechaItem = item.fecha?.slice(0, 10);
  const estaHecho = colActualId === "hecho";
  const vencida   = fechaItem && fechaItem < hoyISO() && !estaHecho;
  const otrasCol  = COLUMNAS.filter(c => c.id !== colActualId);
  const cardBg    = darkMode ? col.cardBgDark : col.cardBg;
  const cardBor   = darkMode ? col.cardBorderDark : col.cardBorder;

  return (
    <div style={{ background:cardBg, border:`1.5px solid ${cardBor}`, borderRadius:12, padding:"10px 10px 9px", transition:"opacity 0.22s, transform 0.22s, box-shadow 0.15s", opacity:dragging?0.3:saliendo?0:1, transform:dragging?"scale(0.94) rotate(2deg)":saliendo?"scale(0.55) rotate(-10deg) translateY(-35px)":"scale(1)", animation:arrived?"cardFall 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards":(!saliendo&&!dragging)?"fadeIn 0.25s ease":"none", cursor:dragging?"grabbing":"grab", boxShadow:dragging?"0 12px 32px rgba(0,0,0,0.22)":"none" }}
      draggable onDragStart={e=>onDragStart(e,item.id,colActualId)} onDragEnd={onDragEnd}>
      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:6 }}>
        <span style={{ fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:4, background:"transparent", border:`1px solid ${prioColor}`, color:prioColor, letterSpacing:"0.04em" }}>{prioLabel}</span>
        <div style={{ flex:1 }} />
        <button onClick={()=>onMover(item.id,estaHecho?"todo":"hecho")} style={{ width:16, height:16, borderRadius:"50%", border:`1.5px solid ${estaHecho?"#16a34a":darkMode?"rgba(255,255,255,0.2)":"#d1d5db"}`, background:estaHecho?"#16a34a":"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, transition:"all 0.15s", color:"#fff" }}>{estaHecho&&<IcoCheck />}</button>
        <button onClick={()=>onEditar(item)} style={{ background:"none", border:"none", cursor:"pointer", color:darkMode?"rgba(255,255,255,0.25)":"#c4c4c4", padding:"0 1px", display:"flex" }} onMouseEnter={e=>e.currentTarget.style.color="#0059b5"} onMouseLeave={e=>e.currentTarget.style.color=darkMode?"rgba(255,255,255,0.25)":"#c4c4c4"}><IcoPencil /></button>
        <button onClick={()=>onEliminar(item.id)} style={{ background:"none", border:"none", cursor:"pointer", color:darkMode?"rgba(255,255,255,0.18)":"#c4c4c4", padding:"0 1px", display:"flex" }} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color=darkMode?"rgba(255,255,255,0.18)":"#c4c4c4"}><IcoTrash /></button>
      </div>
      <div style={{ fontSize:12, fontWeight:600, color:darkMode?"#f5f5f7":"#181c23", lineHeight:1.35, textDecoration:estaHecho?"line-through":"none", opacity:estaHecho?0.5:1, paddingBottom:7, marginBottom:7, borderBottom:`1px solid ${darkMode?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}`, wordBreak:"break-word" }}>
        {item.datos?.titulo || item.texto}
      </div>
      {fechaItem && <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:7, fontSize:10, color:vencida?"#ef4444":darkMode?"#9ca3af":"#6b7280" }}><IcoCalendar />{vencida?"⚠ ":""}{fechaItem}{item.datos?.hora?` @ ${item.datos.hora}`:""}</div>}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
        {otrasCol.map(c=><button key={c.id} onClick={()=>onMover(item.id,c.id)} style={{ padding:"2px 7px", borderRadius:5, border:`1px solid ${darkMode?"rgba(255,255,255,0.1)":"#e5e7eb"}`, background:darkMode?"rgba(255,255,255,0.05)":"#ffffff", color:darkMode?"#d1d5db":"#6b7280", fontSize:10, fontWeight:500, cursor:"pointer", transition:"all 0.12s" }} onMouseEnter={e=>{e.currentTarget.style.background=darkMode?"rgba(0,89,181,0.15)":"#f3f4f6";}} onMouseLeave={e=>{e.currentTarget.style.background=darkMode?"rgba(255,255,255,0.05)":"#ffffff";}}>{c.btnLabel}</button>)}
      </div>
    </div>
  );
}

// ── Fila Lista ────────────────────────────────────────────────────────────────
function FilaTarea({ item, colActualId, onMover, onEliminar, onEditar, darkMode }) {
  const G         = darkMode ? DARK_T : LIGHT_T;
  const prio      = item.datos?.prioridad || "media";
  const prioLabel = prio === "alta" ? "ALTA" : prio === "baja" ? "BAJA" : "MEDIA";
  const prioColor = prio === "alta" ? "#ef4444" : prio === "baja" ? "#16a34a" : "#0059b5";
  const prioBg    = prio === "alta" ? "rgba(239,68,68,0.08)" : prio === "baja" ? "rgba(22,163,74,0.08)" : "rgba(0,89,181,0.08)";
  const fechaItem = item.fecha?.slice(0,10);
  const estaHecho = colActualId === "hecho";
  const vencida   = fechaItem && fechaItem < hoyISO() && !estaHecho;
  const bg0 = "transparent";
  return (
    <div style={{ display:"grid", gridTemplateColumns:"28px 52px 1fr auto auto auto 52px", alignItems:"center", gap:10, padding:"9px 14px", borderBottom:`1px solid ${darkMode?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"}`, background:bg0, transition:"background 0.12s" }}
      onMouseEnter={e=>e.currentTarget.style.background=darkMode?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)"}
      onMouseLeave={e=>e.currentTarget.style.background=bg0}>
      <button onClick={()=>onMover(item.id,estaHecho?"todo":"hecho")} style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${estaHecho?"#16a34a":darkMode?"rgba(255,255,255,0.25)":"#d1d5db"}`, background:estaHecho?"#16a34a":"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s", padding:0, color:"#fff" }}>{estaHecho&&<IcoCheck />}</button>
      <span style={{ fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:4, background:prioBg, color:prioColor, border:`1px solid ${prioColor}30`, letterSpacing:"0.04em", textAlign:"center" }}>{prioLabel}</span>
      <span style={{ fontSize:12, fontWeight:600, color:darkMode?"#f5f5f7":"#181c23", textDecoration:estaHecho?"line-through":"none", opacity:estaHecho?0.45:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", cursor:"pointer" }} onClick={()=>onEditar(item)}>{item.datos?.titulo||item.texto}</span>
      <span style={{ fontSize:10, color:darkMode?"#636366":"#9ca3af", whiteSpace:"nowrap", fontWeight:500 }}>{item.datos?.categoria||"—"}</span>
      <span style={{ fontSize:10, color:vencida?"#ef4444":darkMode?"#636366":"#9ca3af", whiteSpace:"nowrap", fontWeight:vencida?700:400 }}>{vencida?"⚠ ":""}{fechaItem||"—"}</span>
      <span style={{ fontSize:10, color:darkMode?"#636366":"#9ca3af", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:80 }}>{item.datos?.responsable||"—"}</span>
      <div style={{ display:"flex", gap:4, justifyContent:"flex-end" }}>
        <button onClick={()=>onEditar(item)} style={{ background:"none", border:"none", cursor:"pointer", color:darkMode?"rgba(255,255,255,0.25)":"#c4c4c4", padding:"2px", display:"flex" }} onMouseEnter={e=>e.currentTarget.style.color="#0059b5"} onMouseLeave={e=>e.currentTarget.style.color=darkMode?"rgba(255,255,255,0.25)":"#c4c4c4"}><IcoPencil /></button>
        <button onClick={()=>onEliminar(item.id)} style={{ background:"none", border:"none", cursor:"pointer", color:darkMode?"rgba(255,255,255,0.18)":"#c4c4c4", padding:"2px", display:"flex" }} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color=darkMode?"rgba(255,255,255,0.18)":"#c4c4c4"}><IcoTrash /></button>
      </div>
    </div>
  );
}


// ── Vista Principal ───────────────────────────────────────────────────────────
export default function ViewTareas({ items, setItems, onDelete, onOpenDrawer, darkMode = false }) {
  const G = darkMode ? DARK_T : LIGHT_T;

  const [mostrarModal, setMostrarModal] = useState(false);
  const [tituloRapido, setTituloRapido] = useState("");
  const [editandoItem, setEditandoItem] = useState(null);
  const [vistaMode,    setVistaModeRaw] = useState(() => localStorage.getItem("tareas_vista") || "bento");
  const [filtro,       setFiltro]       = useState("hoy");
  const [sortBy,       setSortBy]       = useState("fecha");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

  function setVistaMode(v) {
    setVistaModeRaw(v);
    localStorage.setItem("tareas_vista", v);
  }
  const [escuchando,   setEscuchando]   = useState(false);
  const [salienteId,   setSalienteId]   = useState(null);
  const [draggingId,   setDraggingId]   = useState(null);
  const [dragOverCol,  setDragOverCol]  = useState(null);
  const [arrivedId,    setArrivedId]    = useState(null);
  const recognitionRef  = useRef(null);
  const draggingColRef  = useRef(null);
  const quickInputRef   = useRef(null);

  useEffect(() => {
    const id = "tareas-kf";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes cardFall { 0%{opacity:0;transform:translateY(-55px) scale(0.72) rotate(-5deg);} 55%{opacity:1;transform:translateY(7px) scale(1.05) rotate(1.5deg);} 75%{transform:translateY(-4px) scale(0.97) rotate(-0.5deg);} 90%{transform:translateY(2px) scale(1.01);} 100%{transform:translateY(0) scale(1) rotate(0deg);} }
      @keyframes fadeIn { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
      @keyframes slideUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
      @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
    `;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!showSortMenu) return;
    function handleClick(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSortMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSortMenu]);

  function iniciarVoz() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert("Necesita Chrome o Edge para usar reconocimiento de voz."); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "es-CO"; r.continuous = false; r.interimResults = false;
    let acum = "";
    r.onresult = e => { for(let i=e.resultIndex;i<e.results.length;i++) if(e.results[i].isFinal) acum+=e.results[i][0].transcript+" "; };
    r.onerror = () => setEscuchando(false);
    r.onend = () => {
      setEscuchando(false);
      if (acum.trim()) {
        setItems(prev => [{ id:uid(), tipo:"tarea", texto:acum.trim(), datos:{titulo:acum.trim(), prioridad:"media", _kanban:"todo", categoria:"Corporativo"}, fecha:hoyISO(), creado:nowISO(), hecho:false, columna:"cesta" }, ...prev]);
      }
    };
    r.start(); recognitionRef.current = r; setEscuchando(true);
  }
  function detenerVoz() { recognitionRef.current?.stop(); setEscuchando(false); }

  function handleGuardar({ titulo, descripcion, fase, prioridad, flujo, fecha, hora, responsable, recordatorio }) {
    setItems(prev => [{ id:uid(), tipo:"tarea", texto:titulo, datos:{titulo,descripcion,prioridad,categoria:flujo,hora,responsable,recordatorio:recordatorio||"none",_kanban:fase}, fecha:fecha||hoyISO(), creado:nowISO(), hecho:fase==="hecho", columna:fase==="hecho"?"hecho":fase==="inprogress"?"hoy":fase==="revision"?"semana":"cesta" }, ...prev]);
    setMostrarModal(false); setTituloRapido("");
  }

  function handleEditar({ titulo, descripcion, fase, prioridad, flujo, fecha, hora, responsable, recordatorio }) {
    if (!editandoItem) return;
    setItems(prev => prev.map(i => i.id!==editandoItem.id ? i : { ...i, texto:titulo, hecho:fase==="hecho", fecha:fecha||i.fecha, columna:fase==="hecho"?"hecho":fase==="inprogress"?"hoy":fase==="revision"?"semana":"cesta", datos:{...i.datos,titulo,descripcion,prioridad,categoria:flujo,hora,responsable,recordatorio:recordatorio||"none",_kanban:fase} }));
    setEditandoItem(null);
  }

  function moverTarea(id, nuevaCol) {
    setSalienteId(id);
    setTimeout(() => {
      setItems(prev => prev.map(i => i.id!==id ? i : { ...i, hecho:nuevaCol==="hecho", columna:nuevaCol==="hecho"?"hecho":nuevaCol==="inprogress"?"hoy":nuevaCol==="revision"?"semana":"cesta", datos:{...i.datos,_kanban:nuevaCol} }));
      setSalienteId(null);
    }, 230);
  }

  function handleDragStart(e,itemId,fromColId) { setDraggingId(itemId); draggingColRef.current=fromColId; e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain",itemId); }
  function handleDragOver(e,colId) { e.preventDefault(); e.dataTransfer.dropEffect="move"; setDragOverCol(colId); }
  function handleDragLeave(e) { if(!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null); }
  function handleDrop(e,colId) {
    e.preventDefault();
    const id = draggingId || e.dataTransfer.getData("text/plain");
    const fromCol = draggingColRef.current;
    setDraggingId(null); setDragOverCol(null);
    if (!id || fromCol===colId) return;
    setSalienteId(id);
    setTimeout(() => { setItems(prev=>prev.map(i=>i.id!==id?i:{...i,hecho:colId==="hecho",columna:colId==="hecho"?"hecho":colId==="inprogress"?"hoy":colId==="revision"?"semana":"cesta",datos:{...i.datos,_kanban:colId}})); setSalienteId(null); setArrivedId(id); setTimeout(()=>setArrivedId(null),700); },220);
  }
  function handleDragEnd() { setDraggingId(null); setDragOverCol(null); }

  const allTareas = items.filter(i => i.tipo==="tarea"||i.tipo==="recordatorio");
  function getCol(item) { return item.datos?._kanban || legacyToNew(item); }

  const hoyStr    = hoyISO();
  const semanaFin = semanaDe(7);

  const PRIO_ORD = { alta: 0, media: 1, baja: 2 };

  function aplicarFiltro(lista) {
    if (filtro === "completado") return lista.filter(i => getCol(i) === "hecho");
    if (filtro === "hoy")        return lista.filter(i => {
      const f = i.fecha?.slice(0,10);
      // Hoy: tareas de hoy + vencidas sin completar
      return (f && f <= hoyStr) && getCol(i) !== "hecho";
    });
    if (filtro === "semana")     return lista.filter(i => {
      const f = i.fecha?.slice(0,10);
      // Semana: desde hoy hasta 7 días adelante, sin completar
      return (f && f >= hoyStr && f <= semanaFin) && getCol(i) !== "hecho";
    });
    return lista;
  }

  const tareasFiltradas = aplicarFiltro(allTareas)
    .sort((a, b) => {
      if (sortBy === "prioridad") return (PRIO_ORD[a.datos?.prioridad||"media"]||1) - (PRIO_ORD[b.datos?.prioridad||"media"]||1);
      if (sortBy === "titulo")    return (a.titulo||"").localeCompare(b.titulo||"");
      if (sortBy === "fecha")     return (a.fecha||"").localeCompare(b.fecha||"");
      return 0;
    });

  const alta  = tareasFiltradas.filter(i => (i.datos?.prioridad||"media") === "alta");
  const media = tareasFiltradas.filter(i => (i.datos?.prioridad||"media") === "media");
  const baja  = tareasFiltradas.filter(i => (i.datos?.prioridad||"media") === "baja");

  // porColumna: las columnas pendientes respetan el filtro de fecha;
  // la columna "hecho" siempre muestra TODOS los completados (no filtrar por fecha).
  const porColumna = {
    todo:       aplicarFiltro(allTareas.filter(i=>getCol(i)==="todo")),
    inprogress: aplicarFiltro(allTareas.filter(i=>getCol(i)==="inprogress")),
    revision:   aplicarFiltro(allTareas.filter(i=>getCol(i)==="revision")),
    hecho:      allTareas.filter(i=>getCol(i)==="hecho"),
  };

  const total  = allTareas.length;
  const hechas = allTareas.filter(i=>getCol(i)==="hecho").length;
  const pct    = total > 0 ? Math.round(hechas/total*100) : 0;

  const CHIPS = [
    { id:"hoy",       label:"Hoy"       },
    { id:"semana",    label:"Semana"     },
    { id:"completado",label:"Completado" },
  ];

  const glassCard = {
    background: G.glass,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${G.glassBorder}`,
    borderRadius: 24,
    boxShadow: darkMode ? "0 4px 24px rgba(0,0,0,0.35)" : "0 2px 16px rgba(0,0,0,0.07)",
  };

  function abrirModalConTitulo() {
    setTituloRapido(quickInputRef.current?.value || "");
    setMostrarModal(true);
  }

  return (
    <>
      {mostrarModal && <ModalNuevaTarea darkMode={darkMode} onCerrar={()=>{setMostrarModal(false);setTituloRapido("");}} onGuardar={handleGuardar} tituloInicial={tituloRapido} />}
      {editandoItem && <ModalEditarTarea item={editandoItem} darkMode={darkMode} onCerrar={()=>setEditandoItem(null)} onGuardar={handleEditar} />}
      <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>
        <div style={{ padding:"24px 28px 0", width:"100%", boxSizing:"border-box" }}>

          {/* ── Header ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {/* Toggle vista */}
              <div style={{ display:"flex", background:G.surfaceContainerLow, border:`1px solid ${G.cardBorder}`, borderRadius:12, overflow:"hidden" }}>
                {[["bento",<IcoBento key="b"/>,"Bento"],["tablero",<IcoTablero key="t"/>,"Tablero"],["lista",<IcoLista key="l"/>,"Lista"]].map(([id,ico,lbl])=>(
                  <button key={id} onClick={()=>setVistaMode(id)} title={lbl}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", fontSize:11, fontWeight:700, background:vistaMode===id?G.accent:"transparent", color:vistaMode===id?"#fff":G.textTertiary, border:"none", cursor:"pointer", transition:"all 0.15s" }}>
                    {ico} {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Search + Nueva tarea */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:G.textTertiary, display:"flex" }}><IcoSearch /></span>
                <input placeholder="Buscar tareas..."
                  style={{ background:G.surfaceContainerLow, border:`1px solid ${G.cardBorder}`, borderRadius:99, paddingLeft:36, paddingRight:16, paddingTop:8, paddingBottom:8, fontSize:12, outline:"none", color:G.textPrimary, width:200, fontFamily:"inherit" }} />
              </div>
              <button onClick={()=>setMostrarModal(true)}
                style={{ height:38, padding:"0 18px", borderRadius:12, border:"none", background:G.accent, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:`0 4px 14px ${G.accentGlow}` }}>
                <IcoPlus /> Nueva tarea
              </button>
            </div>
          </div>

          {/* ── Quick Add ── */}
          <div style={{ ...glassCard, padding:4, display:"flex", alignItems:"center", marginBottom:20, gap:4 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, padding:"4px 14px" }}>
              <input ref={quickInputRef}
                placeholder="¿Qué tienes pendiente?"
                onKeyDown={e=>{ if(e.key==="Enter" && e.target.value.trim()) abrirModalConTitulo(); }}
                style={{ flex:1, background:"none", border:"none", outline:"none", fontSize:14, color:G.textPrimary, fontFamily:"inherit" }} />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:2, paddingRight:4 }}>
              <button onClick={escuchando?detenerVoz:iniciarVoz} title={escuchando?"Detener voz":"Crear por voz"}
                style={{ padding:"8px 10px", borderRadius:10, border:"none", background:escuchando?`${G.coral}15`:"transparent", color:escuchando?G.coral:G.textTertiary, cursor:"pointer", display:"flex", alignItems:"center" }}>
                <IcoMic />
              </button>
              <button style={{ padding:"8px 10px", borderRadius:10, border:"none", background:"transparent", color:G.textTertiary, cursor:"pointer", display:"flex", alignItems:"center" }}>
                <IcoFlag />
              </button>
              <button style={{ padding:"8px 10px", borderRadius:10, border:"none", background:"transparent", color:G.textTertiary, cursor:"pointer", display:"flex", alignItems:"center" }}>
                <IcoEvent />
              </button>
              <button onClick={abrirModalConTitulo}
                style={{ padding:"9px 20px", borderRadius:10, border:"none", background:G.accent, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                <IcoPlus /> Añadir
              </button>
            </div>
          </div>

          {/* ── Filter Chips ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
            <div style={{ display:"flex", gap:8 }}>
              {CHIPS.map(c=>(
                <button key={c.id} onClick={()=>setFiltro(c.id)}
                  style={{ padding:"7px 20px", borderRadius:99, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.15s",
                    background: filtro===c.id ? G.accent : "transparent",
                    color:      filtro===c.id ? "#fff" : G.textSecondary,
                    border:     filtro===c.id ? `2px solid ${G.accent}` : `2px solid ${G.glassBorder}`,
                    boxShadow:  filtro===c.id ? `0 2px 10px ${G.accentGlow}` : "none",
                  }}>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Ordenar por — dropdown */}
            <div style={{ position:"relative" }} ref={sortMenuRef}>
              <button
                onClick={()=>setShowSortMenu(v=>!v)}
                style={{ display:"flex", alignItems:"center", gap:5, background: showSortMenu ? G.accentSoft : "transparent",
                  border:`1px solid ${showSortMenu ? G.accent : G.glassBorder}`,
                  borderRadius:9, padding:"6px 12px", cursor:"pointer", fontSize:11, fontWeight:700,
                  color: showSortMenu ? G.accent : G.textSecondary, letterSpacing:"0.06em", textTransform:"uppercase", transition:"all 0.15s" }}>
                Ordenar por: {sortBy === "fecha" ? "Fecha" : sortBy === "prioridad" ? "Prioridad" : "Título"}
                <IcoChevron />
              </button>
              {showSortMenu && (
                <div style={{ position:"absolute", right:0, top:"calc(100% + 6px)", background:G.surface, border:`1px solid ${G.glassBorder}`,
                  borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:999, minWidth:160, overflow:"hidden" }}>
                  {[{id:"fecha",label:"Fecha"},{id:"prioridad",label:"Prioridad"},{id:"titulo",label:"Título"}].map(op=>(
                    <button key={op.id}
                      onClick={()=>{ setSortBy(op.id); setShowSortMenu(false); }}
                      style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 16px", background: sortBy===op.id ? G.accentSoft : "transparent",
                        color: sortBy===op.id ? G.accent : G.textPrimary, fontWeight: sortBy===op.id ? 700 : 500,
                        fontSize:13, border:"none", cursor:"pointer", transition:"background 0.1s" }}>
                      {op.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Vista Bento ── */}
          {vistaMode === "bento" && (
            <div>
              {/* Bento grid 2/3 + 1/3 */}
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20, alignItems:"start", marginBottom:20 }}>

                {/* Columna izq: Alta prioridad */}
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, padding:"0 2px" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:G.coral, display:"inline-block" }} />
                    <span style={{ fontSize:13, fontWeight:700, color:G.textPrimary }}>Prioridad Alta</span>
                    {alta.length>0 && <span style={{ fontSize:10, fontWeight:700, color:G.coral, background:G.coralSoft, border:`1px solid ${G.coralBorder}`, borderRadius:99, padding:"1px 8px" }}>{alta.length}</span>}
                  </div>
                  {alta.length === 0 ? (
                    <div style={{ ...glassCard, padding:"36px 20px", textAlign:"center" }}>
                      <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.45 }}>
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      </div>
                      <div style={{ fontSize:13, color:G.textTertiary }}>Sin tareas de alta prioridad</div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      {alta.map(item=><CardAlta key={item.id} item={item} onMover={moverTarea} onEliminar={onDelete} onEditar={setEditandoItem} darkMode={darkMode} />)}
                    </div>
                  )}
                </div>

                {/* Columna der: Media + Baja */}
                <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                  {/* Media */}
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, padding:"0 2px" }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:G.amber, display:"inline-block" }} />
                      <span style={{ fontSize:12, fontWeight:700, color:G.textPrimary }}>Media</span>
                      {media.length>0 && <span style={{ fontSize:10, fontWeight:700, color:G.amber, background:G.amberSoft, border:`1px solid ${G.amberBorder}`, borderRadius:99, padding:"1px 7px" }}>{media.length}</span>}
                    </div>
                    {media.length === 0
                      ? <div style={{ fontSize:12, color:G.textTertiary, padding:"8px 4px" }}>Sin tareas</div>
                      : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {media.map(item=><CardCompacta key={item.id} item={item} onMover={moverTarea} onEliminar={onDelete} onEditar={setEditandoItem} darkMode={darkMode} />)}
                        </div>
                    }
                  </div>

                  {/* Baja */}
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, padding:"0 2px" }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:G.green, display:"inline-block" }} />
                      <span style={{ fontSize:12, fontWeight:700, color:G.textPrimary }}>Baja</span>
                      {baja.length>0 && <span style={{ fontSize:10, fontWeight:700, color:G.green, background:G.greenSoft, border:`1px solid ${G.greenBorder}`, borderRadius:99, padding:"1px 7px" }}>{baja.length}</span>}
                    </div>
                    {baja.length === 0
                      ? <div style={{ fontSize:12, color:G.textTertiary, padding:"8px 4px" }}>Sin tareas</div>
                      : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {baja.map(item=><CardCompacta key={item.id} item={item} onMover={moverTarea} onEliminar={onDelete} onEditar={setEditandoItem} darkMode={darkMode} />)}
                        </div>
                    }
                  </div>
                </div>
              </div>

              {/* ── Insights bento ── */}
              <div style={{ display:"grid", gridTemplateColumns:"3fr 1fr", gap:20, marginBottom:32 }}>
                {/* Progress card */}
                <div style={{ ...glassCard, padding:"24px 28px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", right:-20, bottom:-20, width:160, height:160, background:`radial-gradient(circle, ${G.accentSoft} 0%, transparent 70%)`, pointerEvents:"none" }} />
                  <div style={{ position:"relative", zIndex:1, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                    <div>
                      <h3 style={{ margin:"0 0 4px", fontSize:17, fontWeight:800, color:G.textPrimary, letterSpacing:"-0.01em" }}>Progreso del Día</h3>
                      <p style={{ margin:"0 0 20px", fontSize:12, color:G.textSecondary }}>
                        {hechas > 0
                          ? `Has completado ${hechas} tarea${hechas!==1?"s":""} esta semana. ¡Vas por buen camino!`
                          : "Aún no hay tareas completadas esta semana."}
                      </p>
                    </div>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                      {[0.3,0.5,0.65,1,0.85].map((h,i)=>(
                        <div key={i} style={{ width:28, borderRadius:"6px 6px 0 0", height: Math.round(h*80), background: i===3 ? G.accent : `${G.accent}${Math.round(h*60+20).toString(16).padStart(2,"0")}` }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Productivity % card */}
                <div style={{ background:`linear-gradient(135deg, #4a47d2 0%, #6462ec 100%)`, borderRadius:24, padding:"24px 20px", display:"flex", flexDirection:"column", justifyContent:"space-between", boxShadow:"0 8px 24px rgba(74,71,210,0.3)" }}>
                  <span style={{ color:"#fff", display:"flex" }}><IcoBolt /></span>
                  <div>
                    <div style={{ fontSize:32, fontWeight:900, color:"#fff", letterSpacing:"-0.03em" }}>{pct}%</div>
                    <div style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.7)", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:2 }}>PRODUCTIVIDAD</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Vista Tablero ── */}
          {vistaMode === "tablero" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, paddingBottom:40 }}>
              {COLUMNAS.map(col=>{
                const colItems = porColumna[col.id]||[];
                const colColor = col.id==="todo"?"#ef4444":col.id==="inprogress"?"#ff9500":col.id==="revision"?"#0059b5":"#34c759";
                return (
                  <div key={col.id} onDragOver={e=>handleDragOver(e,col.id)} onDragLeave={handleDragLeave} onDrop={e=>handleDrop(e,col.id)}
                    style={{ background:dragOverCol===col.id?(darkMode?"rgba(0,89,181,0.08)":"rgba(0,89,181,0.04)"):G.glass, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:dragOverCol===col.id?`2px dashed ${G.accent}`:`1px solid ${G.glassBorder}`, borderRadius:20, minHeight:480, display:"flex", flexDirection:"column", overflow:"hidden", transition:"background 0.15s, border-color 0.15s" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 12px", borderBottom:`1px solid ${G.border}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ width:7, height:7, borderRadius:"50%", background:colColor }} />
                        <span style={{ fontSize:11, fontWeight:700, color:G.textTertiary, letterSpacing:"0.07em" }}>{col.label}</span>
                      </div>
                      <span style={{ width:22, height:22, borderRadius:"50%", background:G.chipBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:G.textTertiary }}>{colItems.length}</span>
                    </div>
                    <div style={{ flex:1, padding:"8px", display:"flex", flexDirection:"column", gap:5 }}>
                      {colItems.map(item=><TarjetaTarea key={item.id} item={item} colActualId={col.id} onMover={moverTarea} onEliminar={onDelete} onEditar={setEditandoItem} darkMode={darkMode} saliendo={salienteId===item.id} dragging={draggingId===item.id} arrived={arrivedId===item.id} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Vista Lista ── */}
          {vistaMode === "lista" && (
            <div style={{ paddingBottom:40, display:"flex", flexDirection:"column", gap:16 }}>
              {COLUMNAS.map(col=>{
                const colItems = porColumna[col.id]||[];
                const colColor = col.id==="todo"?"#ef4444":col.id==="inprogress"?"#ff9500":col.id==="revision"?"#0059b5":"#34c759";
                return (
                  <div key={col.id} style={{ ...glassCard, overflow:"hidden" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:`1px solid ${G.border}`, background:darkMode?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.01)" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:colColor, flexShrink:0 }} />
                      <span style={{ fontSize:11, fontWeight:700, color:G.textTertiary, letterSpacing:"0.07em" }}>{col.label}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:colColor, background:`${colColor}14`, border:`1px solid ${colColor}30`, borderRadius:10, padding:"1px 7px" }}>{colItems.length}</span>
                    </div>
                    {colItems.length===0
                      ? <div style={{ padding:"14px", fontSize:11, color:G.textTertiary, textAlign:"center" }}>Sin tareas</div>
                      : colItems.map(item=><FilaTarea key={item.id} item={item} colActualId={col.id} onMover={moverTarea} onEliminar={onDelete} onEditar={setEditandoItem} darkMode={darkMode} />)
                    }
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
