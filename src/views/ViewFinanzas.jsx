// src/views/ViewFinanzas.jsx — Gestión de Pagos (portado del CRM Suelos y Estructuras)
import { useState, useMemo, useRef } from "react";
import { callAI } from "../lib/ai.js";
import { supabase } from "../lib/supabase.js";

// ── Tema — CRM Design System — RED=#901B2F  BLUE=#1F3A52 ────────────────────
import { LIGHT as LIGHT_F, DARK as DARK_F } from "../lib/theme.js";
let G = LIGHT_F;

const DEFAULT_PIN = "271925";
const getStoredPin = () => localStorage.getItem("cerebro_finance_pin") || DEFAULT_PIN;

// ── Categorías ────────────────────────────────────────────────────────────────
const CATS_EMPRESA = ["Oficina", "Herramientas", "Transporte", "Servicios", "Impuestos", "Nómina", "Obra"];
const CATS_PERSONAL = ["Vivienda", "Ocio", "Alimentación", "Salud", "Educación", "Otros"];
const ALL_CATS = [...CATS_EMPRESA, ...CATS_PERSONAL];

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }
function fmtMoney(n) { return (n || 0).toLocaleString("es-CO"); }
function today() { return new Date().toISOString().split("T")[0]; }

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = ev => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => {
        const MAX = 1280;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.72));
      };
    };
  });
}

async function analyzeReceiptWithAI(base64DataUrl, apiKey, aiConfig) {
  const cfg = aiConfig ?? { provider: "gemini", apiKey };
  const b64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, "");
  const prompt = `Analiza este comprobante/recibo de pago.
Extrae: descripción del gasto, monto total en pesos colombianos (solo número), fecha (formato YYYY-MM-DD), categoría (una de: Oficina, Herramientas, Transporte, Servicios, Impuestos, Nómina, Obra, Vivienda, Ocio, Alimentación, Salud, Educación, Otros), método de pago (Efectivo, Transferencia, Tarjeta Débito, o Tarjeta Crédito), y detalles adicionales del pago.
Responde ÚNICAMENTE con JSON válido, sin markdown:
{"description":"...","amount":0,"date":"YYYY-MM-DD","category":"Otros","paymentMethod":"Efectivo","paymentDetails":""}`;

  if (cfg.provider === "openai") {
    const base = (cfg.baseUrl || "https://openrouter.ai/api/v1").replace(/\/$/, "");
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cfg.apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Cerebro Personal",
      },
      body: JSON.stringify({
        model: cfg.model || "google/gemini-2.0-flash-exp:free",
        messages: [{ role: "user", content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: base64DataUrl } }
        ]}],
        temperature: 0.1,
      }),
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message ?? `Error ${r.status}`); }
    const d = await r.json();
    const text = d.choices?.[0]?.message?.content?.trim() ?? "";
    return JSON.parse(text.replace(/```json?/g, "").replace(/```/g, "").trim());
  } else {
    // Gemini multimodal
    const gemKey = cfg.apiKey || apiKey;
    const model = cfg.model || "gemini-2.0-flash";
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gemKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: b64 } }
          ]}],
          generationConfig: { temperature: 0.1 }
        }),
      }
    );
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message ?? `Error Gemini ${r.status}`); }
    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    return JSON.parse(text.replace(/```json?/g, "").replace(/```/g, "").trim());
  }
}

// ── Iconos SVG ────────────────────────────────────────────────────────────────
const Ic = {
  creditCard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  plus:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  camera:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  search:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  lock:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  unlock:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  trash:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  pencil:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  x:          () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  building:   () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18"/><line x1="9" y1="21" x2="9" y2="3"/><line x1="15" y1="21" x2="15" y2="3"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/></svg>,
  user:       () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  spinner:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" style={{ animation: "spin 1s linear infinite", transformOrigin: "center" }}/></svg>,
  check:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  mic:        () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
};

// ── Input / Select estilos ────────────────────────────────────────────────────
const iS = () => ({
  width: "100%", padding: "9px 12px", borderRadius: 10, outline: "none",
  border: `1px solid ${G.border}`, background: G.surface, color: G.textPrimary,
  fontSize: 12, fontFamily: "inherit",
});

