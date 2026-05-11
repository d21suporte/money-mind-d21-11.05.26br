// PWA registration disabled in TanStack Start template.
export function registerPWA() {
  if (typeof window === "undefined") return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});
  }
  if (typeof caches !== "undefined") {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
  }
}
