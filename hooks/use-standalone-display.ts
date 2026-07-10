"use client";

import { useSyncExternalStore } from "react";

function subscribeNever() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

function subscribeToStandalone(callback: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getStandaloneSnapshot() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

function getStandaloneServerSnapshot() {
  return true;
}

export function useStandaloneDisplay() {
  const isReady = useSyncExternalStore(subscribeNever, getMountedSnapshot, getMountedServerSnapshot);
  const isStandalone = useSyncExternalStore(
    subscribeToStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot,
  );

  const isIOS = isReady && /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !("MSStream" in window);
  const isAndroid = isReady && /Android/.test(window.navigator.userAgent);

  return {
    isReady,
    isStandalone: isReady ? isStandalone : true,
    isIOS,
    isMobileDevice: isIOS || isAndroid,
  };
}
