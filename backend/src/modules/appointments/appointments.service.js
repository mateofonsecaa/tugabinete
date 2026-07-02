/**
 * appointments.service.js (refactorizado)
 *
 * Orquestación y lógica de negocio del módulo de turnos. Ya no importa
 * Prisma ni el storage service de core: delega en
 *
 *   appointments.repository.js  -> toda la interacción con la BD
 *   appointments.storage.js     -> uploads, URLs firmadas, borrado de archivos
 *
 * Se queda acá lo que es negocio:
 *   - Normalización de input (fechas, labels, montos, payloads JSON).
 *   - La regla "antes/después" (pickLegacyFileIdsFromPhotos), que se
 *     inyecta al repositorio como callback dentro de la transacción.
 *   - El límite de fotos por tratamiento.
 *   - La reconciliación de existingPhotos (qué se retiene, qué se borra).
 *   - La coreografía upload -> persistencia -> limpieza, con rollback
 *     de archivos si la persistencia falla.
 *
 * El procesamiento de fotos entrantes está extraído a helpers
 * declarativos: uploadIncomingPhotoRows (create) y
 * replaceLegacyPhotoInGallery + appendGalleryDrafts (update), que
 * reportan cada fileId subido vía onUploaded para que el caller
 * conserve el control del rollback.
 */

import * as repo from "./appointments.repository.js";
import * as storage from "./appointments.storage.js";

const APPOINTMENT_PHOTO_LIMIT = 10;
const APPOINTMENT_LABEL_MAX_LENGTH = 30;

function createAppError(status, message, code = "APPOINTMENT_ERROR") {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

// --- Normalización de input (negocio) ---

function normalizeLooseText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeGalleryLabel(value) {
  const label = String(value || "").trim();
  if (!label) return null;
  return label.slice(0, APPOINTMENT_LABEL_MAX_LENGTH);
}

function buildTreatmentDate(date, time) {
  const safeDate = String(date || "").trim();
  const safeTime = String(time || "").trim();

  if (!safeDate) {
    return null;
  }

  if (safeTime) {
    const value = new Date(`${safeDate}T${safeTime}:00-03:00`);

    if (Number.isNaN(value.getTime())) {
      throw createAppError(400, "Fecha u hora inválida.", "APPOINTMENT_DATE_INVALID");
    }

    return value;
  }

  const value = new Date(`${safeDate}T00:00:00-03:00`);

  if (Number.isNaN(value.getTime())) {
    throw createAppError(400, "Fecha inválida.", "APPOINTMENT_DATE_INVALID");
  }

  return value;
}

function parseJsonArrayField(value, fieldName) {
  if (value === undefined || value === null || value === "") return [];

  if (Array.isArray(value)) {
    if (value.length === 1 && typeof value[0] === "string") {
      const only = String(value[0]).trim();
      if (!only) return [];
      try {
        const parsed = JSON.parse(only);
        if (!Array.isArray(parsed)) {
          throw new Error();
        }
        return parsed;
      } catch {
        return value;
      }
    }
    return value;
  }

  const raw = String(value).trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed;
  } catch {
    throw createAppError(400, `${fieldName} inválido.`, "APPOINTMENT_GALLERY_PAYLOAD_INVALID");
  }
}

// --- Extracción de archivos del request ---

function getBeforePhotoFile(files) {
  return files?.beforePhoto?.[0] || null;
}

function getAfterPhotoFile(files) {
  return files?.afterPhoto?.[0] || null;
}

function getGalleryFiles(files) {
  return Array.isArray(files?.photos) ? files.photos : [];
}

function extractNewGalleryDrafts(files, data) {
  const galleryFiles = getGalleryFiles(files);
  const newPhotoLabels = parseJsonArrayField(
    data?.newPhotoLabels ?? data?.photoLabels,
    "newPhotoLabels"
  );

  return galleryFiles.map((file, index) => ({
    file,
    label: normalizeGalleryLabel(newPhotoLabels[index]),
  }));
}

