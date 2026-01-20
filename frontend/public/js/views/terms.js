import { PublicHeader, initPublicHeader } from "../components/publicHeader.js";

export function Terms() {
  return `
    <div class="legal-page">
      ${PublicHeader()}

      <section class="legal-card">
        <h1>Términos y Condiciones</h1>
        <p class="updated"><span class="highlight">Última actualización:</span> 19 de enero de 2026</p>

        <h2>1. Aceptación</h2>
        <p>
          Al crear una cuenta o utilizar TuGabinete, aceptás estos Términos y nuestra Política de Privacidad.
          Si no estás de acuerdo, no utilices el servicio.
        </p>

        <h2>2. Uso permitido</h2>
        <ul>
          <li>Usar la plataforma para gestión profesional (agenda, pacientes, tratamientos y registros).</li>
          <li>No usar el sistema para actividades ilegales, abuso, spam, o vulneración de seguridad.</li>
          <li>No intentar acceder a cuentas ajenas ni explotar fallas.</li>
        </ul>

        <h2>3. Tu contenido y responsabilidad</h2>
        <p>
          Sos responsable por la información que cargás (incluyendo datos de terceros/pacientes).
          Asegurate de contar con base legal y permisos necesarios para registrar y almacenar esa información.
        </p>

        <h2>4. Disponibilidad del servicio</h2>
        <p>
          TuGabinete puede tener interrupciones por mantenimiento, mejoras o razones técnicas.
          Hacemos esfuerzos razonables por mantener disponibilidad, pero no garantizamos funcionamiento ininterrumpido.
        </p>

        <h2>5. Propiedad intelectual</h2>
        <p>
          La plataforma, diseño y marca pertenecen a TuGabinete. Tu contenido te pertenece.
          Nos autorizás a procesarlo únicamente para brindarte el servicio.
        </p>

        <h2>6. Limitación de responsabilidad</h2>
        <p>
          En la medida permitida por ley, TuGabinete no se responsabiliza por pérdidas indirectas, lucro cesante,
          o daños derivados del uso o imposibilidad de uso del servicio.
        </p>

        <h2>7. Terminación</h2>
        <p>
          Podés dejar de usar el servicio y solicitar eliminación de tu cuenta. Podemos suspender cuentas ante abuso,
          incumplimiento, o riesgo de seguridad.
        </p>

        <h2>8. Cambios</h2>
        <p>
          Podemos modificar estos Términos. Publicaremos cambios con su fecha y, si corresponde, avisaremos dentro de la plataforma.
        </p>
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

export function initTerms() {
  document.body.className = "is-terms";
  initPublicHeader();
}
