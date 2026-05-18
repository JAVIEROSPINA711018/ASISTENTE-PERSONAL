# Supabase Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar localStorage como fuente de datos primaria por Supabase, añadiendo autenticación email/contraseña, sincronización multi-dispositivo y migración automática de datos existentes.

**Architecture:** Supabase como master store; localStorage como caché offline y cola de reintentos. React state como fuente de verdad en memoria. Las vistas no conocen Supabase — la capa de sync vive exclusivamente en `src/lib/supabase.js` y `App.jsx`. Patrón optimista: state primero, Supabase en background.

**Tech Stack:** React 18, Vite 5, @supabase/supabase-js v2, Supabase Auth, Supabase Realtime, Supabase Vault

**Note on testing:** Este proyecto no tiene test runner configurado. La verificación es: `npm run build` (sin errores de compilación) + smoke test manual en el navegador. Cada tarea incluye los pasos exactos de verificación.

---

## File Map

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Create | `src/lib/supabase.js` | Cliente Supabase + todas las funciones CRUD + sync queue + migration |
| Create | `src/components/AuthScreen.jsx` | Pantalla fullscreen de login/registro (autónoma, sin estilos externos) |
| Create | `.env.local` | Variables de entorno VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY |
| Modify | `.gitignore` | Añadir `.env.local` si no está |
| Modify | `src/App.jsx` | Session state, initUserData, mutation wrappers optimistas, render condicional |
| SQL | Supabase Dashboard | 6 tablas + RLS + triggers |

---

## Task 1: Setup — Instalar dependencia + variables de entorno

**Files:**
- Modify: `package.json` (via npm install)
- Create: `.env.local`
- Modify: `.gitignore`

- [ ] **Step 1: Instalar @supabase/supabase-js**

```bash
cd /Users/javierospina/.gemini/antigravity/scratch/cerebro-personal
npm install @supabase/supabase-js
```

Expected: `added 1 package` (o similar), sin errores.

- [ ] **Step 2: Verificar que package.json tiene la dependencia**

```bash
grep supabase package.json
```

Expected: `"@supabase/supabase-js": "^2.x.x"` en `dependencies`.

- [ ] **Step 3: Crear .env.local con placeholders**

Crear el archivo `.env.local` en la raíz del proyecto con este contenido exacto (los valores reales se llenan después de crear el proyecto Supabase en el Task 2):

```
VITE_SUPABASE_URL=https://PLACEHOLDER.supabase.co
VITE_SUPABASE_ANON_KEY=PLACEHOLDER_ANON_KEY
```

- [ ] **Step 4: Verificar que .gitignore incluye .env.local**

```bash
grep ".env.local" .gitignore || echo "MISSING"
```

Si el output dice `MISSING`, agregar al final de `.gitignore`:

```
.env.local
```

- [ ] **Step 5: Verificar build compila con la nueva dependencia**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` sin errores.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add @supabase/supabase-js dependency"
```

---

## Task 2: SQL Schema — Crear proyecto Supabase + tablas + RLS

**Files:**
- SQL ejecutado en Supabase Dashboard → SQL Editor

Este task es manual. El implementador debe ejecutar los scripts en el SQL Editor de Supabase (https://supabase.com → tu proyecto → SQL Editor).

- [ ] **Step 1: Crear proyecto Supabase**

1. Ir a https://supabase.com/dashboard
2. "New project" → nombre: `cerebro-personal` → región más cercana (us-east-1 o sa-east-1)
3. Guardar la contraseña de la base de datos en un lugar seguro
4. Esperar ~2 minutos a que el proyecto se provisione

- [ ] **Step 2: Copiar credenciales a .env.local**

En Supabase Dashboard → Settings → API:
- `Project URL` → pegar como `VITE_SUPABASE_URL`
- `anon public` key → pegar como `VITE_SUPABASE_ANON_KEY`

Actualizar `.env.local`:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] **Step 3: Crear trigger para tabla profiles**

En SQL Editor, ejecutar:

