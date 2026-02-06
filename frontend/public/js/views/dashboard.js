export function Dashboard() {
  return `
    <!-- Top bar mínima -->
    <div class="top-bar">
      <button id="open-menu" class="menu-btn">
        <i class="fa-solid fa-bars"></i>
      </button>
      <span class="app-title">TuGabinete</span>
    </div>

    <!-- Drawer izquierdo -->
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

    <!-- Overlay -->
    <div id="drawer-overlay" class="drawer-overlay"></div>

    <!-- Contenido principal -->

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
  `;
}

import { API_URL } from "../core/config.js";
import { authFetch } from "../core/authFetch.js";

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

  try {
    const res = await authFetch(`${API_URL}/auth/me`);
    const data = await res.json();

    const name = data.name || "Profesional";

    if (userNameEl) userNameEl.textContent = name;
    if (drawerNameEl) drawerNameEl.textContent = name;

  } catch {
    redirectToLogin();
  }
}


function redirectToLogin() {
  localStorage.removeItem("token");
  history.pushState(null, "", "/login");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function initDrawer() {
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawer-overlay");
  const openBtn = document.getElementById("open-menu");
  const closeBtn = document.getElementById("close-menu");

  openBtn.addEventListener("click", () => {
    drawer.classList.add("open");
    overlay.classList.add("show");
  });

  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  function closeDrawer() {
    drawer.classList.remove("open");
    overlay.classList.remove("show");
  }
}
