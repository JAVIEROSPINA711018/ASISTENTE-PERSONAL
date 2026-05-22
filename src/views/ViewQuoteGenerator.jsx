import React, { useState, useEffect, useRef } from "react";
import { quotesDB, clientsDB, QUOTE_STATUSES } from "../lib/supabaseCRM.js";
import { supabase } from "../lib/supabase.js";

// Fonts matching Cerebro
const FONT = "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif";

import { LIGHT, DARK } from "../lib/theme.js";

// ── CUSTOM INLINE SVG ICONS ──
const IconBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const IconPrint = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
);
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const IconWhatsApp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
);
const IconSpinner = () => (
  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"></path></svg>
);

export default function ViewQuoteGenerator({ quoteId, onBack, darkMode = false }) {
  const G = darkMode ? DARK : LIGHT;

  const [quote, setQuote] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Proposal Configuration State
  const [quoteType, setQuoteType] = useState("COMBINADO"); // ESTRUCTURAL | SUELOS | COMBINADO | PERSONALIZADA
  const [soilParams, setSoilParams] = useState({ perforations: 3, depth: 6 });
  const [paymentTerms, setPaymentTerms] = useState("60% Anticipo, 40% a la Entrega");
  const [executionDays, setExecutionDays] = useState(15);
  const [structuralValue, setStructuralValue] = useState(0);
  const [soilValue, setSoilValue] = useState(0);

  // Sharing & Upload Progress
  const [isUploading, setIsUploading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState({ url: "", platform: "whatsapp", message: "" });

  const todayStr = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  const isInitialized = useRef(false);

  // Load Data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [allQuotes, allClients] = await Promise.all([
          quotesDB.getAll(),
          clientsDB.getAll(),
        ]);
        const q = allQuotes.find((item) => item.id === quoteId);
        if (q) {
          setQuote(q);
          const c = allClients.find((item) => item.id === q.clientId);
          setClient(c || null);

          // Auto Setup Templates & Values
          if (!isInitialized.current) {
            isInitialized.current = true;
            const structService = q.services?.find((s) => s.id === "estructural" || s.name.toLowerCase().includes("estructural"));
            const soilService = q.services?.find((s) => s.id === "suelos" || s.name.toLowerCase().includes("suelos"));

            const structVal = structService ? structService.value : 0;
            const soilVal = soilService ? soilService.value : 0;

            setStructuralValue(structVal);
            setSoilValue(soilVal);

            if (q.customBody) {
              setQuoteType("PERSONALIZADA");
            } else if (q.type === "Estudio de Suelos") {
              setQuoteType("SUELOS");
              if (soilVal === 0 && q.value > 0) setSoilValue(q.value);
            } else if (q.type === "Cálculo Estructural") {
              setQuoteType("ESTRUCTURAL");
              if (structVal === 0 && q.value > 0) setStructuralValue(q.value);
            } else {
              setQuoteType("COMBINADO");
              if (structVal === 0 && soilVal === 0 && q.value > 0) {
                setStructuralValue(Math.round(q.value * 0.4));
                setSoilValue(Math.round(q.value * 0.6));
              }
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [quoteId]);

  const formatCurrency = (val) => {
    return val.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const getSubtotalValue = () => {
    if (quoteType === "ESTRUCTURAL") return structuralValue;
    if (quoteType === "SUELOS") return soilValue;
    return structuralValue + soilValue;
  };

  const getIvaValue = () => {
    return quote?.applyIva ? Math.round(getSubtotalValue() * 0.19) : 0;
  };

  const getTotalValue = () => {
    return getSubtotalValue() + getIvaValue();
  };

  // --- PDF UPLOAD & CLICK-TO-CHAT SHARING ---
  const handleShare = async (platform) => {
    if (!quote) return;
    setIsUploading(true);

    try {
      // Load CDN references dynamically from window
      const html2canvas = window.html2canvas;
      const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;

      if (!html2canvas || !jsPDF) {
        throw new Error("Librerías de PDF no cargadas en el navegador.");
      }

      const element = document.getElementById("printable-quote");
      if (!element) throw new Error("Elemento imprimible no encontrado.");

      // 1. Capture HTML with canvas
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("printable-quote");
          if (clonedElement) {
            clonedElement.style.boxShadow = "none";
            clonedElement.style.margin = "0";
            clonedElement.style.borderRadius = "0";
            clonedElement.style.padding = "2cm 1cm";
          }
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.85);

      // 2. Build PDF Document
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "letter", compress: true });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Page 1
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;

      // Extra Pages
      while (heightLeft > 0) {
        position -= pdfPageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;
      }

      const pdfBlob = pdf.output("blob");

      // 3. Upload to Supabase 'documentos' bucket
      const fileName = `COT_${quote.name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_${Date.now()}.pdf`;
      const filePath = `cotizaciones/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(filePath, pdfBlob, { contentType: "application/pdf", upsert: true });

      if (uploadError) throw uploadError;

      // 4. Retrieve Public URL
      const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(filePath);

      // 5. Update quote status to ENVIADA
      if (quote.status === "Borrador") {
        await quotesDB.update({ ...quote, status: "Enviada / En Revisión" });
      }

      // 6. Build outgoing messages
      const totalStr = formatCurrency(getTotalValue());
      const rawPhone = client?.phone || "";
      const formatPhone = rawPhone.replace(/[^0-9]/g, "");

      if (platform === "whatsapp") {
        if (!formatPhone) {
          alert("Error: El cliente seleccionado no tiene un número telefónico válido.");
          setIsUploading(false);
          return;
        }

        const waText = `*COTIZACIÓN - SUELOS Y ESTRUCTURAS E.U.*\n\n📌 *Proyecto:* ${quote.name.toUpperCase()}\n👤 *Cliente:* ${(client?.name || "CLIENTE").toUpperCase()}\n💰 *Valor:* ${totalStr}\n\n📄 *Descargar PDF:*\n${publicUrl}\n\n_Esperamos su amable confirmación._`;
        const waUrl = `https://wa.me/${formatPhone}?text=${encodeURIComponent(waText)}`;

        setShareData({
          url: waUrl,
          platform: "whatsapp",
          message: waText,
        });
        setIsShareModalOpen(true);
        
        // Auto-open WhatsApp
        window.open(waUrl, "_blank");
      } else {
        const emailTo = client?.contactEmail || "";
        const emailSubject = `COTIZACIÓN - ${quote.name.toUpperCase()} - SUELOS Y ESTRUCTURAS`;
        const emailBody = `Cordial saludo,\n\nAdjunto enviamos el enlace para descargar la cotización del proyecto:\n\n📌 Proyecto: ${quote.name.toUpperCase()}\n👤 Cliente: ${(client?.name || "CLIENTE").toUpperCase()}\n💰 Valor: ${totalStr}\n\n📄 Descargar PDF:\n${publicUrl}\n\n_Esperamos su amable confirmación._\n\nAtentamente,\n\nJAVIER OSPINA\nSuelos y Estructuras E.U.\nCel: 316 520 4073`;
        const mailUrl = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        setShareData({
          url: mailUrl,
          platform: "email",
          message: emailBody,
        });
        setIsShareModalOpen(true);
        
        // Auto-open Email Client
        window.location.href = mailUrl;
      }
    } catch (err) {
      console.error(err);
      alert("Error al procesar la cotización: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, height: "80vh", alignItems: "center", justifyContent: "center", color: G.textSecondary, fontFamily: FONT }}>
        <IconSpinner /> <span style={{ marginLeft: 8 }}>Cargando cotización...</span>
      </div>
    );
  }

  if (!quote) {
    return (
      <div style={{ display: "flex", flex: 1, height: "80vh", flexDirection: "column", alignItems: "center", justifyContent: "center", color: G.textSecondary, fontFamily: FONT }}>
        <h3>Cotización no encontrada</h3>
        <button onClick={onBack} style={{ marginTop: 12, background: G.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Volver</button>
      </div>
    );
  }

  const validityStr = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })
    : todayStr;

  return (
    <div style={{ 
      position: "fixed", 
      inset: 0, 
      zIndex: 9999, 
      overflowY: "auto", 
      background: darkMode ? "#0b0f19" : "#f1f5f9", 
      fontFamily: FONT 
    }} className="generator-wrapper">
      {/* ── TOOLBAR (Print-Hidden) ── */}
      <div style={{
        background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "12px 20px",
        display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)"
      }} className="print-hidden">
        
        {/* Left Toolbar actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${G.border}`,
            padding: "8px 12px", borderRadius: 8, color: G.textSecondary, cursor: "pointer", fontSize: 12, fontWeight: 750,
            fontFamily: FONT, transition: "all 0.2s"
          }} className="btn-secondary">
            <IconBack /> Volver
          </button>
          
          <div style={{ width: 1, height: 20, background: G.border }} />

          {/* Template types */}
          <div style={{ display: "flex", background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", padding: 3, borderRadius: 8 }}>
            {[["ESTRUCTURAL", "Estructural"], ["SUELOS", "Suelos"], ["COMBINADO", "Combinado"], ["PERSONALIZADA", "Personalizada"]].map(([type, label]) => (
              <button
                key={type}
                onClick={() => setQuoteType(type)}
                style={{
                  background: quoteType === type ? (darkMode ? "rgba(255,255,255,0.1)" : "#fff") : "none",
                  border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: quoteType === type ? 700 : 500,
                  color: quoteType === type ? G.accent : G.textSecondary, cursor: "pointer", fontFamily: FONT, transition: "all 0.2s"
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Parameter Tuning & Share Options */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {quoteType !== "ESTRUCTURAL" && quoteType !== "PERSONALIZADA" && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 11, background: darkMode ? "rgba(245,158,11,0.1)" : "#fef3c7",
              color: darkMode ? "#fbbf24" : "#b45309", padding: "6px 10px", borderRadius: 8, border: `1px solid ${darkMode ? "rgba(245,158,11,0.2)" : "#fde68a"}`
            }}>
              <span style={{ fontWeight: 700 }}>Suelos:</span>
              <input
                type="number"
                value={soilParams.perforations}
                onChange={(e) => setSoilParams({ ...soilParams, perforations: Math.max(1, parseInt(e.target.value) || 1) })}
                style={{ width: 35, textAlign: "center", border: `1px solid ${G.border}`, borderRadius: 4, background: darkMode ? "#1e293b" : "#fff", color: G.textPrimary, padding: "2px 0" }}
              />
              <span>perf x</span>
              <input
                type="number"
                value={soilParams.depth}
                onChange={(e) => setSoilParams({ ...soilParams, depth: Math.max(1, parseInt(e.target.value) || 1) })}
                style={{ width: 35, textAlign: "center", border: `1px solid ${G.border}`, borderRadius: 4, background: darkMode ? "#1e293b" : "#fff", color: G.textPrimary, padding: "2px 0" }}
              />
              <span>m</span>
            </div>
          )}

          {/* Pricing input fields */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 11, background: darkMode ? "rgba(59,130,246,0.1)" : "#eff6ff",
            color: darkMode ? "#93c5fd" : "#1d4ed8", padding: "6px 10px", borderRadius: 8, border: `1px solid ${darkMode ? "rgba(59,130,246,0.2)" : "#bfdbfe"}`
          }}>
            <span style={{ fontWeight: 700 }}>Valor ($):</span>
            {quoteType === "COMBINADO" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9 }}>Est:</span>
                <input
                  type="number"
                  value={structuralValue}
                  onChange={(e) => setStructuralValue(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 70, textAlign: "right", border: `1px solid ${G.border}`, borderRadius: 4, background: darkMode ? "#1e293b" : "#fff", color: G.textPrimary, padding: "2px 4px" }}
                />
                <span style={{ fontSize: 9, marginLeft: 2 }}>Suelos:</span>
                <input
                  type="number"
                  value={soilValue}
                  onChange={(e) => setSoilValue(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 70, textAlign: "right", border: `1px solid ${G.border}`, borderRadius: 4, background: darkMode ? "#1e293b" : "#fff", color: G.textPrimary, padding: "2px 4px" }}
                />
              </div>
            ) : (
              <input
                type="number"
                value={quoteType === "ESTRUCTURAL" ? structuralValue : soilValue}
                onChange={(e) => quoteType === "ESTRUCTURAL" ? setStructuralValue(Math.max(0, parseInt(e.target.value) || 0)) : setSoilValue(Math.max(0, parseInt(e.target.value) || 0))}
                style={{ width: 85, textAlign: "right", border: `1px solid ${G.border}`, borderRadius: 4, background: darkMode ? "#1e293b" : "#fff", color: G.textPrimary, padding: "2px 4px" }}
              />
            )}
          </div>

          {/* Share Action Buttons */}
          <button
            onClick={() => handleShare("whatsapp")}
            disabled={isUploading}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "#22c55e", color: "#fff", border: "none",
              padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
              fontFamily: FONT, boxShadow: "0 2px 4px rgba(34,197,94,0.2)"
            }}
          >
            {isUploading ? <IconSpinner /> : <IconWhatsApp />} WhatsApp
          </button>

          <button
            onClick={() => handleShare("email")}
            disabled={isUploading}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "#475569", color: "#fff", border: "none",
              padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
              fontFamily: FONT, boxShadow: "0 2px 4px rgba(71,85,105,0.2)"
            }}
          >
            {isUploading ? <IconSpinner /> : <IconMail />} Correo
          </button>

          <button
            onClick={handlePrint}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: G.accent, color: "#fff", border: "none",
              padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
              fontFamily: FONT, boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
            }}
          >
            <IconPrint /> PDF / Imprimir
          </button>
        </div>
      </div>

      {/* ── VISUAL PRINTABLE PROPOSAL SHEET ── */}
      <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }} className="print-content">
        <div
          id="printable-quote"
          className="font-century"
          style={{
            width: "21.59cm", minHeight: "27.94cm", background: "#ffffff",
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.08)",
            padding: "2.5cm 2.0cm", boxSizing: "border-box", display: "flex", flexDirection: "column",
            position: "relative", color: "#000",
            fontStyle: "italic"
          }}
        >
          {/* Header section */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: 12, marginBottom: 16 }}>
            <div>
              {/* BRAND LOGO EMBED */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 25 L50 45 L90 25 L90 10 L50 30 L10 10 Z" fill="#1F3A52" />
                  <path d="M10 25 L50 45 V60 L10 40 Z" fill="#1F3A52" fillOpacity="0.8" />
                  <path d="M10 50 L50 70 L90 50 L90 35 L50 55 L10 35 Z" fill="#901B2F" />
                  <path d="M10 50 L50 70 V85 L10 65 Z" fill="#901B2F" fillOpacity="0.8" />
                  <path d="M10 75 L50 95 L90 75 L90 60 L50 80 L10 60 Z" fill="#64748B" />
                </svg>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, fontWeight: "bold", textTransform: "uppercase", fontFamily: "CenturyGothic, 'Century Gothic', AppleGothic, sans-serif" }}>
                  <span style={{ color: "#901B2F", fontSize: 20 }}>Suelos &</span>
                  <span style={{ color: "#1F3A52", fontSize: 20 }}>Estructuras</span>
                </div>
              </div>
              
              <div style={{ fontSize: 9, color: "#64748b", marginTop: 6, fontWeight: 500, fontStyle: "italic", fontFamily: "CenturyGothic, sans-serif" }}>
                <p style={{ margin: 0 }}>NIT 900.188.507-4</p>
                <p style={{ margin: 0 }}>Cel: 316 520 4073</p>
                <p style={{ margin: 0 }}>suelosyestructuras@gmail.com</p>
              </div>
            </div>

            <div style={{ textAlign: "right", fontFamily: "CenturyGothic, sans-serif", fontStyle: "italic" }}>
              <h1 style={{ fontSize: 28, fontWeight: "bold", color: "#1F3A52", textTransform: "uppercase", margin: 0, letterSpacing: "0.05em" }}>COTIZACIÓN</h1>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", margin: "2px 0 0 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>NO. PROPUESTA-{quote.id ? quote.id.slice(0, 4).toUpperCase() : "B164"}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: "6px 0 0 0" }}>{todayStr}</p>
            </div>
          </div>

          {/* Client & Project reference */}
          <div style={{ 
            fontSize: 11, 
            fontStyle: "italic", 
            color: "#334155", 
            marginBottom: 20, 
            display: "flex", 
            flexDirection: "column", 
            gap: 6,
            fontFamily: "CenturyGothic, 'Century Gothic', AppleGothic, sans-serif" 
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr" }}>
              <span style={{ fontWeight: "bold", color: "#000" }}>SEÑORES:</span>
              <div>
                <span style={{ fontWeight: "bold", color: "#000", fontSize: 11.5, display: "block" }}>{(client?.name || "CLIENTE").toUpperCase()}</span>
                {client?.address && <span style={{ fontSize: 10, color: "#64748b", display: "block", marginTop: 2 }}>{client.address}</span>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", marginTop: 2 }}>
              <span style={{ fontWeight: "bold", color: "#000" }}>REFERENCIA:</span>
              <span style={{ fontWeight: "bold", color: "#1F3A52", fontSize: 11.5 }}>{quote.name.toUpperCase()}</span>
            </div>
          </div>

          {/* Core Proposal Body */}
          <div style={{ flex: 1 }}>
            {quoteType === "PERSONALIZADA" ? (
              <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5, textAlign: "justify", whiteSpace: "pre-wrap", minHeight: "10cm" }}>
                {quote.customBody || "Edita la cotización para registrar el cuerpo personalizado de esta propuesta técnica."}
              </div>
            ) : (
              <>
                <div style={{ 
                  fontSize: 11, 
                  color: "#334155", 
                  lineHeight: 1.4, 
                  textAlign: "justify", 
                  marginBottom: 16,
                  fontFamily: "CenturyGothic, 'Century Gothic', AppleGothic, sans-serif"
                }}>
                  Es un placer recibir su cordial invitación a la cotización del Proyecto <span style={{ fontWeight: "bold", color: "#000" }}>{(quote.description || quote.name).toUpperCase()}</span> que consta de:
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Scope 1: Structural Design */}
                  {(quoteType === "ESTRUCTURAL" || quoteType === "COMBINADO") && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 4, height: 20, background: "#1F3A52" }} />
                        <h3 style={{ fontSize: 14, fontWeight: "bold", color: "#000", textTransform: "uppercase", margin: 0, fontFamily: "CenturyGothic, 'Century Gothic', AppleGothic, sans-serif" }}>1. DISEÑO ESTRUCTURAL</h3>
                      </div>
                      
                      <div style={{ 
                        background: "#f4f8fb", 
                        borderRadius: 12, 
                        padding: "16px 20px", 
                        border: "1px solid #e2e8f0", 
                        fontSize: "11px", 
                        color: "#334155", 
                        lineHeight: 1.5,
                        fontFamily: "CenturyGothic, 'Century Gothic', AppleGothic, sans-serif"
                      }}>
                        <p style={{ margin: "0 0 8px 0", fontStyle: "italic" }}>Se realiza de acuerdo a lo señalado por el solicitante conforme a las especificaciones requeridas:</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontStyle: "italic" }}>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>1.</span>
                            <span>Diseño estructural de los elementos del sistema de resistencia sísmica (SRS) y sistema de resistencia a cargas verticales.</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>2.</span>
                            <span>Diseño estructural de cimentación según recomendación del geotecnista.</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "flex-start" }}>
                              <span style={{ fontWeight: "bold", minWidth: "18px" }}>3.</span>
                              <span>El diseño estructural está regido por las siguientes normas aplicables:</span>
                            </div>
                            <ul style={{ listStyleType: "disc", margin: "4px 0 4px 24px", padding: 0 }}>
                              <li style={{ marginBottom: 2 }}>Norma Colombiana de Diseño y Construcción Sismo Resistente NSR-10.</li>
                              <li style={{ marginBottom: 2 }}>American Concrete Institute ACI 318S-05.</li>
                              <li style={{ marginBottom: 2 }}>American Institute of Steel Construction AISC 360-16.</li>
                              <li style={{ marginBottom: 2 }}>Recomendaciones para requisitos sísmicos de estructuras diferentes de edificaciones AIS 180-13.</li>
                            </ul>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "flex-start" }}>
                              <span style={{ fontWeight: "bold", minWidth: "18px" }}>4.</span>
                              <span>Dos copias de memoria de cálculo impresa y una copia digital conteniendo:</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "4px 0 4px 24px" }}>
                              <ul style={{ listStyleType: "disc", margin: 0, padding: 0 }}>
                                <li style={{ marginBottom: 2 }}>Generalidades, Sismicidad y Amenaza.</li>
                                <li style={{ marginBottom: 2 }}>Análisis Sísmico y Estructural.</li>
                                <li style={{ marginBottom: 2 }}>Protección contra fuego.</li>
                              </ul>
                              <ul style={{ listStyleType: "disc", margin: 0, padding: 0 }}>
                                <li style={{ marginBottom: 2 }}>Sistemas Estructurales, Cargas.</li>
                                <li style={{ marginBottom: 2 }}>Elementos no Estructurales.</li>
                              </ul>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>5.</span>
                            <span>Tres copias de Planos Estructurales con plantas Estructurales, despiece de cimentación, despiece de vigas de amarre y enrase, despiece de Columnas.</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>6.</span>
                            <span>Diseño de Cimentaciones.</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>7.</span>
                            <span>Diseño de Elementos Metálicos, de Concreto y conexiones de Cubierta.</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>8.</span>
                            <span>Especificaciones de Construcción.</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>9.</span>
                            <span>Propuestas de sistemas estructurales más convenientes y rentables (servicio vs costo).</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>10.</span>
                            <span>Información en formato Digital.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scope 2: Soil Study */}
                  {(quoteType === "SUELOS" || quoteType === "COMBINADO") && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 4, height: 20, background: "#901B2F" }} />
                        <h3 style={{ fontSize: 14, fontWeight: "bold", color: "#000", textTransform: "uppercase", margin: 0, fontFamily: "CenturyGothic, 'Century Gothic', AppleGothic, sans-serif" }}>2. ESTUDIO GEOTÉCNICO DE SUELOS</h3>
                      </div>

                      <div style={{ 
                        background: "#f4f8fb", 
                        borderRadius: 12, 
                        padding: "16px 20px", 
                        border: "1px solid #e2e8f0", 
                        fontSize: "11px", 
                        color: "#334155", 
                        lineHeight: 1.5,
                        fontFamily: "CenturyGothic, 'Century Gothic', AppleGothic, sans-serif"
                      }}>
                        <p style={{ margin: "0 0 8px 0", fontStyle: "italic" }}>El estudio de suelos contempla exploración directa y ensayos de laboratorio normalizados:</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontStyle: "italic" }}>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>1.</span>
                            <span>Exploración directa en campo realizando <span style={{ fontWeight: "bold", color: "#000" }}>{soilParams.perforations} perforaciones</span> a una profundidad de <span style={{ fontWeight: "bold", color: "#000" }}>{soilParams.depth} metros</span> cada una.</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>2.</span>
                            <span>Toma de muestras inalteradas y alteradas en cada nivel de exploración.</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", minWidth: "18px" }}>3.</span>
                            <span>Ensayos de laboratorio completos: clasificación e identificación de suelos, límites de consistencia y humedad natural.</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "flex-start" }}>
                              <span style={{ fontWeight: "bold", minWidth: "18px" }}>4.</span>
                              <span>Informe final de Ingeniería Geotécnica incluyendo:</span>
                            </div>
                            <ul style={{ listStyleType: "disc", margin: "4px 0 4px 24px", padding: 0 }}>
                              <li style={{ marginBottom: 2 }}>Cálculo de capacidad portante admisible de diseño de cimentaciones.</li>
                              <li style={{ marginBottom: 2 }}>Recomendaciones de profundidad y tipos de cimentación recomendada.</li>
                              <li style={{ marginBottom: 2 }}>Parámetros de diseño sísmico de acuerdo a la Norma Colombiana NSR-10.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Pricing Summary and Signatures */}
          <div style={{ 
            pageBreakInside: "avoid", 
            marginTop: 20, 
            border: "1px solid #e2e8f0", 
            borderRadius: 12, 
            padding: 16, 
            background: "#f8fafc",
            fontFamily: "CenturyGothic, 'Century Gothic', AppleGothic, sans-serif"
          }} className="quote-totals-panel">
            <div style={{ marginBottom: 12 }}>
              {quoteType === "COMBINADO" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "#334155", fontStyle: "italic" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>DISEÑO Y CÁLCULO ESTRUCTURAL:</span>
                    <span style={{ fontWeight: "bold" }}>{formatCurrency(structuralValue)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>ESTUDIO GEOTÉCNICO DE SUELOS:</span>
                    <span style={{ fontWeight: "bold" }}>{formatCurrency(soilValue)}</span>
                  </div>
                  
                  {quote?.applyIva && (
                    <>
                      <div style={{ height: 1, background: "#cbd5e1", margin: "4px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>SUBTOTAL NETO:</span>
                        <span style={{ fontWeight: "bold" }}>{formatCurrency(getSubtotalValue())}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>IVA REGULADO (19%):</span>
                        <span style={{ fontWeight: "bold" }}>{formatCurrency(getIvaValue())}</span>
                      </div>
                    </>
                  )}
                  
                  <div style={{ height: 1.5, background: "#cbd5e1", margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontStyle: "italic" }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "#1F3A52", letterSpacing: "0.02em" }}>TOTAL DE LA PROPUESTA TÉCNICA</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#1F3A52" }}>{formatCurrency(getTotalValue())}</span>
                  </div>
                </div>
              ) : quoteType === "ESTRUCTURAL" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "#334155", fontStyle: "italic" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>SUBTOTAL</span>
                    <span style={{ fontWeight: "bold" }}>{formatCurrency(structuralValue)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>IVA (19%)</span>
                    <span style={{ fontWeight: "bold" }}>{formatCurrency(getIvaValue())}</span>
                  </div>
                  
                  <div style={{ height: 1, background: "#cbd5e1", margin: "8px 0" }} />
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontStyle: "italic" }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "#1F3A52", letterSpacing: "0.02em" }}>TOTAL PROPUESTA ESTRUCTURAL</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#1F3A52" }}>{formatCurrency(getTotalValue())}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "#334155", fontStyle: "italic" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>SUBTOTAL</span>
                    <span style={{ fontWeight: "bold" }}>{formatCurrency(soilValue)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>IVA (19%)</span>
                    <span style={{ fontWeight: "bold" }}>{formatCurrency(getIvaValue())}</span>
                  </div>
                  
                  <div style={{ height: 1, background: "#cbd5e1", margin: "8px 0" }} />
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontStyle: "italic" }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "#901B2F", letterSpacing: "0.02em" }}>TOTAL PROPUESTA ESTUDIO DE SUELOS</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#901B2F" }}>{formatCurrency(getTotalValue())}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Terms & Execution Days */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1.5fr 0.8fr 1fr", 
              gap: 16, 
              paddingTop: 12, 
              borderTop: "1px solid #cbd5e1", 
              fontSize: 10, 
              color: "#64748b" 
            }}>
              <div>
                <span style={{ fontWeight: "bold", color: "#64748b", display: "block", textTransform: "uppercase", fontSize: 8, letterSpacing: "0.04em", marginBottom: 4 }}>Forma de Pago</span>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  style={{ 
                    width: "100%", 
                    background: "none", 
                    border: "none", 
                    borderBottom: "1px solid #cbd5e1", 
                    fontSize: "11px", 
                    fontStyle: "italic", 
                    fontWeight: "bold", 
                    outline: "none", 
                    color: "#000", 
                    padding: "2px 0" 
                  }}
                  className="print-border-none"
                />
              </div>
              <div>
                <span style={{ fontWeight: "bold", color: "#64748b", display: "block", textTransform: "uppercase", fontSize: 8, letterSpacing: "0.04em", marginBottom: 4 }}>Ejecución</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="number"
                    value={executionDays}
                    onChange={(e) => setExecutionDays(parseInt(e.target.value) || 1)}
                    style={{ 
                      width: 32, 
                      background: "none", 
                      border: "none", 
                      borderBottom: "1px solid #cbd5e1", 
                      fontSize: "11px", 
                      fontWeight: "bold", 
                      outline: "none", 
                      color: "#000", 
                      padding: "2px 0", 
                      textAlign: "center",
                      fontStyle: "italic"
                    }}
                    className="print-border-none"
                  />
                  <span style={{ fontWeight: "bold", fontSize: "11px", color: "#000", fontStyle: "italic" }}>días</span>
                </div>
              </div>
              <div>
                <span style={{ fontWeight: "bold", color: "#64748b", display: "block", textTransform: "uppercase", fontSize: 8, letterSpacing: "0.04em", marginBottom: 4 }}>Validez</span>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#000", display: "block", fontStyle: "italic", marginTop: 2 }}>{validityStr}</span>
              </div>
            </div>
          </div>

          {/* Signature Block */}
          <div style={{ 
            marginTop: 50, 
            fontSize: 10, 
            color: "#64748b", 
            pageBreakInside: "avoid",
            fontFamily: "CenturyGothic, 'Century Gothic', AppleGothic, sans-serif"
          }}>
            <div style={{ width: "250px", height: "1px", background: "#cbd5e1", marginBottom: 12 }} />
            <span style={{ fontWeight: 700, color: "#000", fontSize: 11, display: "block", marginBottom: 2 }}>JAVIER H. OSPINA T.</span>
            <span style={{ display: "block", fontSize: 9.5, marginBottom: 2 }}>Gerente</span>
            <span style={{ fontWeight: 500, color: "#64748b", display: "block", fontSize: 9.5, textTransform: "uppercase" }}>SUELOS Y ESTRUCTURAS</span>
            <span style={{ display: "block", fontSize: 9.5 }}>Cel. 316 520 4073</span>
          </div>
        </div>
      </div>

      {/* ── STYLESHEET EMBED ── */}
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { -webkit-print-color-adjust: exact; background: white !important; }
          .print-hidden { display: none !important; }
          .generator-wrapper { 
            background: white !important; 
            min-height: auto !important; 
            padding: 0 !important; 
            position: static !important; 
            overflow: visible !important; 
            height: auto !important; 
          }
          .print-content { padding: 0 !important; }
          #printable-quote { border: none !important; boxShadow: none !important; padding: 1.5cm 1.5cm !important; margin: 0 !important; width: 100% !important; }
          .print-border-none { border-bottom: none !important; }
        }
        .font-century { font-family: 'Century Gothic', CenturyGothic, AppleGothic, sans-serif; }
      `}</style>

      {/* ── SHARE MODAL dialog ── */}
      {isShareModalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: darkMode ? "#1e293b" : "#ffffff", border: `1px solid ${G.borderHigh}`, borderRadius: 16,
            padding: 24, maxWidth: 420, width: "90%", boxShadow: G.cardShadow, display: "flex", flexDirection: "column", gap: 16
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 50, height: 50, borderRadius: 25, display: "flex", alignItems: "center", justifyContent: "center",
                background: shareData.platform === "whatsapp" ? G.greenSoft : G.accentSoft,
                color: shareData.platform === "whatsapp" ? G.green : G.accent, margin: "0 auto 12px auto"
              }}>
                {shareData.platform === "whatsapp" ? <IconWhatsApp /> : <IconMail />}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: G.textPrimary, margin: 0 }}>¡Propuesta Generada!</h3>
              <p style={{ fontSize: 12, color: G.textSecondary, margin: "4px 0 0 0" }}>El documento PDF se cargó exitosamente en Supabase Storage.</p>
            </div>

            <div style={{ background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${G.border}`, borderRadius: 8, padding: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 750, color: G.textTertiary, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Mensaje a Enviar:</span>
              <p style={{ fontSize: 11, color: G.textSecondary, fontStyle: "italic", margin: 0, whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {shareData.message}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a
                href={shareData.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", boxSizing: "border-box",
                  background: shareData.platform === "whatsapp" ? "#22c55e" : G.accent, color: "#fff",
                  textDecoration: "none", padding: "10px 0", borderRadius: 10, fontWeight: 700, fontSize: 13,
                  textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "transform 0.1s"
                }}
              >
                {shareData.platform === "whatsapp" ? "Enviar por WhatsApp" : "Enviar por Correo"}
              </a>
              <button
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer", color: G.textTertiary, fontSize: 12,
                  fontWeight: 600, padding: "6px 0", textAlign: "center", fontFamily: FONT
                }}
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
