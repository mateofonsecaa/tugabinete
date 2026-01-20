import { PublicHeader, initPublicHeader } from "../components/publicHeader.js";

export function Policies() {
  return `
    <div class="legal-page">
      ${PublicHeader()}

      <section class="legal-card">
        <h1>Política de Privacidad</h1>
        <p class="updated"><span class="highlight">Última actualización:</span> 19 de enero de 2026</p>

        <p>
          En <span class="highlight">TuGabinete</span> nos tomamos muy en serio la privacidad y la seguridad de la información.
          Esta Política explica qué datos tratamos, para qué los usamos, con quién los compartimos y qué derechos tenés.
        </p>

        <h2>1. Quiénes somos y contacto</h2>
        <p>
          TuGabinete es una plataforma de gestión para profesionales (agenda, pacientes, tratamientos y registros).
          Consultas o solicitudes: <span class="highlight">tugabinete2026@gmail.com</span>.
        </p>

        <h2>2. Datos que recopilamos</h2>
        <ul>
          <li><b>Cuenta y perfil:</b> nombre, email, profesión, teléfono, foto de perfil.</li>
          <li><b>Datos técnicos:</b> IP, navegador, dispositivo, eventos de uso y errores para seguridad/mejoras.</li>
          <li><b>Contenido cargado:</b> pacientes, tratamientos, notas, imágenes y archivos que subas.</li>
        </ul>

        <h2>3. Datos de pacientes</h2>
        <p>
          Si cargás información de pacientes/clientes, normalmente <b>vos</b> sos el Responsable del contenido que registrás,
          y TuGabinete actúa como Encargado (procesa/almacena datos para brindarte el servicio).
        </p>

        <h2>4. Para qué usamos los datos</h2>
        <ul>
          <li>Crear y administrar tu cuenta.</li>
          <li>Brindar las funciones de la plataforma.</li>
          <li>Guardar y mostrar información que cargás (incluyendo imágenes).</li>
          <li>Comunicaciones operativas (verificación, seguridad).</li>
          <li>Mejoras del sistema y prevención de abuso.</li>
        </ul>

        <h2>5. Proveedores y transferencias</h2>
        <p>
          No vendemos tus datos. Podemos usar proveedores técnicos (hosting, base de datos, almacenamiento, email).
          Algunos pueden operar fuera de tu país. En esos casos aplicamos medidas de protección razonables.
        </p>

        <h2>6. Conservación y eliminación</h2>
        <p>
          Conservamos datos mientras tu cuenta esté activa o sea necesario para operar el servicio.
          Podés solicitar eliminación; backups pueden retener por un período limitado adicional.
        </p>

        <h2>7. Seguridad</h2>
        <p>
          Aplicamos medidas razonables de seguridad. Ningún sistema es 100% infalible, por lo que no garantizamos seguridad absoluta.
        </p>

        <h2>8. Tus derechos</h2>
        <p>
          Podés solicitar acceso, rectificación o eliminación de tu información de cuenta escribiendo a
          <span class="highlight">tugabinete2026@gmail.com</span>. Podremos verificar identidad.
        </p>

        <h2>9. Cambios</h2>
        <p>
          Podemos actualizar esta política. Publicaremos la versión vigente y su fecha.
        </p>

        <p style="margin-top: 22px; color:#666;">
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

export function initPolicies() {
  document.body.className = "is-policies";
  initPublicHeader();
}
