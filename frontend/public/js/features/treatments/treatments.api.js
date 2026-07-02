// /public/js/views/treatments.api.js
//
// Capa de API de la vista de tratamientos. Responsabilidad única:
// hablar con el backend (authFetch), parsear respuestas y normalizar
// errores. Acá NO hay DOM, ni Swal, ni estado de la vista.
//
// Protocolo de errores (preserva el comportamiento original de cada
// call site, que no era uniforme):
//  - fetch* de listados: lanzan Error con mensaje genérico si !ok.
//  - create*/update*: lanzan Error con `payload.error` del backend
//    (o fallback) si !ok; devuelven el objeto guardado si ok.
//  - delete*: lanzan Error con el texto del backend si !ok.
//  - fetchCurrentUser / fetchTreatmentPhotos: devuelven null si !ok
//    (los callers originales toleraban el fallo sin lanzar).
//
// NOTA sobre Content-Type: create/update de ventas y pacientes mandan
// JSON.stringify SIN header explícito, igual que el código original.
// Si authFetch no agrega Content-Type, el backend ya lo tolera hoy;
// no se cambia acá para no alterar comportamiento.

import { API_URL } from "../../core/config.js";
import { authFetch } from "../../core/authFetch.js";

// --- Sesión ---

export async function fetchCurrentUser() {
  const res = await authFetch(`${API_URL}/auth/me`);
  if (!res.ok) return null;
  return res.json();
}

// --- Pacientes ---

export async function fetchPatients() {
  const res = await authFetch(`${API_URL}/patients`);
  if (!res.ok) throw new Error("Error al obtener pacientes");

  const result = await res.json();
  return Array.isArray(result) ? result : (result.patients || []);
}

export async function createPatient(payload) {
  const res = await authFetch(`${API_URL}/patients`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const patient = await res.json().catch(() => null);
  if (!res.ok) throw new Error(patient?.error || "Error al registrar el paciente");
  return patient;
}

// --- Tratamientos (appointments) ---

export async function fetchTreatments({ offset = 0, limit = 50 } = {}) {
  const res = await authFetch(`${API_URL}/appointments?offset=${offset}&limit=${limit}`);
  if (!res.ok) throw new Error("Error al obtener tratamientos");

  const data = await res.json();
  return Array.isArray(data) ? data : (data.appointments || data.items || []);
}

export async function createTreatment(formData) {
  const res = await authFetch(`${API_URL}/appointments`, {
    method: "POST",
    body: formData,
  });

  const saved = await res.json().catch(() => null);
  if (!res.ok) throw new Error(saved?.error || "Error al registrar");
  return saved;
}

export async function updateTreatment(id, formData) {
  const res = await authFetch(`${API_URL}/appointments/${id}`, {
    method: "PUT",
    body: formData,
  });

  const saved = await res.json().catch(() => null);
  if (!res.ok) throw new Error(saved?.error || "No se pudo actualizar");
  return saved;
}

export async function deleteTreatment(id) {
  const res = await authFetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "No se pudo eliminar");
  }
}

/**
 * Devuelve el payload de fotos del tratamiento, o null si la respuesta
 * no fue ok (los dos callers —modal de edición y de vista— tratan el
 * fallo como "sin fotos", no como error).
 */
export async function fetchTreatmentPhotos(id) {
  const res = await authFetch(`${API_URL}/appointments/${id}/photos`);
  if (!res.ok) return null;
  return res.json();
}

// --- Ventas (sales) ---

export async function fetchSales({ offset = 0, limit = 50 } = {}) {
  const res = await authFetch(`${API_URL}/sales?offset=${offset}&limit=${limit}`);
  if (!res.ok) throw new Error("Error al obtener ventas");

  const data = await res.json();
  return Array.isArray(data) ? data : (data.sales || data.items || []);
}

export async function createSale(payload) {
  const res = await authFetch(`${API_URL}/sales`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const saved = await res.json().catch(() => null);
  if (!res.ok) throw new Error(saved?.error || "Error al registrar venta");
  return saved;
}

export async function updateSale(id, payload) {
  const res = await authFetch(`${API_URL}/sales/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  const saved = await res.json().catch(() => null);
  if (!res.ok) throw new Error(saved?.error || "No se pudo actualizar la venta");
  return saved;
}
