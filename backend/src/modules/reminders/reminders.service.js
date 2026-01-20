import * as repo from "./reminders.repository.js";

export const list = async (userId) => {
  return repo.listByUser(userId);
};

export const create = async (userId, text) => {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("El recordatorio no puede estar vacío");
  if (clean.length > 100) throw new Error("Máximo 100 caracteres");

  // ✅ LIMITE: máximo 30 por usuario (AGREGAR ESTO)
  const count = await repo.countByUser(userId);
  if (count >= 30) throw new Error("Máximo 30 recordatorios");

  return repo.createForUser(userId, clean);
};

export const remove = async (userId, id) => {
  const result = await repo.deleteByIdForUser(Number(id), userId);
  if (result.count === 0) throw new Error("No encontrado");
  return { ok: true };
};
