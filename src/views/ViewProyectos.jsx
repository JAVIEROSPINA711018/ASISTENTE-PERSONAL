import { useState, useEffect, useCallback } from "react";
import { projectsDB, clientsDB, financialsDB, PROJECT_STATUSES, PROJECT_TYPES } from "../lib/supabaseCRM.js";
import ViewProyectoDetalle from "./ViewProyectoDetalle.jsx";

// CRM Design System — RED=#901B2F  BLUE=#1F3A52
import { LIGHT, DARK } from "../lib/theme.js";

const FONT = "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif";

const STATUS_STYLES = {
  "En Ejecución":              { bg: "rgba(37,99,235,0.10)",    text: "#2563eb", label: "En Ejecución" },
  "Con Acta de Observaciones": { bg: "rgba(217,119,6,0.10)",    text: "#d97706", label: "Con Acta" },
  "Para Entregar":             { bg: "rgba(124,58,237,0.10)",   text: "#7c3aed", label: "Para Entregar" },
  "Entregado (Por Cobrar)":    { bg: "rgba(217,119,6,0.15)",    text: "#d97706", label: "Entregado/Debe" },
  "Terminado":                 { bg: "rgba(22,163,74,0.10)",    text: "#16a34a", label: "Terminado" },
  "Cancelado":                 { bg: "rgba(100,116,139,0.12)",  text: "#64748b", label: "Cancelado" },
};

const STATUS_GROUPS = [
  { status: "En Ejecución",              bg: "rgba(37,99,235,0.05)",   bgDark: "rgba(59,130,246,0.10)",   headerBg: "rgba(37,99,235,0.10)",   headerBgDark: "rgba(59,130,246,0.16)",   textColor: "#2563eb", textColorDark: "#3b82f6", borderColor: "#2563eb" },
  { status: "Con Acta de Observaciones", bg: "rgba(217,119,6,0.05)",   bgDark: "rgba(251,191,36,0.10)",   headerBg: "rgba(217,119,6,0.10)",   headerBgDark: "rgba(251,191,36,0.16)",   textColor: "#d97706", textColorDark: "#fbbf24", borderColor: "#d97706" },
  { status: "Para Entregar",             bg: "rgba(124,58,237,0.05)",  bgDark: "rgba(167,139,250,0.10)",  headerBg: "rgba(124,58,237,0.10)",  headerBgDark: "rgba(167,139,250,0.16)",  textColor: "#7c3aed", textColorDark: "#a78bfa", borderColor: "#7c3aed" },
  { status: "Entregado (Por Cobrar)",    bg: "rgba(217,119,6,0.05)",   bgDark: "rgba(251,191,36,0.10)",   headerBg: "rgba(217,119,6,0.10)",   headerBgDark: "rgba(251,191,36,0.16)",   textColor: "#d97706", textColorDark: "#fbbf24", borderColor: "#d97706" },
  { status: "Terminado",                 bg: "rgba(22,163,74,0.05)",   bgDark: "rgba(74,222,128,0.10)",   headerBg: "rgba(22,163,74,0.10)",   headerBgDark: "rgba(74,222,128,0.16)",   textColor: "#16a34a", textColorDark: "#4ade80", borderColor: "#16a34a" },
];

const emptyForm = {
  name: "", type: PROJECT_TYPES[0], clientId: "",
  valueWithoutTax: "", deadline: "", status: "En Ejecución", progress: 0,
};

