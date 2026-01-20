import prisma from "../../config/prisma.js";

export const getAll = async (userId) => {
  const patients = await prisma.patient.findMany({
    where: { userId },
    orderBy: { id: "desc" },
    include: {
      appointments: {
        orderBy: { date: "desc" },
        take: 1
      }
    }
  });

  // ⭐ Transformar appointments en lastTreatment
  return patients.map(p => ({
    ...p,
    lastTreatment: p.appointments[0]?.treatment || null,
  }));
};

export const getById = (userId, id) => {
    return prisma.patient.findFirst({
        where: { id, userId },
        include: {
        appointments: { orderBy: { date: "desc" } },
        interview: true,
        observation: true
        }
    });
};

export const create = (userId, data) => {
    const birth = new Date(data.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    return prisma.patient.create({
        data: {
        fullName: data.fullName,
        birthDate: birth,
        age,
        address: data.address,
        phone: data.phone,
        profession: data.profession,
        userId
        }
    });
};

export const update = (userId, id, data) => {
    const birth = new Date(data.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    return prisma.patient.updateMany({
        where: { id, userId },
        data: {
        fullName: data.fullName,
        birthDate: birth,
        age,
        address: data.address,
        phone: data.phone,
        profession: data.profession
        }
    });
};

export const remove = async (userId, id) => {
  // eliminar relaciones
    await prisma.appointment.deleteMany({ where: { patientId: id } });
    await prisma.interview.deleteMany({ where: { patientId: id } });
    await prisma.observation.deleteMany({ where: { patientId: id } });

    return prisma.patient.deleteMany({ where: { id, userId } });
};
