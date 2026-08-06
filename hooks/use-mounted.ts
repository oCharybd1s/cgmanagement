"use client";

import * as React from "react";

function subscribeNever() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

export function useMounted(): boolean {
  return React.useSyncExternalStore(subscribeNever, getMountedSnapshot, getMountedServerSnapshot);
}