```sql
-- Tabla profiles (creada automáticamente al registrarse)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  nombre text,
  created_at timestamptz DEFAULT now()
);

-- Trigger para crear profile automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

Expected: `Success. No rows returned`

- [ ] **Step 4: Crear tabla settings**

```sql
CREATE TABLE IF NOT EXISTS settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key text,
  google_email text,
  personality text DEFAULT 'profesional',
  dark_mode bool DEFAULT false,
  mood text,
  diario text,
  habits jsonb
);
```

- [ ] **Step 5: Crear tabla items**

```sql
CREATE TABLE IF NOT EXISTS items (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  texto text NOT NULL,
  datos jsonb,
  hecho bool DEFAULT false,
  fecha date,
  columna text,
  creado timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
```

- [ ] **Step 6: Crear tablas contactos, eventos, messages**

```sql
CREATE TABLE IF NOT EXISTS contactos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  empresa text,
  cargo text,
  email text,
  telefono text,
  whatsapp text,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  fecha date NOT NULL,
  hora text,
  loc text,
  color text,
  tipo text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

- [ ] **Step 7: Activar RLS en todas las tablas**

```sql
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages  ENABLE ROW LEVEL SECURITY;

-- Política universal: cada usuario solo ve sus propios datos
CREATE POLICY "owner_only" ON profiles  FOR ALL USING (auth.uid() = id)          WITH CHECK (auth.uid() = id);
CREATE POLICY "owner_only" ON settings  FOR ALL USING (auth.uid() = user_id)     WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_only" ON items     FOR ALL USING (auth.uid() = user_id)     WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_only" ON contactos FOR ALL USING (auth.uid() = user_id)     WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_only" ON eventos   FOR ALL USING (auth.uid() = user_id)     WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_only" ON messages  FOR ALL USING (auth.uid() = user_id)     WITH CHECK (auth.uid() = user_id);
```

Expected: `Success. No rows returned` para cada bloque.

- [ ] **Step 8: Verificar tablas en Table Editor**

En Supabase Dashboard → Table Editor, confirmar que aparecen: `profiles`, `settings`, `items`, `contactos`, `eventos`, `messages`. Cada una debe tener el ícono de candado (RLS activo).

- [ ] **Step 9: Habilitar Realtime para tabla items**

En Supabase Dashboard → Database → Replication:
- Activar `items` en la lista de tablas habilitadas para Realtime.
- Hacer lo mismo con `contactos`.

---

## Task 3: src/lib/supabase.js — Cliente + CRUD completo

**Files:**
- Create: `src/lib/supabase.js`

- [ ] **Step 1: Crear el archivo src/lib/supabase.js**

Crear exactamente este archivo (344 líneas):

```js
// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────────────────────
// Capa de sincronización entre React state y Supabase.
// Las vistas NO importan de este archivo — solo App.jsx lo usa.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

// ── Cliente ──────────────────────────────────────────────────────────────────
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Carga inicial (todo en paralelo) ─────────────────────────────────────────
export async function loadAllUserData(userId) {
  const [
    { data: items,     error: e1 },
    { data: contactos, error: e2 },
    { data: eventos,   error: e3 },
    { data: messages,  error: e4 },
    { data: settingsArr, error: e5 },
  ] = await Promise.all([
    supabase.from("items").select("*").eq("user_id", userId).order("creado", { ascending: false }),
    supabase.from("contactos").select("*").eq("user_id", userId).order("nombre"),
    supabase.from("eventos").select("*").eq("user_id", userId).order("fecha"),
    supabase.from("messages").select("*").eq("user_id", userId).order("created_at").limit(100),
    supabase.from("settings").select("*").eq("user_id", userId).single(),
  ]);

  if (e1) console.error("[supabase] loadItems:", e1.message);
  if (e2) console.error("[supabase] loadContactos:", e2.message);
  if (e3) console.error("[supabase] loadEventos:", e3.message);
  if (e4) console.error("[supabase] loadMessages:", e4.message);
  if (e5 && e5.code !== "PGRST116") console.error("[supabase] loadSettings:", e5.message);

  return {
    items:     items     || [],
    contactos: contactos || [],
    eventos:   eventos   || [],
    messages:  messages  || [],
    settings:  settingsArr || null,
  };
}

// ── Items ─────────────────────────────────────────────────────────────────────
export async function syncItems(items, userId) {
  if (!items.length) return;
  const rows = items.map(item => ({ ...item, user_id: userId }));
  const { error } = await supabase.from("items").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteItem(id, userId) {
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Contactos ─────────────────────────────────────────────────────────────────
export async function syncContactos(contactos, userId) {
  if (!contactos.length) return;
  const rows = contactos.map(c => ({ ...c, user_id: userId }));
  const { error } = await supabase.from("contactos").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteContacto(id, userId) {
  const { error } = await supabase
    .from("contactos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Eventos ───────────────────────────────────────────────────────────────────
export async function syncEventos(eventos, userId) {
  if (!eventos.length) return;
  const rows = eventos.map(e => ({ ...e, user_id: userId }));
  const { error } = await supabase.from("eventos").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteEvento(id, userId) {
  const { error } = await supabase
    .from("eventos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function loadSettings(userId) {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  // PGRST116 = no row found, expected the first time
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

export async function upsertSettings(patch, userId) {
  const { error } = await supabase
    .from("settings")
    .upsert({ ...patch, user_id: userId }, { onConflict: "user_id" });
  if (error) throw error;
}

// ── Messages ──────────────────────────────────────────────────────────────────
export async function appendMessage({ role, content }, userId) {
  const { error } = await supabase.from("messages").insert({
    user_id: userId,
    role,
    content,
  });
  if (error) throw error;
}

export async function bulkInsertMessages(messages, userId) {
  if (!messages.length) return;
  const rows = messages.map(m => ({
    user_id: userId,
    role: m.role,
    content: m.content,
    created_at: m.time || new Date().toISOString(),
  }));
  const { error } = await supabase.from("messages").insert(rows);
  if (error) throw error;
}

// ── Migración automática de localStorage → Supabase ──────────────────────────
// Corre una sola vez por usuario, identificada por la clave cerebro_migrated_<userId>
export async function migrateLocalStorageToSupabase(userId) {
  const migKey = `cerebro_migrated_${userId}`;
  if (localStorage.getItem(migKey)) return; // ya migró

  let items     = [];
  let contactos = [];
  let eventos   = [];
  let messages  = [];
  let settings  = {};

  try { items     = JSON.parse(localStorage.getItem("cerebro_items")     || "[]"); } catch {}
  try { contactos = JSON.parse(localStorage.getItem("cerebro_contactos") || "[]"); } catch {}
  try { eventos   = JSON.parse(localStorage.getItem("cerebro_eventos")   || "[]"); } catch {}
  try { messages  = JSON.parse(localStorage.getItem("cerebro_messages")  || "[]"); } catch {}

  settings = {
    dark_mode:    localStorage.getItem("cerebro_dark")        === "true",
    mood:         localStorage.getItem("cerebro_mood")         || null,
    diario:       localStorage.getItem("cerebro_diario")       || null,
    habits:       (() => { try { return JSON.parse(localStorage.getItem("cerebro_habits") || "null"); } catch { return null; } })(),
    personality:  localStorage.getItem("cerebro_personality")  || "profesional",
    google_email: localStorage.getItem("cerebro_google_email") || null,
    gemini_api_key: null, // nunca migrar la API key desde localStorage por seguridad
  };

  await Promise.all([
    items.length     ? syncItems(items, userId)               : null,
    contactos.length ? syncContactos(contactos, userId)       : null,
    eventos.length   ? syncEventos(eventos, userId)           : null,
    messages.length  ? bulkInsertMessages(messages, userId)   : null,
    upsertSettings(settings, userId),
  ].filter(Boolean));

  localStorage.setItem(migKey, "1");
  console.info("[supabase] Migración completada para userId:", userId);
}

// ── Cola offline ──────────────────────────────────────────────────────────────
// Se usa cuando Supabase no está disponible (sin conexión)
function enqueueOperation(table, operation, payload) {
  try {
    const queue = JSON.parse(localStorage.getItem("cerebro_sync_queue") || "[]");
    queue.push({ table, operation, payload, timestamp: Date.now() });
    localStorage.setItem("cerebro_sync_queue", JSON.stringify(queue));
  } catch (err) {
    console.error("[supabase] Error enqueueing:", err);
  }
}

export function enqueueItems(items, userId) {
  enqueueOperation("items", "upsert", { items, userId });
}

export function enqueueContactos(contactos, userId) {
  enqueueOperation("contactos", "upsert", { contactos, userId });
}

// Procesar cola pendiente al recuperar conexión
export async function flushSyncQueue(userId) {
  const raw = localStorage.getItem("cerebro_sync_queue");
  if (!raw) return;
  let queue;
  try { queue = JSON.parse(raw); } catch { return; }
  if (!queue.length) return;

  const remaining = [];
  for (const op of queue) {
    try {
      if (op.table === "items"     && op.operation === "upsert") await syncItems(op.payload.items, userId);
      if (op.table === "contactos" && op.operation === "upsert") await syncContactos(op.payload.contactos, userId);
    } catch {
      remaining.push(op); // reencolar si sigue fallando
    }
  }

  if (remaining.length) {
    localStorage.setItem("cerebro_sync_queue", JSON.stringify(remaining));
  } else {
    localStorage.removeItem("cerebro_sync_queue");
  }
}

// ── Realtime subscriptions ────────────────────────────────────────────────────
// handlers: { onItemsChange(items), onContactosChange(contactos) }
export function subscribeUserData(userId, handlers) {
  const channel = supabase
    .channel(`user-data-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "items", filter: `user_id=eq.${userId}` },
      async () => {
        // Al recibir cualquier cambio en items, recargar la lista completa
        const { data } = await supabase
          .from("items")
          .select("*")
          .eq("user_id", userId)
          .order("creado", { ascending: false });
        if (data && handlers.onItemsChange) handlers.onItemsChange(data);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contactos", filter: `user_id=eq.${userId}` },
      async () => {
        const { data } = await supabase
          .from("contactos")
          .select("*")
          .eq("user_id", userId)
          .order("nombre");
        if (data && handlers.onContactosChange) handlers.onContactosChange(data);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeUserData(channel) {
  if (channel) supabase.removeChannel(channel);
}
```

- [ ] **Step 2: Verificar que el build no tiene errores**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in` sin errores. Si hay errores de importación, verificar que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY están en `.env.local`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.js
git commit -m "feat: add Supabase client and CRUD sync layer"
```

---

## Task 4: src/components/AuthScreen.jsx — Login/Registro UI

**Files:**
- Create: `src/components/AuthScreen.jsx`

AuthScreen es un componente fullscreen autónomo. No recibe `G` ni estilos externos — los define localmente. Props: `onAuth(session)`, `darkMode`.

- [ ] **Step 1: Crear src/components/AuthScreen.jsx**

```jsx
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
        // signUp puede requerir confirmación de email según configuración de Supabase
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
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
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
                  style={inputStyle}
                  onFocus={e => e.target.style.border = `1px solid ${accent}`}
                  onBlur={e => e.target.style.border = `1px solid ${border}`}
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
                style={inputStyle}
                onFocus={e => e.target.style.border = `1px solid ${accent}`}
                onBlur={e => e.target.style.border = `1px solid ${border}`}
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
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => e.target.style.border = `1px solid ${accent}`}
                  onBlur={e => e.target.style.border = `1px solid ${border}`}
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
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -6
```

Expected: `✓ built in` sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthScreen.jsx
git commit -m "feat: add AuthScreen component for email/password auth"
```

---

## Task 5: App.jsx — Session state, SyncingScreen y render condicional

**Files:**
- Modify: `src/App.jsx` (líneas ~1–10 y ~4145–4160 y ~4650–4660)

Este task agrega la estructura de autenticación a App.jsx sin tocar la lógica de negocio existente.

- [ ] **Step 1: Agregar import de supabase y AuthScreen en App.jsx**

Buscar la línea `import { useState, useEffect, useRef } from "react";` (línea 1 del archivo) y reemplazarla por:

```js
import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase.js";
import AuthScreen from "./components/AuthScreen.jsx";
```

- [ ] **Step 2: Agregar SyncingScreen como componente local**

Buscar la línea que contiene `let G = LIGHT;` (aproximadamente línea 35) y agregar inmediatamente después el componente SyncingScreen:

```js
// Pantalla de carga inicial mientras se sincronizan los datos de Supabase
function SyncingScreen({ darkMode }) {
  const bg   = darkMode ? "#0f0f14" : "#f0f0f5";
  const text = darkMode ? "#f5f5f7" : "#1d1d1f";
  const sub  = darkMode ? "#aeaeb2" : "#515154";
  return (
    <div style={{
      minHeight: "100vh", background: bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 18,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0071e3,#5e5ce6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 6 }}>Cargando tus datos...</div>
        <div style={{ fontSize: 12, color: sub }}>Sincronizando con Supabase</div>
      </div>
      <div style={{ width: 200, height: 3, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: "60%", height: "100%", background: "#0071e3", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Agregar session state en CerebralApp**

Buscar la línea `export default function CerebralApp() {` (línea ~4145) y localizar el bloque que comienza con:
```js
  const [vista, setVista] = useState("inicio");
```

Insertar ANTES de esa línea:
```js
  const [session, setSession]   = useState(null);
  const [authReady, setAuthReady] = useState(false); // true cuando getSession() completó
  const [syncing, setSyncing]   = useState(false);   // true mientras se cargan datos de Supabase
```

- [ ] **Step 4: Agregar useEffect de sesión en CerebralApp**

Localizar el primer `useEffect` dentro de `CerebralApp` (alrededor de la línea 4204, el que hace `localStorage.setItem("cerebro_mood", mood)`). Insertar ANTES de ese `useEffect`:

```js
  // ── Supabase Auth — init de sesión ────────────────────────────────────────
  useEffect(() => {
    // Verificar sesión existente al arrancar
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    // Escuchar cambios de sesión (login / logout desde otra pestaña)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (!s) {
        // Al cerrar sesión, limpiar syncing
        setSyncing(false);
      }
    });

    // Flush de cola offline al reconectar
    const handleOnline = () => {
      if (session?.user?.id) {
        import("./lib/supabase.js").then(({ flushSyncQueue }) => {
          flushSyncQueue(session.user.id).catch(console.error);
        });
      }
    };
    window.addEventListener("online", handleOnline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 5: Agregar render condicional en el return de CerebralApp**

Localizar el `return (` del componente CerebralApp (línea ~4652). Insertar ANTES del `return (`:

```js
  // ── Render condicional: auth → syncing → app ──────────────────────────────
  if (!authReady) return null; // breve flash hasta que getSession() responde
  if (!session)   return <AuthScreen onAuth={setSession} darkMode={darkMode} />;
  if (syncing)    return <SyncingScreen darkMode={darkMode} />;
```

- [ ] **Step 6: Verificar build**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in` sin errores.

- [ ] **Step 7: Smoke test manual**

```bash
npm run dev
```

Abrir http://localhost:5173. Debe aparecer la `AuthScreen` (no la app) ya que no hay sesión. Verificar que el toggle Login/Registro funciona y los campos tienen el estilo correcto.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add Supabase session state and AuthScreen render guard"
```

---

## Task 6: App.jsx — initUserData + migración automática

**Files:**
- Modify: `src/App.jsx`

Este task agrega la función `initUserData` que carga los datos de Supabase después del login y ejecuta la migración automática una sola vez.

- [ ] **Step 1: Agregar import de funciones de supabase.js en App.jsx**

El import de `supabase` ya fue agregado en Task 5. Actualizar esa línea para incluir las funciones CRUD:

Buscar:
```js
import { supabase } from "./lib/supabase.js";
```

Reemplazar por:
```js
import {
  supabase,
  loadAllUserData,
  migrateLocalStorageToSupabase,
  syncItems,
  syncContactos,
  syncEventos,
  upsertSettings,
  appendMessage,
  subscribeUserData,
  unsubscribeUserData,
  enqueueItems,
  enqueueContactos,
  flushSyncQueue,
} from "./lib/supabase.js";
```

- [ ] **Step 2: Agregar ref para el canal Realtime**

Localizar `const historyRef = useRef([]);` (línea ~4306) y agregar debajo:

```js
  const realtimeChannelRef = useRef(null);
```

- [ ] **Step 3: Agregar la función initUserData en CerebralApp**

Localizar la función `handleIncrementHabit` (línea ~4226) y agregar ANTES de ella:

```js
  // ── Supabase — carga inicial y migración ─────────────────────────────────
  async function initUserData(userId) {
    setSyncing(true);
    try {
      // 1. Migración automática de localStorage (no-op si ya migró)
      await migrateLocalStorageToSupabase(userId);

      // 2. Cargar todos los datos de Supabase
      const data = await loadAllUserData(userId);

      // 3. Hidratar React state
      if (data.items.length)     setItems(data.items);
      if (data.contactos.length) setContactos(data.contactos);
      if (data.messages.length)  setMessages(data.messages);

      // 4. Hidratar settings si existen
      if (data.settings) {
        if (data.settings.dark_mode !== undefined) setDarkMode(data.settings.dark_mode);
        if (data.settings.mood)        setMood(data.settings.mood);
        if (data.settings.diario)      setDiario(data.settings.diario);
        if (data.settings.habits)      setHabits(data.settings.habits);
        if (data.settings.personality) setPersonality(data.settings.personality);
        if (data.settings.google_email) {
          setGoogleConnectedEmail(data.settings.google_email);
          setGoogleConnected(true);
        }
        if (data.settings.gemini_api_key) {
          setApiKey(data.settings.gemini_api_key);
          localStorage.setItem("gemini_api_key", data.settings.gemini_api_key);
        }
      }

      // 5. Suscribir a cambios en tiempo real
      if (realtimeChannelRef.current) unsubscribeUserData(realtimeChannelRef.current);
      realtimeChannelRef.current = subscribeUserData(userId, {
        onItemsChange:     (items)     => setItems(items),
        onContactosChange: (contactos) => setContactos(contactos),
      });

      // 6. Intentar flush de cola offline si hay pendientes
      flushSyncQueue(userId).catch(() => {});

    } catch (err) {
      console.error("[CerebralApp] initUserData error:", err);
    } finally {
      setSyncing(false);
    }
  }
```

- [ ] **Step 4: Llamar initUserData desde el useEffect de sesión**

Localizar el `useEffect` de Auth añadido en Task 5 y actualizar para que llame `initUserData` cuando hay sesión:

Buscar dentro del useEffect:
```js
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
```

Reemplazar por:
```js
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
      if (data.session) initUserData(data.session.user.id);
    });
```

Y agregar el handler `onAuthStateChange` que llame `initUserData` al hacer login:

Buscar:
```js
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (!s) {
        // Al cerrar sesión, limpiar syncing
        setSyncing(false);
      }
    });
```

Reemplazar por:
```js
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        initUserData(s.user.id);
      }
      if (!s) {
        setSyncing(false);
        if (realtimeChannelRef.current) {
          unsubscribeUserData(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
      }
    });
```

- [ ] **Step 5: Agregar botón "Cerrar sesión" en la configuración**

Localizar en App.jsx donde se renderiza el panel de configuración (buscar `showConfig` y el botón de configuración). Dentro del panel de config, buscar el cierre del panel y agregar antes del final:

```jsx
{/* Cerrar sesión */}
<div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 16, marginTop: 8 }}>
  <button
    onClick={async () => {
      await supabase.auth.signOut();
      // session se pondrá null via onAuthStateChange → vuelve a AuthScreen
    }}
    style={{
      width: "100%", padding: "9px 0", borderRadius: 10,
      background: G.coralSoft, border: `1px solid rgba(255,59,48,0.20)`,
      color: G.coral, fontSize: 13, fontWeight: 600, cursor: "pointer",
    }}
  >
    Cerrar sesión
  </button>
  {session?.user?.email && (
    <div style={{ textAlign: "center", fontSize: 11, color: G.textTertiary, marginTop: 8 }}>
      Sesión activa: {session.user.email}
    </div>
  )}
</div>
```

- [ ] **Step 6: Verificar build**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in` sin errores.

- [ ] **Step 7: Smoke test manual**

```bash
npm run dev
```

1. Ir a http://localhost:5173 → debe aparecer `AuthScreen`
2. Registrar una cuenta de prueba con email/contraseña
3. Al registrarse debe: mostrar `SyncingScreen` brevemente → cargar la app normal
4. Recargar la página: debe cargar directamente la app (sesión persistida)
5. En configuración (ícono de engranaje), verificar que aparece el botón "Cerrar sesión"
6. Cerrar sesión → debe volver a `AuthScreen`

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add initUserData, automatic localStorage migration and session flow"
```

---

## Task 7: App.jsx — Mutation wrappers optimistas

**Files:**
- Modify: `src/App.jsx`

Los wrappers optimistas actualizan React state inmediatamente (UI sin lag) y sincronizan con Supabase en background. Si Supabase falla, enColan la operación para reintentar al reconectar.

- [ ] **Step 1: Wrapper para items — handleSetItems**

Localizar la función `handleAddItem` (línea ~4236) y agregar ANTES de ella:

```js
  // ── Mutation wrappers optimistas ──────────────────────────────────────────
  // Uso: donde antes se llamaba setItems(newItems), llamar handleSetItems(newItems)
  function handleSetItems(updaterOrValue) {
    setItems(prev => {
      const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
      // Persistir en localStorage como caché
      localStorage.setItem("cerebro_items", JSON.stringify(next));
      // Sync a Supabase en background (sin bloquear la UI)
      if (session?.user?.id) {
        syncItems(next, session.user.id).catch(() => {
          enqueueItems(next, session.user.id);
        });
      }
      return next;
    });
  }

  function handleSetContactos(updaterOrValue) {
    setContactos(prev => {
      const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
      localStorage.setItem("cerebro_contactos", JSON.stringify(next));
      if (session?.user?.id) {
        syncContactos(next, session.user.id).catch(() => {
          enqueueContactos(next, session.user.id);
        });
      }
      return next;
    });
  }

  function handleUpsertSettings(patch) {
    // Actualizar localStorage para cada campo del patch
    if (patch.dark_mode    !== undefined) localStorage.setItem("cerebro_dark",       patch.dark_mode ? "true" : "false");
    if (patch.mood         !== undefined) localStorage.setItem("cerebro_mood",       patch.mood);
    if (patch.diario       !== undefined) localStorage.setItem("cerebro_diario",     patch.diario);
    if (patch.personality  !== undefined) localStorage.setItem("cerebro_personality", patch.personality);
    if (patch.google_email !== undefined) localStorage.setItem("cerebro_google_email", patch.google_email);
    if (patch.habits       !== undefined) localStorage.setItem("cerebro_habits",     JSON.stringify(patch.habits));
    // Sync a Supabase en background
    if (session?.user?.id) {
      upsertSettings(patch, session.user.id).catch(err =>
        console.error("[supabase] upsertSettings failed:", err.message)
      );
    }
  }
```

- [ ] **Step 2: Conectar handleSetItems a los setItems existentes que mutan datos**

Los setItems que vienen de las vistas (ViewTareas, etc.) llegan a través de las props `setItems` que se pasan. Localizar en el `return (` de CerebralApp donde se pasan las props a las vistas. Buscar los props `setItems={setItems}` y `setContactos={setContactos}` que se pasan a las vistas (hay varios, uno por vista). Cada uno debe ser reemplazado por `setItems={handleSetItems}` y `setContactos={handleSetContactos}`.

Ejecutar este grep para encontrar todos los lugares:
```bash
grep -n "setItems={setItems}\|setContactos={setContactos}" src/App.jsx
```

Para cada línea encontrada, reemplazar `setItems={setItems}` por `setItems={handleSetItems}` y `setContactos={setContactos}` por `setContactos={handleSetContactos}`.

- [ ] **Step 3: Conectar handleUpsertSettings a los cambios de settings**

Los cambios de `darkMode`, `mood`, `diario`, `personality` y `googleConnectedEmail` ya persisten en localStorage via useEffect. Agregar la sync a Supabase conectando `handleUpsertSettings` a los efectos existentes.

Localizar el bloque de efectos de persistencia (línea ~4204):
```js
  useEffect(() => {
    localStorage.setItem("cerebro_mood", mood);
  }, [mood]);
```

Reemplazar el bloque de los 5 efectos de persistencia de Brite por:

```js
  useEffect(() => {
    localStorage.setItem("cerebro_mood", mood);
    if (session?.user?.id) handleUpsertSettings({ mood });
  }, [mood]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem("cerebro_diario", diario);
    if (session?.user?.id) handleUpsertSettings({ diario });
  }, [diario]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem("cerebro_habits", JSON.stringify(habits));
    if (session?.user?.id) handleUpsertSettings({ habits });
  }, [habits]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem("cerebro_personality", personality);
    if (session?.user?.id) handleUpsertSettings({ personality });
  }, [personality]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem("cerebro_dark", darkMode ? "true" : "false");
    if (session?.user?.id) handleUpsertSettings({ dark_mode: darkMode });
  }, [darkMode]); // eslint-disable-line react-hooks/exhaustive-deps
```

**Nota:** El efecto original de `darkMode` puede estar en otra parte del archivo; buscarlo con `grep -n "cerebro_dark" src/App.jsx` y asegurarse de que solo exista una versión actualizada.

- [ ] **Step 4: Verificar build**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in` sin errores.

- [ ] **Step 5: Smoke test manual — crear tarea y verificar en Supabase**

```bash
npm run dev
```

1. Hacer login
2. Crear una tarea de prueba ("Test Supabase sync")
3. Ir a Supabase Dashboard → Table Editor → items
4. Verificar que la tarea aparece en la tabla con el `user_id` correcto
5. Crear un contacto → verificar en tabla `contactos`

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add optimistic mutation wrappers for Supabase background sync"
```

---

## Task 8: Settings — Guardar API Key de Gemini en Supabase + toast de sync

**Files:**
- Modify: `src/App.jsx`

La API Key de Gemini se guarda opcionalmente en Supabase (en la columna `settings.gemini_api_key`). Cuando el usuario guarda la API Key desde la configuración, se sincroniza con Supabase además del localStorage. También se agrega el toast de "Sincronizando tus datos..." visible durante la migración.

- [ ] **Step 1: Guardar API Key en Supabase al configurarla**

Buscar en App.jsx donde se guarda la API Key. Buscar con:
```bash
grep -n "gemini_api_key\|setApiKey\|tempKey" src/App.jsx | head -20
```

Localizar el handler que guarda la API Key (donde se hace `setApiKey(tempKey)` o similar). Agregar justo después del `setApiKey(...)`:

```js
// Sincronizar API Key con Supabase settings
if (session?.user?.id && tempKey) {
  upsertSettings({ gemini_api_key: tempKey }, session.user.id).catch(err =>
    console.error("[supabase] save API key failed:", err.message)
  );
}
```

- [ ] **Step 2: Agregar toast de sincronización visible durante initUserData**

El `SyncingScreen` ya cubre la pantalla durante el syncing, pero también se puede añadir un toast para el caso de re-sync en segundo plano. Localizar en el `return (` de CerebralApp el `<style>{css}</style>` (línea ~4654) y agregar el toast justo después del div principal del workspace:

Buscar (dentro del return, después de `<style>{css}</style>`):
```jsx
      <div className={`workspace-container${darkMode ? " dark" : ""}`}>
```

Agregar justo después del `<div className...>`:
```jsx
        {/* Toast de sincronización en segundo plano */}
        {syncing && (
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: darkMode ? "#1a1a24" : "#ffffff",
            border: `1px solid ${G.border}`,
            borderRadius: 12, padding: "10px 18px",
            display: "flex", alignItems: "center", gap: 9,
            boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
            zIndex: 9999, fontSize: 13, color: G.textSecondary,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${G.accent}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
            Sincronizando tus datos...
          </div>
        )}
```

**Nota:** El toast solo es visible si `syncing=true` Y la pantalla de la app ya está renderizada. Como el `SyncingScreen` ya se muestra a pantalla completa cuando `syncing=true`, este toast aparecería principalmente en re-syncs posteriores (por ejemplo, al volver a conectarse). Si se quiere que el toast sea siempre visible (incluso en el primer sync), se puede mover la lógica del `SyncingScreen` para que solo bloquee si `items.length === 0 && syncing`.

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in` sin errores.

- [ ] **Step 4: Smoke test final completo**

```bash
npm run dev
```

Verificar el flujo completo:
1. **Sin sesión** → aparece AuthScreen ✓
2. **Registro** → crea cuenta en Supabase Auth ✓
3. **Primer login** → SyncingScreen → datos locales migran a Supabase → app carga ✓
4. **Reload** → sesión persiste, app carga directamente con datos de Supabase ✓
5. **Crear tarea** → aparece en Supabase Table Editor en < 2s ✓
6. **Cambiar darkMode** → actualiza en `settings` de Supabase ✓
7. **Configurar API Key** → se guarda en `settings.gemini_api_key` ✓
8. **Cerrar sesión** → vuelve a AuthScreen ✓
9. **Segundo dispositivo / pestaña** → mismo login → mismos datos ✓ (Realtime puede tardar ~1s)

- [ ] **Step 5: Commit final**

```bash
git add src/App.jsx
git commit -m "feat: sync Gemini API key to Supabase and add sync progress toast"
```

---

## Checklist de spec coverage

| Requisito del spec | Task que lo implementa |
|--------------------|----------------------|
| Supabase como master store | Task 3 (supabase.js) + Task 6 (initUserData) |
| Auth email/contraseña | Task 4 (AuthScreen) + Task 5 (session state) |
| RLS en todas las tablas | Task 2 (SQL) |
| Migración automática localStorage | Task 3 (migrateLocalStorageToSupabase) + Task 6 |
| Sync optimista (UI inmediata) | Task 7 (mutation wrappers) |
| Cola offline + flush al reconectar | Task 3 (enqueue/flushSyncQueue) + Task 5 (online event) |
| Realtime multi-dispositivo | Task 3 (subscribeUserData) + Task 6 (initUserData) |
| Settings sincronizados | Task 7 (handleUpsertSettings) |
| API Key en Supabase | Task 8 |
| SyncingScreen | Task 5 (componente) + Task 8 (toast) |
| Cerrar sesión | Task 6 (signOut button) |
| Variables de entorno .env.local | Task 1 |
| .gitignore actualizado | Task 1 |
