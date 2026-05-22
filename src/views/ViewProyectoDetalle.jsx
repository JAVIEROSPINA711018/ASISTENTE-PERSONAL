import { useState, useEffect, useCallback } from "react";
import {
  projectsDB, clientsDB, financialsDB, tasksDB, teamDB, projectDocumentsDB,
  PROJECT_STATUSES, PROJECT_TYPES, TASK_STATUSES,
} from "../lib/supabaseCRM.js";
import { supabase } from "../lib/supabase.js";
import ViewRecibo from "./ViewRecibo.jsx";

// CRM Design System — RED=#901B2F  BLUE=#1F3A52
const FONT = "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif";
import { LIGHT, DARK } from "../lib/theme.js";

const FIXED_CHECKLIST = [
  "Ingresado a Programa de Calculo", "Diseñado y Revisado",
  "Planos Generados", "Planos Terminados", "Planos Impresos",
  "Memoria de Calculo", "Estudio de Suelos", "Memoria Impresas",
  "Revisado para entregar",
];

const TRANS_TYPES   = ["Cobro / Factura", "Gasto Operativo"];
const TRANS_STATUS  = ["Pendiente", "Pagado", "Atrasado"];

function fmt(n) {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(".0","") + "M"}`;
  if (n >= 1_000)     return `$${n.toLocaleString("es-CO")}`;
  return `$${n}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}
function daysLeft(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}

function DonutChart({ collected, total, size = 64, G }) {
  const pct = total > 0 ? Math.min(collected / total, 1) : 0;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={G.border} strokeWidth={9} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={G.green} strokeWidth={9}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
    </svg>
  );
}

const STATUS_COLOR = {
  "En Ejecución":              { bg: "rgba(37,99,235,0.10)",    text: "#2563eb" },
  "Con Acta de Observaciones": { bg: "rgba(217,119,6,0.10)",    text: "#d97706" },
  "Para Entregar":             { bg: "rgba(124,58,237,0.10)",   text: "#7c3aed" },
  "Entregado (Por Cobrar)":    { bg: "rgba(217,119,6,0.15)",    text: "#d97706" },
  "Terminado":                 { bg: "rgba(22,163,74,0.10)",    text: "#16a34a" },
  "Cancelado":                 { bg: "rgba(100,116,139,0.12)",  text: "#64748b" },
};

