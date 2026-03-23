import multer from "multer";

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const appointmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 2,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      const err = new Error("Solo se permiten imágenes JPG, PNG o WEBP.");
      err.status = 400;
      err.code = "INVALID_APPOINTMENT_PHOTO_TYPE";
      return cb(err);
    }

    return cb(null, true);
  },
}).fields([
  { name: "beforePhoto", maxCount: 1 },
  { name: "afterPhoto", maxCount: 1 },
]);

export default appointmentUpload;