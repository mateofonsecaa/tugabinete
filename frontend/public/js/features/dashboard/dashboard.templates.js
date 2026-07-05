// dashboard.templates.js
// -----------------------------------------------------------------------------
// Capa de PRESENTACIÓN del módulo Dashboard.
// Aquí vive únicamente el markup. La lógica (data-fetching, sesión, drawer)
// permanece en dashboard.view.js.
//
// REGLA DE ORO: los `id`, `data-*` y `name` NO se tocan: la capa lógica
// (drawer.js, router, session.js) depende de ellos. Solo se modernizan clases,
// jerarquía visual y atributos de accesibilidad (aria-*, role).
//
// NOTA de arquitectura: el top-bar es un <div> (NO <header>) a propósito.
// layout.css estiliza el selector de elemento `header` (height 75px,
// justify-content: space-between, header.hidden para ocultarlo al scrollear…),
// y no queremos que esas reglas se filtren al top-bar del shell.
// -----------------------------------------------------------------------------

/**
 * Ítems de navegación del drawer.
 * `id` solo se emite cuando existe (p. ej. logout), preservando el contrato lógico.
 * El shortcut de "feedback" NO se define acá: lo inyecta drawer.js en runtime.
 */
const NAV_ITEMS = [
  { href: "/dashboard",  icon: "fa-house",           label: "Dashboard",          link: true },
  { href: "/agenda",     icon: "fa-calendar-days",   label: "Agenda",             link: true },
  { href: "/patients",   icon: "fa-users",           label: "Pacientes",          link: true },
  { href: "/treatments", icon: "fa-spa",             label: "Tratamientos",       link: true },
  { href: "/profile",    icon: "fa-user",            label: "Perfil",             link: true },
  { href: "/ayuda",      icon: "fa-circle-question", label: "Guías y tutoriales", link: true },
  { href: "#", id: "logout", icon: "fa-right-from-bracket", label: "Cerrar sesión", link: false },
];

/**
 * Accesos directos del área principal.
 * `desc` es una línea de apoyo (aditiva) para que cada tarjeta se entienda de un vistazo.
 */
const ACTION_CARDS = [
  { href: "/patients",   icon: "fa-users",         title: "Mis Pacientes", desc: "Historial y fichas" },
  { href: "/agenda",     icon: "fa-calendar-days", title: "Agenda",        desc: "Turnos y recordatorios" },
  { href: "/treatments", icon: "fa-spa",           title: "Tratamientos",  desc: "Servicios y protocolos" },
  { href: "/profile",    icon: "fa-user",          title: "Mi Perfil",     desc: "Datos y preferencias" },
];

/** Barra superior con el botón de menú y la marca. (div, no header — ver nota arriba) */
function topBarTemplate() {
  return `
    <div class="top-bar">
      <button
        id="open-menu"
        class="menu-btn"
        type="button"
        aria-label="Abrir menú de navegación"
        aria-controls="drawer"
        aria-expanded="false"
      >
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>
      <span class="app-title">TuGabinete</span>
    </div>
  `;
}

/** Un enlace del drawer. Mantiene la estructura `.drawer-nav a[data-link]` que usa drawer.js. */
function drawerNavItem(item) {
  const idAttr = item.id ? ` id="${item.id}"` : "";
  const linkAttr = item.link ? " data-link" : "";
  return `
    <a href="${item.href}"${idAttr}${linkAttr}>
      <i class="fa-solid ${item.icon}" aria-hidden="true"></i>
      <span>${item.label}</span>
    </a>
  `;
}

/** Panel lateral de navegación (off-canvas). Estilos y estados (.open) en app-shell.css. */
function drawerTemplate() {
  return `
    <aside id="drawer" class="drawer" role="navigation" aria-label="Menú principal">
      <div class="drawer-header">
        <span id="drawer-username">Profesional</span>
        <button id="close-menu" class="close-btn" type="button" aria-label="Cerrar menú">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>

      <nav class="drawer-nav">
        ${NAV_ITEMS.map(drawerNavItem).join("")}
      </nav>
    </aside>

    <div id="drawer-overlay" class="drawer-overlay" aria-hidden="true"></div>
  `;
}

/** Una tarjeta de acceso rápido. */
function actionCard(card) {
  return `
    <a href="${card.href}" class="action-card" data-link>
      <span class="action-card__icon" aria-hidden="true">
        <i class="fa-solid ${card.icon}"></i>
      </span>
      <span class="action-card__title">${card.title}</span>
      <span class="action-card__desc">${card.desc}</span>
    </a>
  `;
}

/** Contenido principal: saludo + accesos directos. */
function mainTemplate() {
  return `
    <main class="dashboard-main">
      <section class="welcome" aria-labelledby="welcome-title">
        <h1 id="welcome-title" class="welcome__title">
          ¡Bienvenid@, <span id="username">Profesional</span>!
        </h1>
        <p class="welcome__subtitle">
          Este es tu panel. Accedé a tus pacientes, tu agenda y tus tratamientos desde un solo lugar.
        </p>

        <div class="dashboard-actions">
          ${ACTION_CARDS.map(actionCard).join("")}
        </div>
      </section>
    </main>
  `;
}

/**
 * Template completo del Dashboard.
 * Es lo que consume `Dashboard()` en dashboard.view.js.
 */
export function dashboardTemplate() {
  return `
    <div class="dashboard-page">
      ${topBarTemplate()}
      ${drawerTemplate()}
      ${mainTemplate()}
    </div>
  `;
}

// Export nombrado de las piezas por si se quieren reutilizar o testear por separado.
export { topBarTemplate, drawerTemplate, mainTemplate };
