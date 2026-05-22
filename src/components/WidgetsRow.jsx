// src/components/WidgetsRow.jsx
const G = {
  textPrimary: "#1d1d1f",
  textTertiary: "#86868b",
  border: "rgba(0, 0, 0, 0.08)",
  green: "#34c759",
  amber: "#ff9500",
  accent: "#0071e3",
  accentSoft: "rgba(0, 113, 227, 0.06)",
  greenSoft: "rgba(52, 199, 89, 0.06)",
  amberSoft: "rgba(255, 149, 0, 0.06)",
};

export default function WidgetsRow({ items }) {
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const tareasPendientes = items.filter(
    (i) => (i.tipo === "tarea" || i.tipo === "recordatorio") && !i.hecho
  ).length;

  const tareasUrgentes = items.filter(
    (i) => (i.tipo === "tarea" || i.tipo === "recordatorio") && !i.hecho && i.columna === "hoy"
  ).length;

  const gastosMes = items
    .filter((i) => i.tipo === "gasto" && (i.creado || "").startsWith(mesActual))
    .reduce((sum, i) => sum + (Number(i.datos?.monto) || 0), 0);

  const ultimaNota = items
    .filter((i) => i.tipo === "nota")
    .sort((a, b) => new Date(b.creado) - new Date(a.creado))[0];

  const w = {
    background: "white",
    borderRadius: 12,
    padding: "12px 14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  };
  const lbl = {
    fontSize: 10,
    fontWeight: 600,
    color: G.textTertiary,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };
  const val = { fontSize: 22, fontWeight: 700, color: G.textPrimary };
  const sub = { fontSize: 11, color: G.textTertiary };
  const tag = (bg, color) => ({
    display: "inline-block",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 10,
    marginTop: 4,
    background: bg,
    color,
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 10,
        padding: "10px 20px 14px",
        borderTop: `1px solid ${G.border}`,
        background: "rgba(245,245,247,0.9)",
        flexShrink: 0,
      }}
    >
      {/* Widget Tareas */}
      <div style={w}>
        <div style={lbl}>Tareas pendientes</div>
        <div style={val}>{tareasPendientes}</div>
        <div style={sub}>pendientes en total</div>
        {tareasUrgentes > 0 && (
          <span style={tag(G.amberSoft, G.amber)}>{tareasUrgentes} urgente{tareasUrgentes > 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Widget Gastos */}
      <div style={w}>
        <div style={lbl}>Gastos del mes</div>
        <div style={val}>${gastosMes.toLocaleString("es-CO")}</div>
        <div style={sub}>COP acumulado</div>
        {gastosMes > 0 && (
          <span style={tag(G.greenSoft, G.green)}>registrado</span>
        )}
      </div>

      {/* Widget Nota */}
      <div style={w}>
        <div style={lbl}>Última nota</div>
        {ultimaNota ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: G.textPrimary,
              lineHeight: 1.4,
              marginTop: 2,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {ultimaNota.texto}
          </div>
        ) : (
          <div style={sub}>Sin notas aún</div>
        )}
      </div>
    </div>
  );
}
