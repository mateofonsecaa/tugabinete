import * as api from "./auth.api.js";
import { validatePasswordFields } from "./auth.validation.js";
import {
  resetPasswordPageTemplate,
  resetPasswordFormTemplate,
  resetPasswordSuccessTemplate,
  resetPasswordStatusTemplate,
} from "./auth.templates.js";

let currentResetToken = "";
let isSubmittingReset = false;

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
    const data = await api.resetPassword({
      token: currentResetToken,
      password,
      confirmPassword,
    });

    if (data?.code === "PASSWORD_RESET_SUCCESS") {
      renderInsideCard(resetPasswordSuccessTemplate());
      return;
    }

    // 2xx con código inesperado: mismo fallback histórico
    setFormAlert(
      data?.error ||
        data?.message ||
        "No se pudo actualizar la contraseña en este momento."
    );
  } catch (err) {
    const body = err.body || {};

    if (body.fieldErrors?.password) {
      setFieldError("password", body.fieldErrors.password);
    }

    if (body.fieldErrors?.confirmPassword) {
      setFieldError("confirmPassword", body.fieldErrors.confirmPassword);
    }

    if (err.code === "INVALID_RESET_TOKEN") {
      renderInsideCard(
        resetPasswordStatusTemplate({
          title: "Enlace inválido",
          text: body.message,
          icon: "fa-triangle-exclamation",
        })
      );
      return;
    }

    if (err.code === "EXPIRED_RESET_TOKEN") {
      renderInsideCard(
        resetPasswordStatusTemplate({
          title: "Enlace vencido",
          text: body.message,
          icon: "fa-clock",
        })
      );
      return;
    }

    if (err.code === "USED_RESET_TOKEN") {
      renderInsideCard(
        resetPasswordStatusTemplate({
          title: "Enlace ya utilizado",
          text: body.message,
          icon: "fa-link-slash",
        })
      );
      return;
    }

    // Resto (incluida red): mensaje resuelto por auth.api.js.
    setFormAlert(err.message);
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
      resetPasswordStatusTemplate({
        title: "Enlace inválido",
        text: "El enlace de recuperación es inválido o incompleto.",
        icon: "fa-triangle-exclamation",
      })
    );
    return;
  }

  try {
    const data = await api.validateResetToken(currentResetToken);

    if (data?.code === "VALID_RESET_TOKEN") {
      renderInsideCard(resetPasswordFormTemplate());
      bindResetForm();
      return;
    }

    // 2xx con código inesperado: misma card histórica de enlace inválido
    renderInsideCard(
      resetPasswordStatusTemplate({
        title: "Enlace inválido",
        text:
          data?.message ||
          "El enlace de recuperación es inválido o no existe.",
        icon: "fa-triangle-exclamation",
      })
    );
  } catch (err) {
    if (err.code === "NETWORK_ERROR") {
      renderInsideCard(
        resetPasswordStatusTemplate({
          title: "Error de conexión",
          text:
            "No se pudo validar el enlace en este momento. Intentá nuevamente en unos minutos.",
          icon: "fa-plug-circle-xmark",
        })
      );
      return;
    }

    if (err.code === "EXPIRED_RESET_TOKEN") {
      renderInsideCard(
        resetPasswordStatusTemplate({
          title: "Enlace vencido",
          text: err.body?.message,
          icon: "fa-clock",
        })
      );
      return;
    }

    if (err.code === "USED_RESET_TOKEN") {
      renderInsideCard(
        resetPasswordStatusTemplate({
          title: "Enlace ya utilizado",
          text: err.body?.message,
          icon: "fa-link-slash",
        })
      );
      return;
    }

    if (err.status === 429) {
      renderInsideCard(
        resetPasswordStatusTemplate({
          title: "Demasiados intentos",
          text:
            err.body?.message ||
            "Esperá unos minutos antes de volver a validar el enlace.",
          icon: "fa-hourglass-half",
        })
      );
      return;
    }

    renderInsideCard(
      resetPasswordStatusTemplate({
        title: "Enlace inválido",
        text:
          err.body?.message ||
          "El enlace de recuperación es inválido o no existe.",
        icon: "fa-triangle-exclamation",
      })
    );
  }
}

export function ResetPassword() {
  return resetPasswordPageTemplate();
}

export function initResetPassword() {
  const params = new URLSearchParams(window.location.search);
  currentResetToken = params.get("token") || "";
  isSubmittingReset = false;
  validateTokenAndRender();
}