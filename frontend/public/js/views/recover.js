import { API_URL } from "../core/config.js";

let isSubmittingRecover = false;

function getRecoverFormMarkup() {
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

function getRecoverSuccessMarkup() {
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

export function Recover() {
  return `
    <section class="tg-recover-page">
      <div class="tg-recover-shell">
        <a href="/" data-link class="tg-recover-brand">TuGabinete</a>

        <div id="tg-recover-card" class="tg-recover-card">
          ${getRecoverFormMarkup()}
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

  card.innerHTML = getRecoverSuccessMarkup();

  document
    .getElementById("tg-recover-back-btn")
    ?.addEventListener("click", renderRecoverForm);
}

function renderRecoverForm() {
  const card = document.getElementById("tg-recover-card");
  if (!card) return;

  card.innerHTML = getRecoverFormMarkup();
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
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.code === "PASSWORD_RESET_REQUEST_ACCEPTED") {
      renderRecoverSuccess();
      return;
    }

    if (res.status === 429) {
      setRecoverAlert(
        data?.message ||
          "Demasiados intentos. Esperá unos minutos e intentá nuevamente."
      );
      return;
    }

    setRecoverAlert(
      data?.error ||
        data?.message ||
        "No se pudo procesar la solicitud en este momento."
    );
  } catch {
    setRecoverAlert("No se pudo conectar con el servidor.");
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