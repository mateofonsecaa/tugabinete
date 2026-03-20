import path from "path";
import { randomUUID } from "crypto";
import supabase from "../../core/supabaseClient.js";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "migabinete";

export async function uploadFeedbackAttachment(file) {
  const extension = normalizeExtension(file);
  const objectPath = `feedback/${randomUUID()}${extension}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
    cacheControl: "3600",
  });

  if (error) {
    console.error("Feedback upload error:", error);
    throw new Error("No se pudo subir la captura.");
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);

  return {
    url: data.publicUrl,
    path: objectPath,
    mime: file.mimetype,
    size: file.size,
  };
}

function normalizeExtension(file) {
  const originalExtension = path.extname(file.originalname || "").toLowerCase();
  if (originalExtension) return originalExtension;

  if (file.mimetype === "image/jpeg") return ".jpg";
  if (file.mimetype === "image/png") return ".png";
  if (file.mimetype === "image/webp") return ".webp";

  return "";
}