// /public/js/features/auth/auth.templates.js
//
// Templates HTML del dominio auth. Funciones puras: datos -> string.
// Sin DOM, sin estado, sin API.
//
// Politica XSS del proyecto: toda interpolacion de datos de usuario o
// del backend pasa por escapeHtml (core/utils/security.js). Los
// templates de recover no interpolan datos (la pantalla de exito NO
// muestra el email a proposito: respuesta neutra anti-enumeracion),
// asi que escapeHtml debuta en verify (defensa en profundidad sobre
// su diccionario de estados) y sera obligatorio en las cards de
// reset-password, que interpolan data.message del servidor.
//
// Este archivo crece con cada fusion del Paso 5: recover (aca),
// verify, reset-password, register y login iran sumando los suyos.

import { escapeHtml } from "../../core/utils/security.js";

/* ==================== Recuperar contraseña ==================== */

/** Formulario de recuperacion (contenido de la card). */
export function recoverFormTemplate() {
  return `
    <div class="tg-recover-card__icon">
      <i class="fa-solid fa-key"></i>
    </div>

    <h1 class="tg-recover-card__title">Recuperar contraseña</h1>
    <p class="tg-recover-card__text">
      Ingresá tu correo electrónico y, si está registrado, te vamos a enviar un enlace para restablecer tu contraseña.
    </p>

    <div id="tg-recover-alert" class="tg-recover-alert" hidden></div>

    <form id="tg-recover-form" class="tg-recover-form" novalidate>
      <div class="tg-recover-field">
        <label class="tg-recover-label" for="recover-email">Correo electrónico</label>
        <input
          class="tg-recover-input"
          type="email"
          id="recover-email"
          name="email"
          placeholder="ejemplo@correo.com"
          autocomplete="email"
          required
        />
        <p id="tg-recover-email-error" class="tg-recover-field-error" hidden></p>
      </div>

      <button type="submit" id="tg-recover-submit" class="tg-recover-submit">
        Enviar enlace
      </button>
    </form>

    <div class="tg-recover-card__actions">
      <a href="/login" data-link class="tg-recover-secondary-link">Volver a iniciar sesión</a>
    </div>
  `;
}

/** Estado de exito (respuesta neutra: no muestra el email). */
export function recoverSuccessTemplate() {
  return `
    <div class="tg-recover-card__icon is-success">
      <i class="fa-solid fa-envelope-circle-check"></i>
    </div>

    <h1 class="tg-recover-card__title">Revisá tu correo</h1>
    <p class="tg-recover-card__text">
      Si el correo ingresado está registrado, te vamos a enviar un enlace para restablecer tu contraseña.
    </p>

    <div class="tg-recover-info-box">
      Revisá la bandeja de entrada y también spam o promociones. El enlace vence pronto por seguridad.
    </div>

    <div class="tg-recover-card__actions">
      <a href="/login" data-link class="tg-recover-primary-link">Ir a iniciar sesión</a>
      <button type="button" id="tg-recover-back-btn" class="tg-recover-secondary-btn">
        Volver a intentar
      </button>
    </div>
  `;
}

/** Pantalla completa de recuperacion (shell + card con el form). */
export function recoverPageTemplate() {
  return `
    <section class="tg-recover-page">
      <div class="tg-recover-shell">
        <a href="/" data-link class="tg-recover-brand">TuGabinete</a>

        <div id="tg-recover-card" class="tg-recover-card">
          ${recoverFormTemplate()}
        </div>

        <div class="tg-recover-footer">
          <a href="/policies" data-link>Políticas</a>
          <a href="/terms" data-link>Términos</a>
          <a href="/help" data-link>Ayuda</a>
        </div>
      </div>
    </section>
  `;
}

/* ==================== Verificacion de cuenta ==================== */

/**
 * Pantalla completa de verificacion. `status` viene de la URL y se usa
 * SOLO como clave del diccionario (con fallback a "invalid"): nunca se
 * interpola, asi que un status malicioso rinde la card de enlace
 * invalido, no HTML. title/message se escapan por defensa en
 * profundidad; view.actions es HTML pre-renderizado y no se escapa.
 */
