import { useState, useEffect, useRef } from "react";
import { financialsDB } from "../lib/supabaseCRM.js";

const FONT = "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif";
const CENTURY_GOTHIC = "'Century Gothic', CenturyGothic, AppleGothic, sans-serif";

// ── Brand constants ───────────────────────────────────────────────────────────
const RED  = "#901B2F";
const BLUE = "#1F3A52";
const GREY = "#64748B";

const BENEFICIARIES = {
  EMPRESA: {
    legalName: "SUELOS Y ESTRUCTURAS E.U.",
    nit: "NIT 900.188.507-4",
    phone: "316 520 4073",
    email: "suelosyestructuras@gmail.com",
    taxStatus: "Régimen Común - Responsable de IVA",
    bankName: "Banco Finandina",
    bankAccount: "9100058153",
    accountType: "Ahorros Empresarial",
  },
  PERSONAL: {
    legalName: "JAVIER OSPINA",
    nit: "CC 6.445.288",
    phone: "316 520 4073",
    email: "suelosyestructuras@gmail.com",
    taxStatus: "No Responsable de IVA",
    bankName: "Bancolombia",
    bankAccount: "304 406 57 496",
    accountType: "Ahorros",
  },
};

const PERSONAL_ACCOUNTS = [
  "BANCOLOMBIA AHORROS #304 406 57 496 - JAVIER OSPINA CC 6.445.288",
  "NEQUI #316 520 4073 - JAVIER OSPINA",
  "NU COLOMBIA - LLAVE CÉDULA: 6.445.288 - JAVIER OSPINA",
];

function BrandLogo({ size = 52 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <path d="M10 25 L50 45 L90 25 L90 10 L50 30 L10 10 Z" fill={BLUE} />
        <path d="M10 25 L50 45 V60 L10 40 Z" fill={BLUE} fillOpacity="0.8" />
        <path d="M10 50 L50 70 L90 50 L90 35 L50 55 L10 35 Z" fill={RED} />
        <path d="M10 50 L50 70 V85 L10 65 Z" fill={RED} fillOpacity="0.8" />
        <path d="M10 75 L50 95 L90 75 L90 60 L50 80 L10 60 Z" fill={GREY} />
      </svg>
      <div style={{ lineHeight:1.1, fontWeight:800, textTransform:"uppercase", letterSpacing:"-0.02em" }}>
        <div style={{ color: RED, fontSize: size*0.45, display:"block" }}>Suelos &</div>
        <div style={{ color: BLUE, fontSize: size*0.45, display:"block" }}>Estructuras</div>
      </div>
    </div>
  );
}

function fmtCOP(n) {
  if (!n && n !== 0) return "$0";
  return new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0, maximumFractionDigits:0 }).format(n);
}

