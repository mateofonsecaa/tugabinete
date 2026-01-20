import * as service from "./interview.service.js";

export const getByPatient = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const patientId = Number(req.params.patientId);
    if (isNaN(patientId)) return res.status(400).json({ error: "patientId inválido" });

    const interview = await service.getByPatient(userId, patientId);
    if (!interview) return res.status(404).json({ message: "Entrevista no encontrada" });

    res.json(interview);
  } catch (err) {
    next(err);
  }
};

export const upsert = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const patientId = Number(req.body.patientId);
    if (isNaN(patientId)) return res.status(400).json({ error: "patientId inválido" });

    const data = { ...req.body };
    delete data.patientId;

    const interview = await service.upsert(userId, patientId, data);
    res.json(interview);
  } catch (err) {
    next(err);
  }
};
