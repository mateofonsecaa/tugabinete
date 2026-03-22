import { API_URL } from "./config.js";
import {
  clearSession,
  getAccessToken,
  refreshSession,
} from "./session.js";

function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    history.pushState(null, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

async function executeRequest(url, options, token) {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
}

export async function authFetch(endpoint, options = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint}`;

  let token = getAccessToken();

  if (!token) {
    try {
      token = await refreshSession();
    } catch (error) {
      if (error.code !== "NETWORK_ERROR") {
        clearSession();
        redirectToLogin();
      }
      throw error;
    }
  }

  let res = await executeRequest(url, options, token);

  if (res.status !== 401 && res.status !== 403) {
    return res;
  }

  try {
    token = await refreshSession();
  } catch (error) {
    if (error.code !== "NETWORK_ERROR") {
      clearSession();
      redirectToLogin();
    }
    throw error;
  }

  res = await executeRequest(url, options, token);

  if (res.status === 401 || res.status === 403) {
    clearSession();
    redirectToLogin();
    throw new Error("Sesión no válida.");
  }

  return res;
}