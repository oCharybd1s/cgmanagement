export async function signInWithCustomToken(customToken: string, apiKey: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      signal: AbortSignal.timeout(10000),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Gagal menukar custom token");
  }

  return data.idToken as string;
}
