import prisma from "../../config/prisma.js";
import {
  createPrivateSignedUrlForFile,
  queueFileDeletion,
  uploadManagedFile,
} from "../../core/storage/storage.service.js";

const APPOINTMENT_LIST_SELECT = {
  id: true,
  date: true,
  time: true,
  treatment: true,
  amount: true,
  notes: true,
  status: true,
  method: true,
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

function buildTreatmentDate(date, time) {
  const safeDate = String(date || "").trim();
  const safeTime = String(time || "").trim();

  if (!safeDate) {
    throw createAppError(400, "La fecha es obligatoria.", "APPOINTMENT_DATE_REQUIRED");
  }

  if (!safeTime) {
    throw createAppError(400, "La hora es obligatoria.", "APPOINTMENT_TIME_REQUIRED");
  }

  const value = new Date(`${safeDate}T${safeTime}:00-03:00`);

  if (Number.isNaN(value.getTime())) {
    throw createAppError(400, "Fecha u hora inválida.", "APPOINTMENT_DATE_INVALID");
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
      beforePhoto: true,
      afterPhoto: true,
      beforePhotoFileId: true,
      afterPhotoFileId: true,
    },
  });
}

function getBeforePhotoFile(files) {
  return files?.beforePhoto?.[0] || null;
}

function getAfterPhotoFile(files) {
  return files?.afterPhoto?.[0] || null;
}

export const getAll = async (userId, offset = 0, limit = 50) => {
  offset = Number(offset) || 0;
  limit = Number(limit) || 50;

  return prisma.appointment.findMany({
    where: { userId },
    select: APPOINTMENT_LIST_SELECT,
    orderBy: { date: "desc" },
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
    orderBy: { date: "desc" },
    skip: offset,
    take: limit,
  });
};

export const getPhotos = async (id, userId) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: Number(id),
      userId,
    },
    select: {
      beforePhoto: true,
      afterPhoto: true,
      beforePhotoFileId: true,
      afterPhotoFileId: true,
    },
  });

  if (!appointment) {
    throw createAppError(404, "Tratamiento no encontrado.", "APPOINTMENT_NOT_FOUND");
  }

  let beforePhoto = null;
  let afterPhoto = null;

  if (appointment.beforePhotoFileId) {
    try {
      const result = await createPrivateSignedUrlForFile({
        fileId: appointment.beforePhotoFileId,
        ownerUserId: userId,
      });
      beforePhoto = result.signedUrl;
    } catch {
      beforePhoto = null;
    }
  } else if (appointment.beforePhoto) {
    beforePhoto = appointment.beforePhoto;
  }

  if (appointment.afterPhotoFileId) {
    try {
      const result = await createPrivateSignedUrlForFile({
        fileId: appointment.afterPhotoFileId,
        ownerUserId: userId,
      });
      afterPhoto = result.signedUrl;
    } catch {
      afterPhoto = null;
    }
  } else if (appointment.afterPhoto) {
    afterPhoto = appointment.afterPhoto;
  }

  return {
    beforePhoto,
    afterPhoto,
  };
};

