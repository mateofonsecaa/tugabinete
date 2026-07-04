import * as api from "./auth.api.js";
import { verifyPageTemplate } from "./auth.templates.js";
import { showNotification as showToast } from "../../components/toast.js";

// Preserva la presentacion historica de verify: clases tg-verify-*,
// 5 segundos. El escape lo hace el componente.
function showNotification(message, type = "success") {
  showToast(message, type, {
    baseClass: "tg-verify-notification-toast",
    duration: 5000,
  });
}

export function Verify(status) {
  return verifyPageTemplate(status);
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
    const data = await api.resendVerification(email);
    const message =
      data?.error ||
      data?.message ||
      "No se pudo reenviar el correo de verificación.";

    if (data?.code === "VERIFICATION_EMAIL_RESENT") {
      showNotification(message, "success");
      return;
    }

    // 2xx con código inesperado: mismo camino histórico
    showNotification(message, "error");
  } catch (err) {
    // Errores del backend y de red: mensaje resuelto por auth.api.js.
    showNotification(err.message, "error");
  } finally {
    setResendLoadingState(false);
  }
}
