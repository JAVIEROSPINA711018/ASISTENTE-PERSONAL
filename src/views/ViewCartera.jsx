import { useState, useEffect, useCallback } from "react";
import { projectsDB, clientsDB, financialsDB } from "../lib/supabaseCRM.js";

const FONT = "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif";

import { LIGHT, DARK } from "../lib/theme.js";

function fmtCOP(n) {
  if (!n && n !== 0) return "$0";
  return "$" + Math.round(n).toLocaleString("es-CO");
}
function fmt(n) {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────
function DonutChart({ cobrado, pendiente, size = 160, stroke = 28, colorA = "#16a34a", colorB = "#2563eb" }) {
  const r    = (size - stroke) / 2;
  const cx   = size / 2;
  const cy   = size / 2;
  const circ = 2 * Math.PI * r;
  const total = (cobrado + pendiente) || 1;
  const d1 = (cobrado / total) * circ;
  const d2 = (pendiente / total) * circ;
  const pct = Math.round((cobrado / total) * 100);

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      {cobrado > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={colorA} strokeWidth={stroke}
          strokeDasharray={`${d1} ${circ - d1}`} strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round"
        />
      )}
      {pendiente > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={colorB} strokeWidth={stroke}
          strokeDasharray={`${d2} ${circ - d2}`} strokeDashoffset={-d1}
          transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round"
        />
      )}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">{pct}%</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fill="#94a3b8">cobrado</text>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ViewCartera({ darkMode = false }) {
  const G = darkMode ? DARK : LIGHT;

  const [projects,   setProjects]   = useState([]);
  const [clients,    setClients]    = useState([]);
  const [financials, setFinancials] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [hideZero,   setHideZero]   = useState(true);
  const [expanded,   setExpanded]   = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [prjs, cls, fins] = await Promise.all([
        projectsDB.getAll(), clientsDB.getAll(), financialsDB.getAll(),
      ]);
      setProjects(prjs); setClients(cls); setFinancials(fins);
    } catch (e) {
      setError(e.message || "Error al cargar cartera");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Compute per-project saldo ──────────────────────────────────────────────
  const saldoByProject = {};
  const cobradoByProject = {};
  projects.forEach(p => {
    const cobros = financials.filter(
      f => f.projectId === p.id && f.type === "Cobro / Factura" && f.status === "Pagado"
    );
    const cobrado = cobros.reduce((s, f) => s + f.amount, 0);
    cobradoByProject[p.id] = cobrado;
    saldoByProject[p.id]   = Math.max(0, (p.valueWithoutTax || 0) - cobrado);
  });

  // ── Compute per-client totals ──────────────────────────────────────────────
  const clientRows = clients.map(c => {
    const myProjects = projects.filter(p => p.clientId === c.id && p.status !== "Cancelado");
    const contratado = myProjects.reduce((s, p) => s + (p.valueWithoutTax || 0), 0);
    const cobrado    = myProjects.reduce((s, p) => s + (cobradoByProject[p.id] || 0), 0);
    const saldo      = myProjects.reduce((s, p) => s + (saldoByProject[p.id]   || 0), 0);
    return { ...c, myProjects, contratado, cobrado, saldo };
  }).sort((a, b) => b.saldo - a.saldo);

  // ── Global totals ──────────────────────────────────────────────────────────
  const activeProjects = projects.filter(p => p.status !== "Cancelado");
  const totalContratado = activeProjects.reduce((s, p) => s + (p.valueWithoutTax || 0), 0);
  const totalCobrado    = activeProjects.reduce((s, p) => s + (cobradoByProject[p.id] || 0), 0);
  const totalPorCobrar  = activeProjects.reduce((s, p) => s + (saldoByProject[p.id]   || 0), 0);
  const saludPct        = totalContratado > 0 ? Math.round((totalCobrado / totalContratado) * 100) : 0;

  // Vencidos: projects past deadline with saldo > 0
  const today = new Date();
  const vencidos = activeProjects.filter(p =>
    p.deadline && new Date(p.deadline) < today && (saldoByProject[p.id] || 0) > 0
  );
  const totalVencido = vencidos.reduce((s, p) => s + (saldoByProject[p.id] || 0), 0);

  // Proyección: próximo mes / trimestre (projects with saldo whose deadline falls in range)
  const proxMes     = new Date(today); proxMes.setDate(proxMes.getDate() + 30);
  const proxTrimestre = new Date(today); proxTrimestre.setDate(proxTrimestre.getDate() + 90);
  const proyeccionMes = activeProjects
    .filter(p => p.deadline && new Date(p.deadline) >= today && new Date(p.deadline) <= proxMes && (saldoByProject[p.id] || 0) > 0)
    .reduce((s, p) => s + (saldoByProject[p.id] || 0), 0);
  const proyeccionTrim = activeProjects
    .filter(p => p.deadline && new Date(p.deadline) >= today && new Date(p.deadline) <= proxTrimestre && (saldoByProject[p.id] || 0) > 0)
    .reduce((s, p) => s + (saldoByProject[p.id] || 0), 0);

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const filteredRows = clientRows.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchZero   = hideZero ? c.saldo > 0 : true;
    return matchSearch && matchZero;
  });

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card = {
    background: G.surface, border: `1px solid ${G.border}`,
    borderRadius: 12, padding: "18px 20px",
  };

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: G.textTertiary, fontFamily: FONT, fontSize: 14 }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${G.accent}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", marginRight: 10 }} />
      Cargando cartera...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (error) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: FONT }}>
      <span style={{ color: G.coral, fontSize: 14 }}>⚠ {error}</span>
      <button onClick={load} style={{ padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: G.accent, color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: FONT }}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ fontFamily: FONT, color: G.textPrimary, display: "flex", flexDirection: "column", gap: 16, height: "100%", minWidth: 0 }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: G.textPrimary, letterSpacing: "-0.03em" }}>Cartera y Cobranzas</h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: G.textTertiary }}>Gestión de saldos pendientes por cliente</p>
        </div>
        <button
          onClick={() => {
            const rows = [["Cliente","Proyectos","Cobrado","Saldo Pendiente"]];
            filteredRows.forEach(c => rows.push([c.name, c.myProjects.length, c.cobrado, c.saldo]));
            const csv = rows.map(r => r.join(",")).join("\n");
            const a = document.createElement("a");
            a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
            a.download = "cartera.csv"; a.click();
          }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: `1px solid ${G.border}`, background: G.surface, color: G.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar Informe
        </button>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, flexShrink: 0 }}>

        {/* Total por Cobrar */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 11, color: G.textTertiary }}>Total por Cobrar (Cartera)</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: G.textPrimary, marginTop: 10, letterSpacing: "-0.03em" }}>
            {fmtCOP(totalPorCobrar)}
          </div>
        </div>

        {/* Facturado Vencido */}
        <div style={{ ...card, border: totalVencido > 0 ? `1px solid rgba(220,38,38,0.30)` : `1px solid ${G.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 11, color: G.textTertiary }}>Facturado Vencido</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: totalVencido > 0 ? G.coralSoft : (darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)"), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={totalVencido > 0 ? G.coral : G.textTertiary} strokeWidth="1.8" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: totalVencido > 0 ? G.coral : G.textPrimary, marginTop: 10, letterSpacing: "-0.03em" }}>
            {fmtCOP(totalVencido)}
          </div>
          {totalVencido > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={G.coral} strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <span style={{ fontSize: 10, color: G.coral }}>Requiere gestión inmediata</span>
            </div>
          )}
        </div>

        {/* Salud de Cartera */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 11, color: G.textTertiary }}>Salud de Cartera</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 10, background: darkMode ? "rgba(255,255,255,0.08)" : "#e2e8f0", borderRadius: 5, overflow: "hidden" }}>
              <div style={{ width: `${saludPct}%`, height: "100%", background: "#16a34a", borderRadius: 5, transition: "width 0.4s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: G.green, fontWeight: 600 }}>{saludPct}% Cobrado</span>
              <span style={{ fontSize: 11, color: G.textTertiary }}>{fmtCOP(totalContratado)} Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content row ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", gap: 14, minHeight: 0, overflow: "hidden" }}>

        {/* ── Left: table ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minHeight: 0, overflow: "hidden" }}>

          {/* Search + filter bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text" placeholder="Filtrar por cliente..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${G.border}`, borderRadius: 10, padding: "9px 12px 9px 34px", fontSize: 12, fontFamily: FONT, background: G.surface, color: G.textPrimary, outline: "none" }}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: G.textSecondary, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
              <input type="checkbox" checked={hideZero} onChange={e => setHideZero(e.target.checked)} style={{ accentColor: G.accent, width: 14, height: 14 }} />
              Ocultar saldo cero
            </label>
            <div style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${G.border}`, background: G.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="2" strokeLinecap="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: "auto", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, overflowX: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderBottom: `1px solid ${G.border}` }}>
                  {["CLIENTE / RAZÓN SOCIAL", "PROYECTOS", "COBRADO", "SALDO PENDIENTE", "ACCIÓN"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: i === 0 ? "left" : "center", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: G.textTertiary, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(c => (
                  <>
                    <tr key={c.id}
                      style={{ borderBottom: `1px solid ${G.border}`, cursor: "pointer", transition: "background 0.12s" }}
                      className="cartera-row"
                      onClick={() => setExpanded(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                    >
                      {/* Cliente */}
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="2" strokeLinecap="round"
                            style={{ transform: expanded[c.id] ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                          <span style={{ fontWeight: 700, fontSize: 12, color: G.textPrimary, letterSpacing: "0.01em" }}>{c.name.toUpperCase()}</span>
                        </div>
                      </td>
                      {/* Proyectos count */}
                      <td style={{ padding: "13px 16px", textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, background: G.accentSoft, color: G.accent, fontWeight: 700, fontSize: 11 }}>
                          {c.myProjects.length}
                        </span>
                      </td>
                      {/* Cobrado */}
                      <td style={{ padding: "13px 16px", textAlign: "center", fontSize: 12, color: G.textSecondary }}>
                        {fmtCOP(c.cobrado)}
                      </td>
                      {/* Saldo */}
                      <td style={{ padding: "13px 16px", textAlign: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: c.saldo > 0 ? G.accent : G.green }}>
                          {fmtCOP(c.saldo)}
                        </span>
                      </td>
                      {/* Acción */}
                      <td style={{ padding: "13px 16px", textAlign: "center" }}>
                        <button
                          onClick={e => { e.stopPropagation(); window.open(`mailto:${c.contactEmail}?subject=Saldo pendiente - ${c.name}&body=Estimado/a ${c.name},%0D%0A%0D%0ALe recordamos que tiene un saldo pendiente de ${fmtCOP(c.saldo)}%0D%0A%0D%0AQuedamos atentos.`, "_blank"); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: G.textTertiary, padding: 4 }}
                          title="Enviar recordatorio"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>

                    {/* Expanded rows: projects */}
                    {expanded[c.id] && c.myProjects.map(p => (
                      <tr key={p.id} style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)", borderBottom: `1px solid ${G.border}` }}>
                        <td style={{ padding: "9px 16px 9px 44px", fontSize: 11 }}>
                          <div style={{ color: G.textSecondary }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: G.textTertiary, marginTop: 2 }}>#SYE{p.invoiceNumber} · {p.status}</div>
                        </td>
                        <td style={{ padding: "9px 16px", textAlign: "center" }}>
                          <span style={{ fontSize: 10, color: G.textTertiary }}>—</span>
                        </td>
                        <td style={{ padding: "9px 16px", textAlign: "center", fontSize: 11, color: G.textTertiary }}>
                          {fmtCOP(cobradoByProject[p.id] || 0)}
                        </td>
                        <td style={{ padding: "9px 16px", textAlign: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: (saldoByProject[p.id] || 0) > 0 ? G.accent : G.green }}>
                            {fmtCOP(saldoByProject[p.id] || 0)}
                          </span>
                        </td>
                        <td />
                      </tr>
                    ))}
                  </>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: G.textTertiary, fontStyle: "italic", fontSize: 12 }}>
                      No hay clientes con saldo pendiente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right panel ───────────────────────────────────────────────────── */}
        <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>

          {/* Distribución */}
          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 010 20"/><path d="M12 12l6.5 3.5"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: G.textPrimary }}>Distribución</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <DonutChart cobrado={totalCobrado} pendiente={totalPorCobrar} size={160} stroke={30} colorA="#16a34a" colorB="#2563eb" />
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a" }} />
                <span style={{ fontSize: 11, color: G.textSecondary }}>Cobrado</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563eb" }} />
                <span style={{ fontSize: 11, color: G.textSecondary }}>Por Cobrar</span>
              </div>
            </div>
          </div>

          {/* Proyección */}
          <div style={{ background: "#0f172a", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Proyección</span>
            </div>
            <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 16px" }}>
              Basado en los contratos actuales y fechas de entrega.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Próximo Mes</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>+{fmt(proyeccionMes)}</span>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Trimestre</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>+{fmt(proyeccionTrim)}</span>
            </div>
          </div>

          {/* Top deudores */}
          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: G.textPrimary, marginBottom: 12 }}>Top Deudores</div>
            {filteredRows.slice(0, 4).map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: ["#2563eb","#d97706","#7c3aed","#16a34a"][i % 4], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 11, color: G.textSecondary, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: G.accent }}>{fmt(c.saldo)}</span>
              </div>
            ))}
            {filteredRows.length === 0 && (
              <div style={{ fontSize: 11, color: G.textTertiary, fontStyle: "italic" }}>Sin saldos pendientes.</div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        .cartera-row:hover { background: ${darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"} !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
