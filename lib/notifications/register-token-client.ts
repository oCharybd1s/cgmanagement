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
