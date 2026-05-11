import { useCallback, useEffect, useRef, useState } from "react";

const VERSION_URL = "/version.json";
const POLL_MS = 5 * 60 * 1000; // 5 min
const STORAGE_KEY = "d21.app.version";

async function fetchRemoteVersion(): Promise<string | null> {
  try {
    const r = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j?.version === "string" ? j.version : null;
  } catch {
    return null;
  }
}

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [checking, setChecking] = useState(false);
  const currentRef = useRef<string | null>(null);

  const check = useCallback(async (): Promise<boolean> => {
    setChecking(true);
    try {
      const remote = await fetchRemoteVersion();
      if (!remote) return false;
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      if (!stored) {
        try {
          localStorage.setItem(STORAGE_KEY, remote);
        } catch {
          /* ignore */
        }
        currentRef.current = remote;
        return false;
      }
      currentRef.current = stored;
      const has = stored !== remote;
      if (has) setNeedRefresh(true);
      return has;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
    const i = setInterval(() => void check(), POLL_MS);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(i);
      window.removeEventListener("focus", onFocus);
    };
  }, [check]);

  const applyUpdate = useCallback(async () => {
    if (typeof window === "undefined") return;
    const remote = await fetchRemoteVersion();
    if (remote) {
      try {
        localStorage.setItem(STORAGE_KEY, remote);
      } catch {
        /* ignore */
      }
    }
    try {
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now().toString());
    window.location.replace(url.toString());
  }, []);

  return { needRefresh, checking, checkForUpdate: check, applyUpdate };
}
