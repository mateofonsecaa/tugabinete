import { loginSession } from "../../core/session.js";
import { loginPageTemplate } from "./auth.templates.js";
import { showNotification as showToast } from "../../components/toast.js";

// Preserva la presentacion historica del login: toast unico colgado
// de <body>, sin icono, 5 segundos. El escape lo hace el componente.
function showNotification(message, type = "success") {
  showToast(message, type, { mode: "body-single", duration: 5000 });
}

export function Login() {
  return loginPageTemplate();
}

function togglePassword() {
  const input = document.getElementById("password");
  const eye = document.getElementById("toggleEye");
  if (input.type === "password") {
    input.type = "text";
    eye.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    eye.classList.replace("fa-eye-slash", "fa-eye");
  }
}

async function loginUser(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = event.target.querySelector('button[type="submit"]');

  if (!email || !password) {
    showNotification("Por favor completá todos los campos.", "error");
    return;
  }

  btn.disabled = true;
  btn.style.opacity = "0.6";
  btn.style.cursor = "not-allowed";

  try {
    const data = await loginSession(email, password);

    showNotification("Bienvenid@ nuevamente, " + data.user.name, "success");

    setTimeout(() => {
      history.pushState(null, "", "/dashboard");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, 800);
  } catch (error) {
    console.error("Login error:", error);
    showNotification(error.message || "No se pudo iniciar sesión.", "error");
  } finally {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
  }
}

export function initLogin() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", loginUser);

  const eye = document.getElementById("toggleEye");
  if (eye) eye.addEventListener("click", togglePassword);
}
