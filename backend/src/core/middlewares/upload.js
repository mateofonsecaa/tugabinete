// backend/src/core/middlewares/upload.js
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // ✅ 15 MB
  }
});

export default upload;
