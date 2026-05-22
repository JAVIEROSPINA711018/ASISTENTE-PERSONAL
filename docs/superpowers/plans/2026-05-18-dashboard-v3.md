# Dashboard v3 — Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Inicio" view with a Command Center dashboard (KPI cards + task/expense/activity grid) and add a persistent floating AI button.

**Architecture:** Create `ViewDashboard.jsx` as the new Inicio view — it reads the shared `items` array and renders 4 KPI cards, an alert banner for urgent tasks, and a 3-column grid. Two surgical edits to `App.jsx` swap the import and the render site. The existing drawer (`ia_chat` type) handles the chat panel; a fixed floating button exposes it from every view.

**Tech Stack:** React 18, Vite 5, JavaScript, inline styles, Apple G palette from App.jsx

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Create** | `src/views/ViewDashboard.jsx` | Alert banner · 4 KPI cards · 3-col grid (tareas, resumen, gastos chart) |
| **Modify** | `src/App.jsx` lines 2-3 | Swap ViewInicio+WidgetsRow imports → ViewDashboard |
| **Modify** | `src/App.jsx` lines 3535-3537 | Render ViewDashboard instead of ViewInicio |
| **Modify** | `src/App.jsx` lines 3568-3569 | Replace WidgetsRow block with floating AI button |

---

## Task 1 — Create `src/views/ViewDashboard.jsx`

**Files:**
- Create: `src/views/ViewDashboard.jsx`

- [ ] **Step 1: Create the file with full implementation**

