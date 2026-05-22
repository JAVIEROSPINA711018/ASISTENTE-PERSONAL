import { useState, useEffect, useCallback, useMemo } from "react";
import { quotesDB, clientsDB, projectsDB, QUOTE_STATUSES, SERVICE_OPTIONS, PROJECT_TYPES } from "../lib/supabaseCRM.js";
import ViewQuoteGenerator from "./ViewQuoteGenerator.jsx";

// CRM Design System — RED=#901B2F  BLUE=#1F3A52
import { LIGHT, DARK } from "../lib/theme.js";

const FONT = "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif";

function fmt(n) {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
function fmtFull(n) {
  return "$" + (n || 0).toLocaleString("es-CO");
}

// ── Column config ─────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    status: QUOTE_STATUSES.BORRADOR,
    label: "Borrador",
    dot: "#8e8e93",
    bg:     "rgba(142,142,147,0.06)",  bgDark: "rgba(142,142,147,0.10)",
    header: "rgba(142,142,147,0.10)",  headerDark: "rgba(142,142,147,0.15)",
    border: "rgba(142,142,147,0.25)",  borderDark: "rgba(142,142,147,0.20)",
    count:  "rgba(142,142,147,0.15)",  countText: "#8e8e93",
    actions: ["edit","send","delete"],
  },
  {
    status: QUOTE_STATUSES.ENVIADA,
    label: "Enviada · Pendiente",
    dot: "#2563eb",
    bg:     "rgba(37,99,235,0.05)",    bgDark: "rgba(59,130,246,0.08)",
    header: "rgba(37,99,235,0.10)",    headerDark: "rgba(59,130,246,0.14)",
    border: "rgba(37,99,235,0.20)",    borderDark: "rgba(59,130,246,0.18)",
    count:  "rgba(37,99,235,0.12)",    countText: "#2563eb",
    actions: ["edit","approve","reject","draft","delete"],
  },
  {
    status: QUOTE_STATUSES.RECHAZADA,
    label: "Rechazada",
    dot: "#dc2626",
    bg:     "rgba(220,38,38,0.04)",    bgDark: "rgba(248,113,113,0.07)",
    header: "rgba(220,38,38,0.08)",    headerDark: "rgba(248,113,113,0.12)",
    border: "rgba(220,38,38,0.18)",    borderDark: "rgba(248,113,113,0.15)",
    count:  "rgba(220,38,38,0.12)",    countText: "#dc2626",
    actions: ["draft","delete"],
  },
];

// ── Premium Outline Icons ──────────────────────────────────────────────────────
const IconEdit = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const IconPdf = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const IconSend = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconApprove = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconReject = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const IconDraft = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6"/>
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
  </svg>
);

const IconDelete = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

