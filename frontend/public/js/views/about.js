import { PublicHeader, initPublicHeader } from "../components/publicHeader.js";

export function About() {
  return `
    <div class="about-page">
      ${PublicHeader()}

      <section class="about-section">
        <div class="intro">
          <h1>Sobre Nosotros</h1>
          <p>
            En TuGabinete, somos apasionadas por la belleza y el bienestar. Nuestra plataforma está diseñada
            para ayudar a profesionales a gestionar su gabinete de forma eficiente y cuidada, enfocándonos
            en cada detalle de sus clientes.
          </p>
        </div>

        <div class="values">
          <h2>Nuestros Valores</h2>

          <div class="values-grid">
            <div class="value-card">
              <div class="icon"><i class="fa-solid fa-user-tie"></i></div>
              <h3>Profesionalismo</h3>
              <p>Herramientas claras y confiables para acompañar tu trabajo diario.</p>
            </div>

            <div class="value-card">
              <div class="icon"><i class="fa-solid fa-star"></i></div>
              <h3>Innovación</h3>
              <p>Mejoramos la plataforma continuamente para adaptarnos a tus necesidades.</p>
            </div>

            <div class="value-card">
              <div class="icon"><i class="fa-solid fa-heart"></i></div>
              <h3>Cuidado</h3>
              <p>Priorizamos la experiencia de tus clientes y tu tranquilidad profesional.</p>
            </div>
          </div>
        </div>

        <div class="team">
          <h2>Nuestro Equipo</h2>
          <p>
            Somos un equipo comprometido con crear una experiencia simple, estética y potente.
            Trabajamos junto a profesionales para que TuGabinete se sienta hecho “a medida”.
          </p>
        </div>
      </section>

      <div class="bottom-links">
        <a href="/policies" data-link>Políticas</a>
        <a href="/terms" data-link>Términos</a>
        <a href="/help" data-link>Ayuda</a>
        <div class="social">
          <i class="fa-brands fa-facebook"></i>
          <i class="fa-brands fa-instagram"></i>
        </div>
      </div>

      <div class="copyright">
        © 2026 TuGabinete — Todos los derechos reservados.
      </div>
    </div>
  `;
}

export function initAbout() {
  document.body.className = "is-about";
  initPublicHeader();
}
