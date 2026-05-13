import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

const recordKeySchema = z.object({
  ownerKey: z.string().min(8).max(128),
  dataKey: z.string().min(1).max(300),
});

const isMeaningfulData = (value: unknown) => {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
};

export const loadAppRecord = createServerFn({ method: "GET" })
  .inputValidator((input) => recordKeySchema.parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("app_records")
      .select("data, updated_at")
      .eq("owner_key", data.ownerKey)
      .eq("data_key", data.dataKey)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (row && isMeaningfulData(row.data)) {
      return { found: true as const, data: row.data, updatedAt: row.updated_at };
    }

    const { data: candidates, error: fallbackError } = await supabaseAdmin
      .from("app_records")
      .select("data, updated_at")
      .eq("data_key", data.dataKey)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (fallbackError) throw new Error(fallbackError.message);
    const fallback = candidates?.find((candidate) => isMeaningfulData(candidate.data));
    if (fallback) return { found: true as const, data: fallback.data, updatedAt: fallback.updated_at };
    if (!row) return { found: false as const, data: null, updatedAt: null };
    return { found: true as const, data: row.data, updatedAt: row.updated_at };
  });

export const saveAppRecord = createServerFn({ method: "POST" })
  .inputValidator((input) => recordKeySchema.extend({ data: z.unknown() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("app_records").upsert(
      {
        owner_key: data.ownerKey,
        data_key: data.dataKey,
        data: (data.data ?? null) as Json,
      },
      { onConflict: "owner_key,data_key" },
    );

    if (error) throw new Error(error.message);
    return { ok: true };
  });
