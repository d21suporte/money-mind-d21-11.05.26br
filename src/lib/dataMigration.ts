// Migração defensiva de dados locais entre versões do app.
// Garante que chaves antigas continuem disponíveis após novos builds.

const SCHEMA_KEY = "d21.schema.version";
const CURRENT_SCHEMA = 2;

type Migration = (storage: Storage) => void;

const migrations: Record<number, Migration> = {
  // 1 -> 2: garante que dados de Meu Negócio fiquem também escopados sob u:<email>:
  2: (s) => {
    try {
      const email = s.getItem("d21.lastPinEmail") || s.getItem("email_usuario");
      if (!email) return;
      const ns = `u:${email.toLowerCase().trim()}:`;
      const keys = ["d21.mn.products", "d21.mn.services", "d21.mn.infoproducts", "d21.mn.platforms", "d21.mn.sales", "d21.mn.incorporate"];
      for (const k of keys) {
        const scoped = ns + k;
        if (!s.getItem(scoped) && s.getItem(k)) {
          s.setItem(scoped, s.getItem(k)!);
        }
      }
    } catch {
      /* ignore */
    }
  },
};

export function runDataMigrations() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(SCHEMA_KEY);
    const from = raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
    if (from >= CURRENT_SCHEMA) return;
    for (let v = from + 1; v <= CURRENT_SCHEMA; v++) {
      migrations[v]?.(localStorage);
    }
    localStorage.setItem(SCHEMA_KEY, String(CURRENT_SCHEMA));
  } catch {
    /* ignore */
  }
}