export function verifyPageTemplate(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  const contentByStatus = {
    success: {
      title: "Cuenta verificada",
      message:
        "Tu cuenta fue verificada correctamente. Ya podés iniciar sesión.",
      icon: "fa-circle-check",
      cardClass: "tg-verify-card is-success",
      actions: `
        <button id="go-login" class="tg-verify-primary-btn">Ir a iniciar sesión</button>
      `,
    },
    expired: {
      title: "Enlace vencido",
      message:
        "El enlace de verificación venció. Ingresá tu correo para que te enviemos uno nuevo.",
      icon: "fa-clock",
      cardClass: "tg-verify-card is-warning",
      actions: `
        <form id="resend-verification-form" class="tg-verify-form" novalidate>
          <div class="tg-verify-input-group">
            <label for="resend-email">Correo electrónico</label>
            <input
              type="email"
              id="resend-email"
              placeholder="ejemplo@correo.com"
              autocomplete="email"
              required
            />
          </div>

          <button type="submit" id="resend-verification-btn" class="tg-verify-primary-btn">
            Reenviar correo
          </button>
        </form>

        <button id="go-login" class="tg-verify-secondary-btn">Ir a iniciar sesión</button>
      `,
    },
    invalid: {
      title: "Enlace inválido",
      message:
        "El enlace de verificación es inválido, ya fue utilizado o no existe.",
      icon: "fa-triangle-exclamation",
      cardClass: "tg-verify-card is-error",
      actions: `
        <div class="tg-verify-actions">
          <a href="/register" data-link class="tg-verify-secondary-btn">Volver al registro</a>
          <button id="go-login" class="tg-verify-primary-btn">Ir a iniciar sesión</button>
        </div>
      `,
    },
  };

  const view = contentByStatus[normalizedStatus] || contentByStatus.invalid;

  return `
    <section class="tg-verify-page">
      <div class="tg-verify-section">
        <div class="${view.cardClass}">
          <div class="tg-verify-icon">
            <i class="fa-solid ${view.icon}"></i>
          </div>

          <h2>${escapeHtml(view.title)}</h2>
          <p>${escapeHtml(view.message)}</p>

          <div class="tg-verify-dynamic-content">
            ${view.actions}
          </div>
        </div>
      </div>

      <div id="notification-container" class="tg-verify-notification-container"></div>
    </section>
  `;
}

/* ==================== Restablecer contraseña ==================== */

/**
 * Cards de la pantalla de reseteo. resetPasswordStatusTemplate es el
 * unico template del dominio que interpola datos DEL SERVIDOR
 * (data.message en las cards de token invalido/vencido/usado/429):
 * `text` y `title` van escapados OBLIGATORIAMENTE. No se escapan:
 * `innerMarkup` del shell (HTML pre-renderizado) y los literales de
 * clase (`icon` y el ternario de `variant`).
 */
export function resetPasswordShellTemplate(innerMarkup) {
  return `
    <section class="tg-reset-password-page">
      <div class="tg-reset-password-shell">
        <a href="/" data-link class="tg-reset-password-brand">TuGabinete</a>

        <div id="tg-reset-password-card" class="tg-reset-password-card">
          ${innerMarkup}
        </div>

        <div class="tg-reset-password-footer">
          <a href="/policies" data-link>Políticas</a>
          <a href="/terms" data-link>Términos</a>
          <a href="/help" data-link>Ayuda</a>
        </div>
      </div>
    </section>
  `;
}

export function resetPasswordLoadingTemplate() {
  return `
    <div class="tg-reset-password-icon">
      <span class="tg-reset-password-big-spinner" aria-hidden="true"></span>
    </div>
    <h1 class="tg-reset-password-title">Validando enlace</h1>
    <p class="tg-reset-password-text">
      Esperá un momento. Estamos comprobando que este enlace siga siendo válido.
    </p>
  `;
}

