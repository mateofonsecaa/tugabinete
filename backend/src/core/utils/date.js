export function toLocal(date) {
    return new Date(date).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour12: false
    });
}
