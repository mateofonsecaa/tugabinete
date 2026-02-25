import prisma from "../../core/prismaClient.js";

function toISODateOnly(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const createSale = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const {
      patientId,
      product,
      date,
      quantity,
      amount,
      status,
      method,
      notes,
    } = req.body;

    // ✅ product requerido
    if (!product || String(product).trim().length < 1) {
      return res.status(400).json({ error: "El producto es obligatorio" });
    }

    // ✅ patientId requerido y numérico
    const pid = Number(patientId);
    if (!pid || Number.isNaN(pid)) {
      return res.status(400).json({ error: "patientId inválido" });
    }

    // ✅ cantidad >= 1
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: "La cantidad debe ser mayor o igual a 1" });
    }

    // ✅ monto total numérico >= 0
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) {
      return res.status(400).json({ error: "El monto debe ser un número mayor o igual a 0" });
    }

    // ✅ notas <= 300
    if (notes && String(notes).length > 300) {
      return res.status(400).json({ error: "Las notas no pueden superar 300 caracteres" });
    }

    // ✅ fecha: hoy o anterior (no futuro)
    if (!date) {
      return res.status(400).json({ error: "La fecha es obligatoria" });
    }

    const inputISO = String(date).slice(0, 10); // "YYYY-MM-DD"
    const todayISO = toISODateOnly(new Date());

    if (inputISO > todayISO) {
      return res.status(400).json({ error: "La fecha no puede ser futura" });
    }

    // Validación de existencia/propiedad del paciente (muy importante)
    const patient = await prisma.patient.findFirst({
      where: { id: pid, userId },
      select: { id: true },
    });

    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const created = await prisma.sale.create({
      data: {
        userId,
        patientId: pid,
        product: String(product).trim(),
        date: new Date(inputISO), // guardamos solo fecha
        quantity: qty,
        amount: amt,
        status: String(status || "").trim(),
        method: String(method || "").trim(),
        notes: notes ? String(notes) : null,
      },
      include: {
        patient: { select: { id: true, fullName: true } },
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("❌ createSale:", err);
    return res.status(500).json({ error: "Error interno" });
  }
};

export const listSales = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const offset = Number(req.query.offset ?? 0);
    const limit = Number(req.query.limit ?? 50);

    const sales = await prisma.sale.findMany({
      where: { userId },
      skip: Number.isNaN(offset) ? 0 : offset,
      take: Number.isNaN(limit) ? 50 : limit,
      orderBy: { date: "desc" },
      include: {
        patient: { select: { id: true, fullName: true } },
      },
    });

    return res.json(sales);
  } catch (err) {
    console.error("❌ listSales:", err);
    return res.status(500).json({ error: "Error al obtener ventas" });
  }
};
