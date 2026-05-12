/**
 * Maps backend / form trade strings (English) to i18n keys under `workerTrades.<slug>`.
 * Values sent to the API stay in English; only display labels are translated.
 */
export function workerTradeLabelKey(value) {
  const s = String(value ?? "").trim();
  if (!s || s === "all") return null;
  const slug = s
    .toLowerCase()
    .replace(/\s*&\s*/g, "_and_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return slug ? `workerTrades.${slug}` : null;
}

export function translateWorkerTrade(t, value) {
  const s = String(value ?? "").trim();
  if (!s) return "";
  if (s === "all") return s;
  const key = workerTradeLabelKey(s);
  if (!key) return s;
  return t(key, { defaultValue: s });
}
