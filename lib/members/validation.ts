export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INDONESIAN_PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;

export function sanitizePhoneInput(value: string): string {
  return value.replace(/[\s\-().]/g, "");
}

export function isValidIndonesianPhone(value: string): boolean {
  return INDONESIAN_PHONE_REGEX.test(value);
}

export type CreateMemberFieldErrors = Partial<Record<"fullName" | "email" | "role" | "cgGroupId", string>>;
export type UpdateMemberFieldErrors = Partial<Record<"fullName" | "email", string>>;

export function validateCreateMemberInput(input: {
  fullName: string;
  email: string;
}): CreateMemberFieldErrors {
  const errors: CreateMemberFieldErrors = {};
  const fullName = input.fullName.trim();
  const email = input.email.trim();

  if (fullName === "") {
    errors.fullName = "Nama lengkap wajib diisi";
  }

  if (email === "") {
    errors.email = "Email wajib diisi";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Format email tidak valid";
  }

  return errors;
}

export function validateUpdateMemberInput(input: {
  fullName: string;
  email: string;
}): UpdateMemberFieldErrors {
  return validateCreateMemberInput(input);
}