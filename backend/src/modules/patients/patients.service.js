import * as repo from "./patients.repository.js";

export const getAll = async (userId) => {
    return repo.getAll(userId);
};

export const getById = async (userId, id) => {
    return repo.getById(userId, id);
};

export const create = async (userId, data) => {
    return repo.create(userId, data);
};

export const update = async (userId, id, data) => {
    return repo.update(userId, id, data);
};

export const remove = async (userId, id) => {
    return repo.remove(userId, id);
};
