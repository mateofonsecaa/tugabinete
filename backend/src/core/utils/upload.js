import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

let client = null;

function readEnv(key) {
  return (globalThis.__ENV && globalThis.__ENV[key]) || process.env?.[key];
}

function getClient() {
  if (client) return client;

  const supabaseUrl = readEnv("SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl) throw new Error("SUPABASE_URL missing");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

  client = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}

function sanitizeName(name = "file") {
  return String(name)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function uploadToSupabase(file, options = {}) {
  const supabase = getClient();
  const bucket = options.bucket || readEnv("SUPABASE_BUCKET");

  if (!bucket) throw new Error("SUPABASE_BUCKET missing");

  let bytes;
  let contentType = options.contentType;
  let filename = options.filename;

  if (file?.buffer) {
    bytes = file.buffer;
    contentType ||= file.mimetype;
    filename ||= file.originalname;
  } else if (Buffer.isBuffer(file) || file instanceof Uint8Array) {
    bytes = file;
  } else if (file instanceof ArrayBuffer) {
    bytes = new Uint8Array(file);
  } else {
    throw new Error("Formato de archivo no soportado.");
  }

  const safeName = sanitizeName(
    filename || `file-${Date.now()}-${crypto.randomUUID()}`
  );
  const folder = String(options.folder || "uploads").replace(/^\/+|\/+$/g, "");
  const objectPath = `${folder}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, bytes, {
      contentType: contentType || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  return {
    publicUrl: data.publicUrl,
    objectPath,
  };
}

export async function deleteFromSupabase(objectPath, bucketOverride) {
  if (!objectPath) return true;

  const supabase = getClient();
  const bucket = bucketOverride || readEnv("SUPABASE_BUCKET");
  if (!bucket) throw new Error("SUPABASE_BUCKET missing");

  const { error } = await supabase.storage.from(bucket).remove([objectPath]);
  if (error) throw error;

  return true;
}