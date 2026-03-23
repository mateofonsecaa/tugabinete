import * as service from "./observations.service.js";

export const getByPatient = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const patientId = Number(req.params.patientId);

    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const observation = await service.getByPatient(userId, patientId);

    if (!observation) {
      return res.status(404).json({});
    }

    res.json(observation);
  } catch (err) {
    next(err);
  }
};

export const upsert = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const patientId = Number(req.body.patientId);

    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const data = { ...req.body };
    delete data.patientId;

    const observation = await service.upsert(userId, patientId, data);
    res.json(observation);
  } catch (err) {
    next(err);
  }
};