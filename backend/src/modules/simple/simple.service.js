import prisma from "../../core/prismaClient.js";

/**
 * Convertir "hoy a las 00:00 LOCAL" → "hoy en UTC"
 * Esto mantiene la lógica real del usuario sin romper zonas horarias.
 */
function todayLocalToUTC() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Convertir la hora local a UTC (sumando offset)
  const utc = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return utc;
}

/**
 * Obtener todos los turnos simples (desde hoy)
 */
export const getAll = async (userId) => {
  const todayUTC = todayLocalToUTC();

  // Turnos SimpleAppointment
  const simple = await prisma.simpleAppointment.findMany({
    where: {
      userId,
      date: { gte: todayUTC }
    },
    orderBy: { date: "asc" }
  });

  // Turnos antiguos sin pacienteId (Appointment)
  const old = await prisma.appointment.findMany({
    where: {
      patientId: null,
      userId,
      date: { gte: todayUTC }
    },
    orderBy: { date: "asc" }
  });

  // Normalizar salida
  return [
    ...simple.map(t => ({
      id: t.id,
      name: t.name,
      date: t.date,
      time: t.time,
      type: "simple"
    })),
    ...old.map(t => ({
      id: t.id,
      name: t.treatment ?? "Sin nombre",
      date: t.date,
      time: t.time,
      type: "legacy"
    }))
  ];
};

/**
 * Crear turno simple
 */
export const create = (userId, data) => {
  return prisma.simpleAppointment.create({
    data: {
      name: data.name,
      date: data.date,  // datetime REAL en UTC
      time: data.time,
      userId
    }
  });
};

/**
 * Eliminar turno simple o antiguo
 */
export const remove = async (userId, id) => {
  await prisma.simpleAppointment.deleteMany({
    where: { id, userId }
  });

  await prisma.appointment.deleteMany({
    where: { id, userId, patientId: null }
  });

  return { message: "Turno eliminado correctamente" };
};

export const update = (userId, id, data) => {
  return prisma.simpleAppointment.updateMany({
    where: { id, userId },
    data: {
      time: data.time,
      date: data.date
    }
  });
};
