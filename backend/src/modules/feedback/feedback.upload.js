import multer from "multer";
import { ALLOWED_ATTACHMENT_MIME, MAX_ATTACHMENT_SIZE } from "./feedback.validation.js";

const storage = multer.memoryStorage();

const feedbackUpload = multer({
  storage,
  limits: {
    fileSize: MAX_ATTACHMENT_SIZE,
  },
  fileFilter: (_, file, cb) => {
    if (!ALLOWED_ATTACHMENT_MIME.has(file.mimetype)) {
      return cb(new Error("La captura debe ser JPG, PNG o WEBP."));
    }

    return cb(null, true);
  },
});

export default feedbackUpload;