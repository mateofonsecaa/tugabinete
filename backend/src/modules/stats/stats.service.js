import prisma from "../../config/prisma.js";

/**
 * Obtiene las estadísticas principales del dashboard
 */
export const getStats = async (userId) => {
  // Fecha local
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Pacientes
  const totalPatients = await prisma.patient.count({
    where: { userId },
  });

  // Turnos totales
  const totalAppointments = await prisma.appointment.count({
    where: { userId },
  });

  // Turnos completados
  const completedAppointments = await prisma.appointment.count({
    where: {
      userId,
      completed: true,
    },
  });

  // Turnos futuros
  const upcomingAppointments1 = await prisma.appointment.count({
    where: {
      userId,
      date: { gte: today },
    },
  });

  const upcomingAppointments2 = await prisma.simpleAppointment.count({
    where: {
      userId,
      date: { gte: today },
    },
  });

  const upcomingAppointments = upcomingAppointments1 + upcomingAppointments2;

  // Ventas totales
  const totalSales = await prisma.sale.count({
    where: { userId },
  });

  return {
    totalPatients,
    totalAppointments,
    completedAppointments,
    upcomingAppointments,
    totalSales,
  };
};