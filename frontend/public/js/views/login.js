import { API_URL } from "../core/config.js";
import { loginSession } from "../core/session.js";

export function Login() {
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

// Notificación
function showNotification(message, type = "success") {
  const existing = document.querySelector(".notification-toast");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.classList.add("notification-toast");

  if (type === "error") notification.classList.add("error");

  notification.innerHTML = `<span>${message}</span>`;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateY(0)";
  }, 50);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(-15px)";
    setTimeout(() => notification.remove(), 400);
  }, 5000);
}

export function initLogin() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", loginUser);

  const eye = document.getElementById("toggleEye");
  if (eye) eye.addEventListener("click", togglePassword);
}
