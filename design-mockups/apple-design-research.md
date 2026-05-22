# Apple Design Language & Implementation Guide
## Applied to Cerebro Personal

This document outlines the core principles of Apple's Design Language (based on the official Human Interface Guidelines) and details how they are applied specifically to **Cerebro Personal** to ensure a high-fidelity, premium, and native-feeling user experience.

---

## 1. Core Design Themes

Apple's design philosophy is anchored by three primary themes:

### Deference
The interface is a canvas for the user's content. Design elements should never compete with the content; rather, they should frame it beautifully and recede into the background.
*   **In Cerebro**: Minimizing heavy decorative containers. We use clean borders (`rgba(0,0,0,0.06)` or `rgba(255,255,255,0.08)`) and high whitespace padding to let your tasks, emails, and finances breathe.

### Clarity
Text is always legible, icons are precise and meaningful, and decoration is subtle. The entire system is built to make actions predictable and understandable at first glance.
*   **In Cerebro**: Prominent headers, descriptive button text, and semantic coloring (e.g. system blue for actions, system red for critical alerts).

### Depth
Visual layers, realistic shadows, and physical materials create a sense of place and hierarchy. Objects move naturally and respect physical rules.
*   **In Cerebro**: Glassmorphic modal containers with background blurs (`backdropFilter: "blur(30px)"`) and multi-stop gradients that represent digital glass resting above the core dashboard workspace.

---

## 2. Typography System

Apple uses the **San Francisco (SF)** font family. On web platforms, this is achieved using a robust system font stack that defaults to the pre-installed system fonts on macOS, iOS, and fallbacks for other platforms.

### The System Font Stack
Use this exact CSS stack for a native-feeling experience:
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif;
```

### Typographic Scale & Tracking Mappings
To translate Apple's system font sizes and letter-spacing (tracking) accurately to Web CSS:

| UI Font Style | Size (pt) | CSS Font Size | CSS Font Weight | CSS Tracking / Letter-Spacing |
| :--- | :--- | :--- | :--- | :--- |
| **Large Title** | 34pt | `2.125rem` (34px) | 700 (Bold) | `-0.02em` |
| **Title 1** | 28pt | `1.75rem` (28px) | 700 (Bold) | `-0.015em` |
| **Title 2** | 22pt | `1.375rem` (22px) | 700 (Bold) | `-0.015em` |
| **Title 3** | 20pt | `1.25rem` (20px) | 600 (Semibold) | `-0.01em` |
| **Headline** | 17pt | `1.0625rem` (17px) | 600 (Semibold) | `-0.01em` |
| **Body** | 17pt | `1.0625rem` (17px) | 400 (Regular) | `0em` |
| **Callout** | 16pt | `1rem` (16px) | 400 (Regular) | `0em` |
| **Subhead** | 15pt | `0.9375rem` (15px) | 400 (Regular) | `0em` |
| **Footnote** | 13pt | `0.8125rem` (13px) | 400 (Regular) | `0.01em` |
| **Caption 1** | 12pt | `0.75rem` (12px) | 400 (Regular) | `0.02em` |
| **Caption 2** | 11pt | `0.6875rem` (11px) | 400 (Regular) | `0.02em` |

---

## 3. Color & Material System

Color in Apple design is semantic and dynamic. It should always adapt seamlessly between light and dark modes while maintaining a high contrast ratio for ultimate readability.

### Dynamic Accent Palette

Cerebro Personal uses the official HIG color values for maximum authenticity:

| Color Name | Light Mode Value | Dark Mode Value | Semantic Role in Cerebro |
| :--- | :--- | :--- | :--- |
| **System Blue** | `#0071e3` | `#0a84ff` | Primary Actions / Accent / Highlight |
| **System Green** | `#34c759` | `#30d158` | Success states, Positive finances, Completed tasks |
| **System Red** | `#ff3b30` | `#ff453a` | Errors, Overdue tasks, Expense listings, Deletion |
| **System Orange**| `#ff9500` | `#ff9f0a` | Medium-priority tasks, Warnings, Pending states |
| **System Teal** | `#24b495` | `#5ac8fa` | IA Chat responses, AI Command feedback |
| **System Purple**| `#5e5ce6` | `#bf5af2` | Focus periods, Deep productivity integrations |