// --- Regla de negocio: antes/después ---

function labelIsBefore(label) {
  return normalizeLooseText(label) === "antes";
}

function labelIsAfter(label) {
  return normalizeLooseText(label) === "despues";
}

function pickLegacyFileIdsFromPhotos(photos) {
  if (!Array.isArray(photos) || !photos.length) {
    return {
      beforePhotoFileId: null,
      afterPhotoFileId: null,
    };
  }

  const before = photos.find((photo) => labelIsBefore(photo.label)) || photos[0] || null;

  const after =
    photos.find((photo) => labelIsAfter(photo.label)) ||
    photos.find((photo) => photo.fileId !== before?.fileId) ||
    null;

  return {
    beforePhotoFileId: before?.fileId || null,
    afterPhotoFileId: after?.fileId || null,
  };
}

function buildLegacyPhotoUrlsFromSignedGallery(signedGallery) {
  if (!signedGallery.length) {
    return {
      beforePhoto: null,
      afterPhoto: null,
    };
  }

  const before = signedGallery.find((photo) => labelIsBefore(photo.label)) || signedGallery[0] || null;

  const after =
    signedGallery.find((photo) => labelIsAfter(photo.label)) ||
    signedGallery.find((photo) => photo.fileId !== before?.fileId) ||
    null;

  return {
    beforePhoto: before?.url || null,
    afterPhoto: after?.url || null,
  };
}

// --- Validaciones de dominio ---

async function ensureOwnedPatient(userId, patientId) {
  const normalizedPatientId = Number(patientId);

  if (!Number.isInteger(normalizedPatientId) || normalizedPatientId <= 0) {
    throw createAppError(400, "patientId inválido.", "PATIENT_ID_INVALID");
  }

  const patient = await repo.findOwnedPatient(userId, normalizedPatientId);

  if (!patient) {
    throw createAppError(404, "Paciente no encontrado.", "PATIENT_NOT_FOUND");
  }

  return normalizedPatientId;
}

// --- Migración perezosa: fotos legacy -> galería ---

async function syncLegacyPhotosToGallery(appointment) {
  if (!appointment) return [];

  const existing = Array.isArray(appointment.photos) ? appointment.photos : [];
  const existingFileIds = new Set(existing.map((photo) => photo.fileId));
  const inserts = [];

  if (appointment.beforePhotoFileId && !existingFileIds.has(appointment.beforePhotoFileId)) {
    inserts.push({
      appointmentId: appointment.id,
      fileId: appointment.beforePhotoFileId,
      label: "Antes",
      position: 0,
    });
  }

  if (appointment.afterPhotoFileId && !existingFileIds.has(appointment.afterPhotoFileId)) {
    inserts.push({
      appointmentId: appointment.id,
      fileId: appointment.afterPhotoFileId,
      label: "Después",
      position: existing.length + inserts.length,
    });
  }

  if (inserts.length) {
    await repo.createAppointmentPhotos(inserts, { skipDuplicates: true });
  }

  return repo.findAppointmentPhotos(appointment.id);
}

// --- Upload de fotos (delegando el archivo, quedándose el negocio) ---

async function uploadPhotoRow({ userId, appointmentId, file, purpose, label, position, metadata }) {
  const { fileId } = await storage.uploadAppointmentPhoto({
    ownerUserId: userId,
    appointmentId,
    file,
    purpose,
    metadata,
  });

  return {
    fileId,
    label: normalizeGalleryLabel(label),
    position,
  };
}

// --- Procesamiento declarativo de fotos entrantes ---

const LEGACY_PHOTO_SLOTS = {
  before: {
    purpose: "APPOINTMENT_BEFORE_PHOTO",
    label: "Antes",
    side: "before",
    matches: labelIsBefore,
    insertAtStart: true,
  },
  after: {
    purpose: "APPOINTMENT_AFTER_PHOTO",
    label: "Después",
    side: "after",
    matches: labelIsAfter,
    insertAtStart: false,
  },
};

