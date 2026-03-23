import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  normalizeEmail,
  validatePasswordPolicy,
} from "../auth/auth.validation.js";

const HUMAN_NAME_REGEX = /^[\p{L}\p{M}'’ -]+$/u;

function cleanText(value = "") {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanOptionalText(value) {
  const cleaned = cleanText(value ?? "");
  return cleaned || null;
}

function hasUnsafeMarkup(value = "") {
  return /<[^>]*>|[<>]/.test(String(value));
}

function mapZodErrors(error) {
  const fieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path?.[0] || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

const requiredNameField = (label, min, max) =>
  z
    .string({ required_error: `${label} es obligatorio.` })
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(min, `${label} debe tener al menos ${min} caracteres.`)
        .max(max, `${label} no puede superar ${max} caracteres.`)
        .refine((value) => HUMAN_NAME_REGEX.test(value), {
          message: `${label} contiene caracteres no permitidos.`,
        })
        .refine((value) => !hasUnsafeMarkup(value), {
          message: `${label} contiene caracteres no permitidos.`,
        })
    );

const optionalShortText = (label, max) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform(cleanOptionalText)
    .refine(
      (value) => value === null || !hasUnsafeMarkup(value),
      `${label} contiene caracteres no permitidos.`
    )
    .refine(
      (value) => value === null || value.length <= max,
      `${label} no puede superar ${max} caracteres.`
    );

const profileSchema = z.object({
  firstName: requiredNameField("El nombre", 2, 40),
  lastName: requiredNameField("El apellido", 2, 60),
  displayName: optionalShortText("El nombre visible", 80).refine(
    (value) => value === null || value.length >= 2,
    "El nombre visible debe tener al menos 2 caracteres."
  ),
  profession: optionalShortText("La profesión", 80).refine(
    (value) => value === null || value.length >= 2,
    "La profesión debe tener al menos 2 caracteres."
  ),
  phone: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(cleanOptionalText),
  bio: optionalShortText("La descripción profesional", 280),
}).strict();

const emailChangeSchema = z.object({
  newEmail: z
    .string({ required_error: "Ingresá un nuevo correo." })
    .transform(normalizeEmail)
    .pipe(z.string().email("Ingresá un correo válido.")),
  currentPassword: z
    .string({ required_error: "Ingresá tu contraseña actual." })
    .min(1, "Ingresá tu contraseña actual."),
}).strict();

const passwordChangeSchema = z.object({
  currentPassword: z
    .string({ required_error: "Ingresá tu contraseña actual." })
    .min(1, "Ingresá tu contraseña actual."),
  newPassword: z.string({ required_error: "Ingresá la nueva contraseña." }),
  confirmPassword: z.string({
    required_error: "Confirmá la nueva contraseña.",
  }),
}).strict();

export function validateProfileUpdateInput(raw) {
  const parsed = profileSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  let phone = null;
  if (parsed.data.phone) {
    const parsedPhone = parsePhoneNumberFromString(parsed.data.phone, "AR");
    if (!parsedPhone || !parsedPhone.isValid()) {
      return {
        ok: false,
        fieldErrors: {
          phone: "Ingresá un teléfono válido.",
        },
      };
    }
    phone = parsedPhone.number;
  }

  const payload = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    displayName: parsed.data.displayName,
    profession: parsed.data.profession,
    phone,
    bio: parsed.data.bio,
  };

  return { ok: true, data: payload };
}

export function validateEmailChangeInput(raw) {
  const parsed = emailChangeSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  return { ok: true, data: parsed.data };
}

export function validatePasswordChangeInput(raw) {
  const parsed = passwordChangeSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  const policy = validatePasswordPolicy({
    password: parsed.data.newPassword,
    confirmPassword: parsed.data.confirmPassword,
    requireConfirmation: true,
  });

  if (!policy.ok) {
    return {
      ok: false,
      fieldErrors: {
        ...policy.errors,
      },
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
}