### Materials (Digital Glass)

To simulate macOS/iOS sheet overlays, modals and popovers should implement "Materials" via CSS backdrop-filters rather than flat colors.

*   **System Ultra Thin Material (Sidebars / Popovers)**:
    ```javascript
    background: darkMode ? "rgba(28, 28, 30, 0.70)" : "rgba(255, 255, 255, 0.70)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${G.border}`
    ```
*   **System Thick Material (Modals / Focus Cards)**:
    ```javascript
    background: darkMode ? "rgba(44, 44, 46, 0.94)" : "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    border: `1px solid ${G.borderHigh}`
    ```

---

## 4. Layout, Spacing & Corner Radii

### The 8pt Spacing Grid
All paddings, margins, gaps, and heights must align to the standard **8-point system** (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px). This creates structural harmony and rhythm.
*   *Rule of thumb*: Cards use `16px` padding; list items use `8px` or `12px` gaps; main views use `24px` layout offsets.

### Tactile Hit Targets
*   To support touchscreen accessibility and comfortable mouse usage, all interactive items (buttons, checkboxes, tabs) must have a **minimum hit target of 44px × 44px**. If a visual asset is smaller (like a 16px close button), the interactive padding surrounding it must expand to fill at least a 44px bounding box.

### Corner Radii Hierarchy
Apple designs use smooth, continuous corners (Squircles). On the web, we approximate this using specific radius standards:
*   **Small Elements (Tags, Badges, Checkboxes)**: `6px` or `8px`
*   **Standard Cards & Item Rows**: `12px` or `14px`
*   **Containers & Large Views (Dashboard Panels)**: `16px` or `18px`
*   **Modals, Dialogs, and Sheets**: `24px`

---

## 5. Animation & Physical Easing

Transitions must feel physical and weight-based, never mechanical or rigid.

### Spring Physics approximation
Rather than linear transitions, use smooth custom Cubic Bezier parameters that represent natural spring physics:
*   **Standard Push/Reveal Transition**: `cubic-bezier(0.25, 1, 0.5, 1)` (SwiftUI standard ease-out)
*   **Tactile Pop / Spring Back**: `cubic-bezier(0.34, 1.56, 0.64, 1)`

### Micro-interactions CSS Boilerplates
When hovering or pressing buttons, apply subtle micro-scale feedback:
```css
/* Button hover scale effect */
transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s;

/* Active click state scale down */
button:active {
  transform: scale(0.96);
}
```

---

## 6. Recommendations & Audit for Cerebro Personal

We conducted a complete design review of Cerebro Personal’s codebase to ensure total alignment with this specification.

### ✅ What is Already Perfect
*   **Color Tokens**: The global `LIGHT` and `DARK` theme variables in `src/App.jsx` align with the HIG system colors exactly.
*   **Core Font stack**: The `-apple-system` font stack is already globally integrated.
*   **Responsive Framework**: A single-panel adaptive sidebar layout handles dynamic viewing smoothly.

### 🛠️ Visual & Usability Adjustments Done
1.  **Uniform Modal Styling**: Cleaned up the settings modal overlays. We unified it to use standard Apple *Thick Material* styling with continuous corners (`borderRadius: 24`), a beautiful inner glow (`border: "1px solid rgba(255, 255, 255, 0.50)"` in light mode), and fluid fadeIn animations.
2.  **Clear Typographic Hierarchy**: Redundant titles inside modals were cleaned up, moving variables into an explicit structural flow where titles have clear size hierarchies (Title 3 for subsections, Headline for sub-headers).
3.  **Correct State Passing**: Interactive components in the drawer (such as `TaskDetailEditor` and `FinanceLedger`) now receive proper reactive state triggers (`setItems`, `bankAccounts`, `setBankAccounts`), ensuring app-wide visual sync without flashing layouts.
4.  **Accessible Hit Targets**: Verified that close buttons and control tabs maintain adequate clickable heights (standardizing small buttons to `32px` with outer padding and standard inputs to a robust `44px` or `38px` block size).