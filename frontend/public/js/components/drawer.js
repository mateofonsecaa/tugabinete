const FEEDBACK_PATH = "/feedback";

export function initDrawer() {
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawer-overlay");
  const openBtn = document.getElementById("open-menu");
  const closeBtn = document.getElementById("close-menu");

  if (!drawer || !openBtn) return;

  ensureFeedbackShortcut(drawer);
  syncCurrentLink(drawer);

  openBtn.addEventListener("click", () => {
    drawer.classList.add("open");
    overlay?.classList.add("show");
  });

  closeBtn?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);

  function closeDrawer() {
    drawer.classList.remove("open");
    overlay?.classList.remove("show");
  }
}

function ensureFeedbackShortcut(drawer) {
  if (drawer.querySelector(".drawer-feedback")) return;

  const nav = drawer.querySelector(".drawer-nav");
  if (!nav) return;

  const wrapper = document.createElement("div");
  wrapper.className = "drawer-feedback";
  wrapper.innerHTML = `
    <a href="${FEEDBACK_PATH}" data-link class="drawer-feedback-link">
      <i class="fa-solid fa-lightbulb"></i>
      <span>Ayudanos a mejorar</span>
    </a>
  `;

  drawer.appendChild(wrapper);
}

function syncCurrentLink(drawer) {
  const currentPath = window.location.pathname;
  const links = drawer.querySelectorAll(
    '.drawer-nav a[data-link], .drawer-feedback-link[data-link]'
  );

  links.forEach((link) => {
    const href = link.getAttribute("href");
    const isCurrent = href === currentPath;

    link.classList.toggle("is-current", isCurrent);

    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}