import multer from "multer";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      const err = new Error("Formato de archivo no permitido.");
      err.status = 400;
      err.code = "INVALID_AVATAR_TYPE";
      return cb(err);
    }
    return cb(null, true);
  },
});

export default avatarUpload;