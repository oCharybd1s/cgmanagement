"use client";

import * as React from "react";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  async function logout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/auth";
    }
  }

  return { logout, isLoggingOut };
}
