import { authFetch } from "../core/authFetch.js";

export const getPatients = () => authFetch("/patients");

export const getPatientById = (id) => authFetch(`/patients/${id}`);

export const createPatient = (data) =>
  authFetch("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePatient = (id, data) =>
  authFetch(`/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePatient = (id) =>
  authFetch(`/patients/${id}`, {
    method: "DELETE",
  });
