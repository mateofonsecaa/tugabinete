import { API_URL } from "../../core/config.js";
import { authFetch } from "../../core/authFetch.js";

export function getCachedUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export async function fetchUser() {
  const res = await authFetch(`${API_URL}/auth/me`);
  if (!res.ok) return null;
  const user = await res.json();
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

export function renderUser(user) {
  document.getElementById("userName").textContent = user.name || "—";
  document.getElementById("professionLabel").textContent = user.profession || "—";
  document.getElementById("userEmail").textContent = user.email || "—";
  document.getElementById("userPhone").textContent = user.phone || "—";

  const img = document.querySelector(".profile-pic");
  img.src = user.profileImage || "/images/personaejemplo.png";
}

export async function loadStats() {
  const res = await authFetch(`${API_URL}/stats`);
  if (!res.ok) return;

  const stats = await res.json();
  const spans = document.querySelectorAll(".stat span");

  spans[0].textContent = stats.totalAppointments ?? "0";
  spans[1].textContent = stats.completedAppointments ?? "0";
  spans[2].textContent = stats.totalPatients ?? "0";
  spans[3].textContent = stats.upcomingAppointments ?? "0";
}

export async function loadAppointments() {
  const res = await authFetch(`${API_URL}/simple`);
  if (!res.ok) return;

  const data = await res.json();
  const now = Date.now();

  const upcoming = data
    .filter(a => new Date(a.date).getTime() >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const container = document.querySelector(".turnos");
  container.innerHTML = `<h3>Próximos turnos</h3>`;

  if (!upcoming.length) {
    container.innerHTML += `<p style="color:#777;">No hay turnos próximos.</p>`;
    return;
  }

  let html = `
    <table class="tabla-turnos">
      <thead>
        <tr><th>Nombre</th><th>Hora</th><th>Fecha</th></tr>
      </thead>
      <tbody>
  `;

  upcoming.forEach(a => {
    const d = new Date(a.date);
    html += `
      <tr>
        <td>${a.name || "-"}</td>
        <td>${a.time || d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</td>
        <td>${d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML += html;
}
