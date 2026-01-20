import * as service from "./patients.service.js";

export const getAll = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const patients = await service.getAll(userId);
        res.json(patients);
    } catch (err) {
        next(err);
    }
};

export const getById = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);
        const patient = await service.getById(userId, id);
        res.json(patient);
    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const patient = await service.create(userId, req.body);
        res.status(201).json(patient);
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);
        const updated = await service.update(userId, id, req.body);
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);
        const deleted = await service.remove(userId, id);
        res.json(deleted);
    } catch (err) {
        next(err);
    }
};
