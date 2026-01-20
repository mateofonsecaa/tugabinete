import { router } from "./router.js";

console.log("SPA iniciada");

document.addEventListener("click", (e) => {
  if (e.target.matches("[data-link]")) {
    e.preventDefault();
    history.pushState(null, "", e.target.href);
    router();
  }

  if (e.target.id === "logout") {
    localStorage.removeItem("token");
    history.pushState(null, "", "/login");
    router();
  }
});

window.addEventListener("popstate", router);
document.addEventListener("DOMContentLoaded", router);
