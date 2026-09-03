import {
  readCachedMandiRates,
  writeCachedMandiRates,
} from "@/services/mandi/device-cache";
import { fetchMandiRates } from "@/services/mandi/fetch-mandi-rates";
import {
  getRememberedMandiSnapshot,
  rememberMandiSnapshot,
} from "@/services/mandi/memory";
import type { MandiSnapshot } from "@/services/mandi/types";

const FRESH_SNAPSHOT_MS = 6 * 60 * 60 * 1_000;

let pendingSnapshot: Promise<MandiSnapshot | null> | null = null;

/** Returns recent rates quickly and refreshes missing or stale rates from the source. */
export function loadMandiSnapshotForGemini(): Promise<MandiSnapshot | null> {
  if (!pendingSnapshot) {
    pendingSnapshot = loadSnapshot().finally(() => {
      pendingSnapshot = null;
    });
  }

  return pendingSnapshot;
}

async function loadSnapshot(): Promise<MandiSnapshot | null> {
  let fallback = getRememberedMandiSnapshot();

  if (isFresh(fallback)) {
    return fallback;
  }

  const cached = await readCachedMandiRates();
  fallback = newestSnapshot(fallback, cached);
  if (fallback) {
    // readCachedMandiRates remembers its result, which may be older than memory.
    rememberMandiSnapshot(fallback);
  }

  if (isFresh(fallback)) {
    return fallback;
  }

  try {
    const live = await fetchMandiRates();
    await writeCachedMandiRates(live);
    return live;
  } catch {
    return fallback;
  }
}

function isFresh(snapshot: MandiSnapshot | null): boolean {
  if (!hasUsableRate(snapshot)) return false;

  const fetchedAt = Date.parse(snapshot.fetchedAt);
  const age = Date.now() - fetchedAt;
  return (
    Number.isFinite(fetchedAt) &&
    age >= -5 * 60 * 1_000 &&
    age < FRESH_SNAPSHOT_MS
  );
}

function hasUsableRate(snapshot: MandiSnapshot | null): snapshot is MandiSnapshot {
  return Boolean(
    snapshot?.rates.some(
      (rate) =>
        rate &&
        typeof rate.name === "string" &&
        rate.name.trim() &&
        typeof rate.unit === "string" &&
        rate.unit.trim() &&
        Number.isFinite(rate.average) &&
        rate.average > 0,
    ),
  );
}

function newestSnapshot(
  first: MandiSnapshot | null,
  second: MandiSnapshot | null,
): MandiSnapshot | null {
  if (!first) return second;
  if (!second) return first;

  const firstTime = Date.parse(first.fetchedAt);
  const secondTime = Date.parse(second.fetchedAt);

  if (!Number.isFinite(firstTime)) return second;
  if (!Number.isFinite(secondTime)) return first;
  return secondTime > firstTime ? second : first;
}