```jsx
import { useMemo } from "react";

const G = {
  bg: "#f5f5f7",
  accent: "#0071e3",
  accentSoft: "rgba(0, 113, 227, 0.06)",
  amber: "#ff9500",
  amberSoft: "rgba(255, 149, 0, 0.06)",
  coral: "#ff3b30",
  coralSoft: "rgba(255, 59, 48, 0.06)",
  green: "#34c759",
  greenSoft: "rgba(52, 199, 89, 0.06)",
  textPrimary: "#1d1d1f",
  textSecondary: "#515154",
  textTertiary: "#86868b",
};

const cardStyle = {
  background: "white",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

export default function ViewDashboard({ items, onNavigate, onOpenDrawer }) {
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);
  const hoyStr = useMemo(() => new Date().toDateString(), []);
  const mesActual = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // ── KPI data ──────────────────────────────────────────────────────────────
  const tareasPendientes = useMemo(
    () => items.filter(i => (i.tipo === "tarea" || i.tipo === "recordatorio") && !i.hecho),
    [items]
  );
  const tareasVencidas = useMemo(
    () => tareasPendientes.filter(i => i.fecha && new Date(i.fecha) < today),
    [tareasPendientes, today]
  );
  const tareasPorHoy = useMemo(
    () => tareasPendientes.filter(i => i.fecha && new Date(i.fecha).toDateString() === hoyStr),
    [tareasPendientes, hoyStr]
  );
  const tareasSemana = useMemo(
    () => tareasPendientes.filter(i => {
      if (!i.fecha) return false;
      const f = new Date(i.fecha);
      return f > today && f.toDateString() !== hoyStr;
    }),
    [tareasPendientes, today, hoyStr]
  );
  const gastosMes = useMemo(
    () => items.filter(i => i.tipo === "gasto" && i.creado?.startsWith(mesActual)),
    [items, mesActual]
  );
  const totalGastos = useMemo(
    () => gastosMes.reduce((s, i) => s + (i.datos?.monto || 0), 0),
    [gastosMes]
  );
  const notas = useMemo(() => items.filter(i => i.tipo === "nota"), [items]);
  const capturadoHoy = useMemo(
    () => items.filter(i => i.creado && new Date(i.creado).toDateString() === hoyStr),
    [items, hoyStr]
  );

  // ── Active tasks sorted by urgency ───────────────────────────────────────
  const tareasActivas = useMemo(
    () => [...tareasPendientes]
      .sort((a, b) => {
        const af = a.fecha ? new Date(a.fecha).getTime() : Infinity;
        const bf = b.fecha ? new Date(b.fecha).getTime() : Infinity;
        return af - bf;
      })
      .slice(0, 5),
    [tareasPendientes]
  );

  // ── Gastos por categoría ──────────────────────────────────────────────────
  const gastosCats = useMemo(() => {
    const cats = {};
    gastosMes.forEach(g => {
      const cat = g.datos?.categoria || "Otro";
      cats[cat] = (cats[cat] || 0) + (g.datos?.monto || 0);
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [gastosMes]);
  const maxGasto = useMemo(
    () => Math.max(...gastosCats.map(c => c[1]), 1),
    [gastosCats]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  function tareaColor(t) {
    if (!t.fecha) return G.green;
    const f = new Date(t.fecha);
    if (f < today) return G.coral;
    if (f.toDateString() === hoyStr) return G.amber;
    return G.accent;
  }
  function tareaLabel(t) {
    if (!t.fecha) return "Sin fecha";
    const f = new Date(t.fecha);
    if (f < today) return "Vencida";
    if (f.toDateString() === hoyStr) return "Hoy";
    return "Próxima";
  }
  function fmtPesos(n) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
  }

  const showAlert = tareasVencidas.length > 0 || tareasPorHoy.length > 0;

  const kpis = [
    {
      label: "Tareas pendientes",
      value: tareasPendientes.length,
      sub: "para hoy y esta semana",
      iconBg: G.amberSoft,
      icon: "✓",
      tag: tareasVencidas.length > 0
        ? `⚠ ${tareasVencidas.length} vencida${tareasVencidas.length > 1 ? "s" : ""}`
        : "Al día",
      tagColor: tareasVencidas.length > 0 ? G.coral : G.green,
      tagBg: tareasVencidas.length > 0 ? G.coralSoft : G.greenSoft,
      onClick: () => onNavigate("tareas"),
    },
    {
      label: "Gastos del mes",
      value: fmtPesos(totalGastos),
      sub: `COP · ${new Date().toLocaleString("es-CO", { month: "long" })} ${new Date().getFullYear()}`,
      iconBg: G.greenSoft,
      icon: "$",
      tag: `${gastosMes.length} registro${gastosMes.length !== 1 ? "s" : ""}`,
      tagColor: G.green,
      tagBg: G.greenSoft,
      onClick: () => onNavigate("finanzas"),
    },
    {
      label: "Notas guardadas",
      value: notas.length,
      sub: "reflexiones y apuntes",
      iconBg: G.accentSoft,
      icon: "✏",
      tag: notas.length > 0 ? "última: hoy" : "Sin notas",
      tagColor: G.accent,
      tagBg: G.accentSoft,
      onClick: () => onNavigate("notas"),
    },
    {
      label: "Capturado hoy",
      value: capturadoHoy.length,
      sub: "ítems vía asistente IA",
      iconBg: "rgba(94,92,230,0.06)",
      icon: "🧠",
      tag: "IA activa",
      tagColor: "#5e5ce6",
      tagBg: "rgba(94,92,230,0.06)",
      onClick: () => onOpenDrawer({ type: "ia_chat" }),
    },
  ];

  const BAR_COLORS = [G.accent, "#5e5ce6", G.green, G.amber, G.coral];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Alert Banner — solo si hay urgentes */}
      {showAlert && (
        <div style={{
          background: "linear-gradient(135deg, #ff3b30, #ff9500)",
          borderRadius: 14, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12,
          animation: "fadeIn 0.4s ease",
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
              {tareasVencidas.length > 0
                ? `${tareasVencidas.length} tarea${tareasVencidas.length > 1 ? "s" : ""} vencida${tareasVencidas.length > 1 ? "s" : ""}`
                : `${tareasPorHoy.length} tarea${tareasPorHoy.length > 1 ? "s" : ""} para hoy`}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
              Requieren acción inmediata.
            </div>
          </div>
          <button
            onClick={() => onNavigate("tareas")}
            style={{
              background: "rgba(255,255,255,0.2)", color: "white",
              padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: "none", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Ver tareas →
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {kpis.map((kpi, i) => (
          <div
            key={i}
            onClick={kpi.onClick}
            style={{ ...cardStyle, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {kpi.label}
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: kpi.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {kpi.icon}
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.03em" }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: G.textTertiary }}>{kpi.sub}</div>
            <span style={{
              display: "inline-flex", alignItems: "center",
              fontSize: 10, fontWeight: 600, padding: "2px 8px",
              borderRadius: 10, marginTop: 4,
              background: kpi.tagBg, color: kpi.tagColor,
            }}>
              {kpi.tag}
            </span>
          </div>
        ))}
      </div>

      {/* Main 3-column Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

        {/* Tareas Activas */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: G.textPrimary }}>📋 Tareas Activas</span>
            <button onClick={() => onNavigate("tareas")} style={{ fontSize: 11, color: G.accent, fontWeight: 500, cursor: "pointer", border: "none", background: "none" }}>
              Ver todo →
            </button>
          </div>
          {tareasActivas.length === 0 ? (
            <div style={{ fontSize: 12, color: G.textTertiary, textAlign: "center", padding: "20px 0" }}>
              Sin tareas pendientes 🎉
            </div>
          ) : tareasActivas.map((t, i) => {
            const color = tareaColor(t);
            return (
              <div
                key={t.id || i}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0",
                  borderBottom: i < tareasActivas.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: G.textPrimary, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.respuesta || t.texto || "Sin título"}
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10, flexShrink: 0, background: `${color}18`, color }}>
                  {tareaLabel(t)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Resumen de actividad */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: G.textPrimary }}>≡ Resumen</span>
            <button onClick={() => onNavigate("tareas")} style={{ fontSize: 11, color: G.accent, fontWeight: 500, cursor: "pointer", border: "none", background: "none" }}>
              Tablero →
            </button>
          </div>
          {[
            { label: "Vencidas", sub: "Requieren acción inmediata", count: tareasVencidas.length, color: G.coral, bg: G.coralSoft, icon: "⚠️" },
            { label: "Para Hoy", sub: "Deadline hoy", count: tareasPorHoy.length, color: G.amber, bg: G.amberSoft, icon: "🕐" },
            { label: "Próximas", sub: "Esta semana", count: tareasSemana.length, color: G.accent, bg: G.accentSoft, icon: "📅" },
          ].map((row, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: 10, marginBottom: 6, background: row.bg,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${row.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  {row.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: G.textPrimary }}>{row.label}</div>
                  <div style={{ fontSize: 10, color: G.textTertiary }}>{row.sub}</div>
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: row.color }}>{row.count}</div>
            </div>
          ))}
        </div>

        {/* Gastos por categoría */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: G.textPrimary }}>💰 Gastos</span>
            <button onClick={() => onNavigate("finanzas")} style={{ fontSize: 11, color: G.accent, fontWeight: 500, cursor: "pointer", border: "none", background: "none" }}>
              Ver finanzas →
            </button>
          </div>
          {gastosCats.length === 0 ? (
            <div style={{ fontSize: 12, color: G.textTertiary, textAlign: "center", padding: "20px 0" }}>
              Sin gastos este mes
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80, marginBottom: 8 }}>
                {gastosCats.map(([cat, amt], i) => {
                  const h = Math.max(8, Math.round((amt / maxGasto) * 72));
                  return (
                    <div key={cat} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", height: h, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: "4px 4px 0 0" }} />
                      <div style={{ fontSize: 9, color: G.textTertiary, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                        {cat.slice(0, 6)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: G.textTertiary }}>Total mes</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: G.textPrimary }}>{fmtPesos(totalGastos)} COP</span>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file was created**

Run: `ls src/views/ViewDashboard.jsx`
Expected: file listed (no error)

- [ ] **Step 3: Verify build still passes (no import errors yet)**

Run: `npm run build 2>&1 | tail -5`
Expected: build may warn about unused imports — that's fine. No parse errors.

- [ ] **Step 4: Commit**

```bash
git add src/views/ViewDashboard.jsx
git commit -m "feat: add ViewDashboard command center with KPI cards and activity grid"
```

---

## Task 2 — Edit `src/App.jsx` — 3 surgical changes

**Files:**
- Modify: `src/App.jsx:2-3` (swap imports)
- Modify: `src/App.jsx:3535-3537` (render ViewDashboard instead of ViewInicio)
- Modify: `src/App.jsx:3568-3569` (replace WidgetsRow with floating AI button)

- [ ] **Step 1: Swap the import lines (lines 2-3)**

Find this exact text at the top of the file:
```js
import ViewInicio from "./views/ViewInicio.jsx";
import WidgetsRow from "./components/WidgetsRow.jsx";
```

Replace with:
```js
import ViewDashboard from "./views/ViewDashboard.jsx";
```

- [ ] **Step 2: Replace the ViewInicio render block (lines ~3535-3537)**

Find this exact block:
```jsx
            {vista === "inicio" && (
              <ViewInicio messages={messages} isLoading={isLoading} />
            )}
