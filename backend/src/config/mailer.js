import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

console.log("📨 EMAIL_USER:", process.env.EMAIL_USER);
console.log("📨 EMAIL_PASS cargado:", !!process.env.EMAIL_PASS);

mailer.verify((err) => {
  if (err) {
    console.error("❌ Mailer verify error:", err);
  } else {
    console.log("✅ Mailer listo para enviar correos");
  }
});