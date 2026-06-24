import { randomBytes } from "node:crypto";

export function createBriefSlug(ticker: string, date = new Date()) {
  const safeTicker = normalizeTickerForSlug(ticker) || "brief";
  const dateStamp = formatSlugDate(date);
  const suffix = randomBytes(3).toString("hex");

  return `${safeTicker}-${dateStamp}-${suffix}`;
}

export function normalizeBriefSlug(slug: string) {
  return slug.trim().toLowerCase();
}

export function isValidBriefSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function normalizeTickerForSlug(ticker: string) {
  return ticker
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function formatSlugDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("year")}${values.get("month")}${values.get("day")}`;
}
