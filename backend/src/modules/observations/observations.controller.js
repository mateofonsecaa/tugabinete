import * as service from "./observations.service.js";

/**
 * GET /observations/:patientId
 */
export const getByPatient = async (req, res, next) => {
    try {
        const patientId = Number(req.params.patientId);
        if (isNaN(patientId)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const observation = await service.getByPatient(patientId);

        if (!observation) {
            return res.status(404).json({});
        }

        res.json(observation);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /observations
 */
export const upsert = async (req, res, next) => {
    try {
        const patientId = Number(req.body.patientId);
        if (isNaN(patientId)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const data = { ...req.body };
        delete data.patientId;

        const observation = await service.upsert(patientId, data);

        res.json(observation);
    } catch (err) {
        next(err);
    }
};
