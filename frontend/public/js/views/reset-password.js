import { API_URL } from "../core/config.js";

let currentResetToken = "";
let isSubmittingReset = false;

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "123123123",
  "password",
  "password123",
  "qwerty123",
  "qwertyuiop",
  "admin123",
  "contraseña",
  "tucontraseña",
  "abcdef123",
]);

function getByteLength(value) {
  return new TextEncoder().encode(String(value)).length;
}

function isCommonPassword(value) {
  return COMMON_PASSWORDS.has(String(value).toLowerCase().replace(/\s+/g, ""));
}

function validatePasswordFields(password, confirmPassword) {
  const errors = {};

  if (!password) {
    errors.password = "Ingresá una nueva contraseña.";
  } else if (/^\s+$/.test(password)) {
    errors.password = "La contraseña no puede estar formada solo por espacios.";
  } else if (password.length < 10) {
    errors.password = "La contraseña debe tener al menos 10 caracteres.";
  } else if (getByteLength(password) > 72) {
    errors.password =
      "La contraseña es demasiado larga para el sistema actual. Usá hasta 72 bytes UTF-8.";
  } else if (isCommonPassword(password)) {
    errors.password = "Esa contraseña es demasiado común. Elegí otra.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirmá la nueva contraseña.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

function getShellMarkup(innerMarkup) {
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

function getLoadingMarkup() {
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

function getStatusMarkup({ title, text, icon, variant = "error" }) {
  return `
    <div class="tg-reset-password-icon ${variant === "success" ? "is-success" : "is-error"}">
      <i class="fa-solid ${icon}"></i>
    </div>

    <h1 class="tg-reset-password-title">${title}</h1>
    <p class="tg-reset-password-text">${text}</p>

    <div class="tg-reset-password-actions">
      <a href="/recover" data-link class="tg-reset-password-primary-link">Solicitar un nuevo enlace</a>
      <a href="/login" data-link class="tg-reset-password-secondary-link">Volver a iniciar sesión</a>
    </div>
  `;
}

function getSuccessMarkup() {
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

function getFormMarkup() {
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
          Mínimo 10 caracteres. Máximo 72 bytes UTF-8 por compatibilidad con el sistema actual.
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

function renderInsideCard(markup) {
  const card = document.getElementById("tg-reset-password-card");
  if (!card) return;
  card.innerHTML = markup;
}

function setFieldError(field, message = "") {
  const errorMap = {
    password: "tg-reset-password-error-password",
    confirmPassword: "tg-reset-password-error-confirm",
  };

  const inputMap = {
    password: "new-password",
    confirmPassword: "confirm-password",
  };

  const error = document.getElementById(errorMap[field]);
  const input = document.getElementById(inputMap[field]);

  if (!error || !input) return;

  if (!message) {
    error.hidden = true;
    error.textContent = "";
    input.classList.remove("is-invalid");
    return;
  }

  error.hidden = false;
  error.textContent = message;
  input.classList.add("is-invalid");
}

function clearFieldErrors() {
  setFieldError("password");
  setFieldError("confirmPassword");
}

function setFormAlert(message, type = "error") {
  const alert = document.getElementById("tg-reset-password-alert");
  if (!alert) return;

  alert.hidden = false;
  alert.className = `tg-reset-password-alert ${type === "success" ? "is-success" : "is-error"}`;
  alert.textContent = message;
}

function clearFormAlert() {
  const alert = document.getElementById("tg-reset-password-alert");
  if (!alert) return;

  alert.hidden = true;
  alert.textContent = "";
  alert.className = "tg-reset-password-alert";
}

function setResetLoadingState(loading) {
  const passwordInput = document.getElementById("new-password");
  const confirmInput = document.getElementById("confirm-password");
  const submit = document.getElementById("tg-reset-password-submit");
  const toggles = document.querySelectorAll(".tg-reset-password-toggle");

  if (!submit) return;

  passwordInput && (passwordInput.disabled = loading);
  confirmInput && (confirmInput.disabled = loading);
  toggles.forEach((toggle) => {
    toggle.disabled = loading;
  });

  submit.disabled = loading;
  submit.innerHTML = loading
    ? `
      <span class="tg-reset-password-spinner" aria-hidden="true"></span>
      <span>Guardando...</span>
    `
    : "Guardar nueva contraseña";
}

function bindPasswordToggles() {
  document.querySelectorAll(".tg-reset-password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);
      const icon = button.querySelector("i");

      if (!input || !icon || button.disabled) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      icon.classList.toggle("fa-eye", !isPassword);
      icon.classList.toggle("fa-eye-slash", isPassword);
    });
  });
}

async function handleResetSubmit(event) {
  event.preventDefault();

  if (isSubmittingReset) return;

  clearFieldErrors();
  clearFormAlert();

  const password = document.getElementById("new-password")?.value || "";
  const confirmPassword = document.getElementById("confirm-password")?.value || "";

  const errors = validatePasswordFields(password, confirmPassword);

  if (errors.password) {
    setFieldError("password", errors.password);
  }

  if (errors.confirmPassword) {
    setFieldError("confirmPassword", errors.confirmPassword);
  }

  if (Object.keys(errors).length > 0) {
    return;
  }

  isSubmittingReset = true;
  setResetLoadingState(true);

  try {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: currentResetToken,
        password,
        confirmPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.code === "PASSWORD_RESET_SUCCESS") {
      renderInsideCard(getSuccessMarkup());
      return;
    }

    if (data?.fieldErrors?.password) {
      setFieldError("password", data.fieldErrors.password);
    }

    if (data?.fieldErrors?.confirmPassword) {
      setFieldError("confirmPassword", data.fieldErrors.confirmPassword);
    }

    if (data?.code === "INVALID_RESET_TOKEN") {
      renderInsideCard(
        getStatusMarkup({
          title: "Enlace inválido",
          text: data.message,
          icon: "fa-triangle-exclamation",
        })
      );
      return;
    }

    if (data?.code === "EXPIRED_RESET_TOKEN") {
      renderInsideCard(
        getStatusMarkup({
          title: "Enlace vencido",
          text: data.message,
          icon: "fa-clock",
        })
      );
      return;
    }

    if (data?.code === "USED_RESET_TOKEN") {
      renderInsideCard(
        getStatusMarkup({
          title: "Enlace ya utilizado",
          text: data.message,
          icon: "fa-link-slash",
        })
      );
      return;
    }

    setFormAlert(
      data?.error ||
        data?.message ||
        "No se pudo actualizar la contraseña en este momento."
    );
  } catch {
    setFormAlert("No se pudo conectar con el servidor.");
  } finally {
    isSubmittingReset = false;
    setResetLoadingState(false);
  }
}

function bindResetForm() {
  const form = document.getElementById("tg-reset-password-form");
  const passwordInput = document.getElementById("new-password");
  const confirmInput = document.getElementById("confirm-password");

  if (!form) return;

  form.addEventListener("submit", handleResetSubmit);

  passwordInput?.addEventListener("input", () => {
    setFieldError("password");
    clearFormAlert();
  });

  confirmInput?.addEventListener("input", () => {
    setFieldError("confirmPassword");
    clearFormAlert();
  });

  bindPasswordToggles();
}

async function validateTokenAndRender() {
  if (!currentResetToken) {
    renderInsideCard(
      getStatusMarkup({
        title: "Enlace inválido",
        text: "El enlace de recuperación es inválido o incompleto.",
        icon: "fa-triangle-exclamation",
      })
    );
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/reset-password/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: currentResetToken }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.code === "VALID_RESET_TOKEN") {
      renderInsideCard(getFormMarkup());
      bindResetForm();
      return;
    }

    if (data?.code === "EXPIRED_RESET_TOKEN") {
      renderInsideCard(
        getStatusMarkup({
          title: "Enlace vencido",
          text: data.message,
          icon: "fa-clock",
        })
      );
      return;
    }

    if (data?.code === "USED_RESET_TOKEN") {
      renderInsideCard(
        getStatusMarkup({
          title: "Enlace ya utilizado",
          text: data.message,
          icon: "fa-link-slash",
        })
      );
      return;
    }

    if (res.status === 429) {
      renderInsideCard(
        getStatusMarkup({
          title: "Demasiados intentos",
          text:
            data?.message ||
            "Esperá unos minutos antes de volver a validar el enlace.",
          icon: "fa-hourglass-half",
        })
      );
      return;
    }

    renderInsideCard(
      getStatusMarkup({
        title: "Enlace inválido",
        text:
          data?.message ||
          "El enlace de recuperación es inválido o no existe.",
        icon: "fa-triangle-exclamation",
      })
    );
  } catch {
    renderInsideCard(
      getStatusMarkup({
        title: "Error de conexión",
        text:
          "No se pudo validar el enlace en este momento. Intentá nuevamente en unos minutos.",
        icon: "fa-plug-circle-xmark",
      })
    );
  }
}

export function ResetPassword() {
  return getShellMarkup(getLoadingMarkup());
}

export function initResetPassword() {
  const params = new URLSearchParams(window.location.search);
  currentResetToken = params.get("token") || "";
  isSubmittingReset = false;
  validateTokenAndRender();
}