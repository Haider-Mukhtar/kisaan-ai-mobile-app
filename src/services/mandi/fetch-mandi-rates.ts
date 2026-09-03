import axios from "axios";
import * as cheerio from "cheerio";

import {
  MANDI_CITIES,
  type MandiCity,
  type MandiCityRate,
  type MandiRate,
  type MandiSnapshot,
} from "@/services/mandi/types";

export const MANDI_RATES_URL =
  "https://irfarm.com/pages/daily-mandi-rates";

const REQUEST_TIMEOUT_MS = 15_000;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseCityRate(value: unknown): MandiCityRate | null {
  if (!isRecord(value)) return null;

  const min = finiteNumber(value.min);
  const max = finiteNumber(value.max);
  const change = finiteNumber(value.change);

  if (min === null || max === null) return null;

  return { min, max, change: change ?? 0 };
}

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  const url = value.trim();
  return url.startsWith("//") ? `https:${url}` : url;
}

function parseRate(value: unknown): MandiRate | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "string" ? value.id.trim() : "";
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const urdu = typeof value.urdu === "string" ? value.urdu.trim() : "";
  const unit = typeof value.unit === "string" ? value.unit.trim() : "kg";
  const average = finiteNumber(value.avg);
  const change = finiteNumber(value.change);

  if (!id || !name || average === null) return null;

  const cityRates: Partial<Record<MandiCity, MandiCityRate>> = {};

  const rawRates = value.rates;

  if (isRecord(rawRates)) {
    MANDI_CITIES.forEach((city) => {
      const rate = parseCityRate(rawRates[city]);
      if (rate) cityRates[city] = rate;
    });
  }

  return {
    id,
    name,
    urdu,
    unit,
    average,
    change: change ?? 0,
    imageUrl: normalizeImageUrl(value.img),
    cityRates,
  };
}

export function parseMandiRatesHtml(html: string): MandiSnapshot {
  const $ = cheerio.load(html);
  const embeddedRates = $("#irfFavData").text().trim();

  if (!embeddedRates) {
    throw new Error("IR Farm page did not include its mandi-rate data");
  }

  let payload: unknown;

  try {
    payload = JSON.parse(embeddedRates);
  } catch {
    throw new Error("IR Farm mandi-rate data was not valid JSON");
  }

  if (!Array.isArray(payload)) {
    throw new Error("IR Farm mandi-rate data had an unexpected shape");
  }

  const rates = payload.map(parseRate).filter((rate): rate is MandiRate => rate !== null);

  if (rates.length === 0) {
    throw new Error("IR Farm page did not contain any usable mandi rates");
  }

  return {
    rates,
    sourceUpdatedAt: $(".irf-date").first().text().trim() || null,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchMandiRates(): Promise<MandiSnapshot> {
  const response = await axios.get<string>(MANDI_RATES_URL, {
    headers: { Accept: "text/html,application/xhtml+xml" },
    responseType: "text",
    timeout: REQUEST_TIMEOUT_MS,
  });

  if (typeof response.data !== "string") {
    throw new Error("IR Farm returned an unexpected response");
  }

  return parseMandiRatesHtml(response.data);
}