// ── QuoteCard ─────────────────────────────────────────────────────────────────
function QuoteCard({ quote, clients, G, darkMode, onEdit, onChangeStatus, onApprove, onDelete, onGeneratePDF }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const client = clients.find(c => c.id === quote.clientId);
  const col = COLUMNS.find(c => c.status === quote.status) || COLUMNS[0];

  const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date()
    && quote.status === QUOTE_STATUSES.ENVIADA;

  const totalWithIva = quote.applyIva ? quote.value * 1.19 : quote.value;

  return (
    <div style={{
      background: G.surface, border: `1px solid ${G.border}`,
      borderRadius: 12, padding: "14px 14px 12px",
      display: "flex", flexDirection: "column", gap: 8,
      position: "relative", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: G.textPrimary, lineHeight: 1.35, marginBottom: 3, wordBreak: "break-word" }}>
            {quote.name}
          </div>
          <div style={{ fontSize: 11, color: G.textTertiary, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/></svg>
            {client?.name || "Cliente desconocido"}
          </div>
        </div>

        {/* ⋯ Menu */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: G.textTertiary, padding: "2px 4px", borderRadius: 6, fontSize: 18, lineHeight: 1 }}
          >⋯</button>

          {menuOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 8000 }} onClick={() => setMenuOpen(false)} />
              <div style={{
                position: "absolute", right: 0, top: "110%", zIndex: 8001,
                background: G.surface, border: `1px solid ${G.borderHigh}`,
                borderRadius: 10, minWidth: 172, boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.45)" : "0 10px 30px rgba(0,0,0,0.08)",
                overflow: "hidden", padding: "4px 0",
              }}>
                {col.actions.includes("edit") && (
                  <MenuItem label="Editar" icon={IconEdit} color={G.textSecondary} onClick={() => { setMenuOpen(false); onEdit(quote); }} G={G} />
                )}
                {(col.status === QUOTE_STATUSES.BORRADOR || col.status === QUOTE_STATUSES.ENVIADA) && (
                  <MenuItem label="Generar PDF" icon={IconPdf} color={G.textSecondary} onClick={() => { setMenuOpen(false); onGeneratePDF(quote); }} G={G} />
                )}
                {col.actions.includes("send") && (
                  <MenuItem label="Enviar" icon={IconSend} color={G.textSecondary} onClick={() => { setMenuOpen(false); onChangeStatus(quote, QUOTE_STATUSES.ENVIADA); }} G={G} />
                )}
                {col.actions.includes("approve") && (
                  <MenuItem label="Aprobada → Proyecto" icon={IconApprove} color={G.green} bold onClick={() => { setMenuOpen(false); onApprove(quote); }} G={G} />
                )}
                {col.actions.includes("reject") && (
                  <MenuItem label="Rechazar" icon={IconReject} color={G.coral} onClick={() => { setMenuOpen(false); onChangeStatus(quote, QUOTE_STATUSES.RECHAZADA); }} G={G} />
                )}
                {col.actions.includes("draft") && (
                  <MenuItem label="Volver a Borrador" icon={IconDraft} color={G.textSecondary} onClick={() => { setMenuOpen(false); onChangeStatus(quote, QUOTE_STATUSES.BORRADOR); }} G={G} />
                )}
                {col.actions.includes("delete") && (
                  <>
                    <div style={{ height: 1, background: G.border, margin: "4px 0" }} />
                    <MenuItem label="Eliminar" icon={IconDelete} color={G.coral} onClick={() => { setMenuOpen(false); onDelete(quote); }} G={G} />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Valor */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: G.accent }}>{fmtFull(totalWithIva)}</span>
        {quote.applyIva && (
          <span style={{ fontSize: 9, fontWeight: 700, background: G.purpleSoft, color: G.purple, padding: "1px 5px", borderRadius: 4 }}>IVA incl.</span>
        )}
        {quote.type && (
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: G.textTertiary, border: `1px solid ${G.border}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {quote.type}
          </span>
        )}
      </div>

      {/* Servicios */}
      {(quote.services || []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {quote.services.map((s, i) => (
            <span key={i} style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 5,
              background: G.accentSoft, color: G.accent, fontWeight: 600,
            }}>
              {s.name} · {fmtFull(s.value)}
            </span>
          ))}
        </div>
      )}

      {/* Fecha vencimiento */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 6, borderTop: `1px solid ${G.border}` }}>
        <span style={{ fontSize: 10, color: G.textTertiary, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd"/></svg>
          {quote.validUntil
            ? `Vence: ${new Date(quote.validUntil).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "2-digit" })}`
            : "Sin vencimiento"}
        </span>
        {isExpired && (
          <span style={{ fontSize: 9, fontWeight: 700, background: G.coralSoft, color: G.coral, padding: "1px 6px", borderRadius: 4 }}>
            Vencida
          </span>
        )}
      </div>
    </div>
  );
}

function MenuItem({ label, icon, color, bold, onClick, G }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", background: "none", border: "none",
        padding: "8px 14px", cursor: "pointer", fontSize: 13, fontFamily: FONT,
        color, fontWeight: bold ? 700 : 400, display: "flex", alignItems: "center", gap: 8,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(128,128,128,0.08)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      <span style={{ fontSize: 13 }}>{icon}</span> {label}
    </button>
  );
}

// ── Empty form ─────────────────────────────────────────────────────────────────
const today    = () => new Date().toISOString().split("T")[0];
const plus15   = () => new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];

const emptyForm = () => ({
  name: "", clientId: "",
  issueDate: today(), validUntil: plus15(),
  description: "", applyIva: false,
});

// ── Main view ─────────────────────────────────────────────────────────────────
export default function ViewCotizaciones({ darkMode = false }) {
  const G = darkMode ? DARK : LIGHT;

  const [quotes,   setQuotes]   = useState([]);
  const [clients,  setClients]  = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [selectedQuoteForPDF, setSelectedQuoteForPDF] = useState(null);

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState(emptyForm());
  const [services,    setServices]    = useState([]);   // [{id,name,value}]
  const [delConfirm,  setDelConfirm]  = useState({ open: false, quote: null });
  const [approving,   setApproving]   = useState(false);

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [qs, cls, prjs] = await Promise.all([
        quotesDB.getAll(), clientsDB.getAll(), projectsDB.getAll(),
      ]);
      setQuotes(qs); setClients(cls); setProjects(prjs);
    } catch (e) { setError(e.message || "Error al cargar"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Modal helpers ───────────────────────────────────────────────────────────
  function openNew() {
    setEditingId(null); setForm(emptyForm()); setServices([]);
    setModalOpen(true);
  }
  function openEdit(quote) {
    setEditingId(quote.id);
    setForm({
      name: quote.name, clientId: quote.clientId,
      issueDate:   quote.issueDate   ? quote.issueDate.split("T")[0]   : today(),
      validUntil:  quote.validUntil  ? quote.validUntil.split("T")[0]  : plus15(),
      description: quote.description || "",
      applyIva:    !!quote.applyIva,
    });
    setServices(quote.services || []);
    setModalOpen(true);
  }

  // ── Service toggle ──────────────────────────────────────────────────────────
  function toggleService(opt) {
    const exists = services.find(s => s.id === opt.id);
    if (exists) setServices(services.filter(s => s.id !== opt.id));
    else         setServices([...services, { id: opt.id, name: opt.name, value: 0 }]);
  }
  function updateServiceValue(id, val) {
    setServices(services.map(s => s.id === id ? { ...s, value: Number(val) || 0 } : s));
  }

  const totalBase = useMemo(() => services.reduce((s, x) => s + x.value, 0), [services]);
  const totalFinal = form.applyIva ? totalBase * 1.19 : totalBase;

  // ── Save quote ──────────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.clientId) return;
    if (services.length === 0) { alert("Selecciona al menos un servicio."); return; }
    setSaving(true);
    try {
      const primaryType = SERVICE_OPTIONS.find(o => o.id === services[0]?.id)?.type || "";
      const payload = {
        name: form.name, clientId: form.clientId,
        type: primaryType, value: totalBase,
        services, status: editingId
          ? (quotes.find(q => q.id === editingId)?.status || QUOTE_STATUSES.BORRADOR)
          : QUOTE_STATUSES.BORRADOR,
        issueDate: form.issueDate, validUntil: form.validUntil,
        description: form.description, applyIva: form.applyIva,
      };
      if (editingId) {
        const updated = await quotesDB.update({ id: editingId, ...payload });
        setQuotes(prev => prev.map(q => q.id === editingId ? updated : q));
      } else {
        const created = await quotesDB.create(payload);
        setQuotes(prev => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (e) { alert("Error al guardar: " + (e.message || e)); }
    finally { setSaving(false); }
  }

  // ── Change status ───────────────────────────────────────────────────────────
  async function handleChangeStatus(quote, newStatus) {
    try {
      const updated = await quotesDB.update({ ...quote, status: newStatus });
      setQuotes(prev => prev.map(q => q.id === updated.id ? updated : q));
    } catch (e) { alert("Error: " + (e.message || e)); }
  }

  // ── Approve → create project ────────────────────────────────────────────────
  async function handleApprove(quote) {
    if (!window.confirm(`¿Aprobar cotización "${quote.name}" y crear el proyecto automáticamente?`)) return;
    setApproving(true);
    try {
      const maxNum = projects.reduce((m, p) => (p.invoiceNumber || 0) > m ? p.invoiceNumber : m, 500);
      const created = await projectsDB.create({
        invoiceNumber: maxNum + 1,
        name: quote.name, type: quote.type,
        clientId: quote.clientId,
        valueWithoutTax: quote.value,
        services: quote.services?.length
          ? quote.services
          : [{ id: `s${Date.now()}`, name: "Servicio Base", value: quote.value }],
        status: "En Ejecución", responsibleIds: [],
        startDate: new Date().toISOString(),
        deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
        progress: 0, actaUrl: "", checklist: [],
      });
      setProjects(prev => [created, ...prev]);
      const updated = await quotesDB.update({ ...quote, status: QUOTE_STATUSES.ACEPTADA });
      setQuotes(prev => prev.map(q => q.id === updated.id ? updated : q));
      alert(`✅ Proyecto "#SYE${created.invoiceNumber} · ${created.name}" creado.`);
    } catch (e) { alert("Error al aprobar: " + (e.message || e)); }
    finally { setApproving(false); }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!delConfirm.quote) return;
    try {
      await quotesDB.delete(delConfirm.quote.id);
      setQuotes(prev => prev.filter(q => q.id !== delConfirm.quote.id));
      setDelConfirm({ open: false, quote: null });
    } catch (e) { alert("Error al eliminar: " + (e.message || e)); }
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const accepted = quotes.filter(q => q.status === QUOTE_STATUSES.ACEPTADA);
  const totalPipeline = quotes
    .filter(q => q.status === QUOTE_STATUSES.ENVIADA)
    .reduce((s, q) => s + (q.applyIva ? q.value * 1.19 : q.value), 0);

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: "100%", border: `1px solid ${G.border}`, borderRadius: 8,
    padding: "8px 11px", fontSize: 13, fontFamily: FONT,
    background: G.surface, color: G.textPrimary, outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: G.textSecondary, display: "block", marginBottom: 4, fontFamily: FONT };
  const btnPrimary = {
    padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
    background: G.accent, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: FONT,
    display: "flex", alignItems: "center", gap: 6,
  };
  const btnSecondary = {
    padding: "8px 16px", borderRadius: 9, border: `1px solid ${G.border}`, cursor: "pointer",
    background: "transparent", color: G.textSecondary, fontSize: 13, fontFamily: FONT,
  };

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: G.textTertiary, fontFamily: FONT, fontSize: 14 }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${G.accent}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", marginRight: 10 }} />
      Cargando cotizaciones...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (error) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: FONT }}>
      <span style={{ color: G.coral, fontSize: 14 }}>⚠ {error}</span>
      <button onClick={load} style={btnPrimary}>Reintentar</button>
    </div>
  );

  if (selectedQuoteForPDF) {
    return (
      <ViewQuoteGenerator
        quoteId={selectedQuoteForPDF.id}
        onBack={() => {
          setSelectedQuoteForPDF(null);
          load();
        }}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div style={{ fontFamily: FONT, color: G.textPrimary, display: "flex", flexDirection: "column", gap: 16, minWidth: 0, height: "100%" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: G.textPrimary, letterSpacing: "-0.03em" }}>Cotizaciones</h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: G.textTertiary }}>
            {quotes.length} total · Pipeline pendiente: <strong style={{ color: G.accent }}>{fmtFull(totalPipeline)}</strong>
          </p>
        </div>
        <button onClick={openNew} style={btnPrimary}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Cotización
        </button>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, flexShrink: 0 }}>
        {[
          { label: "Borradores",  value: quotes.filter(q => q.status === QUOTE_STATUSES.BORRADOR).length,  color: G.textSecondary, bg: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" },
          { label: "Enviadas",    value: quotes.filter(q => q.status === QUOTE_STATUSES.ENVIADA).length,   color: G.accent,  bg: G.accentSoft },
          { label: "Aceptadas",   value: accepted.length,                                                  color: G.green,   bg: G.greenSoft },
          { label: "Rechazadas",  value: quotes.filter(q => q.status === QUOTE_STATUSES.RECHAZADA).length, color: G.coral,   bg: G.coralSoft },
        ].map(k => (
          <div key={k.label} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: G.textTertiary, marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Kanban board ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", minHeight: 0 }}>
        <div style={{ display: "flex", gap: 14, height: "100%", minWidth: "fit-content", alignItems: "stretch" }}>

          {COLUMNS.map(col => {
            const colQuotes = quotes
              .filter(q => q.status === col.status)
              .sort((a, b) => (a.validUntil || "").localeCompare(b.validUntil || ""));

            return (
              <div key={col.status} style={{
                width: 280, flexShrink: 0, display: "flex", flexDirection: "column",
                background: darkMode ? col.bgDark : col.bg,
                border: `1px solid ${darkMode ? col.borderDark : col.border}`,
                borderRadius: 14, overflow: "hidden",
              }}>
                {/* Column header */}
                <div style={{
                  padding: "11px 14px",
                  background: darkMode ? col.headerDark : col.header,
                  borderBottom: `1px solid ${darkMode ? col.borderDark : col.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: col.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: G.textPrimary }}>{col.label}</span>
                  </div>
                  <div style={{
                    background: darkMode ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.8)",
                    color: col.countText, fontSize: 10, fontWeight: 700,
                    padding: "1px 7px", borderRadius: 5, minWidth: 20, textAlign: "center",
                  }}>{colQuotes.length}</div>
                </div>

                {/* Cards */}
                <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {colQuotes.map(q => (
                    <QuoteCard
                      key={q.id}
                      quote={q}
                      clients={clients}
                      G={G}
                      darkMode={darkMode}
                      onEdit={openEdit}
                      onChangeStatus={handleChangeStatus}
                      onApprove={handleApprove}
                      onDelete={q => setDelConfirm({ open: true, quote: q })}
                      onGeneratePDF={setSelectedQuoteForPDF}
                    />
                  ))}
                  {colQuotes.length === 0 && (
                    <div style={{ textAlign: "center", color: G.textTertiary, fontSize: 12, padding: "20px 0", fontStyle: "italic" }}>
                      {col.status === QUOTE_STATUSES.BORRADOR ? "Crea la primera cotización →" : "Sin cotizaciones"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Accepted — info column */}
          <div style={{
            width: 240, flexShrink: 0, display: "flex", flexDirection: "column",
            background: darkMode ? "rgba(74,222,128,0.07)" : "rgba(22,163,74,0.05)",
            border: `1px dashed ${darkMode ? "rgba(74,222,128,0.30)" : "rgba(22,163,74,0.35)"}`,
            borderRadius: 14, overflow: "hidden",
          }}>
            <div style={{
              padding: "11px 14px",
              background: darkMode ? "rgba(74,222,128,0.10)" : "rgba(22,163,74,0.09)",
              borderBottom: `1px dashed ${darkMode ? "rgba(74,222,128,0.25)" : "rgba(22,163,74,0.28)"}`,
              display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
            }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: G.green }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: G.green }}>Aceptada</span>
              <div style={{
                background: G.greenSoft, color: G.green,
                width: 20, height: 20, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginLeft: "auto",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 12px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center", opacity: 0.85 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", background: G.greenSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: G.green, transition: "transform 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1.0)"}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
                <p style={{ fontSize: 12, color: G.green, fontWeight: 600, margin: 0, maxWidth: 180, lineHeight: 1.5 }}>
                  Al seleccionar "Aprobada" en el menú de una cotización enviada, esta se convierte automáticamente en un Proyecto Activo.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modal Crear / Editar ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.58)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{
            background: G.surface, border: `1px solid ${G.borderHigh}`, borderRadius: 16,
            width: "100%", maxWidth: 540, maxHeight: "90vh",
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: G.textPrimary, fontFamily: FONT }}>
                {editingId ? "Editar Cotización" : "Nueva Cotización"}
              </span>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: G.textTertiary, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            {/* Form — scrollable */}
            <form onSubmit={handleSave} style={{ overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

              {/* Título */}
              <div>
                <label style={labelStyle}>Título de la Cotización *</label>
                <input required type="text" placeholder="Ej: Cálculo Estructural Casa Pérez" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
              </div>

              {/* Cliente + Válida hasta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Cliente *</label>
                  <select required value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} style={inputStyle}>
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Válida Hasta</label>
                  <input type="date" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              {/* Servicios */}
              <div>
                <label style={labelStyle}>Servicios a Cotizar</label>
                <div style={{ border: `1px solid ${G.border}`, borderRadius: 10, overflow: "hidden" }}>
                  {SERVICE_OPTIONS.map(opt => {
                    const sel = services.find(s => s.id === opt.id);
                    return (
                      <div key={opt.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 12px",
                        background: sel ? G.accentSoft : "transparent",
                        borderBottom: `1px solid ${G.border}`,
                        transition: "background 0.15s",
                      }}>
                        <input
                          type="checkbox" id={`svc-${opt.id}`}
                          checked={!!sel}
                          onChange={() => toggleService(opt)}
                          style={{ width: 15, height: 15, cursor: "pointer", accentColor: G.accent }}
                        />
                        <label htmlFor={`svc-${opt.id}`} style={{ flex: 1, fontSize: 13, color: G.textPrimary, cursor: "pointer", fontFamily: FONT }}>{opt.name}</label>
                        {sel && (
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: G.textTertiary }}>$</span>
                            <input
                              type="number" min="0" placeholder="0"
                              value={sel.value || ""}
                              onChange={e => updateServiceValue(opt.id, e.target.value)}
                              style={{ ...inputStyle, width: 130, paddingLeft: 20, textAlign: "right", fontSize: 12 }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total + IVA */}
                {services.length > 0 && (
                  <div style={{ marginTop: 10, padding: "10px 14px", background: G.accentSoft, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, fontFamily: FONT, color: G.textPrimary }}>
                      <input
                        type="checkbox" checked={form.applyIva}
                        onChange={e => setForm(p => ({ ...p, applyIva: e.target.checked }))}
                        style={{ width: 14, height: 14, accentColor: G.purple }}
                      />
                      <span>Incluir IVA <strong>(19%)</strong></span>
                    </label>
                    <div style={{ textAlign: "right" }}>
                      {form.applyIva ? (
                        <>
                          <div style={{ fontSize: 11, color: G.textTertiary }}>Subtotal: {fmtFull(totalBase)} · IVA: {fmtFull(totalBase * 0.19)}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: G.accent }}>Total: {fmtFull(totalFinal)}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 15, fontWeight: 700, color: G.accent }}>Subtotal: {fmtFull(totalBase)}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label style={labelStyle}>Descripción Breve</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Notas o alcance del servicio..."
                  style={{ ...inputStyle, resize: "vertical", minHeight: 64, lineHeight: 1.5 }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 6, borderTop: `1px solid ${G.border}`, marginTop: 2, flexShrink: 0 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={btnSecondary} disabled={saving}>Cancelar</button>
                <button type="submit" style={btnPrimary} disabled={saving}>
                  {saving && <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />}
                  {editingId ? "Guardar Cambios" : "Crear Borrador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminación ───────────────────────────────────── */}
      {delConfirm.open && delConfirm.quote && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: G.surface, border: `1px solid ${G.borderHigh}`, borderRadius: 16, width: "100%", maxWidth: 380, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: G.coralSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G.coral} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: G.textPrimary, fontFamily: FONT }}>Eliminar Cotización</div>
                <div style={{ fontSize: 12, color: G.textSecondary, marginTop: 2 }}>Esta acción no se puede deshacer.</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: G.textSecondary, fontFamily: FONT, margin: "0 0 20px" }}>
              ¿Eliminar <strong style={{ color: G.textPrimary }}>{delConfirm.quote.name}</strong>?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDelConfirm({ open: false, quote: null })} style={btnSecondary}>Cancelar</button>
              <button onClick={handleDelete} style={{ ...btnPrimary, background: G.coral }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
