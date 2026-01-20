import prisma from "../../core/prismaClient.js";

/* ====================================================
   🚀 GET ALL (PAGINADO + LIVIANO + MUY RÁPIDO)
   ==================================================== */
export const getAll = async (userId, offset = 0, limit = 50) => {

    // Convertir params a número seguro
    offset = Number(offset) || 0;
    limit = Number(limit) || 50;

    return await prisma.appointment.findMany({
        where: { userId },
        select: {
            id: true,
            date: true,
            time: true,
            treatment: true,
            amount: true,
            status: true,
            method: true,

            // Datos livianos del paciente (NO cargar todo)
            patient: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
        },
        orderBy: { date: "desc" },
        skip: offset,
        take: limit,
    });
};


/* ====================================================
   🚀 GET BY PATIENT (SIN FOTOS)
   ==================================================== */
export const getByPatient = async (userId, patientId, offset = 0, limit = 50) => {

    offset = Number(offset) || 0;
    limit  = Number(limit) || 50;

    return await prisma.appointment.findMany({
        where: { userId, patientId },
        select: {
            id: true,
            date: true,
            time: true,
            treatment: true,
            amount: true,
            status: true,
            method: true,
        },
        orderBy: { date: "desc" },
        skip: offset,
        take: limit,
    });
};


/* ====================================================
   🚀 GET PHOTOS (Solo fotos, liviano)
   ==================================================== */
export const getPhotos = async (id, userId) => {
    const result = await prisma.appointment.findFirst({
        where: { id, userId },
        select: {
            beforePhoto: true,
            afterPhoto: true,
        },
    });

    return result || { beforePhoto: null, afterPhoto: null };
};


/* ====================================================
   🚀 CREATE
   ==================================================== */
export const create = async (userId, data) => {
    const {
        patientId,
        date,
        time,
        treatment,
        amount,
        notes,
        status,
        method,
        beforePhoto,
        afterPhoto
    } = data;

    const treatmentDate = new Date(`${date}T${time}:00-03:00`);

    return await prisma.appointment.create({
    data: {
        userId,
        patientId: Number(patientId),
        date: treatmentDate,
        time,
        treatment,
        amount: amount ? parseFloat(amount) : null,
        notes,
        status,
        method,
        beforePhoto,
        afterPhoto,

        // 🌸 NUEVO: marcar como completado si está pagado
        completed: status?.toLowerCase() === "pagado"
    },

        select: {
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
                },
            },
        },
    });
};


/* ====================================================
   🚀 UPDATE (sin recargar fotos pesadas)
   ==================================================== */
export const update = async (id, data) => {
    const {
        treatment,
        date,
        time,
        amount,
        notes,
        status,
        method,
        beforePhoto,
        afterPhoto
    } = data;

    const treatmentDate = new Date(`${date}T${time}:00-03:00`);

    return await prisma.appointment.update({
        where: { id: Number(id) },
        data: {
        treatment,
        date: treatmentDate,
        time,
        amount: amount ? parseFloat(amount) : null,
        notes,
        status,
        method,
        beforePhoto: beforePhoto || null,
        afterPhoto: afterPhoto || null,

        // 🌸 NUEVO: marcar completed si el estado pasa a pagado
        completed: status?.toLowerCase() === "pagado"
    },

        select: {
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
                },
            },
        },
    });
};


/* ====================================================
    DELETE
   ==================================================== */
export const remove = async (userId, id) => {
    return await prisma.appointment.deleteMany({
        where: { id: Number(id), userId },
    });
};

/* ====================================================
   🚀 COUNT COMPLETED (ultra rápido y optimizado)
   ==================================================== */
export const getCompletedCount = async (userId) => {
    return await prisma.appointment.count({
        where: {
            userId,
            completed: true,
            status: "pagado"
        }
    });
};
