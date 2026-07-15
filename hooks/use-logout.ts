"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  async function logout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/auth");
      router.refresh();
    }
  }

  return { logout, isLoggingOut };
}
