# Cerebro Personal — Rediseño v2

**Fecha:** 2026-05-17  
**Estado:** Aprobado  
**Proyecto:** `/Users/javierospina/.gemini/antigravity/scratch/cerebro-personal`

---

## Problema

El layout actual renderiza dos paneles en paralelo (grid de 2 columnas en el componente raíz), lo que duplica la interfaz visualmente. Además, la IA es un elemento secundario en lugar del centro de control. Las vistas tienen nombres metafóricos (Hall, Office, Park) poco intuitivos.

---

## Objetivo

Rediseñar `App.jsx` como una app de un solo panel con:
1. Sidebar fijo a la izquierda con navegación clara
2. La IA como zona principal de interacción
3. Tres widgets de contexto siempre visibles
4. Sin duplicación de layout

---

## Arquitectura

### Layout

```
┌─────────────────────────────────────────────┐
│  Sidebar (220px)  │     Main content         │
│  ─────────────── │  ─────────────────────── │
│  Avatar usuario   │  Topbar (saludo + focus) │
│                   │  ─────────────────────── │
│  [Inicio]         │  Chat IA (flex: 1)       │
│  [Tareas]     3   │    mensajes scroll       │
│  [Notas]          │    ─────────────────     │
│  [Finanzas]       │    CaptureBar (sticky)   │
│  ─────────────── │  ─────────────────────── │
│  [Conexiones]     │  Widgets row (3 cols)    │
│  [Configuración]  │  Tareas│Gastos│Nota      │
│                   │                          │
│  IA Activa ●      │                          │
└─────────────────────────────────────────────┘
```

### Componentes resultantes

| Componente | Responsabilidad |
|---|---|
| `Sidebar` | Navegación, badge de tareas pendientes, estado de IA |
| `Topbar` | Saludo personalizado, fecha/clima, chip de enfoque |
| `ChatArea` | Scroll de mensajes, estado de la IA (orb) |
| `CaptureBar` | Input de texto + micrófono, sticky al fondo del chat |
| `WidgetsRow` | 3 widgets: TareasWidget, GastosWidget, NotaWidget |
| `ViewTareas` | Kanban completo (reemplaza ViewOffice) |
| `ViewNotas` | Notas y diario (reemplaza ViewPark) |
| `ViewFinanzas` | Ledger de gastos (reemplaza FinanceLedger) |

---

## Inteligencia Artificial — Detección de Intención

La IA (Gemini) recibe todos los mensajes del chat y debe detectar la intención antes de responder. El sistema prompt incluye instrucciones para:

### Intenciones reconocidas

| Intención | Ejemplo de texto | Acción |
|---|---|---|
| `CREATE_TASK` | "agrega tarea X para el jueves" | Llama `handleAddItem(texto, "tarea")` con fecha parseada |
| `LOG_EXPENSE` | "gasté $45k en almuerzo" | Llama `handleAddGasto({monto, categoria, descripcion})` |
| `SAVE_NOTE` | "anota: [texto]" / "recuerda que..." | Llama `handleAddItem(texto, "nota")` |
| `GENERAL` | cualquier otra cosa | Responde en conversación libre |

### Respuesta estructurada de la IA

Gemini devuelve JSON cuando detecta una acción:
```json
{
  "intent": "CREATE_TASK",
  "action": { "texto": "Revisar presupuesto bodega Bacca", "fecha": "2026-05-20" },
  "reply": "✓ Tarea creada: \"Revisar presupuesto bodega Bacca\" — vence el miércoles 21 de mayo."
}
```

Para `GENERAL`, devuelve solo texto libre sin JSON.

---

## Vistas secundarias

Al navegar desde el sidebar, el área principal se reemplaza con la vista completa:

- **Tareas** → Kanban de 3 columnas (Pendiente / En progreso / Listo), creación rápida inline
- **Notas & Diario** → Lista de notas con editor expandible, autosave
- **Finanzas** → Tabla de gastos, totales por categoría, barra de presupuesto

El chat de IA siempre está accesible desde Inicio.

---

## Estado global

Un solo `useState` en `CerebralApp` con:

```js
{
  items: [],        // tareas + notas (tipo: "tarea" | "nota")
  gastos: [],       // { id, monto, categoria, descripcion, fecha }
  messages: [],     // historial de chat IA
  vista: "inicio",  // "inicio" | "tareas" | "notas" | "finanzas"
  focus: "enfocado" // estado de enfoque del día
}
```

---

## Criterios de éxito

- [ ] Un solo panel visible (sin doble layout)
- [ ] Sidebar funcional con navegación entre las 4 vistas
- [ ] Chat de IA crea tareas al recibir "agrega tarea X"
- [ ] Chat de IA registra gastos al recibir "gasté $X en Y"
- [ ] Chat de IA guarda notas al recibir "anota: X"
- [ ] Los 3 widgets se actualizan en tiempo real
- [ ] Build exitoso sin errores

---

## Fuera de alcance

- Integración real con Google Calendar / Outlook (queda como modal de configuración existente)
- Autenticación de usuarios
- Sincronización en la nube
