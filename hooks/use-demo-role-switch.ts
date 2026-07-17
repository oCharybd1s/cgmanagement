"use client";

import * as React from "react";
import type { DemoSwitchableRole } from "@/lib/auth/demo-role-switch";
import type { CgGroup } from "@/lib/cg-groups/types";

export function useDemoRoleSwitch() {
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [isLoadingCgGroups, setIsLoadingCgGroups] = React.useState(false);
  const [cgGroups, setCgGroups] = React.useState<CgGroup[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  async function loadCgGroups() {
    setIsLoadingCgGroups(true);
    try {
      const response = await fetch("/api/dev/cg-groups");
      const data = await response.json();
      if (data.ok) {
        setCgGroups(data.cgGroups);
      }
    } finally {
      setIsLoadingCgGroups(false);
    }
  }

  async function switchRole(role: DemoSwitchableRole, cgGroupId: string | null) {
    setIsSwitching(true);
    setError(null);
    try {
      const response = await fetch("/api/dev/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, cgGroupId }),
      });
      const data = await response.json();
      if (!data.ok) {
        setError(data.error ?? "Gagal switch role");
        setIsSwitching(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Gagal switch role");
      setIsSwitching(false);
    }
  }

  return { switchRole, loadCgGroups, cgGroups, isSwitching, isLoadingCgGroups, error };
}
