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
  const hadLocalValueRef = useRef(false);
  const cloudReadyRef = useRef(false);
  const [value, setValueState] = useState<T>(() => {
    if (typeof window === "undefined") return initialRef.current;
    try {
      const raw = localStorage.getItem(initialStorageKey);
      hadLocalValueRef.current = raw != null;
      return raw ? (JSON.parse(raw) as T) : initialRef.current;
    } catch {
      return initialRef.current;
    }
  });

  // Persiste e notifica outras instâncias na mesma aba.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [storageKey, value]);

  useEffect(() => {
    if (typeof window === "undefined" || !shouldCloudSync(storageKey)) return;
    let cancelled = false;
    const ownerKey = getInstallOwnerKey();
    cloudReadyRef.current = hadLocalValueRef.current;

    if (hadLocalValueRef.current) return;

    loadRecord({ data: { ownerKey, dataKey: storageKey } })
      .then((record) => {
        if (cancelled) return;
        if (record.found) {
          setValueState(record.data as T);
          emit(storageKey, record.data);
        }
        cloudReadyRef.current = true;
      })
      .catch(() => {
        cloudReadyRef.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey, loadRecord]);

  useEffect(() => {
    if (typeof window === "undefined" || !shouldCloudSync(storageKey) || !cloudReadyRef.current)
      return;
    const ownerKey = getInstallOwnerKey();
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
        setStorageKey(nextKey);
        hadLocalValueRef.current = raw != null;
        cloudReadyRef.current = false;
        setValueState(raw ? (JSON.parse(raw) as T) : initialRef.current);
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
        // Notifica as outras instâncias com o valor resolvido.
        emit(storageKey, resolved);
        hadLocalValueRef.current = true;
        return resolved;
      });
    },
    [storageKey],
  );

  const reset = useCallback(() => setValue(initialRef.current), [setValue]);

  return [value, setValue, reset] as const;
}
