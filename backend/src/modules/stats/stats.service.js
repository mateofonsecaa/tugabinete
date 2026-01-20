import prisma from "../../core/prismaClient.js";

/**
 * Obtiene las estadísticas principales del dashboard
 */
export const getStats = async (userId) => {
    // 💡 Fecha local (Argentina)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 👥 Total de pacientes
    const totalPatients = await prisma.patient.count({
        where: { userId }
    });

    // 💆 Total de turnos
    const totalAppointments = await prisma.appointment.count({
        where: { userId }
    });

    // ✔ Turnos completados
    const completedAppointments = await prisma.appointment.count({
        where: {
            userId,
            completed: true
        }
    });

    // 🔮 Turnos futuros (appointments)
    const upcomingAppointments1 = await prisma.appointment.count({
        where: {
            userId,
            date: { gte: today }
        }
    });

    // 🔮 Turnos futuros (simple)
    const upcomingAppointments2 = await prisma.simpleAppointment.count({
        where: {
            userId,
            date: { gte: today }
        }
    });

    const upcomingAppointments = upcomingAppointments1 + upcomingAppointments2;

    return {
        totalPatients,
        totalAppointments,
        completedAppointments,
        upcomingAppointments
    };
};
