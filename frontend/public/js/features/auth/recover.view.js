import * as api from "./auth.api.js";
import {
  recoverPageTemplate,
  recoverFormTemplate,
  recoverSuccessTemplate,
} from "./auth.templates.js";

let isSubmittingRecover = false;

export function Recover() {
  return recoverPageTemplate();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function setRecoverAlert(message, type = "error") {
  const alert = document.getElementById("tg-recover-alert");
  if (!alert) return;

  alert.hidden = false;
  alert.className = `tg-recover-alert ${type === "success" ? "is-success" : "is-error"}`;
  alert.textContent = message;
}

function clearRecoverAlert() {
  const alert = document.getElementById("tg-recover-alert");
  if (!alert) return;

  alert.hidden = true;
  alert.textContent = "";
  alert.className = "tg-recover-alert";
}

function setEmailError(message = "") {
  const error = document.getElementById("tg-recover-email-error");
  const input = document.getElementById("recover-email");

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

function setRecoverLoadingState(loading) {
  const form = document.getElementById("tg-recover-form");
  const input = document.getElementById("recover-email");
  const button = document.getElementById("tg-recover-submit");

  if (!form || !input || !button) return;

  form.dataset.loading = loading ? "true" : "false";
  input.disabled = loading;
  button.disabled = loading;

  button.innerHTML = loading
    ? `
      <span class="tg-recover-spinner" aria-hidden="true"></span>
      <span>Enviando...</span>
    `
    : "Enviar enlace";
}

function renderRecoverSuccess() {
  const card = document.getElementById("tg-recover-card");
  if (!card) return;

  card.innerHTML = recoverSuccessTemplate();

  document
    .getElementById("tg-recover-back-btn")
    ?.addEventListener("click", renderRecoverForm);
}

function renderRecoverForm() {
  const card = document.getElementById("tg-recover-card");
  if (!card) return;

  card.innerHTML = recoverFormTemplate();
  initRecover();
}

async function handleRecoverSubmit(event) {
  event.preventDefault();

  if (isSubmittingRecover) return;

  clearRecoverAlert();
  setEmailError();

  const emailInput = document.getElementById("recover-email");
  const email = emailInput?.value.trim() || "";

  if (!email) {
    setEmailError("Ingresá tu correo electrónico.");
    return;
  }

  if (!isValidEmail(email)) {
    setEmailError("Ingresá un correo electrónico válido.");
    return;
  }

  isSubmittingRecover = true;
  setRecoverLoadingState(true);

  try {
    const data = await api.forgotPassword(email);

    if (data?.code === "PASSWORD_RESET_REQUEST_ACCEPTED") {
      renderRecoverSuccess();
      return;
    }

    // 2xx con código inesperado: mismo fallback histórico
    setRecoverAlert(
      data?.error ||
        data?.message ||
        "No se pudo procesar la solicitud en este momento."
    );
  } catch (err) {
    // 429 histórico: prefería data.message con su propio fallback.
    if (err.status === 429) {
      setRecoverAlert(
        err.body?.message ||
          "Demasiados intentos. Esperá unos minutos e intentá nuevamente."
      );
      return;
    }

    // Resto (incluida red): el mensaje ya viene resuelto por auth.api.js.
    setRecoverAlert(err.message);
  } finally {
    isSubmittingRecover = false;
    setRecoverLoadingState(false);
  }
}

export function initRecover() {
  const form = document.getElementById("tg-recover-form");
  const input = document.getElementById("recover-email");

  if (!form) return;

  isSubmittingRecover = false;

  form.addEventListener("submit", handleRecoverSubmit);

  input?.addEventListener("input", () => {
    setEmailError();
    clearRecoverAlert();
  });
}