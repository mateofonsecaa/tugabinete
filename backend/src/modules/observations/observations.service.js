import prisma from "../../core/prismaClient.js";

/**
 * Obtener observaciones de un paciente
 */
export const getByPatient = async (patientId) => {
    return await prisma.observation.findUnique({
        where: { patientId }
    });
};

/**
 * Crear o actualizar observaciones
 */
export const upsert = async (patientId, data) => {
    const existing = await prisma.observation.findUnique({
        where: { patientId }
    });

    if (existing) {
        return await prisma.observation.update({
            where: { patientId },
            data
        });
    }

    return await prisma.observation.create({
        data: {
            ...data,
            patient: { connect: { id: patientId } }
        }
    });
};
