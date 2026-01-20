import { API_URL } from "../core/config.js";
import { authFetch } from "../core/authFetch.js";
import { toLocalDateString, utcToLocalTime } from "../core/dateUtils.js";

export async function fetchAppointmentsSimple() {
    const res = await authFetch(`${API_URL}/simple`);
    if (!res.ok) throw new Error("No se pudieron cargar turnos");

    const data = await res.json();
    return (Array.isArray(data) ? data : []).map(t => ({
        id: t.id,
        date: toLocalDateString(t.date),   // YYYY-MM-DD local
        time: utcToLocalTime(t.date),      // HH:MM
        name: t.name || "Sin nombre"
    }));
}