/**
 * CREATE: sube todas las fotos entrantes de un turno nuevo en orden
 * (Antes -> Después -> galería) y devuelve las filas listas para la BD.
 *
 * Cada fileId se reporta vía `onUploaded` ANTES de seguir con la próxima
 * foto, para que el caller pueda hacer rollback de lo ya subido si algo
 * falla a mitad de camino.
 */
async function uploadIncomingPhotoRows({
  userId,
  appointmentId,
  beforeFile,
  afterFile,
  newGalleryDrafts,
  source,
  onUploaded,
}) {
  const specs = [
    beforeFile && {
      file: beforeFile,
      purpose: LEGACY_PHOTO_SLOTS.before.purpose,
      label: LEGACY_PHOTO_SLOTS.before.label,
      metadata: { source, side: "before", mode: "legacy" },
    },
    afterFile && {
      file: afterFile,
      purpose: LEGACY_PHOTO_SLOTS.after.purpose,
      label: LEGACY_PHOTO_SLOTS.after.label,
      metadata: { source, side: "after", mode: "legacy" },
    },
    ...newGalleryDrafts.map((draft) => ({
      file: draft.file,
      purpose: "APPOINTMENT_PHOTO",
      label: draft.label,
      metadata: { source, mode: "gallery" },
    })),
  ].filter(Boolean);

  const rows = [];

  for (const spec of specs) {
    const uploaded = await uploadPhotoRow({
      userId,
      appointmentId,
      file: spec.file,
      purpose: spec.purpose,
      label: spec.label,
      position: rows.length,
      metadata: spec.metadata,
    });
    onUploaded(uploaded.fileId);
    rows.push(uploaded);
  }

  return rows;
}

/**
 * UPDATE: sube una foto legacy (Antes/Después) y la aplica sobre la
 * galería retenida con semántica reemplazar-o-insertar:
 *  - Si ya existe una foto con ese label, la pisa y marca el archivo
 *    anterior para borrado diferido (`onReplaced`).
 *  - Si no existe, la inserta (Antes al principio, Después al final).
 *
 * Muta `retainedPhotos` in place. No hace nada si `file` es null.
 */
async function replaceLegacyPhotoInGallery({
  userId,
  appointmentId,
  file,
  slot,
  retainedPhotos,
  source,
  onUploaded,
  onReplaced,
}) {
  if (!file) return;

  const config = LEGACY_PHOTO_SLOTS[slot];

  const uploaded = await uploadPhotoRow({
    userId,
    appointmentId,
    file,
    purpose: config.purpose,
    label: config.label,
    position: config.insertAtStart ? 0 : retainedPhotos.length,
    metadata: { source, side: config.side, mode: "legacy" },
  });
  onUploaded(uploaded.fileId);

  const index = retainedPhotos.findIndex((photo) => config.matches(photo.label));

  if (index >= 0) {
    onReplaced(retainedPhotos[index].fileId);
    retainedPhotos[index] = {
      ...retainedPhotos[index],
      fileId: uploaded.fileId,
      label: config.label,
    };
    return;
  }

  const inserted = {
    id: null,
    fileId: uploaded.fileId,
    label: config.label,
    position: config.insertAtStart ? -1 : retainedPhotos.length,
    createdAt: new Date(),
  };

  if (config.insertAtStart) {
    retainedPhotos.unshift(inserted);
  } else {
    retainedPhotos.push(inserted);
  }
}

/**
 * UPDATE: sube los borradores nuevos de galería y los agrega al final
 * de la galería retenida. Muta `retainedPhotos` in place.
 */
