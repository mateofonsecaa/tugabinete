// simple.controller.js
import * as service from "./simple.service.js";

export const getAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await service.getAll(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, date, time, datetimeUTC } = req.body;

    // Validación completa
    if (!name || !date || !time || !datetimeUTC) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // ⏰ Convertir string ISO a Date real
    const utc = new Date(datetimeUTC);

    const newTurn = await service.create(userId, {
      name,
      date: utc, // 👈 acá guardamos el DateTime real
      time
    });

    res.status(201).json(newTurn);

  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    const { time, date, datetimeUTC } = req.body;

    if (!time || !date || !datetimeUTC) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const utc = new Date(datetimeUTC);

    const updated = await service.update(userId, id, {
      time,
      date: utc
    });

    if (!updated) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }

    res.json({ message: "Turno actualizado correctamente" });

  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await service.remove(userId, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
