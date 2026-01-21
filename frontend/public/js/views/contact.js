import { PublicHeader, initPublicHeader } from "../components/publicHeader.js";

export function Contact() {
  return `
    <div class="contact-page">
      ${PublicHeader()}

      <main class="contact-main">
        <!-- HERO -->
        <section class="contact-hero">

          <h1>Hablemos</h1>

          <p class="lead">
            ¿Tenés una consulta, sugerencia o necesitás ayuda con TuGabinete?
            Escribinos y te respondemos por email.
          </p>

          <div class="hero-note">
            <i class="fa-solid fa-shield-halved"></i>
            Para más información, podés revisar <a href="/policies" data-link>Políticas</a> y <a href="/terms" data-link>Términos</a>.
          </div>
        </section>

        <!-- CONTENT -->
        <section class="contact-content">
          <div class="grid">
            <!-- FORM -->
            <div class="card">
              <h2>Enviar mensaje</h2>
              <p class="muted">
                Completá estos datos. Al enviar, se abrirá tu correo con el mensaje listo para mandar.
              </p>

              <form id="contact-form" class="form">
                <div class="field">
                  <label for="c-name">Nombre</label>
                  <input id="c-name" name="name" type="text" placeholder="Tu nombre" autocomplete="name" />
                </div>

                <div class="field">
                  <label for="c-email">Email</label>
                  <input id="c-email" name="email" type="email" placeholder="tunombre@email.com" autocomplete="email" />
                </div>

                <div class="field">
                  <label for="c-topic">Motivo</label>
                  <select id="c-topic" name="topic">
                    <option value="Consulta general">Consulta general</option>
                    <option value="Soporte / Problema técnico">Soporte / Problema técnico</option>
                    <option value="Sugerencia / Mejora">Sugerencia / Mejora</option>
                    <option value="Planes / Suscripción">Planes / Suscripción</option>
                  </select>
                </div>

                <div class="field">
                  <label for="c-message">Mensaje</label>
                  <textarea id="c-message" name="message" rows="6" placeholder="Contanos con detalle así podemos ayudarte mejor..."></textarea>
                </div>

                <div class="actions">
                  <button type="submit" class="btn-primary">
                    <i class="fa-solid fa-paper-plane"></i>
                    Enviar por email
                  </button>

                  <a class="btn-secondary" href="mailto:tugabinete2026@gmail.com">
                    <i class="fa-solid fa-envelope"></i>
                    Escribir directo
                  </a>
                </div>

                <p id="contact-status" class="status" aria-live="polite"></p>

                <div class="hint">
                  <i class="fa-solid fa-circle-info"></i>
                  Si es un error, incluí qué estabas haciendo y, si podés, adjuntá una captura.
                </div>
              </form>
            </div>

            <!-- INFO -->
            <div class="side">
              <div class="card soft">
                <h3>Contacto</h3>
                <p class="muted">Email oficial:</p>

                <a class="email-box" href="mailto:tugabinete2026@gmail.com">
                  <i class="fa-solid fa-envelope"></i>
                  tugabinete2026@gmail.com
                </a>

                <div class="mini">
                  <i class="fa-solid fa-handshake-angle"></i>
                  Te respondemos lo antes posible.
                </div>
              </div>

              <div class="card soft">
                <h3>Recursos</h3>
                <p class="muted">
                  Información útil para que tengas todo claro.
                </p>

                <div class="links">
                  <a href="/help" data-link><i class="fa-solid fa-life-ring"></i> Ayuda</a>
                  <a href="/policies" data-link><i class="fa-solid fa-file-shield"></i> Políticas</a>
                  <a href="/terms" data-link><i class="fa-solid fa-scale-balanced"></i> Términos</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section class="contact-cta">
          <div class="cta-card">
            <div>
              <h2>¿Todavía no tenés cuenta?</h2>
              <p>Creala en minutos y empezá a ordenar tu gabinete.</p>
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

export function initContact() {
  document.body.className = "is-contact";
  initPublicHeader();

  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-status");
  if (!form || !status) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("c-name")?.value?.trim() || "";
    const email = document.getElementById("c-email")?.value?.trim() || "";
    const topic = document.getElementById("c-topic")?.value || "Consulta general";
    const message = document.getElementById("c-message")?.value?.trim() || "";

    if (!message) {
      status.textContent = "Por favor, escribí tu mensaje.";
      status.classList.add("error");
      return;
    }

    status.textContent = "";
    status.classList.remove("error");

    const subject = `[TuGabinete] ${topic}${name ? " — " + name : ""}`;
    const bodyLines = [
      `Nombre: ${name || "-"}`,
      `Email: ${email || "-"}`,
      `Motivo: ${topic}`,
      "",
      "Mensaje:",
      message,
      "",
      "— Enviado desde la página de contacto de TuGabinete"
    ];

    const mailto = `mailto:tugabinete2026@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailto;
    status.textContent = "Se abrió tu correo con el mensaje listo para enviar.";
  });
}