function fmt(n) {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtCOP(n) {
  if (!n) return "$0";
  return "$" + Math.round(n).toLocaleString("es-CO");
}

// ── Donut chart (SVG, no deps) ────────────────────────────────────────────────
function DonutChart({ cobrado, pendiente, size = 110, stroke = 22 }) {
  const r    = (size - stroke) / 2;
  const cx   = size / 2;
  const cy   = size / 2;
  const circ = 2 * Math.PI * r;
  const total = (cobrado + pendiente) || 1;

  const d1 = (cobrado   / total) * circ;
  const d2 = (pendiente / total) * circ;

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={stroke} />
      {/* Cobrado (green) */}
      {cobrado > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#16a34a" strokeWidth={stroke}
          strokeDasharray={`${d1} ${circ - d1}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      {/* Pendiente (orange) */}
      {pendiente > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f97316" strokeWidth={stroke}
          strokeDasharray={`${d2} ${circ - d2}`}
          strokeDashoffset={-d1}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      {/* Center label */}
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">
        {Math.round((cobrado / total) * 100)}%
      </text>
    </svg>
  );
}

// ── Right consolidated panel ──────────────────────────────────────────────────
const CARTERA_GROUPS = [
  { status: "En Ejecución",              label: "En Ejecución",      color: "#2563eb" },
  { status: "Con Acta de Observaciones", label: "Con Acta",          color: "#d97706" },
  { status: "Para Entregar",             label: "Para Entregar",     color: "#7c3aed" },
  { status: "Entregado (Por Cobrar)",    label: "Entregado (Debe)",  color: "#f97316" },
];

function ConsolidadoPanel({ G, darkMode, totalContratado, totalCobrado, totalPorCobrar, filtered, saldoByProject }) {
  return (
    <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", paddingBottom: 8 }}>

      {/* Valor Contratado */}
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 11, color: G.textTertiary }}>Valor Contratado</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="1.8" strokeLinecap="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: G.textPrimary, marginTop: 8, letterSpacing: "-0.02em" }}>
          {fmtCOP(totalContratado)}
        </div>
      </div>

      {/* Recaudo Total */}
      <div style={{ background: darkMode ? "rgba(22,163,74,0.12)" : "rgba(22,163,74,0.06)", border: `1px solid rgba(22,163,74,0.22)`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 11, color: "#16a34a" }}>Recaudo Total</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a", marginTop: 8, letterSpacing: "-0.02em" }}>
          {fmtCOP(totalCobrado)}
        </div>
      </div>

      {/* Por Cobrar */}
      <div style={{ background: darkMode ? "rgba(249,115,22,0.10)" : "rgba(249,115,22,0.06)", border: `2px solid #f97316`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 11, color: "#f97316" }}>Por Cobrar</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f97316", marginTop: 8, letterSpacing: "-0.02em" }}>
          {fmtCOP(totalPorCobrar)}
        </div>
      </div>

      {/* Donut + Desglose */}
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <DonutChart cobrado={totalCobrado} pendiente={totalPorCobrar} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Desglose de Cartera
        </div>
        {CARTERA_GROUPS.map(g => {
          const pendiente = filtered
            .filter(p => p.status === g.status)
            .reduce((s, p) => s + (saldoByProject[p.id] || 0), 0);
          if (pendiente === 0) return null;
          return (
            <div key={g.status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: g.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: G.textSecondary }}>{g.label}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: G.textPrimary }}>{fmt(pendiente)}</span>
            </div>
          );
        })}
        {/* Legend */}
        <div style={{ display: "flex", gap: 12, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 4, borderRadius: 2, background: "#16a34a" }} />
            <span style={{ fontSize: 10, color: G.textTertiary }}>Cobrado</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 4, borderRadius: 2, background: "#f97316" }} />
            <span style={{ fontSize: 10, color: G.textTertiary }}>Pendiente</span>
          </div>
        </div>
      </div>

    </div>
  );
}