// ── Componente principal ─────────────────────────────────────────────────────
export default function FinanceLedger({ items, setItems, onDelete, darkMode = false, apiKey, aiConfig, userEmail, bankAccounts: bankAccountsProp, setBankAccounts: setBankAccountsProp }) {
  G = darkMode ? DARK_F : LIGHT_F;

  // ── Cuentas bancarias — usa estado del padre si se pasa, si no usa local ──
  const [bankAccountsLocal, setBankAccountsLocal] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cerebro_bank_accounts") || "[]"); }
    catch { return []; }
  });
  const bankAccounts    = bankAccountsProp    ?? bankAccountsLocal;
  const setBankAccounts = setBankAccountsProp ?? ((list) => {
    setBankAccountsLocal(list);
    localStorage.setItem("cerebro_bank_accounts", JSON.stringify(list));
  });
  // saveBankAccounts es alias de setBankAccounts (ya no escribe localStorage directamente si el padre lo gestiona)
  const saveBankAccounts = setBankAccounts;

  // ── Seguridad PIN ──────────────────────────────────────────────────────────
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // ── Recuperación de clave ─────────────────────────────────────────────────
  // steps: "idle" | "sending" | "otp" | "newpin"
  const [recoveryStep, setRecoveryStep] = useState("idle");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryOtp, setRecoveryOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");

  const handleSendOtp = async () => {
    const email = userEmail;
    if (!email) { setRecoveryError("No hay correo registrado en esta cuenta."); return; }
    setRecoveryStep("sending"); setRecoveryError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      });
      if (error) throw error;
      setRecoveryStep("otp");
    } catch (err) {
      setRecoveryError(err.message || "Error al enviar el correo.");
      setRecoveryStep("idle");
    }
  };

  const handleVerifyOtp = async () => {
    if (recoveryOtp.length < 6) { setRecoveryError("Ingresa el código de 6 dígitos."); return; }
    setRecoveryError("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: recoveryOtp,
        type: "email"
      });
      if (error) throw error;
      setRecoveryStep("newpin");
    } catch {
      setRecoveryError("Código incorrecto o expirado. Intenta de nuevo.");
    }
  };

  const handleSetNewPin = () => {
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setRecoveryError("La clave debe ser exactamente 6 dígitos numéricos."); return;
    }
    if (newPin !== newPinConfirm) {
      setRecoveryError("Las claves no coinciden."); return;
    }
    localStorage.setItem("cerebro_finance_pin", newPin);
    setIsLocked(false);
    setIsBankModalOpen(false);
    setRecoveryStep("idle");
    setRecoveryOtp(""); setNewPin(""); setNewPinConfirm(""); setRecoveryError("");
    setPin(""); setPinError(false);
  };

  const resetRecovery = () => {
    setRecoveryStep("idle"); setRecoveryError("");
    setRecoveryOtp(""); setNewPin(""); setNewPinConfirm("");
  };

  // ── Modales ────────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({ name: "", currentBalance: "", color: "#0071e3", isPersonal: false });

  // ── IA / OCR ───────────────────────────────────────────────────────────────
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStep, setAiStep] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // ── Movimientos por cuenta + informe consolidado ───────────────────────────
  const [movementsAccount, setMovementsAccount] = useState(null);
  const [showConsolidated, setShowConsolidated] = useState(false);

  // ── Formulario ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    descripcion: "", monto: "", fecha: today(),
    categoria: "Otros", isPersonal: false, esIngreso: false,
    paymentMethod: "Transferencia", paymentDetails: "", bankAccountId: "",
  });
  const setF = (patch) => setFormData(p => ({ ...p, ...patch }));

  const resetForm = () => {
    setFormData({ descripcion: "", monto: "", fecha: today(), categoria: "Otros", isPersonal: false, esIngreso: false, paymentMethod: "Transferencia", paymentDetails: "", bankAccountId: "" });
    setReceiptPreview(null);
    setAiResult(null);
    setEditingId(null);
  };

  // ── Datos filtrados ────────────────────────────────────────────────────────
  const gastos = useMemo(() => {
    return items
      .filter(i => i.tipo === "gasto")
      .filter(i => {
        if (activeTab === "empresa") return !i.datos?.isPersonal;
        if (activeTab === "personal") return i.datos?.isPersonal;
        return true;
      })
      .filter(i => {
        const desc = (i.datos?.titulo || i.texto || "").toLowerCase();
        return desc.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        const da = new Date(a.datos?.fecha || a.creado);
        const db = new Date(b.datos?.fecha || b.creado);
        return db - da;
      });
  }, [items, activeTab, searchTerm]);

  // ── Estadísticas mes actual ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const mes = now.getMonth(), anio = now.getFullYear();
    const delMes = items.filter(i => {
      if (i.tipo !== "gasto") return false;
      const d = new Date(i.datos?.fecha || i.creado);
      return d.getMonth() === mes && d.getFullYear() === anio;
    });
    const empresa = delMes.filter(i => !i.datos?.isPersonal).reduce((s, i) => s + (Number(i.datos?.monto) || 0), 0);
    const personal = delMes.filter(i => i.datos?.isPersonal).reduce((s, i) => s + (Number(i.datos?.monto) || 0), 0);
    const total = empresa + personal;
    const catMap = {};
    delMes.forEach(i => {
      const c = i.datos?.categoria || "Otros";
      catMap[c] = (catMap[c] || 0) + (Number(i.datos?.monto) || 0);
    });
    const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { empresa, personal, total, topCats };
  }, [items]);

  // ── OCR: escanear recibo ───────────────────────────────────────────────────
  const handleAiScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAiProcessing(true); setAiStep("Comprimiendo...");
    try {
      const b64 = await compressImage(file);
      setAiStep("Analizando con IA...");
      const result = await analyzeReceiptWithAI(b64, apiKey, aiConfig);
      setAiResult(result);
      setF({
        descripcion: result.description || "",
        monto: result.amount?.toString() || "",
        fecha: result.date || today(),
        categoria: result.category || "Otros",
        isPersonal: (result.category || "").includes("Personal") || (result.category || "").includes("Vivienda") || (result.category || "").includes("Ocio") || (result.category || "").includes("Alimentación") || (result.category || "").includes("Salud") || (result.category || "").includes("Educación"),
        paymentMethod: result.paymentMethod || "Efectivo",
        paymentDetails: result.paymentDetails || "",
      });
      setReceiptPreview(b64);
      setIsModalOpen(true);
    } catch (err) {
      alert("No se pudo analizar la imagen: " + (err.message || "Error desconocido"));
    } finally {
      setIsAiProcessing(false); setAiStep("");
    }
  };

  // ── Voz ───────────────────────────────────────────────────────────────────
  const handleVoice = () => {
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Tu navegador no soporta reconocimiento de voz."); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "es-CO"; rec.interimResults = false;
    rec.onstart = () => { setIsListening(true); };
    rec.onresult = async (ev) => {
      const text = ev.results[0][0].transcript;
      setIsListening(false); setIsAiProcessing(true); setAiStep("Procesando voz...");
      try {
        const cfg = aiConfig ?? { apiKey, provider: "gemini" };
        const prompt = `Del siguiente texto extrae los datos de un gasto. Responde SOLO JSON sin markdown: {"description":"...","amount":0,"date":"YYYY-MM-DD","category":"Otros","paymentMethod":"Efectivo","paymentDetails":""}
Texto: "${text}"`;
        const raw = await callAI(prompt, cfg);
        const result = JSON.parse(raw.replace(/```json?/g, "").replace(/```/g, "").trim());
        setF({ descripcion: result.description || text, monto: result.amount?.toString() || "", fecha: result.date || today(), categoria: result.category || "Otros", paymentMethod: result.paymentMethod || "Efectivo", paymentDetails: result.paymentDetails || "" });
        setIsModalOpen(true);
      } catch { setF({ descripcion: text }); setIsModalOpen(true); }
      finally { setIsAiProcessing(false); setAiStep(""); }
    };
    rec.onerror = () => { setIsListening(false); };
    rec.onend = () => { setIsListening(false); recognitionRef.current = null; };
    rec.start();
  };

  // ── Guardar gasto ─────────────────────────────────────────────────────────
  // ── Ajustar saldo de cuenta según operación ──────────────────────────────
  const adjustAccountBalance = (accountId, amount, esIngreso) => {
    if (!accountId) return;
    setBankAccounts(prev => prev.map(a => {
      if (a.id !== accountId) return a;
      const delta = esIngreso ? +amount : -amount;
      return { ...a, currentBalance: (a.currentBalance || 0) + delta };
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.descripcion || !formData.monto) return;
    const monto = parseFloat(formData.monto);
    if (isNaN(monto) || monto <= 0) { alert("El monto debe ser un número positivo."); return; }

    const datos = {
      titulo: formData.descripcion,
      monto,
      categoria: formData.categoria,
      fecha: formData.fecha,
      isPersonal: formData.isPersonal,
      esIngreso: formData.esIngreso,
      paymentMethod: formData.paymentMethod,
      paymentDetails: formData.paymentDetails,
      bankAccountId: formData.bankAccountId || undefined,
    };

    if (editingId) {
      // Revertir el efecto del registro anterior antes de aplicar el nuevo
      const oldItem = items.find(i => i.id === editingId);
      const oldDatos = oldItem?.datos || {};
      if (oldDatos.bankAccountId) {
        // Revertir: si era gasto → devolver dinero; si era ingreso → quitar dinero
        adjustAccountBalance(oldDatos.bankAccountId, oldDatos.monto || 0, !oldDatos.esIngreso);
      }
      // Aplicar el nuevo efecto
      if (datos.bankAccountId) {
        adjustAccountBalance(datos.bankAccountId, monto, datos.esIngreso);
      }
      setItems(prev => prev.map(i => i.id === editingId
        ? { ...i, texto: `${datos.esIngreso ? "+" : "-"}$${fmtMoney(monto)} ${datos.titulo}`, datos }
        : i));
    } else {
      // Nuevo registro: aplicar efecto en cuenta
      if (datos.bankAccountId) {
        adjustAccountBalance(datos.bankAccountId, monto, datos.esIngreso);
      }
      const newItem = {
        id: uid(), tipo: "gasto",
        texto: `${datos.esIngreso ? "+" : "-"}$${fmtMoney(monto)} ${datos.titulo}`,
        datos, creado: new Date().toISOString(), hecho: false, columna: "cola",
      };
      setItems(prev => [newItem, ...prev]);
    }
    setIsModalOpen(false);
    resetForm();
  };

  // ── Editar gasto ──────────────────────────────────────────────────────────
  const handleEdit = (g) => {
    setEditingId(g.id);
    setF({
      descripcion: g.datos?.titulo || "",
      monto: (g.datos?.monto || "").toString(),
      fecha: g.datos?.fecha || today(),
      categoria: g.datos?.categoria || "Otros",
      isPersonal: g.datos?.isPersonal || false,
      esIngreso: g.datos?.esIngreso || false,
      paymentMethod: g.datos?.paymentMethod || "Transferencia",
      paymentDetails: g.datos?.paymentDetails || "",
      bankAccountId: g.datos?.bankAccountId || "",
    });
    setIsModalOpen(true);
  };

  // ── Eliminar gasto (revierte el saldo de la cuenta) ──────────────────────
  const handleDeleteGasto = (g) => {
    const d = g.datos || {};
    if (d.bankAccountId && d.monto) {
      // Revertir: si era gasto → devolver dinero; si era ingreso → descontar
      adjustAccountBalance(d.bankAccountId, d.monto, !d.esIngreso);
    }
    onDelete(g.id);
  };

  // ── Cuentas bancarias ─────────────────────────────────────────────────────
  const handleSaveAccount = (e) => {
    e.preventDefault();
    if (editingAccount) {
      saveBankAccounts(bankAccounts.map(a => a.id === editingAccount.id
        ? { ...a, name: accountForm.name, currentBalance: parseFloat(accountForm.currentBalance) || 0, color: accountForm.color, isPersonal: accountForm.isPersonal }
        : a));
    } else {
      saveBankAccounts([...bankAccounts, { id: uid(), name: accountForm.name, currentBalance: parseFloat(accountForm.currentBalance) || 0, color: accountForm.color, isPersonal: accountForm.isPersonal }]);
    }
    setIsBankModalOpen(false);
    setEditingAccount(null);
    setAccountForm({ name: "", currentBalance: "", color: "#0071e3", isPersonal: false });
  };

  const handleDeleteAccount = (id) => {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    saveBankAccounts(bankAccounts.filter(a => a.id !== id));
  };

  // ── PIN modal inline ──────────────────────────────────────────────────────
  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    if (pin === getStoredPin()) { setIsLocked(false); setPinError(false); setPin(""); setIsBankModalOpen(false); }
    else { setPinError(true); setPin(""); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const btnBase = {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
    borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
    border: "none", transition: "opacity 0.15s",
  };
  const card = {
    background: G.glass,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 20,
    border: `1px solid ${G.glassBorder}`,
    padding: "16px 18px",
    boxShadow: darkMode ? "0 4px 24px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
  };

  // ── Computed insight for AI card ────────────────────────────────────────
  const topCat = stats.topCats[0];
  const aiInsightText = topCat
    ? `Tu mayor gasto este mes fue en "${topCat[0]}" con $${fmtMoney(topCat[1])} COP. ${stats.total > 0 ? `Representa el ${Math.round((topCat[1]/stats.total)*100)}% del total.` : ""}`
    : "Registra tus primeros gastos para que Cerebro AI analice tus patrones financieros.";

  // ── Category icon map ───────────────────────────────────────────────────
  const CAT_SVG = {
    Alimentación: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
    Compras:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    Transporte:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    Vivienda:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    Oficina:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
    Servicios:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    Impuestos:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    Nómina:       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    Obra:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M4 20V10l8-7 8 7v10"/><path d="M9 20v-5h6v5"/></svg>,
    Herramientas: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    Ocio:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    Salud:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    Educación:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
    Otros:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  };
  const catIcon = CAT_SVG;
  const catColor = { Alimentación:G.purple, Compras:G.teal||"#24b495", Transporte:G.amber, Vivienda:G.accent, Oficina:G.accent, Servicios:G.teal||"#24b495", Impuestos:G.coral, Nómina:G.green, Obra:G.amber, Herramientas:G.amber, Ocio:G.purple, Salud:G.coral, Educación:G.green, Otros:G.textTertiary };

  // ── Totals for hero card ────────────────────────────────────────────────
  const allItemsThisMes = items.filter(i => {
    if (i.tipo !== "gasto") return false;
    const d = new Date(i.datos?.fecha || i.creado);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalIngresos = allItemsThisMes.filter(i => i.datos?.esIngreso).reduce((s,i) => s+(Number(i.datos?.monto)||0), 0);
  const totalGastosMes = allItemsThisMes.filter(i => !i.datos?.esIngreso).reduce((s,i) => s+(Number(i.datos?.monto)||0), 0);
  const totalBalance = bankAccounts.reduce((s,a) => s+(a.currentBalance||0), 0);

  // ── Active account filter ───────────────────────────────────────────────
  const [activeAccount, setActiveAccount] = useState(null); // null = todas
  const gastosFiltered = gastos.filter(g => !activeAccount || g.datos?.bankAccountId === activeAccount);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }`}</style>

      {/* ── ACCOUNT CHIPS ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        <button onClick={() => setActiveAccount(null)}
          style={{ padding: "8px 20px", borderRadius: 999, border: "none", cursor: "pointer", whiteSpace: "nowrap", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
            background: activeAccount === null ? (darkMode ? G.accent : "rgba(94,92,230,0.18)") : (darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"),
            color: activeAccount === null ? (darkMode ? "#fff" : G.purple||"#5e5ce6") : G.textSecondary,
            boxShadow: activeAccount === null ? `0 2px 10px ${darkMode ? "rgba(0,0,0,0.3)" : "rgba(94,92,230,0.18)"}` : "none" }}>
          Todas las Cuentas
        </button>
        {bankAccounts.map(acc => (
          <button key={acc.id} onClick={() => { if (isLocked) { setPin(""); setPinError(false); setIsBankModalOpen(true); } else setActiveAccount(acc.id); }}
            style={{ padding: "8px 20px", borderRadius: 999, border: "none", cursor: "pointer", whiteSpace: "nowrap", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              background: activeAccount === acc.id ? (darkMode ? acc.color||G.accent : `${acc.color||G.accent}22`) : (darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"),
              color: activeAccount === acc.id ? (darkMode ? "#fff" : acc.color||G.accent) : G.textSecondary }}>
            {isLocked ? "🔒 " : ""}{acc.name}
          </button>
        ))}
        <button onClick={() => { if (isLocked) { setPin(""); setPinError(false); setIsBankModalOpen(true); } else { setEditingAccount(null); setAccountForm({ name:"", currentBalance:"", color:"#0071e3", isPersonal:false }); setIsBankModalOpen(true); } }}
          style={{ width: 36, height: 36, borderRadius: 999, border: "none", cursor: "pointer", fontSize: 18, background: G.accentSoft, color: G.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          +
        </button>
      </div>

      {/* ── TOP BENTO: HERO + AI ────────────────────────────────────────────── */}
      <div className="fin-top-grid">

        {/* HERO BALANCE CARD */}
        <div style={{
          background: darkMode ? "#1c1c1e" : "#ffffff",
          borderRadius: 24, padding: 32, position: "relative", overflow: "hidden",
          boxShadow: darkMode ? "0 4px 24px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)" }}>

          {/* Top row: balance label + action buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>BALANCE TOTAL</div>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", color: G.textPrimary, lineHeight: 1 }}>
                {isLocked ? "••••••••" : `$${fmtMoney(totalBalance)}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { if (isLocked) { setPin(""); setPinError(false); setIsBankModalOpen(true); } else setIsLocked(true); }}
                title={isLocked ? "Desbloquear" : "Bloquear"}
                style={{ padding: 8, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", border: "none", borderRadius: 12, cursor: "pointer", color: G.textSecondary, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {isLocked ? <Ic.lock /> : <Ic.unlock />}
              </button>
              <button onClick={() => { if (!isLocked) { setShowConsolidated(true); } }}
                title="Más opciones"
                style={{ padding: 8, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", border: "none", borderRadius: 12, cursor: "pointer", color: G.textSecondary, display:"flex", alignItems:"center", justifyContent:"center", opacity: isLocked ? 0.4 : 1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
            </div>
          </div>

          {/* Income / Expense sub-cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
            <div style={{ background: darkMode ? "rgba(52,199,89,0.1)" : "rgba(52,199,89,0.07)", borderRadius: 16, padding: "14px 16px", border: `1px solid ${darkMode ? "rgba(52,199,89,0.15)" : "rgba(52,199,89,0.12)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(52,199,89,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: G.green, textTransform: "uppercase", letterSpacing: "0.06em" }}>INGRESOS</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: G.green, letterSpacing: "-0.02em" }}>+${fmtMoney(totalIngresos)}</div>
              <div style={{ fontSize: 10, color: G.textTertiary, marginTop: 2 }}>Este mes</div>
            </div>
            <div style={{ background: darkMode ? "rgba(255,69,58,0.1)" : "rgba(255,59,48,0.06)", borderRadius: 16, padding: "14px 16px", border: `1px solid ${darkMode ? "rgba(255,69,58,0.15)" : "rgba(255,59,48,0.10)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,59,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: G.coral, textTransform: "uppercase", letterSpacing: "0.06em" }}>GASTOS</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: G.coral, letterSpacing: "-0.02em" }}>-${fmtMoney(totalGastosMes)}</div>
              <div style={{ fontSize: 10, color: G.textTertiary, marginTop: 2 }}>Este mes</div>
            </div>
          </div>

          {/* Quick action buttons row */}
          <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
            <label style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:20, cursor: isAiProcessing?"not-allowed":"pointer", fontSize:12, fontWeight:700, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: G.textPrimary, border: `1px solid ${G.border}`, opacity: isAiProcessing ? 0.7 : 1, position:"relative" }}>
              {isAiProcessing ? <><div style={{ animation:"spin 1s linear infinite", display:"flex" }}><Ic.spinner /></div><span>{aiStep}</span></> : <><Ic.camera /><span>Escanear</span></>}
              <input type="file" accept="image/*" style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer" }} onChange={handleAiScan} disabled={isAiProcessing} />
            </label>
            <button onClick={handleVoice} disabled={isAiProcessing}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, background: isListening ? G.coralSoft : (darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"), color: isListening ? G.coral : G.textPrimary, animation: isListening ? "pulse 1s infinite" : "none" }}>
              <Ic.mic /><span>{isListening ? "Escuchando…" : "Voz"}</span>
            </button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, background: G.accent, color: "#fff" }}>
              <Ic.plus /><span>Añadir</span>
            </button>
          </div>
        </div>

        {/* AI INSIGHT CARD */}
        <div style={{ ...card, borderRadius: 32, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {/* Header */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* AI orb */}
                <div style={{ width: 16, height: 16, borderRadius: "50%",
                  background: "conic-gradient(from 180deg at 50% 50%, #0059b5 0deg, #5e5ce6 140deg, #24b495 240deg, #0059b5 360deg)",
                  filter: "blur(4px)", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: G.accent,
                  background: "rgba(94,92,230,0.07)", borderRadius: 6, padding: "2px 8px",
                  border: "1px solid rgba(94,92,230,0.12)" }}>Cerebro AI</span>
              </div>
              <span style={{ fontSize: 10, color: G.textTertiary }}>Análisis hoy</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: G.textPrimary, lineHeight: 1.6, marginBottom: 20 }}>
              {aiInsightText.split('"').map((part, i) =>
                i % 2 === 1
                  ? <span key={i} style={{ color: G.amber, fontWeight: 700 }}>"{part}"</span>
                  : part
              )}
            </p>
          </div>
          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { if (!isLocked) setShowConsolidated(true); else { setPin(""); setPinError(false); setIsBankModalOpen(true); } }}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 16, border: "none", cursor: "pointer", background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: G.textPrimary, fontSize: 13, fontWeight: 500, transition: "background 0.15s" }}>
              <span>Ver detalles del gasto</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }}
              style={{ width: "100%", padding: "12px", borderRadius: 16, border: "none", cursor: "pointer", background: G.accentSoft, color: G.accent, fontSize: 14, fontWeight: 700, transition: "all 0.15s" }}>
              Registrar Pago
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BENTO: TRANSACTIONS + CATEGORIES ────────────────────────── */}
      <div className="fin-bottom-grid">

        {/* RECENT TRANSACTIONS */}
        <div style={{ background: darkMode ? G.surface : "#ffffff", borderRadius: 32, padding: "28px 32px",
          border: `1px solid ${G.border}`, boxShadow: darkMode ? "0 4px 24px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: G.textPrimary }}>Transacciones Recientes</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Search */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${G.border}`, borderRadius: 20, padding: "5px 12px" }}>
                <span style={{ color: G.textTertiary }}><Ic.search /></span>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar…"
                  style={{ border:"none", background:"transparent", outline:"none", fontSize:12, color:G.textPrimary, width:100, fontFamily:"inherit" }} />
              </div>
              <div style={{ display: "flex", background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${G.border}`, borderRadius: 20, padding: 2 }}>
                {[["all","Todos"], ["empresa","Empresa"], ["personal","Personal"]].map(([id,label]) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    style={{ padding:"4px 12px", borderRadius:16, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, transition:"all 0.15s",
                      background: activeTab===id ? (darkMode ? G.accent : "#fff") : "transparent",
                      color: activeTab===id ? (darkMode ? "#fff" : G.textPrimary) : G.textTertiary,
                      boxShadow: activeTab===id ? "0 1px 6px rgba(0,0,0,0.1)" : "none" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {gastosFiltered.slice(0, 8).map(g => {
              const d = g.datos || {};
              const acc = bankAccounts.find(a => a.id === d.bankAccountId);
              const cat = d.categoria || "Otros";
              return (
                <div key={g.id}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderRadius:16, cursor:"pointer", transition:"background 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:14, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color: darkMode ? "#aeaeb2" : "#636366" }}>
                      {CAT_SVG[cat] || CAT_SVG["Otros"]}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:G.textPrimary, marginBottom:2 }}>{d.titulo || g.texto}</div>
                      <div style={{ fontSize:11, color:G.textTertiary }}>{cat}{acc ? ` · ${acc.name}` : ""} · {d.fecha ? new Date(d.fecha+"T12:00:00").toLocaleDateString("es-CO",{day:"2-digit",month:"short"}) : new Date(g.creado).toLocaleDateString("es-CO",{day:"2-digit",month:"short"})}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right", display:"flex", alignItems:"center", gap:10 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color: d.esIngreso ? G.green : G.textPrimary }}>
                        {d.esIngreso ? "+" : "-"}${fmtMoney(d.monto)}
                      </div>
                      <div style={{ fontSize:10, marginTop:3 }}>
                        <span style={{ display:"inline-block", padding:"1px 8px", borderRadius:999, fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em",
                          background: d.esIngreso ? (darkMode?"rgba(52,199,89,0.15)":"rgba(52,199,89,0.1)") : (darkMode?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"),
                          color: d.esIngreso ? G.green : G.textTertiary }}>
                          {d.esIngreso ? "INGRESO" : "GASTO"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:2, opacity:0.6 }}>
                      <button onClick={e => { e.stopPropagation(); handleEdit(g); }}
                        style={{ background:"none", border:"none", cursor:"pointer", color:G.textTertiary, padding:4, borderRadius:6, transition:"color 0.12s" }}
                        onMouseEnter={e => e.currentTarget.style.color=G.accent}
                        onMouseLeave={e => e.currentTarget.style.color=G.textTertiary}>
                        <Ic.pencil />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteGasto(g); }}
                        style={{ background:"none", border:"none", cursor:"pointer", color:G.textTertiary, padding:4, borderRadius:6, transition:"color 0.12s" }}
                        onMouseEnter={e => e.currentTarget.style.color=G.coral}
                        onMouseLeave={e => e.currentTarget.style.color=G.textTertiary}>
                        <Ic.trash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {gastosFiltered.length === 0 && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:G.textTertiary, fontSize:13, fontStyle:"italic" }}>
                Sin transacciones registradas.
              </div>
            )}
            {gastosFiltered.length > 8 && (
              <div style={{ textAlign:"center", padding:"12px 0 4px" }}>
                <span style={{ fontSize:12, color:G.accent, fontWeight:600 }}>+{gastosFiltered.length - 8} transacciones más</span>
              </div>
            )}
          </div>
        </div>

        {/* SPENDING CATEGORIES */}
        <div style={{ background: darkMode ? G.surface : "#ffffff", borderRadius: 32, padding: "28px 32px",
          border: `1px solid ${G.border}`, boxShadow: darkMode ? "0 4px 24px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
            <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:G.textPrimary }}>Categorías de Gasto</h3>
            <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:700, color:G.accent }}>Análisis</button>
          </div>

          {stats.topCats.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 0", color:G.textTertiary, fontSize:13, fontStyle:"italic" }}>Sin datos este mes</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
              {stats.topCats.map(([cat, amt]) => {
                const color = catColor[cat] || G.accent;
                const pct = stats.total > 0 ? Math.round((amt/stats.total)*100) : 0;
                return (
                  <div key={cat}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ display:"flex", color: darkMode ? "#aeaeb2" : "#636366" }}>{CAT_SVG[cat] || CAT_SVG["Otros"]}</span>
                        <span style={{ fontSize:14, fontWeight:500, color:G.textPrimary }}>{cat}</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:G.textPrimary }}>
                        ${fmtMoney(amt)}
                      </span>
                    </div>
                    <div style={{ width:"100%", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", height:10, borderRadius:999, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:999, transition:"width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Informe button */}
          <button onClick={() => { if (!isLocked) setShowConsolidated(true); }}
            style={{ width:"100%", marginTop:28, padding:"12px", borderRadius:16, border:"none", cursor:"pointer", fontSize:13, fontWeight:700, color:G.textPrimary, background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", transition:"background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)"}
            onMouseLeave={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}>
            Generar Informe Detallado
          </button>

          {/* Bank accounts summary */}
          {bankAccounts.length > 0 && !isLocked && (
            <div style={{ marginTop:20, paddingTop:20, borderTop:`1px solid ${G.border}` }}>
              <div style={{ fontSize:10, fontWeight:800, color:G.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Mis Cuentas</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {bankAccounts.map(acc => (
                  <div key={acc.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:12, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", cursor:"pointer" }}
                    onClick={() => { setMovementsAccount(acc); }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:acc.color||G.accent, flexShrink:0 }} />
                      <span style={{ fontSize:12, fontWeight:600, color:G.textSecondary }}>{acc.name}</span>
                    </div>
                    <span style={{ fontSize:13, fontWeight:800, color: acc.currentBalance>=0 ? G.green : G.coral }}>
                      ${fmtMoney(acc.currentBalance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FAB ──────────────────────────────────────────────────────────────── */}
      <button onClick={() => { resetForm(); setIsModalOpen(true); }}
        style={{ position:"fixed", bottom:32, right:32, width:56, height:56, borderRadius:"50%", background:G.accent, color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${G.accentGlow}`, zIndex:50, transition:"transform 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform="none"}>
        <Ic.plus />
      </button>

      {/* ── MODAL: GASTO ─────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", animation: "fadeIn 0.15s ease" }}
          onClick={() => setIsModalOpen(false)}>
          <div style={{ background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", border: `1px solid ${G.glassBorder}`, boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}
            onClick={e => e.stopPropagation()}>
            {/* Header modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${G.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: G.textPrimary }}>{editingId ? "Editar Gasto" : "Registrar Nuevo Pago"}</div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: G.textTertiary }}><Ic.x /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Banner IA */}
              {aiResult && (
                <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: G.accentSoft, border: `1px solid ${G.accentGlow}`, borderRadius: 10 }}>
                  <span style={{ color: G.accent }}><Ic.check /></span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: G.accent }}>Datos extraídos por IA</div>
                    <div style={{ fontSize: 10, color: G.textSecondary }}>Verifica la información antes de guardar.</div>
                  </div>
                </div>
              )}
              {/* Preview recibo */}
              {receiptPreview && (
                <div style={{ textAlign: "center" }}>
                  <img src={receiptPreview} alt="Recibo" style={{ maxHeight: 120, borderRadius: 10, border: `1px solid ${G.border}`, objectFit: "contain" }} />
                </div>
              )}
              {/* Descripción */}
              <div>
                <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Descripción / Razón *</label>
                <input value={formData.descripcion} onChange={e => setF({ descripcion: e.target.value })}
                  placeholder="Ej: Factura de ferretería, Peajes…" required style={iS()} />
              </div>
              {/* Monto + Fecha */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Monto (COP) *</label>
                  <input type="number" value={formData.monto} onChange={e => setF({ monto: e.target.value })} placeholder="0" required style={iS()} />
                </div>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Fecha *</label>
                  <input type="date" value={formData.fecha} onChange={e => setF({ fecha: e.target.value })} required style={iS()} />
                </div>
              </div>
              {/* Operación: Gasto / Ingreso */}
              <div>
                <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Tipo de Operación</label>
                <div style={{ display: "flex", background: G.formBg, border: `1px solid ${G.border}`, borderRadius: 10, padding: 3, gap: 2 }}>
                  {[
                    { id: "gasto",   label: "📤 Gasto",   val: false, color: G.coral },
                    { id: "ingreso", label: "📥 Ingreso",  val: true,  color: G.green },
                  ].map(op => (
                    <button key={op.id} type="button" onClick={() => setF({ esIngreso: op.val })}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
                        background: formData.esIngreso === op.val ? G.surface : "transparent",
                        color: formData.esIngreso === op.val ? op.color : G.textTertiary,
                        boxShadow: formData.esIngreso === op.val ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
                      {op.label}
                    </button>
                  ))}
                </div>
                {formData.bankAccountId && (
                  <div style={{ marginTop: 5, fontSize: 10, color: formData.esIngreso ? G.green : G.coral, fontWeight: 600 }}>
                    {formData.esIngreso
                      ? `✅ Se sumará $${fmtMoney(parseFloat(formData.monto)||0)} a "${bankAccounts.find(a=>a.id===formData.bankAccountId)?.name || ""}"`
                      : `⬇️ Se restará $${fmtMoney(parseFloat(formData.monto)||0)} de "${bankAccounts.find(a=>a.id===formData.bankAccountId)?.name || ""}"`
                    }
                  </div>
                )}
              </div>
              {/* Tipo + Categoría */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Entidad</label>
                  <div style={{ display: "flex", background: G.formBg, border: `1px solid ${G.border}`, borderRadius: 10, padding: 3, gap: 2 }}>
                    {[["empresa", "Empresa", false], ["personal", "Personal", true]].map(([id, label, val]) => (
                      <button key={id} type="button" onClick={() => setF({ isPersonal: val })}
                        style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700,
                          background: formData.isPersonal === val ? G.surface : "transparent",
                          color: formData.isPersonal === val ? (val ? G.green : G.accent) : G.textTertiary,
                          boxShadow: formData.isPersonal === val ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Categoría</label>
                  <select value={formData.categoria} onChange={e => setF({ categoria: e.target.value })} style={iS()}>
                    <optgroup label="Empresa">{CATS_EMPRESA.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                    <optgroup label="Personal">{CATS_PERSONAL.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                  </select>
                </div>
              </div>
              {/* Método + Detalles */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Medio de Pago</label>
                  <select value={formData.paymentMethod} onChange={e => setF({ paymentMethod: e.target.value })} style={iS()}>
                    {["Efectivo", "Transferencia", "Tarjeta Débito", "Tarjeta Crédito"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Detalles (Opcional)</label>
                  <input value={formData.paymentDetails} onChange={e => setF({ paymentDetails: e.target.value })} placeholder="Ej: Visa 1234, Nequi…" style={iS()} />
                </div>
              </div>
              {/* Cuenta bancaria */}
              {bankAccounts.length > 0 && (
                <div>
                  <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Cuenta Bancaria</label>
                  <select value={formData.bankAccountId} onChange={e => setF({ bankAccountId: e.target.value })} style={iS()}>
                    <option value="">— Sin cuenta específica —</option>
                    {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name} (${fmtMoney(a.currentBalance)})</option>)}
                  </select>
                </div>
              )}
              {/* Botones */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                  style={{ ...btnBase, flex: 1, justifyContent: "center", background: G.formBg, color: G.textSecondary, border: `1px solid ${G.border}` }}>
                  Cancelar
                </button>
                <button type="submit"
                  style={{ ...btnBase, flex: 2, justifyContent: "center", background: G.accent, color: "#fff", boxShadow: `0 4px 14px ${G.accentGlow}` }}>
                  {editingId ? "Guardar Cambios" : "Guardar Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PIN UNLOCK + RECUPERACIÓN ─────────────────────────────────── */}
      {isBankModalOpen && isLocked && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", animation: "fadeIn 0.15s ease" }}>
          <div style={{ background: G.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 24, width: "100%", maxWidth: 340, padding: "28px 24px", border: `1px solid ${G.glassBorder}`, boxShadow: "0 24px 64px rgba(0,0,0,0.3)", textAlign: "center" }}>

            {/* ── PASO: Ingresar PIN ── */}
            {recoveryStep === "idle" && (<>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: G.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: G.accent }}>
                <Ic.lock />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: G.textPrimary, marginBottom: 5 }}>Seguridad</div>
              <div style={{ fontSize: 11, color: G.textTertiary, marginBottom: 20 }}>Ingresa tu clave de 6 dígitos para gestionar cuentas.</div>
              <form onSubmit={handleUnlockSubmit}>
                <input
                  type="password" maxLength={6} autoFocus
                  value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  style={{ width: "100%", textAlign: "center", fontSize: 22, fontWeight: 900, letterSpacing: "0.5em", padding: "12px", borderRadius: 12,
                    border: `2px solid ${pinError ? G.coral : G.border}`, background: pinError ? G.coralSoft : G.formBg,
                    color: pinError ? G.coral : G.textPrimary, outline: "none", boxSizing: "border-box", marginBottom: 4, fontFamily: "inherit" }} />
                {pinError && <div style={{ fontSize: 10, color: G.coral, fontWeight: 700, marginBottom: 4 }}>Clave incorrecta</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button type="button" onClick={() => { setIsBankModalOpen(false); setPin(""); setPinError(false); resetRecovery(); }}
                    style={{ ...btnBase, flex: 1, justifyContent: "center", background: G.formBg, color: G.textSecondary, border: `1px solid ${G.border}` }}>
                    Cancelar
                  </button>
                  <button type="submit"
                    style={{ ...btnBase, flex: 1, justifyContent: "center", background: G.accent, color: "#fff" }}>
                    Desbloquear
                  </button>
                </div>
              </form>
              {/* Link recuperación */}
              <button onClick={() => { setPinError(false); setRecoveryStep("sending"); handleSendOtp(); }}
                style={{ marginTop: 16, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: G.accent, fontWeight: 600, textDecoration: "underline", padding: 0 }}>
                ¿Olvidaste la clave? Recuperar por correo
              </button>
              {userEmail && (
                <div style={{ fontSize: 9, color: G.textTertiary, marginTop: 4 }}>
                  Se enviará a: <strong>{userEmail}</strong>
                </div>
              )}
            </>)}

            {/* ── PASO: Enviando OTP ── */}
            {recoveryStep === "sending" && (
              <div style={{ padding: "10px 0" }}>
                <div style={{ animation: "spin 1s linear infinite", display: "inline-block", color: G.accent, marginBottom: 12 }}><Ic.spinner /></div>
                <div style={{ fontSize: 13, fontWeight: 700, color: G.textPrimary }}>Enviando código…</div>
                <div style={{ fontSize: 11, color: G.textTertiary, marginTop: 6 }}>Revisando {userEmail}</div>
              </div>
            )}

            {/* ── PASO: Ingresar OTP ── */}
            {recoveryStep === "otp" && (<>
              <div style={{ fontSize: 28, marginBottom: 12 }}>📧</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: G.textPrimary, marginBottom: 6 }}>Revisa tu correo</div>
              <div style={{ fontSize: 11, color: G.textTertiary, marginBottom: 18 }}>
                Ingresa el código de 6 dígitos enviado a <strong style={{ color: G.textPrimary }}>{userEmail}</strong>
              </div>
              <input
                type="text" maxLength={6} autoFocus
                value={recoveryOtp} onChange={e => { setRecoveryOtp(e.target.value.replace(/\D/g, "")); setRecoveryError(""); }}
                placeholder="000000"
                style={{ width: "100%", textAlign: "center", fontSize: 22, fontWeight: 900, letterSpacing: "0.5em", padding: "12px", borderRadius: 12,
                  border: `2px solid ${recoveryError ? G.coral : G.border}`, background: G.formBg,
                  color: G.textPrimary, outline: "none", boxSizing: "border-box", marginBottom: 4, fontFamily: "inherit" }} />
              {recoveryError && <div style={{ fontSize: 10, color: G.coral, fontWeight: 700, marginBottom: 4 }}>{recoveryError}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button type="button" onClick={resetRecovery}
                  style={{ ...btnBase, flex: 1, justifyContent: "center", background: G.formBg, color: G.textSecondary, border: `1px solid ${G.border}` }}>
                  Volver
                </button>
                <button type="button" onClick={handleVerifyOtp}
                  style={{ ...btnBase, flex: 1, justifyContent: "center", background: G.accent, color: "#fff" }}>
                  Verificar
                </button>
              </div>
              <button onClick={() => { setRecoveryStep("sending"); handleSendOtp(); }}
                style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer", fontSize: 10, color: G.textTertiary, textDecoration: "underline", padding: 0 }}>
                Reenviar código
              </button>
            </>)}

            {/* ── PASO: Nueva clave ── */}
            {recoveryStep === "newpin" && (<>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{color:"#0071e3",opacity:0.8}}>
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: G.textPrimary, marginBottom: 6 }}>Establece una nueva clave</div>
              <div style={{ fontSize: 11, color: G.textTertiary, marginBottom: 18 }}>Elige una clave de 6 dígitos para proteger tus cuentas.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Nueva clave (6 dígitos)</div>
                  <input
                    type="password" maxLength={6} autoFocus
                    value={newPin} onChange={e => { setNewPin(e.target.value.replace(/\D/g, "")); setRecoveryError(""); }}
                    placeholder="••••••"
                    style={{ width: "100%", textAlign: "center", fontSize: 20, fontWeight: 900, letterSpacing: "0.4em", padding: "10px", borderRadius: 12,
                      border: `2px solid ${G.border}`, background: G.formBg, color: G.textPrimary, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Confirmar clave</div>
                  <input
                    type="password" maxLength={6}
                    value={newPinConfirm} onChange={e => { setNewPinConfirm(e.target.value.replace(/\D/g, "")); setRecoveryError(""); }}
                    placeholder="••••••"
                    style={{ width: "100%", textAlign: "center", fontSize: 20, fontWeight: 900, letterSpacing: "0.4em", padding: "10px", borderRadius: 12,
                      border: `2px solid ${newPinConfirm && newPin !== newPinConfirm ? G.coral : G.border}`, background: G.formBg, color: G.textPrimary, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>
              </div>
              {recoveryError && <div style={{ fontSize: 10, color: G.coral, fontWeight: 700, marginTop: 8 }}>{recoveryError}</div>}
              <button type="button" onClick={handleSetNewPin}
                style={{ ...btnBase, width: "100%", justifyContent: "center", background: G.green, color: "#fff", marginTop: 16, boxShadow: `0 4px 12px rgba(48,209,88,0.25)` }}>
                <Ic.check /> Guardar nueva clave
              </button>
            </>)}

          </div>
        </div>
      )}

      {/* ── MODAL: CUENTA BANCARIA ────────────────────────────────────────────── */}
      {isBankModalOpen && !isLocked && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", animation: "fadeIn 0.15s ease" }}
          onClick={() => setIsBankModalOpen(false)}>
          <div style={{ background: G.surface, borderRadius: 18, width: "100%", maxWidth: 380, border: `1px solid ${G.borderHigh}`, boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${G.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: G.textPrimary }}>{editingAccount ? "Editar Cuenta" : "Nueva Cuenta"}</div>
              <button onClick={() => setIsBankModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: G.textTertiary }}><Ic.x /></button>
            </div>
            <form onSubmit={handleSaveAccount} style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Nombre del Banco / Cuenta</label>
                <input value={accountForm.name} onChange={e => setAccountForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Bancolombia Principal" required style={iS()} />
              </div>
              <div>
                <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Saldo Actual (COP)</label>
                <input type="number" value={accountForm.currentBalance} onChange={e => setAccountForm(p => ({ ...p, currentBalance: e.target.value }))} placeholder="0" required style={iS()} />
                <div style={{ fontSize: 9, color: G.textTertiary, marginTop: 4 }}>El dinero disponible REAL hoy en esta cuenta.</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, alignItems: "center" }}>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 800, color: G.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Color</label>
                  <input type="color" value={accountForm.color} onChange={e => setAccountForm(p => ({ ...p, color: e.target.value }))} style={{ width: "100%", height: 38, borderRadius: 8, border: `1px solid ${G.border}`, cursor: "pointer", padding: 2 }} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 14 }}>
                  <input type="checkbox" checked={accountForm.isPersonal} onChange={e => setAccountForm(p => ({ ...p, isPersonal: e.target.checked }))} style={{ width: 15, height: 15, accentColor: G.green }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: G.textSecondary }}>Cuenta Personal</span>
                </label>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {editingAccount && (
                  <button type="button" onClick={() => { handleDeleteAccount(editingAccount.id); setIsBankModalOpen(false); }}
                    style={{ ...btnBase, padding: "9px 16px", background: G.coralSoft, color: G.coral, border: `1px solid ${G.coralGlow || G.border}` }}>
                    Eliminar
                  </button>
                )}
                <button type="submit"
                  style={{ ...btnBase, flex: 1, justifyContent: "center", background: G.accent, color: "#fff", boxShadow: `0 4px 12px ${G.accentGlow}` }}>
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── DRAWER: MOVIMIENTOS POR CUENTA (solo desbloqueado) ─────────────── */}
      {movementsAccount && !isLocked && (
        <AccountMovementsDrawer
          account={movementsAccount}
          allItems={items}
          bankAccounts={bankAccounts}
          darkMode={G === DARK_F}
          onClose={() => setMovementsAccount(null)}
        />
      )}

      {/* ── MODAL: INFORME CONSOLIDADO (solo desbloqueado) ──────────────────── */}
      {showConsolidated && !isLocked && (
        <ConsolidatedReportModal
          allItems={items}
          bankAccounts={bankAccounts}
          darkMode={G === DARK_F}
          onClose={() => setShowConsolidated(false)}
        />
      )}
    </div>
  );
}

