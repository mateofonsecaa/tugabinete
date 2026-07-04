import * as api from "./auth.api.js";
import { showNotification } from "../../components/toast.js";
import { registerPageTemplate } from "./auth.templates.js";
import { validatePasswordFields } from "./auth.validation.js";

let isSubmitting = false;
let resendCooldownTimer = null;
let resendCooldownRemaining = 0;

export function Register() {
  return registerPageTemplate();
}

export function initRegister() {
  const form = document.getElementById("register-form");
  const toggleEye = document.getElementById("toggleEye");
  const resendButton = document.getElementById("resend-verification-btn");

  if (!form) return;

  clearResendCooldown();
  isSubmitting = false;

  toggleEye?.addEventListener("click", togglePassword);
  form.addEventListener("submit", registerUser);
  resendButton?.addEventListener("click", handleResendVerification);
}

function togglePassword() {
  const form = document.getElementById("register-form");
  if (form?.dataset.loading === "true") return;

  const input = document.getElementById("password");
  const eye = document.getElementById("toggleEye");

  if (!input || !eye) return;

  if (input.type === "password") {
    input.type = "text";
    eye.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    eye.classList.replace("fa-eye-slash", "fa-eye");
  }
}

function setRegisterLoadingState(loading) {
  const form = document.getElementById("register-form");
  const submitButton = document.getElementById("register-submit-btn");
  const inputs = form?.querySelectorAll("input");
  const toggleEye = document.getElementById("toggleEye");

  if (!form || !submitButton || !inputs) return;

  form.dataset.loading = loading ? "true" : "false";
  form.classList.toggle("is-loading", loading);

  inputs.forEach((input) => {
    input.disabled = loading;
  });

  submitButton.disabled = loading;
  submitButton.innerHTML = loading
    ? `
      <span class="submit-spinner" aria-hidden="true"></span>
      <span>Creando cuenta...</span>
    `
    : "Registrarse";

  if (toggleEye) {
    toggleEye.classList.toggle("is-disabled", loading);
  }
}

function clearResendCooldown() {
  if (resendCooldownTimer) {
    clearInterval(resendCooldownTimer);
    resendCooldownTimer = null;
  }

  resendCooldownRemaining = 0;
}

function setResendButtonState({ loading = false, seconds = 0 } = {}) {
  const resendButton = document.getElementById("resend-verification-btn");
  const resendHint = document.getElementById("success-resend-hint");

  if (!resendButton || !resendHint) return;

  if (loading) {
    resendButton.disabled = true;
    resendButton.innerHTML = `
      <span class="submit-spinner" aria-hidden="true"></span>
      <span>Reenviando...</span>
    `;
    resendHint.textContent = "Estamos enviando un nuevo correo de verificación.";
    return;
  }

  if (seconds > 0) {
    resendButton.disabled = true;
    resendButton.textContent = `Reenviar correo (${seconds}s)`;
    resendHint.textContent = `Podrás reenviarlo otra vez en ${seconds} segundos.`;
    return;
  }

  resendButton.disabled = false;
  resendButton.textContent = "Reenviar correo";
  resendHint.textContent = "Si no te llegó, podés reenviarlo.";
}

function startResendCooldown(seconds = 60) {
  clearResendCooldown();

  resendCooldownRemaining = seconds;
  setResendButtonState({ seconds: resendCooldownRemaining });

  resendCooldownTimer = setInterval(() => {
    const successView = document.getElementById("register-success-view");

    if (!successView || successView.hidden) {
      clearResendCooldown();
      return;
    }

    resendCooldownRemaining -= 1;

    if (resendCooldownRemaining <= 0) {
      clearResendCooldown();
      setResendButtonState();
      return;
    }

    setResendButtonState({ seconds: resendCooldownRemaining });
  }, 1000);
}

