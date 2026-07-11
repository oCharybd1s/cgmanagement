import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";

export const verifySession = cache(async () => {
  const cookieValue = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return verifySessionCookie(cookieValue, true);
});
