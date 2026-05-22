import { useState, useRef, useEffect, useCallback } from "react";
import { callAI } from "../lib/ai.js";

import { LIGHT as LIGHT_R, DARK as DARK_R } from "../lib/theme.js";
let G = LIGHT_R;

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IcoMic = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
};
const IcoStop = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 14;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect width="14" height="14" x="5" y="5" rx="3" />
    </svg>
  );
};
const IcoPlus = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
};
const IcoUpload = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
};
const IcoSearch = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 15;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
};
const IcoTrash = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 15;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
};
const IcoX = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
};
const IcoDownload = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 15;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
};
const IcoClock = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 14;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
};
const IcoCalendar = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 14;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
};
const IcoSave = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
};
const IcoChevronRight = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 14;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
};
const IcoStar = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 12;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
};
const IcoCheck = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 12;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};
const IcoClipboard = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 12;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
};
const IcoArrow = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 12;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
};
const IcoFile = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 1.5;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
};
const IcoWave = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 24;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" style={{ flexShrink: 0 }}>
      <path d="M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h-2" />
    </svg>
  );
};
const IcoBriefcase = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 20;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
};
const IcoSpinner = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 20;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2.5;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" style={{ animation: "spin 1.2s linear infinite", flexShrink: 0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
};
const IcoInfo = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 14;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
};
const IcoVideo = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 18;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  );
};
const IcoSparkles = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5 5 3Z" opacity="0.6" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" opacity="0.6" />
    </svg>
  );
};
const IcoLightbulb = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
};
const IcoCheckCircle = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
};
const IcoClipboardList = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 9h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
};
const IcoChevronsRight = ({ size, s, strokeWidth, color, c }) => {
  const finalSize = size || s || 16;
  const finalColor = color || c || "currentColor";
  const finalStroke = strokeWidth || 2;
  return (
    <svg width={finalSize} height={finalSize} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={finalStroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </svg>
  );
};

// ── Utilities ────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }
function fmtDuracion(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function normalizarFechaReunion(fecha) {
  if (!fecha || typeof fecha !== "string") return null;
  const trimmed = fecha.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function calcularColumnaTarea(fecha) {
  if (!fecha) return "cesta";
  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0, 10);
  if (fecha === hoyStr) return "hoy";
  const dow = hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((dow + 6) % 7));
  lunes.setHours(0, 0, 0, 0);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  const fechaDate = new Date(fecha + "T12:00:00");
  return fechaDate >= lunes && fechaDate <= domingo ? "semana" : "cesta";
}

function resaltarTexto(texto, query) {
  if (!query || !query.trim()) return <span>{texto}</span>;
  const q = query.toLowerCase();
  const idx = texto.toLowerCase().indexOf(q);
  if (idx === -1) return <span>{texto}</span>;
  return (
    <span>
      {texto.slice(0, idx)}
      <mark style={{ background: "#fde68a", color: "#92400e", borderRadius: 3, padding: "0 2px", fontWeight: 700 }}>
        {texto.slice(idx, idx + query.length)}
      </mark>
      {texto.slice(idx + query.length)}
    </span>
  );
}

function buscarEnReuniones(reuniones, query) {
  if (!query.trim()) return null;
  const q = query.toLowerCase();
  return reuniones.map(reunion => {
    const r = reunion.resumen || {};
    const matches = [];
    if (reunion.titulo?.toLowerCase().includes(q))
      matches.push({ campo: "Título", texto: reunion.titulo });
    if (r.ejecutivo?.toLowerCase().includes(q))
      matches.push({ campo: "Resumen ejecutivo", texto: r.ejecutivo.slice(0, 180) });
    (r.puntosClave || []).forEach(p => {
      if (p.toLowerCase().includes(q)) matches.push({ campo: "Punto clave", texto: p });
    });
    (r.decisiones || []).forEach(d => {
      if (d.toLowerCase().includes(q)) matches.push({ campo: "Decisión", texto: d });
    });
    (r.acciones || []).forEach(a => {
      if (a.tarea?.toLowerCase().includes(q)) matches.push({ campo: "Acción", texto: a.tarea });
    });
    (r.siguientesPasos || []).forEach(p => {
      if (p.toLowerCase().includes(q)) matches.push({ campo: "Próx. paso", texto: p });
    });
    if (reunion.transcripcion?.toLowerCase().includes(q)) {
      const i = reunion.transcripcion.toLowerCase().indexOf(q);
      const snippet = reunion.transcripcion.slice(Math.max(0, i - 55), i + 130);
      matches.push({ campo: "Transcripción", texto: `…${snippet}…` });
    }
    return matches.length > 0 ? { reunion, matches } : null;
  }).filter(Boolean);
}

// ── Section components ───────────────────────────────────────────────────────
function SeccionMinuta({ icon, titulo, color, children }) {
  return (
    <div style={{ background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 16, border: `1px solid ${G.glassBorder}`, overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", gap: 9, background: `${color}08` }}>
        <div style={{ color, display: "flex" }}>{icon}</div>
        <span style={{ fontSize: 12, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.01em" }}>{titulo}</span>
      </div>
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

function BulletItem({ text, color, icon }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "5px 0", borderBottom: `1px solid ${G.border}` }}>
      <div style={{ color, marginTop: 3, flexShrink: 0 }}>{icon || <IcoArrow />}</div>
      <span style={{ fontSize: 13, color: G.textPrimary, lineHeight: 1.55 }}>{text}</span>
    </div>
  );
}

// ── HTML export (premium slide template) ────────────────────────────────────
function generarMinutaHTML(reunion) {
  const r = reunion.resumen || {};
  const fechaStr = new Date(reunion.fecha).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const pilares = (r.puntosClave || []).slice(0, 3).map((p, i) => ({
    icon: ["fa-lightbulb", "fa-circle-check", "fa-comments"][i] || "fa-lightbulb",
    title: `Punto ${i + 1}`,
    text: p,
  }));

  const accionesBullets = (r.acciones || []).map(a =>
    `${a.tarea}${a.responsable ? ` — ${a.responsable}` : ""}${a.fecha ? ` (${a.fecha})` : ""}`
  );

  const steps = (r.siguientesPasos || []).slice(0, 4).map((p, i) => ({
    title: `Paso ${i + 1}`,
    desc: p,
  }));

  const slides = [
    {
      type: "title",
      badge: "Minuta de Reunión",
      titleFirst: reunion.titulo,
      titleAccent: fechaStr,
      subtitle: r.ejecutivo || "Resumen generado automáticamente.",
    },
    ...(pilares.length > 0 ? [{
      type: "section",
      sectionTitle: "Puntos Clave",
      sectionSubtitle: "Temas principales discutidos y analizados durante la sesión.",
    }, {
      type: "pillars",
      slideTitle: "Puntos Clave Discutidos",
      pillars: pilares,
    }] : []),
    ...((r.decisiones || []).length > 0 ? [{
      type: "discussion",
      slideTitle: "Decisiones Tomadas",
      mainHeader: "Acuerdos de la reunión",
      mainParagraph: "Las siguientes decisiones fueron tomadas y aprobadas durante la sesión:",
      bullets: r.decisiones,
      imageUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Decisiones+de+Reunión",
    }] : []),
    ...(accionesBullets.length > 0 ? [{
      type: "commitments",
      slideTitle: "Compromisos y Acciones",
      clientSub: "Acciones acordadas por el equipo:",
      clientBullets: accionesBullets.slice(0, 3),
      teamSub: "Próximos pasos definidos:",
      teamBullets: (r.siguientesPasos || []).slice(0, 3),
    }] : []),
    ...(steps.length > 0 ? [{
      type: "timeline",
      slideTitle: "Secuencia de Próximos Pasos",
      steps,
    }] : []),
    {
      type: "qa",
      qaTitle: "¿Preguntas?",
      qaSubtitle: "El equipo coordinará el seguimiento de los compromisos adquiridos en esta sesión.",
      email: "oficina.tecnica@empresa.com",
      phone: "+57 (300) 000-0000",
    },
  ];

  const client = "Cerebro Personal";
  const topic = reunion.titulo;
  const total = slides.length;

  function renderSlide(slide, idx) {
    let inner = "";
    switch (slide.type) {
      case "title":
        inner = `<div class="content-area"><div class="title-layout"><div class="badge">${slide.badge}</div><h1>${slide.titleFirst}<br><span>${slide.titleAccent}</span></h1><p class="subtitle">${slide.subtitle}</p></div></div>`;
        break;
      case "section":
        inner = `<div class="content-area"><div class="section-title-layout"><hr><h2>${slide.sectionTitle}</h2><p>${slide.sectionSubtitle}</p></div></div>`;
        break;
      case "pillars":
        inner = `<h2 class="slide-title">${slide.slideTitle}</h2><div class="content-area"><div class="tiled-content">${slide.pillars.map(p => `<div class="tile"><div class="icon"><i class="fa-solid ${p.icon}"></i></div><h3>${p.title}</h3><p>${p.text}</p></div>`).join("")}</div></div>`;
        break;
      case "discussion":
        inner = `<h2 class="slide-title">${slide.slideTitle}</h2><div class="content-area"><div class="two-column"><div><h3>${slide.mainHeader}</h3><p style="margin-bottom:20px">${slide.mainParagraph}</p><ul>${slide.bullets.map(b => `<li>${b}</li>`).join("")}</ul></div><div><div class="image-wrapper"><img src="${slide.imageUrl}" alt=""></div></div></div></div>`;
        break;
      case "commitments":
        inner = `<h2 class="slide-title">${slide.slideTitle}</h2><div class="content-area"><div class="two-column tiled"><div><h3 style="color:#d97706"><i class="fa-solid fa-person-digging"></i> Compromisos del Equipo</h3><p style="margin-bottom:15px;font-size:14px;color:#64748b">${slide.clientSub}</p><ul>${slide.clientBullets.map(b => `<li>${b}</li>`).join("")}</ul></div><div><h3 style="color:#0284c7"><i class="fa-solid fa-clipboard-check"></i> Próximos Pasos</h3><p style="margin-bottom:15px;font-size:14px;color:#64748b">${slide.teamSub}</p><ul>${slide.teamBullets.map(b => `<li>${b}</li>`).join("")}</ul></div></div></div>`;
        break;
      case "timeline":
        inner = `<h2 class="slide-title">${slide.slideTitle}</h2><div class="content-area"><div class="timeline-layout"><div class="timeline-line"></div>${slide.steps.map(s => `<div class="timeline-item"><h3>${s.title}</h3><p>${s.desc}</p></div>`).join("")}</div></div>`;
        break;
      case "qa":
        inner = `<div class="content-area"><div class="qa-layout"><h2>${slide.qaTitle}</h2><p>${slide.qaSubtitle}</p><div class="contact-info"><div class="contact-item"><i class="fa-solid fa-envelope"></i> ${slide.email}</div><div class="contact-item"><i class="fa-solid fa-phone"></i> ${slide.phone}</div></div></div></div>`;
        break;
      default: inner = "";
    }
    return `<div class="slide-container" id="slide${idx + 1}">${inner}<div class="slide-footer"><span>${client}</span><span>${topic}</span><span>Diapositiva ${idx + 1} de ${total}</span></div></div>`;
  }

  const slidesHtml = slides.map((s, i) => renderSlide(s, i)).join("\n");

  const css = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Plus Jakarta Sans',sans-serif;background:#f1f5f9;display:flex;flex-direction:column;gap:40px;padding:60px 0;align-items:center;min-height:100vh}.slide-container{width:1280px;height:720px;background:#fafaf9;color:#1e293b;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:60px 80px;border:1px solid rgba(0,0,0,.08);box-shadow:0 20px 40px rgba(15,23,42,.08)}.slide-container::before{content:'';position:absolute;top:-200px;right:-200px;width:500px;height:500px;background:radial-gradient(circle,rgba(14,116,144,.04) 0%,transparent 70%);z-index:0;pointer-events:none}.slide-container::after{content:'';position:absolute;bottom:-150px;left:-150px;width:400px;height:400px;background:radial-gradient(circle,rgba(217,119,6,.02) 0%,transparent 70%);z-index:0;pointer-events:none}.slide-container>*{position:relative;z-index:1}h1{font-family:'Playfair Display',serif;font-weight:600;font-size:56px;line-height:1.15;color:#0f172a}.slide-title{font-family:'Playfair Display',serif;font-size:38px;font-weight:600;color:#0f172a;border-left:4px solid #0284c7;padding-left:20px;margin-bottom:30px;line-height:1.2}h3{font-size:22px;font-weight:600;color:#0284c7;margin-bottom:12px}p,li{font-size:16px;line-height:1.6;color:#475569}.slide-footer{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(15,23,42,.08);padding-top:15px;margin-top:20px;width:100%}.slide-footer span{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b}.content-area{display:flex;flex-direction:column;justify-content:center;flex-grow:1;width:100%}.title-layout{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:20px}.title-layout .badge{background:rgba(2,132,199,.08);border:1px solid rgba(2,132,199,.2);color:#0284c7;padding:6px 14px;border-radius:20px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600}.title-layout h1 span{color:#d97706}.title-layout .subtitle{font-size:20px;color:#475569;max-width:800px;line-height:1.5}.section-title-layout{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;height:100%}.section-title-layout hr{width:80px;border:none;height:4px;background:linear-gradient(90deg,#0284c7,#d97706);margin-bottom:25px;border-radius:2px}.section-title-layout h2{font-family:'Playfair Display',serif;font-size:48px;color:#0f172a;margin-bottom:15px}.section-title-layout p{font-size:18px;color:#475569;max-width:600px}.two-column{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;width:100%}.two-column.tiled{align-items:stretch}.two-column.tiled>div{background:rgba(15,23,42,.02);border:1px solid rgba(15,23,42,.05);border-radius:16px;padding:35px}.two-column ul{list-style:none}.two-column li{margin-bottom:12px;position:relative;padding-left:25px}.two-column li::before{content:"→ ";position:absolute;left:0;color:#d97706;font-weight:700}.image-wrapper{border-radius:16px;overflow:hidden;height:380px;width:100%;border:1px solid rgba(0,0,0,.1)}.image-wrapper img{width:100%;height:100%;object-fit:cover}.tiled-content{display:flex;gap:25px;width:100%}.tile{flex:1;background:rgba(15,23,42,.02);border:1px solid rgba(15,23,42,.05);border-radius:16px;padding:30px;display:flex;flex-direction:column;gap:15px}.tile .icon{font-size:32px;color:#0284c7;background:rgba(2,132,199,.08);width:60px;height:60px;display:flex;align-items:center;justify-content:center;border-radius:12px}.highlight-numbers-layout{display:grid;grid-template-columns:40% 60%;gap:40px;align-items:center;width:100%}.timeline-layout{display:flex;justify-content:space-between;position:relative;width:100%;margin-top:40px;padding-bottom:40px}.timeline-layout .timeline-line{position:absolute;top:50%;left:0;width:100%;height:2px;background:linear-gradient(90deg,#0284c7,#d97706);z-index:0;transform:translateY(-50%)}.timeline-item{width:22%;position:relative;z-index:1;background:#fafaf9;border:1px solid rgba(15,23,42,.08);border-radius:16px;padding:20px;box-shadow:0 10px 30px rgba(15,23,42,.05)}.timeline-item h3{color:#0284c7;font-size:18px;margin-bottom:8px;border-bottom:1px solid rgba(15,23,42,.08);padding-bottom:8px}.timeline-item p{font-size:13px;line-height:1.4}.qa-layout{text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;gap:15px}.qa-layout h2{font-family:'Playfair Display',serif;font-size:64px;color:#0f172a}.qa-layout p{font-size:20px;color:#475569;max-width:600px}.qa-layout .contact-info{display:flex;gap:30px;margin-top:35px}.qa-layout .contact-item{font-size:14px;color:#0284c7;background:rgba(2,132,199,.05);padding:10px 20px;border-radius:30px;border:1px solid rgba(2,132,199,.15)}@media print{body{background:#fff;padding:0;gap:0}.slide-container{page-break-after:always;box-shadow:none;border:none}}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Minuta — ${reunion.titulo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>${css}</style>
</head>
<body>
${slidesHtml}
</body>
</html>`;
}

function descargarMinuta(reunion) {
  const html = generarMinutaHTML(reunion);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Minuta_${reunion.titulo.replace(/\s+/g, "_")}_${new Date(reunion.fecha).toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Presentation view ────────────────────────────────────────────────────────
function PresentacionReunion({ reunion, onCrearTareas, onClose }) {
  const r = reunion.resumen;
  if (!r) return null;
  const total = 5 + (r.acciones?.length > 0 ? 1 : 0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Topbar */}
      <div style={{
        padding: "14px 24px", background: G.surface,
        borderBottom: `1px solid ${G.border}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: G.textPrimary }}>{reunion.titulo}</div>
          <div style={{ fontSize: 11, color: G.textTertiary }}>
            {new Date(reunion.fecha).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {reunion.duracion ? ` · ${fmtDuracion(reunion.duracion)}` : ""}
          </div>
        </div>
        {r.acciones?.length > 0 && (
          <button onClick={onCrearTareas} style={{
            height: 36, padding: "0 16px",
            background: G.green, color: "#fff",
            border: "none", borderRadius: 10,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <IcoPlus /><IcoCheck />
            Crear {r.acciones.length} tareas
          </button>
        )}
        <button onClick={() => descargarMinuta(reunion)} style={{
          height: 36, padding: "0 16px",
          background: `linear-gradient(135deg, ${G.accent}, ${G.purple})`,
          color: "#fff", border: "none", borderRadius: 10,
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <IcoDownload />
          Exportar Minuta
        </button>
        <button onClick={onClose} style={{
          width: 36, height: 36,
          background: G.coralSoft, color: G.coral,
          border: `1px solid ${G.coral}22`, borderRadius: 10,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <IcoX />
        </button>
      </div>

      {/* Slides scrollables */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>

        {/* Slide 1 — Portada */}
        <SeccionMinuta icon={<IcoSparkles />} titulo="Resumen Ejecutivo" color={G.accent}>
          <div style={{ fontSize: 20, fontWeight: 900, color: G.textPrimary, letterSpacing: "-0.03em", marginBottom: 8 }}>
            {reunion.titulo}
          </div>
          <div style={{ fontSize: 13, color: G.textSecondary, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <IcoCalendar />
            {new Date(reunion.fecha).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {reunion.duracion && (
              <>
                <span style={{ color: G.border }}>·</span>
                <IcoClock />
                {fmtDuracion(reunion.duracion)}
              </>
            )}
          </div>
          {r.ejecutivo && (
            <div style={{
               background: G.accentSoft, border: `1px solid ${G.accent}20`,
              borderRadius: 12, padding: "14px 16px",
              fontSize: 13, color: G.textPrimary, lineHeight: 1.7, fontStyle: "italic",
            }}>
              "{r.ejecutivo}"
            </div>
          )}
        </SeccionMinuta>

        {/* Slide 2 — Puntos clave */}
        {r.puntosClave?.length > 0 && (
          <SeccionMinuta icon={<IcoLightbulb />} titulo="Puntos Clave Discutidos" color={G.purple}>
            {r.puntosClave.map((p, i) => (
              <BulletItem key={i} text={p} color={G.purple} icon={<IcoLightbulb />} />
            ))}
          </SeccionMinuta>
        )}

        {/* Slide 3 — Decisiones */}
        {r.decisiones?.length > 0 && (
          <SeccionMinuta icon={<IcoCheckCircle />} titulo="Decisiones Tomadas" color={G.green}>
            {r.decisiones.map((d, i) => (
              <BulletItem key={i} text={d} color={G.green} icon={<IcoCheckCircle />} />
            ))}
          </SeccionMinuta>
        )}

        {/* Slide 4 — Acciones */}
        {r.acciones?.length > 0 && (
          <SeccionMinuta icon={<IcoClipboardList />} titulo="Plan de Acción" color={G.amber}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {r.acciones.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "10px 14px", background: G.amberSoft,
                  borderRadius: 10, border: `1px solid ${G.amber}20`,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: G.amber, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: G.textPrimary }}>{a.tarea}</div>
                    {(a.responsable || a.fecha) && (
                      <div style={{ fontSize: 11, color: G.textTertiary, marginTop: 4, display: "flex", gap: 10, alignItems: "center" }}>
                        {a.responsable && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <IcoBriefcase />{a.responsable}
                          </span>
                        )}
                        {a.responsable && a.fecha && <span style={{ color: G.border }}>·</span>}
                        {a.fecha && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <IcoCalendar />{a.fecha}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SeccionMinuta>
        )}

        {/* Slide 5 — Próximos pasos */}
        {r.siguientesPasos?.length > 0 && (
          <SeccionMinuta icon={<IcoChevronsRight />} titulo="Próximos Pasos" color={G.coral}>
            {r.siguientesPasos.map((p, i) => (
              <BulletItem key={i} text={p} color={G.coral} icon={<IcoChevronsRight />} />
            ))}
          </SeccionMinuta>
        )}

        {/* Slide final — Transcripción */}
        <SeccionMinuta
          icon={<IcoFile size={14} strokeWidth={2} />}
          titulo="Transcripción Completa"
          color={G.textTertiary}
        >
          <div style={{
            maxHeight: 200, overflowY: "auto", fontSize: 12,
            color: G.textSecondary, lineHeight: 1.8,
            whiteSpace: "pre-wrap", fontFamily: "Inter, monospace",
          }}>
            {reunion.transcripcion || "Sin transcripción disponible."}
          </div>
        </SeccionMinuta>
      </div>
    </div>
  );
}

// ── Recording panel ──────────────────────────────────────────────────────────
function GrabacionPanel({ apiKey, aiConfig, onSave, darkMode = false, modoPanel, setModoPanel }) {
  const [estado, setEstado] = useState("idle"); // idle | grabando | procesando | listo
  const [transcripcion, setTranscripcion] = useState("");
  const [titulo, setTitulo] = useState("");
  const [duracion, setDuracion] = useState(0);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [agendaEnVivo, setAgendaEnVivo] = useState([]);
  const [actualizandoAgenda, setActualizandoAgenda] = useState(false);
  const [archivoAudio, setArchivoAudio] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const transcripcionRef = useRef("");
  const ultimaPalabrasRef = useRef(0);
  const fileInputRef = useRef(null);
  const grabandoRef = useRef(false);

  async function actualizarAgendaEnVivo() {
    const texto = transcripcionRef.current.trim();
    const cfg = aiConfig || { apiKey, provider: "gemini" };
    if (!texto || !cfg.apiKey) return;
    const palabras = texto.split(/\s+/).length;
    if (palabras - ultimaPalabrasRef.current < 40) return;
    ultimaPalabrasRef.current = palabras;
    setActualizandoAgenda(true);
    try {
      const prompt = `Analiza esta transcripción parcial de reunión y extrae los puntos clave que han surgido. Devuelve ÚNICAMENTE JSON válido con esta estructura: {"puntosClave": ["punto 1", "punto 2", "punto 3"]}\n\nTRANSCRIPCIÓN:\n${texto.slice(0, 5000)}`;
      const raw = await callAI(prompt, cfg);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        if (parsed.puntosClave?.length) setAgendaEnVivo(parsed.puntosClave);
      }
    } catch (_) { /* fallo silencioso — no interrumpir grabación */ }
    finally { setActualizandoAgenda(false); }
  }

  useEffect(() => {
    if (estado !== "grabando" || !apiKey || duracion === 0) return;
    if (duracion % 120 === 0) actualizarAgendaEnVivo();
  }, [duracion]);

  function seleccionarArchivo(file) {
    if (!file) return;
    const MAX_MB = 20;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El límite es ${MAX_MB} MB (~30 min a 64kbps). Usa un fragmento más corto.`);
      return;
    }
    const tipos = ["audio/", "video/mp4", "video/quicktime"];
    if (!tipos.some(t => file.type.startsWith(t))) {
      setError("Formato no soportado. Usa MP3, M4A, WAV, OGG, AAC o FLAC.");
      return;
    }
    setArchivoAudio(file);
    setError("");
  }

  async function procesarArchivoAudio() {
    if (!archivoAudio) return;
    // Determine the active provider config
    const cfg = aiConfig || { apiKey, provider: "gemini" };
    const providerActivo = cfg.provider || "gemini";

    // Audio file transcription with inline base64 is only supported natively by Gemini.
    // Claude and OpenRouter do not accept raw audio files in this way.
    if (providerActivo !== "gemini") {
      const nombreProveedor = providerActivo === "claude" ? "Anthropic Claude" : "OpenRouter";
      setError(`⚠️ La transcripción de archivos de audio solo es compatible con Google Gemini. El proveedor activo es ${nombreProveedor}. Cambia a Gemini en Configuración → API, o usa la grabación en vivo que no requiere IA.`);
      return;
    }

    if (!cfg.apiKey) {
      setError("Configure su clave de API Gemini para transcribir audio desde archivo.");
      return;
    }

    setEstado("procesando");
    setError("");
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(archivoAudio);
      });
      const mimeType = archivoAudio.type || "audio/mp3";
      const model = cfg.model || "gemini-2.5-flash";
      const prompt = `Eres un asistente ejecutivo. Transcribe el audio completo y luego analiza el contenido. Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:\n{\n  "transcripcion": "transcripción completa del audio",\n  "ejecutivo": "Resumen ejecutivo en 2-3 oraciones",\n  "puntosClave": ["punto 1", "punto 2", "punto 3"],\n  "decisiones": ["decisión tomada 1", "decisión 2"],\n  "acciones": [{"tarea": "descripción", "responsable": "nombre o cargo", "fecha": "fecha si se mencionó"}],\n  "siguientesPasos": ["próximo paso 1", "paso 2"]\n}`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [
              { inline_data: { mime_type: mimeType, data: base64 } },
              { text: prompt },
            ]}],
          }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "Error de Gemini");
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("La IA no devolvió un JSON válido");
      const parsed = JSON.parse(m[0]);
      const { transcripcion: tx, ...resumenParsed } = parsed;
      transcripcionRef.current = tx || "";
      setTranscripcion(tx || "");
      setResumen(resumenParsed);
      setEstado("listo");
    } catch (e) {
      setError(`Error al procesar audio: ${e.message}`);
      setEstado("idle");
    }
  }

  function iniciarGrabacion() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setError("Necesita Chrome o Edge para usar el reconocimiento de voz.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "es-CO";
    r.continuous = true;
    r.interimResults = true;

    let acumulado = "";
    r.onresult = (e) => {
      let interino = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          acumulado += e.results[i][0].transcript + " ";
        } else {
          interino = e.results[i][0].transcript;
        }
      }
      transcripcionRef.current = acumulado;
      setTranscripcion(acumulado + (interino ? `[${interino}]` : ""));
    };
    r.onerror = (e) => {
      const msg = e?.error === "not-allowed"
        ? "Permiso de micrófono denegado. Revise permisos del navegador para este sitio."
        : `Error de micrófono: ${e.error}`;
      setError(msg);
    };
    r.onend = () => {
      if (grabandoRef.current) {
        try { r.start(); } catch { /* restart can throw if already starting */ }
      }
    };
    try {
      r.start();
      recognitionRef.current = r;
      grabandoRef.current = true;
    } catch (e) {
      setError(`No se pudo iniciar el micrófono: ${e.message}`);
      return;
    }

    // Timer
    let seg = 0;
    timerRef.current = setInterval(() => { seg++; setDuracion(seg); }, 1000);
    setEstado("grabando");
    setError("");
  }

  function detenerGrabacion() {
    grabandoRef.current = false;
    recognitionRef.current?.stop();
    clearInterval(timerRef.current);
    setEstado("listo");
    setTranscripcion(transcripcionRef.current.trim());
  }

  async function generarResumen() {
    const cfg = aiConfig || { apiKey, provider: "gemini" };
    if (!cfg.apiKey) { setError("Configure su clave de IA en Configuración."); return; }
    const texto = transcripcionRef.current.trim() || transcripcion.trim();
    if (!texto) { setError("Sin transcripción para resumir."); return; }
    setEstado("procesando");
    setError("");

    const prompt = `Eres un asistente ejecutivo de alta precisión. Analiza la siguiente transcripción de reunión y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
{
  "ejecutivo": "Resumen ejecutivo en 2-3 oraciones",
  "puntosClave": ["punto 1", "punto 2", "punto 3"],
  "decisiones": ["decisión tomada 1", "decisión 2"],
  "acciones": [
    {"tarea": "descripción de la tarea", "responsable": "nombre o cargo", "fecha": "fecha límite si se mencionó"}
  ],
  "siguientesPasos": ["próximo paso 1", "paso 2"]
}

TRANSCRIPCIÓN:
${texto.slice(0, 8000)}`;

    try {
      const raw = await callAI(prompt, cfg);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("La IA no devolvió un JSON válido");
      const parsed = JSON.parse(jsonMatch[0]);
      setResumen(parsed);
      setEstado("listo");
    } catch (e) {
      setError(`Error al generar resumen: ${e.message}`);
      setEstado("listo");
    }
  }

  function guardar() {
    onSave({
      titulo: titulo || `Reunión ${new Date().toLocaleDateString("es-CO")}`,
      transcripcion: transcripcionRef.current.trim() || transcripcion,
      duracion,
      resumen,
    });
  }

  const palabras = Math.round(transcripcion.split(" ").length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>

      {/* Mode toggle */}
      <div style={{ display: "flex", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
        {[
          { id: "vivo",    icon: <IcoMic />,    label: "Grabación en Vivo" },
          { id: "archivo", icon: <IcoUpload />,  label: "Desde Archivo"    },
        ].map(({ id, icon, label }) => (
          <button key={id}
            onClick={() => {
              setModoPanel(id);
              setEstado("idle");
              setError("");
              setArchivoAudio(null);
              setResumen(null);
              setTranscripcion("");
              transcripcionRef.current = "";
            }}
            style={{
              flex: 1, padding: "11px 0",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              background: modoPanel === id ? G.accent : "transparent",
              color: modoPanel === id ? "#ffffff" : G.textTertiary,
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
              transition: "all 0.18s",
            }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Session title input */}
      <input
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        placeholder="Nombre de la sesión…"
        style={{
          width: "100%", padding: "12px 16px", borderRadius: 10,
          border: `1px solid ${G.border}`, background: G.surface,
          fontSize: 15, fontWeight: 600, color: G.textPrimary, outline: "none",
          boxSizing: "border-box",
        }}
      />

      {modoPanel === "archivo" && estado === "idle" && (
        <div>
          {/* Tarjeta explicativa de requisitos e información */}
          <div style={{
            background: darkMode ? "rgba(59, 130, 246, 0.05)" : "rgba(37, 99, 235, 0.03)",
            border: `1px solid ${darkMode ? "rgba(59, 130, 246, 0.15)" : "rgba(37, 99, 235, 0.1)"}`,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 12,
            lineHeight: 1.5,
            color: G.textSecondary
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: G.accent }}>
              <IcoInfo size={14} strokeWidth={2.5} />
              <span>Requisitos para Transcribir Archivos</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div>
                <strong>🤖 Proveedor Necesario:</strong> La transcripción de archivos locales requiere el uso de la <strong>API de Google Gemini</strong> (ej. <code>gemini-2.5-flash</code>), ya que es el único modelo que soporta el procesamiento directo de audio Base64 en una sola consulta.
              </div>
              <div style={{ marginTop: 2 }}>
                <strong>📂 Formatos Soportados:</strong> Audios (<code>MP3, M4A, WAV, OGG, AAC, FLAC, OPUS</code>) y Videos (<code>MP4, MOV</code>).
              </div>
              <div style={{ marginTop: 2 }}>
                <strong>⚖️ Límite de Peso:</strong> Máximo <strong>20 MB</strong> (~30 min de grabación).
              </div>
            </div>

            <div style={{ fontSize: 11, fontStyle: "italic", opacity: 0.85, marginTop: 2, color: G.textTertiary }}>
              *Si estás usando Claude o OpenRouter, por favor cambia momentáneamente a Gemini en Configuración → API para usar esta sección, o utiliza la pestaña "Grabación en Vivo" que usa el dictado gratuito de tu navegador.
            </div>
          </div>

          <input
            ref={fileInputRef} type="file"
            accept="audio/*,video/mp4,video/quicktime,.m4a,.mp3,.wav,.ogg,.aac,.flac,.opus"
            style={{ display: "none" }}
            onChange={e => seleccionarArchivo(e.target.files?.[0])}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); seleccionarArchivo(e.dataTransfer.files?.[0]); }}
            style={{
              border: `2px dashed ${dragOver ? G.accent : archivoAudio ? G.green : G.border}`,
              borderRadius: 14, padding: "36px 24px", textAlign: "center", cursor: "pointer",
              background: dragOver ? G.accentSoft : archivoAudio ? G.greenSoft : G.surface,
              transition: "all 0.2s",
            }}
          >
            {archivoAudio ? (
              <>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, color: G.green }}>
                  <IcoFile size={44} strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.textPrimary, marginBottom: 4 }}>
                  {archivoAudio.name}
                </div>
                <div style={{ fontSize: 11, color: G.textTertiary }}>
                  {(archivoAudio.size / 1024 / 1024).toFixed(1)} MB · {archivoAudio.type || "audio"}
                </div>
                <div style={{ fontSize: 11, color: G.green, marginTop: 8, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <IcoCheck /> Listo para procesar — haz clic para cambiar
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: G.textTertiary }}>
                  <IcoFile size={44} strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.textPrimary, marginBottom: 6 }}>
                  Arrastra tu grabación aquí o haz clic para seleccionar
                </div>
                <div style={{ fontSize: 12, color: G.textTertiary, lineHeight: 1.6 }}>
                  MP3 · M4A · WAV · OGG · AAC · FLAC<br />
                  Máx. 20 MB (~30 min a 64 kbps)
                </div>
              </>
            )}
          </div>

          {archivoAudio && (
            <button onClick={procesarArchivoAudio} style={{
              width: "100%", marginTop: 12, padding: "13px",
              background: `linear-gradient(135deg, ${G.purple}, ${G.accent})`,
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <IcoUpload />
              Transcribir y Generar Resumen
            </button>
          )}
        </div>
      )}

      {/* Processing — archivo */}
      {modoPanel === "archivo" && estado === "procesando" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0" }}>
          <IcoSpinner />
          <div style={{ fontSize: 14, fontWeight: 600, color: G.textSecondary, textAlign: "center" }}>
            Analizando sesión…<br />
            <span style={{ fontSize: 12, color: G.textTertiary }}>Esto puede tardar 15–60 segundos según la duración</span>
          </div>
        </div>
      )}

      {/* ── MODO VIVO ── */}
      {modoPanel === "vivo" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "28px 0" }}>

          {/* States: idle — big record orb */}
          {estado === "idle" && (
            <>
              <div
                onClick={iniciarGrabacion}
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: G.coral, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 0 0 0 rgba(255,59,48,0)",
                  animation: "recPulse 2s ease-in-out infinite",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <IcoMic size={30} strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: 13, color: G.textTertiary }}>Iniciar grabación</div>
            </>
          )}

          {/* States: grabando — horizontal bar */}
          {estado === "grabando" && (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "14px 20px",
              background: G.coralSoft, borderRadius: 12,
              border: `1px solid ${G.coral}22`,
              width: "100%",
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: G.coral, flexShrink: 0,
                animation: "dotBlink 1s ease-in-out infinite",
              }} />
              <div style={{
                fontSize: 22, fontWeight: 800, color: G.coral,
                fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", fontFamily: "monospace",
                minWidth: 68,
              }}>
                {fmtDuracion(duracion)}
              </div>
              <div style={{ fontSize: 12, color: G.textTertiary, flex: 1 }}>
                {palabras} palabras
              </div>
              <button onClick={detenerGrabacion} style={{
                height: 34, padding: "0 16px",
                background: G.coral, color: "#fff",
                border: "none", borderRadius: 8,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                flexShrink: 0,
              }}>
                <IcoStop /> Detener
              </button>
            </div>
          )}

          {/* States: procesando */}
          {estado === "procesando" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
              <IcoSpinner />
              <div style={{ fontSize: 13, color: G.textSecondary, fontWeight: 600 }}>Analizando sesión…</div>
            </div>
          )}

          {/* States: listo */}
          {estado === "listo" && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 18px",
              background: G.greenSoft, borderRadius: 12,
              border: `1px solid ${G.green}22`,
              width: "100%",
            }}>
              <div style={{ color: G.green, display: "flex" }}><IcoCheck /></div>
              <span style={{ fontSize: 13, color: G.green, fontWeight: 700, flex: 1 }}>
                Grabación finalizada · {fmtDuracion(duracion)}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "center" }}>
            {estado === "listo" && !resumen && (
              <button onClick={generarResumen} style={{
                height: 44, padding: "0 22px",
                background: G.accent, color: "#fff",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <IcoWave />
                Generar Resumen con el Asistente
              </button>
            )}
            {estado === "listo" && resumen && (
              <button onClick={guardar} style={{
                height: 44, padding: "0 22px",
                background: G.green, color: "#fff",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <IcoSave />
                Guardar sesión
              </button>
            )}
            {estado === "listo" && (
              <button onClick={() => {
                setEstado("idle");
                setTranscripcion("");
                setDuracion(0);
                setResumen(null);
                setAgendaEnVivo([]);
                ultimaPalabrasRef.current = 0;
                transcripcionRef.current = "";
              }} style={{
                height: 44, padding: "0 18px",
                background: G.surface, color: G.textSecondary,
                border: `1px solid ${G.border}`, borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                Nueva
              </button>
            )}
          </div>
        </div>
      )}

      {/* Botones guardar/nueva para modo archivo */}
      {modoPanel === "archivo" && estado === "listo" && (
        <div style={{ display: "flex", gap: 10 }}>
          {resumen && (
            <button onClick={guardar} style={{
              flex: 1, height: 44, padding: "0 22px",
              background: G.green, color: "#fff",
              border: "none", borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <IcoSave />
              Guardar sesión
            </button>
          )}
          <button onClick={() => {
            setEstado("idle");
            setArchivoAudio(null);
            setTranscripcion("");
            setResumen(null);
            transcripcionRef.current = "";
            if (fileInputRef.current) fileInputRef.current.value = "";
          }} style={{
            height: 44, padding: "0 18px",
            background: G.surface, color: G.textSecondary,
            border: `1px solid ${G.border}`, borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            Nueva
          </button>
        </div>
      )}

      {/* Error box */}
      {error && (
        <div style={{
          background: G.coralSoft, border: `1px solid ${G.coral}30`,
          borderRadius: 10, padding: "10px 14px",
          fontSize: 12, color: G.coral, fontWeight: 600,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          {error}
        </div>
      )}

      {/* Agenda en Vivo (solo modo vivo durante grabación) */}
      {modoPanel === "vivo" && estado === "grabando" && (
        <div style={{ background: G.surface, borderRadius: 14, border: `1px solid ${G.accent}28`, overflow: "hidden" }}>
          <div style={{
            padding: "10px 16px", background: G.accentSoft,
            borderBottom: `1px solid ${G.accent}18`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: G.accent, flexShrink: 0,
              animation: "dotBlink 1.5s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: G.accent, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Agenda en Vivo
            </span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: G.textTertiary }}>
              {actualizandoAgenda ? "Analizando…" : "Actualiza cada 2 min"}
            </span>
          </div>
          <div style={{ padding: "12px 16px", minHeight: 56 }}>
            {agendaEnVivo.length === 0 ? (
              <div style={{ fontSize: 12, color: G.textTertiary, fontStyle: "italic" }}>
                {duracion < 120
                  ? "Los puntos clave aparecerán después de 2 minutos de conversación…"
                  : "Procesando la transcripción…"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {agendaEnVivo.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: G.accentSoft, color: G.accent,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1,
                    }}>{i + 1}</div>
                    <span style={{ fontSize: 12, color: G.textPrimary, lineHeight: 1.55 }}>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transcripción en vivo */}
      {(estado === "grabando" || estado === "listo") && transcripcion && (
        <div style={{ background: G.surface, borderRadius: 14, border: `1px solid ${G.border}`, overflow: "hidden" }}>
          <div style={{
            padding: "10px 16px", borderBottom: `1px solid ${G.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: estado === "grabando" ? G.coral : G.green,
              animation: estado === "grabando" ? "dotBlink 1s infinite" : "none",
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: G.textTertiary, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              {estado === "grabando" ? "Transcribiendo en vivo" : "Transcripción completa"}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: G.textTertiary }}>
              ~{palabras} palabras
            </span>
          </div>
          <div style={{
            padding: "14px 16px", maxHeight: 200, overflowY: "auto",
            fontSize: 13, color: G.textPrimary, lineHeight: 1.7, whiteSpace: "pre-wrap",
          }}>
            {transcripcion}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Meeting card ─────────────────────────────────────────────────────────────
function ReunionCard({ reunion, onVer, onDelete }) {
  const r = reunion.resumen;
  const fechaStr = new Date(reunion.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short" });

  return (
    <div
      style={{
        background: G.glass,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 20,
        border: `1px solid ${G.glassBorder}`,
        padding: "16px 18px",
        display: "flex", flexDirection: "column", gap: 0,
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.textPrimary, letterSpacing: "-0.01em", lineHeight: 1.35 }}>
          {reunion.titulo}
        </div>
        <button
          onClick={onDelete}
          style={{
            color: G.textTertiary, background: "none", border: "none",
            cursor: "pointer", padding: 4, flexShrink: 0,
            display: "flex", alignItems: "center",
          }}
          onMouseEnter={e => e.currentTarget.style.color = G.coral}
          onMouseLeave={e => e.currentTarget.style.color = G.textTertiary}
        >
          <IcoTrash />
        </button>
      </div>

      {/* Meta row */}
      <div style={{ fontSize: 11, color: G.textTertiary, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
        <IcoCalendar />
        {fechaStr}
        {reunion.duracion && (
          <>
            <span style={{ color: G.border }}>·</span>
            <IcoClock />
            {fmtDuracion(reunion.duracion)}
          </>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: G.border, marginBottom: 12 }} />

      {/* Executive summary */}
      {r?.ejecutivo && (
        <div style={{ fontSize: 12, color: G.textSecondary, lineHeight: 1.5, fontStyle: "italic", marginBottom: 12 }}>
          "{r.ejecutivo.slice(0, 120)}{r.ejecutivo.length > 120 ? "…" : ""}"
        </div>
      )}

      {/* Divider */}
      {r && <div style={{ height: 1, background: G.border, marginBottom: 12 }} />}

      {/* Stat badges */}
      {r && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {r.puntosClave?.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: G.purple,
              background: G.purpleSoft, border: `1px solid ${G.purple}20`,
              borderRadius: 20, padding: "3px 8px",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <IcoStar /> {r.puntosClave.length} puntos
            </span>
          )}
          {r.decisiones?.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: G.green,
              background: G.greenSoft, border: `1px solid ${G.green}20`,
              borderRadius: 20, padding: "3px 8px",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <IcoCheck /> {r.decisiones.length} dec.
            </span>
          )}
          {r.acciones?.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: G.amber,
              background: G.amberSoft, border: `1px solid ${G.amber}20`,
              borderRadius: 20, padding: "3px 8px",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <IcoClipboard /> {r.acciones.length} acciones
            </span>
          )}
          {!r && reunion.transcripcion && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: G.textTertiary,
              background: "rgba(0,0,0,0.04)",
              borderRadius: 20, padding: "3px 8px",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
              Solo transcripción
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: G.border, marginBottom: 12 }} />

      {/* CTA button */}
      <button
        onClick={onVer}
        style={{
          width: "100%", height: 38,
          background: G.accentSoft, color: G.accent,
          border: `1px solid ${G.accent}20`, borderRadius: 10,
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = G.accent; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = G.accentSoft; e.currentTarget.style.color = G.accent; }}
      >
        Ver Minuta <IcoChevronRight />
      </button>
    </div>
  );
}

// ── Main ViewReuniones ───────────────────────────────────────────────────────
export default function ViewReuniones({ items, setItems, apiKey, aiConfig, darkMode = false }) {
  G = darkMode ? DARK_R : LIGHT_R;
  const reuniones = items.filter(i => i.tipo === "reunion").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const [tab, setTab] = useState("nueva"); // nueva | historial
  const [modoPanel, setModoPanel] = useState("vivo"); // vivo | archivo
  const [presentando, setPresentando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null); // reunion | null

  const resultadosBusqueda = buscarEnReuniones(reuniones, busqueda);

  // Inject CSS animations
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "reuniones-anim";
    s.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes recPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,59,48,0.4)} 50%{box-shadow:0 0 0 10px rgba(255,59,48,0)} }
      @keyframes dotBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    `;
    if (!document.getElementById("reuniones-anim")) document.head.appendChild(s);
  }, []);

  function guardarReunion({ titulo, transcripcion, duracion, resumen }) {
    const nueva = {
      id: uid(),
      tipo: "reunion",
      titulo,
      texto: titulo,
      transcripcion,
      duracion,
      resumen,
      fecha: new Date().toISOString(),
      creado: new Date().toISOString(),
      hecho: false,
      datos: { titulo },
    };
    setItems(prev => [nueva, ...prev]);
    setTab("historial");
  }

  function eliminarReunion(id) {
    setItems(prev => prev.filter(i => i.id !== id));
    setConfirmandoEliminar(null);
    if (presentando?.id === id) setPresentando(null);
  }

  function crearTareasDesdeReunion(reunion) {
    if (!reunion.resumen?.acciones?.length) return;
    const nuevasTareas = reunion.resumen.acciones.map(a => ({
      id: uid(),
      tipo: "tarea",
      titulo: a.tarea,
      texto: a.tarea,
      fecha: normalizarFechaReunion(a.fecha),
      creado: new Date().toISOString(),
      hecho: false,
      columna: calcularColumnaTarea(normalizarFechaReunion(a.fecha)),
      datos: {
        titulo: a.tarea,
        descripcion: `Acción de reunión: ${reunion.titulo}${a.responsable ? ` · ${a.responsable}` : ""}`,
        hora: null,
        responsable: a.responsable || null,
        origen: "reunion",
        reunionId: reunion.id,
        recordatorio: normalizarFechaReunion(a.fecha) ? "1440" : "none",
      },
    }));
    setItems(prev => [...nuevasTareas, ...prev]);
  }

  const tabs = [
    { id: "nueva",     label: "Nueva Reunión" },
    { id: "historial", label: `Historial (${reuniones.length})` },
  ];

  // ── Formatted date for agenda ──────────────────────────────────────────────
  const hoyLabel = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long" });
  const reunionesHoy = reuniones.filter(r => {
    const d = new Date(r.fecha);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });
  const ultimaReunion = reuniones[0] || null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.01em" }}>Reuniones</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: G.textSecondary }}>
            {reuniones.length > 0 ? `${reuniones.length} sesión${reuniones.length !== 1 ? "es" : ""} grabada${reuniones.length !== 1 ? "s" : ""}` : "Graba, transcribe y genera resúmenes"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Tab chips */}
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "8px 18px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                background: tab === t.id ? G.accent : (darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"),
                color: tab === t.id ? "#fff" : G.textSecondary }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BENTO GRID: MAIN + SIDEBAR ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>

        {/* LEFT: MAIN CONTENT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {tab === "nueva" && (
            <>
              {/* Hero recording panel */}
              <div style={{ background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                border: `1px solid ${G.glassBorder}`, borderRadius: 24, padding: 28, position: "relative", overflow: "hidden",
                boxShadow: darkMode ? "0 4px 32px rgba(0,0,0,0.35)" : "0 2px 20px rgba(36,180,149,0.07)" }}>
                {/* Teal tint decoration */}
                <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: darkMode ? "linear-gradient(to left, rgba(36,180,149,0.04), transparent)" : "linear-gradient(to left, rgba(36,180,149,0.05), transparent)", pointerEvents: "none" }} />
                {/* Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ background: `${G.teal}18`, color: G.teal, padding: "4px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    NUEVA SESIÓN
                  </span>
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.01em" }}>
                  {modoPanel === "vivo" ? "Grabación en Vivo" : "Transcripción desde Archivo"}
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: G.textSecondary, maxWidth: 580, lineHeight: 1.6 }}>
                  {modoPanel === "vivo"
                    ? "Graba tu reunión en tiempo real usando el micrófono de tu dispositivo. Obtén transcripción automática y un resumen ejecutivo estructurado con puntos clave y compromisos."
                    : "Sube grabaciones de audio o video de tus reuniones (MP3, M4A, MP4, etc. de hasta 20 MB). A través de la API de Google Gemini, el sistema transcribirá, estructurará y guardará tu sesión automáticamente."
                  }
                </p>
                <GrabacionPanel
                  apiKey={apiKey}
                  aiConfig={aiConfig}
                  onSave={guardarReunion}
                  darkMode={darkMode}
                  modoPanel={modoPanel}
                  setModoPanel={setModoPanel}
                />
              </div>
            </>
          )}

          {tab === "historial" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Hero: most recent meeting */}
              {ultimaReunion && (
                <div style={{ background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  border: `1px solid ${G.glassBorder}`, borderRadius: 24, padding: 28, position: "relative", overflow: "hidden",
                  boxShadow: darkMode ? "0 4px 32px rgba(0,0,0,0.35)" : "0 2px 20px rgba(0,0,0,0.06)" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: darkMode ? "linear-gradient(to left, rgba(36,180,149,0.04), transparent)" : "linear-gradient(to left, rgba(36,180,149,0.05), transparent)", pointerEvents: "none" }} />
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ background: `${G.teal}18`, color: G.teal, padding: "4px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>MÁS RECIENTE</span>
                        <span style={{ fontSize: 12, color: G.textTertiary, display: "flex", alignItems: "center", gap: 4 }}>
                          <IcoClock /> {ultimaReunion.duracion ? `${Math.floor(ultimaReunion.duracion/60)} min` : "sin duración"}
                        </span>
                      </div>
                      <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.01em" }}>
                        {ultimaReunion.titulo}
                      </h3>
                      <p style={{ margin: "0 0 20px", fontSize: 13, color: G.textSecondary, lineHeight: 1.6, maxWidth: 440, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {ultimaReunion.resumen?.ejecutivo || ultimaReunion.transcripcion?.slice(0, 120) || "Sin transcripción disponible"}
                      </p>
                      {/* Action items pills */}
                      {ultimaReunion.resumen?.acciones?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                          {ultimaReunion.resumen.acciones.slice(0,3).map((a,i) => (
                            <span key={i} style={{ fontSize: 11, fontWeight: 600, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 8, padding: "4px 10px", color: G.textSecondary }}>
                              ✓ {a.tarea?.slice(0,40)}{(a.tarea?.length||0)>40?"…":""}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={() => setPresentando(ultimaReunion)}
                          style={{ padding: "10px 24px", background: G.teal, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, boxShadow: `0 4px 14px ${G.teal}30` }}>
                          <IcoClipboard /> Ver Resumen
                        </button>
                        <button onClick={() => setConfirmandoEliminar(ultimaReunion)}
                          style={{ padding: "10px 14px", background: "transparent", color: G.textTertiary, border: `1px solid ${G.border}`, borderRadius: 12, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                          <IcoTrash />
                        </button>
                      </div>
                    </div>
                    <div style={{ width: 100, height: 80, borderRadius: 16, background: darkMode ? "rgba(36,180,149,0.08)" : "rgba(36,180,149,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${G.teal}20` }}>
                      <IcoVideo size={26} color={G.teal} />
                    </div>
                  </div>
                </div>
              )}

              {/* Search box */}
              {reuniones.length > 0 && (
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: G.textTertiary, pointerEvents: "none", display: "flex" }}>
                    <IcoSearch />
                  </span>
                  <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar en todas las reuniones…"
                    style={{ width: "100%", padding: "11px 40px", borderRadius: 20, border: `1px solid ${busqueda ? G.accent : G.border}`, background: G.glass, backdropFilter: "blur(12px)", fontSize: 13, color: G.textPrimary, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                  {busqueda && (
                    <button onClick={() => setBusqueda("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: G.textTertiary, cursor: "pointer", display: "flex" }}>
                      <IcoX />
                    </button>
                  )}
                </div>
              )}

              {/* Empty state */}
              {reuniones.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: G.textTertiary, background: G.glass, backdropFilter: "blur(12px)", borderRadius: 24, border: `1px solid ${G.glassBorder}` }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🎙️</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: G.textSecondary, marginBottom: 6 }}>Sin reuniones grabadas</div>
                  <div style={{ fontSize: 12, color: G.textTertiary, marginBottom: 18 }}>Inicia una nueva grabación para comenzar</div>
                  <button onClick={() => setTab("nueva")} style={{ height: 44, padding: "0 22px", background: G.teal, color: "#fff", border: "none", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <IcoMic /> Grabar ahora
                  </button>
                </div>
              )}

              {/* Meetings list - "Próximas Llamadas" style */}
              {reuniones.length > 1 && (
                <div>
                  <h4 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: G.textPrimary, paddingLeft: 4 }}>Historial de Sesiones</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(busqueda.trim() ? resultadosBusqueda?.map(r => r.reunion) || [] : reuniones.slice(1)).map(r => {
                      const colors = [G.purple, G.amber, G.teal, G.accent, G.coral];
                      const col = colors[reuniones.indexOf(r) % colors.length];
                      return (
                        <div key={r.id}
                          style={{ background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.6)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.6)"}`, borderRadius: 20, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.15s", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)"}
                          onMouseLeave={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.6)"}
                          onClick={() => setPresentando(r)}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${col}15`, color: col, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <IcoVideo size={22} />
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: G.textPrimary, marginBottom: 4 }}>{r.titulo}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 12, color: G.textTertiary, display: "flex", alignItems: "center", gap: 4 }}>
                                  <IcoClock /> {r.duracion ? `${Math.floor(r.duracion/60)} min` : "—"}
                                </span>
                                <span style={{ width: 3, height: 3, borderRadius: "50%", background: G.border, display: "inline-block" }} />
                                <span style={{ fontSize: 12, color: G.textTertiary, display: "flex", alignItems: "center", gap: 4 }}>
                                  <IcoCalendar /> {new Date(r.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.stopPropagation(); }}
                            onMouseLeave={e => e.currentTarget.style.opacity = "0"}>
                            <button onClick={e => { e.stopPropagation(); setPresentando(r); }}
                              style={{ padding: "6px 14px", background: G.glass, border: `1px solid ${G.border}`, borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, color: G.textPrimary }}>
                              Detalles
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search results */}
              {reuniones.length > 0 && busqueda.trim() && resultadosBusqueda && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {resultadosBusqueda.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"24px", color:G.textTertiary, background:G.glass, backdropFilter:"blur(12px)", borderRadius:16, border:`1px solid ${G.glassBorder}` }}>
                      Sin resultados para "{busqueda}"
                    </div>
                  ) : null}
                </div>
              )}

              {/* Existing search result items (keeps existing logic) */}
              {reuniones.length > 0 && busqueda.trim() && (
                <div style={{ display: "none" }}>
                  {/* Legacy search results rendered above in historial list */}
                </div>
              )}

            </div>
          )}

        </div>

        {/* RIGHT: AGENDA SIDEBAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Agenda Diaria */}
          <div style={{ background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${G.glassBorder}`, borderRadius: 24, padding: 24,
            boxShadow: darkMode ? "0 4px 24px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: G.textPrimary }}>Agenda Diaria</h4>
              <span style={{ fontSize: 13, fontWeight: 700, color: G.teal }}>{hoyLabel}</span>
            </div>

            {/* Timeline */}
            <div style={{ position: "relative" }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", borderRadius: 2 }} />

              {reunionesHoy.length === 0 && (
                <div style={{ paddingLeft: 28, paddingTop: 8 }}>
                  <div style={{ fontSize: 12, color: G.textTertiary, fontStyle: "italic" }}>No hay sesiones hoy</div>
                </div>
              )}
              {reunionesHoy.map((r, i) => (
                <div key={r.id} style={{ position: "relative", paddingLeft: 28, paddingBottom: 24 }}>
                  <div style={{ position: "absolute", left: 0, top: 4, width: 16, height: 16, borderRadius: "50%",
                    background: i === 0 ? G.teal : "transparent",
                    border: i === 0 ? `none` : `2px solid ${darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
                    boxShadow: i === 0 ? `0 0 0 4px ${G.teal}18` : "none" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? G.teal : G.textTertiary, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {new Date(r.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: G.textPrimary, marginBottom: 2 }}>{r.titulo}</div>
                  {r.resumen?.ejecutivo && (
                    <div style={{ fontSize: 11, color: G.textTertiary, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {r.resumen.ejecutivo}
                    </div>
                  )}
                </div>
              ))}

              {/* Add time block button */}
              <button onClick={() => setTab("nueva")}
                style={{ width: "100%", padding: "14px", border: `2px dashed ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, borderRadius: 16, background: "transparent", color: G.textTertiary, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s", marginTop: 4 }}
                onMouseEnter={e => { e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <IcoPlus /> Nueva Sesión
              </button>
            </div>
          </div>

          {/* AI Co-Pilot dark card */}
          <div style={{ background: darkMode ? "#0d1015" : "#16161e", borderRadius: 24, padding: 24, color: "#fff", position: "relative", overflow: "hidden" }}>
            {/* Glow */}
            <div style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, background: `${G.teal}20`, borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.teal} strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>
                <span style={{ fontSize: 10, fontWeight: 800, color: `${G.teal}cc`, textTransform: "uppercase", letterSpacing: "0.1em" }}>AI CO-PILOT</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: 16 }}>
                {reuniones.length === 0
                  ? "Graba tu primera reunión para que Cerebro AI analice patrones y sugiera optimizaciones de agenda."
                  : `Tienes ${reuniones.length} sesión${reuniones.length !== 1 ? "es" : ""} grabada${reuniones.length !== 1 ? "s" : ""}. ${reunionesHoy.length > 0 ? `${reunionesHoy.length} sesión${reunionesHoy.length !== 1 ? "es" : ""} hoy.` : "Ninguna sesión hoy."}`}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setTab("historial")}
                  style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
                  Historial
                </button>
                <button onClick={() => setTab("nueva")}
                  style={{ padding: "8px 16px", background: G.teal, border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 12px ${G.teal}40`, transition: "filter 0.15s" }}>
                  Grabar Ahora
                </button>
              </div>
            </div>
          </div>

          {/* Stats mini card */}
          {reuniones.length > 0 && (
            <div style={{ background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${G.glassBorder}`, borderRadius: 20, padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Sesiones</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: G.textPrimary }}>{reuniones.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Con Resumen</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: G.teal }}>{reuniones.filter(r => r.resumen?.ejecutivo).length}</div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modal de confirmación de eliminación */}
      {confirmandoEliminar && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 3000,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}
          onClick={() => setConfirmandoEliminar(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: G.surface, borderRadius: 18,
              border: `1px solid ${G.border}`,
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
              padding: "28px 28px 24px", maxWidth: 400, width: "100%",
            }}
          >
            {/* Icono de advertencia */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: G.coralSoft, border: `1px solid ${G.coral}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16, color: G.coral,
            }}>
              <IcoTrash />
            </div>

            <div style={{ fontSize: 17, fontWeight: 800, color: G.textPrimary, marginBottom: 6, letterSpacing: "-0.01em" }}>
              Eliminar reunión
            </div>
            <div style={{ fontSize: 13, color: G.textSecondary, lineHeight: 1.55, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: G.textPrimary }}>"{confirmandoEliminar.titulo}"</span>
            </div>
            <div style={{ fontSize: 12, color: G.textTertiary, lineHeight: 1.5, marginBottom: 24 }}>
              Se eliminarán la grabación, transcripción y resumen. Esta acción no se puede deshacer.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmandoEliminar(null)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10,
                  background: "transparent", border: `1px solid ${G.border}`,
                  color: G.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarReunion(confirmandoEliminar.id)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10,
                  background: G.coral, border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  boxShadow: `0 4px 14px ${G.coralSoft}`,
                }}
              >
                <IcoTrash /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Presentation modal */}
      {presentando && (
        <PresentacionReunion
          reunion={presentando}
          onClose={() => setPresentando(null)}
          onCrearTareas={() => {
            crearTareasDesdeReunion(presentando);
            setPresentando(null);
          }}
        />
      )}
    </div>
  );
}
