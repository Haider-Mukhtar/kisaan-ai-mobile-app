import type { MandiRate, MandiSnapshot } from "@/services/mandi/types";

let snapshot: MandiSnapshot | null = null;

export function rememberMandiSnapshot(next: MandiSnapshot) {
  snapshot = next;
}

export function getRememberedMandiSnapshot(): MandiSnapshot | null {
  return snapshot;
}

export function findRememberedMandiRate(id: string): MandiRate | null {
  if (!id) return null;
  return snapshot?.rates.find((rate) => rate.id === id) ?? null;
}
