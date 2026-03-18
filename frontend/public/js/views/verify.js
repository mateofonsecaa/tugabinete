import { API_URL } from "../core/config.js";

export function Verify(status) {
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

          <h2>${view.title}</h2>
          <p>${view.message}</p>

          <div class="tg-verify-dynamic-content">
            ${view.actions}
          </div>
        </div>
      </div>

      <div id="notification-container" class="tg-verify-notification-container"></div>
    </section>
  `;
}

export function initVerify() {
  const loginBtn = document.getElementById("go-login");
  const resendForm = document.getElementById("resend-verification-form");

  loginBtn?.addEventListener("click", goToLogin);
  resendForm?.addEventListener("submit", handleResendVerification);
}

function goToLogin() {
  history.pushState(null, "", "/login");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function setResendLoadingState(loading) {
  const emailInput = document.getElementById("resend-email");
  const resendButton = document.getElementById("resend-verification-btn");

  if (!emailInput || !resendButton) return;

  emailInput.disabled = loading;
  resendButton.disabled = loading;

  resendButton.innerHTML = loading
    ? `
      <span class="tg-verify-submit-spinner" aria-hidden="true"></span>
      <span>Reenviando...</span>
    `
    : "Reenviar correo";
}

async function handleResendVerification(event) {
  event.preventDefault();

  const emailInput = document.getElementById("resend-email");
  const email = emailInput?.value.trim();

  if (!email) {
    showNotification("Ingresá tu correo electrónico.", "error");
    return;
  }

  setResendLoadingState(true);

  try {
    const res = await fetch(`${API_URL}/auth/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      return;
    }

    showNotification(message, "error");
  } catch {
    showNotification("No se pudo conectar con el servidor.", "error");
  } finally {
    setResendLoadingState(false);
  }
}

function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const notification = document.createElement("div");
  notification.classList.add("tg-verify-notification-toast", type);

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
  }, 5000);
}