function Badge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["Cancelado"];
  return (
    <span style={{
      fontSize: 9, padding: "2px 7px", borderRadius: 6, fontWeight: 700,
      background: s.bg, color: s.text, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

function ProgressBar({ value, G }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: G.border, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: pct === 100 ? G.green : G.accent, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 10, color: G.textTertiary, minWidth: 28, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

// ── Compact project card (board view) ─────────────────────────────────────────
function ProjectCard({ project, clients, onEdit, onNavigate, onDelete, G, darkMode, saldo }) {
  const client = clients.find(c => c.id === project.clientId);
  const daysLeft = project.deadline
    ? Math.ceil((new Date(project.deadline) - new Date()) / 86400000)
    : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && project.status !== "Terminado";
  const isUrgent  = daysLeft !== null && daysLeft <= 10 && daysLeft >= 0 && project.status === "En Ejecución";

  return (
    <div
      style={{
        background: G.surface, border: `1px solid ${G.border}`,
        borderRadius: 10, padding: "10px 12px",
        display: "flex", flexDirection: "column", gap: 6,
        position: "relative", cursor: "pointer",
        transition: "box-shadow 0.15s",
      }}
      onClick={() => onNavigate(project)}
      className="proj-card"
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: G.textPrimary, lineHeight: 1.3, paddingRight: 52 }}>
        {project.name}
      </div>

      <div style={{ fontSize: 10, color: G.textTertiary, display: "flex", alignItems: "center", gap: 4 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/>
        </svg>
        {client?.name || "Sin cliente"}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 700, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: G.textSecondary, padding: "1px 5px", borderRadius: 4 }}>
          #SYE{project.invoiceNumber || "---"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: G.green, background: G.greenSoft, padding: "1px 6px", borderRadius: 4 }}>
            {fmt(project.valueWithoutTax)}
          </span>
          {saldo > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: G.coral, background: G.coralSoft, padding: "1px 6px", borderRadius: 4 }}>
              Debe: {fmt(saldo)}
            </span>
          )}
          {saldo === 0 && project.valueWithoutTax > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: G.green, background: G.greenSoft, padding: "1px 5px", borderRadius: 4 }}>
              ✓ Pagado
            </span>
          )}
        </div>
      </div>

      {(isUrgent || isOverdue) && (
        <div style={{ fontSize: 9, fontWeight: 700, color: isOverdue ? G.coral : G.amber, background: isOverdue ? G.coralSoft : G.amberSoft, padding: "2px 6px", borderRadius: 4, alignSelf: "flex-start" }}>
          {isOverdue ? "⚠ Vencido" : `⏰ Vence en ${daysLeft}d`}
        </div>
      )}

      {project.deadline && (
        <div style={{ fontSize: 9, color: G.textTertiary, display: "flex", alignItems: "center", gap: 3 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd"/>
          </svg>
          {new Date(project.deadline).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
        </div>
      )}

      {project.progress > 0 && (
        <ProgressBar value={project.progress} G={G} />
      )}

      {/* Action buttons top-right */}
      <div style={{ position: "absolute", top: 7, right: 7, display: "flex", gap: 3 }}>
        <button
          onClick={e => { e.stopPropagation(); onNavigate(project); }}
          title="Ver detalle"
          style={{ background: "none", border: "none", cursor: "pointer", color: G.textTertiary, padding: 2, opacity: 0, transition: "opacity 0.15s", fontSize: 12, lineHeight: 1 }}
          className="proj-edit-btn"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(project); }}
          title="Eliminar"
          style={{ background: "none", border: "none", cursor: "pointer", color: G.textTertiary, padding: 2, opacity: 0, transition: "opacity 0.15s", fontSize: 13, lineHeight: 1 }}
          className="proj-del-btn"
        >✕</button>
      </div>

      <style>{`
        .proj-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.12); }
        .proj-card:hover .proj-edit-btn { opacity: 1 !important; }
        .proj-card:hover .proj-del-btn  { opacity: 1 !important; }
        .proj-edit-btn:hover { color: ${G.accent} !important; opacity: 1 !important; }
        .proj-del-btn:hover  { color: ${G.coral}  !important; opacity: 1 !important; }
      `}</style>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ViewProyectos({ darkMode = false, initialProjectId = null, onClearInitialProject = null }) {
  const G = darkMode ? DARK : LIGHT;

  const [projects, setProjects]     = useState([]);
  const [clients, setClients]       = useState([]);
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [viewMode, setViewMode]     = useState("board");
  const [saving, setSaving]         = useState(false);
  const [delConfirm, setDelConfirm] = useState({ open: false, project: null });

  // Detail view
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  // modal: null = closed | "create" | "edit"
  const [modalMode, setModalMode]   = useState(null);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(emptyForm);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [prjs, cls, fins] = await Promise.all([projectsDB.getAll(), clientsDB.getAll(), financialsDB.getAll()]);
      setProjects(prjs); setClients(cls); setFinancials(fins);
    } catch (e) {
      setError(e.message || "Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filters ───────────────────────────────────────────────────────────────
  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) ||
      (clients.find(c => c.id === p.clientId)?.name || "").toLowerCase().includes(q);
    const matchStatus = filterStatus ? p.status === filterStatus : true;
    const matchClient = filterClient ? p.clientId === filterClient : true;
    return matchSearch && matchStatus && matchClient;
  });

  // ── Open modals ───────────────────────────────────────────────────────────
  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setModalMode("create");
  }

  function openEdit(project) {
    setForm({
      name:           project.name || "",
      type:           project.type || PROJECT_TYPES[0],
      clientId:       project.clientId || "",
      valueWithoutTax: project.valueWithoutTax != null ? String(project.valueWithoutTax) : "",
      deadline:       project.deadline ? project.deadline.substring(0, 10) : "",
      status:         project.status || "En Ejecución",
      progress:       project.progress != null ? project.progress : 0,
    });
    setEditingId(project.id);
    setModalMode("edit");
  }

  function closeModal() { setModalMode(null); setEditingId(null); setForm(emptyForm); }

  // ── Save (create or update) ───────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.clientId) return;
    setSaving(true);
    try {
      if (modalMode === "create") {
        const maxNum = projects.reduce((m, p) => (p.invoiceNumber || 0) > m ? (p.invoiceNumber || 0) : m, 500);
        const created = await projectsDB.create({
          invoiceNumber:   maxNum + 1,
          name:            form.name,
          type:            form.type,
          clientId:        form.clientId,
          valueWithoutTax: parseFloat(form.valueWithoutTax) || 0,
          services: [{ id: `s${Date.now()}`, name: "Servicio Principal", value: parseFloat(form.valueWithoutTax) || 0 }],
          status:          form.status,
          responsibleIds:  [],
          startDate:       new Date().toISOString().substring(0, 10),
          deadline:        form.deadline || null,
          progress:        Number(form.progress) || 0,
          actaUrl:         "",
          checklist:       [],
        });
        setProjects(prev => [created, ...prev]);
      } else {
        const existing = projects.find(p => p.id === editingId);
        const updated = await projectsDB.update({
          ...existing,
          name:            form.name,
          type:            form.type,
          clientId:        form.clientId,
          valueWithoutTax: parseFloat(form.valueWithoutTax) || 0,
          status:          form.status,
          deadline:        form.deadline || null,
          progress:        Number(form.progress) || 0,
        });
        setProjects(prev => prev.map(p => p.id === editingId ? updated : p));
      }
      closeModal();
    } catch (e) {
      alert((modalMode === "create" ? "Error al crear: " : "Error al guardar: ") + (e.message || e));
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!delConfirm.project) return;
    try {
      await projectsDB.delete(delConfirm.project.id);
      setProjects(prev => prev.filter(p => p.id !== delConfirm.project.id));
      setDelConfirm({ open: false, project: null });
    } catch (e) {
      alert("Error al eliminar: " + (e.message || e));
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalValue = filtered.reduce((s, p) => s + (p.valueWithoutTax || 0), 0);
  const active     = filtered.filter(p => p.status === "En Ejecución").length;
  const done       = filtered.filter(p => p.status === "Terminado").length;

  // Saldo por proyecto: valor contratado - cobros pagados
  const saldoByProject = {};
  projects.forEach(p => {
    const cobrado = financials
      .filter(f => f.projectId === p.id && f.type === "Cobro / Factura" && f.status === "Pagado")
      .reduce((s, f) => s + f.amount, 0);
    saldoByProject[p.id] = Math.max(0, (p.valueWithoutTax || 0) - cobrado);
  });

  // Total cobrado y por cobrar sobre proyectos filtrados (excluye cancelados)
  const filteredActive = filtered.filter(p => p.status !== "Cancelado");
  const totalContratado = filteredActive.reduce((s, p) => s + (p.valueWithoutTax || 0), 0);
  const totalPorCobrar  = filteredActive.reduce((s, p) => s + (saldoByProject[p.id] || 0), 0);
  const totalCobrado    = totalContratado - totalPorCobrar;

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputStyle = {
    border: `1px solid ${G.border}`, borderRadius: 8,
    padding: "7px 11px", fontSize: 12, fontFamily: FONT,
    background: G.surface, color: G.textPrimary, outline: "none",
  };
  const btnPrimary = {
    padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer",
    background: G.accent, color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: FONT,
    display: "flex", alignItems: "center", gap: 6,
  };
  const btnSecondary = {
    padding: "7px 14px", borderRadius: 9, border: `1px solid ${G.border}`, cursor: "pointer",
    background: "transparent", color: G.textSecondary, fontSize: 12, fontFamily: FONT,
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: G.textSecondary,
    display: "block", marginBottom: 4, fontFamily: FONT,
  };

  // ── Project detail view ───────────────────────────────────────────────────
  if (selectedProjectId) {
    return (
      <ViewProyectoDetalle
        projectId={selectedProjectId}
        onBack={() => {
          setSelectedProjectId(null);
          if (onClearInitialProject) onClearInitialProject();
          load();
        }}
        darkMode={darkMode}
      />
    );
  }

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: G.textTertiary, fontFamily: FONT, fontSize: 14 }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${G.accent}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", marginRight: 10 }} />
      Cargando proyectos...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (error) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: FONT }}>
      <span style={{ color: G.coral, fontSize: 14 }}>⚠ {error}</span>
      <button onClick={load} style={btnPrimary}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ fontFamily: FONT, color: G.textPrimary, display: "flex", flexDirection: "column", gap: 16, minWidth: 0, height: "100%" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: G.textPrimary, letterSpacing: "-0.03em" }}>Proyectos</h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: G.textTertiary }}>
            {filtered.length} proyecto{filtered.length !== 1 ? "s" : ""} · {fmt(totalValue)} total
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Proyecto
        </button>
      </div>

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, flexShrink: 0 }}>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: G.green }}>{fmt(totalContratado)}</div>
          <div style={{ fontSize: 10, color: G.textTertiary, marginTop: 2 }}>Contratado · {active} activos</div>
        </div>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: G.coral }}>{fmt(totalPorCobrar)}</div>
          <div style={{ fontSize: 10, color: G.textTertiary, marginTop: 2 }}>Por cobrar (saldo clientes)</div>
        </div>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: G.accent }}>{fmt(totalCobrado)}</div>
          <div style={{ fontSize: 10, color: G.textTertiary, marginTop: 2 }}>Cobrado · {done} terminados</div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
        <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Buscar proyecto o cliente..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 30, width: "100%", boxSizing: "border-box" }} />
        </div>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ ...inputStyle, minWidth: 150 }}>
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, minWidth: 150 }}>
          <option value="">Todos los estados</option>
          {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ display: "flex", gap: 2, background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderRadius: 8, padding: 3, border: `1px solid ${G.border}` }}>
          {[{ id: "board", icon: "⊞" }, { id: "list", icon: "≡" }].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13,
              background: viewMode === v.id ? G.accent : "transparent",
              color: viewMode === v.id ? "#fff" : G.textTertiary, fontFamily: FONT,
            }}>{v.icon}</button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", gap: 14, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

        {viewMode === "board" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {STATUS_GROUPS.map(sg => {
              const group = filtered.filter(p => p.status === sg.status).sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
              const totalGrp  = group.reduce((s, p) => s + (p.valueWithoutTax || 0), 0);
              const saldoGrp  = group.reduce((s, p) => s + (saldoByProject[p.id] || 0), 0);
              return (
                <div key={sg.status}>
                  <div style={{
                    padding: "8px 14px",
                    background: darkMode ? sg.headerBgDark : sg.headerBg,
                    borderBottom: `2px solid ${sg.borderColor}`,
                    borderTopLeftRadius: 10, borderTopRightRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: darkMode ? sg.textColorDark : sg.textColor }}>{sg.status}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: darkMode ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.8)", color: G.textSecondary, padding: "1px 6px", borderRadius: 5 }}>{group.length}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {(totalGrp - saldoGrp) > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: G.green, background: "rgba(22,163,74,0.12)", padding: "2px 8px", borderRadius: 5 }}>
                          Pagado: {fmt(totalGrp - saldoGrp)}
                        </span>
                      )}
                      {saldoGrp > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: G.coral, background: "rgba(220,38,38,0.10)", padding: "2px 8px", borderRadius: 5 }}>
                          Pendiente: {fmt(saldoGrp)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ background: darkMode ? sg.bgDark : sg.bg, border: `1px solid ${G.border}`, borderTop: "none", borderBottomLeftRadius: 10, borderBottomRightRadius: 10, padding: 10 }}>
                    {group.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 8 }}>
                        {group.map(p => (
                          <ProjectCard
                            key={p.id} project={p} clients={clients}
                            onNavigate={p => setSelectedProjectId(p.id)}
                            onEdit={openEdit}
                            onDelete={proj => setDelConfirm({ open: true, project: proj })}
                            G={G} darkMode={darkMode}
                            saldo={saldoByProject[p.id] ?? p.valueWithoutTax}
                          />
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", color: G.textTertiary, fontSize: 12, padding: "14px 0", fontStyle: "italic" }}>Sin proyectos</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── List view ─────────────────────────────────────────────── */
          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderBottom: `1px solid ${G.border}` }}>
                    {["Proyecto", "Cliente", "Tipo", "Estado", "Avance", "Valor", "Entrega", ""].map((h, i) => (
                      <th key={i} style={{ padding: "9px 12px", textAlign: i === 7 ? "center" : "left", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: G.textTertiary, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(project => {
                    const client = clients.find(c => c.id === project.clientId);
                    return (
                      <tr
                        key={project.id}
                        style={{ borderBottom: `1px solid ${G.border}`, cursor: "pointer", transition: "background 0.12s" }}
                        className="list-row"
                        onClick={() => setSelectedProjectId(project.id)}
                      >
                        <td style={{ padding: "10px 12px", minWidth: 180 }}>
                          <div style={{ fontWeight: 600, color: G.textPrimary, lineHeight: 1.3 }}>{project.name}</div>
                          <div style={{ fontSize: 10, color: G.textTertiary, marginTop: 2 }}>#SYE{project.invoiceNumber || "---"}</div>
                        </td>
                        <td style={{ padding: "10px 12px", color: G.textSecondary, maxWidth: 140 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client?.name || "—"}</div>
                        </td>
                        <td style={{ padding: "10px 12px", color: G.textTertiary, maxWidth: 130 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.type}</div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge status={project.status} />
                        </td>
                        <td style={{ padding: "10px 12px", minWidth: 100 }}>
                          <ProgressBar value={project.progress} G={G} />
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: G.green, whiteSpace: "nowrap" }}>
                          {fmt(project.valueWithoutTax)}
                        </td>
                        <td style={{ padding: "10px 12px", color: G.textTertiary, whiteSpace: "nowrap" }}>
                          {project.deadline ? new Date(project.deadline).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                        </td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button
                              onClick={() => setSelectedProjectId(project.id)}
                              title="Ver detalle"
                              style={{ background: G.accentSoft, border: "none", borderRadius: 6, cursor: "pointer", color: G.accent, padding: "4px 8px", fontSize: 11, fontFamily: FONT, fontWeight: 600 }}
                            >Ver</button>
                            <button
                              onClick={() => setDelConfirm({ open: true, project })}
                              title="Eliminar"
                              style={{ background: G.coralSoft, border: "none", borderRadius: 6, cursor: "pointer", color: G.coral, padding: "4px 8px", fontSize: 11, fontFamily: FONT, fontWeight: 600 }}
                            >✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "36px", textAlign: "center", color: G.textTertiary, fontStyle: "italic" }}>
                        {search || filterStatus || filterClient ? "No se encontraron proyectos con los filtros aplicados." : "Aún no hay proyectos. ¡Crea el primero!"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Right consolidated panel ──────────────────────────────────────── */}
      <ConsolidadoPanel
        G={G} darkMode={darkMode}
        totalContratado={totalContratado}
        totalCobrado={totalCobrado}
        totalPorCobrar={totalPorCobrar}
        filtered={filtered}
        saldoByProject={saldoByProject}
      />
      </div>

      {/* ── Modal Crear / Editar ──────────────────────────────────────────── */}
      {modalMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: G.surface, border: `1px solid ${G.borderHigh}`, borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 24px 60px rgba(0,0,0,0.35)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: G.textPrimary, fontFamily: FONT }}>
                {modalMode === "create" ? "Nuevo Proyecto" : "Editar Proyecto"}
              </span>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: G.textTertiary, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

              {/* Nombre */}
              <div>
                <label style={labelStyle}>Nombre del Proyecto *</label>
                <input required type="text" placeholder="Ej: Edificio Residencial Av. Libertador"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
              </div>

              {/* Cliente + Tipo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Cliente *</label>
                  <select required value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}>
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}>
                    {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Valor + Fecha */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Valor Total (Sin IVA)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.textTertiary, fontSize: 12 }}>$</span>
                    <input type="number" placeholder="0" value={form.valueWithoutTax}
                      onChange={e => setForm(p => ({ ...p, valueWithoutTax: e.target.value }))}
                      style={{ ...inputStyle, paddingLeft: 22, width: "100%", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Fecha de Entrega</label>
                  <input type="date" value={form.deadline}
                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>

              {/* Estado + Avance */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}>
                    {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Avance: <strong>{form.progress}%</strong></label>
                  <input type="range" min="0" max="100" step="5"
                    value={form.progress}
                    onChange={e => setForm(p => ({ ...p, progress: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: G.accent, marginTop: 4 }} />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 6, borderTop: `1px solid ${G.border}`, marginTop: 2 }}>
                <button type="button" onClick={closeModal} style={btnSecondary} disabled={saving}>Cancelar</button>
                <button type="submit" style={btnPrimary} disabled={saving}>
                  {saving && <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />}
                  {modalMode === "create" ? "Crear Proyecto" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ────────────────────────────────────────────────── */}
      {delConfirm.open && delConfirm.project && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: G.surface, border: `1px solid ${G.borderHigh}`, borderRadius: 16, width: "100%", maxWidth: 380, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: G.coralSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G.coral} strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: G.textPrimary, fontFamily: FONT }}>Eliminar Proyecto</div>
                <div style={{ fontSize: 12, color: G.textSecondary, marginTop: 2, fontFamily: FONT }}>Esta acción no se puede deshacer.</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: G.textSecondary, fontFamily: FONT, margin: "0 0 20px" }}>
              ¿Eliminar <strong style={{ color: G.textPrimary }}>{delConfirm.project.name}</strong>?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDelConfirm({ open: false, project: null })} style={btnSecondary}>Cancelar</button>
              <button onClick={handleDelete} style={{ ...btnPrimary, background: G.coral }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .list-row:hover { background: ${darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}; }
      `}</style>
    </div>
  );
}
