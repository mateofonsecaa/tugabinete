import * as service from "./reminders.service.js";

export const list = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await service.list(userId);
        return res.json(data);
    } catch (e) {
        return res.status(400).json({ error: e.message || "Error" });
    }
};

export const create = async (req, res) => {
    try {
        const userId = req.user.id;
        const { text } = req.body;
        const created = await service.create(userId, text);
        return res.status(201).json(created);
    } catch (e) {
        return res.status(400).json({ error: e.message || "Error" });
    }
};

export const remove = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const out = await service.remove(userId, id);
        return res.json(out);
    } catch (e) {
        return res.status(404).json({ error: e.message || "Error" });
    }
};