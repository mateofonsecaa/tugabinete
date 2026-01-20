// public/js/modules/api.js
const API_URL = "http://localhost:4000";

export async function getPatients() {
    const res = await fetch(`${API_URL}/patients`);
    return await res.json();
}

export async function getAppointments() {
    const res = await fetch(`${API_URL}/appointments`);
    return await res.json();
}

export async function deleteAppointment(id) {
    const res = await fetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
    return res;
}
