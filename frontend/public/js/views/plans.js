import { PublicHeader, initPublicHeader } from "../components/publicHeader.js";

export function Plans() {
  return `
    <div class="plans-page">
      ${PublicHeader()}

      <main class="plans-main">
        <!-- HERO -->
        <section class="plans-hero">

          <h1>Planes claros para trabajar con confianza</h1>

            <p class="lead">
                Planes mensuales en ARS. <strong>Promo lanzamiento: GRATIS los primeros 3 meses</strong> en TODOS los planes pagos.
            </p>

          <div class="hero-note">
            <i class="fa-solid fa-shield-halved"></i>
            Sin sorpresas: límites visibles, condiciones transparentes y soporte por email.
          </div>
        </section>

        <!-- PLANS -->
        <section class="plans-section">
          <div class="plans-grid">

            <!-- GRATIS -->
            <article class="plan-card">
            <div class="plan-top">
                <span class="plan-chip placeholder" aria-hidden="true">—</span>
                <span class="plan-chip plan-name">Gratis</span>
                <span class="plan-chip placeholder" aria-hidden="true">—</span>
            </div>
              <div class="plan-head">
                <h2 class="plan-title">Para empezar</h2>

                <div class="price">
                  <span class="amount">ARS 0</span>
                  <span class="period">/ mes</span>
                </div>

                <p class="plan-sub">Lo esencial para arrancar.</p>
              </div>

              <div class="plan-body">
                <div class="limit-box">
                  <div class="limit-row">
                    <span class="label">Pacientes</span>
                    <span class="value">Hasta <strong>5</strong></span>
                  </div>
                  <div class="limit-row">
                    <span class="label">Tratamientos</span>
                    <span class="value"><strong>5</strong> por semana</span>
                  </div>
                </div>

                <ul class="bullets">
                  <li><i class="fa-solid fa-circle-check"></i> Ideal para probar y familiarizarse</li>
                  <li><i class="fa-solid fa-circle-check"></i> Gestión simple y rápida</li>
                </ul>
              </div>

              <div class="plan-foot">
                <a href="/register" data-link class="btn-secondary full">Empezar gratis</a>
                <p class="micro">Podés subir de plan cuando quieras.</p>
              </div>
            </article>

            <!-- MEDIO -->
            <article class="plan-card paid">
              <div class="plan-top">
                <span class="plan-chip discount">-100%</span>
                <span class="plan-chip plan-name">Medio</span>
                <span class="plan-chip placeholder" aria-hidden="true">—</span>
            </div>
              <div class="plan-head">
                <h2 class="plan-title">Para sostener tu ritmo</h2>

                <div class="price">
                  <span class="amount">ARS 0</span>
                  <span class="period">/ mes</span>
                </div>

                <div class="old-price">
                  <span class="old">ARS 25.000</span>
                  <span class="old-label">antes</span>
                </div>

                <p class="plan-sub">Más margen para tu día a día.</p>
              </div>

              <div class="plan-body">
                <div class="limit-box">
                  <div class="limit-row">
                    <span class="label">Pacientes</span>
                    <span class="value">Hasta <strong>15</strong></span>
                  </div>
                  <div class="limit-row">
                    <span class="label">Tratamientos</span>
                    <span class="value"><strong>30</strong> por mes</span>
                  </div>
                </div>

                <ul class="bullets">
                  <li><i class="fa-solid fa-circle-check"></i> Más margen para atender sin fricción</li>
                  <li><i class="fa-solid fa-circle-check"></i> Ideal para uso frecuente</li>
                </ul>
              </div>

              <div class="plan-foot">
                <a href="/register" data-link class="btn-secondary full">Elegir plan Medio</a>
                <p class="micro">Promo de lanzamiento aplicada.</p>
              </div>
            </article>

            <!-- FULL (RECOMENDADO) -->
            <article class="plan-card featured paid">
                <div class="plan-top">
                    <span class="plan-chip discount">-100%</span>
                    <span class="plan-chip plan-name">Full</span>
                    <span class="plan-chip recommended"><i class="fa-solid fa-crown"></i> Recomendado</span>
                </div>

              <div class="plan-head">
                <h2 class="plan-title">Para crecer sin límites</h2>

                <div class="price big">
                  <span class="amount">ARS 0</span>
                  <span class="period">/ mes</span>
                </div>

                <div class="old-price">
                  <span class="old">ARS 30.000</span>
                  <span class="old-label">antes</span>
                </div>

                <p class="plan-sub">Todo, sin límites.</p>
              </div>

              <div class="plan-body">
                <div class="limit-box strong">
                  <div class="limit-row">
                    <span class="label">Pacientes</span>
                    <span class="value"><strong>Ilimitado</strong></span>
                  </div>
                  <div class="limit-row">
                    <span class="label">Tratamientos</span>
                    <span class="value"><strong>Ilimitado</strong></span>
                  </div>
                </div>

                <ul class="bullets">
                  <li><i class="fa-solid fa-circle-check"></i> Sin restricciones</li>
                  <li><i class="fa-solid fa-circle-check"></i> Pensado para máxima exigencia</li>
                </ul>
              </div>

              <div class="plan-foot">
                <a href="/register" data-link class="btn-primary full">Elegir plan Full</a>
                <p class="micro">
                  Soporte: <a href="mailto:tugabinete2026@gmail.com">tugabinete2026@gmail.com</a>
                </p>
              </div>
            </article>

          </div>
        </section>

        <!-- CTA -->
        <section class="plans-cta">
          <div class="cta-card">
            <div>
              <h2>Tu gabinete se merece una gestión profesional</h2>
              <p>Empezá hoy y elegí el plan que mejor se adapte a tu momento.</p>
            </div>

            <div class="cta-actions">
              <a href="/register" data-link class="btn-primary">Crear cuenta</a>
              <a href="/contact" data-link class="btn-secondary">Consultar</a>
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

export function initPlans() {
  document.body.className = "is-plans";
  initPublicHeader();
}
