// views/profile.js
import { API_URL } from "../core/config.js";
import { authFetch } from "../core/authFetch.js";
import { initDrawer } from "../components/drawer.js";

export function Profile() {
  return `
    <div class="profile-page">

      <!-- Top bar (MISMO que Agenda) -->
      <div class="top-bar">
        <button id="open-menu" class="menu-btn">
          <i class="fa-solid fa-bars"></i>
        </button>
        <span class="app-title">TuGabinete</span>
      </div>

      <!-- Drawer (MISMO que Agenda) -->
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
          <a href="#" id="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
        </nav>
      </aside>

      <div id="drawer-overlay" class="drawer-overlay"></div>

      <!-- CONTENIDO PERFIL -->
      <main class="profile-main">
        <div class="profile-container">

          <div class="profile-grid">

            <!-- IZQUIERDA -->
            <section class="profile-col profile-left">

              <div class="profile-card profile-header-card">
                <div class="profile-header">
                  <img src="" alt="Foto de perfil" class="profile-pic">

                  <div class="profile-info">
                    <h2 id="userName">—</h2>
                    <p class="subtitle" id="professionLabel">—</p>

                    <div class="profile-contact">
                      <p><i class="fa-solid fa-envelope"></i><span id="userEmail">—</span></p>
                      <p><i class="fa-solid fa-phone"></i><span id="userPhone">—</span></p>
                    </div>
                  </div>

                  <button class="btn-edit" id="editProfileBtn">
                    <i class="fa-solid fa-pen"></i> Editar perfil
                  </button>
                </div>
              </div>

              <div class="profile-card profile-stats-card">
                <!-- IMPORTANTE: mantener .stat + span (orden) para loadStats() -->
                <section class="stats">
                  <div class="stat">
                    <div class="stat-top">
                      <i class="fa-solid fa-spa"></i>
                      <span>0</span>
                    </div>
                    <small>Tratamientos realizados</small>
                  </div>

                  <div class="stat clickable" data-go="/patients">
                    <div class="stat-top">
                      <i class="fa-solid fa-user-check"></i>
                      <span>0</span>
                    </div>
                    <small>Pacientes activos</small>
                  </div>

                  <div class="stat clickable" data-go="/agenda">
                    <div class="stat-top">
                      <i class="fa-solid fa-calendar-check"></i>
                      <span>0</span>
                    </div>
                    <small>Turnos próximos</small>
                  </div>
                </section>
              </div>

            </section>

            <!-- DERECHA -->
            <section class="profile-col profile-right">
              <div class="profile-card turnos">
                <h3>Próximos turnos</h3>
                <p class="muted">Cargando...</p>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  `;
}

export function initProfile() {

  initDrawer();

  // 1) Render instantáneo con cache (si existe)
  const cachedUser = getCachedUser();
  if (cachedUser) renderUser(cachedUser);

  // 2) Traer datos reales
  fetchUserFromServer().then((freshUser) => {
    if (freshUser) renderUser(freshUser);
  });

  // 3) Cargar datos secundarios
  loadStats();
  loadAppointments();

  // 4) Bind navegación SPA (evita window.location.href)
  bindNav();

  // 5) Bind editar perfil (ruta futura)
  const editBtn = document.getElementById("editProfileBtn");
  if (editBtn && !editBtn.dataset.bound) {
    editBtn.dataset.bound = "1";
    editBtn.addEventListener("click", () => {
      // cuando migres el edit: /profile/edit
      history.pushState(null, "", "/profile/edit");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  }
}

// =====================================================
// 🧠 Manejo local de usuario
// =====================================================

function saveUserLocally(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

function getCachedUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

// =====================================================
// 👤 Obtener usuario desde backend
// =====================================================

async function fetchUserFromServer() {
  try {
    const res = await authFetch(`${API_URL}/auth/me`);
    const user = await res.json();
    if (!res.ok) throw new Error(user.error || "Error al obtener usuario");
    saveUserLocally(user);
    return user;
  } catch (err) {
    console.warn("No se pudo obtener usuario desde backend", err);
    return null;
  }
}

// =====================================================
// 🖼️ Render de datos
// =====================================================

function renderUser(user) {
  const $ = (id) => document.getElementById(id);

  const du = document.getElementById("drawer-username");
  if (du) du.textContent = user.name || "Profesional";
  if ($("userName")) $("userName").textContent = user.name || "Sin nombre";
  if ($("professionLabel")) $("professionLabel").textContent = user.profession || "Sin profesión";
  if ($("userEmail")) $("userEmail").textContent = user.email || "Sin correo";
  if ($("userPhone")) $("userPhone").textContent = user.phone || "—";

  const img = document.querySelector(".profile-pic");
  if (img) {
    img.loading = "lazy";
    img.src = user.profileImage || "../../images/personaejemplo.png";
  }
}

// =====================================================
// 📊 Estadísticas
// =====================================================

async function loadStats() {
  try {
    const res = await authFetch(`${API_URL}/stats`);
    if (!res.ok) return;

    const stats = await res.json();
    const spans = document.querySelectorAll(".stat span");

    // 0: Tratamientos realizados (en tu backend hoy es totalAppointments)
    if (spans[0]) spans[0].textContent = stats.totalAppointments ?? "0";

    // 1: Pacientes activos
    if (spans[1]) spans[1].textContent = stats.totalPatients ?? "0";

    // 2: Turnos próximos
    if (spans[2]) spans[2].textContent = stats.upcomingAppointments ?? "0";
  } catch {
    console.warn("Error cargando stats");
  }
}

// =====================================================
// 📅 Próximos turnos
// =====================================================

async function loadAppointments() {
  try {
    const res = await authFetch(`${API_URL}/simple`);
    if (!res.ok) return;

    const data = await res.json();
    const now = Date.now();

    const upcoming = data
      .filter(a => new Date(a.date).getTime() >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    const container = document.querySelector(".turnos");
    if (!container) return;

    container.innerHTML = `<h3>Próximos turnos</h3>`;

    if (!upcoming.length) {
      container.innerHTML += `<p class="muted">No hay turnos próximos registrados.</p>`;
      return;
    }

    let html = `<div class="turnos-list">`;

    upcoming.forEach(a => {
      const d = new Date(a.date);
      const fecha = d.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const hora = a.time || d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

      html += `
        <div class="turno-card clickable" data-go="/agenda">
          <div class="turno-main">
            <div class="turno-name">${a.name || "-"}</div>
            <div class="turno-meta">
              <span class="turno-time">${hora}</span>
              <span class="turno-dot">•</span>
              <span class="turno-date">${fecha}</span>
            </div>
          </div>
          <div class="turno-icon" aria-hidden="true">
            <i class="fa-regular fa-calendar"></i>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML += html;
    bindNav();

  } catch (err) {
    console.error("Error turnos:", err);
  }
}

// =====================================================
// 🧭 Helpers de navegación SPA
// =====================================================

function bindNav() {
  document.querySelectorAll("[data-go]").forEach(el => {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.addEventListener("click", () => {
      history.pushState(null, "", el.dataset.go);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  });
}

// =====================================================
// 🔐 Logout (si el botón existe en layout global)
// =====================================================

function loadSweetAlert() {
  if (!window.Swal) {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    document.head.appendChild(s);
  }
}