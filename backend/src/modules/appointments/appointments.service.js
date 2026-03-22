import prisma from "../../config/prisma.js";

/* ====================================================
   🚀 GET ALL (PAGINADO + COMPLETO PARA MODAL)
   ==================================================== */
export const getAll = async (userId, offset = 0, limit = 50) => {

    offset = Number(offset) || 0;
    limit  = Number(limit)  || 50;

    return await prisma.appointment.findMany({
        where: { userId },
        select: {
            id: true,
            date: true,
            time: true,
            treatment: true,
            amount: true,
            notes: true,              // 🔥 necesario para modal
            status: true,
            method: true,

            patient: {
                select: {
                    id: true,
                    fullName: true,
                    phone: true,       // 🔥 necesario para modal
                    address: true,     // 🔥 necesario para modal
                },
            },
        },
        orderBy: { date: "desc" },
        skip: offset,
        take: limit,
    });
};


/* ====================================================
   🚀 GET BY PATIENT (COMPLETO PARA MODAL)
   ==================================================== */
export const getByPatient = async (userId, patientId, offset = 0, limit = 50) => {

    offset = Number(offset) || 0;
    limit  = Number(limit)  || 50;

    return await prisma.appointment.findMany({
        where: { userId, patientId },
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
                    phone: true,
                    address: true,
                },
            },
        },
        orderBy: { date: "desc" },
        skip: offset,
        take: limit,
    });
};


/* ====================================================
   🚀 GET PHOTOS (Ultra liviano)
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
                    phone: true,
                    address: true,
                },
            },
        },
    });
};


/* ====================================================
   🚀 UPDATE
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
                    phone: true,
                    address: true,
                },
            },
        },
    });
};


/* ====================================================
   🚀 DELETE
   ==================================================== */
export const remove = async (userId, id) => {
    return await prisma.appointment.deleteMany({
        where: { id: Number(id), userId },
    });
};


/* ====================================================
   🚀 COUNT COMPLETED
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