// /public/js/patients/patients.ui.js

export const renderPatientsTable = (patients) => {
  const tbody = document.querySelector("#patientsTable tbody");
  tbody.innerHTML = "";

  patients.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.fullName}</td>
      <td>${p.phone}</td>
      <td>${p.age}</td>
      <td>${p.lastTreatment ?? "-"}</td>
      <td>
        <button data-id="${p.id}" class="btn-delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
};

export const bindSearch = (patients, onFilter) => {
  const input = document.getElementById("search");
  input.addEventListener("input", () => {
    const value = input.value.toLowerCase();
    const filtered = patients.filter(p =>
      p.fullName.toLowerCase().includes(value)
    );
    onFilter(filtered);
  });
};
