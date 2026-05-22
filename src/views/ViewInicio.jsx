// src/views/ViewInicio.jsx
import { useEffect, useRef } from "react";

// CRM Design System fallback tokens for ViewInicio
const G = {
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textTertiary: "#94a3b8",
  accent: "#2563eb",
  accentSoft: "rgba(37, 99, 235, 0.06)",
  border: "#e2e8f0",
};

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function OrbIA({ state = "idle" }) {
  const anim =
    state === "thinking"
      ? "glowPulseThinking 1.5s ease-in-out infinite"
      : state === "listening"
      ? "glowPulseListening 1s ease-in-out infinite"
      : "glowPulse 3s ease-in-out infinite";
  return (
    <div
      style={{
        width: 28,
        height: 28,
        minWidth: 28,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #a78bfa 0%, #0071e3 55%, #5e5ce6 100%)",
        boxShadow: "0 2px 8px rgba(0,113,227,0.25)",
        animation: anim,
        flexShrink: 0,
      }}
    />
  );
}

export default function ViewInicio({ messages, isLoading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const ahora = new Date();
  const fechaStr = `${dias[ahora.getDay()]}, ${ahora.getDate()} de ${meses[ahora.getMonth()]}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", animation: "fadeIn 0.3s ease" }}>
      {/* Saludo */}
      <div style={{ padding: "16px 20px 8px", flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: G.textPrimary, letterSpacing: "-0.02em" }}>
          {saludo}, Javier ☀️
        </div>
        <div style={{ fontSize: 12, color: G.textTertiary, marginTop: 2 }}>{fechaStr}</div>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: G.textTertiary,
              textAlign: "center",
              padding: "40px 20px",
            }}
          >
            <OrbIA state="idle" />
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 8 }}>Tu asistente está listo</div>
            <div style={{ fontSize: 12, maxWidth: 280, lineHeight: 1.5 }}>
              Escribe o habla para crear tareas, registrar gastos, guardar notas o simplemente conversar.
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.time ? `${m.role}-${m.time}` : i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                flexDirection: isUser ? "row-reverse" : "row",
                maxWidth: "88%",
                alignSelf: isUser ? "flex-end" : "flex-start",
              }}
            >
              {!isUser && <OrbIA state="idle" />}
              <div>
                <div
                  style={{
                    padding: "9px 13px",
                    borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                    background: isUser ? G.accent : "white",
                    color: isUser ? "#fff" : G.textPrimary,
                    fontSize: 13,
                    lineHeight: 1.55,
                    boxShadow: isUser ? "none" : "0 1px 4px rgba(0,0,0,0.08)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.content}
                </div>
                {m.time && (
                  <div
                    style={{
                      fontSize: 10,
                      color: G.textTertiary,
                      marginTop: 3,
                      textAlign: isUser ? "right" : "left",
                      paddingLeft: isUser ? 0 : 4,
                      paddingRight: isUser ? 4 : 0,
                    }}
                  >
                    {fmtTime(m.time)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", alignSelf: "flex-start" }}>
            <OrbIA state="thinking" />
            <div
              style={{
                padding: "9px 13px",
                borderRadius: "4px 14px 14px 14px",
                background: "white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: G.textTertiary,
                    animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
