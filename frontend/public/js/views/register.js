export function Register() {
  return `
    <header>
      <a class="logo" href="/" data-link>TuGabinete</a>
    </header>

    <section class="register-section">
      <div class="register-card">
        <h2>Crear una cuenta</h2>
        <p>Completá tus datos para comenzar a usar TuGabinete.</p>

        <form id="register-form">
          <div class="input-group">
            <label for="name">Nombre completo</label>
            <input type="text" id="name" required />
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
          <button type="submit">Registrarse</button>

          <p class="login-link">
            ¿Ya tenés cuenta?
            <a href="/login" data-link>Iniciá sesión</a>
          </p>
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
      © 2025 TuGabinete — Todos los derechos reservados.
    </div>

    <div id="notification-container" class="notification-container"></div>
  `;
}

export function initRegister() {
  const form = document.getElementById("register-form");
  const toggleEye = document.getElementById("toggleEye");

  if (!form) return;

  toggleEye.addEventListener("click", togglePassword);
  form.addEventListener("submit", registerUser);
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

async function registerUser(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const acceptTerms = document.getElementById("acceptTerms")?.checked;

  if (!acceptTerms) {
    showNotification("Debés aceptar los términos y condiciones para registrarte.", "error");
    return;
  }

  if (!name || !email || !password) {
    showNotification("Por favor completá todos los campos.", "error");
    return;
  }

  if (password.length < 6) {
    showNotification("La contraseña debe tener al menos 6 caracteres.", "error");
    return;
  }

  if (!/[A-Z]/.test(password)) {
    showNotification("La contraseña debe contener al menos una letra mayúscula.", "error");
    return;
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
    showNotification("La contraseña debe incluir letras y números.", "error");
    return;
    }

  if (password !== confirmPassword) {
    showNotification("Las contraseñas no coinciden.", "error");
    return;
  }

  try {
    const res = await fetch("http://localhost:4000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      showNotification("Revisá tu correo para verificar tu cuenta.", "success");
    } else {
      showNotification(data.message || "Error al registrar usuario.", "error");
    }
  } catch {
    showNotification("No se pudo conectar con el servidor.", "error");
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
