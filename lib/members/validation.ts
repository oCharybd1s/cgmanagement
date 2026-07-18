export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateMemberFieldErrors = Partial<Record<"fullName" | "email" | "role" | "cgGroupId", string>>;

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