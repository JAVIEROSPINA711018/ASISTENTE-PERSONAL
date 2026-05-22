// CRM Supabase client — now uses Cerebro's Supabase (unified instance)
import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase.js";

// Re-export Cerebro's client as supabaseCRM so all CRM views work unchanged
export const supabaseCRM = supabase;

// ── Auth helpers (no-ops: Cerebro session covers CRM access) ──────────────────

export async function signInCRM() {}
export async function signOutCRM() {}
export async function getCRMSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const toClient = (row) => ({
  id: row.id,
  name: row.name,
  identification: row.identification || "",
  contactPerson: row.contact_person || "",
  type: row.type || "Particular",
  address: row.address || "",
  contactEmail: row.contact_email || "",
  phone: row.phone || "",
});

const toProject = (row) => {
  let responsibleIds = [];
  if (row.responsible_ids && Array.isArray(row.responsible_ids)) {
    responsibleIds = row.responsible_ids;
  } else if (row.responsible_id) {
    responsibleIds = [row.responsible_id];
  }
  return {
    id: row.id,
    invoiceNumber: row.invoice_number || 0,
    name: row.name,
    type: row.type || "Estudio de Suelos",
    clientId: row.client_id || "",
    valueWithoutTax: parseFloat(row.value_without_tax) || 0,
    services: row.services || [],
    status: row.status || "En Ejecución",
    responsibleIds,
    startDate: row.start_date || "",
    deadline: row.deadline || "",
    progress: row.progress || 0,
    actaUrl: row.acta_url || "",
    checklist: row.checklist || [],
  };
};

// ── Clients CRUD ─────────────────────────────────────────────────────────────

