import { router } from "./router.js";

console.log("SPA iniciada");

document.addEventListener("click", (e) => {
  // 1) Navegación SPA (sirve aunque cliquees hijos dentro del <a>)
  const link = e.target.closest("[data-link]");
  if (link) {
    e.preventDefault();
    history.pushState(null, "", link.getAttribute("href"));
    router();
    return;
  }

  // 2) Logout (sirve aunque cliquees un hijo)
  const logoutBtn = e.target.closest("#logout");
  if (logoutBtn) {
    e.preventDefault();
    localStorage.removeItem("token");
    history.pushState(null, "", "/login");
    router();
  }
});

window.addEventListener("popstate", router);
document.addEventListener("DOMContentLoaded", router);
