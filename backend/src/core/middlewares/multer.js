import multer from "multer";

const storage = multer.memoryStorage(); // guarda en RAM → después lo subimos a Supabase

const upload = multer({ storage });

export default upload;
