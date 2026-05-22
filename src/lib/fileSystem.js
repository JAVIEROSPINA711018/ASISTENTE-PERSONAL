// src/lib/fileSystem.js
// File System Access API — folder picker + file saving for project downloads

const DB_NAME  = "cerebro_fs";
const DB_VER   = 1;
const STORE    = "handles";
const FOLDER_KEY = "proyectos_folder";

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function dbGet(key) {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx  = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = e => resolve(e.target.result ?? null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
}

async function dbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/** true si el navegador soporta File System Access API (Chrome/Edge) */
export function isFileSystemSupported() {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/**
 * Abre el selector de carpeta y persiste el handle en IndexedDB.
 * Devuelve el DirectoryHandle seleccionado.
 */
export async function pickProjectsFolder() {
  if (!isFileSystemSupported()) throw new Error("El navegador no soporta selección de carpeta. El archivo se descargará en la carpeta de Descargas.");
  const handle = await window.showDirectoryPicker({
    mode: "readwrite",
    startIn: "documents",
    id: "cerebro-proyectos",
  });
  await dbPut(FOLDER_KEY, handle);
  return handle;
}

/**
 * Recupera el handle guardado y solicita permiso si es necesario.
 * Devuelve el handle o null si no hay ninguno guardado / permiso denegado.
 */
export async function getOrRequestFolderHandle() {
  if (!isFileSystemSupported()) return null;
  const handle = await dbGet(FOLDER_KEY);
  if (!handle) return null;
  try {
    const perm = await handle.queryPermission({ mode: "readwrite" });
    if (perm === "granted") return handle;
    const req = await handle.requestPermission({ mode: "readwrite" });
    return req === "granted" ? handle : null;
  } catch { return null; }
}

/** Devuelve el nombre de la carpeta guardada (sin pedir permiso) */
export async function getSavedFolderName() {
  if (!isFileSystemSupported()) return null;
  const handle = await dbGet(FOLDER_KEY);
  return handle?.name ?? null;
}

/**
 * Guarda un archivo en la carpeta dada.
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} filename
 * @param {Blob|ArrayBuffer|Uint8Array} data
 */
export async function saveFileToFolder(dirHandle, filename, data) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable   = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

/**
 * Fallback: descarga el archivo con el nombre correcto al sistema de archivos del usuario
 * (abre la ventana de "Guardar como" del navegador)
 */
export function downloadFallback(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

/**
 * Convierte datos base64url (de la API de Gmail) a Blob
 */
export function base64ToBlob(base64url, mimeType = "application/octet-stream") {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const bin    = atob(base64);
  const bytes  = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/** Sugiere un nombre de archivo limpio evitando caracteres inválidos */
export function sanitizeFilename(name) {
  return name.replace(/[/\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}