// ── Componente: Drawer de movimientos por cuenta ──────────────────────────────
function AccountMovementsDrawer({ account, allItems, bankAccounts, darkMode, onClose }) {
  const G2 = darkMode ? DARK_F : LIGHT_F;
  const [period, setPeriod] = useState("all"); // "all" | "mes" | "3m" | "6m"
  const [showReport, setShowReport] = useState(false);

  const movements = useMemo(() => {
    const now = new Date();
    return allItems
      .filter(i => i.tipo === "gasto" && i.datos?.bankAccountId === account.id)
      .filter(i => {
        if (period === "all") return true;
        const d = new Date(i.datos?.fecha || i.creado);
        const diffMs = now - d;
        if (period === "mes") return diffMs <= 31 * 86400000;
        if (period === "3m")  return diffMs <= 92 * 86400000;
        if (period === "6m")  return diffMs <= 183 * 86400000;
        return true;
      })
      .sort((a, b) => new Date(b.datos?.fecha || b.creado) - new Date(a.datos?.fecha || a.creado));
  }, [allItems, account.id, period]);

  const totales = useMemo(() => {
    const ingresos = movements.filter(m => m.datos?.esIngreso).reduce((s, m) => s + (Number(m.datos?.monto) || 0), 0);
    const gastos   = movements.filter(m => !m.datos?.esIngreso).reduce((s, m) => s + (Number(m.datos?.monto) || 0), 0);
    return { ingresos, gastos, neto: ingresos - gastos };
  }, [movements]);

  // Agrupar por mes para el informe
  const porMes = useMemo(() => {
    const map = {};
    movements.forEach(m => {
      const fecha = m.datos?.fecha || m.creado?.slice(0,10) || "";
      const key = fecha.slice(0,7); // YYYY-MM
      if (!map[key]) map[key] = { key, ingresos: 0, gastos: 0, items: [] };
      if (m.datos?.esIngreso) map[key].ingresos += Number(m.datos?.monto) || 0;
      else map[key].gastos += Number(m.datos?.monto) || 0;
      map[key].items.push(m);
    });
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [movements]);

  const fmtMes = key => {
    const [y, m] = key.split("-");
    const names = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${names[parseInt(m,10)-1]} ${y}`;
  };

  const card2 = { background: G2.surface, borderRadius: 12, border: `1px solid ${G2.border}`, padding: "12px 14px" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:80, display:"flex" }} onClick={onClose}>
      {/* Overlay */}
      <div style={{ flex:1, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)" }} />
      {/* Drawer */}
      <div style={{ width:"min(520px,96vw)", background: G2.bg, display:"flex", flexDirection:"column",
        boxShadow:"-8px 0 40px rgba(0,0,0,0.2)", overflowY:"auto", animation:"slideIn 0.22s ease" }}
        onClick={e => e.stopPropagation()}>
        <style>{`@keyframes slideIn { from { transform:translateX(100%); } to { transform:none; } }`}</style>

        {/* Header */}
        <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${G2.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background: account.color || G2.accent, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:G2.textPrimary }}>{account.name}</div>
                <div style={{ fontSize:10, color:G2.textTertiary }}>{account.isPersonal ? "Cuenta Personal" : "Cuenta Empresa"}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:G2.textTertiary, fontSize:18, padding:4 }}>✕</button>
          </div>
          {/* Saldo actual */}
          <div style={{ ...card2, display:"flex", gap:18, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:G2.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em" }}>Saldo Actual</div>
              <div style={{ fontSize:20, fontWeight:900, color: account.currentBalance >= 0 ? G2.green : G2.coral }}>
                ${fmtMoney(account.currentBalance)}
              </div>
            </div>
            <div style={{ width:1, background:G2.border }} />
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:G2.green, textTransform:"uppercase", letterSpacing:"0.06em" }}>Ingresos ({period==="all"?"Todo":period})</div>
              <div style={{ fontSize:14, fontWeight:800, color:G2.green }}>+${fmtMoney(totales.ingresos)}</div>
            </div>
            <div style={{ width:1, background:G2.border }} />
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:G2.coral, textTransform:"uppercase", letterSpacing:"0.06em" }}>Gastos ({period==="all"?"Todo":period})</div>
              <div style={{ fontSize:14, fontWeight:800, color:G2.coral }}>-${fmtMoney(totales.gastos)}</div>
            </div>
          </div>
          {/* Periodo + acciones */}
          <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", background:G2.formBg, border:`1px solid ${G2.border}`, borderRadius:8, padding:2, gap:2 }}>
              {[["all","Todo"],["mes","1 mes"],["3m","3 meses"],["6m","6 meses"]].map(([id,label]) => (
                <button key={id} onClick={() => setPeriod(id)}
                  style={{ padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer", fontSize:10, fontWeight:700,
                    background: period===id ? G2.surface : "transparent",
                    color: period===id ? G2.textPrimary : G2.textTertiary,
                    boxShadow: period===id ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowReport(r => !r)}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, border:`1px solid ${G2.accentGlow}`,
                background: showReport ? G2.accentSoft : "transparent", color: G2.accent, cursor:"pointer", fontSize:10, fontWeight:700 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
              {showReport ? "Ocultar Informe" : "Ver Informe"}
            </button>
          </div>
        </div>

        {/* Informe mensual (colapsable) */}
        {showReport && (
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${G2.border}`, flexShrink:0 }}>
            <div style={{ fontSize:10, fontWeight:800, color:G2.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
              Informe por Mes — {account.name}
            </div>
            {porMes.length === 0 ? (
              <div style={{ fontSize:11, color:G2.textTertiary, textAlign:"center", padding:"10px 0", fontStyle:"italic" }}>Sin movimientos en el período</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {porMes.map(mes => {
                  const neto = mes.ingresos - mes.gastos;
                  const max = Math.max(mes.ingresos, mes.gastos, 1);
                  return (
                    <div key={mes.key} style={{ ...card2, padding:"10px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:G2.textPrimary }}>{fmtMes(mes.key)}</div>
                        <div style={{ fontSize:10, fontWeight:800, color: neto>=0 ? G2.green : G2.coral }}>
                          {neto>=0?"+":""}{fmtMoney(neto)} neto
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8, fontSize:9, color:G2.textTertiary, marginBottom:6 }}>
                        <span style={{ color:G2.green }}>↑ ${fmtMoney(mes.ingresos)}</span>
                        <span>·</span>
                        <span style={{ color:G2.coral }}>↓ ${fmtMoney(mes.gastos)}</span>
                        <span>·</span>
                        <span>{mes.items.length} movimientos</span>
                      </div>
                      <div style={{ display:"flex", gap:3, height:4, borderRadius:2, overflow:"hidden", background:G2.border }}>
                        {mes.ingresos > 0 && <div style={{ flex: mes.ingresos/max, background:G2.green, borderRadius:2 }} />}
                        {mes.gastos > 0  && <div style={{ flex: mes.gastos/max,   background:G2.coral, borderRadius:2 }} />}
                      </div>
                    </div>
                  );
                })}
                {/* Total periodo */}
                <div style={{ ...card2, padding:"10px 12px", background:G2.accentSoft, border:`1px solid ${G2.accentGlow}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, fontWeight:800, color:G2.textPrimary }}>
                    <span>Total período</span>
                    <span style={{ color: totales.neto>=0 ? G2.green : G2.coral }}>
                      {totales.neto>=0?"+":""}{fmtMoney(totales.neto)} neto
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:10, fontSize:10, marginTop:4 }}>
                    <span style={{ color:G2.green }}>Ingresos: ${fmtMoney(totales.ingresos)}</span>
                    <span style={{ color:G2.coral }}>Gastos: ${fmtMoney(totales.gastos)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de movimientos */}
        <div style={{ flex:1, overflowY:"auto", padding:"14px 20px" }}>
          <div style={{ fontSize:10, fontWeight:800, color:G2.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
            Movimientos ({movements.length})
          </div>
          {movements.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:G2.textTertiary, fontSize:11, fontStyle:"italic" }}>
              Sin movimientos para esta cuenta en el período seleccionado.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {movements.map(m => {
                const d = m.datos || {};
                const fecha = d.fecha ? new Date(d.fecha+"T12:00:00").toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}) : new Date(m.creado).toLocaleDateString("es-CO",{day:"2-digit",month:"short"});
                return (
                  <div key={m.id} style={{ ...card2, display:"flex", alignItems:"center", gap:10, padding:"10px 12px" }}>
                    <div style={{ width:32, height:32, borderRadius:10, background: d.esIngreso ? G2.greenSoft : G2.coralSoft,
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      fontSize:14, color: d.esIngreso ? G2.green : G2.coral }}>
                      {d.esIngreso ? "↑" : "↓"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:G2.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {d.titulo || m.texto}
                      </div>
                      <div style={{ fontSize:9, color:G2.textTertiary, marginTop:1 }}>
                        {fecha} · {d.categoria || "Otros"} · {d.paymentMethod || ""}
                      </div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:800, color: d.esIngreso ? G2.green : G2.coral, flexShrink:0 }}>
                      {d.esIngreso ? "+" : "-"}${fmtMoney(d.monto)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente: Informe Consolidado General ───────────────────────────────────
function ConsolidatedReportModal({ allItems, bankAccounts, darkMode, onClose }) {
  const G2 = darkMode ? DARK_F : LIGHT_F;
  const [period, setPeriod] = useState("mes");

  const todosGastos = useMemo(() => {
    const now = new Date();
    return allItems.filter(i => {
      if (i.tipo !== "gasto") return false;
      if (period === "all") return true;
      const d = new Date(i.datos?.fecha || i.creado);
      const diffMs = now - d;
      if (period === "mes") return diffMs <= 31 * 86400000;
      if (period === "3m")  return diffMs <= 92 * 86400000;
      if (period === "6m")  return diffMs <= 183 * 86400000;
      return true;
    });
  }, [allItems, period]);

  // Totales globales
  const globalTotals = useMemo(() => {
    const ingresos = todosGastos.filter(m => m.datos?.esIngreso).reduce((s,m) => s + (Number(m.datos?.monto)||0), 0);
    const gastos   = todosGastos.filter(m => !m.datos?.esIngreso).reduce((s,m) => s + (Number(m.datos?.monto)||0), 0);
    return { ingresos, gastos, neto: ingresos - gastos };
  }, [todosGastos]);

  // Por cuenta
  const porCuenta = useMemo(() => {
    const saldo_total = bankAccounts.reduce((s,a) => s + (a.currentBalance||0), 0);
    return bankAccounts.map(acc => {
      const movs = todosGastos.filter(m => m.datos?.bankAccountId === acc.id);
      const ingresos = movs.filter(m => m.datos?.esIngreso).reduce((s,m) => s + (Number(m.datos?.monto)||0), 0);
      const gastos   = movs.filter(m => !m.datos?.esIngreso).reduce((s,m) => s + (Number(m.datos?.monto)||0), 0);
      return { ...acc, ingresos, gastos, neto: ingresos-gastos, movs: movs.length };
    });
  }, [bankAccounts, todosGastos]);

  // Sin cuenta asignada
  const sinCuenta = useMemo(() => {
    const movs = todosGastos.filter(m => !m.datos?.bankAccountId);
    const ingresos = movs.filter(m => m.datos?.esIngreso).reduce((s,m) => s+(Number(m.datos?.monto)||0), 0);
    const gastos   = movs.filter(m => !m.datos?.esIngreso).reduce((s,m) => s+(Number(m.datos?.monto)||0), 0);
    return { ingresos, gastos, neto: ingresos-gastos, movs: movs.length };
  }, [todosGastos]);

  // Por categoría global
  const porCat = useMemo(() => {
    const map = {};
    todosGastos.filter(m => !m.datos?.esIngreso).forEach(m => {
      const c = m.datos?.categoria || "Otros";
      map[c] = (map[c]||0) + (Number(m.datos?.monto)||0);
    });
    return Object.entries(map).sort((a,b) => b[1]-a[1]);
  }, [todosGastos]);

  // Por mes (últimos 6)
  const porMes = useMemo(() => {
    const map = {};
    allItems.filter(i => i.tipo==="gasto").forEach(m => {
      const key = (m.datos?.fecha || m.creado?.slice(0,10) || "").slice(0,7);
      if (!key) return;
      if (!map[key]) map[key] = { ingresos:0, gastos:0 };
      if (m.datos?.esIngreso) map[key].ingresos += Number(m.datos?.monto)||0;
      else map[key].gastos += Number(m.datos?.monto)||0;
    });
    return Object.entries(map).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,6);
  }, [allItems]);

  const fmtMes = key => {
    const [y, m] = key.split("-");
    return ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(m,10)-1] + " " + y;
  };

  const card2 = { background: G2.surface, borderRadius: 12, border:`1px solid ${G2.border}`, padding:"12px 14px" };

  const saldoTotal = bankAccounts.reduce((s,a) => s + (a.currentBalance||0), 0);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:80, display:"flex", alignItems:"flex-end", justifyContent:"center",
      background:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)" }} onClick={onClose}>
      <div style={{ width:"min(720px,100vw)", background:G2.bg, borderRadius:"20px 20px 0 0",
        maxHeight:"90vh", overflowY:"auto", boxShadow:"0 -10px 50px rgba(0,0,0,0.25)",
        border:`1px solid ${G2.border}`, animation:"slideUp 0.25s ease" }}
        onClick={e => e.stopPropagation()}>
        <style>{`@keyframes slideUp { from { transform:translateY(100%); } to { transform:none; } }`}</style>

        {/* Header */}
        <div style={{ position:"sticky", top:0, background:G2.bg, zIndex:2, padding:"18px 22px 12px",
          borderBottom:`1px solid ${G2.border}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:G2.textPrimary, display:"flex", alignItems:"center", gap:7 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
                Informe Consolidado
              </div>
              <div style={{ fontSize:10, color:G2.textTertiary }}>Todas las cuentas · {todosGastos.length} movimientos</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:G2.textTertiary, fontSize:18 }}>✕</button>
          </div>
          <div style={{ display:"flex", background:G2.formBg, border:`1px solid ${G2.border}`, borderRadius:8, padding:2, gap:2, width:"fit-content" }}>
            {[["mes","Último mes"],["3m","3 meses"],["6m","6 meses"],["all","Todo"]].map(([id,label]) => (
              <button key={id} onClick={() => setPeriod(id)}
                style={{ padding:"4px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:10, fontWeight:700,
                  background: period===id ? G2.surface : "transparent",
                  color: period===id ? G2.textPrimary : G2.textTertiary,
                  boxShadow: period===id ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding:"18px 22px", display:"flex", flexDirection:"column", gap:18 }}>

          {/* Resumen global */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10 }}>
            {[
              { label:"Saldo Total Cuentas", value: saldoTotal, color: saldoTotal>=0 ? G2.green : G2.coral, prefix:"$" },
              { label:"Ingresos (período)", value: globalTotals.ingresos, color: G2.green, prefix:"+$" },
              { label:"Gastos (período)",   value: globalTotals.gastos,   color: G2.coral, prefix:"-$" },
              { label:"Neto (período)",     value: globalTotals.neto,     color: globalTotals.neto>=0 ? G2.green : G2.coral,
                prefix: globalTotals.neto>=0 ? "+$" : "-$", absVal: true },
            ].map(item => (
              <div key={item.label} style={{ ...card2, textAlign:"center" }}>
                <div style={{ fontSize:8, fontWeight:800, color:G2.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{item.label}</div>
                <div style={{ fontSize:18, fontWeight:900, color:item.color }}>
                  {item.prefix}{fmtMoney(item.absVal ? Math.abs(item.value) : item.value)}
                </div>
              </div>
            ))}
          </div>

          {/* Por cuenta */}
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:G2.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
              Por Cuenta Bancaria
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {porCuenta.map(acc => (
                <div key={acc.id} style={{ ...card2 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background: acc.color || G2.accent, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:G2.textPrimary }}>{acc.name}</div>
                        <div style={{ fontSize:9, color:G2.textTertiary }}>{acc.movs} movimientos · {acc.isPersonal?"Personal":"Empresa"}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:16 }}>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:8, color:G2.textTertiary }}>Saldo</div>
                        <div style={{ fontSize:13, fontWeight:800, color: acc.currentBalance>=0 ? G2.green : G2.coral }}>${fmtMoney(acc.currentBalance)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:8, color:G2.green }}>↑ Ingresos</div>
                        <div style={{ fontSize:11, fontWeight:700, color:G2.green }}>${fmtMoney(acc.ingresos)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:8, color:G2.coral }}>↓ Gastos</div>
                        <div style={{ fontSize:11, fontWeight:700, color:G2.coral }}>${fmtMoney(acc.gastos)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:8, color:G2.textTertiary }}>Neto</div>
                        <div style={{ fontSize:11, fontWeight:700, color: acc.neto>=0 ? G2.green : G2.coral }}>
                          {acc.neto>=0?"+":""}{fmtMoney(acc.neto)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {acc.movs > 0 && (
                    <div style={{ marginTop:8, height:3, borderRadius:2, display:"flex", gap:1, overflow:"hidden", background:G2.border }}>
                      {acc.ingresos > 0 && <div style={{ flex:acc.ingresos, background:G2.green, borderRadius:2 }} />}
                      {acc.gastos > 0   && <div style={{ flex:acc.gastos,   background:G2.coral, borderRadius:2 }} />}
                    </div>
                  )}
                </div>
              ))}
              {sinCuenta.movs > 0 && (
                <div style={{ ...card2, opacity:0.7 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:G2.textPrimary }}>Sin cuenta asignada</div>
                      <div style={{ fontSize:9, color:G2.textTertiary }}>{sinCuenta.movs} movimientos</div>
                    </div>
                    <div style={{ display:"flex", gap:16 }}>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:8, color:G2.green }}>↑ ${fmtMoney(sinCuenta.ingresos)}</div>
                        <div style={{ fontSize:8, color:G2.coral }}>↓ ${fmtMoney(sinCuenta.gastos)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Por categoría */}
          {porCat.length > 0 && (
            <div>
              <div style={{ fontSize:10, fontWeight:800, color:G2.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
                Top Categorías de Gastos (período)
              </div>
              <div style={{ ...card2 }}>
                {porCat.map(([cat, monto], i) => (
                  <div key={cat} style={{ marginBottom: i<porCat.length-1 ? 10 : 0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, fontWeight:700, color:G2.textSecondary, marginBottom:3 }}>
                      <span>{cat}</span>
                      <span style={{ color:G2.textPrimary }}>${fmtMoney(monto)}</span>
                    </div>
                    <div style={{ height:3, background:G2.border, borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(monto/(globalTotals.gastos||1))*100}%`, background:G2.amber, borderRadius:2, transition:"width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial mensual */}
          {porMes.length > 0 && (
            <div>
              <div style={{ fontSize:10, fontWeight:800, color:G2.textTertiary, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
                Historial Mensual (últimos 6 meses)
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {porMes.map(([key, datos]) => {
                  const neto = datos.ingresos - datos.gastos;
                  const max = Math.max(datos.ingresos, datos.gastos, 1);
                  return (
                    <div key={key} style={{ ...card2, padding:"10px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:G2.textPrimary }}>{fmtMes(key)}</div>
                        <div style={{ display:"flex", gap:12, fontSize:10 }}>
                          <span style={{ color:G2.green }}>+${fmtMoney(datos.ingresos)}</span>
                          <span style={{ color:G2.coral }}>-${fmtMoney(datos.gastos)}</span>
                          <span style={{ fontWeight:800, color: neto>=0 ? G2.green : G2.coral }}>
                            = {neto>=0?"+":""}{fmtMoney(neto)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:2, height:6, borderRadius:3, overflow:"hidden", background:G2.border }}>
                        {datos.ingresos > 0 && <div style={{ flex:datos.ingresos/max, background:G2.green, borderRadius:3, transition:"flex 0.5s ease" }} />}
                        {datos.gastos > 0   && <div style={{ flex:datos.gastos/max,   background:G2.coral, borderRadius:3, transition:"flex 0.5s ease" }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
