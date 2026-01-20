import { PublicHeader, initPublicHeader } from "../components/publicHeader.js";

export function Help() {
  return `
    <div class="legal-page">
      ${PublicHeader()}

      <section class="legal-card">
        <h1>Centro de Ayuda</h1>
        <p class="updated">Soporte y preguntas frecuentes</p>

        <h2>Contacto</h2>
        <p>Escribinos a <span class="highlight">soporte@tugabinete.com</span> y te respondemos lo antes posible.</p>

        <h2>Cuenta</h2>
        <ul>
          <li>Si no podés ingresar, verificá tu email y contraseña.</li>
          <li>Si tu sesión expira, volvé a iniciar sesión.</li>
        </ul>

        <h2>Datos de pacientes</h2>
        <ul>
          <li>Guardá solo lo necesario para tu trabajo.</li>
          <li>No subas información sensible si no es indispensable.</li>
        </ul>
      </section>

      <div class="bottom-links">
        <a href="/policies" data-link>Privacidad</a>
        <a href="/terms" data-link>Términos</a>
        <a href="/help" data-link>Ayuda</a>
        <div class="social">
          <i class="fa-brands fa-facebook"></i>
          <i class="fa-brands fa-instagram"></i>
        </div>
      </div>
    </div>
  `;
}

export function initHelp() {
  document.body.className = "is-help";
  initPublicHeader();
}
