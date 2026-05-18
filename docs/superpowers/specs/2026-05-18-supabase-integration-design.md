# Supabase Integration — Design Spec

**Goal:** Reemplazar localStorage como fuente de datos por Supabase, añadiendo autenticación email/contraseña, sincronización multi-dispositivo en tiempo real, y migración automática de datos existentes.

**Architecture:** Supabase como master store; localStorage como caché offline y cola de reintentos. React state como fuente de verdad en memoria. Las vistas no conocen Supabase — la capa de sync vive exclusivamente en `src/lib/supabase.js` y `App.jsx`.

**Tech Stack:** React 18, Vite 5, @supabase/supabase-js v2, Supabase Auth, Supabase Realtime, Supabase Vault (API Key cifrada)

---

## 1. Arquitectura general

```
React State (fuente de verdad en memoria)
      ↕ sync                    ↕ sync
localStorage (caché offline)   Supabase (master store)
                                     ↕ Realtime websocket
                             Otros dispositivos del usuario
```

**Flujo de operación normal:**
1. App arranca → `supabase.auth.getSession()` → si sesión activa, carga datos de Supabase → hidrata React state
2. Si no hay sesión → renderiza `<AuthScreen>` fullscreen
3. Cada mutación → actualiza React state inmediatamente (UI instantánea) → escribe a Supabase en background → actualiza localStorage como caché
4. Si Supabase falla → encola en `cerebro_sync_queue` en localStorage → `flushSyncQueue()` al reconectar
5. Supabase Realtime → cambios desde otros dispositivos llegan por websocket → actualizan React state

**Principio clave:** Las vistas (ViewTareas, ViewReuniones, etc.) reciben `items` y `setItems` como props exactamente igual que hoy. Cero cambios en las vistas.

---

## 2. Nuevos archivos

```
src/
  lib/
    supabase.js          ← cliente Supabase + todas las funciones CRUD + realtime
  components/
    AuthScreen.jsx       ← modal fullscreen de login/registro (autónomo)
.env.local               ← VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (no commiteado)
```

---

## 3. Esquema de base de datos

Todas las tablas tienen Row Level Security (RLS). Política universal: `auth.uid() = user_id`.

### `profiles`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | = auth.users.id |
| email | text | |
| nombre | text | nullable |
| created_at | timestamptz | |

Creada automáticamente via trigger en `auth.users`.

### `settings` (1:1 con profiles)
| Columna | Tipo | Notas |
|---|---|---|
| user_id | uuid PK FK | |
| gemini_api_key | text | nullable, cifrado con Supabase Vault |
| google_email | text | nullable |
| personality | text | default 'profesional' |
| dark_mode | bool | default false |
| mood | text | nullable |
| diario | text | nullable |
| habits | jsonb | nullable |

### `items`
| Columna | Tipo | Notas |
|---|---|---|
| id | text PK | conserva uid() existente |
| user_id | uuid FK | |
| tipo | text | tarea \| nota \| gasto \| reunion \| recordatorio |
| texto | text | |
| datos | jsonb | nullable |
| hecho | bool | default false |
| fecha | date | nullable |
| columna | text | nullable (kanban) |
| creado | timestamptz | |
| updated_at | timestamptz | auto-updated via trigger |

### `contactos`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| nombre | text | |
| empresa | text | nullable |
| cargo | text | nullable |
| email | text | nullable |
| telefono | text | nullable |
| whatsapp | text | nullable |
| notas | text | nullable |
| created_at | timestamptz | |

### `eventos`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| titulo | text | |
| fecha | date | |
| hora | text | nullable |
| loc | text | nullable |
| color | text | nullable |
| tipo | text | nullable |
| created_at | timestamptz | |

### `messages` (historial chat IA)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| role | text | user \| assistant |
| content | text | |
| created_at | timestamptz | |

---

## 4. RLS — política estándar para todas las tablas

```sql
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only" ON items
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Repetir para: contactos, eventos, messages, settings, profiles.

---

## 5. AuthScreen — `src/components/AuthScreen.jsx`

Componente fullscreen autónomo. Props: `onAuth(session)`, `darkMode`.

**UI:**
- Logo + nombre de la app
- Toggle Login / Registro
- Campos: email, contraseña (con toggle ver/ocultar), nombre (solo en registro)
- Botón de acción principal
- Mensajes de error inline
- Texto de seguridad: "Tus datos se sincronizan en todos tus dispositivos de forma segura"

**Lógica:**
```js
// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Registro
const { data, error } = await supabase.auth.signUp({ email, password,
  options: { data: { nombre } } })
```

Al éxito llama `onAuth(data.session)`.

---

## 6. Capa de sync — `src/lib/supabase.js`

### Cliente
```js
import { createClient } from "@supabase/supabase-js"
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Funciones exportadas

```js
// Carga inicial — todo en paralelo
loadAllUserData(userId)
  → { items: [], contactos: [], eventos: [], messages: [], settings: {} }

// Items — upsert batch (insert o update según id existente)
syncItems(items, userId)
deleteItem(id, userId)

// Contactos
syncContactos(contactos, userId)
deleteContacto(id, userId)

// Eventos
syncEventos(eventos, userId)
deleteEvento(id, userId)

// Settings
loadSettings(userId)     → settings object
upsertSettings(patch, userId)   // patch parcial

// Messages
appendMessage({ role, content }, userId)
loadMessages(userId, limit=100)

// Cola offline
flushSyncQueue(userId)   // procesa cerebro_sync_queue

// Realtime
subscribeUserData(userId, handlers)   // → canal Supabase
unsubscribeUserData(canal)
```