export function resetPasswordStatusTemplate({ title, text, icon, variant = "error" }) {
  return `
    <div class="tg-reset-password-icon ${variant === "success" ? "is-success" : "is-error"}">
      <i class="fa-solid ${icon}"></i>
    </div>

    <h1 class="tg-reset-password-title">${escapeHtml(title)}</h1>
    <p class="tg-reset-password-text">${escapeHtml(text)}</p>

    <div class="tg-reset-password-actions">
      <a href="/recover" data-link class="tg-reset-password-primary-link">Solicitar un nuevo enlace</a>
      <a href="/login" data-link class="tg-reset-password-secondary-link">Volver a iniciar sesión</a>
    </div>
  `;
}

export function resetPasswordSuccessTemplate() {
  return `
    <div class="tg-reset-password-icon is-success">
      <i class="fa-solid fa-circle-check"></i>
    </div>

    <h1 class="tg-reset-password-title">Contraseña actualizada</h1>
    <p class="tg-reset-password-text">
      Tu contraseña fue actualizada correctamente. No te iniciamos sesión de forma automática por seguridad.
    </p>

    <div class="tg-reset-password-actions">
      <a href="/login" data-link class="tg-reset-password-primary-link">Ir a iniciar sesión</a>
    </div>
  `;
}

export function resetPasswordFormTemplate() {
  return `
    <div class="tg-reset-password-icon">
      <i class="fa-solid fa-lock"></i>
    </div>

    <h1 class="tg-reset-password-title">Restablecer contraseña</h1>
    <p class="tg-reset-password-text">
      Elegí una nueva contraseña. Podés usar una frase larga. Evitá contraseñas comunes.
    </p>

    <div id="tg-reset-password-alert" class="tg-reset-password-alert" hidden></div>

    <form id="tg-reset-password-form" class="tg-reset-password-form" novalidate>
      <div class="tg-reset-password-field">
        <label class="tg-reset-password-label" for="new-password">Nueva contraseña</label>
        <div class="tg-reset-password-input-wrap">
          <input
            class="tg-reset-password-input"
            type="password"
            id="new-password"
            autocomplete="new-password"
            placeholder="Ingresá tu nueva contraseña"
            required
          />
          <button
            type="button"
            class="tg-reset-password-toggle"
            data-target="new-password"
            aria-label="Mostrar u ocultar contraseña"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
        <p class="tg-reset-password-hint">
          Mínimo 10 caracteres.
        </p>
        <p id="tg-reset-password-error-password" class="tg-reset-password-field-error" hidden></p>
      </div>

      <div class="tg-reset-password-field">
        <label class="tg-reset-password-label" for="confirm-password">Confirmar nueva contraseña</label>
        <div class="tg-reset-password-input-wrap">
          <input
            class="tg-reset-password-input"
            type="password"
            id="confirm-password"
            autocomplete="new-password"
            placeholder="Repetí la nueva contraseña"
            required
          />
          <button
            type="button"
            class="tg-reset-password-toggle"
            data-target="confirm-password"
            aria-label="Mostrar u ocultar contraseña"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
        <p id="tg-reset-password-error-confirm" class="tg-reset-password-field-error" hidden></p>
      </div>

      <button type="submit" id="tg-reset-password-submit" class="tg-reset-password-submit">
        Guardar nueva contraseña
      </button>
    </form>
  `;
}


/** Pantalla inicial completa: shell + card de validacion en curso. */
export function resetPasswordPageTemplate() {
  return resetPasswordShellTemplate(resetPasswordLoadingTemplate());
}

/* ==================== Registro ==================== */

/**
 * Pantalla completa de registro: contiene el formulario Y la vista de
 * exito/reenvio (oculta). 100% estatica: el email del usuario NO se
 * interpola aca — la vista lo inyecta via .textContent (seguro por
 * construccion) y via dataset.email, que ademas viaja de vuelta al
 * backend en el reenvio: escaparlo corromperia el dato.
 */
