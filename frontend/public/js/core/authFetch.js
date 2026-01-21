// =======================================
// 🔐 AUTH FETCH — SPA
// Soporta JSON + FORM-DATA sin romper nada
// =======================================

import { API_URL } from "./config.js";

export async function authFetch(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    if (!token) {
        redirectToLogin();
        throw new Error("Token no encontrado");
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
    };

    // ✅ Solo setear JSON si NO es FormData y si no vino seteado ya
    const isFormData = options.body instanceof FormData;
    if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const url = endpoint.startsWith("http")
        ? endpoint
        : `${API_URL}${endpoint}`;

    const res = await fetch(url, {
        ...options,
        headers,
    });

  // 🔄 Token inválido/expirado
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        redirectToLogin();
        throw new Error("Token inválido / expirado");
    }

    return res;
}

function redirectToLogin() {
  //SPA route
    history.pushState(null, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
}