async function appendGalleryDrafts({
  userId,
  appointmentId,
  drafts,
  retainedPhotos,
  source,
  onUploaded,
}) {
  for (const draft of drafts) {
    const uploaded = await uploadPhotoRow({
      userId,
      appointmentId,
      file: draft.file,
      purpose: "APPOINTMENT_PHOTO",
      label: draft.label,
      position: retainedPhotos.length,
      metadata: { source, mode: "gallery" },
    });
    onUploaded(uploaded.fileId);

    retainedPhotos.push({
      id: null,
      fileId: uploaded.fileId,
      label: uploaded.label,
      position: retainedPhotos.length,
      createdAt: new Date(),
    });
  }
}

// --- Reconciliación de galería existente ---

function normalizeExistingPhotoPayload(payload, currentPhotos) {
  if (!payload.length) {
    return {
      retained: [],
      removed: currentPhotos,
    };
  }

  const currentById = new Map(currentPhotos.map((photo) => [Number(photo.id), photo]));
  const retained = [];
  const seenIds = new Set();

  payload.forEach((item, index) => {
    const id = Number(item?.id);
    if (!Number.isInteger(id)) {
      throw createAppError(400, "existingPhotos contiene un id inválido.", "APPOINTMENT_GALLERY_PAYLOAD_INVALID");
    }

    const current = currentById.get(id);
    if (!current) {
      throw createAppError(400, "existingPhotos contiene una foto inexistente.", "APPOINTMENT_GALLERY_PHOTO_NOT_FOUND");
    }

    if (seenIds.has(id)) {
      throw createAppError(400, "existingPhotos contiene ids duplicados.", "APPOINTMENT_GALLERY_DUPLICATED_IDS");
    }
    seenIds.add(id);

    if (item?.keep === false) {
      return;
    }

    retained.push({
      id: current.id,
      fileId: current.fileId,
      label:
        item?.label !== undefined
          ? normalizeGalleryLabel(item.label)
          : normalizeGalleryLabel(current.label),
      position: Number.isInteger(item?.position) ? item.position : index,
      createdAt: current.createdAt,
    });
  });

  retained.sort((a, b) => a.position - b.position);

  const removed = currentPhotos.filter((photo) => !seenIds.has(photo.id));
  return { retained, removed };
}

function normalizeUpdateBaseData(existing, data, patientId) {
  const nextDate =
    data.date !== undefined
      ? (data.date ? String(data.date).trim() : "")
      : (existing.date ? new Date(existing.date).toISOString().slice(0, 10) : "");

  const nextTime =
    data.time !== undefined
      ? (data.time ? String(data.time).trim() : "")
      : (existing.time || "");

  return {
    patientId,
    date: buildTreatmentDate(nextDate, nextTime),
    time: nextTime || null,
    treatment:
      data.treatment !== undefined
        ? (data.treatment ? String(data.treatment).trim() : null)
        : existing.treatment,
    amount:
      data.amount !== undefined && data.amount !== null && data.amount !== ""
        ? parseFloat(data.amount)
        : data.amount === ""
        ? null
        : existing.amount,
    notes:
      data.notes !== undefined
        ? (data.notes ? String(data.notes) : null)
        : existing.notes,
    status:
      data.status !== undefined
        ? (data.status ? String(data.status).trim() : null)
        : existing.status,
    method:
      data.method !== undefined
        ? (data.method ? String(data.method).trim() : null)
        : existing.method,
    completed:
      normalizeLooseText(
        data.status !== undefined ? data.status : existing.status || ""
      ) === "pagado",
  };
}

// --- API pública del servicio ---

export const getAll = async (userId, offset = 0, limit = 50) => {
  return repo.findManyByUser(userId, {
    offset: Number(offset) || 0,
    limit: Number(limit) || 50,
  });
};

export const getByPatient = async (userId, patientId, offset = 0, limit = 50) => {
  return repo.findManyByPatient(userId, patientId, {
    offset: Number(offset) || 0,
    limit: Number(limit) || 50,
  });
};

