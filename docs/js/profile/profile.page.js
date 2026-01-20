import "../../css/profile.css";
import {
        getCachedUser,
        fetchUser,
        loadStats,
        loadAppointments
    } from "profile.service.js";

export function renderProfilePage(container) {
    container.innerHTML = `
        <section class="profile-page">
        <main>
            <h1>Mi Perfil Profesional</h1>

            <div class="profile-header">
            <img class="profile-pic" />
            <div class="profile-info">
                <h2 id="userName"></h2>
                <p class="subtitle" id="professionLabel"></p>
                <p><i class="fa-solid fa-envelope"></i><span id="userEmail"></span></p>
                <p><i class="fa-solid fa-phone"></i><span id="userPhone"></span></p>
            </div>

            <button class="btn-edit" id="editProfileBtn">
                <i class="fa-solid fa-pen"></i> Editar perfil
            </button>
            </div>

        <section class="stats">
            ${renderStatsSkeleton()}
        </section>

        <section class="turnos">
            <h3>Próximos turnos</h3>
            <p class="loading">Cargando turnos...</p>
        </section>
        </main>
    </section>
    `;
}

function renderStatsSkeleton() {
    const stats = [
        ["spa", "0", "Tratamientos realizados"],
        ["check-circle", "0", "Turnos completados"],
        ["user-check", "0", "Pacientes activos"],
        ["calendar-check", "0", "Turnos próximos"]
    ];

    return stats.map(s => `
        <div class="stat">
        <i class="fa-solid fa-${s[0]}"></i>
        <span>0</span>
        <small>${s[2]}</small>
        </div>
    `).join("");
}
