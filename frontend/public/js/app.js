import { router } from "./router.js";
import { bootstrapSession, logoutSession } from "./core/session.js";

function renderBootScreen() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <section class="app-boot app-boot--silent" aria-hidden="true">
      <div class="app-boot-spinner"></div>
    </section>
  `;
}

function renderBootError(message) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <section class="app-boot">
      <div class="app-boot-card">
        <h2>No se pudo validar la sesión</h2>
        <p>${message}</p>
        <button id="retry-session-bootstrap">Reintentar</button>
      </div>
    </section>
  `;
}

async function startApp() {
  renderBootScreen();

  try {
    await bootstrapSession();
    router();
  } catch (error) {
    renderBootError(
      error?.message || "Error de red al intentar restaurar la sesión."
    );
  }
}

document.addEventListener("click", async (e) => {
  const retryBtn = e.target.closest("#retry-session-bootstrap");
  if (retryBtn) {
    e.preventDefault();
    startApp();
    return;
  }

  const link = e.target.closest("[data-link]");
  if (link) {
    e.preventDefault();
    history.pushState(null, "", link.getAttribute("href"));
    router();
    return;
  }

  const logoutBtn = e.target.closest("#logout");
  if (logoutBtn) {
    e.preventDefault();
    await logoutSession();
    history.pushState(null, "", "/login");
    router();
  }
});

window.addEventListener("popstate", router);
document.addEventListener("DOMContentLoaded", startApp);