export const clientsDB = {
  async getAll() {
    const { data, error } = await supabaseCRM
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(toClient);
  },

  async create(client) {
    const { data, error } = await supabaseCRM
      .from("clients")
      .insert({
        name: client.name,
        identification: client.identification || null,
        contact_person: client.contactPerson,
        type: client.type,
        address: client.address,
        contact_email: client.contactEmail,
        phone: client.phone,
      })
      .select()
      .single();
    if (error) throw error;
    return toClient(data);
  },

  async update(client) {
    const { data, error } = await supabaseCRM
      .from("clients")
      .update({
        name: client.name,
        identification: client.identification || null,
        contact_person: client.contactPerson,
        type: client.type,
        address: client.address,
        contact_email: client.contactEmail,
        phone: client.phone,
      })
      .eq("id", client.id)
      .select()
      .single();
    if (error) throw error;
    return toClient(data);
  },

  async delete(id) {
    const { error } = await supabaseCRM.from("clients").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Quotes CRUD ──────────────────────────────────────────────────────────────

export const QUOTE_STATUSES = {
  BORRADOR:  "Borrador",
  ENVIADA:   "Enviada / En Revisión",
  RECHAZADA: "Rechazada",
  ACEPTADA:  "Aceptada (Convertir)",
};

export const SERVICE_OPTIONS = [
  { id: "estructural",  name: "Cálculo Estructural",    type: "Cálculo Estructural" },
  { id: "suelos",       name: "Estudio de Suelos",       type: "Estudio de Suelos" },
  { id: "consultoria",  name: "Consultoría Técnica",     type: "Consultoría Técnica" },
  { id: "construccion", name: "Construcción / Obra",     type: "Construcción / Obra" },
  { id: "otros",        name: "Otros Servicios",         type: "Otros Servicios" },
];

const toQuote = (row) => ({
  id:          row.id,
  name:        row.name,
  clientId:    row.client_id || "",
  type:        row.type || "",
  value:       parseFloat(row.value) || 0,
  services:    row.services || [],
  status:      row.status || QUOTE_STATUSES.BORRADOR,
  issueDate:   row.issue_date || "",
  validUntil:  row.valid_until || "",
  description: row.description || "",
  customBody:  row.custom_body || "",
  applyIva:    row.apply_iva || false,
});

export const quotesDB = {
  async getAll() {
    const { data, error } = await supabaseCRM
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(toQuote);
  },

  async create(quote) {
    const { data, error } = await supabaseCRM
      .from("quotes")
      .insert({
        name:        quote.name,
        client_id:   quote.clientId || null,
        type:        quote.type,
        value:       quote.value,
        services:    quote.services || [],
        status:      quote.status,
        issue_date:  quote.issueDate || null,
        valid_until: quote.validUntil || null,
        description: quote.description || null,
        custom_body: quote.customBody || null,
        apply_iva:   quote.applyIva || false,
      })
      .select()
      .single();
    if (error) throw error;
    return toQuote(data);
  },

  async update(quote) {
    const { data, error } = await supabaseCRM
      .from("quotes")
      .update({
        name:        quote.name,
        client_id:   quote.clientId || null,
        type:        quote.type,
        value:       quote.value,
        services:    quote.services || [],
        status:      quote.status,
        issue_date:  quote.issueDate || null,
        valid_until: quote.validUntil || null,
        description: quote.description || null,
        custom_body: quote.customBody || null,
        apply_iva:   quote.applyIva || false,
      })
      .eq("id", quote.id)
      .select()
      .single();
    if (error) throw error;
    return toQuote(data);
  },

  async delete(id) {
    const { error } = await supabaseCRM.from("quotes").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Financials CRUD ───────────────────────────────────────────────────────────

const toFinancial = (row) => ({
  id: row.id,
  projectId: row.project_id || "",
  description: row.description || "",
  amount: parseFloat(row.amount) || 0,
  type: row.type || "Cobro / Factura",
  status: row.status || "Pendiente",
  date: row.date || "",
  receiptUrl: row.receipt_url || "",
  bankAccountId: row.bank_account_id || "",
  category: row.category || "",
  paymentMethod: row.payment_method || "",
  paymentDetails: row.payment_details || "",
  isPersonal: row.is_personal || false,
});

export const financialsDB = {
  async getAll() {
    const { data, error } = await supabaseCRM
      .from("financials")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return (data || []).map(toFinancial);
  },

  async getByProject(projectId) {
    const { data, error } = await supabaseCRM
      .from("financials")
      .select("*")
      .eq("project_id", projectId)
      .order("date", { ascending: false });
    if (error) throw error;
    return (data || []).map(toFinancial);
  },

  async create(f) {
    const { data, error } = await supabaseCRM
      .from("financials")
      .insert({
        project_id: f.projectId || null,
        description: f.description || null,
        amount: f.amount,
        type: f.type,
        status: f.status,
        date: f.date || null,
        receipt_url: f.receiptUrl || null,
        category: f.category || null,
        payment_method: f.paymentMethod || null,
        payment_details: f.paymentDetails || null,
        is_personal: f.isPersonal || false,
      })
      .select().single();
    if (error) throw error;
    return toFinancial(data);
  },

  async update(f) {
    const { data, error } = await supabaseCRM
      .from("financials")
      .update({
        description: f.description || null,
        amount: f.amount,
        type: f.type,
        status: f.status,
        date: f.date || null,
        receipt_url: f.receiptUrl || null,
        category: f.category || null,
        payment_method: f.paymentMethod || null,
        payment_details: f.paymentDetails || null,
      })
      .eq("id", f.id)
      .select().single();
    if (error) throw error;
    return toFinancial(data);
  },

  async delete(id) {
    const { error } = await supabaseCRM.from("financials").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Tasks CRUD ────────────────────────────────────────────────────────────────

const toTask = (row) => ({
  id: row.id,
  projectId: row.project_id || "",
  name: row.name || "",
  responsibleId: row.responsible_id || "",
  status: row.status || "Por Hacer",
  dueDate: row.due_date || "",
  notes: row.notes || "",
});

export const TASK_STATUSES = ["Por Hacer", "En Progreso", "Revisión Técnica", "Hecho"];

export const tasksDB = {
  async getByProject(projectId) {
    const { data, error } = await supabaseCRM
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data || []).map(toTask);
  },

  async create(t) {
    const { data, error } = await supabaseCRM
      .from("tasks")
      .insert({
        project_id: t.projectId || null,
        name: t.name,
        responsible_id: t.responsibleId || null,
        status: t.status || "Por Hacer",
        due_date: t.dueDate || null,
        notes: t.notes || null,
      })
      .select().single();
    if (error) throw error;
    return toTask(data);
  },

  async update(t) {
    const { data, error } = await supabaseCRM
      .from("tasks")
      .update({
        name: t.name,
        responsible_id: t.responsibleId || null,
        status: t.status,
        due_date: t.dueDate || null,
        notes: t.notes || null,
      })
      .eq("id", t.id)
      .select().single();
    if (error) throw error;
    return toTask(data);
  },

  async delete(id) {
    const { error } = await supabaseCRM.from("tasks").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Team CRUD ─────────────────────────────────────────────────────────────────

const toTeamUser = (row) => ({
  id: row.id,
  name: row.name || "",
  role: row.role || "",
  avatarUrl: row.avatar_url || "",
  email: row.email || "",
});

export const teamDB = {
  async getAll() {
    const { data, error } = await supabaseCRM
      .from("team_users")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map(toTeamUser);
  },
};

// ── Projects CRUD ─────────────────────────────────────────────────────────────

export const PROJECT_STATUSES = [
  "En Ejecución",
  "Con Acta de Observaciones",
  "Para Entregar",
  "Entregado (Por Cobrar)",
  "Terminado",
  "Cancelado",
];

export const PROJECT_TYPES = [
  "Estudio de Suelos",
  "Diseño Estructural",
  "Estudio de Suelos y Diseño Estructural",
  "Refuerzo Estructural",
  "Otro",
];

export const projectsDB = {
  async getAll() {
    const { data, error } = await supabaseCRM
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(toProject);
  },

  async create(project) {
    const { data, error } = await supabaseCRM
      .from("projects")
      .insert({
        invoice_number: project.invoiceNumber,
        name: project.name,
        type: project.type,
        client_id: project.clientId || null,
        value_without_tax: project.valueWithoutTax,
        services: project.services || [],
        status: project.status,
        responsible_id: project.responsibleIds?.[0] || null,
        start_date: project.startDate || null,
        deadline: project.deadline || null,
        progress: project.progress || 0,
        acta_url: project.actaUrl || null,
        checklist: project.checklist || [],
      })
      .select()
      .single();
    if (error) throw error;
    return toProject(data);
  },

  async update(project) {
    const { data, error } = await supabaseCRM
      .from("projects")
      .update({
        invoice_number: project.invoiceNumber,
        name: project.name,
        type: project.type,
        client_id: project.clientId || null,
        value_without_tax: project.valueWithoutTax,
        services: project.services || [],
        status: project.status,
        responsible_id: project.responsibleIds?.[0] || null,
        start_date: project.startDate || null,
        deadline: project.deadline || null,
        progress: project.progress || 0,
        acta_url: project.actaUrl || null,
        checklist: project.checklist || [],
      })
      .eq("id", project.id)
      .select()
      .single();
    if (error) throw error;
    return toProject(data);
  },

  async delete(id) {
    const { error } = await supabaseCRM.from("projects").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Project Documents CRUD ──────────────────────────────────────────────────
export const projectDocumentsDB = {
  async getByProject(projectId) {
    const { data, error } = await supabaseCRM
      .from("project_documents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      url: row.url,
      type: row.type || "other",
      size: row.size,
      description: row.description || "",
      createdAt: row.created_at,
    }));
  },

  async create(doc) {
    const { data, error } = await supabaseCRM
      .from("project_documents")
      .insert({
        project_id: doc.projectId,
        name: doc.name,
        url: doc.url,
        type: doc.type,
        size: doc.size,
        description: doc.description || null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      projectId: data.project_id,
      name: data.name,
      url: data.url,
      type: data.type,
      size: data.size,
      description: data.description || "",
      createdAt: data.created_at,
    };
  },

  async update(id, updates) {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const { data, error } = await supabaseCRM
      .from("project_documents")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      projectId: data.project_id,
      name: data.name,
      url: data.url,
      type: data.type,
      size: data.size,
      description: data.description || "",
      createdAt: data.created_at,
    };
  },

  async delete(id) {
    const { error } = await supabaseCRM.from("project_documents").delete().eq("id", id);
    if (error) throw error;
  },
};
