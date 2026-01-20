import * as service from "./appointments.service.js";

export const getAll = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { offset = 0, limit = 50 } = req.query;

        const appointments = await service.getAll(userId, offset, limit);
        res.json(appointments);

    } catch (err) {
        next(err);
    }
};

export const getByPatient = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const patientId = Number(req.params.id);
        const { offset = 0, limit = 50 } = req.query;

        const appointments = await service.getByPatient(
            userId,
            patientId,
            offset,
            limit
        );

        res.json(appointments);
    } catch (err) {
        next(err);
    }
};

export const getPhotos = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);

        const photos = await service.getPhotos(id, userId);
        res.json(photos);

    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const appointment = await service.create(userId, req.body);

        res.status(201).json(appointment);

    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const appointment = await service.update(id, req.body);

        res.json(appointment);

    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);

        const deleted = await service.remove(userId, id);

        if (deleted.count === 0) {
            return res.status(404).json({ error: "No encontrado o no autorizado" });
        }

        res.json({ message: "Turno eliminado correctamente" });

    } catch (err) {
        next(err);
    }
};

export const getCompletedCount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const count = await service.getCompletedCount(userId);

        res.json({ count });
    } catch (err) {
        next(err);
    }
};
