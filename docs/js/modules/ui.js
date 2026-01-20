// public/js/modules/ui.js
import Swal from "sweetalert2";

export function showSuccess(msg) {
    Swal.fire({
        icon: "success",
        title: "Éxito",
        text: msg,
        showConfirmButton: false,
        timer: 2000,
        background: "#fffdf9",
        color: "#444",
        iconColor: "#ffadad",
    });
}

export function showError(msg) {
    Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonColor: "#ffadad",
    });
}

export function showConfirmDelete() {
    return Swal.fire({
        title: "¿Eliminar tratamiento?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#ffadad",
        cancelButtonColor: "#d1d1d1",
        background: "#fffdf9",
        color: "#444",
    });
}
