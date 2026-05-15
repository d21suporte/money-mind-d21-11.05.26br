import { useState, useEffect, useCallback, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { scopedKey } from "./useSession";
import { loadAppRecord, saveAppRecord } from "@/lib/appRecords.functions";

// Event-bus para sincronizar todas as instâncias de useStorage com a mesma key
// (mesma aba) — o evento `storage` nativo só dispara entre abas diferentes.
type Listener = (value: unknown) => void;
const listeners = new Map<string, Set<Listener>>();

function emit(key: string, value: unknown) {
  listeners.get(key)?.forEach((cb) => {
    try {
      cb(value);
    } catch {
      /* ignore */
    }
  });
}

function subscribe(key: string, cb: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  return () => {
    listeners.get(key)?.delete(cb);
  };
}

const shouldCloudSync = (key: string) => /^(u:[^:]+:)?d21\./.test(key);

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
};

const isTrustworthyLocalValue = (value: unknown, initialValue: unknown, key: string) => {
  if (value == null) return false;
  if (typeof value === "boolean" || typeof value === "number") return true;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    if (key.endsWith("d21.user")) {
      const user = value as { name?: string; email?: string; avatar?: string };
      return Boolean(user.avatar || user.email || (user.name && user.name !== "Visitante"));
    }
    return Object.keys(value).length > 0 && safeStringify(value) !== safeStringify(initialValue);
  }
  return true;
};

const mergeCloudValue = <T,>(key: string, localValue: T, cloudValue: unknown): T => {
  if (
    key.endsWith("d21.user") &&
    cloudValue &&
    typeof cloudValue === "object" &&
    localValue &&
    typeof localValue === "object"
  ) {
    const localUser = localValue as Record<string, unknown>;
    const cloudUser = cloudValue as Record<string, unknown>;
    return {
      ...cloudUser,
      ...localUser,
      avatar: localUser.avatar || cloudUser.avatar,
    } as T;
  }
  return cloudValue as T;
};

function getCloudOwnerKey(storageKey: string) {
  const match = storageKey.match(/^u:([^:]+):/);
  if (match?.[1]) return `user:${match[1].toLowerCase()}`.slice(0, 128);
  return getInstallOwnerKey();
}

function getInstallOwnerKey() {
  const key = "d21.installId";
  let id = localStorage.getItem(key);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function useStorage<T>(key: string, initialValue: T) {
  const loadRecord = useServerFn(loadAppRecord);
  const saveRecord = useServerFn(saveAppRecord);
  const initialRef = useRef(initialValue);
  const resolveKey = useCallback(() => scopedKey(key), [key]);
  const initialStorageKey = typeof window === "undefined" ? key : resolveKey();
  const [storageKey, setStorageKey] = useState(initialStorageKey);
  const localTrustedRef = useRef(false);
  const cloudReadyRef = useRef(false);
  const dirtyRef = useRef(false);
  const cloudSaveBlockedRef = useRef(false);
  const [value, setValueState] = useState<T>(() => {
    if (typeof window === "undefined") return initialRef.current;
    try {
      const raw = localStorage.getItem(initialStorageKey);
      const parsed = raw ? (JSON.parse(raw) as T) : initialRef.current;
      localTrustedRef.current = raw != null && isTrustworthyLocalValue(parsed, initialRef.current, initialStorageKey);
      cloudReadyRef.current = localTrustedRef.current && !initialStorageKey.endsWith("d21.user");
      return parsed;
    } catch {
      return initialRef.current;
    }
  });
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Persiste e notifica outras instâncias na mesma aba.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (shouldCloudSync(storageKey) && !cloudReadyRef.current && !localTrustedRef.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [storageKey, value]);

  useEffect(() => {
    if (typeof window === "undefined" || !shouldCloudSync(storageKey)) return;
    let cancelled = false;
    const ownerKey = getCloudOwnerKey(storageKey);
    let localTrusted = false;

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as T) : initialRef.current;
      localTrusted = raw != null && isTrustworthyLocalValue(parsed, initialRef.current, storageKey);
    } catch {
      localTrusted = false;
    }

    localTrustedRef.current = localTrusted;
    cloudReadyRef.current = localTrusted && !storageKey.endsWith("d21.user");
    dirtyRef.current = false;
    cloudSaveBlockedRef.current = false;

    if (localTrusted && !storageKey.endsWith("d21.user")) return;

    loadRecord({ data: { ownerKey, dataKey: storageKey } })
      .then((record) => {
        if (cancelled) return;
        if (record.found && isTrustworthyLocalValue(record.data, initialRef.current, storageKey) && !dirtyRef.current) {
          const next = mergeCloudValue(storageKey, valueRef.current, record.data);
          setValueState(next);
          valueRef.current = next;
          try {
            localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          emit(storageKey, next);
        } else if (!record.found && localTrustedRef.current && isTrustworthyLocalValue(valueRef.current, initialRef.current, storageKey)) {
          saveRecord({ data: { ownerKey, dataKey: storageKey, data: valueRef.current } }).catch(() => {
            /* offline or backend unavailable: local data remains saved */
          });
        }
        cloudReadyRef.current = true;
      })
      .catch(() => {
        cloudReadyRef.current = true;
        cloudSaveBlockedRef.current = !localTrustedRef.current && !dirtyRef.current;
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey, loadRecord, saveRecord]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !shouldCloudSync(storageKey) ||
      !cloudReadyRef.current ||
      (cloudSaveBlockedRef.current && !dirtyRef.current)
    )
      return;
    const ownerKey = getCloudOwnerKey(storageKey);
    saveRecord({ data: { ownerKey, dataKey: storageKey, data: value } }).catch(() => {
      /* offline or backend unavailable: local data remains saved */
    });
  }, [storageKey, value, saveRecord]);

  // Ouve atualizações de outras instâncias (mesma aba) e do evento storage (entre abas).
  useEffect(() => {
    const onLocal: Listener = (v) => setValueState(v as T);
    const unsubscribe = subscribe(storageKey, onLocal);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey || e.newValue == null) return;
      try {
        setValueState(JSON.parse(e.newValue) as T);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);

    // Quando o usuário ativo muda, recarrega o valor sob o novo namespace.
    const onSessionChange = () => {
      try {
        const nextKey = resolveKey();
        const raw = localStorage.getItem(nextKey);
        const parsed = raw ? (JSON.parse(raw) as T) : initialRef.current;
        setStorageKey(nextKey);
        localTrustedRef.current = raw != null && isTrustworthyLocalValue(parsed, initialRef.current, nextKey);
        cloudReadyRef.current = localTrustedRef.current && !nextKey.endsWith("d21.user");
        dirtyRef.current = false;
        cloudSaveBlockedRef.current = false;
        setValueState(parsed);
      } catch {
        setValueState(initialRef.current);
      }
    };
    window.addEventListener("d21:session-change", onSessionChange);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("d21:session-change", onSessionChange);
    };
  }, [resolveKey, storageKey]);

  const setValue = useCallback<typeof setValueState>(
    (next) => {
      setValueState((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        localTrustedRef.current = true;
        cloudReadyRef.current = true;
        dirtyRef.current = true;
        cloudSaveBlockedRef.current = false;
        // Notifica outras instâncias APÓS o commit, para evitar
        // "setState during render" e garantir propagação consistente.
        queueMicrotask(() => emit(storageKey, resolved));
        return resolved;
      });
    },
    [storageKey],
  );

  const reset = useCallback(() => setValue(initialRef.current), [setValue]);

  return [value, setValue, reset] as const;
}
