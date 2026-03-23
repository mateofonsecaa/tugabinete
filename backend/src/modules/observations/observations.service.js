import prisma from "../../config/prisma.js";

function createAppError(status, message, code = "OBSERVATION_ERROR") {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

async function ensureOwnedPatient(userId, patientId) {
  const normalizedPatientId = Number(patientId);

  if (!Number.isInteger(normalizedPatientId) || normalizedPatientId <= 0) {
    throw createAppError(400, "ID de paciente inválido.", "PATIENT_ID_INVALID");
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

export const getByPatient = async (userId, patientId) => {
  const ownedPatientId = await ensureOwnedPatient(userId, patientId);

  return prisma.observation.findUnique({
    where: { patientId: ownedPatientId },
  });
};

export const upsert = async (userId, patientId, data) => {
  const ownedPatientId = await ensureOwnedPatient(userId, patientId);

  const existing = await prisma.observation.findUnique({
    where: { patientId: ownedPatientId },
  });

  if (existing) {
    return prisma.observation.update({
      where: { patientId: ownedPatientId },
      data,
    });
  }

  return prisma.observation.create({
    data: {
      ...data,
      patient: { connect: { id: ownedPatientId } },
    },
  });
};