export const getPhotos = async (id, userId) => {
  const appointment = await repo.findOwnedAppointment(id, userId);

  if (!appointment) {
    throw createAppError(404, "Tratamiento no encontrado.", "APPOINTMENT_NOT_FOUND");
  }

  const galleryRows = await syncLegacyPhotosToGallery(appointment);
  const signedGallery = await storage.buildSignedGallery(galleryRows, userId);
  const legacy = buildLegacyPhotoUrlsFromSignedGallery(signedGallery);

  return {
    beforePhoto: legacy.beforePhoto,
    afterPhoto: legacy.afterPhoto,
    photos: signedGallery,
  };
};

export const create = async (userId, data, files) => {
  const patientId = await ensureOwnedPatient(userId, data.patientId);
  const treatmentDate = buildTreatmentDate(data.date, data.time);

  const beforeFile = getBeforePhotoFile(files);
  const afterFile = getAfterPhotoFile(files);
  const newGalleryDrafts = extractNewGalleryDrafts(files, data);

  const incomingPhotosCount =
    Number(Boolean(beforeFile)) + Number(Boolean(afterFile)) + newGalleryDrafts.length;
  if (incomingPhotosCount > APPOINTMENT_PHOTO_LIMIT) {
    throw createAppError(400, `Se permiten hasta ${APPOINTMENT_PHOTO_LIMIT} fotos por tratamiento.`, "APPOINTMENT_GALLERY_LIMIT_EXCEEDED");
  }

  let createdAppointment = null;
  const uploadedFileIds = [];

  try {
    createdAppointment = await repo.createAppointment({
      userId,
      patientId,
      date: treatmentDate,
      time: data.time !== undefined && data.time !== null && String(data.time).trim() !== ""
        ? String(data.time).trim()
        : null,
      treatment: data.treatment ? String(data.treatment).trim() : null,
      amount: data.amount !== undefined && data.amount !== null && data.amount !== ""
        ? parseFloat(data.amount)
        : null,
      notes: data.notes ? String(data.notes) : null,
      status: data.status ? String(data.status).trim() : null,
      method: data.method ? String(data.method).trim() : null,
      completed: normalizeLooseText(data.status || "") === "pagado",
    });

    const uploadedRows = await uploadIncomingPhotoRows({
      userId,
      appointmentId: createdAppointment.id,
      beforeFile,
      afterFile,
      newGalleryDrafts,
      source: "appointments-create",
      onUploaded: (fileId) => uploadedFileIds.push(fileId),
    });

    if (uploadedRows.length) {
      await repo.createAppointmentPhotos(
        uploadedRows.map((row, index) => ({
          appointmentId: createdAppointment.id,
          fileId: row.fileId,
          label: row.label,
          position: index,
        }))
      );
    }

    const legacyFileIds = pickLegacyFileIdsFromPhotos(uploadedRows);

    return repo.setLegacyPhotoFileIds(createdAppointment.id, legacyFileIds);
  } catch (error) {
    await storage.queueAppointmentFileDeletions({
      fileIds: uploadedFileIds,
      ownerUserId: userId,
      reason: "appointment-create-rollback",
    });

    if (createdAppointment?.id) {
      await repo
        .deleteOwnedAppointment(createdAppointment.id, userId)
        .catch(() => {});
    }

    throw error;
  }
};

