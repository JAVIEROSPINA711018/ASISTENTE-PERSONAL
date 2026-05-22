import { useState, useEffect } from "react";

// ── Palettes — CRM Design System ─────────────────────────────────────────────
import { LIGHT as LIGHT_C, DARK as DARK_C } from "../lib/theme.js";
let G = LIGHT_C;

const DIAS_SHORT = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MESES      = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_UP   = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
const MESES_SH   = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function uid()     { return Math.random().toString(36).slice(2,9); }
function padZ(n)   { return String(n).padStart(2,"0"); }
function hoyStr()  { return new Date().toISOString().slice(0,10); }
function nowISO()  { return new Date().toISOString(); }
function horaActual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

// ── Opciones compartidas con ViewTareas ───────────────────────────────────────
const FASE_OPCIONES = [
  { value:"todo",       label:"Pendiente / Por Hacer",  color:"#d97706", bg:"rgba(245,158,11,0.12)" },
  { value:"inprogress", label:"Activo / En Progreso",   color:"#0071e3", bg:"rgba(0,113,227,0.10)" },
  { value:"revision",   label:"Revisión / En Espera",   color:"#7c3aed", bg:"rgba(124,58,237,0.10)" },
  { value:"hecho",      label:"Cerrado / Completado",   color:"#16a34a", bg:"rgba(22,163,74,0.10)" },
];
const PRIORIDAD_OPCIONES = [
  { value:"alta",  label:"Operaciones / Alta",  color:"#ef4444", bg:"rgba(239,68,68,0.10)" },
  { value:"media", label:"Operaciones / Media", color:"#0071e3", bg:"rgba(0,113,227,0.10)" },
  { value:"baja",  label:"Operaciones / Baja",  color:"#16a34a", bg:"rgba(22,163,74,0.10)" },
];
const FLUJO_OPCIONES = ["Corporativo","Personal","Proyecto","Reunión","Recordatorio","Obra / NSR-10"];

function legacyToNew(item) {
  if (item.hecho)                return "hecho";
  if (item.columna === "hoy")    return "inprogress";
  if (item.columna === "semana") return "revision";
  return "todo";
}

// ── Event styling by priority ─────────────────────────────────────────────────
function getEvStyle(ev) {
  if (ev.tipo === "reunion")      return { bg:"#f0fdf4", border:"#bbf7d0", dot:"#22c55e", badgeBg:"#dcfce7", badgeText:"#166534", badgeLabel:"REUNIÓN" };
  if (ev.tipo === "recordatorio") return { bg:"#fff7ed", border:"#fed7aa", dot:"#f97316", badgeBg:"#ffedd5", badgeText:"#9a3412", badgeLabel:"RECORD." };
  const p = ev.datos?.prioridad || "media";
  if (p === "alta") return { bg:"#fff1f2", border:"#fecdd3", dot:"#f43f5e", badgeBg:"#fee2e2", badgeText:"#991b1b", badgeLabel:"ALTA" };
  if (p === "baja") return { bg:"#f0fdf4", border:"#bbf7d0", dot:"#22c55e", badgeBg:"#dcfce7", badgeText:"#166534", badgeLabel:"BAJA" };
  return { bg:"#fffbeb", border:"#fde68a", dot:"#f59e0b", badgeBg:"#dbeafe", badgeText:"#1e40af", badgeLabel:"MEDIA" };
}

function getEventTitle(ev) { return ev.datos?.titulo || ev.titulo || ev.texto || "Sin título"; }
function getEventTime(ev)  { return ev.datos?.hora || ev.horaInicio || ""; }
function getStatusLabel(ev) {
  const k = ev.datos?._kanban || (ev.hecho ? "hecho" : "todo");
  return { todo:"POR HACER", inprogress:"EN PROGRESO", revision:"EN REVISIÓN", hecho:"COMPLETADO" }[k] || "POR HACER";
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ text, size = 40 }) {
  const letter = (text || "?")[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#0071e3", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 800, flexShrink: 0,
      letterSpacing: "-0.02em",
    }}>
      {letter}
    </div>
  );
}

