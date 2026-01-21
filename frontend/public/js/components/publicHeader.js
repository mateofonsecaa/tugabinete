// public/js/components/publicHeader.js

export function PublicHeader() {
  return `
    <header class="public-header" id="publicHeader">
      <div class="logo">TuGabinete</div>
      <nav>
        <a href="/" data-link>Inicio</a>
        <a href="/about" data-link>Sobre Nosotros</a>
        <a href="/contact" data-link>Contacto</a>
        <a href="/plans" data-link class="btn-plans">Planes</a>
        <a href="/login" data-link class="btn-login">Iniciar sesión</a>
        <a href="/register" data-link class="btn-register">Registrarme</a>
      </nav>
    </header>
  `;
}

export function initPublicHeader() {
  const header = document.getElementById("publicHeader");
  if (!header) return;

  // 🔥 Evitar listeners duplicados en SPA
  if (window.__publicHeaderScrollHandler) {
    window.removeEventListener("scroll", window.__publicHeaderScrollHandler);
  }

  setTimeout(() => header.classList.add("visible"), 200);

  let lastScrollY = window.scrollY;
  const hideThreshold = 615;

  window.__publicHeaderScrollHandler = () => {
    if (window.scrollY > lastScrollY && window.scrollY > hideThreshold) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
    lastScrollY = window.scrollY;
  };

  window.addEventListener("scroll", window.__publicHeaderScrollHandler);
}