export const update = async (userId, id, data, files) => {
  const existing = await repo.findOwnedAppointment(id, userId);

  if (!existing) {
    throw createAppError(404, "Tratamiento no encontrado.", "APPOINTMENT_NOT_FOUND");
  }

  const patientId =
    data.patientId !== undefined && data.patientId !== null && data.patientId !== ""
      ? await ensureOwnedPatient(userId, data.patientId)
      : existing.patientId;

  const currentPhotos = await syncLegacyPhotosToGallery(existing);
  const existingPhotosPayloadWasSent = Object.prototype.hasOwnProperty.call(data || {}, "existingPhotos");
  const existingPhotosPayload = parseJsonArrayField(data?.existingPhotos, "existingPhotos");

  let retainedPhotos = currentPhotos.map((photo, index) => ({
    id: photo.id,
    fileId: photo.fileId,
    label: normalizeGalleryLabel(photo.label),
    position: index,
    createdAt: photo.createdAt,
  }));
  let removedPhotos = [];

  if (existingPhotosPayloadWasSent) {
    const normalized = normalizeExistingPhotoPayload(existingPhotosPayload, currentPhotos);
    retainedPhotos = normalized.retained;
    removedPhotos = normalized.removed;
  }

  const beforeFile = getBeforePhotoFile(files);
  const afterFile = getAfterPhotoFile(files);
  const newGalleryDrafts = extractNewGalleryDrafts(files, data);

  const uploadedNewFileIds = [];
  const filesToDeleteAfterSuccess = new Set(removedPhotos.map((photo) => photo.fileId));

  try {
    const onUploaded = (fileId) => uploadedNewFileIds.push(fileId);
    const onReplaced = (fileId) => filesToDeleteAfterSuccess.add(fileId);

    await replaceLegacyPhotoInGallery({
      userId,
      appointmentId: existing.id,
      file: beforeFile,
      slot: "before",
      retainedPhotos,
      source: "appointments-update",
      onUploaded,
      onReplaced,
    });

    await replaceLegacyPhotoInGallery({
      userId,
      appointmentId: existing.id,
      file: afterFile,
      slot: "after",
      retainedPhotos,
      source: "appointments-update",
      onUploaded,
      onReplaced,
    });

    await appendGalleryDrafts({
      userId,
      appointmentId: existing.id,
      drafts: newGalleryDrafts,
      retainedPhotos,
      source: "appointments-update",
      onUploaded,
    });

    retainedPhotos = retainedPhotos.map((photo, index) => ({
      ...photo,
      position: index,
    }));

    if (retainedPhotos.length > APPOINTMENT_PHOTO_LIMIT) {
      throw createAppError(400, `Se permiten hasta ${APPOINTMENT_PHOTO_LIMIT} fotos por tratamiento.`, "APPOINTMENT_GALLERY_LIMIT_EXCEEDED");
    }

    const updateData = normalizeUpdateBaseData(existing, data, patientId);

    // La transacción vive en el repositorio; la regla legacy se inyecta
    // como callback para que se calcule sobre las fotos frescas DENTRO
    // de la misma transacción (DIP).
    await repo.updateAppointmentWithPhotos({
      appointmentId: existing.id,
      updateData,
      removedPhotoIds: removedPhotos.map((photo) => photo.id),
      retainedPhotos,
      computeLegacyFileIds: pickLegacyFileIdsFromPhotos,
    });

    await storage.queueAppointmentFileDeletions({
      fileIds: [...filesToDeleteAfterSuccess],
      ownerUserId: userId,
      reason: "appointment-photo-removed-or-replaced",
    });

    return repo.findByIdForList(existing.id);
  } catch (error) {
    await storage.queueAppointmentFileDeletions({
      fileIds: uploadedNewFileIds,
      ownerUserId: userId,
      reason: "appointment-update-rollback",
    });

    throw error;
  }
};

export const remove = async (userId, id) => {
  const existing = await repo.findOwnedAppointment(id, userId);

  if (!existing) {
    return { count: 0 };
  }

  const galleryRows = await syncLegacyPhotosToGallery(existing);
  const fileIds = new Set(
    [
      ...galleryRows.map((photo) => photo.fileId),
      existing.beforePhotoFileId,
      existing.afterPhotoFileId,
    ].filter(Boolean)
  );

  await repo.deleteOwnedAppointment(existing.id, userId);

  await storage.queueAppointmentFileDeletions({
    fileIds: [...fileIds],
    ownerUserId: userId,
    reason: "appointment-deleted",
  });

  return { count: 1 };
};

export const getCompletedCount = async (userId) => {
  return repo.countCompleted(userId);
};