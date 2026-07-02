// /public/js/views/treatments.gallery.js

export const MAX_TREATMENT_PHOTOS = 10;

export const TREATMENT_PHOTO_LABELS = [
  "Antes",
  "Durante",
  "Después",
  "Resultado",
  "Sin etiqueta",
];

export function normalizeTreatmentPhotoLabel(value) {
  const raw = String(value || "").trim().toLowerCase();

  if (!raw) return "Sin etiqueta";

  const match = TREATMENT_PHOTO_LABELS.find(
    (label) => label.toLowerCase() === raw
  );

  return match || "Sin etiqueta";
}

export function createGalleryPhoto({
  id = null,
  file = null,
  url = "",
  label = "Sin etiqueta",
  position = 0,
  source = "new", // "new" | "existing"
}) {
  return {
    id,
    file,
    url,
    label: normalizeTreatmentPhotoLabel(label),
    position: Number.isInteger(position) ? position : 0,
    source,
  };
}

export function reindexGalleryPhotos(photos = []) {
  return (Array.isArray(photos) ? photos : []).map((photo, index) => ({
    ...photo,
    position: index,
  }));
}

export function getRemainingPhotoSlots(currentCount = 0) {
  const count = Number(currentCount) || 0;
  return Math.max(0, MAX_TREATMENT_PHOTOS - count);
}

export function canAddMorePhotos(currentCount = 0) {
  return getRemainingPhotoSlots(currentCount) > 0;
}

export function buildGalleryPhotosFromApiResponse(payload = {}) {
  const apiPhotos = Array.isArray(payload?.photos) ? payload.photos : [];

  if (apiPhotos.length > 0) {
    return reindexGalleryPhotos(
      apiPhotos.map((photo, index) =>
        createGalleryPhoto({
          id: photo?.id ?? null,
          url: photo?.url || "",
          label: photo?.label || "Sin etiqueta",
          position: Number.isInteger(photo?.position) ? photo.position : index,
          source: "existing",
        })
      )
    );
  }

  const legacyPhotos = [];

  if (payload?.beforePhoto) {
    legacyPhotos.push(
      createGalleryPhoto({
        id: null,
        url: payload.beforePhoto,
        label: "Antes",
        position: 0,
        source: "existing",
      })
    );
  }

  if (payload?.afterPhoto) {
    legacyPhotos.push(
      createGalleryPhoto({
        id: null,
        url: payload.afterPhoto,
        label: "Después",
        position: legacyPhotos.length,
        source: "existing",
      })
    );
  }

  return reindexGalleryPhotos(legacyPhotos);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => resolve(event.target?.result || "");
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

export async function buildDraftGalleryPhotosFromFiles(fileList, existingCount = 0) {
  const files = Array.from(fileList || []).filter(Boolean);
  const availableSlots = getRemainingPhotoSlots(existingCount);

  if (availableSlots <= 0) {
    throw new Error(`Solo se permiten ${MAX_TREATMENT_PHOTOS} fotos por tratamiento.`);
  }

  const acceptedFiles = files.slice(0, availableSlots);

  const photos = await Promise.all(
    acceptedFiles.map(async (file, index) => {
      const dataUrl = await readFileAsDataUrl(file);

      return createGalleryPhoto({
        file,
        url: dataUrl,
        label: "Sin etiqueta",
        position: existingCount + index,
        source: "new",
      });
    })
  );

  return reindexGalleryPhotos(photos);
}

export function appendGalleryPhotosToFormData(formData, photos = []) {
  const ordered = reindexGalleryPhotos(photos);

  const existingPhotos = ordered
    .filter((photo) => photo?.source === "existing")
    .map((photo) => ({
      id: photo?.id ?? null,
      label: normalizeTreatmentPhotoLabel(photo?.label),
      position: photo?.position ?? 0,
      url: photo?.url || "",
    }));

  const newPhotos = ordered.filter(
    (photo) => photo?.source === "new" && photo?.file instanceof File
  );

  const newPhotoLabels = newPhotos.map((photo, index) => ({
    label: normalizeTreatmentPhotoLabel(photo?.label),
    position: photo?.position ?? index,
  }));

  formData.append("existingPhotos", JSON.stringify(existingPhotos));
  formData.append("newPhotoLabels", JSON.stringify(newPhotoLabels));

  newPhotos.forEach((photo) => {
    formData.append("photos", photo.file);
  });

  return formData;
}