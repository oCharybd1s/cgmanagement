export type VipProspectFieldErrors = Partial<Record<"name" | "cgId", string>>;

export function validateVipProspectInput(input: { name: string }): VipProspectFieldErrors {
  const errors: VipProspectFieldErrors = {};
  const name = input.name.trim();

  if (name === "") {
    errors.name = "Nama wajib diisi";
  }

  return errors;
}