async function handleResendVerification() {
  const successView = document.getElementById("register-success-view");
  const email = successView?.dataset?.email?.trim();

  if (!email) {
    showNotification(
      "No se encontró el correo para reenviar la verificación.",
      "error"
    );
    return;
  }

  setResendButtonState({ loading: true });

  try {
    const data = await api.resendVerification(email);
    const message =
      data?.error ||
      data?.message ||
      "No se pudo reenviar el correo de verificación.";

    if (data?.code === "VERIFICATION_EMAIL_RESENT") {
      showNotification(message, "success");
      startResendCooldown(60);
      return;
    }

    // 2xx con código inesperado: mismo camino histórico
    setResendButtonState();
    showNotification(message, "error");
  } catch (err) {
    // EMAIL_ALREADY_VERIFIED, PENDING_ACCOUNT_NOT_FOUND, MAIL_SEND_FAILED
    // y red: todos mostraban err.message; el boton se rehabilita igual.
    setResendButtonState();
    showNotification(err.message, "error");
  }
}

function showVerificationState(email, variant = "created") {
  const card = document.getElementById("register-card");
  const formView = document.getElementById("register-form-view");
  const successView = document.getElementById("register-success-view");
  const successTitle = document.getElementById("success-title");
  const successLead = document.getElementById("success-lead");
  const successEmail = document.getElementById("success-email");
  const successExtra = document.getElementById("success-extra");

  if (
    !card ||
    !formView ||
    !successView ||
    !successTitle ||
    !successLead ||
    !successEmail ||
    !successExtra
  ) {
    return;
  }

  if (variant === "pending") {
    successTitle.textContent = "Tu cuenta ya fue creada";
    successLead.textContent =
      "Ese correo ya está registrado, pero todavía tenés que verificarlo:";
  } else {
    successTitle.textContent = "Verificá tu correo";
    successLead.textContent =
      "Te enviamos un enlace de verificación al siguiente correo:";
  }

  successEmail.textContent = email;
  successView.dataset.email = email;
  successExtra.textContent =
    "El enlace vence en 15 minutos. Si expira, podés reenviarlo desde esta misma pantalla.";

  formView.hidden = true;
  successView.hidden = false;
  card.classList.add("is-success");

  startResendCooldown(60);
}

async function registerUser(event) {
  event.preventDefault();

  if (isSubmitting) return;

  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;
  const confirmPassword = document.getElementById("confirm-password")?.value;
  const acceptTerms = document.getElementById("acceptTerms")?.checked;

  if (!acceptTerms) {
    return showNotification("Debés aceptar los términos y condiciones.", "error");
  }

  if (!name || !email || !password || !confirmPassword) {
    return showNotification("Completá todos los campos.", "error");
  }

  // Política unificada (Paso 7): la misma de reset-password
  // (≥10, ≤72 bytes, denylist), primer error via toast.
  const passwordErrors = validatePasswordFields(password, confirmPassword);
  const firstPasswordError = passwordErrors.password || passwordErrors.confirmPassword;

  if (firstPasswordError) {
    return showNotification(firstPasswordError, "error");
  }

  isSubmitting = true;
  setRegisterLoadingState(true);

  try {
    const data = await api.registerAccount({ name, email, password });

    // Caso 1: usuario nuevo, correo enviado
    if (data?.code === "VERIFY_EMAIL_SENT") {
      showVerificationState(data?.email || email, "created");
      return;
    }

    // Caso 2: usuario ya existente pero NO verificado, correo reenviado
    if (data?.code === "EMAIL_ALREADY_PENDING_VERIFICATION") {
      showVerificationState(data?.email || email, "pending");
      return;
    }

    // 2xx con código inesperado: mismo fallback histórico
    showNotification(
      data?.error || data?.message || "Error al registrar usuario.",
      "error"
    );
  } catch (err) {
    // Errores del backend (EMAIL_ALREADY_REGISTERED, MAIL_SEND_FAILED,
    // etc.) y de red: el mensaje ya viene resuelto por auth.api.js.
    showNotification(err.message, "error");
  } finally {
    const successView = document.getElementById("register-success-view");
    const successVisible = successView && successView.hidden === false;

    if (!successVisible) {
      setRegisterLoadingState(false);
    }

    isSubmitting = false;
  }
}
