import { PublicHeader, initPublicHeader } from "../components/publicHeader.js";

export function About() {
  return `
    <div class="about-page">
      ${PublicHeader()}

      <main class="about-main">
        <!-- HERO -->
        <section class="about-hero">

          <h1>Sobre TuGabinete</h1>

          <p class="lead">
            Creamos TuGabinete para ayudar a profesionales de cosmetología a trabajar con más orden,
            continuidad y tranquilidad. Una plataforma estética, clara y pensada para tu rutina real.
          </p>

          <div class="hero-actions">
            <a href="/register" data-link class="btn-primary">Crear cuenta</a>
            <a href="/contact" data-link class="btn-secondary">Contactanos</a>
          </div>

          <div class="hero-note">
            <i class="fa-solid fa-shield-halved"></i>
            Transparencia y confianza: podés ver nuestras <a href="/policies" data-link>Políticas</a> y <a href="/terms" data-link>Términos</a> cuando quieras.
          </div>
        </section>

        <!-- STORY -->
        <section class="about-section">
          <div class="section-head">
            <h2>Nuestra idea</h2>
            <p>
              En cosmetología, el detalle importa. Lo mismo pasa con la gestión: fichas, evolución,
              observaciones y seguimiento. TuGabinete nace para que todo eso esté ordenado, simple y a mano,
              sin que pierdas tiempo ni energía.
            </p>
          </div>

          <div class="story-card">
            <div class="story-icon"><i class="fa-solid fa-heart"></i></div>
            <div class="story-text">
              <h3>Hecho para sentirse “a medida”</h3>
              <p>
                Queremos que la plataforma se sienta como una extensión natural de tu gabinete:
                limpia, estética y profesional. Que te dé seguridad al trabajar y también al comunicarte con tus clientas.
              </p>
            </div>
          </div>
        </section>

        <!-- VALUES -->
        <section class="about-section">
          <div class="section-head center">
            <h2>Nuestros valores</h2>
            <p>Lo que guía cada decisión y cada mejora que hacemos.</p>
          </div>

          <div class="values-grid">
            <div class="value-card">
              <div class="icon"><i class="fa-solid fa-user-tie"></i></div>
              <h3>Profesionalismo</h3>
              <p>Una experiencia prolija que acompaña tu trabajo diario.</p>
            </div>

            <div class="value-card">
              <div class="icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
              <h3>Simplicidad</h3>
              <p>Menos pasos, menos fricción. Todo claro y fácil de usar.</p>
            </div>

            <div class="value-card">
              <div class="icon"><i class="fa-solid fa-shield-halved"></i></div>
              <h3>Confianza</h3>
              <p>Reglas transparentes y foco en tu tranquilidad profesional.</p>
            </div>
          </div>
        </section>

        <!-- CONTACT -->
        <section class="about-section">
          <div class="section-head">
            <h2>¿Querés hablar con nosotros?</h2>
            <p>
              Si tenés dudas, sugerencias o querés contarnos tu caso, escribinos.
              Leemos y respondemos personalmente.
            </p>
          </div>

          <div class="contact-card">
            <a class="contact-email" href="mailto:tugabinete2026@gmail.com">
              <i class="fa-solid fa-envelope"></i>
              tugabinete2026@gmail.com
            </a>
            <div class="contact-hint">
              <i class="fa-solid fa-circle-info"></i>
              Si es por un error, adjuntá captura y contanos qué estabas haciendo.
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section class="about-cta">
          <div class="cta-card">
            <div>
              <h2>Empezá hoy, sin complicarte</h2>
              <p>Probá TuGabinete y llevá tu gestión a un nivel más profesional.</p>
            </div>

            <div class="cta-actions">
              <a href="/register" data-link class="btn-primary">Crear cuenta</a>
              <a href="/login" data-link class="btn-secondary">Iniciar sesión</a>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <div class="bottom-links">
        <div class="links-row">
          <a href="/policies" data-link>Políticas</a>
          <a href="/terms" data-link>Términos</a>
          <a href="/help" data-link>Ayuda</a>
          <a href="/contact" data-link>Contacto</a>
        </div>

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
