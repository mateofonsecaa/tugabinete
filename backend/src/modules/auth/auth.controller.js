import * as service from "./auth.service.js";
import * as repo from "./auth.repository.js";

// Supabase uploader
import { uploadToSupabase } from "../../core/utils/upload.js";

// ======================================================
// REGISTER
// ======================================================
export const register = async (req, res, next) => {
  try {
    const result = await service.register(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ======================================================
// LOGIN
// ======================================================
export const login = async (req, res, next) => {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ======================================================
// VERIFY EMAIL
// ======================================================
export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.params.token;
    const result = await service.verifyEmail(token);
    const redirectUrl = "https://www.tugabinete.com/verify?status=success";
    res.redirect(result.redirectUrl);
  } catch (err) {
    next(err);
  }
};

// ======================================================
// /me — obtiene el usuario actual
// ======================================================
export const me = async (req, res) => {
  try {
    const user = await repo.findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profession: user.profession,
      phone: user.phone,
      profileImage: user.profileImage,
    });

  } catch (err) {
    return res.status(500).json({ message: "Error obteniendo usuario actual" });
  }
};

// ======================================================
// Actualizar perfil del usuario (con Supabase Storage)
// ======================================================
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, profession, phone } = req.body;

    const data = {
      name: `${firstName} ${lastName}`.trim(),
      profession,
      phone,
    };

    // Si viene imagen => subir a Supabase
    if (req.file) {
      const buffer = req.file.buffer;
      const originalName = req.file.originalname;

      const publicUrl = await uploadToSupabase(
        buffer,
        originalName,
        "profile" // carpeta dentro del bucket
      );

      data.profileImage = publicUrl;
    }

    const updated = await repo.updateUser(req.user.id, data);

    return res.json({
      message: "Perfil actualizado correctamente",
      user: updated,
    });

    } catch (err) {
    console.error("❌ updateProfile error:", err); // <-- clave
    return res.status(500).json({
      message: "No se pudo actualizar el perfil",
      error: err.message,
    });
  }

};
