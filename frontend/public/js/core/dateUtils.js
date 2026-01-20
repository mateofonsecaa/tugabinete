// ===============================================================
// 🌐 dateUtils.js — Manejo perfecto de fechas Local ↔ UTC
// ===============================================================

// ✔ Convierte una fecha+hora local (del navegador) a un ISO UTC real
export function combineToUTC(dateStr, timeStr) {
  const local = new Date(`${dateStr}T${timeStr}:00`);
  return local.toISOString(); // Esto es UTC absoluto
}

// ✔ Convierte un datetime UTC guardado en la BD a fecha local YYYY-MM-DD
export function utcToLocalDate(utcString) {
  const d = new Date(utcString);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

// ✔ Convierte un datetime UTC guardado en la BD a hora local HH:mm
export function utcToLocalTime(utcString) {
  const d = new Date(utcString);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[1].slice(0, 5);
}

// ✔ Convierte UTC → objeto local completo
export function utcToLocal(utcString) {
  const d = new Date(utcString);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
}

export function toLocalDateString(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}