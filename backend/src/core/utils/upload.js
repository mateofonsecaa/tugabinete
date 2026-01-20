// backend/src/core/utils/upload.js
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import path from "path";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function guessContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export async function uploadToSupabase(buffer, originalName, folder = "profile") {
  try {
    const bucket = process.env.SUPABASE_BUCKET || "tugabinete"; // <-- AJUSTA SI TU BUCKET SE LLAMA DISTINTO

    const ext = (path.extname(originalName) || ".jpg").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";

    // ✅ nombre único (evita 409 por repetido)
    const unique = `${Date.now()}-${crypto.randomUUID()}${safeExt}`;
    const filePath = `${folder}/${unique}`;

    const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
      contentType: guessContentType(originalName),
      upsert: true, // ✅ si existiera, lo pisa
    });

    if (error) {
      console.error("❌ Supabase upload error:", error);
      throw new Error(error.message || "Supabase upload failed");
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const publicUrl = data?.publicUrl;

    if (!publicUrl) {
      throw new Error("No se pudo obtener publicUrl");
    }

    return publicUrl;
  } catch (err) {
    console.error("❌ uploadToSupabase() falló:", err);
    throw new Error(`No se pudo subir la imagen a Supabase: ${err.message}`);
  }
}
