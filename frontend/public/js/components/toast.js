// /public/js/components/toast.js
//
// Notificaciones toast centralizadas. UNICA implementacion de
// showNotification del frontend (reemplaza las tres copias que vivian
// en login, register y verify, cada una interpolando `message` en
// innerHTML sin escapar).
//
// Seguridad: `message` pasa SIEMPRE por escapeHtml. Los mensajes vienen
// del backend (data.error / data.message) o incluyen datos del usuario
// (ej: el nombre en el saludo del login), asi que se tratan como no
// confiables sin excepcion.
//
// Presentacion: parametrizada para preservar pixel a pixel el
// comportamiento historico de cada pantalla:
//   - mode "container"  -> se agrega a un contenedor, clase de tipo,
//                          icono opcional, animacion por clase .show
//                          (comportamiento de register/verify)
//   - mode "body-single" -> un solo toast a la vez, colgado de <body>,
//                          sin icono, animacion por estilos inline
//                          (comportamiento historico del login)

import { escapeHtml } from "../core/utils/security.js";

const ICONS = {
  success: "fa-circle-check",
  error: "fa-triangle-exclamation",
};

export function showNotification(message, type = "success", {
  mode = "container",
  containerId = "notification-container",
  baseClass = "notification-toast",
  withIcon = true,
  duration = 6000,
} = {}) {
  const safeMessage = escapeHtml(message);

  if (mode === "body-single") {
    // --- comportamiento historico del login ---
    const existing = document.querySelector(`.${baseClass}`);
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.classList.add(baseClass);
    if (type === "error") notification.classList.add("error");

    notification.innerHTML = `<span>${safeMessage}</span>`;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 50);

    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(-15px)";
      setTimeout(() => notification.remove(), 400);
    }, duration);

    return;
  }

  // --- comportamiento historico de register/verify ---
  const container = document.getElementById(containerId);
  if (!container) return;

  const notification = document.createElement("div");
  notification.classList.add(baseClass, type);

  const iconMarkup = withIcon
    ? `<i class="fa-solid ${ICONS[type] || ICONS.error}"></i>
    `
    : "";

  notification.innerHTML = `
    ${iconMarkup}<span>${safeMessage}</span>
  `;

  container.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 50);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 400);
  }, duration);
}
