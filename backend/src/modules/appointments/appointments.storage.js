/**
 * appointments.storage.js
 *
 * Capa de archivos del módulo de turnos. Responsabilidad única:
 * subir fotos de turnos, generar URLs firmadas y encolar borrados.
 *
 * Acá NO hay reglas de negocio: ni límites de fotos, ni normalización
 * de labels, ni la regla "antes/después". El servicio decide QUÉ subir
 * o borrar; este módulo sabe CÓMO.
 */

import {
  createPrivateSignedUrlForFile,
  queueFileDeletion,
  uploadManagedFile,
} from "../../core/storage/storage.service.js";

/**
 * Sube una foto asociada a un turno y devuelve su fileId.
 *
 * @param {Object} params
 * @param {string|number} params.ownerUserId
 * @param {number} params.appointmentId
 * @param {Object} params.file - archivo recibido (multer u similar)
 * @param {string} params.purpose - APPOINTMENT_PHOTO | APPOINTMENT_BEFORE_PHOTO | APPOINTMENT_AFTER_PHOTO
 * @param {Object} [params.metadata]
 * @returns {Promise<{fileId: string}>}
 */
export async function uploadAppointmentPhoto({
  ownerUserId,
  appointmentId,
  file,
  purpose,
  metadata,
}) {
  const uploaded = await uploadManagedFile({
    ownerUserId,
    purpose,
    resourceType: "APPOINTMENT",
    resourceId: String(appointmentId),
    file,
    metadata,
  });

  return { fileId: uploaded.id };
}

/**
 * Encola el borrado de un archivo. Best-effort: nunca rompe el flujo
 * principal (un borrado fallido se resuelve con un job de limpieza,
 * no abortando la operación del usuario).
 */
export function queueAppointmentFileDeletion({ fileId, ownerUserId, reason }) {
  return queueFileDeletion({ fileId, ownerUserId, reason }).catch(() => {});
}

/**
 * Encola el borrado de varios archivos (ignora falsy en la lista).
 */
export async function queueAppointmentFileDeletions({
  fileIds,
  ownerUserId,
  reason,
}) {
  for (const fileId of fileIds) {
    if (!fileId) continue;
    await queueAppointmentFileDeletion({ fileId, ownerUserId, reason });
  }
}

/**
 * Genera URLs firmadas privadas para una galería de fotos.
 * Las fotos cuyo archivo no se puede firmar (borrado, huérfano)
 * se omiten silenciosamente del resultado, igual que en el
 * comportamiento original.
 *
 * @param {Array<{id: number, fileId: string, label: string|null, position: number}>} photos
 * @param {string|number} ownerUserId
 * @returns {Promise<Array<{id, fileId, label, position, url}>>}
 */
export async function buildSignedGallery(photos, ownerUserId) {
  const signed = await Promise.all(
    (photos || []).map(async (photo) => {
      try {
        const result = await createPrivateSignedUrlForFile({
          fileId: photo.fileId,
          ownerUserId,
        });

        return {
          id: photo.id,
          fileId: photo.fileId,
          label: photo.label || null,
          position: photo.position,
          url: result.signedUrl,
        };
      } catch {
        return null;
      }
    })
  );

  return signed.filter(Boolean);
}
