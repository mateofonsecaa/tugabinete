export function Verify(status) {
  const isSuccess = status === "success";

  return `
    <section class="login-section">
      <div class="login-card">
        <h2>${isSuccess ? "Cuenta verificada" : "Error de verificación"}</h2>
        <p>
          ${isSuccess ? "Tu cuenta fue verificada correctamente. Ya podés iniciar sesión." : "El enlace de verificación es inválido o ya fue utilizado."}
        </p>
        <button id="go-login" class="btn-login">Ir a iniciar sesión</button>
      </div>
    </section>
  `;
}

export function initVerify() {
  const btn = document.getElementById("go-login");

  if (btn) {
    btn.addEventListener("click", () => {
      history.pushState(null, "", "/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  }
}
