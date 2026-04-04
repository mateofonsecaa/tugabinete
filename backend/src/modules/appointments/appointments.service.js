import prisma from "../../config/prisma.js";
import {
  createPrivateSignedUrlForFile,
  queueFileDeletion,
  uploadManagedFile,
} from "../../core/storage/storage.service.js";

const APPOINTMENT_PHOTO_LIMIT = 10;
const APPOINTMENT_LABEL_MAX_LENGTH = 30;

const APPOINTMENT_LIST_SELECT = {
  id: true,
  date: true,
  time: true,
  treatment: true,
  amount: true,
  notes: true,
  status: true,
  method: true,
  createdAt: true,
  patient: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      address: true,
    },
  },
};

function createAppError(status, message, code = "APPOINTMENT_ERROR") {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

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

async function ensureOwnedPatient(userId, patientId) {
  const normalizedPatientId = Number(patientId);

  if (!Number.isInteger(normalizedPatientId) || normalizedPatientId <= 0) {
    throw createAppError(400, "patientId inválido.", "PATIENT_ID_INVALID");
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: normalizedPatientId,
      userId,
    },
    select: { id: true },
  });

  if (!patient) {
    throw createAppError(404, "Paciente no encontrado.", "PATIENT_NOT_FOUND");
  }

  return normalizedPatientId;
}

