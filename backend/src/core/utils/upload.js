import { createClient } from "@supabase/supabase-js";

// Lazy init: NO se crea en global scope (evita que falle el deploy)
let _client = null;

function readEnv(key) {
  // En Workers guardamos env en globalThis.__ENV desde worker.js
  return (globalThis.__ENV && globalThis.__ENV[key]) || process.env?.[key];
}

function getClient() {
  if (_client) return _client;

  const supabaseUrl = readEnv("SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl) throw new Error("SUPABASE_URL missing");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

  _client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}

// Mantiene compatibilidad si en otros lados usan `supabase.storage...`
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient();
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);

function sanitizeName(name = "file") {
  return String(name)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

/**
 * Export que tu código ya espera.
 * Acepta un file tipo Multer (file.buffer, file.originalname, file.mimetype) o Buffer/Uint8Array.
 * Devuelve un string: la public URL del archivo.
 */
export async function uploadToSupabase(file, options = {}) {
  const client = getClient();

  const bucket = options.bucket || readEnv("SUPABASE_BUCKET");
  if (!bucket) throw new Error("SUPABASE_BUCKET missing");

  const folder = options.folder || "uploads";

  let bytes;
  let contentType = options.contentType;
  let originalName = options.filename;

  // Multer: { buffer, originalname, mimetype }
  if (file?.buffer) {
    bytes = file.buffer;
    contentType ||= file.mimetype;
    originalName ||= file.originalname;
  } else if (file instanceof Uint8Array || Buffer.isBuffer(file)) {
    bytes = file;
  } else if (file instanceof ArrayBuffer) {
    bytes = new Uint8Array(file);
  } else {
    throw new Error("uploadToSupabase: formato de archivo no soportado");
  }

  const safeName = sanitizeName(originalName || `file-${Date.now()}`);
  const objectPath = `${folder}/${Date.now()}-${safeName}`;

  const { error: upErr } = await client.storage.from(bucket).upload(objectPath, bytes, {
    contentType: contentType || "application/octet-stream",
    upsert: true,
  });

  if (upErr) throw upErr;

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

// Por si lo necesitás luego
export function getSupabaseClient() {
  return getClient();
}

export async function deleteFromSupabase(path, bucketOverride) {
  const client = getClient();
  const bucket = bucketOverride || readEnv("SUPABASE_BUCKET");
  if (!bucket) throw new Error("SUPABASE_BUCKET missing");
  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) throw error;
  return true;
}