// src/components/AuthScreen.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase.js";

const authCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap');
  
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  }

  @keyframes nebulaFloat {
    0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
    33% { transform: translate(4%, 3%) scale(1.05) rotate(5deg); }
    66% { transform: translate(-3%, 5%) scale(0.96) rotate(-4deg); }
  }

  .bg-radial-glow {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: radial-gradient(circle at 15% 25%, rgba(31, 58, 82, 0.05) 0%, transparent 45%),
                radial-gradient(circle at 85% 75%, rgba(144, 27, 47, 0.04) 0%, transparent 45%);
    pointer-events: none;
    animation: nebulaFloat 20s ease-in-out infinite;
  }
  
  .dark-glow {
    background: radial-gradient(circle at 15% 25%, rgba(59, 130, 246, 0.08) 0%, transparent 45%),
                radial-gradient(circle at 85% 75%, rgba(144, 27, 47, 0.06) 0%, transparent 45%),
                radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.04) 0%, transparent 55%) !important;
  }

  /* Tactile Spring Physics */
  button, input {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), 
                background-color 0.25s ease, 
                color 0.25s ease, 
                box-shadow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), 
                border-color 0.3s ease !important;
  }

  button:active {
    transform: scale(0.96) !important;
  }

  .login-card {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  input::placeholder {
    color: var(--text-placeholder);
    opacity: 0.7;
  }
`;

export default function AuthScreen({ onAuth, darkMode }) {
  const bg      = darkMode ? "#070913" : "#f8fafc";
  const surface = darkMode ? "rgba(15, 20, 35, 0.65)" : "rgba(255, 255, 255, 0.80)";
  const border  = darkMode ? "rgba(255, 255, 255, 0.07)" : "rgba(31, 58, 82, 0.05)";
  const text     = darkMode ? "#f8fafc" : "#0f172a";
  const textSub  = darkMode ? "#94a3b8" : "#475569";
  const accent   = darkMode ? "#3b82f6" : "#1F3A52";
  const textPlaceholder = darkMode ? "#475569" : "#94a3b8";

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
    fontSize: 10, fontWeight: 700, color: textSub,
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block",
    fontFamily: "Inter, sans-serif",
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 12,
    background: darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(31, 58, 82, 0.04)",
    border: `1px solid ${border}`, color: text, fontSize: 13.5,
    outline: "none", boxSizing: "border-box",
    fontFamily: "Inter, sans-serif",
    "--text-placeholder": textPlaceholder,
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
      fontFamily: "Inter, sans-serif",
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{authCSS}</style>
      <div className={`bg-radial-glow ${darkMode ? "dark-glow" : ""}`} />

      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 2 }}>

        {/* Logo & Marca */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          {/* Double overlapping squares logo (Crimson & Deep Blue) */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #1F3A52 0%, #901B2F 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: darkMode 
              ? "0 8px 24px rgba(144, 27, 47, 0.25), 0 0 0 1px rgba(255,255,255,0.06)" 
              : "0 8px 24px rgba(31, 58, 82, 0.12)",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ 
            fontSize: 26, 
            fontWeight: 850, 
            color: text, 
            letterSpacing: "-0.03em", 
            fontFamily: "Outfit, sans-serif",
            lineHeight: 1.15
          }}>
            Cerebro Personal
          </div>
          <div style={{ fontSize: 13, color: textSub, marginTop: 6, fontWeight: 500 }}>
            {mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta"}
          </div>
        </div>

        {/* Card de Acceso Premium */}
        <div className="login-card" style={{
          background: surface, 
          borderRadius: 20, 
          padding: "32px 32px 28px",
          border: `1px solid ${border}`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: darkMode
            ? "0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 12px 40px rgba(31, 58, 82, 0.06), 0 1px 2px rgba(31, 58, 82, 0.02)",
        }}>

          {/* Toggle login/registro de cristal */}
          <div style={{ 
            display: "flex", 
            gap: 4, 
            marginBottom: 24, 
            background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(31, 58, 82, 0.04)", 
            borderRadius: 10, 
            padding: 3 
          }}>
            {["login", "registro"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); setNombre(""); setPassword(""); }}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12.5, fontWeight: mode === m ? 700 : 500,
                  background: mode === m ? (darkMode ? "rgba(255,255,255,0.08)" : "#ffffff") : "transparent",
                  color: mode === m ? text : textSub,
                  boxShadow: mode === m ? (darkMode ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(31,58,82,0.08)") : "none",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
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
                  placeholder="Tu nombre completo"
                  style={{ 
                    ...inputStyle, 
                    borderColor: focusedField === "nombre" ? accent : border,
                    boxShadow: focusedField === "nombre" ? (darkMode ? "0 0 0 3.5px rgba(59, 130, 246, 0.16)" : "0 0 0 3.5px rgba(31, 58, 82, 0.08)") : "none" 
                  }}
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
                style={{ 
                  ...inputStyle, 
                  borderColor: focusedField === "email" ? accent : border,
                  boxShadow: focusedField === "email" ? (darkMode ? "0 0 0 3.5px rgba(59, 130, 246, 0.16)" : "0 0 0 3.5px rgba(31, 58, 82, 0.08)") : "none" 
                }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password} required minLength={6}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ 
                    ...inputStyle, 
                    paddingRight: 44, 
                    borderColor: focusedField === "password" ? accent : border,
                    boxShadow: focusedField === "password" ? (darkMode ? "0 0 0 3.5px rgba(59, 130, 246, 0.16)" : "0 0 0 3.5px rgba(31, 58, 82, 0.08)") : "none" 
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: textSub, padding: 4,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    outline: "none",
                  }}>
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error inline */}
            {error && (
              <div style={{
                background: darkMode ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.06)", 
                border: `1px solid ${darkMode ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.15)"}`,
                borderRadius: 10, padding: "10px 14px", marginBottom: 18,
                fontSize: 13, color: darkMode ? "#f87171" : "#b91c1c",
                fontWeight: 500, fontFamily: "Inter, sans-serif"
              }}>
                {error}
              </div>
            )}

            {/* Success inline */}
            {success && (
              <div style={{
                background: darkMode ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.06)", 
                border: `1px solid ${darkMode ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.15)"}`,
                borderRadius: 10, padding: "10px 14px", marginBottom: 18,
                fontSize: 13, color: darkMode ? "#34d399" : "#047857",
                fontWeight: 500, fontFamily: "Inter, sans-serif"
              }}>
                {success}
              </div>
            )}

            {/* Botón principal */}
            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 12,
                background: loading 
                  ? (darkMode ? "rgba(255,255,255,0.06)" : "rgba(31,58,82,0.12)") 
                  : (darkMode ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "linear-gradient(135deg, #1F3A52, #15293a)"),
                color: loading ? textSub : "#ffffff", 
                border: "none", 
                fontSize: 13.5, 
                fontWeight: 750,
                letterSpacing: "-0.01em",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: darkMode 
                  ? "0 4px 14px rgba(37, 99, 235, 0.25)" 
                  : "0 4px 14px rgba(31, 58, 82, 0.15)",
                outline: "none",
                fontFamily: "Inter, sans-serif"
              }}>
              {loading
                ? "Cargando..."
                : mode === "login" ? "Iniciar sesión" : "Crear cuenta"
              }
            </button>
          </form>
        </div>

        {/* Texto de seguridad */}
        <div style={{ 
          textAlign: "center", 
          marginTop: 20, 
          fontSize: 11, 
          color: textSub, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: 6,
          fontWeight: 500,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          Sincronización encriptada en tiempo real
        </div>
      </div>
    </div>
  );
}
