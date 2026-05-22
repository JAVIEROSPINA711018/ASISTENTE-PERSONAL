import { useState, useEffect, useCallback } from "react";
import { clientsDB } from "../lib/supabaseCRM.js";

import { LIGHT, DARK } from "../lib/theme.js";

const FONT = "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif";
const emptyClient = {
  name: "", identification: "", contactPerson: "",
  type: "Empresa", contactEmail: "", phone: "", address: "",
};
const emptyMember = {
  nombre: "", cargo: "", departamento: "", email: "",
  telefono: "", whatsapp: "", foto: "", estado: "activo", notas: "",
};
const ESTADO_COLORS = { activo: "#16a34a", remoto: "#2563eb", vacaciones: "#d97706", inactivo: "#64748b" };
const ESTADO_LABELS = { activo: "Activo", remoto: "Remoto", vacaciones: "Vacaciones", inactivo: "Inactivo" };

// ─── Avatars ──────────────────────────────────────────────────────────────────

function initialsFor(client) {
  const text = (client.name || client.contactPerson || "?").trim();
  const parts = text.split(/\s+/).filter(Boolean);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : text.slice(0, 2).toUpperCase();
}
function colorFor(client) {
  const palette = ["#2563eb", "#0d9488", "#901B2F", "#7c3aed", "#d97706", "#16a34a"];
  const seed = (client.name || client.contactPerson || "?").charCodeAt(0) || 0;
  return palette[seed % palette.length];
}
function ClientAvatar({ client, size = 52 }) {
  const bg = colorFor(client);
  return (
    <div style={{
      width: size, height: size, borderRadius: client.type === "Empresa" ? 14 : "50%",
      background: bg, color: "#fff", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.32), fontWeight: 900, letterSpacing: "-0.03em",
      boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
    }}>
      {initialsFor(client)}
    </div>
  );
}

function memberInitials(nombre) {
  const parts = (nombre || "?").trim().split(" ");
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
}
function memberColor(nombre) {
  const palette = ["#0059b5", "#5e5ce6", "#34c759", "#ff9500", "#901B2F", "#0d9488"];
  return palette[(nombre?.charCodeAt(0) || 0) % palette.length];
}
function MemberAvatar({ member, size = 52 }) {
  const bg = memberColor(member.nombre);
  if (member.foto) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: bg }}>
        <img src={member.foto} alt={member.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.display = "none"; }} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.32), fontWeight: 800, color: "#fff", letterSpacing: "-0.02em",
    }}>
      {memberInitials(member.nombre)}
    </div>
  );
}

