// frontend/views/help.page.js
import { initDrawer } from "../components/drawer.js";

/**
 * Tutoriales:
 * - MP4 local: "/videos/ayuda/crear-paciente.mp4"
 * - YouTube: "https://www.youtube.com/watch?v=XXXX"
 */
const TUTORIALS = [
  {
    id: "crear-paciente",
    category: "Pacientes",
    title: "Crear un paciente",
    summary: "Registrá un paciente nuevo.",
    duration: "0:49",
    videoUrl: "https://youtu.be/ztfX7O-Pomc?si=Ym69xxqSY1YRDI7l",
    links: [
      { label: "Ir a Pacientes", href: "/patients" },
      { label: "Nuevo paciente", href: "/patients/new" },
    ],
    steps: [
      "Entrá a Pacientes desde el menú.",
      "Tocá “Nuevo” y completá los datos.",
      "Guardá y verificá que aparezca en el listado.",
    ],
  },
  {
    id: "entrevista-paciente",
    category: "Entrevista",
    title: "Cargar entrevista de pacientes",
    summary: "Completá la entrevista y revisá la información cuando la necesites.",
    duration: "1:08",
    videoUrl: "https://youtu.be/yVgY3Sesuaw",
    links: [{ label: "Ir a Pacientes", href: "/patients" }],
    steps: [
      "Entrá al perfil del paciente.",
      "Abrí la sección de entrevista.",
      "Presioná 'Editar entrevista'",
      "Completá/actualizá respuestas y guardá.",
      "Revisá la entrevista cuando lo necesites.",
    ],
  },
  {
    id: "registrar-tratamiento",
    category: "Tratamientos",
    title: "Registrar tratamiento",
    summary: "Registrá un tratamiento y dejá observaciones y evolución guardadas.",
    duration: "1:45",
    videoUrl: "/videos/ayuda/registrar-tratamiento.mp4",
    links: [
      { label: "Ir a Tratamientos", href: "/treatments" },
      { label: "Ir a Pacientes", href: "/patients" },
    ],
    steps: [
      "Entrá a Tratamientos (o desde el paciente si tu flujo lo permite).",
      "Cargá servicio, fecha y observaciones.",
      "Guardá y verificá el registro en el historial.",
    ],
  },
];

const CATEGORIES = ["Todos", ...Array.from(new Set(TUTORIALS.map((t) => t.category)))];
const SUPPORT_EMAIL = "tugabinete2026@gmail.com";

export function HelpPage() {
  return `
    <div class="help-page">

      <!-- Top bar (igual al resto) -->
      <div class="top-bar">
        <button id="open-menu" class="menu-btn">
          <i class="fa-solid fa-bars"></i>
        </button>
        <span class="app-title">TuGabinete</span>
      </div>

      <!-- Drawer reutilizado -->
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

          <a href="/ayuda" data-link class="active"><i class="fa-solid fa-circle-question"></i> Guías y tutoriales</a>

          <a href="#" id="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
        </nav>
      </aside>

      <div id="drawer-overlay" class="drawer-overlay"></div>

      <!-- Contenido -->
      <main>
        <div class="help-header">
          <div>
            <h2>Guías y tutoriales</h2>
            <p>Videos cortos para aprender a usar TuGabinete sin perder tiempo.</p>
          </div>
        </div>

        <div class="help-chips" id="helpChips">
          ${CATEGORIES.map((c) => `<button class="chip" data-cat="${escapeAttr(c)}">${c}</button>`).join("")}
        </div>

        <section class="help-layout">
          <div class="help-list" id="helpList"></div>

          <article class="help-viewer" id="helpViewer">
            <!-- render dinámico -->
          </article>
        </section>
      </main>
    </div>
  `;
}

