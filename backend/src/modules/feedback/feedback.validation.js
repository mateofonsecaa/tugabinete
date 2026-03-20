import crypto from "crypto";

export const MIN_DESCRIPTION_LENGTH = 12;
export const MAX_DESCRIPTION_LENGTH = 1200;
export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const FEEDBACK_CATEGORY_LABELS = {
  IDEA_NUEVA: "Idea nueva",
  MEJORA_VISUAL: "Mejora visual",
  ERROR_PROBLEMA: "Error o problema",
  NUEVA_FUNCION: "Nueva función",
  EXPERIENCIA_DE_USO: "Experiencia de uso",
  OTRA: "Otra",
};

export const PUBLIC_FEEDBACK_CATEGORIES = new Set([
  "IDEA_NUEVA",
  "MEJORA_VISUAL",
  "NUEVA_FUNCION",
  "EXPERIENCIA_DE_USO",
  "OTRA",
]);

export function normalizeCategory(rawValue) {
  const value = String(rawValue || "").trim().toUpperCase();

  if (!FEEDBACK_CATEGORY_LABELS[value]) {
    throw new Error("Categoría inválida.");
  }

  return value;
}

export function isPublicCategory(category) {
  return PUBLIC_FEEDBACK_CATEGORIES.has(category);
}

export function getVisibilityForCategory(category) {
  return isPublicCategory(category) ? "PUBLIC" : "PRIVATE";
}

export function normalizeBoolean(rawValue) {
  return rawValue === true || rawValue === "true" || rawValue === "1" || rawValue === "on";
}

export function sanitizeDescription(rawValue) {
  return String(rawValue || "")
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function validateDescription(description) {
  if (!description) {
    throw new Error("La descripción no puede estar vacía.");
  }

  if (description.length < MIN_DESCRIPTION_LENGTH) {
    throw new Error(`La descripción debe tener al menos ${MIN_DESCRIPTION_LENGTH} caracteres.`);
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`);
  }
}

export function validateAttachment(file) {
  if (!file) return;

  if (!ALLOWED_ATTACHMENT_MIME.has(file.mimetype)) {
    throw new Error("La captura debe ser JPG, PNG o WEBP.");
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("La captura supera el máximo de 5 MB.");
  }
}

export function buildDescriptionHash(description) {
  return crypto.createHash("sha256").update(description.toLowerCase()).digest("hex");
}