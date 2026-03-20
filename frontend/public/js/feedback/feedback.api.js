import { authFetch } from "../core/authFetch.js";

export function createFeedback(formData) {
  return authFetch("/feedback", {
    method: "POST",
    body: formData,
  });
}

export function listFeedback(params = {}) {
  const query = new URLSearchParams();

  if (params.sort) query.set("sort", params.sort);
  if (params.category && params.category !== "ALL") query.set("category", params.category);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return authFetch(`/feedback${suffix}`);
}

export function voteFeedback(id) {
  return authFetch(`/feedback/${id}/vote`, {
    method: "POST",
  });
}

export function unvoteFeedback(id) {
  return authFetch(`/feedback/${id}/vote`, {
    method: "DELETE",
  });
}