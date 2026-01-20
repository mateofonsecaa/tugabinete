import { authFetch } from "../core/authFetch.js";

export const getInterview = (patientId) =>
  authFetch(`/interviews/${patientId}`);

export const upsertInterview = (patientId, data) =>
  authFetch("/interviews", {
    method: "POST",
    body: JSON.stringify({ patientId, ...data }),
  });