export function registerPageTemplate() {
  return `
    <header>
      <a class="logo" href="/" data-link>TuGabinete</a>
    </header>

    <section class="register-section">
      <div class="register-card" id="register-card">
        <div class="register-content">
          <div class="register-form-view" id="register-form-view">
            <h2>Crear una cuenta</h2>
            <p>Completá tus datos para comenzar a usar TuGabinete.</p>

            <form id="register-form" novalidate>
              <div class="input-group">
                <label for="name">Nombre completo</label>
                <input type="text" id="name" placeholder="Juana Gomez" required />
              </div>

              <div class="input-group">
                <label for="email">Correo electrónico</label>
                <input type="email" id="email" placeholder="ejemplo@correo.com" required />
              </div>

              <div class="input-group show-password">
                <label for="password">Contraseña</label>
                <input type="password" id="password" placeholder="••••••••" required />
                <i class="fa-solid fa-eye toggle-password" id="toggleEye"></i>
              </div>

              <div class="input-group">
                <label for="confirm-password">Confirmar contraseña</label>
                <input type="password" id="confirm-password" placeholder="••••••••" required />
              </div>

              <div class="terms-check">
                <label class="terms-label">
                  <input type="checkbox" id="acceptTerms" />
                  <span>
                    Acepto
                    <a href="/terms" target="_blank" rel="noopener" class="terms-link">
                      términos y condiciones
                    </a>
                  </span>
                </label>
              </div>

              <button type="submit" id="register-submit-btn">Registrarse</button>

              <p class="login-link">
                ¿Ya tenés cuenta?
                <a href="/login" data-link>Iniciá sesión</a>
              </p>
            </form>
          </div>

          <div
            class="register-success-view"
            id="register-success-view"
            hidden
            aria-live="polite"
          >
            <div class="success-icon">
              <i class="fa-solid fa-envelope-circle-check"></i>
            </div>

            <h2 id="success-title">Verificá tu correo</h2>

            <p class="success-lead" id="success-lead">
              Te enviamos un enlace de verificación al siguiente correo:
            </p>

            <div class="success-email-pill" id="success-email"></div>

            <div class="success-note" id="success-extra">
              El enlace vence en 15 minutos. Si expira, podés reenviarlo desde esta misma pantalla.
            </div>

            <p class="success-footnote">
              Hasta que no verifiques tu cuenta, no vas a poder iniciar sesión.
            </p>

            <div class="success-actions">
              <button
                type="button"
                class="secondary-action-btn"
                id="resend-verification-btn"
              >
                Reenviar correo
              </button>

              <div class="success-resend-hint" id="success-resend-hint">
                Si no te llegó, podés reenviarlo.
              </div>

              <a href="/login" data-link class="success-login-link">
                Ir a iniciar sesión
              </a>
            </div>
          </div>
        </div>
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

    <div id="notification-container" class="notification-container"></div>
  `;
}

/* ==================== Login ==================== */

/**
 * Pantalla completa de login. Estatica: el saludo con el nombre del
 * usuario NO vive aca sino en el toast (components/toast.js), que ya
 * escapa. Los toasts de esta pantalla usan el modo "body-single".
 */
export function loginPageTemplate() {
  return `
    <header>
      <a class="logo" href="/" data-link>TuGabinete</a>
    </header>

    <section class="login-section">
      <div class="login-card">
        <h2>¡Bienvenid@!</h2>
        <p>Ingrese a su cuenta.</p>

        <form id="login-form">
          <div class="input-group">
            <label for="email">Correo electrónico</label>
            <input type="email" id="email" name="email" placeholder="ejemplo@correo.com" required />
          </div>

          <div class="input-group show-password">
            <label for="password">Contraseña</label>
            <input type="password" id="password" name="password" placeholder="••••••••" required />
            <i class="fa-solid fa-eye toggle-password" id="toggleEye"></i>
          </div>

          <div class="extra-links">
            <a href="/recover" data-link>¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit">Ingresar</button>

          <div class="extra-links">
            ¿No tenés cuenta? <a href="/register" data-link>Registrate aquí</a>
          </div>
        </form>
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
  `;
}