function IconSearch({ color }) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViewClientes({ darkMode = false, initialSearch = "", onClearInitialSearch = null }) {
  const G = darkMode ? DARK : LIGHT;

  // Tab
  const [tab, setTab] = useState("clientes");

  // ── Clientes (Supabase) ────────────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(initialSearch || "");
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyClient);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      if (onClearInitialSearch) onClearInitialSearch();
    }
  }, [initialSearch]);

  const loadClients = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await clientsDB.getAll();
      setClients(data);
      setSelectedId(prev => prev || data[0]?.id || null);
    } catch (e) {
      setError(e.message || "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { loadClients(); }, [loadClients]);

  const filteredClients = clients.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [c.name, c.identification, c.contactPerson, c.contactEmail, c.phone, c.address, c.type]
      .some(v => (v || "").toLowerCase().includes(q));
  });
  const selected = clients.find(c => c.id === selectedId) || filteredClients[0] || clients[0] || null;
  const empresas = clients.filter(c => c.type === "Empresa").length;
  const particulares = clients.filter(c => c.type !== "Empresa").length;

  function openNew() { setEditingId(null); setForm(emptyClient); setModalOpen(true); }
  function openEdit(client) { setEditingId(client.id); setForm({ ...emptyClient, ...client }); setModalOpen(true); }

  async function saveClient(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await clientsDB.update({ id: editingId, ...form });
        setClients(prev => prev.map(c => c.id === editingId ? updated : c));
        setSelectedId(updated.id);
      } else {
        const created = await clientsDB.create(form);
        setClients(prev => [created, ...prev]);
        setSelectedId(created.id);
      }
      setModalOpen(false); setEditingId(null); setForm(emptyClient);
    } catch (e2) {
      alert("Error al guardar cliente: " + (e2.message || e2));
    } finally { setSaving(false); }
  }

  async function deleteClient(client) {
    if (!client || deleting) return;
    const ok = window.confirm(`¿Eliminar el cliente "${client.name}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    setDeleting(true);
    try {
      await clientsDB.delete(client.id);
      setClients(prev => prev.filter(c => c.id !== client.id));
      setSelectedId(prev => prev === client.id ? null : prev);
    } catch (e) {
      alert("Error al eliminar cliente: " + (e.message || e));
    } finally { setDeleting(false); }
  }

  // ── Equipo (localStorage) ──────────────────────────────────────────────────
  const [equipo, setEquipo] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cerebro_equipo") || "[]"); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("cerebro_equipo", JSON.stringify(equipo)); } catch { }
  }, [equipo]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberForm, setMemberForm] = useState(emptyMember);

  const filteredEquipo = equipo.filter(m => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return [m.nombre, m.cargo, m.departamento, m.email].some(v => (v || "").toLowerCase().includes(q));
  });
  const selectedMember = equipo.find(m => m.id === selectedMemberId) || filteredEquipo[0] || equipo[0] || null;

  function openNewMember() { setEditingMemberId(null); setMemberForm(emptyMember); setMemberModalOpen(true); }
  function openEditMember(m) { setEditingMemberId(m.id); setMemberForm({ ...emptyMember, ...m }); setMemberModalOpen(true); }

  function saveMember(e) {
    e.preventDefault();
    if (!memberForm.nombre.trim()) return;
    if (editingMemberId) {
      setEquipo(prev => prev.map(m => m.id === editingMemberId ? { ...m, ...memberForm } : m));
    } else {
      const nuevo = { id: Math.random().toString(36).slice(2, 9), ...memberForm };
      setEquipo(prev => [nuevo, ...prev]);
      setSelectedMemberId(nuevo.id);
    }
    setMemberModalOpen(false); setEditingMemberId(null); setMemberForm(emptyMember);
  }

  function deleteMember(m) {
    if (!window.confirm(`¿Eliminar a "${m.nombre}" del equipo?`)) return;
    setEquipo(prev => prev.filter(x => x.id !== m.id));
    if (selectedMemberId === m.id) setSelectedMemberId(null);
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: `1px solid ${G.border}`, background: darkMode ? "#1e293b" : "#f8fafc",
    color: G.textPrimary, fontSize: 12, outline: "none",
    boxSizing: "border-box", fontFamily: FONT,
  };
  const labelStyle = {
    fontSize: 10, fontWeight: 800, color: G.textTertiary,
    marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em",
  };

  const tabStyle = (active) => ({
    padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
    fontSize: 12, fontWeight: active ? 800 : 500, fontFamily: FONT,
    background: active ? G.crmBlue : "transparent",
    color: active ? "#fff" : G.textSecondary,
    transition: "all 0.15s",
  });

  if (tab === "clientes" && loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: G.textTertiary, fontFamily: FONT, fontSize: 14 }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${G.accent}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", marginRight: 10 }} />
      Cargando clientes...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (tab === "clientes" && error) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: FONT }}>
      <span style={{ color: G.coral, fontSize: 14 }}>{error}</span>
      <button onClick={loadClients} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: G.accent, color: "#fff", fontWeight: 800, cursor: "pointer" }}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", margin: "-24px", fontFamily: FONT, color: G.textPrimary }}>

      {/* ── Modal Clientes ── */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div style={{ background: G.glass, border: `1px solid ${G.glassBorder}`, borderRadius: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>
            <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${G.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{editingId ? "Editar cliente" : "Nuevo cliente"}</div>
                <div style={{ fontSize: 12, color: G.textSecondary, marginTop: 2 }}>Se guardará en la base de clientes</div>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ border: "none", background: "transparent", color: G.textTertiary, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <form onSubmit={saveClient} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 13, overflowY: "auto", maxHeight: "calc(90vh - 100px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 12, borderRadius: 16, border: `1px solid ${G.border}`, background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                <ClientAvatar client={form} size={58} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{form.name || "Nombre o razón social"}</div>
                  <div style={{ fontSize: 11, color: G.textTertiary, marginTop: 2 }}>{form.contactPerson || form.type}</div>
                </div>
              </div>
              <div>
                <div style={labelStyle}>Razón social / nombre *</div>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Constructora del Sur S.A.S." style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={labelStyle}>Identificación</div>
                  <input value={form.identification} onChange={e => setForm(p => ({ ...p, identification: e.target.value }))} placeholder="NIT / CC" style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Tipo</div>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                    <option value="Empresa">Empresa</option>
                    <option value="Particular">Particular</option>
                  </select>
                </div>
              </div>
              <div>
                <div style={labelStyle}>Persona de contacto</div>
                <input value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} placeholder="Ing. Juan Pérez" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={labelStyle}>Email</div>
                  <input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} placeholder="contacto@empresa.com" style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Teléfono</div>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+57 300..." style={inputStyle} />
                </div>
              </div>
              <div>
                <div style={labelStyle}>Dirección</div>
                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Dirección física" style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${G.border}`, paddingTop: 16 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: "10px 18px", borderRadius: 12, border: "none", background: "transparent", color: G.textTertiary, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={saving || !form.name.trim()} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: form.name.trim() ? G.accent : G.border, color: "#fff", fontWeight: 900, cursor: form.name.trim() ? "pointer" : "not-allowed", opacity: saving ? 0.65 : 1 }}>
                  {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Equipo ── */}
      {memberModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setMemberModalOpen(false); }}>
          <div style={{ background: G.glass, border: `1px solid ${G.glassBorder}`, borderRadius: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>
            <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${G.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{editingMemberId ? "Editar miembro" : "Nuevo miembro del equipo"}</div>
              </div>
              <button onClick={() => setMemberModalOpen(false)} style={{ border: "none", background: "transparent", color: G.textTertiary, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <form onSubmit={saveMember} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 13, overflowY: "auto", maxHeight: "calc(90vh - 100px)" }}>
              {[
                { key: "nombre", label: "Nombre completo *", placeholder: "Ing. María López", required: true },
                { key: "cargo", label: "Cargo / Rol", placeholder: "Diseñador estructural" },
                { key: "departamento", label: "Área / Departamento", placeholder: "Ingeniería" },
                { key: "email", label: "Correo electrónico", placeholder: "maria@empresa.com" },
                { key: "telefono", label: "Teléfono", placeholder: "+57 300..." },
                { key: "whatsapp", label: "WhatsApp", placeholder: "+57 300..." },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key}>
                  <div style={labelStyle}>{label}</div>
                  <input
                    required={required}
                    value={memberForm[key] || ""}
                    onChange={e => setMemberForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <div style={labelStyle}>Estado</div>
                <select value={memberForm.estado} onChange={e => setMemberForm(p => ({ ...p, estado: e.target.value }))} style={inputStyle}>
                  {Object.entries(ESTADO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <div style={labelStyle}>Notas</div>
                <textarea value={memberForm.notas} onChange={e => setMemberForm(p => ({ ...p, notas: e.target.value }))} placeholder="Notas internas..." rows={3} style={{ ...inputStyle, resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${G.border}`, paddingTop: 16 }}>
                <button type="button" onClick={() => setMemberModalOpen(false)} style={{ padding: "10px 18px", borderRadius: 12, border: "none", background: "transparent", color: G.textTertiary, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={!memberForm.nombre.trim()} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: memberForm.nombre.trim() ? G.crmBlue : G.border, color: "#fff", fontWeight: 900, cursor: memberForm.nombre.trim() ? "pointer" : "not-allowed" }}>
                  {editingMemberId ? "Guardar cambios" : "Añadir al equipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside style={{ width: 318, flexShrink: 0, borderRight: `1px solid ${G.border}`, background: darkMode ? G.surface : "#fff", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* Header con tabs */}
        <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em" }}>
                {tab === "clientes" ? "Clientes" : "Equipo"}
              </div>
              <div style={{ fontSize: 11, color: G.textTertiary, marginTop: 2 }}>
                {tab === "clientes"
                  ? `${clients.length} clientes · ${empresas} empresas · ${particulares} particulares`
                  : `${equipo.length} miembro${equipo.length !== 1 ? "s" : ""}`}
              </div>
            </div>
            <button
              onClick={tab === "clientes" ? openNew : openNewMember}
              style={{ padding: "7px 11px", borderRadius: 9, border: "none", background: tab === "clientes" ? G.accent : G.crmBlue, color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
              + Nuevo
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 10, background: darkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9", borderRadius: 22, padding: 3 }}>
            <button onClick={() => { setTab("clientes"); setSearch(""); }} style={tabStyle(tab === "clientes")}>Clientes</button>
            <button onClick={() => { setTab("equipo"); setMemberSearch(""); }} style={tabStyle(tab === "equipo")}>Equipo</button>
          </div>

          {/* Buscador */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
              <IconSearch color={G.textTertiary} />
            </span>
            {tab === "clientes" ? (
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar clientes..."
                style={{ width: "100%", padding: "8px 12px 8px 31px", borderRadius: 99, border: `1px solid ${G.border}`, background: darkMode ? "#0f172a" : "#f2f3fd", color: G.textPrimary, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            ) : (
              <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar en equipo..."
                style={{ width: "100%", padding: "8px 12px 8px 31px", borderRadius: 99, border: `1px solid ${G.border}`, background: darkMode ? "#0f172a" : "#f2f3fd", color: G.textPrimary, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            )}
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {tab === "clientes" ? (
            filteredClients.length === 0 ? (
              <div style={{ textAlign: "center", padding: "52px 18px", color: G.textTertiary }}>
                <div style={{ fontSize: 34, marginBottom: 10 }}>▦</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: G.textSecondary }}>{search ? "Sin resultados" : "Sin clientes aún"}</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>{search ? "Prueba con otro término" : "Crea tu primer cliente"}</div>
              </div>
            ) : filteredClients.map(client => {
              const active = selected?.id === client.id;
              return (
                <button key={client.id} onClick={() => setSelectedId(client.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, cursor: "pointer", marginBottom: 3, textAlign: "left",
                    background: active ? G.accentSoft : "transparent", border: active ? `1px solid ${G.accent}26` : "1px solid transparent", transition: "background 0.15s" }}>
                  <ClientAvatar client={client} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: G.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                    <div style={{ fontSize: 11, color: G.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.contactPerson || client.contactEmail || client.type}</div>
                  </div>
                  {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.green, flexShrink: 0 }} />}
                </button>
              );
            })
          ) : (
            filteredEquipo.length === 0 ? (
              <div style={{ textAlign: "center", padding: "52px 18px", color: G.textTertiary }}>
                <div style={{ fontSize: 34, marginBottom: 10 }}>👥</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: G.textSecondary }}>{memberSearch ? "Sin resultados" : "Sin miembros aún"}</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>{memberSearch ? "Prueba con otro término" : "Añade tu equipo de trabajo"}</div>
              </div>
            ) : filteredEquipo.map(m => {
              const active = selectedMember?.id === m.id;
              const estColor = ESTADO_COLORS[m.estado] || "#64748b";
              return (
                <button key={m.id} onClick={() => setSelectedMemberId(m.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, cursor: "pointer", marginBottom: 3, textAlign: "left",
                    background: active ? `${G.crmBlue}12` : "transparent", border: active ? `1px solid ${G.crmBlue}30` : "1px solid transparent", transition: "background 0.15s" }}>
                  <MemberAvatar member={m} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: G.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.nombre}</div>
                    <div style={{ fontSize: 11, color: G.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.cargo || m.departamento || "—"}</div>
                  </div>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: estColor, flexShrink: 0 }} />
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Main Detail ── */}
      <main style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: G.bg }}>
        {tab === "clientes" ? (
          !selected ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: G.textTertiary }}>
              <div style={{ fontSize: 42, opacity: 0.5 }}>▦</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>Selecciona un cliente</div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ position: "relative", height: 158, background: `linear-gradient(135deg, ${colorFor(selected)}26 0%, ${G.accentSoft} 100%)` }}>
                <div style={{ position: "absolute", top: 16, right: 22, display: "flex", gap: 8 }}>
                  <button onClick={() => openEdit(selected)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${G.border}`, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)", color: G.textSecondary, cursor: "pointer", fontWeight: 900 }}>✎</button>
                </div>
                <div style={{ position: "absolute", bottom: -46, left: 30, width: 92, height: 92, borderRadius: selected.type === "Empresa" ? 26 : "50%", background: darkMode ? G.bg : "#fff", padding: 5, boxShadow: "0 8px 28px rgba(15,23,42,0.18)" }}>
                  <ClientAvatar client={selected} size={82} />
                </div>
              </div>

              <div style={{ paddingLeft: 142, paddingRight: 28, paddingTop: 14, paddingBottom: 18 }}>
                <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-0.03em", color: G.textPrimary }}>{selected.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, padding: "3px 10px", borderRadius: 99, background: selected.type === "Empresa" ? G.accentSoft : G.tealSoft, color: selected.type === "Empresa" ? G.accent : G.teal, border: `1px solid ${selected.type === "Empresa" ? G.accent : G.teal}33`, textTransform: "uppercase", letterSpacing: "0.06em" }}>{selected.type}</span>
                  {selected.identification && <span style={{ fontSize: 12, color: G.textSecondary }}>{selected.identification}</span>}
                  {selected.contactPerson && <span style={{ fontSize: 12, color: G.textTertiary }}>Contacto: {selected.contactPerson}</span>}
                </div>
              </div>

              <div style={{ padding: "0 24px 40px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 190px", gap: 16 }}>
                <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ background: darkMode ? G.surface : "rgba(255,255,255,0.92)", border: `1px solid ${G.border}`, borderRadius: 20, padding: "20px 22px", boxShadow: "0 2px 12px rgba(15,23,42,0.04)" }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: G.accent, marginBottom: 16 }}>Información del cliente</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {[["EMAIL", selected.contactEmail || "—"], ["TELÉFONO", selected.phone || "—"], ["IDENTIFICACIÓN", selected.identification || "—"], ["TIPO", selected.type || "—"]].map(([label, value]) => (
                        <div key={label}>
                          <div style={{ fontSize: 9, fontWeight: 900, color: G.textTertiary, letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 14, color: G.textPrimary, fontWeight: 600, overflowWrap: "anywhere" }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: darkMode ? G.surface : "rgba(255,255,255,0.92)", border: `1px solid ${G.border}`, borderRadius: 20, padding: "20px 22px", boxShadow: "0 2px 12px rgba(15,23,42,0.04)" }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: G.accent, marginBottom: 12 }}>Dirección y acciones</div>
                    <div style={{ fontSize: 13, color: selected.address ? G.textSecondary : G.textTertiary, lineHeight: 1.55, padding: "10px 13px", borderRadius: 12, background: G.accentSoft, marginBottom: 13 }}>
                      {selected.address || "Sin dirección registrada"}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {selected.contactEmail && (
                        <button onClick={() => window.open(`https://mail.google.com/mail/?view=cm&to=${selected.contactEmail}`, "_blank")}
                          style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(234,67,53,0.16)", background: "rgba(234,67,53,0.08)", color: "#ea4335", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>Gmail</button>
                      )}
                      {selected.phone && (
                        <button onClick={() => window.open(`https://api.whatsapp.com/send?phone=${selected.phone.replace(/\D/g, "")}`, "_blank")}
                          style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(37,211,102,0.16)", background: "rgba(37,211,102,0.08)", color: "#25d366", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>WhatsApp</button>
                      )}
                      {selected.address && (
                        <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.address)}`, "_blank")}
                          style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${G.accent}33`, background: G.accentSoft, color: G.accent, fontSize: 12, fontWeight: 900, cursor: "pointer" }}>Mapa</button>
                      )}
                      <button onClick={() => deleteClient(selected)}
                        style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: 10, border: `1px solid ${G.coral}22`, background: G.coralSoft, color: G.coral, fontSize: 12, fontWeight: 900, cursor: "pointer" }}>Eliminar</button>
                    </div>
                  </div>
                </section>

                <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: darkMode ? G.surface : "#fff", border: `1px solid ${G.border}`, borderRadius: 18, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: G.textTertiary, letterSpacing: "0.07em", marginBottom: 8 }}>RESUMEN DE CLIENTES</div>
                    <div style={{ fontSize: 28, fontWeight: 950, color: G.textPrimary }}>{clients.length}</div>
                    <div style={{ fontSize: 11, color: G.textTertiary }}>clientes guardados</div>
                  </div>
                  <div style={{ background: darkMode ? G.surface : "#fff", border: `1px solid ${G.border}`, borderRadius: 18, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: G.textTertiary, letterSpacing: "0.07em", marginBottom: 10 }}>FICHA</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: G.textSecondary }}>
                      <span>Empresa: <strong style={{ color: G.textPrimary }}>{empresas}</strong></span>
                      <span>Particular: <strong style={{ color: G.textPrimary }}>{particulares}</strong></span>
                      <span>Base: <strong style={{ color: G.textPrimary }}>Supabase clients</strong></span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )
        ) : (
          // ── Equipo Detail ──
          !selectedMember ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: G.textTertiary }}>
              <div style={{ fontSize: 42, opacity: 0.5 }}>👥</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>Selecciona un miembro</div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ position: "relative", height: 158, background: `linear-gradient(135deg, ${memberColor(selectedMember.nombre)}22 0%, rgba(31,58,82,0.08) 100%)` }}>
                <div style={{ position: "absolute", top: 16, right: 22, display: "flex", gap: 8 }}>
                  <button onClick={() => openEditMember(selectedMember)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${G.border}`, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)", color: G.textSecondary, cursor: "pointer", fontWeight: 900 }}>✎</button>
                </div>
                <div style={{ position: "absolute", bottom: -46, left: 30, width: 92, height: 92, borderRadius: "50%", background: darkMode ? G.bg : "#fff", padding: 5, boxShadow: "0 8px 28px rgba(15,23,42,0.18)" }}>
                  <MemberAvatar member={selectedMember} size={82} />
                </div>
              </div>

              <div style={{ paddingLeft: 142, paddingRight: 28, paddingTop: 14, paddingBottom: 18 }}>
                <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-0.03em", color: G.textPrimary }}>{selectedMember.nombre}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                  {selectedMember.estado && (
                    <span style={{ fontSize: 10, fontWeight: 900, padding: "3px 10px", borderRadius: 99, background: `${ESTADO_COLORS[selectedMember.estado]}18`, color: ESTADO_COLORS[selectedMember.estado], border: `1px solid ${ESTADO_COLORS[selectedMember.estado]}33`, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {ESTADO_LABELS[selectedMember.estado] || selectedMember.estado}
                    </span>
                  )}
                  {selectedMember.cargo && <span style={{ fontSize: 12, color: G.textSecondary }}>{selectedMember.cargo}</span>}
                  {selectedMember.departamento && <span style={{ fontSize: 12, color: G.textTertiary }}>{selectedMember.departamento}</span>}
                </div>
              </div>

              <div style={{ padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: darkMode ? G.surface : "rgba(255,255,255,0.92)", border: `1px solid ${G.border}`, borderRadius: 20, padding: "20px 22px", boxShadow: "0 2px 12px rgba(15,23,42,0.04)" }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: G.crmBlue, marginBottom: 16 }}>Información de contacto</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[["EMAIL", selectedMember.email || "—"], ["TELÉFONO", selectedMember.telefono || "—"], ["WHATSAPP", selectedMember.whatsapp || "—"], ["ÁREA", selectedMember.departamento || "—"]].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: G.textTertiary, letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 14, color: G.textPrimary, fontWeight: 600, overflowWrap: "anywhere" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedMember.notas && (
                  <div style={{ background: darkMode ? G.surface : "rgba(255,255,255,0.92)", border: `1px solid ${G.border}`, borderRadius: 20, padding: "18px 22px" }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: G.crmBlue, marginBottom: 10 }}>Notas</div>
                    <div style={{ fontSize: 13, color: G.textSecondary, lineHeight: 1.6 }}>{selectedMember.notas}</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selectedMember.email && (
                    <button onClick={() => window.open(`https://mail.google.com/mail/?view=cm&to=${selectedMember.email}`, "_blank")}
                      style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(234,67,53,0.16)", background: "rgba(234,67,53,0.08)", color: "#ea4335", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>Gmail</button>
                  )}
                  {selectedMember.whatsapp && (
                    <button onClick={() => window.open(`https://api.whatsapp.com/send?phone=${selectedMember.whatsapp.replace(/\D/g, "")}`, "_blank")}
                      style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(37,211,102,0.16)", background: "rgba(37,211,102,0.08)", color: "#25d366", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>WhatsApp</button>
                  )}
                  <button onClick={() => deleteMember(selectedMember)}
                    style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: 10, border: `1px solid ${G.coral}22`, background: G.coralSoft, color: G.coral, fontSize: 12, fontWeight: 900, cursor: "pointer" }}>Eliminar</button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
