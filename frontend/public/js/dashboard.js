// =========================================================
// dashboard.js — versión PRO + Prefetch Inteligente
// =========================================================

import { API_URL } from "./core/config.js";
import { authFetch } from "./core/authFetch.js";

// ---------------------------------------------------------
// PREFETCH PRO — acelera la PRIMER carga de todas las páginas
// ---------------------------------------------------------
async function prefetchData() {
    try {
        await Promise.all([
            // 🧑‍⚕️ Pacientes
            authFetch(`${API_URL}/patients`).then(r => r.json()).catch(() => null),

            // 💆‍♀️ Tratamientos (appointments = tratamientos)
            authFetch(`${API_URL}/appointments`).then(r => r.json()).catch(() => null),

            // 📅 Agenda (simple)
            authFetch(`${API_URL}/simple`).then(r => r.json()).catch(() => null),
        ]);

    } catch (err) {
        console.warn("Prefetch falló:", err);
    }
}

// Guardar versiones compactas desde el prefetch
function prefetchSave(key, compactFn) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return; // No pisar si la página ya guardó algo más nuevo

        const data = JSON.parse(raw);
        const compact = compactFn(data);
        localStorage.setItem(key, JSON.stringify(compact));
    } catch {}
}

// ---------------------------------------------------------
// Cargar usuario al iniciar dashboard
// ---------------------------------------------------------
async function loadUserData() {
    const userNameEl = document.getElementById("username");

    try {
        const res = await authFetch(`${API_URL}/auth/me`, {
            method: "GET",
        });

        if (!res || !res.ok) {
            showNotification("Sesión inválida. Iniciá sesión nuevamente.", "error");
            return redirectToLogin();
        }

        const data = await res.json();

        // 🧑‍⚕️ Mostrar nombre del profesional
        userNameEl.textContent = data.name || "Profesional";

    } catch (error) {
        console.error("Error de conexión:", error);
        showNotification("Error al conectar con el servidor.", "error");
        redirectToLogin();
    }
}

// ---------------------------------------------------------
// NOTIFICACIONES
// ---------------------------------------------------------
function showNotification(message, type = "success") {
    const container = document.querySelector(".notification-container") || createContainer();
    const notification = document.createElement("div");

    notification.classList.add("notification-toast", type);
    notification.innerHTML = `
        <i class="fa-solid ${type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}"></i>
        <span>${message}</span>
    `;

    Object.assign(notification.style, {
        background: type === "success" ? "#90d26d" : "#ff7171",
        color: "white",
        padding: "14px 22px",
        borderRadius: "10px",
        marginTop: "10px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontWeight: "500",
        boxShadow: "0 6px 25px rgba(0,0,0,0.15)",
        opacity: "0",
        transform: "translateY(-10px)",
        transition: "all 0.4s ease",
    });

    container.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateY(0)";
    }, 50);

    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateY(-10px)";
        setTimeout(() => notification.remove(), 400);
    }, 5000);

    if (container.childElementCount > 3) container.firstChild.remove();
}

function createContainer() {
    const div = document.createElement("div");
    div.classList.add("notification-container");

    Object.assign(div.style, {
        position: "fixed",
        top: "25px",
        right: "25px",
        zIndex: "9999",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
    });

    document.body.appendChild(div);
    return div;
}

// ---------------------------------------------------------
// Redirección segura a login
// ---------------------------------------------------------
function redirectToLogin() {
    setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "../login/login.html";
    }, 2500);
}

// ---------------------------------------------------------
// Ejecutar al cargar la página
// ---------------------------------------------------------
window.addEventListener("load", () => {
    loadUserData();
    prefetchData(); // 🚀 Prefetch automático
});
