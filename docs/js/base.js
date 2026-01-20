// ==========================================================
// base.js — authFetch profesional compatible con toda la app
// ==========================================================

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "../login/login.html";
    throw new Error("Token no encontrado");
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  // JSON automático si no es FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Llamada al backend
  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Sesión expirada o token inválido
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "../login/login.html";
    throw new Error("Sesión expirada");
  }

  // 🚨 Importante: devolvemos el Response, NO JSON
  return res;
}

// Guardado local del usuario
export function saveUserLocally(user) {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch {
    console.warn("No se pudo guardar el usuario localmente");
  }
}
