export const LOGIN_EMAIL_DOMAIN = "@gmail.com";

export function sanitizeUsernameInput(value: string): string {
  return value.replace(/\s/g, "").split("@")[0];
}

export function buildEmailFromUsername(username: string): string {
  return `${username.trim().toLowerCase()}${LOGIN_EMAIL_DOMAIN}`;
}
