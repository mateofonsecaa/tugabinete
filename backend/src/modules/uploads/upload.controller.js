import { uploadToBucket } from "./upload.service.js";
import prisma from "../../core/prismaClient.js";

export const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "Imagen no enviada" });

    const url = await uploadToBucket("profile", file);

    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: url }
    });

    res.json({ url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const uploadPatientImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Imagen no enviada" });

    const url = await uploadToBucket("patients", file);
    res.json({ url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const uploadTreatmentImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Imagen no enviada" });

    const url = await uploadToBucket("treatments", file);
    res.json({ url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