export default function ViewProyectoDetalle({ projectId, onBack, darkMode = false }) {
  const G = darkMode ? DARK : LIGHT;

  const [project, setProject] = useState(null);
  const [client,  setClient]  = useState(null);
  const [financials, setFinancials] = useState([]);
  const [tasks, setTasks]     = useState([]);
  const [team,  setTeam]      = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [transModal, setTransModal] = useState(null);   // null | { editing: record|null }
  const [transForm,  setTransForm]  = useState({ description: "", amount: "", type: "Cobro / Factura", status: "Pendiente", date: new Date().toISOString().substring(0,10), paymentDetails: "" });
  const [taskModal,  setTaskModal]  = useState(null);   // null | { editing: task|null }
  const [taskForm,   setTaskForm]   = useState({ name: "", dueDate: "", responsibleId: "", status: "Por Hacer", notes: "" });
  const [editModal,  setEditModal]  = useState(false);
  const [editForm,   setEditForm]   = useState({ name: "", type: "", deadline: "", status: "", progress: 0, clientId: "" });
  const [activeTab,  setActiveTab]  = useState("tasks");
  const [saving, setSaving] = useState(false);
  const [uploadingActa, setUploadingActa] = useState(false);
  const [showRecibo, setShowRecibo] = useState(false);

  // Documents state and logic
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [editingDocName, setEditingDocName] = useState("");
  const [editingDocDesc, setEditingDocDesc] = useState("");

  const loadDocuments = useCallback(async () => {
    if (!projectId) return;
    try {
      const docs = await projectDocumentsDB.getByProject(projectId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }, [projectId]);

  useEffect(() => {
    if (project && activeTab === "documents") {
      loadDocuments();
    }
  }, [project, activeTab, loadDocuments]);

  const uploadFile = async (file) => {
    if (!project) return;
    setIsUploading(true);

    const fileExt = file.name.split('.').pop() || 'png';
    const cleanName = file.name === 'image.png' ? `captura-${Date.now()}.${fileExt}` : file.name;

    const fileName = `${project.id}/${Date.now()}-${cleanName}`;
    const filePath = fileName;

    try {
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      const newDoc = await projectDocumentsDB.create({
        projectId: project.id,
        name: cleanName,
        url: publicUrl,
        type: file.type.includes('image') ? 'photo' : 'other',
        size: file.size
      });

      setDocuments(prev => [newDoc, ...prev]);
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Error al subir: ' + (error.message || 'Verifica bucket publico'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    uploadFile(e.target.files[0]);
  };

  const handlePasteButton = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.some((type) => type.startsWith('image/'))) {
          const blob = await item.getType(item.types.find((type) => type.startsWith('image/')));
          const file = new File([blob], "imagen-portapapeles.png", { type: blob.type });
          uploadFile(file);
          return;
        }
      }
      alert("No se encontró ninguna imagen en el portapapeles.");
    } catch (err) {
      console.error('Failed to read clipboard', err);
      alert("Para pegar, haz clic en la pantalla y presiona Ctrl+V / Cmd+V.");
    }
  };

  useEffect(() => {
    if (activeTab !== "documents" || !project) return;
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            uploadFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTab, project]);

  const handleStartEditDoc = (doc) => {
    setEditingDocId(doc.id);
    setEditingDocName(doc.name);
    setEditingDocDesc(doc.description || '');
  };

  const handleSaveDocChanges = async () => {
    if (!editingDocId) return;
    if (!editingDocName.trim()) {
      alert('El nombre del archivo no puede estar vacío');
      return;
    }
    try {
      const updatedDoc = await projectDocumentsDB.update(editingDocId, {
        name: editingDocName,
        description: editingDocDesc
      });
      setDocuments(prev => prev.map(d => d.id === editingDocId ? updatedDoc : d));
      setEditingDocId(null);
      setEditingDocName('');
      setEditingDocDesc('');
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Error al actualizar el documento');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('¿Eliminar este documento?')) return;
    try {
      await projectDocumentsDB.delete(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar documento');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prj, cls, fins, tks, tm, allClients] = await Promise.all([
        projectsDB.getAll().then(list => list.find(p => p.id === projectId)),
        clientsDB.getAll(),
        financialsDB.getByProject(projectId),
        tasksDB.getByProject(projectId),
        teamDB.getAll(),
        clientsDB.getAll(),
      ]);
      setProject(prj || null);
      setClients(allClients);
      setClient(prj ? allClients.find(c => c.id === prj.clientId) || null : null);
      setFinancials(fins);
      setTasks(tks);
      setTeam(tm);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const totalValue    = project?.valueWithoutTax || 0;
  const totalCollected = financials
    .filter(f => f.type === "Cobro / Factura" && f.status === "Pagado")
    .reduce((s, f) => s + f.amount, 0);
  const balance      = totalValue - totalCollected;
  const collectPct   = totalValue > 0 ? Math.round((totalCollected / totalValue) * 100) : 0;
  const checklistDone = (project?.checklist || []).length;
  const checklistPct  = Math.round((checklistDone / FIXED_CHECKLIST.length) * 100);
  const dl = daysLeft(project?.deadline);

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleStatusChange(newStatus) {
    const updated = { ...project, status: newStatus };
    setProject(updated);
    await projectsDB.update(updated);
  }

  async function handleToggleChecklist(item) {
    const cur = project.checklist || [];
    const newList = cur.includes(item) ? cur.filter(i => i !== item) : [...cur, item];
    const updated = { ...project, checklist: newList };
    setProject(updated);
    await projectsDB.update(updated);
  }

  function openTransCreate() {
    setTransForm({ description: "", amount: "", type: "Cobro / Factura", status: "Pendiente", date: new Date().toISOString().substring(0,10), paymentDetails: "" });
    setTransModal({ editing: null });
  }
  function openTransEdit(rec) {
    setTransForm({ description: rec.description, amount: String(rec.amount), type: rec.type, status: rec.status, date: rec.date?.substring(0,10) || "", paymentDetails: rec.paymentDetails || "" });
    setTransModal({ editing: rec });
  }
  async function handleSaveTrans(e) {
    e.preventDefault();
    if (!transForm.amount) return;
    setSaving(true);
    try {
      if (transModal.editing) {
        const updated = await financialsDB.update({ ...transModal.editing, ...transForm, amount: parseFloat(transForm.amount) });
        setFinancials(prev => prev.map(f => f.id === updated.id ? updated : f));
      } else {
        const created = await financialsDB.create({ ...transForm, amount: parseFloat(transForm.amount), projectId });
        setFinancials(prev => [created, ...prev]);
      }
      setTransModal(null);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }
  async function handleDeleteTrans(id) {
    if (!window.confirm("¿Eliminar este movimiento?")) return;
    await financialsDB.delete(id);
    setFinancials(prev => prev.filter(f => f.id !== id));
  }

  function openTaskCreate() {
    setTaskForm({ name: "", dueDate: new Date().toISOString().substring(0,10), responsibleId: "", status: "Por Hacer", notes: "" });
    setTaskModal({ editing: null });
  }
  function openTaskEdit(t) {
    setTaskForm({ name: t.name, dueDate: t.dueDate?.substring(0,10) || "", responsibleId: t.responsibleId || "", status: t.status, notes: t.notes || "" });
    setTaskModal({ editing: t });
  }
  async function handleSaveTask(e) {
    e.preventDefault();
    if (!taskForm.name.trim()) return;
    setSaving(true);
    try {
      if (taskModal.editing) {
        const updated = await tasksDB.update({ ...taskModal.editing, ...taskForm });
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await tasksDB.create({ ...taskForm, projectId });
        setTasks(prev => [...prev, created]);
      }
      setTaskModal(null);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }
  async function handleToggleTask(task) {
    const newStatus = task.status === "Hecho" ? "Por Hacer" : "Hecho";
    const updated = await tasksDB.update({ ...task, status: newStatus });
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  }
  async function handleDeleteTask(id) {
    if (!window.confirm("¿Eliminar esta tarea?")) return;
    await tasksDB.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function openEditProject() {
    setEditForm({ name: project.name, type: project.type, deadline: project.deadline?.substring(0,10) || "", status: project.status, progress: project.progress || 0, clientId: project.clientId || "" });
    setEditModal(true);
  }
  async function handleSaveProject(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await projectsDB.update({ ...project, ...editForm, valueWithoutTax: project.valueWithoutTax, progress: Number(editForm.progress) });
      setProject(updated);
      setClient(clients.find(c => c.id === updated.clientId) || null);
      setEditModal(false);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleActaUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingActa(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${project.id}-acta-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("actas").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("actas").getPublicUrl(path);
      const updated = await projectsDB.update({ ...project, actaUrl: publicUrl });
      setProject(updated);
    } catch (err) { alert("Error al subir acta: " + err.message); }
    finally { setUploadingActa(false); }
  }

  // ── Shared styles ────────────────────────────────────────────────────────────
  const card     = { background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "12px 14px" };
  const inputSt  = { border: `1px solid ${G.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: FONT, background: G.surface, color: G.textPrimary, outline: "none", width: "100%", boxSizing: "border-box" };
  const btnPri   = { padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: G.accent, color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: FONT, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 };
  const btnSec   = { padding: "7px 14px", borderRadius: 9, border: `1px solid ${G.border}`, cursor: "pointer", background: "transparent", color: G.textSecondary, fontSize: 12, fontFamily: FONT };
  const label    = { fontSize: 12, fontWeight: 600, color: G.textSecondary, display: "block", marginBottom: 4, fontFamily: FONT };

  // ── Recibo view ──────────────────────────────────────────────────────────────
  if (showRecibo && project) {
    return (
      <ViewRecibo
        project={project}
        client={client}
        onBack={() => setShowRecibo(false)}
      />
    );
  }

  if (loading) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", fontFamily: FONT, color: G.textTertiary, gap: 10 }}>
      <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${G.accent}`, borderTopColor:"transparent", animation:"spin 0.7s linear infinite" }} />
      Cargando proyecto...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!project) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, fontFamily: FONT }}>
      <span style={{ color: G.coral }}>Proyecto no encontrado</span>
      <button onClick={onBack} style={btnPri}>← Volver</button>
    </div>
  );

  const sc = STATUS_COLOR[project.status] || STATUS_COLOR["Cancelado"];

  return (
    <div style={{ fontFamily: FONT, color: G.textPrimary, display:"flex", flexDirection:"column", gap:14, paddingBottom:32, flex: 1, overflowY: "auto", minHeight: 0, paddingRight: 6 }}>

      {/* ── Back ─────────────────────────────────────────────────────────── */}
      <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color: G.textTertiary, fontSize:12, fontFamily: FONT, display:"flex", alignItems:"center", gap:5, padding:0, alignSelf:"flex-start" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Volver a Proyectos
      </button>

      {/* ── Project header card ───────────────────────────────────────────── */}
      <div style={{ ...card, padding:"16px 18px" }}>
        {/* Title row */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
          <h1 style={{ margin:0, fontSize:24, fontWeight:800, color: G.accent, letterSpacing:"-0.03em", lineHeight:1.1, flex:1 }}>{project.name}</h1>
          <button onClick={openEditProject} title="Editar proyecto" style={{ background:"none", border:"none", cursor:"pointer", color: G.textTertiary, padding:4, borderRadius:6, flexShrink:0, marginTop:2 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>

        {/* Service tags */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
          {(project.services?.length > 0 ? project.services : [{ name: project.type }]).map((s, i) => (
            <span key={i} style={{ fontSize:9, fontWeight:700, background: darkMode?"rgba(255,255,255,0.07)":"rgba(0,113,227,0.07)", color: G.accent, padding:"2px 8px", borderRadius:5, textTransform:"uppercase", letterSpacing:"0.05em", border:`1px solid ${G.accentSoft}` }}>
              {s.name}
            </span>
          ))}
        </div>

        {/* Status + type row */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <select value={project.status} onChange={e => handleStatusChange(e.target.value)}
            style={{ ...inputSt, width:"auto", padding:"4px 10px", fontSize:11, fontWeight:700, textTransform:"uppercase", background: sc.bg, color: sc.text, border:`1px solid ${sc.bg}`, borderRadius:8 }}>
            {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ color: G.textTertiary, fontSize:11 }}>|</span>
          <span style={{ fontSize:12, color: G.textSecondary, display:"flex", alignItems:"center", gap:5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
            {project.type}
          </span>
        </div>

        {/* Financial equation */}
        <div style={{ background: darkMode?"rgba(255,255,255,0.04)":"#f9f9fb", border:`1px solid ${G.border}`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color: G.textTertiary, marginBottom:3 }}>Valor Total Contratado</div>
            <div style={{ fontSize:22, fontWeight:800, color: G.textPrimary }}>${totalValue.toLocaleString("es-CO")}</div>
          </div>
          <span style={{ fontSize:18, color: G.textTertiary, fontWeight:300 }}>−</span>
          <div>
            <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color: G.textTertiary, marginBottom:3 }}>Total Cobrado</div>
            <div style={{ fontSize:22, fontWeight:800, color: G.green }}>${totalCollected.toLocaleString("es-CO")}</div>
            <div style={{ fontSize:9, color: G.textTertiary, marginTop:1 }}>{collectPct}% completado</div>
          </div>
          <span style={{ fontSize:18, color: G.textTertiary, fontWeight:300 }}>=</span>
          <div>
            <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color: G.textTertiary, marginBottom:3 }}>Saldo Pendiente</div>
            <div style={{ fontSize:26, fontWeight:800, color: balance > 0 ? G.accent : G.textTertiary }}>${balance.toLocaleString("es-CO")}</div>
          </div>
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center", width:64, height:64 }}>
            <DonutChart collected={totalCollected} total={totalValue} G={G} />
            <span style={{ position:"absolute", fontSize:9, color: G.textTertiary, fontWeight:700 }}>$</span>
          </div>
        </div>
      </div>

      {/* ── Main 2-col grid ───────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(280px,2fr) minmax(0,3fr)", gap:14 }}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* Services */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color: G.textPrimary, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.purple} strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
              Servicios
            </div>
            {(project.services?.length > 0 ? project.services : [{ id:"x", name:"Servicio Base", value: totalValue }]).map((s, i, arr) => (
              <div key={s.id||i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom: i < arr.length-1 ? `1px solid ${G.border}` : "none", fontSize:11 }}>
                <span style={{ color: G.textSecondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"55%" }}>{s.name}</span>
                <span style={{ fontWeight:600, color: G.textPrimary, whiteSpace:"nowrap" }}>${(s.value||0).toLocaleString("es-CO")}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0 0", borderTop:`1px solid ${G.border}`, marginTop:4, fontSize:11 }}>
              <span style={{ fontWeight:700, color: G.textPrimary }}>Total</span>
              <span style={{ fontWeight:700, color: G.accent }}>${totalValue.toLocaleString("es-CO")}</span>
            </div>
          </div>

          {/* Client */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color: G.textPrimary, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.teal} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
              Cliente
            </div>
            <div style={{ fontSize:13, fontWeight:700, color: G.textPrimary, marginBottom:5 }}>{client?.name || "—"}</div>
            {client?.contactEmail && <div style={{ fontSize:11, color: G.textSecondary, display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {client.contactEmail}
            </div>}
            {client?.phone && <div style={{ fontSize:11, color: G.textSecondary, display:"flex", alignItems:"center", gap:5 }}>
              <span>📞</span>{client.phone}
            </div>}
          </div>

          {/* Dates */}
          {(() => {
            const overdue = dl !== null && dl < 0 && project.status !== "Terminado";
            const urgent  = dl !== null && dl <= 3 && dl >= 0 && project.status === "En Ejecución";
            return (
              <div style={{ ...card, background: overdue||urgent ? (darkMode?"rgba(255,69,58,0.12)":"#fff5f5") : G.surface, borderColor: overdue||urgent ? G.coral : G.border }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:700, color: overdue||urgent ? G.coral : G.textPrimary, display:"flex", alignItems:"center", gap:6 }}>
                    {(overdue||urgent) && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                    {!(overdue||urgent) && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={G.accent} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                    Fechas
                  </div>
                  {(overdue||urgent) && <span style={{ fontSize:9, fontWeight:700, color: G.coral, background:"rgba(255,69,58,0.12)", padding:"2px 8px", borderRadius:10, border:`1px solid ${G.coral}` }}>¡Vence pronto!</span>}
                </div>
                <div style={{ background: darkMode?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.03)", borderRadius:8, padding:"8px 10px", textAlign:"center", marginBottom:8 }}>
                  <div style={{ fontSize:9, textTransform:"uppercase", fontWeight:700, color: G.textTertiary, letterSpacing:"0.06em", marginBottom:3 }}>Tiempo Restante</div>
                  {project.status === "Terminado" ? <span style={{ fontWeight:700, color: G.green, fontSize:13 }}>Completado</span>
                    : dl === null ? <span style={{ color: G.textTertiary, fontSize:12 }}>Sin fecha</span>
                    : dl < 0 ? <span style={{ fontWeight:700, color: G.coral, fontSize:14 }}>Vencido hace {Math.abs(dl)} días</span>
                    : dl === 0 ? <span style={{ fontWeight:700, color: G.amber, fontSize:14 }}>Vence Hoy</span>
                    : <span style={{ fontWeight:700, color: dl <= 3 ? G.coral : G.textPrimary, fontSize:14 }}>{dl} días</span>
                  }
                </div>
                {[["Inicio", fmtDate(project.startDate)], ["Entrega", fmtDate(project.deadline)]].map(([k,v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${G.border}`, fontSize:11 }}>
                    <span style={{ color: G.textTertiary }}>{k}</span>
                    <span style={{ fontWeight:600, color: G.textSecondary }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", fontSize:11 }}>
                  <span style={{ color: G.textTertiary }}>Responsable(s)</span>
                  {team.filter(u => (project.responsibleIds || []).includes(u.id)).length === 0
                    ? <span style={{ color: G.textTertiary, fontStyle:"italic" }}>Sin asignar</span>
                    : <div style={{ display:"flex", gap:3 }}>
                        {team.filter(u => (project.responsibleIds||[]).includes(u.id)).map(u => (
                          <div key={u.id} title={u.name} style={{ width:20, height:20, borderRadius:"50%", background: G.accentSoft, border:`1px solid ${G.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color: G.accent }}>
                            {u.name.charAt(0)}
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            );
          })()}

          {/* Acta */}
          <div style={{ ...card, borderColor: project.actaUrl ? G.green : G.amber, background: project.actaUrl ? (darkMode?"rgba(48,209,88,0.05)":"#f0fff4") : G.surface }}>
            <div style={{ fontSize:13, fontWeight:700, color: G.textPrimary, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
              {project.actaUrl
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.green} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.amber} strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              }
              Acta de Observaciones
            </div>
            {project.actaUrl ? (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <a href={project.actaUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:8, background: G.surface, border:`1px solid ${G.green}`, borderRadius:8, padding:"8px 10px", textDecoration:"none", color: G.green, fontSize:11, fontWeight:600 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Ver Acta OK
                </a>
                <button onClick={async () => { if(window.confirm("¿Eliminar acta?")) { const u = await projectsDB.update({...project, actaUrl:""}); setProject(u); } }}
                  style={{ background:"none", border:"none", cursor:"pointer", color: G.coral, fontSize:10, fontFamily: FONT, textAlign:"right" }}>
                  × Eliminar Acta
                </button>
              </div>
            ) : (
              <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`2px dashed ${G.border}`, borderRadius:8, padding:"16px 12px", cursor:"pointer", position:"relative", textAlign:"center" }}>
                <input type="file" accept="image/*,.pdf" style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer", width:"100%", height:"100%" }} onChange={handleActaUpload} disabled={uploadingActa} />
                <div style={{ width:32, height:32, borderRadius:"50%", background: G.amberSoft, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:6 }}>
                  {uploadingActa ? <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${G.amber}`, borderTopColor:"transparent", animation:"spin 0.7s linear infinite" }} />
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.amber} strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
                  }
                </div>
                <span style={{ fontSize:12, fontWeight:600, color: G.textSecondary }}>Subir Acta</span>
                <span style={{ fontSize:10, color: G.textTertiary, marginTop:2 }}>PDF o Imagen (Máx 5MB)</span>
              </label>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* Payment History */}
          <div style={{ ...card, padding:0, overflow:"hidden", display:"flex", flexDirection:"column", minHeight:240 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background: darkMode?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)", borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:700, color: G.textPrimary, display:"flex", alignItems:"center", gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                Historial de Pagos
              </span>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => setShowRecibo(true)} style={{ ...btnSec, fontSize:10, padding:"4px 10px" }}>🖨 Generar Recibo</button>
                <button onClick={openTransCreate} style={{ ...btnPri, fontSize:10, padding:"4px 10px" }}>+ Registrar</button>
              </div>
            </div>
            <div style={{ overflowY:"auto", flex:1 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ background: darkMode?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)", borderBottom:`1px solid ${G.border}` }}>
                    {["FECHA","DESCRIPCIÓN","TIPO","ESTADO","MONTO","RECIBO",""].map((h,i) => (
                      <th key={i} style={{ padding:"7px 10px", textAlign: i>=4?"center":"left", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color: G.textTertiary, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {financials.length === 0 && <tr><td colSpan={7} style={{ padding:"24px", textAlign:"center", color: G.textTertiary, fontStyle:"italic", fontSize:11 }}>Sin movimientos financieros.</td></tr>}
                  {financials.map(rec => {
                    const isCobro = rec.type === "Cobro / Factura";
                    const isPaid = rec.status === "Pagado";
                    return (
                      <tr key={rec.id} style={{ borderBottom:`1px solid ${G.border}` }} className="pay-row">
                        <td style={{ padding:"7px 10px", color: G.textTertiary, whiteSpace:"nowrap" }}>{fmtDate(rec.date)}</td>
                        <td style={{ padding:"7px 10px", fontWeight:600, color: G.textPrimary }}>{rec.description}</td>
                        <td style={{ padding:"7px 10px" }}>
                          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                            <span style={{ fontSize:9, background: isCobro ? G.accentSoft : darkMode?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)", color: isCobro ? G.accent : G.textSecondary, padding:"1px 6px", borderRadius:4, width:"fit-content" }}>{rec.type}</span>
                            {rec.paymentDetails && <span style={{ fontSize:9, fontWeight:700, color:"#5e5ce6", background:"rgba(94,92,230,0.10)", padding:"1px 5px", borderRadius:4, width:"fit-content" }}>🏦 {rec.paymentDetails}</span>}
                          </div>
                        </td>
                        <td style={{ padding:"7px 10px" }}>
                          <span style={{ fontSize:9, fontWeight:600, padding:"2px 7px", borderRadius:10, background: isPaid ? G.greenSoft : rec.status==="Atrasado" ? G.coralSoft : G.amberSoft, color: isPaid ? G.green : rec.status==="Atrasado" ? G.coral : G.amber }}>
                            {isPaid && "✓ "}{rec.status}
                          </span>
                        </td>
                        <td style={{ padding:"7px 10px", fontWeight:700, color: isCobro ? G.green : G.textPrimary, textAlign:"center", whiteSpace:"nowrap" }}>
                          {isCobro ? "+" : "−"}${rec.amount.toLocaleString("es-CO")}
                        </td>
                        <td style={{ padding:"7px 10px", textAlign:"center" }}>
                          {rec.receiptUrl ? <a href={rec.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: G.textTertiary }}>📄</a> : <span style={{ color: G.border }}>—</span>}
                        </td>
                        <td style={{ padding:"7px 10px", textAlign:"right", whiteSpace:"nowrap" }}>
                          <button onClick={() => openTransEdit(rec)} style={{ background:"none", border:"none", cursor:"pointer", color: G.textTertiary, padding:3, marginRight:2 }}>✏</button>
                          <button onClick={() => handleDeleteTrans(rec.id)} style={{ background:"none", border:"none", cursor:"pointer", color: G.textTertiary, padding:3 }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tasks + Checklist split */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>

            {/* Tasks / Docs tabs */}
            <div style={{ ...card, padding:0, overflow:"hidden", display:"flex", flexDirection:"column", minHeight:320 }}>
              <div style={{ display:"flex", borderBottom:`1px solid ${G.border}`, background: darkMode?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)", flexShrink:0 }}>
                {[["tasks","Tareas Dinámicas"],["documents","Documentos"]].map(([id, lbl]) => (
                  <button key={id} onClick={() => setActiveTab(id)} style={{ flex:1, padding:"10px 6px", background:"none", border:"none", borderBottom: activeTab===id ? `2px solid ${id==="tasks"?G.accent:G.purple}` : "2px solid transparent", cursor:"pointer", fontSize:11, fontWeight:700, color: activeTab===id ? (id==="tasks"?G.accent:G.purple) : G.textTertiary, fontFamily: FONT, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                    {id==="tasks" ? "☑" : "📄"} {lbl}
                  </button>
                ))}
              </div>
              {activeTab === "tasks" ? (
                <>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>
                    <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color: G.textTertiary }}>Lista de Tareas</span>
                    <button onClick={openTaskCreate} style={{ ...btnPri, fontSize:9, padding:"3px 8px" }}>+ Nueva Tarea</button>
                  </div>
                  <div style={{ overflowY:"auto", flex:1 }}>
                    {tasks.length === 0 && <div style={{ padding:"24px", textAlign:"center", color: G.textTertiary, fontSize:11, fontStyle:"italic" }}>No hay tareas adicionales registradas.</div>}
                    {tasks.map(t => {
                      const done = t.status === "Hecho";
                      const member = team.find(u => u.id === t.responsibleId);
                      return (
                        <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"8px 12px", borderBottom:`1px solid ${G.border}` }} className="task-row">
                          <button onClick={() => handleToggleTask(t)} style={{ width:14, height:14, borderRadius:3, border:`2px solid ${done ? G.accent : G.border}`, background: done ? G.accent : "none", cursor:"pointer", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </button>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:11, fontWeight:600, color: done ? G.textTertiary : G.textPrimary, textDecoration: done?"line-through":"none", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.name}</div>
                            <div style={{ fontSize:9, color: G.textTertiary, marginTop:2, display:"flex", alignItems:"center", gap:6 }}>
                              {t.dueDate && <span>🗓 {fmtDate(t.dueDate)}</span>}
                              {member && <span>{member.name.split(" ")[0]}</span>}
                            </div>
                          </div>
                          <div className="task-actions" style={{ display:"flex", gap:2, opacity:0, transition:"opacity 0.15s" }}>
                            <button onClick={() => openTaskEdit(t)} style={{ background:"none", border:"none", cursor:"pointer", color: G.textTertiary, padding:2, fontSize:10 }}>✏</button>
                            <button onClick={() => handleDeleteTask(t.id)} style={{ background:"none", border:"none", cursor:"pointer", color: G.textTertiary, padding:2, fontSize:11 }}>✕</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>
                    <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color: G.textTertiary }}>Archivos del Proyecto</span>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <button
                        onClick={handlePasteButton}
                        style={{
                          fontSize:9, padding:"3px 8px", borderRadius:6, border:`1px solid ${G.border}`,
                          background: darkMode ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                          color: G.textSecondary, cursor:"pointer", fontWeight:600, fontFamily:FONT,
                          display:"flex", alignItems:"center", gap:3
                        }}
                        title="Pegar imagen del portapapeles (Cmd+V)"
                      >
                        📋 Pegar
                      </button>
                      <label
                        style={{
                          fontSize:9, padding:"3px 8px", borderRadius:6, border:"none",
                          background: G.purple, color:"#fff", cursor: isUploading ? "not-allowed" : "pointer",
                          fontWeight:600, fontFamily:FONT, display:"flex", alignItems:"center", gap:3,
                          opacity: isUploading ? 0.6 : 1
                        }}
                      >
                        {isUploading ? "⚡ Subiendo..." : "📤 Subir"}
                        <input type="file" onChange={handleFileUpload} disabled={isUploading} style={{ display:"none" }} />
                      </label>
                    </div>
                  </div>
                  <div style={{ overflowY:"auto", flex:1, display:"flex", flexDirection:"column" }}>
                    {documents.length === 0 ? (
                      <div style={{ padding:"32px 16px", textAlign:"center", color: G.textTertiary, fontSize:11, display:"flex", flexDirection:"column", alignItems:"center", gap:6, justifyContent:"center", flex:1 }}>
                        <div style={{ fontSize:28, opacity:0.5 }}>📁</div>
                        <span style={{ fontWeight:600 }}>No hay documentos cargados.</span>
                        <span style={{ fontSize:10, opacity:0.7 }}>Arrastra archivos o pega imágenes del portapapeles.</span>
                      </div>
                    ) : (
                      documents.map(doc => {
                        const isPhoto = doc.type === "photo";
                        return (
                          <div
                            key={doc.id}
                            style={{
                              display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px",
                              borderBottom:`1px solid ${G.border}`,
                              background: editingDocId === doc.id ? (darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)") : "transparent"
                            }}
                          >
                            <a
                              href={doc.url} target="_blank" rel="noopener noreferrer"
                              style={{
                                width:30, height:30, borderRadius:8,
                                background: isPhoto ? G.accentSoft : G.purpleSoft,
                                color: isPhoto ? G.accent : G.purple,
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:14, textDecoration:"none", flexShrink:0, marginTop:2
                              }}
                            >
                              {isPhoto ? "🖼️" : "📄"}
                            </a>

                            <div style={{ flex:1, minWidth:0 }}>
                              {editingDocId === doc.id ? (
                                <div style={{ display:"flex", flexDirection:"column", gap:5, paddingRight:6 }}>
                                  <input
                                    type="text"
                                    style={{
                                      fontSize:11, fontFamily:FONT, padding:"4px 8px", borderRadius:5,
                                      border:`1px solid ${G.borderHigh}`, background:G.surface, color:G.textPrimary,
                                      outline:"none"
                                    }}
                                    value={editingDocName}
                                    onChange={e => setEditingDocName(e.target.value)}
                                    placeholder="Nombre del archivo"
                                    autoFocus
                                  />
                                  <input
                                    type="text"
                                    style={{
                                      fontSize:10, fontFamily:FONT, padding:"4px 8px", borderRadius:5,
                                      border:`1px solid ${G.borderHigh}`, background:G.surface, color:G.textPrimary,
                                      outline:"none"
                                    }}
                                    value={editingDocDesc}
                                    onChange={e => setEditingDocDesc(e.target.value)}
                                    placeholder="Descripción corta (opcional)"
                                    onKeyDown={e => {
                                      if (e.key === "Enter") handleSaveDocChanges();
                                      if (e.key === "Escape") setEditingDocId(null);
                                    }}
                                  />
                                  <div style={{ display:"flex", gap:6, marginTop:2 }}>
                                    <button
                                      onClick={handleSaveDocChanges}
                                      style={{
                                        fontSize:9, padding:"2px 8px", borderRadius:4, border:"none",
                                        background:G.accent, color:"#fff", fontWeight:600, cursor:"pointer"
                                      }}
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      onClick={() => setEditingDocId(null)}
                                      style={{
                                        fontSize:9, padding:"2px 8px", borderRadius:4,
                                        border:`1px solid ${G.border}`, background:"transparent",
                                        color:G.textSecondary, fontWeight:600, cursor:"pointer"
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <a
                                    href={doc.url} target="_blank" rel="noopener noreferrer"
                                    style={{
                                      fontSize:11, fontWeight:600, color:G.textPrimary,
                                      textDecoration:"none", display:"block", lineHeight:1.2,
                                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"
                                    }}
                                    title={doc.name}
                                  >
                                    {doc.name}
                                  </a>
                                  <div
                                    style={{
                                      fontSize:9, color: doc.description ? G.textSecondary : G.textTertiary,
                                      fontStyle: doc.description ? "normal" : "italic",
                                      marginTop:2, lineHeight:1.3, wordBreak:"break-word"
                                    }}
                                  >
                                    {doc.description || "Sin descripción"}
                                  </div>
                                  <div style={{ fontSize:8, color:G.textTertiary, marginTop:3, display:"flex", alignItems:"center", gap:6 }}>
                                    <span>🗓 {new Date(doc.createdAt).toLocaleDateString("es-CO")}</span>
                                    {doc.size && <span>• {(doc.size / 1024).toFixed(0)} KB</span>}
                                  </div>
                                </>
                              )}
                            </div>

                            {editingDocId !== doc.id && (
                              <div style={{ display:"flex", gap:2, flexShrink:0, alignSelf:"center" }}>
                                <button
                                  onClick={() => handleStartEditDoc(doc)}
                                  style={{
                                    background:"none", border:"none", cursor:"pointer",
                                    color:G.textTertiary, padding:2, fontSize:10
                                  }}
                                  title="Editar descripción"
                                >
                                  ✏
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  style={{
                                    background:"none", border:"none", cursor:"pointer",
                                    color:G.textTertiary, padding:2, fontSize:11
                                  }}
                                  title="Eliminar archivo"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Checklist Técnico */}
            <div style={{ ...card, padding:0, overflow:"hidden", display:"flex", flexDirection:"column", minHeight:320 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background: darkMode?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)", borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>
                <span style={{ fontSize:13, fontWeight:700, color: G.textPrimary, display:"flex", alignItems:"center", gap:6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.textTertiary} strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  Checklist Técnico
                </span>
                <span style={{ fontSize:10, fontWeight:700, color: G.accent, background: G.accentSoft, padding:"2px 8px", borderRadius:10 }}>{checklistPct}%</span>
              </div>
              <div style={{ overflowY:"auto", flex:1 }}>
                {FIXED_CHECKLIST.map(item => {
                  const checked = (project.checklist || []).includes(item);
                  return (
                    <div key={item} onClick={() => handleToggleChecklist(item)}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderBottom:`1px solid ${G.border}`, cursor:"pointer", background: checked ? (darkMode?"rgba(10,132,255,0.06)":"rgba(0,113,227,0.04)") : "none" }}
                      className="check-row">
                      <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${checked ? G.accent : G.border}`, background: checked ? G.accent : "none", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span style={{ fontSize:11, color: checked ? G.textSecondary : G.textPrimary, textDecoration: checked?"line-through":"none" }}>{item}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding:"12px 14px", borderTop:`1px solid ${G.border}`, display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10, flexShrink:0 }}>
                <div style={{ position:"relative", width:52, height:52 }}>
                  {(() => {
                    const r = 22; const c = 2*Math.PI*r;
                    const d = (checklistPct/100)*c;
                    return (
                      <svg width="52" height="52" style={{ transform:"rotate(-90deg)" }}>
                        <circle cx="26" cy="26" r={r} fill="none" stroke={G.border} strokeWidth="5" />
                        <circle cx="26" cy="26" r={r} fill="none" stroke={G.accent} strokeWidth="5"
                          strokeDasharray={`${d} ${c-d}`} strokeLinecap="round" />
                      </svg>
                    );
                  })()}
                  <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color: G.textPrimary }}>{checklistPct}%</span>
                </div>
                <span style={{ fontSize:10, color: G.textTertiary }}>Completado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transaction Modal ─────────────────────────────────────────────── */}
      {transModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background: G.surface, border:`1px solid ${G.borderHigh}`, borderRadius:16, width:"100%", maxWidth:440, boxShadow:"0 24px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ padding:"13px 18px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:14, fontWeight:700, color: G.textPrimary, fontFamily: FONT }}>{transModal.editing ? "Editar Movimiento" : "Registrar Movimiento"}</span>
              <button onClick={() => setTransModal(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color: G.textTertiary }}>×</button>
            </div>
            <form onSubmit={handleSaveTrans} style={{ padding:18, display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div><label style={label}>Tipo</label><select value={transForm.type} onChange={e=>setTransForm(p=>({...p,type:e.target.value}))} style={inputSt}>{TRANS_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                <div><label style={label}>Estado</label><select value={transForm.status} onChange={e=>setTransForm(p=>({...p,status:e.target.value}))} style={inputSt}>{TRANS_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div><label style={label}>Descripción</label><input type="text" placeholder="Ej: Anticipo, Pago 1..." value={transForm.description} onChange={e=>setTransForm(p=>({...p,description:e.target.value}))} style={inputSt} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div><label style={label}>Monto *</label><input required type="number" placeholder="0" value={transForm.amount} onChange={e=>setTransForm(p=>({...p,amount:e.target.value}))} style={inputSt} /></div>
                <div><label style={label}>Fecha</label><input type="date" value={transForm.date} onChange={e=>setTransForm(p=>({...p,date:e.target.value}))} style={inputSt} /></div>
              </div>
              <div><label style={label}>Cuenta / Banco</label><input type="text" placeholder="Ej: Bancolombia Ahorros..." value={transForm.paymentDetails} onChange={e=>setTransForm(p=>({...p,paymentDetails:e.target.value}))} style={inputSt} /></div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, borderTop:`1px solid ${G.border}`, paddingTop:12 }}>
                <button type="button" onClick={() => setTransModal(null)} style={btnSec}>Cancelar</button>
                <button type="submit" style={btnPri} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Task Modal ────────────────────────────────────────────────────── */}
      {taskModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background: G.surface, border:`1px solid ${G.borderHigh}`, borderRadius:16, width:"100%", maxWidth:400, boxShadow:"0 24px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ padding:"13px 18px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:14, fontWeight:700, color: G.textPrimary, fontFamily: FONT }}>{taskModal.editing ? "Editar Tarea" : "Nueva Tarea"}</span>
              <button onClick={() => setTaskModal(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color: G.textTertiary }}>×</button>
            </div>
            <form onSubmit={handleSaveTask} style={{ padding:18, display:"flex", flexDirection:"column", gap:12 }}>
              <div><label style={label}>Nombre *</label><input required type="text" placeholder="Nombre de la tarea..." value={taskForm.name} onChange={e=>setTaskForm(p=>({...p,name:e.target.value}))} style={inputSt} autoFocus /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div><label style={label}>Fecha límite</label><input type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(p=>({...p,dueDate:e.target.value}))} style={inputSt} /></div>
                <div><label style={label}>Estado</label><select value={taskForm.status} onChange={e=>setTaskForm(p=>({...p,status:e.target.value}))} style={inputSt}>{TASK_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div><label style={label}>Responsable</label><select value={taskForm.responsibleId} onChange={e=>setTaskForm(p=>({...p,responsibleId:e.target.value}))} style={inputSt}><option value="">Sin asignar</option>{team.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div><label style={label}>Notas</label><textarea rows={2} placeholder="Observaciones..." value={taskForm.notes} onChange={e=>setTaskForm(p=>({...p,notes:e.target.value}))} style={{ ...inputSt, resize:"vertical" }} /></div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, borderTop:`1px solid ${G.border}`, paddingTop:12 }}>
                <button type="button" onClick={() => setTaskModal(null)} style={btnSec}>Cancelar</button>
                <button type="submit" style={btnPri} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Project Modal ────────────────────────────────────────────── */}
      {editModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background: G.surface, border:`1px solid ${G.borderHigh}`, borderRadius:16, width:"100%", maxWidth:480, boxShadow:"0 24px 60px rgba(0,0,0,0.35)", maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"13px 18px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <span style={{ fontSize:14, fontWeight:700, color: G.textPrimary, fontFamily: FONT }}>Editar Proyecto</span>
              <button onClick={() => setEditModal(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color: G.textTertiary }}>×</button>
            </div>
            <form onSubmit={handleSaveProject} style={{ padding:18, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
              <div><label style={label}>Nombre *</label><input required type="text" value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} style={inputSt} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div><label style={label}>Cliente</label><select value={editForm.clientId} onChange={e=>setEditForm(p=>({...p,clientId:e.target.value}))} style={inputSt}><option value="">Sin cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label style={label}>Tipo</label><select value={editForm.type} onChange={e=>setEditForm(p=>({...p,type:e.target.value}))} style={inputSt}>{PROJECT_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div><label style={label}>Estado</label><select value={editForm.status} onChange={e=>setEditForm(p=>({...p,status:e.target.value}))} style={inputSt}>{PROJECT_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label style={label}>Fecha de Entrega</label><input type="date" value={editForm.deadline} onChange={e=>setEditForm(p=>({...p,deadline:e.target.value}))} style={inputSt} /></div>
              </div>
              <div><label style={label}>Avance: <strong>{editForm.progress}%</strong></label><input type="range" min={0} max={100} step={5} value={editForm.progress} onChange={e=>setEditForm(p=>({...p,progress:Number(e.target.value)}))} style={{ width:"100%", accentColor: G.accent }} /></div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, borderTop:`1px solid ${G.border}`, paddingTop:12 }}>
                <button type="button" onClick={() => setEditModal(false)} style={btnSec}>Cancelar</button>
                <button type="submit" style={btnPri} disabled={saving}>{saving?"Guardando...":"Guardar Cambios"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-row:hover { background: ${darkMode?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)"}; }
        .task-row:hover .task-actions { opacity: 1 !important; }
        .check-row:hover { background: ${darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.02)"}; }
      `}</style>
    </div>
  );
}