```

Replace with:
```jsx
            {vista === "inicio" && (
              <ViewDashboard items={items} onNavigate={setVista} onOpenDrawer={handleOpenDrawer} />
            )}
```

- [ ] **Step 3: Replace WidgetsRow block with floating AI button (lines ~3568-3569)**

Find this exact block:
```jsx
          {/* Widgets — solo visibles en Inicio */}
          {vista === "inicio" && <WidgetsRow items={items} />}
```

Replace with:
```jsx
          {/* Floating AI Button — siempre visible */}
          <button
            onClick={() => handleOpenDrawer({ type: "ia_chat" })}
            style={{
              position: "fixed", bottom: 88, right: 24,
              width: 52, height: 52, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #a78bfa, #0071e3 55%, #5e5ce6)",
              boxShadow: "0 4px 20px rgba(0,113,227,0.4), 0 0 0 4px rgba(0,113,227,0.1)",
              border: "none", cursor: "pointer", zIndex: 50,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              animation: "glowPulse 3s ease-in-out infinite",
            }}
            title="Abrir Asistente IA"
          >
            🤖
          </button>
```

- [ ] **Step 4: Run build and verify clean**

Run: `npm run build 2>&1 | tail -10`
Expected output ending with something like:
```
✓ built in Xs
```
No errors. If there are errors, check the three edits for typos.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire ViewDashboard as Inicio view and add floating AI orb button"
```
