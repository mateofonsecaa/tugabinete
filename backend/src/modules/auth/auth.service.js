import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as repo from "./auth.repository.js";
import { mailer } from "../../config/mailer.js";

export const register = async (data) => {
    const { name, email, password } = data;

    const hashed = await bcrypt.hash(password, 10);
    const user = await repo.createUser({
        name,
        email,
        password: hashed,
    });

    const token = crypto.randomBytes(32).toString("hex");

    await repo.createVerificationToken(user.id, token);

    const verifyUrl = `${process.env.BASE_URL}/api/auth/verify/${token}`;

    await mailer.sendMail({
        from: `"BeautyCare Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verificá tu cuenta",
        html: `
        <div style="font-family:Poppins;text-align:center;padding:40px;">
            <h2 style="color:#ffadad;">¡Hola ${name}!</h2>
            <p>Verificá tu cuenta haciendo clic abajo:</p>
            <a href="${verifyUrl}" style="background:#ffadad;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;">Verificar cuenta</a>
        </div>
        `,
    });

    return { message: "Correo de verificación enviado." };
};

export const login = async (data) => {
    const { email, password } = data;

    const user = await repo.findUserByEmail(email);
    if (!user) throw new Error("Usuario no encontrado");
    if (!user.isVerified) throw new Error("Cuenta no verificada");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Contraseña incorrecta");

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    );

    return {
        message: `Bienvenida, ${user.name}!`,
        token,
        user,
    };
};

export const verifyEmail = async (token) => {
    const record = await repo.findVerificationToken(token);
    if (!record) throw new Error("Token inválido o expirado");

    await repo.verifyUser(record.userId);
    await repo.deleteVerificationToken(token);

    return {
        redirectUrl: `${process.env.FRONTEND_URL}/verify?status=success`,
    };
};
