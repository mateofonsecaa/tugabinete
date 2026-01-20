import multer from "multer";
import { supabase } from "../../core/supabaseClient.js";
import { randomUUID } from "crypto";

// === MULTER (leer imagen desde memoria) ===
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Solo se permiten imágenes"));
    } else {
      cb(null, true);
    }
  }
});

// === SUBIDA A SUPABASE STORAGE ===
export async function uploadToBucket(folder, file) {
  const ext = file.originalname.split(".").pop();
  const filename = `${folder}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("migabinete")
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error("No se pudo subir la imagen");
  }

  const { data } = supabase.storage
    .from("migabinete")
    .getPublicUrl(filename);

  return data.publicUrl;
}
