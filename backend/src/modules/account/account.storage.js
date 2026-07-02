/**
 * account.storage.js
 *
 * Servicio auxiliar de almacenamiento para el módulo de cuenta.
 * Responsabilidad única: validación, procesamiento (sharp) y ciclo de vida
 * de los archivos de avatar (upload, rollback, limpieza del anterior).
 *
 * account.service.js NO debe conocer sharp, file-type, ni el orden
 * upload -> persistencia -> rollback. Solo consume esta interfaz:
 *
 *   - replaceUserAvatar({ userId, file, previousAvatarFileId, persist })
 *   - removeUserAvatar({ userId, avatarFileId })
 */

import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import {
  queueFileDeletion,
  uploadManagedFile,
} from "../../core/storage/storage.service.js";

// --- Política de avatares (detalle de infraestructura, vive acá) ---

const ALLOWED_AVATAR_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_AVATAR_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

const AVATAR_MIN_DIMENSION = 256;
const AVATAR_OUTPUT_SIZE = 512;
const AVATAR_OUTPUT_QUALITY = 86;
const AVATAR_OUTPUT_FORMAT = { mime: "image/webp", ext: "webp" };

// TODO: idealmente mover createAppError a core/errors/appError.js
// y compartirlo entre módulos. Se duplica acá para no acoplar
// este módulo al servicio de cuenta.
function createAppError(status, code, message, fieldErrors) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (fieldErrors) err.fieldErrors = fieldErrors;
  return err;
}

// --- Validación y procesamiento (privados del módulo) ---

async function assertValidAvatarFile(file) {
  if (!file?.buffer) {
    throw createAppError(
      400,
      "AVATAR_REQUIRED",
      "Seleccioná una imagen para continuar."
    );
  }

  const fileType = await fileTypeFromBuffer(file.buffer);

  if (!fileType || !ALLOWED_AVATAR_MIME.has(fileType.mime)) {
    throw createAppError(
      400,
      "INVALID_AVATAR_TYPE",
      "Formato de imagen no permitido. Usá JPG, PNG o WEBP."
    );
  }

  if (!ALLOWED_AVATAR_EXT.has(fileType.ext)) {
    throw createAppError(
      400,
      "INVALID_AVATAR_EXTENSION",
      "Formato de imagen no permitido."
    );
  }
}

async function processAvatarImage(buffer) {
  const image = sharp(buffer, { failOn: "error" });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw createAppError(
      400,
      "INVALID_AVATAR_IMAGE",
      "No se pudo procesar la imagen."
    );
  }

  if (
    metadata.width < AVATAR_MIN_DIMENSION ||
    metadata.height < AVATAR_MIN_DIMENSION
  ) {
    throw createAppError(
      400,
      "AVATAR_TOO_SMALL",
      `La imagen debe medir al menos ${AVATAR_MIN_DIMENSION}x${AVATAR_MIN_DIMENSION} píxeles.`
    );
  }

  return image
    .rotate()
    .resize(AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: AVATAR_OUTPUT_QUALITY })
    .toBuffer();
}

function queueDeletionSafe({ fileId, ownerUserId, reason }) {
  // La limpieza es best-effort: nunca debe romper el flujo principal.
  return queueFileDeletion({ fileId, ownerUserId, reason }).catch(() => {});
}

// --- API pública del módulo ---

/**
 * Reemplaza el avatar de un usuario aplicando el ciclo completo:
 * validar -> procesar -> subir -> persistir (callback) -> limpiar anterior.
 *
 * Inversión de dependencias: quien llama provee `persist(uploadedFileId)`,
 * la función que guarda la referencia en el dominio (ej: repo.setAvatarFile).
 * Si `persist` falla, este módulo hace rollback del archivo subido.
 *
 * @param {Object} params
 * @param {string|number} params.userId
 * @param {Object} params.file - archivo recibido (multer u similar)
 * @param {string|null} params.previousAvatarFileId
 * @param {(uploadedFileId: string) => Promise<any>} params.persist
 * @returns {Promise<any>} lo que retorne `persist` (ej: el usuario actualizado)
 */
export async function replaceUserAvatar({
  userId,
  file,
  previousAvatarFileId,
  persist,
}) {
  await assertValidAvatarFile(file);

  const processedBuffer = await processAvatarImage(file.buffer);

  let uploadedFile = null;

  try {
    uploadedFile = await uploadManagedFile({
      ownerUserId: userId,
      purpose: "USER_AVATAR",
      resourceType: "USER",
      resourceId: String(userId),
      file,
      processedBuffer,
      forcedMimeType: AVATAR_OUTPUT_FORMAT.mime,
      forcedExtension: AVATAR_OUTPUT_FORMAT.ext,
      metadata: {
        source: "account-avatar",
      },
    });

    const result = await persist(uploadedFile.id);

    if (previousAvatarFileId && previousAvatarFileId !== uploadedFile.id) {
      await queueDeletionSafe({
        fileId: previousAvatarFileId,
        ownerUserId: userId,
        reason: "avatar-replaced",
      });
    }

    return result;
  } catch (error) {
    if (uploadedFile?.id) {
      await queueDeletionSafe({
        fileId: uploadedFile.id,
        ownerUserId: userId,
        reason: "avatar-upload-rollback",
      });
    }

    throw error;
  }
}

/**
 * Encola la eliminación del archivo de avatar de un usuario.
 * La persistencia del dominio (limpiar la FK) es responsabilidad del caller.
 */
export async function removeUserAvatar({ userId, avatarFileId }) {
  if (!avatarFileId) return;

  await queueDeletionSafe({
    fileId: avatarFileId,
    ownerUserId: userId,
    reason: "avatar-removed",
  });
}
