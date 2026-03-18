import { API_URL } from "../core/config.js";
console.log("REGISTER VERSION 2026-03-18");

let isSubmitting = false;
let resendCooldownTimer = null;
let resendCooldownRemaining = 0;

export function Register() {
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
    const res = await fetch(`${API_URL}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    const code = data?.code;
    const message =
      data?.error ||
      data?.message ||
      "No se pudo reenviar el correo de verificación.";

    if (res.ok && code === "VERIFICATION_EMAIL_RESENT") {
      showNotification(message, "success");
      startResendCooldown(60);
      return;
    }

    setResendButtonState();

    if (code === "EMAIL_ALREADY_VERIFIED") {
      showNotification(message, "error");
      return;
    }

    if (code === "PENDING_ACCOUNT_NOT_FOUND") {
      showNotification(message, "error");
      return;
    }

    if (code === "MAIL_SEND_FAILED") {
      showNotification(message, "error");
      return;
    }

    showNotification(message, "error");
  } catch {
    setResendButtonState();
    showNotification("No se pudo conectar con el servidor.", "error");
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

  if (password.length < 6) {
    return showNotification("La contraseña debe tener al menos 6 caracteres.", "error");
  }

  if (!/[A-Z]/.test(password)) {
    return showNotification("La contraseña debe contener al menos una mayúscula.", "error");
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
    return showNotification("La contraseña debe incluir letras y números.", "error");
  }

  if (password !== confirmPassword) {
    return showNotification("Las contraseñas no coinciden.", "error");
  }

  isSubmitting = true;
  setRegisterLoadingState(true);

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json().catch(() => ({}));
    const code = data?.code;
    const message =
      data?.error || data?.message || "Error al registrar usuario.";

    // Caso 1: usuario nuevo, correo enviado
    if (res.ok && code === "VERIFY_EMAIL_SENT") {
      showVerificationState(data?.email || email, "created");
      return;
    }

    // Caso 2: usuario ya existente pero NO verificado, correo reenviado
    if (res.ok && code === "EMAIL_ALREADY_PENDING_VERIFICATION") {
      showVerificationState(data?.email || email, "pending");
      return;
    }

    // Caso 3: cuenta ya verificada => error normal, NO pantalla de verificación
    if (code === "EMAIL_ALREADY_REGISTERED") {
      showNotification(message, "error");
      return;
    }

    // Caso 4: fallo al enviar mail
    if (code === "MAIL_SEND_FAILED") {
      showNotification(message, "error");
      return;
    }

    // Fallback para cualquier otro caso
    showNotification(message, "error");
  } catch {
    showNotification("No se pudo conectar con el servidor.", "error");
  } finally {
    const successView = document.getElementById("register-success-view");
    const successVisible = successView && successView.hidden === false;

    if (!successVisible) {
      setRegisterLoadingState(false);
    }

    isSubmitting = false;
  }
}

function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const notification = document.createElement("div");
  notification.classList.add("notification-toast", type);

  notification.innerHTML = `
    <i class="fa-solid ${
      type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"
    }"></i>
    <span>${message}</span>
  `;

  container.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 50);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 400);
  }, 6000);
}