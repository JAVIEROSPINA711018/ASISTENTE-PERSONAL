import { useState, useEffect } from "react";
import { signInCRM, signOutCRM, getCRMSession } from "../lib/supabaseCRM.js";

const LIGHT = {
  bg: "#f5f5f5", surface: "#ffffff", border: "#c0c0c0", borderHigh: "#a8a8a8",
  accent: "#0071e3", accentSoft: "rgba(0,113,227,0.08)",
  coral: "#ff3b30", coralSoft: "rgba(255,59,48,0.08)",
  green: "#34c759",
  textPrimary: "#1d1d1f", textSecondary: "#515154", textTertiary: "#86868b",
};
const DARK = {
  bg: "#1c1c1e", surface: "#2c2c2e", border: "rgba(255,255,255,0.08)", borderHigh: "rgba(255,255,255,0.14)",
  accent: "#0a84ff", accentSoft: "rgba(10,132,255,0.18)",
  coral: "#ff453a", coralSoft: "rgba(255,69,58,0.15)",
  green: "#30d158",
  textPrimary: "#f5f5f7", textSecondary: "#aeaeb2", textTertiary: "#636366",
};
const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

/**
 * CRMAuthGate
 * Wraps any CRM view. Checks for an active CRM Supabase session.
 * If not authenticated → shows a compact login form.
 * Once authenticated → renders children.
 *
 * Props:
 *   darkMode  bool
 *   children  ReactNode
 */
export default function CRMAuthGate({ darkMode = false, children }) {
  const G = darkMode ? DARK : LIGHT;

  const [status, setStatus]   = useState("loading"); // "loading" | "out" | "in"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [signing, setSigning] = useState(false);
  const [errMsg, setErrMsg]   = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Check session on mount
  useEffect(() => {
    getCRMSession().then(sess => {
      if (sess) {
        setUserEmail(sess.user?.email || "");
        setStatus("in");
      } else {
        setStatus("out");
      }
    });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setSigning(true);
    setErrMsg("");
    try {
      const sess = await signInCRM(email, password);
      setUserEmail(sess.user?.email || email);
      setStatus("in");
    } catch (err) {
      setErrMsg(err.message || "Credenciales incorrectas");
    } finally {
      setSigning(false);
    }
  }

  async function handleLogout() {
    await signOutCRM();
    setStatus("out");
    setEmail("");
    setPassword("");
    setUserEmail("");
  }

  const inputStyle = {
    width: "100%", border: `1px solid ${G.border}`, borderRadius: 9,
    padding: "10px 13px", fontSize: 14, fontFamily: FONT,
    background: G.surface, color: G.textPrimary, outline: "none",
    boxSizing: "border-box",
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: G.textTertiary }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${G.accent}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", marginRight: 10 }} />
        Verificando sesión CRM...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Authenticated → render children ──────────────────────────────────────
  if (status === "in") {
    return (
      <>
        {/* Small session badge shown at top of every CRM view */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: 8, marginBottom: 4, flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: G.green, fontFamily: FONT, fontWeight: 600 }}>
            ● CRM conectado
          </span>
          <span style={{ fontSize: 10, color: G.textTertiary, fontFamily: FONT }}>{userEmail}</span>
          <button
            onClick={handleLogout}
            style={{
              fontSize: 10, color: G.textTertiary, background: "none",
              border: `1px solid ${G.border}`, borderRadius: 5,
              padding: "2px 8px", cursor: "pointer", fontFamily: FONT,
            }}
          >
            Desconectar
          </button>
        </div>
        {children}
      </>
    );
  }

  // ── Not authenticated → login form ────────────────────────────────────────
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT, padding: 16,
    }}>
      <div style={{
        background: G.surface, border: `1px solid ${G.borderHigh}`,
        borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 380,
        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
      }}>
        {/* Logo / title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg,#0071e3,#5e5ce6)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 12,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: G.textPrimary }}>
            Conectar CRM
          </div>
          <div style={{ fontSize: 12, color: G.textTertiary, marginTop: 4 }}>
            Ingresa tus credenciales de Suelos y Estructuras
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: G.textSecondary, display: "block", marginBottom: 5 }}>
              Correo electrónico
            </label>
            <input
              required
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              autoComplete="email"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: G.textSecondary, display: "block", marginBottom: 5 }}>
              Contraseña
            </label>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="current-password"
            />
          </div>

          {errMsg && (
            <div style={{
              background: G.coralSoft, border: `1px solid ${G.coral}`,
              borderRadius: 8, padding: "9px 13px",
              fontSize: 12, color: G.coral, fontWeight: 600,
            }}>
              ⚠ {errMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={signing}
            style={{
              padding: "11px", borderRadius: 10, border: "none", cursor: signing ? "not-allowed" : "pointer",
              background: G.accent, color: "#fff", fontSize: 14, fontWeight: 700,
              fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, opacity: signing ? 0.7 : 1, marginTop: 4,
            }}
          >
            {signing && (
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
            )}
            {signing ? "Conectando..." : "Conectar al CRM"}
          </button>
        </form>

        <div style={{
          marginTop: 18, padding: "12px 14px",
          background: G.accentSoft, borderRadius: 9,
          fontSize: 11, color: G.textSecondary, lineHeight: 1.5,
        }}>
          Usa las mismas credenciales con las que accedes a{" "}
          <span style={{ fontWeight: 700, color: G.accent }}>suelosyestructuraseu.com</span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
