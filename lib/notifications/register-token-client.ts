const DEVICE_TOKEN_STORAGE_KEY = "cgm_fcm_device_token";

export function getStoredDeviceToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
}

export function setStoredDeviceToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token);
}

export function clearStoredDeviceToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(DEVICE_TOKEN_STORAGE_KEY);
}

export async function registerTokenWithServer(token: string): Promise<void> {
  const response = await fetch("/api/notifications/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, userAgent: navigator.userAgent }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Gagal mendaftarkan perangkat ke server");
  }
}

export async function deleteTokenFromServer(token: string): Promise<void> {
  await fetch("/api/notifications/token", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  }).catch(() => undefined);
}
