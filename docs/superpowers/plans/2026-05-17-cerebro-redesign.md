# Cerebro Personal — Rediseño v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el layout doble-panel con un diseño de un solo panel donde la IA es el centro de control, con sidebar limpio de 4 secciones y 3 widgets de contexto siempre visibles en el inicio.

**Architecture:** Se crean dos componentes nuevos (`ViewInicio`, `WidgetsRow`) y se hacen 5 ediciones quirúrgicas en `App.jsx` — sin tocar los componentes existentes (`ViewOffice`, `ViewPark`, `FinanceLedger`, `CaptureBar`, `MemoryOrb`). No hay reescritura completa.

**Tech Stack:** React 18, Vite 5, JavaScript (no TypeScript), inline styles (patrón existente), Gemini API

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/views/ViewInicio.jsx` | Crear | Muestra historial de chat de la IA |
| `src/components/WidgetsRow.jsx` | Crear | 3 widgets de contexto (tareas, gastos, nota) |
| `src/App.jsx` | Modificar | 5 ediciones: navItems, icon render, header titles, content routing, handleCaptura |

---

## Task 1: Crear `WidgetsRow.jsx`

**Files:**
- Create: `src/components/WidgetsRow.jsx`

- [ ] **Step 1: Crear el archivo con el componente**

```jsx
// src/components/WidgetsRow.jsx
const G = {
  textPrimary: "#1d1d1f",
  textSecondary: "#515154",
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
        <div style={sub}>para hoy</div>
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
          <>
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
            <span style={tag(G.accentSoft, G.accent)}>ver nota</span>
          </>
        ) : (
          <div style={sub}>Sin notas aún</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que el archivo existe**

```bash
ls /Users/javierospina/.gemini/antigravity/scratch/cerebro-personal/src/components/
```

Expected: `WidgetsRow.jsx` aparece en el listado.

---

## Task 2: Crear `ViewInicio.jsx`

**Files:**
- Create: `src/views/ViewInicio.jsx`

Este componente muestra el historial de chat. La CaptureBar sigue estando en `App.jsx` (sticky bottom global) — `ViewInicio` solo maneja los mensajes.

- [ ] **Step 1: Crear el archivo**

```jsx
// src/views/ViewInicio.jsx
import { useEffect, useRef } from "react";

const G = {
  textPrimary: "#1d1d1f",
  textSecondary: "#515154",
  textTertiary: "#86868b",
  accent: "#0071e3",
  accentSoft: "rgba(0, 113, 227, 0.06)",
  border: "rgba(0, 0, 0, 0.08)",
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
              key={i}
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
```

- [ ] **Step 2: Verificar que el archivo existe**

```bash
ls /Users/javierospina/.gemini/antigravity/scratch/cerebro-personal/src/views/
```

Expected: `ViewInicio.jsx` aparece en el listado.

---

## Task 3: Editar `App.jsx` — 5 cambios quirúrgicos

**Files:**
- Modify: `src/App.jsx`

Todos los cambios son ediciones puntuales. Leer el archivo antes de editar (ya leído en contexto).

### Cambio A — `navItems` array (línea ~3299)

- [ ] **Step 1: Reemplazar el array navItems**

Buscar y reemplazar exactamente:

```js
// ANTES (líneas 3299-3303):
  const navItems = [
    { id: "hall", icon: Icon.home, label: "Hall" },
    { id: "office", icon: Icon.task, label: "Office" },
    { id: "park", icon: Icon.park, label: "Park" },
  ];
```

```js
// DESPUÉS:
  const navItems = [
    { id: "inicio", emoji: "⌂", label: "Inicio" },
    { id: "tareas", emoji: "✓", label: "Tareas" },
    { id: "notas", emoji: "✏", label: "Notas & Diario" },
    { id: "finanzas", emoji: "$", label: "Finanzas" },
  ];
```

### Cambio B — `vista` estado inicial (línea ~3072)

- [ ] **Step 2: Cambiar el estado inicial de vista**

```js
// ANTES:
  const [vista, setVista] = useState("hall");
```

```js
// DESPUÉS:
  const [vista, setVista] = useState("inicio");
```

### Cambio C — Render del icono en el sidebar (línea ~3437)

- [ ] **Step 3: Cambiar el render del ícono y la etiqueta del nav item**

```jsx
// ANTES (dentro del navItems.map):
                  <span style={{ color: active ? G.accent : G.textTertiary, display: "flex" }}>
                    <n.icon />
                  </span>
                  <span>
                    {n.id === "hall" ? "Panel de Control" : n.id === "office" ? "Productividad Kanban" : "Área de Notas"}
                  </span>
```

```jsx
// DESPUÉS:
                  <span style={{ fontSize: 14 }}>{n.emoji}</span>
                  <span>{n.label}</span>
```

También agregar el badge de tareas pendientes después del `<span>{n.label}</span>`:

```jsx
                  <span style={{ fontSize: 14 }}>{n.emoji}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {n.id === "tareas" && items.filter(i => (i.tipo === "tarea" || i.tipo === "recordatorio") && !i.hecho).length > 0 && (
                    <span style={{
                      background: G.accent, color: "white", borderRadius: 10,
                      padding: "1px 7px", fontSize: 10, fontWeight: 700
                    }}>
                      {items.filter(i => (i.tipo === "tarea" || i.tipo === "recordatorio") && !i.hecho).length}
                    </span>
                  )}
```

### Cambio D — Título del header (línea ~3646)

- [ ] **Step 4: Actualizar los títulos del header**

```jsx
// ANTES:
              {vista === "hall" && "Panel de Control"}
              {vista === "office" && "Productividad Kanban"}
              {vista === "park" && "Área de Notas"}
```

```jsx
// DESPUÉS:
              {vista === "inicio" && "Cerebro Personal"}
              {vista === "tareas" && "Tareas"}
              {vista === "notas" && "Notas & Diario"}
              {vista === "finanzas" && "Finanzas"}
```

### Cambio E — Routing de vistas (líneas ~3692-3724) + agregar WidgetsRow

- [ ] **Step 5: Agregar imports al inicio de App.jsx**

Al inicio del archivo, después de `import { useState, useEffect, useRef } from "react";`, agregar:

```js
import ViewInicio from "./views/ViewInicio.jsx";
import WidgetsRow from "./components/WidgetsRow.jsx";
import FinanceLedger from "./views/ViewFinanzas.jsx";
```

Nota: `FinanceLedger` se extraerá en el Task 4. Por ahora dejar este import comentado.

- [ ] **Step 6: Reemplazar el bloque de routing de vistas**

```jsx
// ANTES (líneas ~3690-3725):
          {/* Área del Contenido de la Vista Activa */}
          <div style={{ flex: 1, padding: "24px 24px 40px", overflowY: "auto" }}>
            {vista === "hall" && (
              <ViewHall 
                items={items} 
                onNav={setVista} 
                onQuickCapture={handleCaptura} 
                onToggle={handleToggle}
                googleConnected={googleConnected}
                googleConnectedEmail={googleConnectedEmail}
                googleScopes={googleScopes}
                onConnectGoogle={() => {
                  setShowConfig(true);
                  setConfigTab("connections");
                  setSimulatingConnection("google");
                  setSimulatingStep(1);
                }}
                onOpenDrawer={handleOpenDrawer}
              />
            )}
            {vista === "office" && (
              <ViewOffice 
                items={items} 
                onToggle={handleToggle} 
                onDelete={handleDelete}
                onOpenDrawer={handleOpenDrawer}
              />
            )}
            {vista === "park" && (
              <ViewPark 
                items={items} 
                onDelete={handleDelete}
                onOpenDrawer={handleOpenDrawer}
              />
            )}
          </div>
```

```jsx
// DESPUÉS:
          {/* Área del Contenido de la Vista Activa */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {vista === "inicio" && (
              <ViewInicio messages={messages} isLoading={isLoading} />
            )}
            {vista === "tareas" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 40px" }}>
                <ViewOffice
                  items={items}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onOpenDrawer={handleOpenDrawer}
                />
              </div>
            )}
            {vista === "notas" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 40px" }}>
                <ViewPark
                  items={items}
                  onDelete={handleDelete}
                  onOpenDrawer={handleOpenDrawer}
                />
              </div>
            )}
            {vista === "finanzas" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 40px" }}>
                <FinanceLedger
                  items={items}
                  setItems={setItems}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </div>

          {/* Widgets — solo visibles en Inicio */}
          {vista === "inicio" && <WidgetsRow items={items} />}
```

### Cambio F — Quitar auto-navegación en handleCaptura (líneas ~3275-3279)

- [ ] **Step 7: Eliminar el auto-navigate tras captura**

```js
// ANTES (dentro de handleCaptura, al final del forEach):
      if (hasOffice) {
        setVista("office");
      } else if (hasPark) {
        setVista("park");
      }
```

```js
// DESPUÉS: eliminar esas líneas y también las variables hasOffice y hasPark
// Quedan solo las líneas que crean el newItem y llaman setItems
```

Específicamente, dentro del bloque `itemsToProcess.forEach`, eliminar:
```js
          if (item.tipo === "tarea" || item.tipo === "recordatorio") {
            hasOffice = true;
          } else if (item.tipo === "nota" || item.tipo === "gasto" || item.tipo === "burbuja") {
            hasPark = true;
          }
```
Y eliminar las declaraciones:
```js
      let hasOffice = false;
      let hasPark = false;
```
Y eliminar el bloque if/else if al final:
```js
      if (hasOffice) {
        setVista("office");
      } else if (hasPark) {
        setVista("park");
      }
```

---

## Task 4: Extraer `FinanceLedger` como vista navegable

**Files:**
- Create: `src/views/ViewFinanzas.jsx`
- Modify: `src/App.jsx` (agregar import)

`FinanceLedger` ya existe en `App.jsx`. Se copia a un archivo separado y se importa.

- [ ] **Step 1: Identificar el bloque completo de FinanceLedger**

Leer `App.jsx` desde la línea 1864 hasta aproximadamente la línea 2013 (toda la función `FinanceLedger`).

- [ ] **Step 2: Crear `src/views/ViewFinanzas.jsx`**

Copiar el contenido de la función `FinanceLedger` (incluyendo los imports que necesita) en el nuevo archivo:

```jsx
// src/views/ViewFinanzas.jsx
import { useState } from "react";

const G = {
  textPrimary: "#1d1d1f",
  textSecondary: "#515154",
  textTertiary: "#86868b",
  accent: "#0071e3",
  accentSoft: "rgba(0, 113, 227, 0.06)",
  coral: "#ff3b30",
  coralSoft: "rgba(255, 59, 48, 0.06)",
  coralGlow: "rgba(255, 59, 48, 0.15)",
  green: "#34c759",
  greenSoft: "rgba(52, 199, 89, 0.06)",
  amber: "#ff9500",
  border: "rgba(0, 0, 0, 0.08)",
};

function now() { return new Date().toISOString(); }
function uid() { return Math.random().toString(36).slice(2, 9); }

// [PEGAR AQUÍ EL CUERPO COMPLETO DE FinanceLedger desde App.jsx línea 1864]
// Cambiar "function FinanceLedger" por "export default function FinanceLedger"
```

**Instrucción exacta:** Leer App.jsx líneas 1864–2013, copiar el bloque completo, cambiar la primera línea de `function FinanceLedger(` a `export default function FinanceLedger(`, y pegar en el nuevo archivo después de las declaraciones de G, now() y uid().

- [ ] **Step 3: Activar el import en App.jsx**

En `App.jsx`, al inicio del archivo, agregar:

```js
import ViewInicio from "./views/ViewInicio.jsx";
import WidgetsRow from "./components/WidgetsRow.jsx";
import FinanceLedger from "./views/ViewFinanzas.jsx";
```

**Importante:** Una vez activo el import de `FinanceLedger` desde `ViewFinanzas.jsx`, la función `FinanceLedger` que queda definida en `App.jsx` ya no es necesaria. Dejarla en su lugar no causará error (solo duplicación), pero si quieres limpiar, eliminar el bloque de la función original en `App.jsx` (líneas ~1864-2013).

---

## Task 5: Verificar build y comportamiento visual

**Files:** Ninguno (verificación)

- [ ] **Step 1: Correr el build**

```bash
cd /Users/javierospina/.gemini/antigravity/scratch/cerebro-personal && npm run build
```

Expected: `✓ built in Xms` sin errores.

- [ ] **Step 2: Levantar el servidor de desarrollo**

```bash
cd /Users/javierospina/.gemini/antigravity/scratch/cerebro-personal && npm run dev
```

Expected: `Local: http://localhost:5173/`

- [ ] **Step 3: Checklist visual en el browser**

Abrir `http://localhost:5173` y verificar:

- [ ] Solo hay un panel visible (no doble layout)
- [ ] Sidebar muestra: Inicio ✓, Tareas, Notas & Diario, Finanzas
- [ ] Vista Inicio: saludo + chat vacío con orb + 3 widgets abajo
- [ ] Navegar a Tareas: muestra el Kanban
- [ ] Navegar a Notas: muestra el área de notas  
- [ ] Navegar a Finanzas: muestra el ledger de gastos
- [ ] Escribir en CaptureBar y enviar: mensaje aparece en el chat de Inicio
- [ ] Escribir "agrega tarea: revisar planos" → IA crea la tarea, badge del sidebar se actualiza
- [ ] Badge de Tareas en sidebar muestra número correcto de pendientes

- [ ] **Step 4: Commit**

```bash
cd /Users/javierospina/.gemini/antigravity/scratch/cerebro-personal
git init  # solo si no está inicializado
git add src/views/ViewInicio.jsx src/components/WidgetsRow.jsx src/views/ViewFinanzas.jsx src/App.jsx
git commit -m "feat: rediseño v2 — IA como centro, sidebar 4 secciones, widgets row"
```

---

## Self-Review

**Cobertura del spec:**
- ✅ Un solo panel (fix doble layout) — Cambio E reemplaza hall-grid por layout single-column
- ✅ Sidebar con 4 secciones — Cambio A y C
- ✅ IA como zona principal — Task 2 + Cambio E
- ✅ 3 widgets — Task 1 + Cambio E
- ✅ IA crea tareas/gastos/notas — ya funciona en `handleCaptura`, se mantiene
- ✅ Widgets actualizados en tiempo real — pasan `items` como prop, re-render automático
- ✅ Sin auto-navegación tras captura — Cambio F
- ✅ Finanzas como vista navegable — Task 4

**Nombres consistentes:**
- `WidgetsRow` referenciado igual en Task 1, Task 3 Cambio E, y el import
- `ViewInicio` referenciado igual en Task 2, Task 3 Cambio E, y el import
- `FinanceLedger` es el nombre del componente exportado desde `ViewFinanzas.jsx` — coincide con el uso en el routing del Cambio E
- `handleDelete` existe en App.jsx (línea 3291) ✅
- `handleToggle` existe en App.jsx (línea 3295) ✅
- `handleOpenDrawer` existe en App.jsx (línea 3161) ✅
