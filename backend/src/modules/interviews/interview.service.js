import prisma from "../../core/prismaClient.js";

export const getByPatient = async (userId, patientId) => {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true },
  });
  if (!patient) return null;

  return prisma.interview.findUnique({ where: { patientId } });
};

export const upsert = async (userId, patientId, data) => {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true },
  });
  if (!patient) throw new Error("Paciente no encontrado");

  if (Array.isArray(data.concerns)) data.concerns = data.concerns.join(", ");

  const exists = await prisma.interview.findUnique({ where: { patientId } });

  if (exists) {
    return prisma.interview.update({ where: { patientId }, data });
  }

  return prisma.interview.create({
    data: { ...data, patient: { connect: { id: patientId } } },
  });
};
