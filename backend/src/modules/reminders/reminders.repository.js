import prisma from "../../core/prismaClient.js";

export const countByUser = (userId) => {
    return prisma.reminder.count({
        where: { userId },
    });
};

export const listByUser = (userId) => {
    return prisma.reminder.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};

export const createForUser = (userId, text) => {
    return prisma.reminder.create({
        data: { text, userId },
    });
};

export const deleteByIdForUser = (id, userId) => {
    return prisma.reminder.deleteMany({
        where: { id, userId }, // 👈 esto asegura que solo borre si es del usuario
    });
};
