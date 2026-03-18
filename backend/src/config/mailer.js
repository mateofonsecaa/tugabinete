import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const mailer = {
  async sendMail({ from, to, subject, text, html }) {
    const finalFrom =
      process.env.EMAIL_FROM_NAME && process.env.EMAIL_FROM
        ? `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`
        : process.env.EMAIL_FROM || from;

    const recipients = Array.isArray(to) ? to : [to];

    const { data, error } = await resend.emails.send({
      from: finalFrom,
      to: recipients,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("❌ Resend send error:", error);
      throw new Error(error.message || "Resend send failed");
    }

    return data;
  },
};

console.log("📨 RESEND_API_KEY cargada:", !!process.env.RESEND_API_KEY);
console.log("📨 EMAIL_FROM:", process.env.EMAIL_FROM);
console.log("📨 EMAIL_FROM_NAME:", process.env.EMAIL_FROM_NAME || "(sin nombre)");