function fmtDate(d) {
  if (!d) return new Date().toLocaleDateString("es-ES", { year:"numeric", month:"long", day:"numeric" });
  return new Date(d).toLocaleDateString("es-ES", { year:"numeric", month:"long", day:"numeric" });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ViewRecibo({ project, client, onBack }) {
  const [docType,     setDocType]     = useState("CUENTA"); // "CUENTA" | "RECIBO"
  const [beneficiary, setBeneficiary] = useState("EMPRESA");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [ivaPercent,  setIvaPercent]  = useState(0);
  const [advance,     setAdvance]     = useState(0);
  const [payment,     setPayment]     = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(fmtDate());
  const [clientName,  setClientName]  = useState(client?.name?.toUpperCase() || "");
  const [projDesc,    setProjDesc]    = useState(project?.name?.toUpperCase() || "");
  const [items,       setItems]       = useState([]);
  const [sharing,     setSharing]     = useState(false);
  const docRef = useRef(null);

  // Init items and totals from project services + financials
  useEffect(() => {
    if (!project) return;
    const svcItems = (project.services?.length > 0 ? project.services : []).map(s => ({
      description: s.name, unitPrice: s.value || 0, quantity: 1, total: s.value || 0,
    }));
    if (svcItems.length === 0 && project.valueWithoutTax > 0) {
      svcItems.push({ description: "Honorarios Profesionales", unitPrice: project.valueWithoutTax, quantity: 1, total: project.valueWithoutTax });
    }
    setItems(svcItems);

    // Auto-select doc type and pre-fill payment from financials
    financialsDB.getByProject(project.id).then(fins => {
      const paid = fins.filter(f => f.type === "Cobro / Factura" && f.status === "Pagado").reduce((s, f) => s + f.amount, 0);
      setPayment(paid);
      const bal = project.valueWithoutTax - paid;
      setDocType(bal > 0 ? "CUENTA" : "RECIBO");
    }).catch(() => {});
  }, [project]);

  const subtotal = items.reduce((s, i) => s + (i.total || 0), 0);
  const ivaAmt   = subtotal * (ivaPercent / 100);
  const totalFinal = subtotal + ivaAmt;
  const balance  = Math.max(0, totalFinal - advance - payment);
  const ben      = BENEFICIARIES[beneficiary];
  const invoiceNumber = `SYE${project?.invoiceNumber ?? "---"}`;
  const firstClientName = client?.contactPerson?.split(" ")[0] || client?.name?.split(" ")[0] || "Cliente";
  const clientPhone = client?.phone?.replace(/[^0-9]/g, "") || "";
  const isEmpresa = beneficiary === "EMPRESA";

  function handleItemChange(idx, field, value) {
    const next = [...items];
    const it   = { ...next[idx], [field]: value };
    if (field === "unitPrice" || field === "quantity") {
      it.total = Number(it.unitPrice) * Number(it.quantity);
    }
    next[idx] = it;
    setItems(next);
  }

  function handleWhatsApp() {
    if (!clientPhone) { alert("El cliente no tiene número de teléfono registrado."); return; }
    const title   = docType === "CUENTA" ? "CUENTA DE COBRO" : "RECIBO DE CAJA";
    const message = `*${title} - SUELOS Y ESTRUCTURAS E.U.*\n\n📌 *Proyecto:* ${project?.name?.toUpperCase()}\n👤 *Cliente:* ${clientName}\n💰 *Valor:* ${fmtCOP(subtotal)}\n📅 *Fecha:* ${invoiceDate}\n\n${docType === "CUENTA" ? `💳 *Saldo Pendiente:* ${fmtCOP(balance)}` : `✅ *Pago Recibido:* ${fmtCOP(payment)}`}\n\n_Esperamos su amable confirmación._`;
    window.open(`https://wa.me/57${clientPhone}?text=${encodeURIComponent(message)}`, "_blank");
  }

  function handleEmail() {
    if (!client?.contactEmail) { alert("El cliente no tiene email registrado."); return; }
    const title   = docType === "CUENTA" ? "CUENTA DE COBRO" : "RECIBO DE CAJA";
    const subject = `${title} - ${project?.name?.toUpperCase()} - SUELOS Y ESTRUCTURAS`;
    const body    = `Cordial saludo,\n\nAdjunto el documento del proyecto:\n\nTipo: ${title}\nProyecto: ${project?.name?.toUpperCase()}\nCliente: ${clientName}\nValor: ${fmtCOP(subtotal)}\n${docType === "CUENTA" ? `Saldo Pendiente: ${fmtCOP(balance)}` : `Pago Registrado: ${fmtCOP(payment)}`}\n\nAtentamente,\n\nJAVIER OSPINA\nSuelos y Estructuras E.U.\nCel: 316 520 4073`;
    window.open(`mailto:${client.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  }

  function handlePrint() { window.print(); }

  // ── Toolbar button styles ──────────────────────────────────────────────────
  const toolBtn = (bg, color="#fff") => ({
    display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8,
    border:"none", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily: FONT,
    background: bg, color, whiteSpace:"nowrap",
  });

  return (
    <>
      {/* ── Toolbar (hidden on print) ────────────────────────────────────── */}
      <div className="no-print" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap", padding:"10px 0 16px", borderBottom:"1px solid #e2e8f0", marginBottom:20 }}>
        {/* Back */}
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:"#64748b", fontSize:12, fontFamily: FONT, fontWeight:600 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Volver al Proyecto
        </button>

        {/* Center controls */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>

          {/* Doc type */}
          <div style={{ display:"flex", background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:3, gap:2 }}>
            {[["CUENTA","Cuenta de Cobro","#4338ca"],["RECIBO","Recibo de Caja","#059669"]].map(([val,lbl,ac]) => (
              <button key={val} onClick={() => setDocType(val)}
                style={{ padding:"6px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, background: docType===val ? ac : "transparent", color: docType===val ? "#fff" : "#64748b", fontFamily: FONT }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Beneficiary */}
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"6px 10px" }}>
            <span style={{ fontSize:10, fontWeight:700, color:"#1d4ed8" }}>A nombre de:</span>
            <div style={{ display:"flex", gap:0 }}>
              {[["EMPRESA","🏢 Empresa"],["PERSONAL","👤 Personal"]].map(([val,lbl],i) => (
                <button key={val} onClick={() => setBeneficiary(val)}
                  style={{ padding:"4px 10px", border:"1px solid #bfdbfe", cursor:"pointer", fontSize:11, fontWeight:700, background: beneficiary===val ? "#1d4ed8" : "#fff", color: beneficiary===val ? "#fff" : "#64748b", fontFamily: FONT, borderRadius: i===0?"6px 0 0 6px":"0 6px 6px 0" }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp */}
          <button onClick={handleWhatsApp} title={clientPhone ? `Enviar a: ${client?.phone}` : "Sin número"} style={toolBtn("#22c55e")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.115.55 4.101 1.512 5.833L0 24l6.335-1.56A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12zm0 21.818c-1.903 0-3.68-.506-5.209-1.384l-.374-.222-3.876.954.993-3.783-.245-.389A9.817 9.817 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z"/></svg>
            WhatsApp a {firstClientName}
          </button>

          {/* Email */}
          <button onClick={handleEmail} title={client?.contactEmail || "Sin email"} style={toolBtn("#334155")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email
          </button>

          {/* Print */}
          <button onClick={handlePrint} style={toolBtn("#2563eb")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir
          </button>
        </div>
      </div>

      {/* ── Document sheet (Letter size simulation) ──────────────────────── */}
      <div ref={docRef} id="invoice-sheet"
        style={{ maxWidth:"21.59cm", margin:"0 auto", background:"#fff", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", padding:"1.8cm 2cm", fontFamily: CENTURY_GOTHIC, fontStyle:"italic", fontSize:13, color:"#1e293b", lineHeight:1.5 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
          <div>
            {isEmpresa ? <BrandLogo size={52} /> : (
              <div style={{ fontSize:22, fontWeight:800, color: BLUE, fontStyle:"italic" }}>{ben.legalName}</div>
            )}
            <div style={{ fontSize:12, color:"#64748b", marginTop:6 }}>{ben.nit}</div>
          </div>

          {/* Invoice info box */}
          <div style={{ border:"1.5px solid #1e293b", width:240 }}>
            <div style={{ background: docType==="CUENTA" ? "#4338ca" : "#059669", color:"#fff", fontWeight:700, textAlign:"center", padding:"5px 8px", fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily: CENTURY_GOTHIC }}>
              {docType === "CUENTA" ? "Cuenta de Cobro" : "Recibo de Caja"}
            </div>
            <div style={{ padding:"8px 10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", borderBottom:"1px solid #cbd5e1", paddingBottom:6, marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:13 }}>Num:</span>
                <input value={invoiceNumber} readOnly style={{ textAlign:"right", fontWeight:600, fontSize:13, border:"none", outline:"none", background:"transparent", fontFamily: CENTURY_GOTHIC, color:"#1e293b", width:100 }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontWeight:700, fontSize:12 }}>Fecha:</span>
                <input value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
                  style={{ textAlign:"right", fontSize:11, border:"none", outline:"none", background:"transparent", fontFamily: CENTURY_GOTHIC, color:"#475569", width:130 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Deudor / Recibido De */}
        <div style={{ borderLeft:"4px solid #1e293b", paddingLeft:14, paddingTop:6, paddingBottom:6, marginBottom:14 }}>
          <span style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", display:"block", marginBottom:3 }}>
            {docType === "CUENTA" ? "Deudor (Cliente):" : "Recibido De:"}
          </span>
          <input value={clientName} onChange={e => setClientName(e.target.value)}
            style={{ fontSize:18, fontWeight:800, fontStyle:"italic", outline:"none", border:"none", background:"transparent", width:"100%", color:"#1e293b", textTransform:"uppercase", fontFamily: CENTURY_GOTHIC }} />
          <div style={{ fontSize:12, color:"#64748b", marginTop:4, display:"flex", gap:16 }}>
            <span>NIT/CC: {client?.identification || "_________________"}</span>
            <span>Tel: {client?.phone || "_________________"}</span>
          </div>
        </div>

        {/* Debe A / Pagó A connector */}
        <div style={{ display:"flex", alignItems:"center", gap:12, margin:"10px 0 14px" }}>
          <div style={{ flex:1, height:1, background:"#cbd5e1" }} />
          <span style={{ fontSize:11, fontWeight:800, color:"#1e293b", textTransform:"uppercase", letterSpacing:"0.2em", background:"#f1f5f9", padding:"4px 14px", borderRadius:20, border:"1px solid #e2e8f0" }}>
            {docType === "CUENTA" ? "DEBE A" : "PAGÓ A"}
          </span>
          <div style={{ flex:1, height:1, background:"#cbd5e1" }} />
        </div>

        {/* Acreedor */}
        <div style={{ borderRight:"4px solid #e2e8f0", paddingRight:14, paddingTop:4, paddingBottom:6, textAlign:"right", marginBottom:20 }}>
          <span style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", display:"block", marginBottom:3 }}>
            {docType === "CUENTA" ? "Acreedor (Beneficiario):" : "Pagado A:"}
          </span>
          <div style={{ fontSize:18, fontWeight:800, fontStyle:"italic", color:"#1e293b" }}>{ben.legalName}</div>
          <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>
            {ben.nit}<br />
            {ben.phone} | {ben.email}
          </div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{ben.taxStatus}</div>
        </div>

        {/* Project summary bar */}
        <div style={{ border:"2px solid #1e293b", borderRadius:10, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#1e293b", marginBottom:3 }}>Proyecto:</div>
            <input value={projDesc} onChange={e => setProjDesc(e.target.value)}
              style={{ fontWeight:700, fontStyle:"italic", border:"none", outline:"none", background:"transparent", width:"100%", fontSize:12, color:"#475569", textTransform:"uppercase", fontFamily: CENTURY_GOTHIC }} />
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:"#1e293b", whiteSpace:"nowrap", paddingLeft:16 }}>
            {fmtCOP(subtotal)}
          </div>
        </div>

        {/* Items table */}
        <div style={{ border:"2px solid #1e293b", borderRadius:10, overflow:"hidden", marginBottom:16 }}>
          <div style={{ background:"#f1f5f9", borderBottom:"2px solid #1e293b", display:"grid", gridTemplateColumns:"5fr 2fr 1fr 2fr", padding:"8px 12px", gap:8 }}>
            {["DESCRIPCIÓN","PRECIO U.","CANT","COSTE"].map((h,i) => (
              <div key={h} style={{ fontSize:10, fontWeight:800, color:"#64748b", textTransform:"uppercase", textAlign: i>0?"right":"left" }}>{h}</div>
            ))}
          </div>
          <div style={{ minHeight:40, padding:"4px 4px" }}>
            {items.map((it, idx) => (
              <div key={idx} style={{ display:"grid", gridTemplateColumns:"5fr 2fr 1fr 2fr", padding:"6px 8px", gap:8, borderBottom: idx < items.length-1 ? "1px dashed #e2e8f0" : "none", alignItems:"center" }}>
                <input value={it.description} onChange={e => handleItemChange(idx,"description",e.target.value)}
                  style={{ border:"none", outline:"none", background:"transparent", fontSize:12, color:"#475569", fontStyle:"italic", fontFamily: CENTURY_GOTHIC }} />
                <input type="number" value={it.unitPrice} onChange={e => handleItemChange(idx,"unitPrice",Number(e.target.value))}
                  style={{ border:"none", outline:"none", background:"transparent", fontSize:12, color:"#475569", textAlign:"right", fontStyle:"italic", fontFamily: CENTURY_GOTHIC, width:"100%" }} />
                <input type="number" value={it.quantity} onChange={e => handleItemChange(idx,"quantity",Number(e.target.value))}
                  style={{ border:"none", outline:"none", background:"transparent", fontSize:12, color:"#475569", textAlign:"center", fontStyle:"italic", fontFamily: CENTURY_GOTHIC, width:"100%" }} />
                <div style={{ fontSize:12, fontWeight:600, color:"#1e293b", textAlign:"right", fontStyle:"italic" }}>{fmtCOP(it.total)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: payment method (left) + financial summary (right) */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:24, marginTop:8 }}>

          {/* Payment method */}
          <div style={{ flex:1, paddingTop:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:700, textTransform:"uppercase" }}>Forma de Pago:</span>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                style={{ border:"none", borderBottom:"1px solid #cbd5e1", outline:"none", background:"transparent", fontStyle:"italic", fontSize:12, fontFamily: CENTURY_GOTHIC, cursor:"pointer", color:"#1e293b" }}>
                <option>Efectivo</option>
                <option>Transferencia Bancaria</option>
              </select>
            </div>
            {paymentMethod === "Transferencia Bancaria" && (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <span style={{ fontSize:10, color:"#64748b", fontWeight:700, textTransform:"uppercase" }}>Datos de Consignación:</span>
                {beneficiary === "PERSONAL" && (
                  <select onChange={e => { if (e.target.value) setPaymentDetails(e.target.value); }}
                    style={{ fontSize:11, border:"1px solid #cbd5e1", borderRadius:6, padding:"4px 8px", fontFamily: CENTURY_GOTHIC, fontStyle:"italic", color:"#1e293b", background:"#fff" }}>
                    <option value="">-- Cuenta predefinida --</option>
                    {PERSONAL_ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}
                <input value={paymentDetails} onChange={e => setPaymentDetails(e.target.value)}
                  placeholder={isEmpresa ? "BANCO FINANDINA / 9100058153" : "O escribir otro..."}
                  style={{ fontSize:12, border:"1px solid #e2e8f0", borderRadius:6, padding:"5px 8px", fontStyle:"italic", fontFamily: CENTURY_GOTHIC, color:"#475569", background:"#fff", outline:"none" }} />
              </div>
            )}
            {/* Bank info (always shown for empresa) */}
            {paymentMethod !== "Transferencia Bancaria" && (
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>
                Banco: {ben.bankName} · {ben.accountType} #{ben.bankAccount}
              </div>
            )}
          </div>

          {/* Financial summary */}
          <div style={{ width:340, border:"2px solid #1e293b", borderRadius:10, overflow:"hidden", fontSize:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderBottom:"1px solid #e2e8f0" }}>
              <span style={{ fontWeight:700, textTransform:"uppercase", color:"#64748b" }}>Subtotal</span>
              <span style={{ fontWeight:700, color:"#1e293b" }}>{fmtCOP(subtotal)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderBottom:"1px solid #e2e8f0" }}>
              <span style={{ color:"#64748b", display:"flex", alignItems:"center", gap:6 }}>
                + IVA <input type="number" value={ivaPercent} onChange={e => setIvaPercent(Number(e.target.value))}
                  style={{ width:28, textAlign:"center", borderBottom:"1px solid #cbd5e1", border:"none", outline:"none", background:"transparent", fontSize:11 }} /> %
              </span>
              <span style={{ color:"#1e293b" }}>{fmtCOP(ivaAmt)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderBottom:"1px solid #e2e8f0", background:"#fff" }}>
              <span style={{ color:"#64748b", textTransform:"uppercase", fontWeight:600 }}>Anticipó</span>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ color:"#94a3b8", fontSize:11 }}>$</span>
                <input type="number" value={advance} onChange={e => setAdvance(Number(e.target.value))}
                  style={{ width:110, textAlign:"right", border:"none", outline:"none", background:"transparent", fontStyle:"italic", fontFamily: CENTURY_GOTHIC, color:"#475569", fontSize:12 }} />
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderBottom:"1px solid #e2e8f0", background:"#fff" }}>
              <span style={{ color:"#64748b", textTransform:"uppercase", fontWeight:600 }}>Abono</span>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ color:"#94a3b8", fontSize:11 }}>$</span>
                <input type="number" value={payment} onChange={e => setPayment(Number(e.target.value))}
                  style={{ width:110, textAlign:"right", border:"none", outline:"none", background:"transparent", fontStyle:"italic", fontFamily: CENTURY_GOTHIC, color:"#475569", fontSize:12 }} />
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 12px", background:"#e2e8f0", borderTop:"2px solid #1e293b" }}>
              <span style={{ fontWeight:800, textTransform:"uppercase", color:"#1e293b", fontSize:14 }}>Saldo</span>
              <span style={{ fontWeight:800, color:"#1e293b", fontSize:16 }}>{fmtCOP(balance)}</span>
            </div>
          </div>
        </div>

        {/* Signature line */}
        <div style={{ marginTop:36, display:"flex", justifyContent:"flex-end" }}>
          <div style={{ textAlign:"center", minWidth:220 }}>
            <div style={{ borderTop:"1.5px solid #1e293b", paddingTop:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#1e293b" }}>JAVIER OSPINA</div>
              <div style={{ fontSize:10, color:"#64748b" }}>Suelos y Estructuras E.U.</div>
              <div style={{ fontSize:10, color:"#64748b" }}>Cel: 316 520 4073</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Print styles ──────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #invoice-sheet { box-shadow: none !important; max-width: 100% !important; }
        }
      `}</style>
    </>
  );
}
