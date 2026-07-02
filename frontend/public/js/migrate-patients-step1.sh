#!/usr/bin/env bash
# =============================================================================
# PASO 1 — Mudanza física pura del dominio Pacientes a features/patients/
#
# Cero cambios de lógica: solo git mv + actualización de rutas de import.
# Probado en simulación contra el árbol real: 0 imports rotos, 9/9 archivos
# alcanzables desde app.js, sintaxis validada.
#
# EJECUTAR DESDE: frontend/public/js
# REVERSIBLE CON: git reset --hard (antes de commitear) o git revert (después)
# =============================================================================
set -euo pipefail

[ -f "router.js" ] || { echo "ERROR: ejecutá este script desde frontend/public/js"; exit 1; }

echo "==> 1/4 Creando features/patients/"
mkdir -p features/patients

echo "==> 2/4 git mv de los 9 archivos (nombres futuros)"
# Vistas (4) — patient-interview.js NO se toca: pertenece al dominio interviews
git mv views/patients.js               features/patients/patients-list.view.js
git mv views/patient-new.js            features/patients/patient-create.view.js
git mv views/patient-edit.js           features/patients/patient-edit.view.js
git mv views/patient-details.js        features/patients/patient-details.view.js

# Lógica de página (4)
git mv patients/patients.page.js       features/patients/patients-list.page.js
git mv patients/patientCreate.page.js  features/patients/patient-create.page.js
git mv patients/patientEdit.page.js    features/patients/patient-edit.page.js
git mv patients/patientDetails.page.js features/patients/patient-details.page.js

# API (1)
git mv patients/patients.api.js        features/patients/patients.api.js

# patients/ queda solo con patients.ui.js (huérfano, pendiente de cuarentena)
rmdir patients 2>/dev/null || echo "    (patients/ no vacía: queda patients.ui.js, huérfano de la cuarentena)"

echo "==> 3/4 Actualizando rutas de import"
# --- Vistas migradas: drawer sube un nivel; la página pasa a ser hermana ---
sed -i 's|"../components/drawer.js"|"../../components/drawer.js"|' features/patients/*.view.js
sed -i 's|"../patients/patients.page.js"|"./patients-list.page.js"|'        features/patients/patients-list.view.js
sed -i 's|"../patients/patientCreate.page.js"|"./patient-create.page.js"|'  features/patients/patient-create.view.js
sed -i 's|"../patients/patientEdit.page.js"|"./patient-edit.page.js"|'      features/patients/patient-edit.view.js
sed -i 's|"../patients/patientDetails.page.js"|"./patient-details.page.js"|' features/patients/patient-details.view.js

# --- API migrada: core sube un nivel ---
sed -i 's|"../core/authFetch.js"|"../../core/authFetch.js"|' features/patients/patients.api.js

# --- Consumidor externo cruzado (detectado en simulación): el módulo de
#     entrevista consume la API de pacientes. Sin esta línea, /patients/:id/interview
#     se rompe. Deuda anotada: desacoplar cuando migre el dominio interviews. ---
sed -i 's|"../patients/patients.api.js"|"../features/patients/patients.api.js"|' interview/patientInterview.page.js

# --- Router: 4 imports ---
sed -i 's|"./views/patients.js"|"./features/patients/patients-list.view.js"|'          router.js
sed -i 's|"./views/patient-new.js"|"./features/patients/patient-create.view.js"|'      router.js
sed -i 's|"./views/patient-details.js"|"./features/patients/patient-details.view.js"|' router.js
sed -i 's|"./views/patient-edit.js"|"./features/patients/patient-edit.view.js"|'       router.js

echo "==> 4/4 Verificación de sintaxis"
for f in features/patients/*.js router.js interview/patientInterview.page.js; do
  node --check "$f"
done

echo ""
echo "LISTO. Verificá el grafo con el script de auditoría y probá las rutas:"
echo "  /patients, /patients/new, /patients/:id, /patients/:id/edit, /patients/:id/interview"
