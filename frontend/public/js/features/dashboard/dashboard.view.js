import { API_URL } from "../../core/config.js";
import { authFetch } from "../../core/authFetch.js";
import { initDrawer } from "../../components/drawer.js";
import {
  getCurrentUser,
  fetchMe,
  clearSession,
  redirectToLoginIfNeeded,
} from "../../core/session.js";

export function Dashboard() {
  return `
    <div class="dashboard-page">
      <div class="top-bar">
        <button id="open-menu" class="menu-btn">
          <i class="fa-solid fa-bars"></i>
        </button>
        <span class="app-title">TuGabinete</span>
      </div>

      <aside id="drawer" class="drawer">
        <div class="drawer-header">
          <span id="drawer-username">Profesional</span>
          <button id="close-menu" class="close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav class="drawer-nav">
          <a href="/dashboard" data-link><i class="fa-solid fa-house"></i> Dashboard</a>
          <a href="/agenda" data-link><i class="fa-solid fa-calendar-days"></i> Agenda</a>
          <a href="/patients" data-link><i class="fa-solid fa-users"></i> Pacientes</a>
          <a href="/treatments" data-link><i class="fa-solid fa-spa"></i> Tratamientos</a>
          <a href="/profile" data-link><i class="fa-solid fa-user"></i> Perfil</a>
          <a href="/ayuda" data-link><i class="fa-solid fa-circle-question"></i> Guías y tutoriales</a>
          <a href="#" id="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
        </nav>
      </aside>

      <div id="drawer-overlay" class="drawer-overlay"></div>

      <main>
        <div class="welcome">
          <h1>¡Bienvenid@, <span id="username">Profesional</span>!</h1>

          <div class="dashboard-actions">
            <a href="/patients" class="action-card" data-link>
              <i class="fa-solid fa-users"></i>
              <span>Mis Pacientes</span>
            </a>

            <a href="/agenda" class="action-card" data-link>
              <i class="fa-solid fa-calendar-days"></i>
              <span>Agenda</span>
            </a>

            <a href="/treatments" class="action-card" data-link>
              <i class="fa-solid fa-spa"></i>
              <span>Tratamientos</span>
            </a>

            <a href="/profile" class="action-card" data-link>
              <i class="fa-solid fa-user"></i>
              <span>Mi Perfil</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  `;
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