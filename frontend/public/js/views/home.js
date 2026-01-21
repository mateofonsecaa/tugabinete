export function Home() {
  return `
    <header class="public-header">
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

    <section class="hero">
      <div class="hero-content">
        <h1>Gestioná tu gabinete y cuidá cada detalle de tus clientes</h1>
        <p>Registra clientes, sigue tratamientos y optimiza tu práctica de belleza con herramientas profesionales.</p>
        <a href="/register" data-link class="btn-register">Comenzar ahora</a>
      </div>

      <img
        src="./images/cosmetologa.png"
        alt="Cosmetóloga atendiendo a una clienta"
        class="cosmetologa-img"
      >
    </section>

    <section class="features">
      <h2>Características Principales</h2>
      <div class="grid">
        <div class="card">
          <div class="icon"><i class="fa-solid fa-file-lines"></i></div>
          <h3>Registro completo de clientes</h3>
          <p>Guarda datos personales y detalles clave de manera segura.</p>
        </div>

        <div class="card">
          <div class="icon"><i class="fa-solid fa-camera"></i></div>
          <h3>Fotos y evolución de tratamientos</h3>
          <p>Documenta el progreso con imágenes y notas detalladas.</p>
        </div>

        <div class="card">
          <div class="icon"><i class="fa-solid fa-calendar-check"></i></div>
          <h3>Agenda inteligente y recordatorios</h3>
          <p>Organiza citas y envía notificaciones automáticas.</p>
        </div>

        <div class="card">
          <div class="icon"><i class="fa-solid fa-chart-column"></i></div>
          <h3>Análisis y reportes personalizados</h3>
          <p>Genera informes para mejorar tu negocio.</p>
        </div>
      </div>
    </section>

    <section class="testimonials">
      <h2>Testimonios de nuestra comunidad</h2>
      <div class="testimonials-grid">
        <div class="testimonial">
          <img src="./images/analopez.png">
          <p>“Esta plataforma me ha ayudado a organizar mis tratamientos de manera profesional.”</p>
          <cite>- Ana López</cite>
        </div>
        <div class="testimonial">
          <img src="./images/mariagarcia.png">
          <p>“Fácil de usar y perfecta para cuidar cada detalle de mis clientes.”</p>
          <cite>- María García</cite>
        </div>
        <div class="testimonial">
          <img src="./images/luzdeluna.png">
          <p>“Los reportes me permiten crecer mi gabinete de belleza.”</p>
          <cite>- Laura Martínez</cite>
        </div>
      </div>
    </section>

    <section class="cta">
      <h2>Comenzá gratis hoy y profesionalizá tu gestión</h2>
      <a href="/register" data-link class="btn-register">Crear cuenta</a>
    </section>

    <div class="bottom-links">
      <div class="links-row">
        <a href="/policies" data-link>Políticas</a>
        <a href="/terms" data-link>Términos</a>
        <a href="/help" data-link>Ayuda</a>
      </div>

      <div class="social">
        <i class="fa-brands fa-facebook"></i>
        <i class="fa-brands fa-instagram"></i>
      </div>
    </div>

    <div class="copyright">
      © 2025 TuGabinete — Todos los derechos reservados.
    </div>
  `;
}

export function initHome() {
  const header = document.querySelector("header");
  if (!header) return;

  setTimeout(() => header.classList.add("visible"), 200);

  let lastScrollY = window.scrollY;
  const hideThreshold = 615;

  window.addEventListener("scroll", () => {
    if (window.scrollY > lastScrollY && window.scrollY > hideThreshold) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
    lastScrollY = window.scrollY;
  });
}