// ── Modal compartido (Nueva/Editar tarea desde calendario) ───────────────────
function ModalTareaCalendario({ ev, defaultDate, onClose, onSave, onDelete }) {
  const esEdicion = !!ev;
  const [titulo,      setTitulo]      = useState(esEdicion ? getEventTitle(ev) : "");
  const [descripcion, setDescripcion] = useState(esEdicion ? (ev.datos?.descripcion || ev.notas || "") : "");
  const [fase,        setFase]        = useState(esEdicion ? (ev.datos?._kanban || legacyToNew(ev)) : "todo");
  const [prioridad,   setPrioridad]   = useState(esEdicion ? (ev.datos?.prioridad || "media") : "media");
  const [flujo,       setFlujo]       = useState(esEdicion ? (ev.datos?.categoria || "Corporativo") : "Corporativo");
  const [fecha,       setFecha]       = useState(esEdicion ? (ev.fecha || defaultDate || hoyStr()) : (defaultDate || hoyStr()));
  const [hora,        setHora]        = useState(esEdicion ? getEventTime(ev) : horaActual());
  const [responsable, setResponsable] = useState(esEdicion ? (ev.datos?.responsable || "") : "");

  const faseOpt      = FASE_OPCIONES.find(p => p.value === fase);
  const prioridadOpt = PRIORIDAD_OPCIONES.find(p => p.value === prioridad);

  const campo = {
    width:"100%", padding:"14px 16px", borderRadius:12,
    border:"none", background:G.bg,
    fontSize:14, outline:"none", color:G.textPrimary,
    boxSizing:"border-box", resize:"none", fontFamily:"inherit",
  };
  const etiqueta = {
    fontSize:11, fontWeight:700, color:G.textTertiary,
    letterSpacing:"0.07em", display:"block", marginBottom:8,
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1200,
      background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{
        background:G.bg, borderRadius:20,
        width:"100%", maxWidth:520, maxHeight:"90vh",
        display:"flex", flexDirection:"column", overflow:"hidden",
        boxShadow:"0 24px 80px rgba(0,0,0,0.35)",
        animation:"fadeIn 0.18s ease",
      }}>

        {/* Cabecera */}
        <div style={{ padding:"24px 24px 20px", background:G.card, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            <div>
              <h2 style={{ margin:0, fontSize:22, fontWeight:900, letterSpacing:"-0.02em", color:G.textPrimary, textTransform:"uppercase" }}>
                {esEdicion ? "Editar Tarea" : "Nueva Tarea"}
              </h2>
              <p style={{ margin:"4px 0 0", fontSize:13, color:G.textSecondary }}>
                {esEdicion ? "Actualiza los parámetros de la tarea." : "Define los parámetros y dependencias de la misión."}
              </p>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:G.textTertiary, padding:4, display:"flex", borderRadius:8, marginTop:-2, fontSize:20 }}>
              ×
            </button>
          </div>
        </div>

        <div style={{ width:"100%", height:1, background:G.border, flexShrink:0 }} />

        {/* Cuerpo */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>

          <div style={{ marginBottom:20 }}>
            <label style={etiqueta}>OBJETIVO</label>
            <input type="text" autoFocus
              placeholder="Título breve del objetivo..."
              value={titulo} onChange={e=>setTitulo(e.target.value)}
              style={{...campo, fontWeight:500}} />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={etiqueta}>DIRECTIVAS Y CONTEXTO</label>
            <textarea placeholder="Instrucciones específicas o contexto..."
              value={descripcion} onChange={e=>setDescripcion(e.target.value)}
              rows={4} style={{...campo, lineHeight:1.5}} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            <div>
              <label style={etiqueta}>FASE / ESTADO</label>
              <select value={fase} onChange={e=>setFase(e.target.value)}
                style={{...campo, background:faseOpt.bg, color:faseOpt.color, fontWeight:700, fontSize:13, appearance:"none", WebkitAppearance:"none", cursor:"pointer"}}>
                {FASE_OPCIONES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={etiqueta}>NIVEL DE PRIORIDAD</label>
              <select value={prioridad} onChange={e=>setPrioridad(e.target.value)}
                style={{...campo, background:prioridadOpt.bg, color:prioridadOpt.color, fontWeight:700, fontSize:13, appearance:"none", WebkitAppearance:"none", cursor:"pointer"}}>
                {PRIORIDAD_OPCIONES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            <div>
              <label style={etiqueta}>FLUJO DE TAREA</label>
              <select value={flujo} onChange={e=>setFlujo(e.target.value)}
                style={{...campo, fontWeight:600, appearance:"none", WebkitAppearance:"none", cursor:"pointer"}}>
                {FLUJO_OPCIONES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={etiqueta}>FECHA Y HORA LÍMITE</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
                  style={{...campo, fontWeight:600, fontSize:12}} />
                <input type="time" value={hora} onChange={e=>setHora(e.target.value)}
                  style={{...campo, fontWeight:600, fontSize:12}} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom:8 }}>
            <label style={etiqueta}>RESPONSABLE</label>
            <input type="text" placeholder="Sin asignar"
              value={responsable} onChange={e=>setResponsable(e.target.value)}
              style={{...campo, fontWeight:600}} />
          </div>

        </div>

        {/* Pie */}
        <div style={{ padding:"16px 24px", background:G.card, display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:`1px solid ${G.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, fontWeight:600, color:G.textTertiary, padding:"10px 16px" }}>
              Cancelar
            </button>
            {esEdicion && onDelete && (
              <button onClick={()=>onDelete(ev.id)} style={{
                padding:"10px 16px", borderRadius:10, border:"1px solid #fecaca",
                background:"#fff1f2", color:"#dc2626", fontSize:13, fontWeight:600, cursor:"pointer",
              }}>Eliminar</button>
            )}
          </div>
          <button
            onClick={()=>titulo.trim()&&onSave({titulo,descripcion,fase,prioridad,flujo,fecha,hora,responsable})}
            disabled={!titulo.trim()}
            style={{
              height:48, padding:"0 28px", borderRadius:12, border:"none",
              background:titulo.trim() ? G.accent : G.bg,
              color:titulo.trim() ? "#ffffff" : G.textTertiary,
              fontWeight:700, fontSize:14, cursor:titulo.trim()?"pointer":"not-allowed",
              display:"flex", alignItems:"center", gap:10, transition:"all 0.15s",
            }}>
            {esEdicion ? "Guardar Cambios" : "Desplegar Tarea"} →
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Vista Mes ─────────────────────────────────────────────────────────────────
function MonthView({ year, month, selectedDate, allEvents, onSelectDay, onEditEvent }) {
  const firstDay  = new Date(year, month, 1);
  const startDow  = firstDay.getDay(); // 0=Sun (Sunday-first)
  const daysInMon = new Date(year, month+1, 0).getDate();
  const today     = hoyStr();

  const cells = [];
  for (let i=0; i<startDow; i++) cells.push(null);
  for (let d=1; d<=daysInMon; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      {/* Column headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>
        {DIAS_SHORT.map((d,i) => (
          <div key={d} style={{
            padding:"10px 10px 9px",
            fontSize:11, fontWeight:700, color:G.textTertiary, letterSpacing:"0.06em",
            borderRight: i<6 ? `1px solid ${G.borderLight}` : "none",
          }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(7,1fr)",
        gridAutoRows:"minmax(96px, auto)",
        flex:1, overflowY:"auto",
      }}>
        {cells.map((d,i) => {
          const dStr    = d ? `${year}-${padZ(month+1)}-${padZ(d)}` : null;
          const isToday = dStr === today;
          const isSel   = dStr === selectedDate;
          const dayEvs  = dStr ? allEvents.filter(e=>(e.fecha||e.creado?.slice(0,10))===dStr) : [];
          const isWknd  = i%7===0 || i%7===6;

          return (
            <div key={i}
              onClick={()=>dStr&&onSelectDay(dStr)}
              style={{
                borderRight:`1px solid ${G.border}`,
                borderBottom:`1px solid ${G.border}`,
                padding:"8px 6px 6px",
                cursor:d?"pointer":"default",
                background:isSel ? "rgba(37,99,235,0.04)" : isWknd ? G.weekendBg : "transparent",
                transition:"background 0.15s",
                overflow:"hidden",
              }}
              onMouseEnter={e=>{if(d&&!isSel)e.currentTarget.style.background="rgba(0,0,0,0.02)";}}
              onMouseLeave={e=>{if(d&&!isSel)e.currentTarget.style.background=isWknd?G.weekendBg:"transparent";}}
            >
              {d && (
                <>
                  <div style={{
                    width:26, height:26, borderRadius:"50%",
                    background:isToday ? G.todayBg : "transparent",
                    color:isToday ? G.todayText : G.textSecondary,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:13, fontWeight:isToday?700:500, marginBottom:4,
                  }}>{d}</div>

                  {dayEvs.slice(0,3).map(ev=>{
                    const cs    = getEvStyle(ev);
                    const hora  = getEventTime(ev);
                    const title = getEventTitle(ev);
                    return (
                      <div key={ev.id}
                        onClick={e=>{e.stopPropagation(); onEditEvent(ev);}}
                        style={{
                          display:"flex", alignItems:"center", gap:4,
                          background:cs.bg, border:`1px solid ${cs.border}`,
                          borderRadius:5, padding:"2px 6px", marginBottom:2,
                          cursor:"pointer", transition:"filter 0.1s",
                        }}
                        onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.95)"}
                        onMouseLeave={e=>e.currentTarget.style.filter="none"}
                      >
                        <div style={{ width:5, height:5, borderRadius:"50%", background:cs.dot, flexShrink:0 }} />
                        {hora && <span style={{ fontSize:9, color:G.textTertiary, flexShrink:0 }}>{hora}</span>}
                        <span style={{
                          fontSize:10, fontWeight:600, color:G.textPrimary,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1,
                        }}>{title}</span>
                      </div>
                    );
                  })}
                  {dayEvs.length > 3 && (
                    <div style={{ fontSize:9, color:G.textTertiary, paddingLeft:2, marginTop:1 }}>
                      +{dayEvs.length-3} más
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista Semana ──────────────────────────────────────────────────────────────
function WeekView({ dateStr, allEvents, onSelectDay, onEditEvent }) {
  const date  = new Date(dateStr+"T12:00:00");
  const dow   = date.getDay(); // 0=Sun
  const sun   = new Date(date); sun.setDate(date.getDate()-dow);
  const today = hoyStr();

  const weekDays = Array.from({length:7},(_,i)=>{
    const d = new Date(sun); d.setDate(sun.getDate()+i); return d;
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      {/* Headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>
        {weekDays.map((d,i)=>{
          const dStr  = d.toISOString().slice(0,10);
          const isT   = dStr===today;
          const isSel = dStr===dateStr;
          return (
            <div key={dStr} onClick={()=>onSelectDay(dStr)}
              style={{
                padding:"12px 8px", textAlign:"center", cursor:"pointer",
                borderRight:i<6?`1px solid ${G.borderLight}`:"none",
                background:isSel ? G.accentSoft : "transparent",
                transition:"background 0.15s",
              }}>
              <div style={{ fontSize:10, fontWeight:700, color:G.textTertiary,
                textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>
                {DIAS_SHORT[i]}
              </div>
              <div style={{
                width:34, height:34, borderRadius:"50%", margin:"0 auto",
                background:isT ? G.todayBg : "transparent",
                color:isT ? G.todayText : isSel ? G.accent : G.textPrimary,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:17, fontWeight:isT||isSel?700:500,
              }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", flex:1, overflowY:"auto", alignContent:"start" }}>
        {weekDays.map((d,i)=>{
          const dStr  = d.toISOString().slice(0,10);
          const dayEvs= allEvents.filter(e=>(e.fecha||e.creado?.slice(0,10))===dStr);
          const isSel = dStr===dateStr;
          const isWknd= i===0||i===6;
          return (
            <div key={dStr} onClick={()=>onSelectDay(dStr)}
              style={{
                borderRight:i<6?`1px solid ${G.border}`:"none",
                padding:"10px 6px",
                minHeight:110,
                cursor:"pointer",
                background:isSel ? "rgba(37,99,235,0.03)" : isWknd ? G.weekendBg : "transparent",
                transition:"background 0.15s",
              }}>
              {dayEvs.slice(0,5).map(ev=>{
                const cs    = getEvStyle(ev);
                const hora  = getEventTime(ev);
                const title = getEventTitle(ev);
                return (
                  <div key={ev.id}
                    onClick={e=>{e.stopPropagation(); onEditEvent(ev);}}
                    style={{
                      background:cs.bg, border:`1px solid ${cs.border}`,
                      borderRadius:8, padding:"6px 8px", marginBottom:5,
                      cursor:"pointer", transition:"filter 0.1s",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.95)"}
                    onMouseLeave={e=>e.currentTarget.style.filter="none"}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                      <span style={{
                        fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:4,
                        background:cs.badgeBg, color:cs.badgeText,
                        border:`1px solid ${cs.border}`, letterSpacing:"0.03em",
                      }}>{cs.badgeLabel}</span>
                      {hora && <span style={{ fontSize:9, fontWeight:700, color:G.accent }}>{hora}</span>}
                    </div>
                    <div style={{
                      fontSize:11, fontWeight:700, color:G.textPrimary,
                      overflow:"hidden", display:"-webkit-box",
                      WebkitLineClamp:2, WebkitBoxOrient:"vertical", lineHeight:1.3,
                    }}>{title}</div>
                  </div>
                );
              })}
              {dayEvs.length > 5 && (
                <div style={{ fontSize:9, color:G.textTertiary, paddingLeft:2 }}>+{dayEvs.length-5} más</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista Día ─────────────────────────────────────────────────────────────────
function DayView({ dateStr, allEvents, onNewEvent, onEditEvent }) {
  const date   = new Date(dateStr+"T12:00:00");
  const dayEvs = allEvents.filter(e=>(e.fecha||e.creado?.slice(0,10))===dateStr);
  const dayName= date.toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"});

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
      <div style={{
        background: G.glass,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 20,
        border: `1px solid ${G.glassBorder}`,
        padding: "24px 28px", minHeight: 300,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      }}>
        {/* Day header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{
              fontSize:24, fontWeight:900, color:G.textPrimary,
              letterSpacing:"-0.03em", textTransform:"capitalize",
            }}>{dayName}</div>
            <div style={{ fontSize:12, fontStyle:"italic", color:G.textTertiary, marginTop:3 }}>
              Resumen operativo diario
            </div>
          </div>
          <button onClick={onNewEvent} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"10px 18px", borderRadius:12,
            background:G.textPrimary, color:"#ffffff",
            fontSize:12, fontWeight:700, border:"none", cursor:"pointer",
            boxShadow:"0 2px 10px rgba(0,0,0,0.18)",
          }}>+ Nueva Tarea del Día</button>
        </div>

        <div style={{ height:1, background:G.border, marginBottom:16 }} />

        {dayEvs.length === 0 ? (
          <div style={{ textAlign:"center", padding:"44px 0", color:G.textTertiary }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.4 }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:G.textSecondary }}>Sin eventos para este día</div>
            <button onClick={onNewEvent} style={{
              marginTop:12, fontSize:12, color:G.accent, fontWeight:600,
              background:"none", border:"none", cursor:"pointer",
            }}>+ Agregar evento</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {dayEvs.map(ev=>{
              const cs     = getEvStyle(ev);
              const hora   = getEventTime(ev);
              const title  = getEventTitle(ev);
              const status = getStatusLabel(ev);
              const p      = ev.datos?.prioridad || "media";
              const prioLbl= p==="alta"?"PRIORIDAD ALTA":p==="baja"?"PRIORIDAD BAJA":"PRIORIDAD MEDIA";

              return (
                <div key={ev.id}
                  onClick={()=>onEditEvent(ev)}
                  style={{
                    display:"flex", alignItems:"center", gap:14,
                    background:cs.bg, border:`1px solid ${cs.border}`,
                    borderRadius:14, padding:"14px 18px",
                    cursor:"pointer", transition:"filter 0.15s, transform 0.1s",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.filter="brightness(0.97)"; e.currentTarget.style.transform="translateY(-1px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.filter="none"; e.currentTarget.style.transform="none";}}
                >
                  <Avatar text={title} size={40} />
                  <div style={{ flex:1 }}>
                    <div style={{
                      fontSize:11, fontWeight:700, color:G.accent,
                      marginBottom:4, display:"flex", alignItems:"center", gap:5, flexWrap:"wrap",
                    }}>
                      {prioLbl}
                      <span style={{ color:G.textTertiary, fontSize:9 }}>·</span>
                      {status}
                      {hora && <><span style={{ color:G.textTertiary, fontSize:9 }}>·</span>{hora}</>}
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, color:G.textPrimary, letterSpacing:"-0.02em" }}>
                      {title}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ViewCalendario({ items=[], setItems, darkMode=false }) {
  G = darkMode ? DARK_C : LIGHT_C;
  const today    = new Date();
  const todayStr = today.toISOString().slice(0,10);

  const [selectedDate,    setSelectedDate]    = useState(todayStr);
  const [calMonth,        setCalMonth]        = useState(today.getMonth());
  const [calYear,         setCalYear]         = useState(today.getFullYear());
  const [viewMode,        setViewMode]        = useState("mes");
  const [showNuevoEvento, setShowNuevoEvento] = useState(false);
  const [editingEv,       setEditingEv]       = useState(null);
  const [searchQuery,     setSearchQuery]     = useState("");

  const [eventos, setEventos] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("cerebro_eventos")||"[]"); }
    catch { return []; }
  });
  useEffect(()=>{ localStorage.setItem("cerebro_eventos", JSON.stringify(eventos)); },[eventos]);

  const itemsConFecha = items.filter(i=>i.fecha&&(i.tipo==="tarea"||i.tipo==="recordatorio"||i.tipo==="reunion"));
  const allEvents     = [...itemsConFecha, ...eventos];
  const filtered      = searchQuery.trim()
    ? allEvents.filter(e=>getEventTitle(e).toLowerCase().includes(searchQuery.toLowerCase()))
    : allEvents;

  function prevPeriod() {
    const d=new Date(selectedDate+"T12:00:00");
    if(viewMode==="dia") d.setDate(d.getDate()-1);
    else if(viewMode==="semana") d.setDate(d.getDate()-7);
    else d.setMonth(d.getMonth()-1);
    const s=d.toISOString().slice(0,10);
    setSelectedDate(s); setCalMonth(d.getMonth()); setCalYear(d.getFullYear());
  }
  function nextPeriod() {
    const d=new Date(selectedDate+"T12:00:00");
    if(viewMode==="dia") d.setDate(d.getDate()+1);
    else if(viewMode==="semana") d.setDate(d.getDate()+7);
    else d.setMonth(d.getMonth()+1);
    const s=d.toISOString().slice(0,10);
    setSelectedDate(s); setCalMonth(d.getMonth()); setCalYear(d.getFullYear());
  }
  function goToday() { setSelectedDate(todayStr); setCalMonth(today.getMonth()); setCalYear(today.getFullYear()); }

  function periodoLabel() {
    const d=new Date(selectedDate+"T12:00:00");
    if(viewMode==="dia")    return `${d.getDate()} DE ${MESES_UP[d.getMonth()]} DE ${d.getFullYear()}`;
    if(viewMode==="semana"){
      const s=new Date(d); s.setDate(d.getDate()-d.getDay());
      const e=new Date(s); e.setDate(s.getDate()+6);
      return `${s.getDate()} ${MESES_SH[s.getMonth()].toUpperCase()} - ${e.getDate()} ${MESES_SH[e.getMonth()].toUpperCase()}`;
    }
    return `${MESES_UP[calMonth]} ${calYear}`;
  }

  function handleSelectDay(dStr) {
    setSelectedDate(dStr);
    const d=new Date(dStr+"T12:00:00");
    setCalMonth(d.getMonth()); setCalYear(d.getFullYear());
  }

  // Guardar nueva tarea desde calendario → va a items (visible en Tareas también)
  function handleSaveEvento({ titulo, descripcion, fase, prioridad, flujo, fecha, hora, responsable }) {
    const nuevo = {
      id: uid(), tipo: "tarea",
      texto: titulo,
      datos: { titulo, descripcion, prioridad, categoria: flujo, hora, responsable, _kanban: fase },
      fecha: fecha || hoyStr(),
      creado: nowISO(),
      hecho: fase === "hecho",
      columna: fase==="hecho"?"hecho":fase==="inprogress"?"hoy":fase==="revision"?"semana":"cesta",
    };
    setItems(prev => [nuevo, ...prev]);
    if (fecha) setSelectedDate(fecha);
    setShowNuevoEvento(false);
  }

  // Guardar edición
  function handleEditSave({ titulo, descripcion, fase, prioridad, flujo, fecha, hora, responsable }) {
    if (!editingEv) return;
    const update = (item) => ({
      ...item,
      texto: titulo,
      hecho: fase === "hecho",
      fecha: fecha || item.fecha,
      columna: fase==="hecho"?"hecho":fase==="inprogress"?"hoy":fase==="revision"?"semana":"cesta",
      datos: { ...item.datos, titulo, descripcion, prioridad, categoria: flujo, hora, responsable, _kanban: fase },
    });
    if (eventos.find(e => e.id === editingEv.id)) {
      setEventos(prev => prev.map(e => e.id === editingEv.id ? update(e) : e));
    } else {
      setItems(prev => prev.map(i => i.id === editingEv.id ? update(i) : i));
    }
    setEditingEv(null);
  }

  function handleEditDelete(id) {
    if (eventos.find(e => e.id === id)) setEventos(prev => prev.filter(e => e.id !== id));
    else setItems(prev => prev.filter(i => i.id !== id));
    setEditingEv(null);
  }

  // ── Derived: events for selected day (for sidebar timeline) ────────────────
  const selectedDayEvents = filtered
    .filter(e => (e.fecha||"").slice(0,10) === selectedDate)
    .sort((a,b) => (getEventTime(a)||"").localeCompare(getEventTime(b)||""));

  const selectedDateObj = new Date(selectedDate + "T12:00:00");
  const diasSemana = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
  const selectedDayName = diasSemana[selectedDateObj.getDay()];
  const selectedDayNum  = selectedDateObj.getDate();
  const selectedMonthName = MESES[selectedDateObj.getMonth()];

  const isToday = selectedDate === todayStr;

  // AI insight based on selected day events
  const aiInsight = selectedDayEvents.length === 0
    ? `${isToday ? "Hoy" : "Este día"} tienes el horario libre. ¿Te gustaría bloquear tiempo para trabajo profundo?`
    : `${isToday ? "Hoy" : "Este día"} tienes ${selectedDayEvents.length} evento${selectedDayEvents.length!==1?"s":""} programado${selectedDayEvents.length!==1?"s":""}. ${selectedDayEvents[0] ? `Empieza con "${getEventTitle(selectedDayEvents[0])}"${getEventTime(selectedDayEvents[0]) ? ` a las ${getEventTime(selectedDayEvents[0])}.` : "."}` : ""}`;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:G.bg, overflow:"hidden", fontFamily:"-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>

      {/* ── Calendar Header (Stitch style) ── */}
      <div style={{ padding:"14px 20px", borderBottom:`1px solid ${G.border}`, background: darkMode ? "rgba(26,26,36,0.95)" : "rgba(255,255,255,0.85)", backdropFilter:"blur(12px)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>

        {/* Left: period label + nav + today */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <h1 style={{ fontSize:17, fontWeight:700, color:G.textPrimary, margin:0, minWidth:160 }}>
            {periodoLabel()}
          </h1>
          <div style={{ display:"flex", background: darkMode ? "rgba(255,255,255,0.07)" : G.card, borderRadius:8, overflow:"hidden", border:`1px solid ${G.border}` }}>
            <button onClick={prevPeriod} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", cursor:"pointer", color:G.textSecondary, borderRight:`1px solid ${G.border}` }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={nextPeriod} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", cursor:"pointer", color:G.textSecondary }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <button onClick={goToday} style={{ padding:"5px 14px", background: darkMode ? "rgba(255,255,255,0.07)" : "#ffffff", border:`1px solid ${G.border}`, borderRadius:8, fontSize:12, fontWeight:600, color:G.textSecondary, cursor:"pointer" }}>
            Hoy
          </button>
          {/* Search */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 11px", background: darkMode ? "rgba(255,255,255,0.05)" : G.card, border:`1px solid ${G.border}`, borderRadius:20, maxWidth:180 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Buscar eventos..."
              style={{ border:"none", background:"transparent", fontSize:12, color:G.textPrimary, outline:"none", width:120, fontFamily:"inherit" }} />
          </div>
        </div>

        {/* Center: view mode toggle */}
        <div style={{ display:"flex", alignItems:"center", background: darkMode ? "rgba(255,255,255,0.07)" : G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:3, gap:2 }}>
          {[["mes","Mes"],["semana","Semana"],["dia","Día"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setViewMode(id)}
              style={{ padding:"5px 14px", borderRadius:9, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, transition:"all 0.15s",
                background: viewMode===id ? (darkMode ? G.accent : "#ffffff") : "transparent",
                color: viewMode===id ? (darkMode ? "#fff" : G.accent) : G.textSecondary,
                boxShadow: viewMode===id ? "0 1px 6px rgba(0,0,0,0.1)" : "none" }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Right: + Evento teal button */}
        <button onClick={()=>setShowNuevoEvento(true)}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 20px", background:G.teal, color:"#fff", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:`0 4px 14px ${G.teal}30`, transition:"filter 0.15s", flexShrink:0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Evento
        </button>
      </div>

      {/* ── Main content: calendar + right panel ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Calendar area */}
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", padding:"16px 16px 16px 20px" }}>
          <div style={{
            flex:1,
            background: darkMode ? G.glass : "#ffffff",
            backdropFilter: darkMode ? "blur(20px)" : "none",
            WebkitBackdropFilter: darkMode ? "blur(20px)" : "none",
            borderRadius: 20,
            border: `1px solid ${G.border}`,
            overflow:"hidden", display:"flex", flexDirection:"column",
            boxShadow: darkMode ? "0 4px 24px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            {viewMode==="mes" && (
              <MonthView
                year={calYear} month={calMonth}
                selectedDate={selectedDate}
                allEvents={filtered}
                onSelectDay={handleSelectDay}
                onEditEvent={setEditingEv}
              />
            )}
            {viewMode==="semana" && (
              <WeekView
                dateStr={selectedDate}
                allEvents={filtered}
                onSelectDay={handleSelectDay}
                onEditEvent={setEditingEv}
              />
            )}
            {viewMode==="dia" && (
              <DayView
                dateStr={selectedDate}
                allEvents={filtered}
                onNewEvent={()=>setShowNuevoEvento(true)}
                onEditEvent={setEditingEv}
              />
            )}
          </div>
        </div>

        {/* Right side panel */}
        <div style={{ width:290, flexShrink:0, height:"100%", borderLeft:`1px solid ${G.border}`,
          background: darkMode ? "rgba(26,26,36,0.8)" : "rgba(255,255,255,0.75)",
          backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          display:"flex", flexDirection:"column", overflowY:"auto", padding:"20px 20px 0" }}>

          <h3 style={{ fontSize:16, fontWeight:700, color:G.textPrimary, margin:"0 0 16px" }}>Detalles del Día</h3>

          {/* Day display */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
            <div style={{ textAlign:"center", background: isToday ? `${G.teal}15` : (darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
              color: isToday ? G.teal : G.textSecondary,
              padding:"10px 14px", borderRadius:16,
              border: isToday ? `1px solid ${G.teal}30` : `1px solid ${G.border}`, minWidth:60 }}>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.08em", lineHeight:1 }}>{selectedDayName}</div>
              <div style={{ fontSize:28, fontWeight:900, lineHeight:1.1, marginTop:3 }}>{selectedDayNum}</div>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:G.textPrimary }}>
                {isToday ? "Hoy, " : ""}{selectedDayNum} de {selectedMonthName}
              </div>
              <div style={{ fontSize:12, color:G.textTertiary, marginTop:3 }}>
                {selectedDayEvents.length === 0
                  ? "Sin eventos"
                  : `${selectedDayEvents.length} evento${selectedDayEvents.length!==1?"s":""} programado${selectedDayEvents.length!==1?"s":""}`}
              </div>
            </div>
          </div>

          {/* Timeline */}
          {selectedDayEvents.length > 0 && (
            <div style={{ position:"relative", marginBottom:24 }}>
              {/* Vertical line */}
              <div style={{ position:"absolute", left:8, top:8, bottom:8, width:1, background: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} />
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                {selectedDayEvents.slice(0,5).map((ev, i) => {
                  const evS = getEvStyle(ev);
                  const dotColors = [G.teal, G.purple, G.amber, G.accent, G.coral];
                  const dotColor = dotColors[i % dotColors.length];
                  return (
                    <div key={ev.id} style={{ position:"relative", paddingLeft:28 }}>
                      <div style={{ position:"absolute", left:0, top:4, width:16, height:16, borderRadius:"50%",
                        background: i===0 ? dotColor : "transparent",
                        border: i===0 ? "none" : `2px solid ${darkMode?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.15)"}`,
                        boxShadow: i===0 ? `0 0 0 3px ${dotColor}20` : "none" }} />
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:G.textPrimary, marginBottom:2, lineHeight:1.3 }}>
                            {getEventTitle(ev)}
                          </div>
                          <div style={{ fontSize:11, color:G.textTertiary }}>
                            {ev.datos?.categoria || ev.datos?.flujo || ""}
                          </div>
                        </div>
                        {getEventTime(ev) && (
                          <span style={{ fontSize:10, color:G.textTertiary, whiteSpace:"nowrap", flexShrink:0 }}>
                            {getEventTime(ev)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add event shortcut */}
          <button onClick={()=>{ setShowNuevoEvento(true); }}
            style={{ width:"100%", padding:"12px", marginBottom:20, border:`2px dashed ${darkMode?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}`, borderRadius:14, background:"transparent", color:G.textTertiary, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background=darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor=G.teal; e.currentTarget.style.color=G.teal; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=darkMode?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"; e.currentTarget.style.color=G.textTertiary; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar evento aquí
          </button>

          {/* AI Insight */}
          <div style={{ background: darkMode ? `${G.accent}12` : `${G.accent}08`, borderRadius:18, padding:18, border:`1px solid ${G.accent}18`, position:"relative", overflow:"hidden", marginBottom:20 }}>
            <div style={{ position:"absolute", right:-16, top:-16, width:64, height:64, background:`${G.accent}15`, borderRadius:"50%", filter:"blur(20px)" }} />
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:`conic-gradient(from 180deg, ${G.accent} 0deg, ${G.purple} 180deg, ${G.teal} 360deg)`, filter:"blur(3px)", flexShrink:0 }} />
                <span style={{ fontSize:10, fontWeight:800, color:G.accent, textTransform:"uppercase", letterSpacing:"0.1em" }}>Insight de IA</span>
              </div>
              <p style={{ fontSize:12, color:G.textSecondary, fontStyle:"italic", lineHeight:1.7, margin:"0 0 12px" }}>
                "{aiInsight}"
              </p>
              <button onClick={()=>setShowNuevoEvento(true)}
                style={{ width:"100%", padding:"8px", background:G.accent, color:"#fff", border:"none", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", transition:"opacity 0.15s" }}>
                Bloquear tiempo
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, paddingBottom:20 }}>
            <div style={{ background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius:14, padding:"12px 14px", border:`1px solid ${G.border}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:G.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Este Mes</div>
              <div style={{ fontSize:20, fontWeight:900, color:G.textPrimary }}>
                {allEvents.filter(e => {
                  const d = new Date((e.fecha||"")+"T12:00:00");
                  return d.getMonth()===calMonth && d.getFullYear()===calYear;
                }).length}
              </div>
              <div style={{ fontSize:10, color:G.textTertiary }}>eventos</div>
            </div>
            <div style={{ background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius:14, padding:"12px 14px", border:`1px solid ${G.border}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:G.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Hoy</div>
              <div style={{ fontSize:20, fontWeight:900, color:G.teal }}>
                {allEvents.filter(e => (e.fecha||"").slice(0,10)===todayStr).length}
              </div>
              <div style={{ fontSize:10, color:G.textTertiary }}>eventos</div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {showNuevoEvento && (
        <ModalTareaCalendario
          defaultDate={selectedDate}
          onClose={()=>setShowNuevoEvento(false)}
          onSave={handleSaveEvento}
        />
      )}
      {editingEv && (
        <ModalTareaCalendario
          ev={editingEv}
          defaultDate={selectedDate}
          onClose={()=>setEditingEv(null)}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
        />
      )}
    </div>
  );
}