### Cola offline
Si cualquier operación de sync lanza error de red:
```js
const queue = JSON.parse(localStorage.getItem("cerebro_sync_queue") || "[]")
queue.push({ table, operation, payload, timestamp: Date.now() })
localStorage.setItem("cerebro_sync_queue", JSON.stringify(queue))
```
`flushSyncQueue` corre al detectar `online` event del navegador.

---

## 7. Migración automática de localStorage

Corre una sola vez por usuario, justo después del primer login exitoso.

```js
async function migrateLocalStorageToSupabase(userId) {
  const migKey = `cerebro_migrated_${userId}`
  if (localStorage.getItem(migKey)) return

  // Recolectar datos locales
  const items     = JSON.parse(localStorage.getItem("cerebro_items")     || "[]")
  const contactos = JSON.parse(localStorage.getItem("cerebro_contactos") || "[]")
  const eventos   = JSON.parse(localStorage.getItem("cerebro_eventos")   || "[]")
  const messages  = JSON.parse(localStorage.getItem("cerebro_messages")  || "[]")
  const settings  = {
    dark_mode:   localStorage.getItem("cerebro_dark") === "true",
    mood:        localStorage.getItem("cerebro_mood"),
    diario:      localStorage.getItem("cerebro_diario"),
    habits:      JSON.parse(localStorage.getItem("cerebro_habits") || "null"),
    personality: localStorage.getItem("cerebro_personality") || "profesional",
    google_email: localStorage.getItem("cerebro_google_email") || null,
  }

  // Subir en paralelo
  await Promise.all([
    items.length     ? syncItems(items, userId)         : null,
    contactos.length ? syncContactos(contactos, userId) : null,
    eventos.length   ? syncEventos(eventos, userId)     : null,
    messages.length  ? bulkInsertMessages(messages, userId) : null,
    upsertSettings(settings, userId),
  ].filter(Boolean))

  localStorage.setItem(migKey, "1")
}
```

Muestra toast "Sincronizando tus datos..." mientras corre. Los datos en localStorage se conservan como respaldo pero ya no son la fuente de verdad.

---

## 8. Cambios en App.jsx

### Nuevos states
```js
const [session, setSession] = useState(null)
const [syncing, setSyncing] = useState(false)   // toast de migración
```

### Init de sesión
```js
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session)
    if (data.session) initUserData(data.session.user.id)
  })
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
    setSession(s)
    if (s) initUserData(s.user.id)
  })
  return () => subscription.unsubscribe()
}, [])
```

### initUserData
```js
async function initUserData(userId) {
  setSyncing(true)
  await migrateLocalStorageToSupabase(userId)   // no-op si ya migró
  const data = await loadAllUserData(userId)
  setItems(data.items)
  setContactos(data.contactos)
  setMessages(data.messages)
  // ... resto
  setSyncing(false)
  subscribeUserData(userId, { onItemsChange, onContactosChange })
}
```

### Wrappers de mutación (patrón optimista)
```js
function handleSetItems(updater) {
  const next = typeof updater === "fn" ? updater(items) : updater
  setItems(next)
  localStorage.setItem("cerebro_items", JSON.stringify(next))
  syncItems(next, session.user.id).catch(() => enqueueSyncItems(next))
}
```

### Renderizado condicional
```js
if (!session) return <AuthScreen onAuth={setSession} darkMode={darkMode} />
if (syncing)  return <SyncingScreen />   // pantalla simple "Cargando tus datos..."
```

### Cerrar sesión
```js
await supabase.auth.signOut()
// session se pone null via onAuthStateChange → vuelve a AuthScreen
```

---

## 9. Variables de entorno

`.env.local` (nunca en git):
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

`.gitignore` ya debe incluir `.env.local`. Agregar si no está.

---

## 10. Consideraciones de seguridad

- **Gemini API Key:** si el usuario elige guardarla en Supabase, se almacena en `settings.gemini_api_key` usando Supabase Vault (`pgsodium`). Nunca viaja en texto plano en las queries de la app.
- **RLS obligatorio:** ninguna tabla es accesible sin `auth.uid() = user_id`. La anon key sola no sirve para leer datos de otros usuarios.
- **`.env.local` nunca se commitea.** La anon key de Supabase es pública por diseño (va al cliente), pero RLS la hace segura.
- **Contraseñas:** manejadas 100% por Supabase Auth. La app nunca ve ni almacena contraseñas.

---

## 11. Orden de implementación

1. Crear proyecto Supabase + esquema SQL + RLS
2. `src/lib/supabase.js` — cliente + funciones CRUD
3. `src/components/AuthScreen.jsx` — login/registro UI
4. Migración automática en App.jsx
5. `initUserData` + wrappers optimistas en App.jsx
6. Realtime subscriptions
7. Settings: guardar API Key opcional en Vault
8. Toast de sync + pantalla de carga inicial
