import prisma from "../../config/prisma.js";

function cleanString(value) {
  const str = String(value ?? "").trim();
  return str ? str : null;
}

function parseOptionalDate(value, fieldName = "fecha") {
  if (value === null || value === undefined || value === "") return null;

  const raw = String(value).trim();
  const d = new Date(raw);

  if (Number.isNaN(d.getTime())) {
    throw new Error(`${fieldName} inválida en rutina domiciliaria`);
  }

  const min = new Date("2000-01-01T00:00:00.000Z");
  const max = new Date("2100-12-31T23:59:59.999Z");

  if (d < min || d > max) {
    throw new Error(`${fieldName} fuera de rango. Debe estar entre 2000-01-01 y 2100-12-31.`);
  }

  return d;
}

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

  // Transformar appointments en lastTreatment
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
      observation: true,
      homeCarePlan: {
        include: {
          items: {
            orderBy: { stepOrder: "asc" }
          }
        }
      }
    }
  });
};

export const saveHomeCare = async (userId, patientId, data) => {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true }
  });

  if (!patient) {
    throw new Error("Paciente no encontrado");
  }

  const title = cleanString(data?.title);
  const objective = cleanString(data?.objective);
  const status = cleanString(data?.status) || "Activa";
  const generalNotes = cleanString(data?.generalNotes);
  const startDate = parseOptionalDate(data?.startDate, "La fecha de inicio");
  const endDate = parseOptionalDate(data?.endDate, "La fecha de fin");

  if (startDate && endDate && endDate < startDate) {
    throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio");
  }

  if (!title) {
    throw new Error("El nombre de la rutina es obligatorio");
  }

  const rawItems = Array.isArray(data?.items) ? data.items : [];

  const items = rawItems
    .map((item, index) => {
      const action = cleanString(item?.action);
      if (!action) return null;

      const stepOrder = Number(item?.stepOrder);
      return {
        stepOrder: Number.isInteger(stepOrder) && stepOrder > 0 ? stepOrder : index + 1,
        moment: cleanString(item?.moment),
        action,
        product: cleanString(item?.product),
        frequency: cleanString(item?.frequency),
        instructions: cleanString(item?.instructions),
        duration: cleanString(item?.duration),
        notes: cleanString(item?.notes),
      };
    })
    .filter(Boolean);

  return prisma.$transaction(async (tx) => {
    const plan = await tx.homeCarePlan.upsert({
      where: { patientId },
      update: {
        title,
        objective,
        startDate,
        endDate,
        status,
        generalNotes,
      },
      create: {
        patientId,
        title,
        objective,
        startDate,
        endDate,
        status,
        generalNotes,
      }
    });

    await tx.homeCarePlanItem.deleteMany({
      where: { planId: plan.id }
    });

    if (items.length) {
    await tx.homeCarePlanItem.createMany({
      data: items.map((item) => ({
        planId: plan.id,
        stepOrder: item.stepOrder,
        moment: item.moment,
        action: item.action,
        product: item.product,
        frequency: item.frequency,
        instructions: item.instructions,
        duration: item.duration,
        notes: item.notes,
      }))
    });
  }

    return tx.homeCarePlan.findUnique({
      where: { id: plan.id },
      include: {
        items: {
          orderBy: { stepOrder: "asc" }
        }
      }
    });
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