export const create = async (userId, data, files) => {
  const patientId = await ensureOwnedPatient(userId, data.patientId);
  const treatmentDate = buildTreatmentDate(data.date, data.time);

  let createdAppointment = null;
  let uploadedBefore = null;
  let uploadedAfter = null;

  try {
    createdAppointment = await prisma.appointment.create({
      data: {
        userId,
        patientId,
        date: treatmentDate,
        time: String(data.time || "").trim(),
        treatment: data.treatment ? String(data.treatment).trim() : null,
        amount: data.amount !== undefined && data.amount !== null && data.amount !== ""
          ? parseFloat(data.amount)
          : null,
        notes: data.notes ? String(data.notes) : null,
        status: data.status ? String(data.status).trim() : null,
        method: data.method ? String(data.method).trim() : null,
        completed: String(data.status || "").toLowerCase() === "pagado",
        beforePhoto: null,
        afterPhoto: null,
      },
      select: {
        id: true,
      },
    });

    const beforeFile = getBeforePhotoFile(files);
    const afterFile = getAfterPhotoFile(files);

    if (beforeFile) {
      uploadedBefore = await uploadManagedFile({
        ownerUserId: userId,
        purpose: "APPOINTMENT_BEFORE_PHOTO",
        resourceType: "APPOINTMENT",
        resourceId: String(createdAppointment.id),
        file: beforeFile,
        metadata: {
          source: "appointments-create",
          side: "before",
        },
      });
    }

    if (afterFile) {
      uploadedAfter = await uploadManagedFile({
        ownerUserId: userId,
        purpose: "APPOINTMENT_AFTER_PHOTO",
        resourceType: "APPOINTMENT",
        resourceId: String(createdAppointment.id),
        file: afterFile,
        metadata: {
          source: "appointments-create",
          side: "after",
        },
      });
    }

    const updated = await prisma.appointment.update({
      where: { id: createdAppointment.id },
      data: {
        beforePhotoFileId: uploadedBefore?.id || null,
        afterPhotoFileId: uploadedAfter?.id || null,
      },
      select: APPOINTMENT_LIST_SELECT,
    });

    return updated;
  } catch (error) {
    if (uploadedBefore?.id) {
      await queueFileDeletion({
        fileId: uploadedBefore.id,
        ownerUserId: userId,
        reason: "appointment-create-rollback-before",
      }).catch(() => {});
    }

    if (uploadedAfter?.id) {
      await queueFileDeletion({
        fileId: uploadedAfter.id,
        ownerUserId: userId,
        reason: "appointment-create-rollback-after",
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

  const nextDate =
    data.date !== undefined && data.date !== null && data.date !== ""
      ? String(data.date)
      : new Date(existing.date).toISOString().slice(0, 10);

  const nextTime =
    data.time !== undefined && data.time !== null && data.time !== ""
      ? String(data.time)
      : existing.time;

  const treatmentDate = buildTreatmentDate(nextDate, nextTime);

  const beforeFile = getBeforePhotoFile(files);
  const afterFile = getAfterPhotoFile(files);

  let uploadedBefore = null;
  let uploadedAfter = null;

  try {
    if (beforeFile) {
      uploadedBefore = await uploadManagedFile({
        ownerUserId: userId,
        purpose: "APPOINTMENT_BEFORE_PHOTO",
        resourceType: "APPOINTMENT",
        resourceId: String(existing.id),
        file: beforeFile,
        metadata: {
          source: "appointments-update",
          side: "before",
        },
      });
    }

    if (afterFile) {
      uploadedAfter = await uploadManagedFile({
        ownerUserId: userId,
        purpose: "APPOINTMENT_AFTER_PHOTO",
        resourceType: "APPOINTMENT",
        resourceId: String(existing.id),
        file: afterFile,
        metadata: {
          source: "appointments-update",
          side: "after",
        },
      });
    }

    const updated = await prisma.appointment.update({
      where: { id: existing.id },
      data: {
        patientId,
        date: treatmentDate,
        time: nextTime,
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
          String(
            data.status !== undefined ? data.status : existing.status || ""
          ).toLowerCase() === "pagado",
        beforePhoto: null,
        afterPhoto: null,
        beforePhotoFileId: uploadedBefore?.id || existing.beforePhotoFileId || null,
        afterPhotoFileId: uploadedAfter?.id || existing.afterPhotoFileId || null,
      },
      select: APPOINTMENT_LIST_SELECT,
    });

    if (uploadedBefore?.id && existing.beforePhotoFileId) {
      await queueFileDeletion({
        fileId: existing.beforePhotoFileId,
        ownerUserId: userId,
        reason: "appointment-before-replaced",
      }).catch(() => {});
    }

    if (uploadedAfter?.id && existing.afterPhotoFileId) {
      await queueFileDeletion({
        fileId: existing.afterPhotoFileId,
        ownerUserId: userId,
        reason: "appointment-after-replaced",
      }).catch(() => {});
    }

    return updated;
  } catch (error) {
    if (uploadedBefore?.id) {
      await queueFileDeletion({
        fileId: uploadedBefore.id,
        ownerUserId: userId,
        reason: "appointment-update-rollback-before",
      }).catch(() => {});
    }

    if (uploadedAfter?.id) {
      await queueFileDeletion({
        fileId: uploadedAfter.id,
        ownerUserId: userId,
        reason: "appointment-update-rollback-after",
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

  await prisma.appointment.deleteMany({
    where: {
      id: existing.id,
      userId,
    },
  });

  if (existing.beforePhotoFileId) {
    await queueFileDeletion({
      fileId: existing.beforePhotoFileId,
      ownerUserId: userId,
      reason: "appointment-deleted-before",
    }).catch(() => {});
  }

  if (existing.afterPhotoFileId) {
    await queueFileDeletion({
      fileId: existing.afterPhotoFileId,
      ownerUserId: userId,
      reason: "appointment-deleted-after",
    }).catch(() => {});
  }

  return { count: 1 };
};

export const getCompletedCount = async (userId) => {
  return prisma.appointment.count({
    where: {
      userId,
      completed: true,
      status: "pagado",
    },
  });
};