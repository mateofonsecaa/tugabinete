// views/layout.js

export function Layout(content, { active = "" } = {}) {
  return `
    <div class="app-layout">
      <header class="app-header">
        <a class="logo" href="/dashboard" data-go="/dashboard">TuGabinete</a>

        <button class="drawer-toggle" id="drawerToggle" aria-label="Abrir menú">
          <i class="fa-solid fa-bars"></i>
        </button>

        <nav class="nav-icons">
          <a href="/dashboard" data-go="/dashboard" data-tooltip="Inicio" class="${active === "dashboard" ? "active" : ""}">
            <i class="fa-solid fa-house"></i>
          </a>
          <a href="/agenda" data-go="/agenda" data-tooltip="Agenda" class="${active === "agenda" ? "active" : ""}">
            <i class="fa-solid fa-calendar-days"></i>
          </a>
          <a href="/patients" data-go="/patients" data-tooltip="Pacientes" class="${active === "patients" ? "active" : ""}">
            <i class="fa-solid fa-users"></i>
          </a>
          <a href="/profile" data-go="/profile" data-tooltip="Mi perfil" class="${active === "profile" ? "active" : ""}">
            <i class="fa-solid fa-user"></i>
          </a>
          <a href="#" id="logout" data-tooltip="Cerrar sesión">
            <i class="fa-solid fa-right-from-bracket"></i>
          </a>
        </nav>
      </header>

      <div class="drawer-overlay" id="drawerOverlay"></div>

      <aside class="drawer" id="drawer">
        <div class="drawer-header">
          <span class="drawer-title">TuGabinete</span>
          <button class="drawer-close" id="drawerClose" aria-label="Cerrar menú">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav class="drawer-nav">
          <a href="/dashboard" data-go="/dashboard" class="${active === "dashboard" ? "active" : ""}">
            <i class="fa-solid fa-house"></i><span>Inicio</span>
          </a>
          <a href="/agenda" data-go="/agenda" class="${active === "agenda" ? "active" : ""}">
            <i class="fa-solid fa-calendar-days"></i><span>Agenda</span>
          </a>
          <a href="/patients" data-go="/patients" class="${active === "patients" ? "active" : ""}">
            <i class="fa-solid fa-users"></i><span>Pacientes</span>
          </a>
          <a href="/profile" data-go="/profile" class="${active === "profile" ? "active" : ""}">
            <i class="fa-solid fa-user"></i><span>Mi perfil</span>
          </a>
          <a href="#" id="drawerLogout">
            <i class="fa-solid fa-right-from-bracket"></i><span>Cerrar sesión</span>
          </a>
        </nav>
      </aside>

      <div class="app-content">
        ${content}
      </div>
    </div>
  `;
}

export function initLayout() {
  bindSpaLinks();
  bindDrawer();
  bindLogout();
}

function bindSpaLinks() {
  document.querySelectorAll("[data-go]").forEach((a) => {
    if (a.dataset.bound) return;
    a.dataset.bound = "1";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const to = a.getAttribute("data-go");
      history.pushState(null, "", to);
      window.dispatchEvent(new PopStateEvent("popstate"));
      closeDrawer();
    });
  });
}

function bindDrawer() {
  const toggle = document.getElementById("drawerToggle");
  const close = document.getElementById("drawerClose");
  const overlay = document.getElementById("drawerOverlay");

  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", openDrawer);
  }
  if (close && !close.dataset.bound) {
    close.dataset.bound = "1";
    close.addEventListener("click", closeDrawer);
  }
  if (overlay && !overlay.dataset.bound) {
    overlay.dataset.bound = "1";
    overlay.addEventListener("click", closeDrawer);
  }
}

function openDrawer() {
  document.getElementById("drawer")?.classList.add("open");
  document.getElementById("drawerOverlay")?.classList.add("open");
}

function closeDrawer() {
  document.getElementById("drawer")?.classList.remove("open");
  document.getElementById("drawerOverlay")?.classList.remove("open");
}

function bindLogout() {
  const logoutBtns = [document.getElementById("logout"), document.getElementById("drawerLogout")].filter(Boolean);

  logoutBtns.forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const ok = await confirmLogout();
      if (!ok) return;

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      history.pushState(null, "", "/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  });
}

async function confirmLogout() {
  if (window.Swal) {
    const r = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Vas a salir de tu cuenta.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ffadad",
      cancelButtonColor: "#ccc",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
      background: "#fffdf9",
    });
    return r.isConfirmed;
  }
  return window.confirm("¿Cerrar sesión?");
}
