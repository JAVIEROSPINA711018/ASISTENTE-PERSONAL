import { useState, useRef, useEffect, useCallback } from "react";

// ── Paletas — CRM Design System ───────────────────────────────────────────────
import { LIGHT as LIGHT_N, DARK as DARK_N } from "../lib/theme.js";
// G a nivel módulo (fallback para componentes internos sin prop)
let G = LIGHT_N;

// ── Iconos SVG premium ──────────────────────────────────────────────────────────
const IcoNote = ({ c, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IcoSparkles = ({ c, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063A2 2 0 0 0 14.063 15.5l-1.582 6.135a.5.5 0 0 1-.962 0zM20 4v4M18 6h4" />
  </svg>
);
const IcoCheckSquare = ({ c, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const IcoImage = ({ c, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IcoBulb = ({ c, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <line x1="9" y1="18" x2="15" y2="18" />
    <line x1="10" y1="22" x2="14" y2="22" />
  </svg>
);
const IcoBell = ({ c, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IcoCalendar = ({ c, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoAlertTriangle = ({ c, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IcoCheckCircle = ({ c, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IcoXCircle = ({ c, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const TAGS_PRESET = [
  { name: "trabajo",  color: G.accent, bg: G.accentSoft },
  { name: "personal", color: G.green,  bg: G.greenSoft  },
  { name: "ideas",    color: G.purple, bg: G.purpleSoft  },
  { name: "gastos",   color: G.coral,  bg: G.coralSoft   },
  { name: "proyecto", color: G.amber,  bg: G.amberSoft   },
];

const CALLOUT_TYPES = {
  info:    { icon: <IcoBulb s={18} />, color: G.accent, bg: G.accentSoft, border: "rgba(0,113,227,0.18)" },
  warning: { icon: <IcoAlertTriangle s={18} />, color: G.amber,  bg: G.amberSoft,  border: "rgba(255,149,0,0.18)"  },
  success: { icon: <IcoCheckCircle s={18} />, color: G.green,  bg: G.greenSoft,  border: "rgba(52,199,89,0.18)"  },
  error:   { icon: <IcoXCircle s={18} />, color: G.coral,  bg: G.coralSoft,  border: "rgba(255,59,48,0.18)"  },
};

// ── Slash menu options ────────────────────────────────────────────────────────
const SLASH_MENU = [
  { grupo: "Texto",
    items: [
      { tipo: "texto",  icon: "¶",  label: "Párrafo",   hint: "Texto libre" },
      { tipo: "h1",     icon: "H1", label: "Título 1",  hint: "Grande" },
      { tipo: "h2",     icon: "H2", label: "Título 2",  hint: "Mediano" },
      { tipo: "h3",     icon: "H3", label: "Título 3",  hint: "Pequeño" },
      { tipo: "quote",  icon: "❝",  label: "Cita",      hint: "Reflexión o cita" },
    ]},
  { grupo: "Listas",
    items: [
      { tipo: "checklist", icon: <IcoCheckSquare s={14} />,  label: "Casillas", hint: "Lista con checkboxes" },
      { tipo: "bullet",    icon: "•",  label: "Viñetas",  hint: "Lista con puntos" },
      { tipo: "numbered",  icon: "1.", label: "Numerada", hint: "Lista numerada" },
    ]},
  { grupo: "Bloques",
    items: [
      { tipo: "callout",      icon: <IcoBulb s={14} />, label: "Callout",       hint: "Nota destacada" },
      { tipo: "recordatorio", icon: <IcoBell s={14} />, label: "Recordatorio",  hint: "Alarma con fecha/hora" },
      { tipo: "agenda",       icon: <IcoCalendar s={14} />, label: "Agenda del día", hint: "Mini horario" },
      { tipo: "divider",      icon: "—",  label: "Separador",     hint: "Línea horizontal" },
      { tipo: "imagen",       icon: <IcoImage s={14} />, label: "Imagen",        hint: "Foto o archivo" },
      { tipo: "lugar",        icon: "⌖",  label: "Lugar",         hint: "Mapa, foto y contexto" },
      { tipo: "mapa",         icon: "⌕",  label: "Mapa",          hint: "Enlace de ubicación" },
      { tipo: "galeria",      icon: "▦",  label: "Galería",       hint: "Varias imágenes" },
      { tipo: "recurso",      icon: "↗",  label: "Recurso",       hint: "Link o documento" },
      { tipo: "itinerario",   icon: "☷",  label: "Itinerario",    hint: "Plan por etapas" },
    ]},
];

function uid() { return Math.random().toString(36).slice(2, 9); }

function notaToEditor(nota) {
  if (nota.bloques?.length > 0) return nota.bloques;
  const contenido = nota.datos?.descripcion || nota.texto || "";
  return [{ id: uid(), tipo: "texto", contenido }];
}
function getSnippet(nota) {
  const bloques = nota.bloques || [];
  const txt = bloques.find(b => b.tipo === "texto" && b.contenido?.trim());
  return txt ? txt.contenido.slice(0, 80) : (nota.datos?.descripcion || nota.texto || "").slice(0, 80);
}
function getThumbnail(nota) {
  const bloques = nota.bloques || [];
  return bloques.find(b => b.tipo === "imagen")?.src
    || bloques.find(b => b.tipo === "lugar" && b.imageUrl)?.imageUrl
    || bloques.find(b => b.tipo === "galeria")?.imagenes?.find(img => img.src)?.src
    || null;
}
function getTitulo(nota) {
  return nota.titulo || nota.datos?.titulo || nota.texto || "Sin título";
}
function makeBlock(tipo) {
  const base = { id: uid(), tipo };
  if (["texto","h1","h2","h3","quote"].includes(tipo)) return { ...base, contenido: "" };
  if (tipo === "checklist") return { ...base, items: [{ id: uid(), texto: "", hecho: false }] };
  if (["bullet","numbered"].includes(tipo)) return { ...base, items: [{ id: uid(), texto: "" }] };
  if (tipo === "callout") return { ...base, contenido: "", calloutType: "info" };
  if (tipo === "recordatorio") return { ...base, titulo: "", fecha: "", hora: "", descripcion: "", activo: true };
  if (tipo === "agenda") return { ...base, fecha: new Date().toISOString().slice(0,10), eventos: [{ id: uid(), hora: "09:00", titulo: "", hecho: false }] };
  if (tipo === "divider") return base;
  if (tipo === "imagen") return { ...base, src: "", caption: "" };
  if (tipo === "lugar") return { ...base, nombre: "", ciudad: "", pais: "", descripcion: "", mapUrl: "", imageUrl: "" };
  if (tipo === "mapa") return { ...base, titulo: "", query: "", mapUrl: "" };
  if (tipo === "galeria") return { ...base, titulo: "", imagenes: [{ id: uid(), src: "", caption: "" }] };
  if (tipo === "recurso") return { ...base, titulo: "", url: "", descripcion: "" };
  if (tipo === "itinerario") return { ...base, titulo: "Itinerario", dias: [{ id: uid(), fecha: "", titulo: "Día 1", items: [{ id: uid(), hora: "", actividad: "", lugar: "" }] }] };
  return base;
}

// ── Tag chip ──────────────────────────────────────────────────────────────────
function TagChip({ tag, onRemove, small }) {
  const preset = TAGS_PRESET.find(t => t.name === tag) || { color: G.textSecondary, bg: "rgba(0,0,0,0.05)" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3,
      background:preset.bg, color:preset.color,
      border:`1px solid ${preset.color}22`,
      borderRadius:20, padding: small?"2px 8px":"3px 10px",
      fontSize: small?10:11, fontWeight:600 }}>
      #{tag}
      {onRemove && <button onClick={onRemove} style={{ background:"none", border:"none",
        color:preset.color, cursor:"pointer", padding:0, lineHeight:1, fontSize:12 }}>×</button>}
    </span>
  );
}

// ── Menú slash flotante ───────────────────────────────────────────────────────
function SlashMenu({ query, onSelect, onClose, anchorRef }) {
  const [idx, setIdx] = useState(0);
  const q = query.toLowerCase();
  const allItems = SLASH_MENU.flatMap(g => g.items);
  const filtered = q ? allItems.filter(i => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q)) : allItems;

  useEffect(() => { setIdx(0); }, [query]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i+1, filtered.length-1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setIdx(i => Math.max(i-1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); if (filtered[idx]) onSelect(filtered[idx].tipo); }
      if (e.key === "Escape")    { onClose(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, filtered, onSelect, onClose]);

  if (filtered.length === 0) return null;

  // Agrupar solo los filtrados
  const groups = q
    ? [{ grupo: "Resultados", items: filtered }]
    : SLASH_MENU.map(g => ({ ...g, items: g.items.filter(i => filtered.includes(i)) })).filter(g => g.items.length > 0);

  let globalIdx = 0;

  return (
    <div style={{
      position: "absolute", left: 0, top: "100%", zIndex: 300,
      background: "#fff", borderRadius: 12,
      boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
      border: `1px solid ${G.border}`,
      width: 260, padding: "6px 0", marginTop: 4,
      animation: "fadeIn 0.12s ease",
    }}>
      {groups.map(group => (
        <div key={group.grupo}>
          <div style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary,
            textTransform: "uppercase", letterSpacing: "0.08em", padding: "5px 12px 2px" }}>
            {group.grupo}
          </div>
          {group.items.map(item => {
            const isActive = globalIdx === idx;
            const currentIdx = globalIdx++;
            return (
              <div key={item.tipo}
                onClick={() => onSelect(item.tipo)}
                onMouseEnter={() => setIdx(currentIdx)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 12px", cursor: "pointer",
                  background: isActive ? G.accentSoft : "transparent",
                  transition: "background 0.1s",
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: isActive ? G.accent : "rgba(0,0,0,0.04)",
                  color: isActive ? "#fff" : G.textSecondary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? G.accent : G.textPrimary }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: G.textTertiary }}>{item.hint}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${G.border}`, margin: "4px 0 0",
        padding: "5px 12px", fontSize: 9, color: G.textTertiary }}>
        ↑↓ navegar · ↵ insertar · Esc cerrar
      </div>
    </div>
  );
}

// ── Bloque texto / heading ────────────────────────────────────────────────────
function TextBlock({ bloque, onUpdate, onEnter, onDelete, onSlash, autoFocus }) {
  const ref = useRef(null);
  const [showSlash, setShowSlash] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");

  const isH1 = bloque.tipo === "h1", isH2 = bloque.tipo === "h2", isH3 = bloque.tipo === "h3";
  const isQuote = bloque.tipo === "quote";
  const fontSize = isH1 ? 28 : isH2 ? 21 : isH3 ? 17 : 15;
  const fontWeight = (isH1||isH2||isH3) ? 800 : bloque.negrita ? 700 : 400;
  const color = (isH1||isH2||isH3) ? G.textPrimary : G.textPrimary;
  const fontFamily = (isH1||isH2||isH3) ? "Outfit, Inter, sans-serif" : "Inter, sans-serif";

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
      const len = ref.current.value.length;
      try { ref.current.setSelectionRange(len, len); } catch {}
    }
  }, [autoFocus]);

  function autoResize(el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  function handleChange(e) {
    const val = e.target.value;
    if (val === "/" || val.startsWith("/")) {
      setShowSlash(true);
      setSlashQuery(val.slice(1));
    } else {
      setShowSlash(false);
      setSlashQuery("");
    }
    onUpdate({ ...bloque, contenido: val });
    autoResize(e.target);
  }

  function handleKeyDown(e) {
    if (showSlash && ["ArrowUp","ArrowDown","Enter"].includes(e.key)) return; // delegado al SlashMenu
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setShowSlash(false); onEnter(); }
    if (e.key === "Backspace" && !bloque.contenido) { e.preventDefault(); onDelete(); }
    if (e.key === "Escape") setShowSlash(false);
  }

  function handleSlashSelect(tipo) {
    setShowSlash(false);
    setSlashQuery("");
    if (tipo === "imagen") { onSlash("imagen"); onUpdate({ ...bloque, contenido: "" }); return; }
    // Si es un tipo compatible con texto, cambia el tipo del bloque actual
    if (["texto","h1","h2","h3","quote"].includes(tipo)) {
      onUpdate({ ...bloque, tipo, contenido: "" });
    } else {
      onUpdate({ ...bloque, contenido: "" });
      onSlash(tipo);
    }
  }

  const placeholder = isH1 ? "Título 1" : isH2 ? "Título 2" : isH3 ? "Título 3"
    : isQuote ? "Escribe una cita o reflexión…"
    : !bloque.contenido ? "Escribe algo, o usa / para insertar un bloque…" : "";

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 0 }}>
      {isQuote && (
        <div style={{ width: 4, minHeight: 44, background: G.accent,
          borderRadius: 2, flexShrink: 0, marginRight: 14, marginTop: 2 }} />
      )}
      <textarea
        ref={ref}
        value={bloque.contenido || ""}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onInput={e => autoResize(e.target)}
        placeholder={placeholder}
        style={{
          flex: 1, border: "none", outline: "none", resize: "none",
          background: "transparent",
          fontSize, fontWeight, color, fontFamily,
          fontStyle: bloque.cursiva ? "italic" : "normal",
          textDecoration: bloque.subrayado ? "underline" : bloque.tachado ? "line-through" : "none",
          lineHeight: isH1 ? 1.2 : isH2 ? 1.25 : 1.75,
          letterSpacing: isH1 ? "-0.04em" : isH2 ? "-0.02em" : "normal",
          minHeight: isH1 ? 40 : isH2 ? 32 : isH3 ? 26 : 26,
          width: "100%", boxSizing: "border-box", overflow: "hidden",
          padding: isQuote ? "4px 0" : "2px 0",
          caretColor: G.accent,
        }}
      />
      {showSlash && (
        <SlashMenu
          query={slashQuery}
          onSelect={handleSlashSelect}
          onClose={() => { setShowSlash(false); setSlashQuery(""); }}
          anchorRef={ref}
        />
      )}
    </div>
  );
}

// ── Bloque checklist ──────────────────────────────────────────────────────────
function ChecklistBlock({ bloque, onUpdate }) {
  function toggle(id) {
    onUpdate({ ...bloque, items: bloque.items.map(it => it.id===id ? {...it, hecho:!it.hecho} : it) });
  }
  function editItem(id, texto) {
    onUpdate({ ...bloque, items: bloque.items.map(it => it.id===id ? {...it, texto} : it) });
  }
  function addItem(afterIdx) {
    const items = [...bloque.items];
    items.splice(afterIdx+1, 0, { id: uid(), texto: "", hecho: false });
    onUpdate({ ...bloque, items });
  }
  function removeItem(id) {
    const next = bloque.items.filter(it => it.id !== id);
    if (next.length === 0) return;
    onUpdate({ ...bloque, items: next });
  }
  const done = bloque.items.filter(i => i.hecho).length, total = bloque.items.length;
  return (
    <div>
      {total > 1 && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{ flex:1, height:3, background:"rgba(0,0,0,0.07)", borderRadius:2, overflow:"hidden" }}>
            <div style={{ width:`${Math.round(done/total*100)}%`, height:"100%", background:G.green, borderRadius:2, transition:"width 0.35s" }} />
          </div>
          <span style={{ fontSize:10, fontWeight:700, color: done===total ? G.green : G.textTertiary }}>{done}/{total}</span>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {bloque.items.map((item, idx) => (
          <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div onClick={() => toggle(item.id)} style={{
              width:20, height:20, borderRadius:6, flexShrink:0, cursor:"pointer",
              border:`2px solid ${item.hecho ? G.green : "rgba(0,0,0,0.18)"}`,
              background: item.hecho ? G.green : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s",
            }}>
              {item.hecho && <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
            </div>
            <input value={item.texto} onChange={e => editItem(item.id, e.target.value)}
              onKeyDown={e => {
                if (e.key==="Enter") { e.preventDefault(); addItem(idx); }
                if (e.key==="Backspace" && !item.texto && bloque.items.length>1) { e.preventDefault(); removeItem(item.id); }
              }}
              placeholder="Elemento…"
              style={{ flex:1, border:"none", outline:"none", background:"transparent",
                fontSize:14, color: item.hecho ? G.textTertiary : G.textPrimary,
                textDecoration: item.hecho ? "line-through" : "none",
                fontFamily:"Inter, sans-serif" }} />
          </div>
        ))}
        <button onClick={() => addItem(bloque.items.length-1)}
          style={{ fontSize:12, color:G.accent, fontWeight:600, background:"none",
            border:"none", cursor:"pointer", textAlign:"left", padding:"3px 0", marginTop:2 }}>
          + Agregar elemento
        </button>
      </div>
    </div>
  );
}

// ── Bloque lista (bullet / numbered) ─────────────────────────────────────────
function ListBlock({ bloque, onUpdate }) {
  function editItem(id, texto) {
    onUpdate({ ...bloque, items: bloque.items.map(it => it.id===id ? {...it, texto} : it) });
  }
  function addItem(afterIdx) {
    const items = [...bloque.items];
    items.splice(afterIdx+1, 0, { id: uid(), texto: "" });
    onUpdate({ ...bloque, items });
  }
  function removeItem(id) {
    const next = bloque.items.filter(it => it.id !== id);
    if (next.length === 0) return;
    onUpdate({ ...bloque, items: next });
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {bloque.items.map((item, idx) => (
        <div key={item.id} style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ fontSize:bloque.tipo==="numbered"?13:18, color:G.accent,
            flexShrink:0, width:20, textAlign:"center", lineHeight:1.5,
            fontWeight:700, userSelect:"none" }}>
            {bloque.tipo==="numbered" ? `${idx+1}.` : "•"}
          </span>
          <input value={item.texto} onChange={e => editItem(item.id, e.target.value)}
            onKeyDown={e => {
              if (e.key==="Enter") { e.preventDefault(); addItem(idx); }
              if (e.key==="Backspace" && !item.texto && bloque.items.length>1) { e.preventDefault(); removeItem(item.id); }
            }}
            placeholder="Elemento…"
            style={{ flex:1, border:"none", outline:"none", background:"transparent",
              fontSize:14, color:G.textPrimary, fontFamily:"Inter, sans-serif" }} />
        </div>
      ))}
      <button onClick={() => addItem(bloque.items.length-1)}
        style={{ fontSize:12, color:G.accent, fontWeight:600, background:"none",
          border:"none", cursor:"pointer", textAlign:"left", padding:"3px 0", paddingLeft:28, marginTop:2 }}>
        + Agregar ítem
      </button>
    </div>
  );
}

// ── Bloque callout ────────────────────────────────────────────────────────────
function CalloutBlock({ bloque, onUpdate }) {
  const ct = CALLOUT_TYPES[bloque.calloutType || "info"];
  return (
    <div style={{ display:"flex", gap:12, background:ct.bg,
      border:`1px solid ${ct.border}`, borderRadius:14, padding:"14px 16px" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"center" }}>
        <span style={{ fontSize:20 }}>{ct.icon}</span>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {Object.entries(CALLOUT_TYPES).map(([key,val]) => (
            <button key={key} onClick={() => onUpdate({ ...bloque, calloutType:key })}
              style={{ fontSize:10, background:"none", border:"none", cursor:"pointer",
                opacity: (bloque.calloutType||"info")===key ? 1 : 0.3, padding:0, lineHeight:1 }}>
              {val.icon}
            </button>
          ))}
        </div>
      </div>
      <textarea value={bloque.contenido||""} onChange={e => onUpdate({ ...bloque, contenido:e.target.value })}
        placeholder="Escribe una nota importante…" rows={2}
        style={{ flex:1, border:"none", outline:"none", resize:"none", background:"transparent",
          fontSize:14, color:ct.color, lineHeight:1.65, fontFamily:"Inter, sans-serif",
          fontWeight:500, caretColor:ct.color }}
        onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }} />
    </div>
  );
}

// ── Bloque recordatorio ───────────────────────────────────────────────────────
function RecordatorioBlock({ bloque, onUpdate }) {
  const activo = bloque.activo !== false;
  return (
    <div style={{
      background: activo ? G.amberSoft : "rgba(0,0,0,0.025)",
      border:`1px solid ${activo ? "rgba(255,149,0,0.28)" : "rgba(0,0,0,0.07)"}`,
      borderRadius:14, padding:"14px 16px",
      display:"flex", gap:12, alignItems:"flex-start",
      transition:"all 0.3s",
    }}>
      <span style={{ display:"inline-flex", alignItems:"center", paddingTop:2 }}><IcoBell c={G.amber} s={22} /></span>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        <input value={bloque.titulo||""} onChange={e => onUpdate({ ...bloque, titulo:e.target.value })}
          placeholder="Título del recordatorio…"
          style={{ border:"none", outline:"none", background:"transparent",
            fontSize:14, fontWeight:700, color:G.amber, fontFamily:"Inter, sans-serif", width:"100%" }} />
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <input type="date" value={bloque.fecha||""} onChange={e => onUpdate({ ...bloque, fecha:e.target.value })}
            style={{ padding:"5px 9px", borderRadius:8, border:"1px solid rgba(0,0,0,0.1)",
              fontSize:12, outline:"none", fontFamily:"Inter", color:G.textSecondary }} />
          <input type="time" value={bloque.hora||""} onChange={e => onUpdate({ ...bloque, hora:e.target.value })}
            style={{ padding:"5px 9px", borderRadius:8, border:"1px solid rgba(0,0,0,0.1)",
              fontSize:12, outline:"none", fontFamily:"Inter", color:G.textSecondary }} />
          <button onClick={() => onUpdate({ ...bloque, activo:!activo })}
            style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer",
              background:activo ? G.amber : "rgba(0,0,0,0.06)",
              color:activo ? "#fff" : G.textTertiary, border:"none", transition:"all 0.2s" }}>
            {activo ? "● Activo" : "○ Inactivo"}
          </button>
        </div>
        <textarea value={bloque.descripcion||""} onChange={e => onUpdate({ ...bloque, descripcion:e.target.value })}
          placeholder="Descripción adicional…" rows={1}
          style={{ border:"none", outline:"none", background:"transparent", resize:"none",
            fontSize:13, color:G.textSecondary, fontFamily:"Inter, sans-serif", width:"100%" }}
          onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }} />
      </div>
    </div>
  );
}

// ── Bloque agenda ─────────────────────────────────────────────────────────────
function AgendaBlock({ bloque, onUpdate }) {
  function addEv() {
    onUpdate({ ...bloque, eventos:[...(bloque.eventos||[]), { id:uid(), hora:"", titulo:"", hecho:false }] });
  }
  function editEv(id, field, val) {
    onUpdate({ ...bloque, eventos:bloque.eventos.map(ev => ev.id===id ? {...ev,[field]:val} : ev) });
  }
  function toggleEv(id) {
    onUpdate({ ...bloque, eventos:bloque.eventos.map(ev => ev.id===id ? {...ev,hecho:!ev.hecho} : ev) });
  }
  function removeEv(id) {
    onUpdate({ ...bloque, eventos:(bloque.eventos||[]).filter(ev => ev.id!==id) });
  }
  const fecha = bloque.fecha || "";
  const fechaLabel = fecha
    ? new Date(fecha+"T12:00:00").toLocaleDateString("es-CO", { weekday:"long", day:"numeric", month:"long" })
    : "Sin fecha";
  return (
    <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid rgba(0,113,227,0.20)` }}>
      <div style={{ background:G.accent, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ display:"inline-flex", alignItems:"center" }}><IcoCalendar c="#ffffff" s={16} /></span>
        <span style={{ fontSize:13, fontWeight:700, color:"#fff", flex:1, textTransform:"capitalize" }}>{fechaLabel}</span>
        <input type="date" value={fecha} onChange={e => onUpdate({ ...bloque, fecha:e.target.value })}
          style={{ padding:"3px 8px", borderRadius:7, border:"none", fontSize:11,
            outline:"none", background:"rgba(255,255,255,0.2)", color:"#fff", fontFamily:"Inter" }} />
      </div>
      <div style={{ padding:"12px 16px", background:G.accentSoft, display:"flex", flexDirection:"column", gap:7 }}>
        {(bloque.eventos||[]).map(ev => (
          <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div onClick={() => toggleEv(ev.id)} style={{
              width:18, height:18, borderRadius:5, flexShrink:0, cursor:"pointer",
              border:`2px solid ${ev.hecho ? G.green : G.accent}`,
              background:ev.hecho ? G.green : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {ev.hecho && <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
            </div>
            <input type="time" value={ev.hora} onChange={e => editEv(ev.id,"hora",e.target.value)}
              style={{ width:70, padding:"3px 6px", border:"1px solid rgba(0,0,0,0.12)",
                borderRadius:7, fontSize:11, outline:"none", fontFamily:"Inter",
                color:G.textSecondary, flexShrink:0 }} />
            <input value={ev.titulo} onChange={e => editEv(ev.id,"titulo",e.target.value)}
              placeholder="Actividad…"
              style={{ flex:1, border:"none", outline:"none", background:"transparent",
                fontSize:13, color:ev.hecho ? G.textTertiary : G.textPrimary,
                textDecoration:ev.hecho ? "line-through" : "none", fontFamily:"Inter" }} />
            <button onClick={() => removeEv(ev.id)} style={{ background:"none", border:"none",
              color:G.textTertiary, cursor:"pointer", fontSize:14, opacity:0.35 }}
              onMouseEnter={e => e.currentTarget.style.opacity="1"}
              onMouseLeave={e => e.currentTarget.style.opacity="0.35"}>×</button>
          </div>
        ))}
        <button onClick={addEv} style={{ fontSize:12, color:G.accent, fontWeight:600,
          background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:"2px 0", marginTop:2 }}>
          + Agregar hora
        </button>
      </div>
    </div>
  );
}

// ── Modal selector de imagen (PC vs Wikipedia) ────────────────────────────────
function ImagePickerModal({ onFromPC, onFromUrl, onClose, darkMode }) {
  const [tab, setTab]         = useState("choose"); // "choose" | "search" | "url"
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true); setResults([]);
    try {
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=12&format=json&origin=*`
      );
      const d = await res.json();
      const files = (d.query?.search || []).map(r => {
        const name = r.title.replace("File:", "");
        return {
          name,
          src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}`,
          thumb: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=160`,
        };
      });
      setResults(files);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }

  const bg  = darkMode ? "#1a1a24" : "#ffffff";
  const txt = darkMode ? "#f5f5f7" : "#181c23";
  const sub = darkMode ? "#aeaeb2" : "#414753";
  const brd = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.09)";
  const acc = G.accent;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,0.45)", backdropFilter:"blur(4px)" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:bg, borderRadius:18, width:"min(480px,92vw)", maxHeight:"80vh",
        display:"flex", flexDirection:"column", overflow:"hidden",
        boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:`1px solid ${brd}` }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 18px 10px", borderBottom:`1px solid ${brd}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:txt, display:"flex", alignItems:"center", gap:8 }}><IcoImage c={acc} s={16} /> Agregar imagen</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:18, color:sub, lineHeight:1 }}>✕</button>
        </div>

        {/* Opciones principales */}
        {tab === "choose" && (
          <div style={{ padding:18, display:"flex", flexDirection:"column", gap:10 }}>
            <button onClick={onFromPC}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                borderRadius:12, border:`1px solid ${brd}`, background:"transparent",
                cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:44, height:44, borderRadius:10, background:"rgba(0,113,227,0.1)" }}><IcoNote c={acc} s={22} /></span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:txt }}>Desde mi PC</div>
                <div style={{ fontSize:11, color:sub }}>Sube una foto o imagen guardada</div>
              </div>
            </button>
            <button onClick={() => setTab("search")}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                borderRadius:12, border:`1px solid ${brd}`, background:"transparent",
                cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:44, height:44, borderRadius:10, background:"rgba(94,92,230,0.1)" }}><IcoSparkles c="#5e5ce6" s={22} /></span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:txt }}>Buscar en Wikipedia</div>
                <div style={{ fontSize:11, color:sub }}>Encuentra imágenes de Wikimedia Commons</div>
              </div>
            </button>
            <button onClick={() => setTab("url")}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                borderRadius:12, border:`1px solid ${brd}`, background:"transparent",
                cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:44, height:44, borderRadius:10, background:"rgba(52,199,89,0.1)" }}><IcoBulb c="#34c759" s={22} /></span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:txt }}>Pegar URL</div>
                <div style={{ fontSize:11, color:sub }}>Ingresa el enlace directo de cualquier imagen</div>
              </div>
            </button>
          </div>
        )}

        {/* Buscador Wikipedia */}
        {tab === "search" && (
          <div style={{ display:"flex", flexDirection:"column", gap:0, flex:1, overflow:"hidden" }}>
            <div style={{ padding:"12px 18px", display:"flex", gap:8, borderBottom:`1px solid ${brd}` }}>
              <button onClick={() => setTab("choose")} style={{ background:"none", border:"none",
                cursor:"pointer", color:sub, fontSize:18, padding:"0 4px" }}>‹</button>
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key==="Enter" && doSearch()}
                placeholder="Buscar en Wikimedia Commons…"
                style={{ flex:1, padding:"8px 12px", borderRadius:10, border:`1px solid ${brd}`,
                  background:darkMode?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.04)",
                  color:txt, fontSize:13, outline:"none", fontFamily:"inherit" }} />
              <button onClick={doSearch} disabled={loading||!query.trim()}
                style={{ padding:"8px 14px", borderRadius:10, background:acc, color:"#fff",
                  border:"none", cursor: loading||!query.trim() ? "not-allowed" : "pointer",
                  fontSize:12, fontWeight:700, opacity: !query.trim() ? 0.5 : 1 }}>
                {loading ? "⏳" : "Buscar"}
              </button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:12 }}>
              {loading && (
                <div style={{ textAlign:"center", padding:"30px 0", color:sub, fontSize:12 }}>Buscando…</div>
              )}
              {!loading && results.length === 0 && query && (
                <div style={{ textAlign:"center", padding:"30px 0", color:sub, fontSize:12 }}>Sin resultados. Intenta en inglés.</div>
              )}
              {!loading && results.length === 0 && !query && (
                <div style={{ textAlign:"center", padding:"30px 0", color:sub, fontSize:12 }}>Escribe algo y presiona Buscar</div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {results.map(r => (
                  <button key={r.src} onClick={() => { onFromUrl(r.src, r.name.replace(/\.\w+$/, "").replace(/_/g," ")); onClose(); }}
                    style={{ padding:0, border:`2px solid ${brd}`, borderRadius:10, overflow:"hidden",
                      cursor:"pointer", background:darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.02)",
                      transition:"border-color 0.15s", display:"flex", flexDirection:"column" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = acc}
                    onMouseLeave={e => e.currentTarget.style.borderColor = brd}>
                    <img src={r.thumb} alt={r.name} onError={e => e.target.style.display="none"}
                      style={{ width:"100%", height:80, objectFit:"cover", display:"block" }} />
                    <div style={{ padding:"4px 6px", fontSize:9, color:sub, overflow:"hidden",
                      textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"left" }}>
                      {r.name.replace(/\.\w+$/, "").replace(/_/g," ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pegar URL */}
        {tab === "url" && (
          <div style={{ padding:18, display:"flex", flexDirection:"column", gap:10 }}>
            <button onClick={() => setTab("choose")} style={{ background:"none", border:"none",
              cursor:"pointer", color:sub, fontSize:13, textAlign:"left", padding:0, fontWeight:600 }}>
              ‹ Volver
            </button>
            <input autoFocus value={urlInput} onChange={e => setUrlInput(e.target.value)}
              placeholder="https://..."
              style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${brd}`,
                background:darkMode?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.04)",
                color:txt, fontSize:13, outline:"none", fontFamily:"inherit" }} />
            <button onClick={() => { if(urlInput.trim()) { onFromUrl(urlInput.trim(), ""); onClose(); } }}
              disabled={!urlInput.trim()}
              style={{ padding:"10px", borderRadius:10, background:acc, color:"#fff",
                border:"none", cursor: urlInput.trim() ? "pointer" : "not-allowed",
                fontSize:13, fontWeight:700, opacity: urlInput.trim() ? 1 : 0.5 }}>
              Insertar imagen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bloque imagen ─────────────────────────────────────────────────────────────
function ImageBlock({ bloque, onChange, onDelete }) {
  const [attempt, setAttempt] = useState(0); // 0=original, 1=commons retry, 2=failed

  // Genera la URL a intentar según el intento actual
  const resolvedSrc = (() => {
    if (attempt === 0) return bloque.src;
    if (attempt === 1) {
      // Reintento: cambiar en.wikipedia.org → commons.wikimedia.org
      const src = bloque.src || "";
      if (src.includes("en.wikipedia.org/wiki/Special:FilePath")) {
        return src.replace("en.wikipedia.org/wiki/Special:FilePath", "commons.wikimedia.org/wiki/Special:FilePath");
      }
      if (src.includes("wikipedia.org/wiki/Special:FilePath")) {
        return src.replace(/https?:\/\/[a-z.]+wikipedia\.org\/wiki\/Special:FilePath/, "https://commons.wikimedia.org/wiki/Special:FilePath");
      }
      return src;
    }
    return null; // falló todo
  })();

  // Buscar la imagen en Google cuando todo falla
  const searchQuery = encodeURIComponent((bloque.caption || bloque.src?.split("/").pop()?.replace(/[_-]/g," ").replace(/\.\w+$/,"") || "receta").trim());

  const handleError = () => {
    if (attempt < 1) setAttempt(a => a + 1);
    else setAttempt(2);
  };

  return (
    <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid ${G.border}` }}>
      {attempt === 2 ? (
        <div style={{ width:"100%", minHeight:120, background:"rgba(0,0,0,0.03)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:8, color:G.textTertiary, padding:"18px 12px" }}>
          <span style={{ opacity:0.4 }}><IcoImage c={G.textTertiary} s={36} /></span>
          <span style={{ fontSize:11, textAlign:"center" }}>No se pudo cargar la imagen</span>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
            <a href={`https://www.google.com/search?tbm=isch&q=${searchQuery}`} target="_blank" rel="noreferrer"
              style={{ fontSize:10, fontWeight:700, color:"#0071e3", background:"rgba(0,113,227,0.08)",
                padding:"4px 12px", borderRadius:20, textDecoration:"none", border:"1px solid rgba(0,113,227,0.2)" }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><IcoSparkles c="#0071e3" s={11} /> Buscar en Google</span>
            </a>
            <button onClick={() => { const url = prompt("Pega la URL de la imagen:"); if (url) onChange({ ...bloque, src: url }); setAttempt(0); }}
              style={{ fontSize:10, fontWeight:700, color:G.textSecondary, background:G.formBg||"rgba(0,0,0,0.04)",
                padding:"4px 12px", borderRadius:20, border:`1px solid ${G.border}`, cursor:"pointer" }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><IcoBulb c={G.textSecondary} s={11} /> Pegar URL</span>
            </button>
          </div>
        </div>
      ) : (
        <img src={resolvedSrc} alt={bloque.caption||""} onError={handleError}
          style={{ width:"100%", maxHeight:360, objectFit:"cover", display:"block" }} />
      )}
      <div style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,0.96)", borderTop:`1px solid ${G.border}` }}>
        <input value={bloque.caption||""} onChange={e => onChange({ ...bloque, caption:e.target.value })}
          placeholder="Añade una descripción…"
          style={{ flex:1, padding:"8px 12px", border:"none", background:"transparent",
            fontSize:12, color:G.textSecondary, fontFamily:"Inter", outline:"none" }} />
        <button onClick={onDelete} style={{ padding:"8px 12px", border:"none", background:"none",
          color:G.coral, cursor:"pointer", fontSize:13, fontWeight:600 }}>✕</button>
      </div>
    </div>
  );
}

function mapsUrlFor(text) {
  const q = encodeURIComponent((text || "").trim()).replace(/%20/g, "+");
  return q ? `https://www.google.com/maps/search/?api=1&query=${q}` : "";
}

function MiniField({ value, onChange, placeholder, wide=false }) {
  return (
    <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: wide ? "100%" : "auto", minWidth:0, flex: wide ? "1 1 100%" : "1 1 150px",
        border:`1px solid ${G.border}`, borderRadius:9, padding:"7px 9px", outline:"none",
        background:G.surface, color:G.textPrimary, fontSize:12 }} />
  );
}

function LugarBlock({ bloque, onChange, onDelete }) {
  const query = [bloque.nombre, bloque.ciudad, bloque.pais].filter(Boolean).join(" ");
  const mapUrl = bloque.mapUrl || mapsUrlFor(query);
  return (
    <div style={{ border:`1px solid ${G.border}`, borderRadius:14, overflow:"hidden", background:G.surface, display:"grid", gridTemplateColumns:"minmax(120px, 32%) 1fr" }}>
      <div style={{ minHeight:150, background:"rgba(0,0,0,0.04)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        {bloque.imageUrl ? <img src={bloque.imageUrl} alt={bloque.nombre || ""} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <span style={{ fontSize:34, color:G.textTertiary }}>⌖</span>}
      </div>
      <div style={{ padding:14, display:"flex", flexDirection:"column", gap:9 }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <MiniField value={bloque.nombre} onChange={v => onChange({ ...bloque, nombre:v })} placeholder="Lugar" />
          <MiniField value={bloque.ciudad} onChange={v => onChange({ ...bloque, ciudad:v })} placeholder="Ciudad" />
          <MiniField value={bloque.pais} onChange={v => onChange({ ...bloque, pais:v })} placeholder="País" />
        </div>
        <textarea value={bloque.descripcion || ""} onChange={e => onChange({ ...bloque, descripcion:e.target.value })}
          placeholder="Notas del lugar..."
          style={{ width:"100%", minHeight:54, resize:"vertical", border:`1px solid ${G.border}`, borderRadius:9, padding:"8px 9px", outline:"none", background:G.surface, color:G.textSecondary, fontSize:12, lineHeight:1.45 }} />
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <MiniField value={bloque.imageUrl} onChange={v => onChange({ ...bloque, imageUrl:v })} placeholder="URL de foto" />
          <MiniField value={bloque.mapUrl} onChange={v => onChange({ ...bloque, mapUrl:v })} placeholder="URL de mapa" />
          <a href={mapUrl || "#"} target="_blank" rel="noreferrer"
            style={{ padding:"7px 12px", borderRadius:9, background:G.accentSoft, color:G.accent, border:`1px solid ${G.accent}33`, textDecoration:"none", fontSize:12, fontWeight:800 }}>
            Abrir mapa
          </a>
          <button onClick={onDelete} style={{ padding:"7px 10px", borderRadius:9, border:`1px solid ${G.coral}22`, background:G.coralSoft, color:G.coral, cursor:"pointer", fontSize:12, fontWeight:700 }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

function MapaBlock({ bloque, onChange }) {
  const mapUrl = bloque.mapUrl || mapsUrlFor(bloque.query || bloque.titulo);
  return (
    <div style={{ border:`1px solid ${G.border}`, borderRadius:14, padding:14, background:"rgba(0,0,0,0.025)", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
      <div style={{ width:42, height:42, borderRadius:11, background:G.accentSoft, color:G.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>⌕</div>
      <MiniField value={bloque.titulo} onChange={v => onChange({ ...bloque, titulo:v })} placeholder="Título del mapa" />
      <MiniField value={bloque.query} onChange={v => onChange({ ...bloque, query:v, mapUrl: bloque.mapUrl || mapsUrlFor(v) })} placeholder="Búsqueda o dirección" />
      <a href={mapUrl || "#"} target="_blank" rel="noreferrer"
        style={{ padding:"8px 13px", borderRadius:9, background:G.accent, color:"#fff", textDecoration:"none", fontSize:12, fontWeight:800 }}>
        Abrir mapa
      </a>
    </div>
  );
}

function GaleriaBlock({ bloque, onChange }) {
  const imagenes = Array.isArray(bloque.imagenes) ? bloque.imagenes : [];
  const updateImg = (id, patch) => onChange({ ...bloque, imagenes: imagenes.map(img => img.id === id ? { ...img, ...patch } : img) });
  return (
    <div style={{ border:`1px solid ${G.border}`, borderRadius:14, padding:12, background:G.surface }}>
      <MiniField wide value={bloque.titulo} onChange={v => onChange({ ...bloque, titulo:v })} placeholder="Título de galería" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10, marginTop:10 }}>
        {imagenes.map(img => (
          <div key={img.id} style={{ border:`1px solid ${G.border}`, borderRadius:12, overflow:"hidden" }}>
            {img.src ? <img src={img.src} alt={img.caption || ""} style={{ width:"100%", height:120, objectFit:"cover", display:"block" }} />
              : <div style={{ height:120, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.04)", color:G.textTertiary }}>Imagen</div>}
            <input value={img.src || ""} onChange={e => updateImg(img.id, { src:e.target.value })} placeholder="URL"
              style={{ width:"100%", border:"none", borderTop:`1px solid ${G.border}`, padding:"7px", fontSize:11, outline:"none" }} />
            <input value={img.caption || ""} onChange={e => updateImg(img.id, { caption:e.target.value })} placeholder="Descripción"
              style={{ width:"100%", border:"none", borderTop:`1px solid ${G.border}`, padding:"7px", fontSize:11, outline:"none" }} />
          </div>
        ))}
      </div>
      <button onClick={() => onChange({ ...bloque, imagenes:[...imagenes, { id:uid(), src:"", caption:"" }] })}
        style={{ marginTop:10, padding:"7px 12px", borderRadius:9, border:`1px solid ${G.accent}33`, background:G.accentSoft, color:G.accent, cursor:"pointer", fontSize:12, fontWeight:800 }}>Agregar imagen</button>
    </div>
  );
}

function RecursoBlock({ bloque, onChange }) {
  return (
    <div style={{ border:`1px solid ${G.border}`, borderRadius:14, padding:14, background:G.surface, display:"flex", flexDirection:"column", gap:9 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <MiniField value={bloque.titulo} onChange={v => onChange({ ...bloque, titulo:v })} placeholder="Recurso" />
        <MiniField value={bloque.url} onChange={v => onChange({ ...bloque, url:v })} placeholder="URL" />
        {bloque.url && <a href={bloque.url} target="_blank" rel="noreferrer" style={{ padding:"7px 12px", borderRadius:9, background:G.accentSoft, color:G.accent, textDecoration:"none", fontSize:12, fontWeight:800 }}>Abrir</a>}
      </div>
      <textarea value={bloque.descripcion || ""} onChange={e => onChange({ ...bloque, descripcion:e.target.value })} placeholder="Descripción o utilidad..."
        style={{ width:"100%", minHeight:48, resize:"vertical", border:`1px solid ${G.border}`, borderRadius:9, padding:"8px 9px", outline:"none", background:G.surface, color:G.textSecondary, fontSize:12 }} />
    </div>
  );
}

function ItinerarioBlock({ bloque, onChange }) {
  const dias = Array.isArray(bloque.dias) ? bloque.dias : [];
  const updateDia = (id, patch) => onChange({ ...bloque, dias: dias.map(d => d.id === id ? { ...d, ...patch } : d) });
  const updateItem = (dia, itemId, patch) => updateDia(dia.id, { items: (dia.items || []).map(it => it.id === itemId ? { ...it, ...patch } : it) });
  return (
    <div style={{ border:`1px solid ${G.border}`, borderRadius:14, padding:14, background:"rgba(0,0,0,0.02)" }}>
      <MiniField wide value={bloque.titulo} onChange={v => onChange({ ...bloque, titulo:v })} placeholder="Título del itinerario" />
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:10 }}>
        {dias.map(dia => (
          <div key={dia.id} style={{ border:`1px solid ${G.border}`, borderRadius:12, padding:10, background:G.surface }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
              <MiniField value={dia.titulo} onChange={v => updateDia(dia.id, { titulo:v })} placeholder="Día o etapa" />
              <MiniField value={dia.fecha} onChange={v => updateDia(dia.id, { fecha:v })} placeholder="Fecha" />
            </div>
            {(dia.items || []).map(it => (
              <div key={it.id} style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr", gap:6, marginBottom:6 }}>
                <MiniField value={it.hora} onChange={v => updateItem(dia, it.id, { hora:v })} placeholder="Hora" />
                <MiniField value={it.actividad} onChange={v => updateItem(dia, it.id, { actividad:v })} placeholder="Actividad" />
                <MiniField value={it.lugar} onChange={v => updateItem(dia, it.id, { lugar:v })} placeholder="Lugar" />
              </div>
            ))}
            <button onClick={() => updateDia(dia.id, { items:[...(dia.items || []), { id:uid(), hora:"", actividad:"", lugar:"" }] })}
              style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${G.accent}33`, background:G.accentSoft, color:G.accent, cursor:"pointer", fontSize:11, fontWeight:800 }}>Agregar actividad</button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange({ ...bloque, dias:[...dias, { id:uid(), fecha:"", titulo:`Día ${dias.length + 1}`, items:[{ id:uid(), hora:"", actividad:"", lugar:"" }] }] })}
        style={{ marginTop:10, padding:"7px 12px", borderRadius:9, border:`1px solid ${G.accent}33`, background:G.accentSoft, color:G.accent, cursor:"pointer", fontSize:12, fontWeight:800 }}>Agregar día/etapa</button>
    </div>
  );
}

// ── Barra de formato + inserción (siempre visible) ───────────────────────────
function FormatBar({ bloque, onUpdate, onAddBlock, onDelete, totalBloques }) {
  const hasTextBloque = bloque && ["texto","h1","h2","h3","quote"].includes(bloque.tipo);
  const fmt = (key) => hasTextBloque && onUpdate({ ...bloque, [key]: !bloque[key] });
  const setTipo = (t) => hasTextBloque && onUpdate({ ...bloque, tipo: t });

  const BLOQUES_INSERTAR = [
    { tipo:"checklist",    icon:<IcoCheckSquare s={13} />,  label:"Casillas" },
    { tipo:"bullet",       icon:"•",                        label:"Viñetas"  },
    { tipo:"numbered",     icon:"1.",                       label:"Numerada" },
    { tipo:"callout",      icon:<IcoBulb s={13} />,         label:"Callout"  },
    { tipo:"recordatorio", icon:<IcoBell s={13} />,         label:"Alarma"   },
    { tipo:"agenda",       icon:<IcoCalendar s={13} />,     label:"Agenda"   },
    { tipo:"divider",      icon:"—",                        label:"Separador"},
    { tipo:"imagen",       icon:<IcoImage s={13} />,        label:"Imagen"   },
    { tipo:"lugar",        icon:"⌖",                        label:"Lugar"    },
    { tipo:"mapa",         icon:"⌕",                        label:"Mapa"     },
    { tipo:"galeria",      icon:"▦",                        label:"Galería"  },
    { tipo:"recurso",      icon:"↗",                        label:"Recurso"  },
    { tipo:"itinerario",   icon:"☷",                        label:"Plan"     },
  ];

  return (
    <div style={{
      position:"sticky", bottom:0, zIndex:100,
      background: G.surface, backdropFilter:"blur(20px)",
      borderTop:`1px solid ${G.border}`,
      padding:"7px 48px",
      display:"flex", alignItems:"center", gap:4, flexWrap:"wrap",
      boxShadow:"0 -2px 12px rgba(0,0,0,0.04)",
    }}>

      {/* Formato de texto — solo cuando hay bloque de texto activo */}
      {hasTextBloque && (<>
        {[
          { key:"negrita",   el:<b style={{fontWeight:900,fontSize:13}}>B</b> },
          { key:"cursiva",   el:<i style={{fontSize:13}}>I</i>                 },
          { key:"subrayado", el:<u style={{fontSize:13}}>U</u>                 },
          { key:"tachado",   el:<s style={{fontSize:13}}>S</s>                 },
        ].map(f => (
          <button key={f.key} onClick={() => fmt(f.key)}
            style={{ width:28, height:28, borderRadius:7,
              background:bloque[f.key] ? G.accentSoft : "transparent",
              border:`1px solid ${bloque[f.key] ? G.accent+"44" : "transparent"}`,
              color:bloque[f.key] ? G.accent : G.textSecondary,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.12s" }}>
            {f.el}
          </button>
        ))}
        <div style={{ width:1, height:18, background:G.border, margin:"0 2px" }} />
        {[
          { t:"texto", l:"¶" },{ t:"h1", l:"H1" },{ t:"h2", l:"H2" },{ t:"h3", l:"H3" },{ t:"quote", l:"❝" },
        ].map(b => (
          <button key={b.t} onClick={() => setTipo(b.t)}
            style={{ padding:"2px 7px", height:28, borderRadius:7, fontSize:11, fontWeight:700,
              background:bloque.tipo===b.t ? G.accentSoft : "transparent",
              border:`1px solid ${bloque.tipo===b.t ? G.accent+"44" : "transparent"}`,
              color:bloque.tipo===b.t ? G.accent : G.textTertiary, cursor:"pointer" }}>
            {b.l}
          </button>
        ))}
        <div style={{ width:1, height:18, background:G.border, margin:"0 2px" }} />
      </>)}

      {/* Insertar bloques — siempre visible */}
      <span style={{ fontSize:9, color:G.textTertiary, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginRight:2 }}>
        Insertar
      </span>
      {BLOQUES_INSERTAR.map(b => (
        <button key={b.tipo} onClick={() => onAddBlock(b.tipo)}
          title={b.label}
          style={{ padding:"3px 8px", borderRadius:7, fontSize:11, fontWeight:600,
            background:"rgba(0,0,0,0.03)", color:G.textSecondary,
            border:"1px solid rgba(0,0,0,0.06)", cursor:"pointer",
            display:"flex", alignItems:"center", gap:3, transition:"all 0.12s",
            height:28 }}
          onMouseEnter={e => { e.currentTarget.style.background=G.accentSoft; e.currentTarget.style.color=G.accent; e.currentTarget.style.borderColor=G.accent+"33"; }}
          onMouseLeave={e => { e.currentTarget.style.background="rgba(0,0,0,0.03)"; e.currentTarget.style.color=G.textSecondary; e.currentTarget.style.borderColor="rgba(0,0,0,0.06)"; }}>
          <span style={{display:"inline-flex", alignItems:"center", fontSize:12}}>{b.icon}</span>
          <span style={{fontSize:10}}>{b.label}</span>
        </button>
      ))}

      <div style={{ flex:1 }} />

      {hasTextBloque && totalBloques > 1 && (
        <button onClick={onDelete} title="Eliminar bloque activo"
          style={{ padding:"3px 9px", height:28, borderRadius:7, fontSize:11, fontWeight:600,
            background:G.coralSoft, color:G.coral, border:`1px solid ${G.coral}22`, cursor:"pointer" }}>
          ✕ Bloque
        </button>
      )}
    </div>
  );
}

// ── Editor principal (el lienzo) ──────────────────────────────────────────────
function NoteEditor({ nota, onSave, onDelete }) {
  const [titulo, setTitulo]   = useState(getTitulo(nota));
  const [bloques, setBloques] = useState(() => notaToEditor(nota));
  const [tags, setTags]       = useState(nota.tags || []);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [customTag, setCustomTag]         = useState("");
  const [activeId, setActiveId]           = useState(null);
  const [newBlockId, setNewBlockId]       = useState(null);
  const [savedAt, setSavedAt]             = useState(null);
  const [hoveredId, setHoveredId]         = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imgAfterBlock, setImgAfterBlock]     = useState(null);
  const fileRef    = useRef(null);
  const saveTimer  = useRef(null);
  const pendingSaveRef = useRef(null);

  // reset when nota changes
  useEffect(() => {
    setTitulo(getTitulo(nota));
    setBloques(notaToEditor(nota));
    setTags(nota.tags || []);
    setNewBlockId(null);
    setActiveId(null);
  }, [nota.id]);

  const triggerSave = useCallback((t, b, tg) => {
    pendingSaveRef.current = { titulo: t, bloques: b, tags: tg };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave(pendingSaveRef.current);
      pendingSaveRef.current = null;
      setSavedAt(new Date());
    }, 500);
  }, [onSave]);

  const flushPendingSave = useCallback(() => {
    if (!pendingSaveRef.current) return;
    clearTimeout(saveTimer.current);
    onSave(pendingSaveRef.current);
    pendingSaveRef.current = null;
    setSavedAt(new Date());
  }, [onSave]);

  useEffect(() => {
    window.addEventListener("pagehide", flushPendingSave);
    window.addEventListener("blur", flushPendingSave);
    return () => {
      window.removeEventListener("pagehide", flushPendingSave);
      window.removeEventListener("blur", flushPendingSave);
      flushPendingSave();
    };
  }, [flushPendingSave]);

  function updateBloques(nb)         { setBloques(nb); triggerSave(titulo, nb, tags); }
  function updateBloque(id, updated) { updateBloques(bloques.map(b => b.id===id ? updated : b)); }
  function deleteBloque(id) {
    const next = bloques.filter(b => b.id !== id);
    const fallback = makeBlock("texto");
    const final = next.length === 0 ? [fallback] : next;
    if (next.length === 0) setNewBlockId(fallback.id);
    updateBloques(final);
  }
  function addBlock(tipo, afterId=null) {
    const nb = makeBlock(tipo);
    setNewBlockId(nb.id);
    if (afterId) {
      const idx = bloques.findIndex(b => b.id===afterId);
      updateBloques([...bloques.slice(0,idx+1), nb, ...bloques.slice(idx+1)]);
    } else {
      updateBloques([...bloques, nb]);
    }
    if (tipo !== "imagen") setActiveId(nb.id);
  }
  function handleSlashInsert(tipo, fromId) {
    if (tipo === "imagen") { setImgAfterBlock(fromId || null); setShowImagePicker(true); return; }
    addBlock(tipo, fromId);
  }
  function handleImageUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const nb = { id: uid(), tipo: "imagen", src: ev.target.result, caption: "" };
      if (imgAfterBlock) {
        const idx = bloques.findIndex(b => b.id === imgAfterBlock);
        if (idx >= 0) { updateBloques([...bloques.slice(0, idx+1), nb, ...bloques.slice(idx+1)]); }
        else { updateBloques([...bloques, nb]); }
      } else {
        updateBloques([...bloques, nb]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    setImgAfterBlock(null);
  }
  function handleImageFromUrl(url, caption) {
    const nb = { id: uid(), tipo: "imagen", src: url, caption: caption || "" };
    if (imgAfterBlock) {
      const idx = bloques.findIndex(b => b.id === imgAfterBlock);
      if (idx >= 0) { updateBloques([...bloques.slice(0, idx+1), nb, ...bloques.slice(idx+1)]); }
      else { updateBloques([...bloques, nb]); }
    } else {
      updateBloques([...bloques, nb]);
    }
    setImgAfterBlock(null);
  }

  function addTag(name) {
    if (!name.trim() || tags.includes(name)) return;
    const nt = [...tags, name.trim().toLowerCase()];
    setTags(nt); triggerSave(titulo, bloques, nt);
    setCustomTag(""); setShowTagPicker(false);
  }
  function removeTag(name) {
    const nt = tags.filter(t => t!==name);
    setTags(nt); triggerSave(titulo, bloques, nt);
  }

  const activeBloque = bloques.find(b => b.id===activeId) || null;
  const wordCount = bloques.reduce((a,b) => {
    const c = b.contenido||b.titulo||"";
    return a + c.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
  const fmtTime = d => d ? d.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}) : "";

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0, width:"100%", background: G.surface, transition:"background 0.25s" }}>

      {/* ── Zona de título + meta ── */}
      <div style={{ padding:`clamp(20px,4vw,40px) clamp(16px,4vw,48px) 0`, flexShrink:0 }}>
        <input
          value={titulo}
          onChange={e => { setTitulo(e.target.value); triggerSave(e.target.value, bloques, tags); }}
          placeholder="Sin título…"
          autoFocus={!titulo}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              setNewBlockId(bloques[0]?.id || null);
              document.querySelector(`textarea`)?.focus();
            }
          }}
          style={{
            width:"100%", border:"none", outline:"none",
            fontSize:36, fontWeight:900, color:G.textPrimary,
            letterSpacing:"-0.05em", lineHeight:1.15,
            fontFamily:"Outfit, Inter, sans-serif", background:"transparent",
            marginBottom:14, caretColor:G.accent,
          }}
        />

        {/* Meta row */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
          paddingBottom:16, borderBottom:`1px solid ${G.border}` }}>
          <span style={{ fontSize:12, color:G.textTertiary }}>
            {new Date(nota.modificado||nota.creado||Date.now()).toLocaleDateString("es-CO",
              { day:"numeric", month:"long", year:"numeric" })}
          </span>
          <span style={{ color:G.border }}>·</span>
          {tags.map(tag => <TagChip key={tag} tag={tag} small onRemove={() => removeTag(tag)} />)}
          <div style={{ position:"relative" }}>
            <button onClick={() => setShowTagPicker(p=>!p)}
              style={{ fontSize:10, fontWeight:600, color:G.textTertiary,
                background:"rgba(0,0,0,0.04)", border:"1px dashed rgba(0,0,0,0.12)",
                borderRadius:20, padding:"3px 10px", cursor:"pointer" }}>
              + etiqueta
            </button>
            {showTagPicker && (
              <div style={{ position:"absolute", top:28, left:0, zIndex:100,
                background:"#fff", borderRadius:12, boxShadow:"0 8px 30px rgba(0,0,0,0.12)",
                border:`1px solid ${G.border}`, padding:12, minWidth:190 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  {TAGS_PRESET.filter(t=>!tags.includes(t.name)).map(t => (
                    <button key={t.name} onClick={() => addTag(t.name)}
                      style={{ background:t.bg, color:t.color, border:`1px solid ${t.color}22`,
                        borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                      #{t.name}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <input value={customTag} onChange={e => setCustomTag(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && addTag(customTag)}
                    placeholder="Tag personalizado…"
                    style={{ flex:1, border:`1px solid ${G.border}`, borderRadius:8,
                      padding:"5px 8px", fontSize:11, outline:"none" }} />
                  <button onClick={() => addTag(customTag)}
                    style={{ background:G.accent, color:"#fff", border:"none",
                      borderRadius:8, padding:"5px 10px", fontSize:11, cursor:"pointer" }}>+</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EL LIENZO ── */}
      <div
        style={{ flex:1, overflowY:"auto", padding:`clamp(16px,3vw,28px) clamp(16px,4vw,48px) 80px` }}
        onClick={() => { setShowTagPicker(false); }}
      >
        <div style={{ width:"100%" }}>
          {bloques.map((bloque, idx) => (
            <div key={bloque.id}
              onMouseEnter={() => setHoveredId(bloque.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setActiveId(bloque.id)}
              style={{
                position:"relative",
                padding: bloque.tipo==="divider" ? "16px 0" : "3px 0 3px 32px",
                marginBottom: ["h1","h2","h3"].includes(bloque.tipo) ? 4 : 2,
              }}
            >
              {/* Handle izquierdo — aparece al hover */}
              {bloque.tipo !== "divider" && (
                <div style={{
                  position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
                  display:"flex", flexDirection:"column", gap:2,
                  opacity: hoveredId===bloque.id ? 1 : 0,
                  transition:"opacity 0.15s",
                }}>
                  {/* + insertar arriba */}
                  <button
                    onClick={() => { const nb=makeBlock("texto"); setNewBlockId(nb.id); updateBloques([...bloques.slice(0,idx),nb,...bloques.slice(idx)]); }}
                    title="Insertar bloque"
                    style={{ width:18, height:18, borderRadius:5, background:G.accentSoft,
                      border:`1px solid ${G.accent}30`, cursor:"pointer", fontSize:13,
                      color:G.accent, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>
                    +
                  </button>
                  {/* × eliminar */}
                  {bloques.length > 1 && (
                    <button onClick={() => deleteBloque(bloque.id)} title="Eliminar"
                      style={{ width:18, height:18, borderRadius:5, background:G.coralSoft,
                        border:`1px solid ${G.coral}30`, cursor:"pointer", fontSize:12,
                        color:G.coral, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>
                      ×
                    </button>
                  )}
                </div>
              )}

              {/* Render del bloque */}
              {["texto","h1","h2","h3","quote"].includes(bloque.tipo) && (
                <TextBlock
                  bloque={bloque}
                  onUpdate={updated => updateBloque(bloque.id, updated)}
                  onEnter={() => addBlock("texto", bloque.id)}
                  onDelete={() => deleteBloque(bloque.id)}
                  onSlash={tipo => handleSlashInsert(tipo, bloque.id)}
                  autoFocus={bloque.id===newBlockId}
                />
              )}
              {bloque.tipo==="checklist" && (
                <ChecklistBlock bloque={bloque} onUpdate={u => updateBloque(bloque.id,u)} />
              )}
              {["bullet","numbered"].includes(bloque.tipo) && (
                <ListBlock bloque={bloque} onUpdate={u => updateBloque(bloque.id,u)} />
              )}
              {bloque.tipo==="callout" && (
                <CalloutBlock bloque={bloque} onUpdate={u => updateBloque(bloque.id,u)} />
              )}
              {bloque.tipo==="recordatorio" && (
                <RecordatorioBlock bloque={bloque} onUpdate={u => updateBloque(bloque.id,u)} />
              )}
              {bloque.tipo==="agenda" && (
                <AgendaBlock bloque={bloque} onUpdate={u => updateBloque(bloque.id,u)} />
              )}
              {bloque.tipo==="divider" && (
                <hr style={{ border:"none", borderTop:`1.5px solid ${G.border}`, margin:"4px 0" }} />
              )}
              {bloque.tipo==="imagen" && (
                <ImageBlock bloque={bloque}
                  onChange={u => updateBloque(bloque.id,u)}
                  onDelete={() => deleteBloque(bloque.id)} />
              )}
              {bloque.tipo==="lugar" && (
                <LugarBlock bloque={bloque}
                  onChange={u => updateBloque(bloque.id,u)}
                  onDelete={() => deleteBloque(bloque.id)} />
              )}
              {bloque.tipo==="mapa" && (
                <MapaBlock bloque={bloque} onChange={u => updateBloque(bloque.id,u)} />
              )}
              {bloque.tipo==="galeria" && (
                <GaleriaBlock bloque={bloque} onChange={u => updateBloque(bloque.id,u)} />
              )}
              {bloque.tipo==="recurso" && (
                <RecursoBlock bloque={bloque} onChange={u => updateBloque(bloque.id,u)} />
              )}
              {bloque.tipo==="itinerario" && (
                <ItinerarioBlock bloque={bloque} onChange={u => updateBloque(bloque.id,u)} />
              )}
            </div>
          ))}

          {/* Zona de clic vacía al final — continúa el lienzo */}
          <div
            onClick={() => addBlock("texto")}
            style={{ minHeight:120, cursor:"text" }}
          />
        </div>
      </div>

      {/* ── Barra de formato + status (sticky bottom) ── */}
      <FormatBar
        bloque={activeBloque}
        onUpdate={u => activeId && updateBloque(activeId, u)}
        onAddBlock={tipo => {
          if (tipo==="imagen") { setImgAfterBlock(activeId||null); setShowImagePicker(true); return; }
          addBlock(tipo, activeId||undefined);
        }}
        onDelete={() => activeId && deleteBloque(activeId)}
        totalBloques={bloques.length}
      />

      {/* Status micro bar */}
      <div style={{ padding:`4px clamp(16px,4vw,48px) 6px`,
        background: G.bg, borderTop:`1px solid ${G.border}`,
        display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <span style={{ fontSize:10, color:G.textTertiary }}>{bloques.length} bloques</span>
        <span style={{ fontSize:10, color:G.textTertiary }}>{wordCount} palabras</span>
        <div style={{ flex:1 }} />
        <button onClick={onDelete}
          style={{ fontSize:10, color:G.coral, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>
          🗑 Eliminar nota
        </button>
        {savedAt && (
          <span style={{ fontSize:10, color:G.green, fontWeight:600 }}>✓ {fmtTime(savedAt)}</span>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={handleImageUpload} style={{ display:"none" }} />

      {showImagePicker && (
        <ImagePickerModal
          darkMode={G === DARK_N}
          onFromPC={() => { setShowImagePicker(false); setTimeout(() => fileRef.current?.click(), 80); }}
          onFromUrl={(url, cap) => { handleImageFromUrl(url, cap); setShowImagePicker(false); }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}

// ── Main ViewNotas ─────────────────────────────────────────────────────────────
export default function ViewNotas({ items, setItems, darkMode = false }) {
  G = darkMode ? DARK_N : LIGHT_N;
  const notas = items.filter(i => i.tipo === "nota");
  const [selectedId, setSelectedId] = useState(notas[0]?.id || null);
  const [search, setSearch] = useState("");

  const selected = notas.find(n => n.id===selectedId) || notas[0] || null;

  function crearNota() {
    const n = {
      id: uid(), tipo:"nota", titulo:"", texto:"",
      bloques:[{ id:uid(), tipo:"texto", contenido:"" }],
      tags:[], creado:new Date().toISOString(),
      modificado:new Date().toISOString(), datos:{}, hecho:false,
    };
    setItems(prev => [n,...prev]);
    setSelectedId(n.id);
  }

  function saveNota({ titulo, bloques, tags }) {
    setItems(prev => prev.map(n => {
      if (n.id!==selectedId) return n;
      return { ...n, titulo, texto:titulo, bloques, tags,
        modificado:new Date().toISOString(),
        datos:{ ...n.datos, titulo, descripcion:getSnippet({bloques}) } };
    }));
  }

  function deleteNota() {
    setItems(prev => prev.filter(n => n.id!==selectedId));
    const rem = notas.filter(n => n.id!==selectedId);
    setSelectedId(rem[0]?.id || null);
  }

  // ── Derived categories & tags ──────────────────────────────────────────────
  const [catFilter, setCatFilter] = useState("todas");
  const allTags = [...new Set(notas.flatMap(n => n.tags||[]))].slice(0,8);
  const [activeTag, setActiveTag] = useState(null);

  const notasConIA    = notas.filter(n => (n.bloques||[]).some(b => b.tipo==="ia" || b.tipo==="aiSuggestion"));
  const notasConLista = notas.filter(n => (n.bloques||[]).some(b => b.tipo==="checklist"));
  const notasConImg   = notas.filter(n => getThumbnail(n) || (n.bloques||[]).some(b => ["lugar","mapa","galeria"].includes(b.tipo)));

  const cats = [
    { id:"todas",    icon: <IcoNote s={16} />, label:"Todas",           count: notas.length },
    { id:"ia",       icon: <IcoSparkles s={16} />, label:"Con IA",           count: notasConIA.length },
    { id:"listas",   icon: <IcoCheckSquare s={16} />, label:"Con Listas",      count: notasConLista.length },
    { id:"imagenes", icon: <IcoImage s={16} />, label:"Con Imágenes",    count: notasConImg.length },
  ];

  const filteredByCat = notas.filter(n => {
    if (catFilter === "ia")       return (n.bloques||[]).some(b => b.tipo==="ia" || b.tipo==="aiSuggestion");
    if (catFilter === "listas")   return (n.bloques||[]).some(b => b.tipo==="checklist");
    if (catFilter === "imagenes") return getThumbnail(n) || (n.bloques||[]).some(b => ["lugar","mapa","galeria"].includes(b.tipo));
    return true;
  }).filter(n => {
    if (activeTag) return (n.tags||[]).includes(activeTag);
    return true;
  });

  const filtered = filteredByCat.filter(n => {
    const q = search.toLowerCase();
    if (!q) return true;
    return getTitulo(n).toLowerCase().includes(q)
      || getSnippet(n).toLowerCase().includes(q)
      || (n.tags||[]).join(" ").toLowerCase().includes(q);
  });

  return (
    <div style={{ display:"flex", height:"100%", width:"100%", flex:1, overflow:"hidden", background: G.bg, transition:"background 0.25s", fontFamily:"-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>

      {/* ── SUB-SIDEBAR: Categories & Tags ── */}
      <div style={{ width:220, minWidth:220, height:"100%", borderRight:`1px solid ${G.border}`,
        display:"flex", flexDirection:"column", background: darkMode ? "#2c2c2e" : "#f5f5f7",
        padding:"24px 12px 16px", gap:8, overflowY:"auto", boxSizing:"border-box" }}>

        {/* Header + New */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingLeft:8, marginBottom:8 }}>
          <span style={{ fontSize:20, fontWeight:700, color:G.textPrimary, letterSpacing:"-0.02em" }}>Notas</span>
          <button onClick={crearNota}
            style={{ padding:"6px 14px", background:G.accent, color:"#fff",
              border:"none", borderRadius:20, fontSize:13, fontWeight:600,
              cursor:"pointer" }}>
            + Nueva
          </button>
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar notas…"
          style={{ width:"100%", padding:"9px 14px", borderRadius:10,
            border:`1px solid ${G.border}`, background: darkMode ? "rgba(255,255,255,0.07)" : "#ffffff",
            fontSize:13, color:G.textPrimary, outline:"none",
            boxSizing:"border-box", fontFamily:"inherit", marginBottom:8 }} />

        {/* CATEGORÍAS */}
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:G.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, paddingLeft:8 }}>Categorías</div>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {cats.map(cat => (
              <button key={cat.id} onClick={() => { setCatFilter(cat.id); setActiveTag(null); }}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"9px 12px", borderRadius:10, border:"none", cursor:"pointer", textAlign:"left", transition:"all 0.15s",
                  background: catFilter===cat.id ? (darkMode ? "rgba(10,132,255,0.2)" : "#ffffff") : "transparent",
                  boxShadow: catFilter===cat.id && !darkMode ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
                  color: catFilter===cat.id ? G.accent : G.textSecondary }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:14, fontWeight: catFilter===cat.id ? 600 : 400 }}>
                  <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{cat.icon}</span>
                  {cat.label}
                </div>
                <span style={{ fontSize:12, fontWeight:600, minWidth:20, textAlign:"right",
                  color: catFilter===cat.id ? G.accent : G.textTertiary }}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ETIQUETAS */}
        {allTags.length > 0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:11, fontWeight:600, color:G.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, paddingLeft:8 }}>Etiquetas</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, paddingLeft:4 }}>
              {allTags.map(tag => {
                const isActive = activeTag === tag;
                return (
                  <button key={tag} onClick={() => setActiveTag(isActive ? null : tag)}
                    style={{ padding:"4px 10px", borderRadius:999,
                      border:`1px solid ${isActive ? G.accent : G.border}`,
                      background: isActive ? G.accentSoft : "transparent",
                      color: isActive ? G.accent : G.textSecondary,
                      fontSize:12, fontWeight:500, cursor:"pointer", transition:"all 0.12s" }}>
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Assistant mini card — Apple style */}
        <div style={{ marginTop:"auto", padding:"16px", borderRadius:14,
          background: darkMode ? "#3a3a3c" : "#ffffff",
          border: `1px solid ${G.border}`,
          boxShadow: darkMode ? "none" : "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:13, fontWeight:700, color:G.textPrimary, marginBottom:4 }}>Asistente Cerebro</div>
          <div style={{ fontSize:12, color:G.textSecondary, lineHeight:1.5, marginBottom:12 }}>
            Pídeme resumir o expandir tus notas en cualquier momento.
          </div>
          <button onClick={crearNota}
            style={{ width:"100%", background:G.accent,
              border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:600,
              padding:"8px", cursor:"pointer", transition:"opacity 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity="1"}>
            + Nueva nota con IA
          </button>
        </div>
      </div>

      {/* ── NOTES LIST (middle panel) ── */}
      <div style={{ width:280, minWidth:280, height:"100%", borderRight:`1px solid ${G.border}`,
        display:"flex", flexDirection:"column",
        background: darkMode ? "#1c1c1e" : "#ffffff" }}>

        <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${G.border}` }}>
          <span style={{ fontSize:12, fontWeight:600, color:G.textTertiary, letterSpacing:"0.02em" }}>
            {filtered.length} nota{filtered.length!==1?"s":""}{catFilter!=="todas" ? ` · ${cats.find(c=>c.id===catFilter)?.label}` : ""}
          </span>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.length===0 && (
            <div style={{ textAlign:"center", padding:"40px 16px", color:G.textTertiary }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:8, opacity:0.35 }}><IcoNote c={G.textTertiary} s={32} /></div>
              <div style={{ fontSize:12, fontWeight:600 }}>{search ? "Sin resultados" : "Sin notas aún"}</div>
            </div>
          )}
          {filtered.map(nota => {
            const isActive = nota.id===selected?.id;
            const thumb = getThumbnail(nota);
            const snippet = getSnippet(nota);
            const titulo = getTitulo(nota);
            const fecha = new Date(nota.modificado||nota.creado);
            const fechaStr = fecha.toLocaleDateString("es-CO",{day:"numeric",month:"short"});
            const checkBloques = (nota.bloques||[]).filter(b=>b.tipo==="checklist");
            const checkDone  = checkBloques.flatMap(b=>b.items||[]).filter(i=>i.hecho).length;
            const checkTotal = checkBloques.flatMap(b=>b.items||[]).length;
            const hasReminder = (nota.bloques||[]).some(b=>b.tipo==="recordatorio" && b.activo);

            return (
              <div key={nota.id} onClick={() => setSelectedId(nota.id)}
                style={{ padding:"14px 16px", borderBottom:`1px solid ${darkMode?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}`,
                  background: isActive
                    ? (darkMode ? "rgba(10,132,255,0.12)" : "rgba(0,113,227,0.06)")
                    : "transparent",
                  cursor:"pointer", transition:"background 0.12s" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background=darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.025)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background="transparent"; }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:600,
                      color: isActive ? G.accent : G.textPrimary,
                      marginBottom:4, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                      letterSpacing:"-0.01em" }}>
                      {titulo || <span style={{ color:G.textTertiary, fontStyle:"italic" }}>Sin título</span>}
                    </div>
                    {snippet && (
                      <div style={{ fontSize:13, color:G.textSecondary, lineHeight:1.45, marginBottom:6,
                        overflow:"hidden", display:"-webkit-box",
                        WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                        {snippet}
                      </div>
                    )}
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:12, color:G.textTertiary }}>{fechaStr}</span>
                      {checkTotal>0 && <span style={{ fontSize:11, color:checkDone===checkTotal ? G.green : G.textTertiary, fontWeight:600 }}>☑ {checkDone}/{checkTotal}</span>}
                      {(nota.tags||[]).slice(0,1).map(tag => <TagChip key={tag} tag={tag} small />)}
                    </div>
                  </div>
                  {thumb && (
                    <div style={{ width:44, height:44, flexShrink:0, borderRadius:8, overflow:"hidden", border:`1px solid ${G.border}` }}>
                      <img src={thumb} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BLOCK EDITOR AREA ── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column",
        background: darkMode ? "#0a0a0f" : "#fafbff" }}>
        {selected ? (
          <NoteEditor key={selected.id} nota={selected} onSave={saveNota} onDelete={deleteNota} />
        ) : (
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            color:G.textTertiary, gap:16, padding:32 }}>
            <div style={{ fontSize:56, opacity:0.2 }}>✦</div>
            <div style={{ fontSize:18, fontWeight:800, color:G.textSecondary, textAlign:"center" }}>
              Selecciona una nota
            </div>
            <div style={{ fontSize:13, color:G.textTertiary, maxWidth:320, textAlign:"center", lineHeight:1.7 }}>
              Cada nota es un lienzo libre — escribe, agrega imágenes, listas, recordatorios o una mini agenda
            </div>
            <button onClick={crearNota}
              style={{ background:G.accent, color:"#fff", border:"none",
                borderRadius:20, padding:"12px 32px", fontSize:14, fontWeight:700,
                cursor:"pointer", boxShadow:"0 6px 20px rgba(0,113,227,0.25)",
                marginTop:8 }}>
              + Nueva nota en blanco
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