async function findOwnedAppointment(id, userId) {
  return prisma.appointment.findFirst({
    where: {
      id: Number(id),
      userId,
    },
    select: {
      id: true,
      userId: true,
      patientId: true,
      date: true,
      time: true,
      treatment: true,
      amount: true,
      notes: true,
      status: true,
      method: true,
      createdAt: true,
      beforePhotoFileId: true,
      afterPhotoFileId: true,
      photos: {
        select: {
          id: true,
          fileId: true,
          label: true,
          position: true,
          createdAt: true,
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });
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
    await prisma.appointmentPhoto.createMany({
      data: inserts,
      skipDuplicates: true,
    });
  }

  return prisma.appointmentPhoto.findMany({
    where: { appointmentId: appointment.id },
    select: {
      id: true,
      fileId: true,
      label: true,
      position: true,
      createdAt: true,
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
}

async function buildSignedGallery(photos, ownerUserId) {
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

async function uploadAppointmentPhoto({ userId, appointmentId, file, purpose, label, position, metadata }) {
  const uploaded = await uploadManagedFile({
    ownerUserId: userId,
    purpose,
    resourceType: "APPOINTMENT",
    resourceId: String(appointmentId),
    file,
    metadata,
  });

  return {
    fileId: uploaded.id,
    label: normalizeGalleryLabel(label),
    position,
  };
}

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

export const getAll = async (userId, offset = 0, limit = 50) => {
  offset = Number(offset) || 0;
  limit = Number(limit) || 50;

  return prisma.appointment.findMany({
    where: { userId },
    select: APPOINTMENT_LIST_SELECT,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    skip: offset,
    take: limit,
  });
};

export const getByPatient = async (userId, patientId, offset = 0, limit = 50) => {
  offset = Number(offset) || 0;
  limit = Number(limit) || 50;

  return prisma.appointment.findMany({
    where: {
      userId,
      patientId: Number(patientId),
    },
    select: APPOINTMENT_LIST_SELECT,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    skip: offset,
    take: limit,
  });
};

export const getPhotos = async (id, userId) => {
  const appointment = await findOwnedAppointment(id, userId);

  if (!appointment) {
    throw createAppError(404, "Tratamiento no encontrado.", "APPOINTMENT_NOT_FOUND");
  }

  const galleryRows = await syncLegacyPhotosToGallery(appointment);
  const signedGallery = await buildSignedGallery(galleryRows, userId);
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

  const incomingPhotosCount = Number(Boolean(beforeFile)) + Number(Boolean(afterFile)) + newGalleryDrafts.length;
  if (incomingPhotosCount > APPOINTMENT_PHOTO_LIMIT) {
    throw createAppError(400, `Se permiten hasta ${APPOINTMENT_PHOTO_LIMIT} fotos por tratamiento.`, "APPOINTMENT_GALLERY_LIMIT_EXCEEDED");
  }

  let createdAppointment = null;
  const uploadedFileIds = [];

  try {
    createdAppointment = await prisma.appointment.create({
      data: {
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
      },
      select: { id: true },
    });

    const uploadedRows = [];

    if (beforeFile) {
      const uploaded = await uploadAppointmentPhoto({
        userId,
        appointmentId: createdAppointment.id,
        file: beforeFile,
        purpose: "APPOINTMENT_BEFORE_PHOTO",
        label: "Antes",
        position: uploadedRows.length,
        metadata: { source: "appointments-create", side: "before", mode: "legacy" },
      });
      uploadedFileIds.push(uploaded.fileId);
      uploadedRows.push(uploaded);
    }

    if (afterFile) {
      const uploaded = await uploadAppointmentPhoto({
        userId,
        appointmentId: createdAppointment.id,
        file: afterFile,
        purpose: "APPOINTMENT_AFTER_PHOTO",
        label: "Después",
        position: uploadedRows.length,
        metadata: { source: "appointments-create", side: "after", mode: "legacy" },
      });
      uploadedFileIds.push(uploaded.fileId);
      uploadedRows.push(uploaded);
    }

    for (const draft of newGalleryDrafts) {
      const uploaded = await uploadAppointmentPhoto({
        userId,
        appointmentId: createdAppointment.id,
        file: draft.file,
        purpose: "APPOINTMENT_PHOTO",
        label: draft.label,
        position: uploadedRows.length,
        metadata: { source: "appointments-create", mode: "gallery" },
      });
      uploadedFileIds.push(uploaded.fileId);
      uploadedRows.push(uploaded);
    }

    if (uploadedRows.length) {
      await prisma.appointmentPhoto.createMany({
        data: uploadedRows.map((row, index) => ({
          appointmentId: createdAppointment.id,
          fileId: row.fileId,
          label: row.label,
          position: index,
        })),
      });
    }

    const legacyFileIds = pickLegacyFileIdsFromPhotos(uploadedRows);

    const updated = await prisma.appointment.update({
      where: { id: createdAppointment.id },
      data: {
        beforePhotoFileId: legacyFileIds.beforePhotoFileId,
        afterPhotoFileId: legacyFileIds.afterPhotoFileId,
      },
      select: APPOINTMENT_LIST_SELECT,
    });

    return updated;
  } catch (error) {
    for (const fileId of uploadedFileIds) {
      await queueFileDeletion({
        fileId,
        ownerUserId: userId,
        reason: "appointment-create-rollback",
      }).catch(() => {});
    }

    if (createdAppointment?.id) {
      await prisma.appointment.deleteMany({
        where: {
          id: createdAppointment.id,
          userId,
        },
      }).catch(() => {});
    }

    throw error;
  }
};

export const update = async (userId, id, data, files) => {
  const existing = await findOwnedAppointment(id, userId);

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
    if (beforeFile) {
      const uploaded = await uploadAppointmentPhoto({
        userId,
        appointmentId: existing.id,
        file: beforeFile,
        purpose: "APPOINTMENT_BEFORE_PHOTO",
        label: "Antes",
        position: 0,
        metadata: { source: "appointments-update", side: "before", mode: "legacy" },
      });
      uploadedNewFileIds.push(uploaded.fileId);

      const beforeIndex = retainedPhotos.findIndex((photo) => labelIsBefore(photo.label));
      if (beforeIndex >= 0) {
        filesToDeleteAfterSuccess.add(retainedPhotos[beforeIndex].fileId);
        retainedPhotos[beforeIndex] = {
          ...retainedPhotos[beforeIndex],
          fileId: uploaded.fileId,
          label: "Antes",
        };
      } else {
        retainedPhotos.unshift({
          id: null,
          fileId: uploaded.fileId,
          label: "Antes",
          position: -1,
          createdAt: new Date(),
        });
      }
    }

    if (afterFile) {
      const uploaded = await uploadAppointmentPhoto({
        userId,
        appointmentId: existing.id,
        file: afterFile,
        purpose: "APPOINTMENT_AFTER_PHOTO",
        label: "Después",
        position: retainedPhotos.length,
        metadata: { source: "appointments-update", side: "after", mode: "legacy" },
      });
      uploadedNewFileIds.push(uploaded.fileId);

      const afterIndex = retainedPhotos.findIndex((photo) => labelIsAfter(photo.label));
      if (afterIndex >= 0) {
        filesToDeleteAfterSuccess.add(retainedPhotos[afterIndex].fileId);
        retainedPhotos[afterIndex] = {
          ...retainedPhotos[afterIndex],
          fileId: uploaded.fileId,
          label: "Después",
        };
      } else {
        retainedPhotos.push({
          id: null,
          fileId: uploaded.fileId,
          label: "Después",
          position: retainedPhotos.length,
          createdAt: new Date(),
        });
      }
    }

    newGalleryDrafts.forEach((draft) => {
      retainedPhotos.push({
        id: null,
        fileId: null,
        label: draft.label,
        position: retainedPhotos.length,
        createdAt: new Date(),
        __draft: draft,
      });
    });

    for (const photo of retainedPhotos) {
      if (!photo.__draft) continue;
      const uploaded = await uploadAppointmentPhoto({
        userId,
        appointmentId: existing.id,
        file: photo.__draft.file,
        purpose: "APPOINTMENT_PHOTO",
        label: photo.__draft.label,
        position: photo.position,
        metadata: { source: "appointments-update", mode: "gallery" },
      });
      uploadedNewFileIds.push(uploaded.fileId);
      photo.fileId = uploaded.fileId;
      photo.label = uploaded.label;
      delete photo.__draft;
    }

    retainedPhotos = retainedPhotos.map((photo, index) => ({
      ...photo,
      position: index,
    }));

    if (retainedPhotos.length > APPOINTMENT_PHOTO_LIMIT) {
      throw createAppError(400, `Se permiten hasta ${APPOINTMENT_PHOTO_LIMIT} fotos por tratamiento.`, "APPOINTMENT_GALLERY_LIMIT_EXCEEDED");
    }

    const updateData = normalizeUpdateBaseData(existing, data, patientId);

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: existing.id },
        data: updateData,
      });

      if (removedPhotos.length) {
        await tx.appointmentPhoto.deleteMany({
          where: {
            appointmentId: existing.id,
            id: { in: removedPhotos.map((photo) => photo.id) },
          },
        });
      }

      for (const photo of retainedPhotos) {
        if (photo.id) {
          await tx.appointmentPhoto.update({
            where: { id: photo.id },
            data: {
              fileId: photo.fileId,
              label: photo.label,
              position: photo.position,
            },
          });
        } else {
          await tx.appointmentPhoto.create({
            data: {
              appointmentId: existing.id,
              fileId: photo.fileId,
              label: photo.label,
              position: photo.position,
            },
          });
        }
      }

      const freshPhotos = await tx.appointmentPhoto.findMany({
        where: { appointmentId: existing.id },
        select: {
          fileId: true,
          label: true,
          position: true,
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      });

      const legacyFileIds = pickLegacyFileIdsFromPhotos(freshPhotos);
      await tx.appointment.update({
        where: { id: existing.id },
        data: {
          beforePhotoFileId: legacyFileIds.beforePhotoFileId,
          afterPhotoFileId: legacyFileIds.afterPhotoFileId,
        },
      });
    });

    for (const fileId of filesToDeleteAfterSuccess) {
      await queueFileDeletion({
        fileId,
        ownerUserId: userId,
        reason: "appointment-photo-removed-or-replaced",
      }).catch(() => {});
    }

    return prisma.appointment.findUnique({
      where: { id: existing.id },
      select: APPOINTMENT_LIST_SELECT,
    });
  } catch (error) {
    for (const fileId of uploadedNewFileIds) {
      await queueFileDeletion({
        fileId,
        ownerUserId: userId,
        reason: "appointment-update-rollback",
      }).catch(() => {});
    }

    throw error;
  }
};

export const remove = async (userId, id) => {
  const existing = await findOwnedAppointment(id, userId);

  if (!existing) {
    return { count: 0 };
  }

  const galleryRows = await syncLegacyPhotosToGallery(existing);
  const fileIds = new Set([
    ...galleryRows.map((photo) => photo.fileId),
    existing.beforePhotoFileId,
    existing.afterPhotoFileId,
  ].filter(Boolean));

  await prisma.appointment.deleteMany({
    where: {
      id: existing.id,
      userId,
    },
  });

  for (const fileId of fileIds) {
    await queueFileDeletion({
      fileId,
      ownerUserId: userId,
      reason: "appointment-deleted",
    }).catch(() => {});
  }

  return { count: 1 };
};

export const getCompletedCount = async (userId) => {
  return prisma.appointment.count({
    where: {
      userId,
      OR: [
        { completed: true },
        { status: "Pagado" },
        { status: "pagado" },
      ],
    },
  });
};
