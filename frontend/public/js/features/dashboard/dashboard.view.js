import { API_URL } from "../../core/config.js";
import { authFetch } from "../../core/authFetch.js";
import { initDrawer } from "../../components/drawer.js";
import {
  getCurrentUser,
  fetchMe,
  clearSession,
  redirectToLoginIfNeeded,
} from "../../core/session.js";
import { dashboardTemplate } from "./dashboard.templates.js";

// La vista ahora solo orquesta lógica. El markup vive en dashboard.templates.js.
export function Dashboard() {
  return dashboardTemplate();
}

export function initDashboard() {
  loadUserData();
  prefetchData();
  initDrawer();
}

async function prefetchData() {
  try {
    await Promise.all([
      authFetch(`${API_URL}/patients`).then(r => r.json()).catch(() => null),
      authFetch(`${API_URL}/appointments`).then(r => r.json()).catch(() => null),
      authFetch(`${API_URL}/simple`).then(r => r.json()).catch(() => null),
    ]);
  } catch (err) {
    console.warn("Prefetch falló:", err);
  }
}

async function loadUserData() {
  const userNameEl = document.getElementById("username");
  const drawerNameEl = document.getElementById("drawer-username");

  const applyName = (user) => {
    const name = user?.name || "Profesional";
    if (userNameEl) userNameEl.textContent = name;
    if (drawerNameEl) drawerNameEl.textContent = name;
  };

  // Fuente de verdad: la sesión. bootstrapSession/loginSession ya
  // trajeron el usuario; no se re-fetchea /auth/me en cada visita.
  const cached = getCurrentUser();
  if (cached) {
    applyName(cached);
    return;
  }

  // Fallback raro (guard pasado pero sin usuario en memoria).
  try {
    applyName(await fetchMe());
  } catch (error) {
    // Blip de red: fetchMe usa fetch crudo, así que la caída de red
    // llega como TypeError (sin .code), no como NETWORK_ERROR.
    // En ambos casos NO expulsamos: se mantiene el placeholder.
    if (error?.code === "NETWORK_ERROR" || !error?.code) {
      console.warn("No se pudo actualizar el usuario (¿red?):", error);
      return;
    }

    // Fallo real de autenticación: limpiar estado y salir por la
    // puerta oficial de session.js.
    clearSession();
    redirectToLoginIfNeeded();
  }
}
