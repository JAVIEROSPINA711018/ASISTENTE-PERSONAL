import { supabase } from "./supabase.js";

export async function startPersistentGmailConnect() {
  const { data, error } = await supabase.functions.invoke("gmail-oauth", {
    body: { appOrigin: window.location.origin },
  });
  if (error) throw new Error(error.message || "No se pudo iniciar OAuth persistente");
  if (!data?.authUrl) throw new Error(data?.error || "OAuth persistente no devolvió URL");

  return new Promise((resolve, reject) => {
    const popup = window.open(data.authUrl, "gmail-oauth", "width=520,height=720");
    if (!popup) {
      reject(new Error("El navegador bloqueó la ventana de Google. Permita popups para conectar Gmail."));
      return;
    }

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tiempo agotado conectando Gmail."));
    }, 120000);

    const poll = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error("La ventana de Google se cerró antes de completar la conexión."));
      }
    }, 800);

    function cleanup() {
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      window.removeEventListener("message", onMessage);
    }

    function onMessage(event) {
      if (event.data?.type !== "cerebro:gmail-connected") return;
      cleanup();
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve({ email: event.data.email });
      }
    }

    window.addEventListener("message", onMessage);
  });
}

export async function fetchPersistentGmailEmails({ maxResults = 30, days = 30 } = {}) {
  const { data, error } = await supabase.functions.invoke("gmail-sync", {
    body: { action: "list", maxResults, days },
  });
  if (error) throw new Error(error.message || "No se pudo sincronizar Gmail persistente");
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getPersistentGmailStatus() {
  const { data, error } = await supabase.functions.invoke("gmail-sync", {
    body: { action: "status" },
  });
  if (error) return { connected: false, error: error.message };
  return data || { connected: false };
}

export async function disconnectPersistentGmail() {
  const { data, error } = await supabase.functions.invoke("gmail-sync", {
    body: { action: "disconnect" },
  });
  if (error) throw new Error(error.message || "No se pudo desconectar Gmail persistente");
  return data;
}
