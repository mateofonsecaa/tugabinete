// public/js/components/publicHeader.js

export function PublicHeader() {
  return `
    <header class="public-header" id="publicHeader">
      <a class="brand" href="/" data-link>MiGabinete</a>

      <nav class="public-nav">
        <a href="/" data-link>Inicio</a>
        <a href="/login" class="btn" data-link>Iniciar sesión</a>
        <a href="/register" class="btn" data-link>Registrarme</a>
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

  let lastY = window.scrollY;

  window.__publicHeaderScrollHandler = () => {
    const y = window.scrollY;
    if (y > lastY && y > 200) header.classList.add("hidden");
    else header.classList.remove("hidden");
    lastY = y;
  };

  window.addEventListener("scroll", window.__publicHeaderScrollHandler);
}