export function initHelpPage() {
  initDrawer();

  const listEl = document.getElementById("helpList");
  const viewerEl = document.getElementById("helpViewer");
  const chipsEl = document.getElementById("helpChips");

  let activeCategory = "Todos";

  // Selección inicial por query param (?t=crear-paciente)
  const params = new URLSearchParams(window.location.search);
  const initialId = params.get("t");
  let activeId =
    initialId && TUTORIALS.some((t) => t.id === initialId) ? initialId : TUTORIALS[0]?.id;

  function filteredTutorials() {
    return TUTORIALS.filter((t) => activeCategory === "Todos" || t.category === activeCategory);
  }

  function renderList() {
    if (!listEl) return;
    const items = filteredTutorials();

    listEl.innerHTML = items.length
      ? items
          .map(
            (t) => `
          <button class="help-item ${t.id === activeId ? "active" : ""}" data-id="${escapeAttr(
              t.id
            )}" type="button">
            <div class="help-item-top">
              <span class="help-item-title">${escapeHtml(t.title)}</span>
              <span class="help-item-meta">
                <i class="fa-solid fa-tag"></i> ${escapeHtml(t.category)}
                <span class="dot">•</span>
                <i class="fa-solid fa-clock"></i> ${escapeHtml(t.duration)}
              </span>
            </div>
            <div class="help-item-summary">${escapeHtml(t.summary)}</div>
          </button>
        `
          )
          .join("")
      : `<div class="help-empty">
          <i class="fa-solid fa-circle-info"></i>
          <div>
            <div class="help-empty-title">No hay tutoriales en esta categoría</div>
            <div class="help-empty-sub">Elegí otra categoría para ver más contenido.</div>
          </div>
        </div>`;
  }

  function renderViewer() {
    if (!viewerEl) return;
    const t = TUTORIALS.find((x) => x.id === activeId) || TUTORIALS[0];

    if (!t) {
      viewerEl.innerHTML = `<div class="help-empty">No hay tutoriales cargados.</div>`;
      return;
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?t=${encodeURIComponent(
      t.id
    )}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      "Consulta TuGabinete - " + t.title
    )}&body=${encodeURIComponent("Hola! Tengo una duda sobre el tutorial: " + t.title + "\n\nDetalle:\n")}`;

    viewerEl.innerHTML = `
      <div class="viewer-head">
        <div>
          <div class="viewer-kicker">${escapeHtml(t.category)} • ${escapeHtml(t.duration)}</div>
          <h3 class="viewer-title">${escapeHtml(t.title)}</h3>
          <p class="viewer-summary">${escapeHtml(t.summary)}</p>
        </div>

        <div class="viewer-buttons">
          <button class="btn-ghost" id="copyLinkBtn" type="button" title="Copiar link">
            <i class="fa-solid fa-link"></i>
          </button>
          <a class="btn-ghost" href="${mailto}" title="Enviar consulta por email">
            <i class="fa-solid fa-envelope"></i>
          </a>
        </div>
      </div>

      <div class="viewer-media">
        ${renderVideoEmbed(t.videoUrl)}
      </div>

      <div class="viewer-grid">
        <section class="viewer-card">
          <h4><i class="fa-solid fa-list-check"></i> Pasos</h4>
          <ol>
            ${t.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
          </ol>
        </section>

        <section class="viewer-card">
          <h4><i class="fa-solid fa-bolt"></i> Accesos rápidos</h4>
          <div class="quick-links">
            ${
              t.links?.length
                ? t.links
                    .map(
                      (l) =>
                        `<a href="${escapeAttr(l.href)}" data-link class="quick-link">${escapeHtml(
                          l.label
                        )} <i class="fa-solid fa-arrow-right"></i></a>`
                    )
                    .join("")
                : `<div class="muted">Sin accesos rápidos.</div>`
            }
          </div>

          <div class="support-box">
            <div class="support-title">¿Necesitás ayuda?</div>
            <div class="support-sub">Escribinos y te respondemos por email.</div>
            <a class="support-cta" href="mailto:${SUPPORT_EMAIL}?subject=Soporte%20TuGabinete%20-%20Centro%20de%20Ayuda">
              <i class="fa-solid fa-envelope"></i> ${SUPPORT_EMAIL}
            </a>
          </div>
        </section>
      </div>

      <div class="viewer-toast" id="viewerToast" aria-hidden="true"></div>
    `;

    const copyBtn = document.getElementById("copyLinkBtn");
    copyBtn?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copiado ✅");
      } catch {
        showToast("No se pudo copiar el link");
      }
    });
  }

  function showToast(text) {
    const toast = document.getElementById("viewerToast");
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1600);
  }

  function setActiveCategory(cat) {
    activeCategory = cat;

    chipsEl?.querySelectorAll(".chip").forEach((b) => {
      b.classList.toggle("active", b.dataset.cat === cat);
    });

    const items = filteredTutorials();
    if (items.length && !items.some((x) => x.id === activeId)) activeId = items[0].id;

    renderList();
    renderViewer();
  }

  chipsEl?.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    setActiveCategory(btn.dataset.cat);
  });

  listEl?.addEventListener("click", (e) => {
    const item = e.target.closest(".help-item");
    if (!item) return;

    activeId = item.dataset.id;

    const url = new URL(window.location.href);
    url.searchParams.set("t", activeId);
    history.replaceState(null, "", url.toString());

    renderList();
    renderViewer();
  });

  renderList();
  renderViewer();
  setActiveCategory("Todos");
}

// Helpers
function renderVideoEmbed(url) {
  if (!url) {
    return `
      <div class="video-placeholder">
        <i class="fa-solid fa-video"></i>
        <div class="ph-title">Video pendiente</div>
        <div class="ph-sub">Subí tu video y pegá la URL en <code>videoUrl</code>.</div>
      </div>
    `;
  }

  const yt = parseYouTube(url);
  if (yt) {
    return `
      <div class="video-embed">
        <iframe
          src="https://www.youtube.com/embed/${yt}"
          title="Tutorial"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    `;
  }

  return `
    <video class="video-player" controls preload="metadata">
      <source src="${escapeAttr(url)}" />
      Tu navegador no soporta video HTML5.
    </video>
  `;
}

function parseYouTube(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    return null;
  } catch {
    return null;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`", "");
}
