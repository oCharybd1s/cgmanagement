export type EventFieldErrors = Partial<
  Record<"name" | "date" | "time" | "type" | "cgId" | "targetUserId", string>
>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function validateEventInput(input: {
  name: string;
  date: string;
  time: string | null;
}): EventFieldErrors {
  const errors: EventFieldErrors = {};

  if (input.name.trim() === "") {
    errors.name = "Nama event wajib diisi";
  } else if (input.name.trim().length > 120) {
    errors.name = "Nama event maksimal 120 karakter";
  }

  if (input.date.trim() === "" || !DATE_PATTERN.test(input.date.trim())) {
    errors.date = "Tanggal wajib diisi dengan format yang valid";
  }

  if (input.time !== null && !TIME_PATTERN.test(input.time)) {
    errors.time = "Format jam tidak valid";
  }

  return errors;
}
