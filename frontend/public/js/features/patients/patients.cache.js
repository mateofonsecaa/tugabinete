// /public/js/features/patients/patients.cache.js
//
// Cache de la lista de pacientes en localStorage (stale-while-revalidate):
// la lista renderiza al instante desde el cache y se reconcilia con el
// servidor en segundo plano. Este modulo es el UNICO que conoce la clave
// de storage y la forma compacta persistida.
//
// Invalidacion: create y edit llaman invalidatePatientsCache() al mutar
// un paciente, para que la proxima visita a la lista no muestre datos viejos.

const STORAGE_KEY = "patients";

/**
 * Forma compacta persistida/comparada. Si agregas un campo aca, el
 * primer render post-deploy detectara diferencia y refrescara el cache.
 */
export function compactPatients(list) {
  return list.map(p => ({
    id: p.id,
    fullName: p.fullName,
    phone: p.phone,
    age: p.age,
    lastTreatment: p.lastTreatment
  }));
}

/** Lista cacheada (array) o null si no hay/esta corrupta. Best-effort. */
export function readPatientsCache() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

/** Persiste la lista en forma compacta. Best-effort (quota, private mode). */
export function writePatientsCache(patients) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compactPatients(patients)));
  } catch {}
}

/** Borra el cache. Best-effort, coherente con read/write. */
export function invalidatePatientsCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
