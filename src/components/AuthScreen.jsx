// src/components/AuthScreen.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function AuthScreen({ onAuth, darkMode }) {
  const bg      = darkMode ? "#0f0f14" : "#f0f0f5";
  const surface = darkMode ? "#1a1a24" : "#ffffff";
  const border  = darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const text     = darkMode ? "#f5f5f7" : "#1d1d1f";
  const textSub  = darkMode ? "#aeaeb2" : "#515154";
  const accent   = darkMode ? "#0a84ff" : "#0071e3";

  const [mode, setMode]         = useState("login"); // 'login' | 'registro'
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: textSub,
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5, display: "block",
  };
  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: `1px solid ${border}`, color: text, fontSize: 14,
    outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border 0.15s",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "registro" && !nombre.trim()) {
      setError("El nombre es requerido para registrarse.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuth(data.session);
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre } },
        });
        if (err) throw err;
        if (data.session) {
          onAuth(data.session);
        } else {
          setSuccess("Cuenta creada. Revisa tu email para confirmar y luego inicia sesión.");
          setMode("login");
        }
      }
    } catch (err) {
      const msg = err.message || "Error desconocido";
      if (msg.includes("Invalid login credentials")) setError("Email o contraseña incorrectos.");
      else if (msg.includes("User already registered")) setError("Este email ya está registrado. Inicia sesión.");
      else if (msg.includes("Password should be at least")) setError("La contraseña debe tener al menos 6 caracteres.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: bg, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
            background: "linear-gradient(135deg,#0071e3,#5e5ce6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: text, letterSpacing: "-0.03em" }}>Cerebro Personal</div>
          <div style={{ fontSize: 13, color: textSub, marginTop: 4 }}>
            {mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta"}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: surface, borderRadius: 18, padding: "28px 28px 24px",
          border: `1px solid ${border}`,
          boxShadow: darkMode
            ? "0 20px 60px rgba(0,0,0,0.5)"
            : "0 8px 40px rgba(0,0,0,0.10)",
        }}>

          {/* Toggle login/registro */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderRadius: 10, padding: 3 }}>
            {["login", "registro"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); setNombre(""); setPassword(""); }}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: mode === m ? 700 : 400,
                  background: mode === m ? (darkMode ? "#2a2a38" : "#ffffff") : "transparent",
                  color: mode === m ? text : textSub,
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.15s",
                }}>
                {m === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>

            {/* Nombre — solo en registro */}
            {mode === "registro" && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text" value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  style={{ ...inputStyle, border: `1px solid ${focusedField === "nombre" ? accent : border}` }}
                  onFocus={() => setFocusedField("nombre")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email" value={email} required
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                style={{ ...inputStyle, border: `1px solid ${focusedField === "email" ? accent : border}` }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password} required minLength={6}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 44, border: `1px solid ${focusedField === "password" ? accent : border}` }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: textSub, padding: 0,
                  }}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error inline */}
            {error && (
              <div style={{
                background: "rgba(255,59,48,0.10)", border: "1px solid rgba(255,59,48,0.25)",
                borderRadius: 8, padding: "9px 12px", marginBottom: 16,
                fontSize: 13, color: "#ff3b30",
              }}>
                {error}
              </div>
            )}

            {/* Success inline */}
            {success && (
              <div style={{
                background: "rgba(52,199,89,0.10)", border: "1px solid rgba(52,199,89,0.25)",
                borderRadius: 8, padding: "9px 12px", marginBottom: 16,
                fontSize: 13, color: "#34c759",
              }}>
                {success}
              </div>
            )}

            {/* Botón principal */}
            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 10,
                background: loading ? (darkMode ? "#333" : "#ccc") : accent,
                color: "#ffffff", border: "none", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}>
              {loading
                ? "Cargando..."
                : mode === "login" ? "Iniciar sesión" : "Crear cuenta"
              }
            </button>
          </form>
        </div>

        {/* Texto de seguridad */}
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: textSub, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Tus datos se sincronizan en todos tus dispositivos de forma segura
        </div>
      </div>
    </div>
  );
}
