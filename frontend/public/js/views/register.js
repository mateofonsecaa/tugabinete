import { API_URL } from "../core/config.js";
console.log("REGISTER VERSION 2026-01-20 12:xx");

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
          <div class="input-group">
            <label for="plan">Plan</label>
            <select id="plan" required>
              <option value="" selected disabled>Seleccioná un plan</option>
              <option value="free">Gratis — ARS 0</option>
              <option value="mid">Medio — ARS 12.500 / mes (promo)</option>
              <option value="full">Full — ARS 15.000 / mes (promo)</option>
            </select>
          </div>

          <div id="paymentBox" class="payment-box" hidden>
            <div class="payment-top">
              <div class="payment-title">
                <i class="fa-solid fa-lock"></i>
                Continuar con el pago
              </div>
              <span class="payment-chip" id="paymentChip">-50%</span>
            </div>

            <p class="payment-text" id="paymentText">
              Elegiste un plan pago. Para activarlo, completá el pago seguro.
            </p>

            <div class="payment-actions">
              <a class="payment-btn" id="payMp" href="#" target="_blank" rel="noopener">
                <i class="fa-solid fa-wallet"></i>
                Mercado Pago
              </a>

              <a class="payment-btn secondary" id="payCard" href="#" target="_blank" rel="noopener">
                <i class="fa-solid fa-credit-card"></i>
                Tarjeta
              </a>
            </div>
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
  const planSelect = document.getElementById("plan");

  const payMp = document.getElementById("payMp");
  const payCard = document.getElementById("payCard");

  if (!form) return;

  toggleEye.addEventListener("click", togglePassword);

  // Mostrar/ocultar caja de pago según plan
  planSelect?.addEventListener("change", () => {
    const plan = planSelect.value;
    const box = document.getElementById("paymentBox");
    if (!box) return;

    if (plan === "mid" || plan === "full") {
      box.hidden = false;
    } else {
      box.hidden = true;
    }
  });

  // Clicks de pago (NO crean cuenta; crean checkout)
  payMp?.addEventListener("click", (e) => {
    e.preventDefault();
    startPaidCheckout("mp");
  });

  payCard?.addEventListener("click", (e) => {
    e.preventDefault();
    startPaidCheckout("card");
  });

  // Submit: solo registra si es FREE
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
  const plan = document.getElementById("plan")?.value;

  // Validaciones comunes
  if (!plan) return showNotification("Elegí un plan para continuar.", "error");
  if (!acceptTerms) return showNotification("Debés aceptar los términos y condiciones.", "error");
  if (!name || !email || !password) return showNotification("Completá todos los campos.", "error");
  if (password.length < 6) return showNotification("La contraseña debe tener al menos 6 caracteres.", "error");
  if (!/[A-Z]/.test(password)) return showNotification("La contraseña debe contener al menos una mayúscula.", "error");
  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) return showNotification("La contraseña debe incluir letras y números.", "error");
  if (password !== confirmPassword) return showNotification("Las contraseñas no coinciden.", "error");

  // ✅ Si es pago: NO creamos cuenta acá
  if (plan === "mid" || plan === "full") {
    showNotification("Elegiste un plan pago. Elegí método de pago para continuar.", "success");
    const box = document.getElementById("paymentBox");
    box.hidden = false;
    box.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // ✅ FREE: registrás como ya hacías
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, plan }),
    });

    const data = await res.json();

    if (res.ok) showNotification("Revisá tu correo para verificar tu cuenta.", "success");
    else showNotification(data.message || "Error al registrar usuario.", "error");

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

function showPaymentBox(plan) {
  const box = document.getElementById("paymentBox");
  const payMp = document.getElementById("payMp");
  const payCard = document.getElementById("payCard");
  const paymentText = document.getElementById("paymentText");

  if (!box || !payMp || !payCard || !paymentText) return;

  // Links de pago (pegá tus links reales acá cuando los tengas)
  const PAYMENT_URLS = {
    mid: {
      mp: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=b0e4e569661f447998ad66347220adf7",    // link Mercado Pago (Checkout)
      card: "",  // link para tarjeta (si es distinto)
    },
    full: {
      mp: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=c364ee8ac330406c89e53f9eda8e130d",
      card: "",
    }
  };

  const isPaid = plan === "mid" || plan === "full";
  if (!isPaid) {
    box.hidden = true;
    return;
  }

  const amount = plan === "mid" ? "ARS 12.500" : "ARS 15.000";
  const planName = plan === "mid" ? "Medio" : "Full";

  paymentText.textContent = `Plan ${planName} (${amount}/mes). Completá el pago para activarlo.`;
  payMp.href = PAYMENT_URLS[plan]?.mp || "#";
  payCard.href = PAYMENT_URLS[plan]?.card || "#";

  // Si todavía no hay link configurado, lo dejamos pero avisamos
  const mpUrl = PAYMENT_URLS[plan]?.mp;
  const cardUrl = PAYMENT_URLS[plan]?.card;

  if (!mpUrl) {
    payMp.addEventListener("click", (e) => {
      e.preventDefault();
      showNotification("Falta configurar el link de Mercado Pago en register.js (PAYMENT_URLS).", "error");
    }, { once: true });
  }

  if (!cardUrl) {
    payCard.addEventListener("click", (e) => {
      e.preventDefault();
      showNotification("Falta configurar el link de Tarjeta en register.js (PAYMENT_URLS).", "error");
    }, { once: true });
  }

  box.hidden = false;
  box.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function startPaidCheckout(method) {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const acceptTerms = document.getElementById("acceptTerms")?.checked;
  const plan = document.getElementById("plan")?.value;

  // mismas validaciones (mínimo)
  if (!plan) return showNotification("Elegí un plan.", "error");
  if (!(plan === "mid" || plan === "full")) return showNotification("Elegí un plan pago para continuar.", "error");
  if (!acceptTerms) return showNotification("Debés aceptar los términos.", "error");
  if (!name || !email || !password) return showNotification("Completá nombre, email y contraseña.", "error");
  if (password !== confirmPassword) return showNotification("Las contraseñas no coinciden.", "error");

  try {
    const res = await fetch(`${API_URL}/payments/mp/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, plan, method }),
    });

    const data = await res.json();
    if (!res.ok) return showNotification(data.message || "No se pudo iniciar el pago.", "error");

    // Redirigir al checkout (Mercado Pago)
    window.location.href = data.init_point;

  } catch {
    showNotification("No se pudo conectar con el servidor.", "error");
  }
}
