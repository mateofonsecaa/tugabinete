// /public/js/features/patients/patients.api.js
//
// Capa de API del dominio Pacientes. Contrato: datos-o-excepción
// (mismo patrón que treatments.api.js). Las funciones devuelven el
// JSON parseado si la respuesta es ok, o lanzan un Error con:
//   .message -> error del backend (data.error || data.message) o fallback
//   .status  -> HTTP status (para logging/diagnóstico)
//   .body    -> payload de error del backend, si lo hubo
//
// Ningún caller vuelve a ver un objeto Response ni repite el ritual
// res.ok / safeJson / throw.

import { authFetch } from "../../core/authFetch.js";

async function request(path, { fallbackError, ...options } = {}) {
  const res = await authFetch(path, options);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(
      data?.error || data?.message || fallbackError || "Error de conexión."
    );
    error.status = res.status;
    error.body = data;
    throw error;
  }

  return data;
}

/** Lista de pacientes (siempre array). */
export async function getPatients() {
  const data = await request("/patients", {
    fallbackError: "Error obteniendo pacientes",
  });
  return Array.isArray(data) ? data : [];
}

export const getPatientById = (id) =>
  request(`/patients/${id}`, {
    fallbackError: "No se pudo cargar el paciente",
  });

export const createPatient = (data) =>
  request("/patients", {
    method: "POST",
    body: JSON.stringify(data),
    fallbackError: "No se pudo guardar",
  });

export const updatePatient = (id, data) =>
  request(`/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    fallbackError: "No se pudo guardar",
  });

export const deletePatient = (id) =>
  request(`/patients/${id}`, {
    method: "DELETE",
    fallbackError: "No se pudo eliminar",
  });

export const savePatientHomeCare = (id, data) =>
  request(`/patients/${id}/homecare`, {
    method: "PUT",
    body: JSON.stringify(data),
    fallbackError: "No se pudo guardar la rutina.",
  });
