export const MANDI_CITIES = [
  "lahore",
  "karachi",
  "multan",
  "islamabad",
] as const;

export type MandiCity = (typeof MANDI_CITIES)[number];

export type MandiCityRate = {
  min: number;
  max: number;
  change: number;
};

export type MandiRate = {
  id: string;
  name: string;
  urdu: string;
  unit: string;
  average: number;
  change: number;
  imageUrl: string | null;
  cityRates: Partial<Record<MandiCity, MandiCityRate>>;
};

export type MandiSnapshot = {
  rates: MandiRate[];
  sourceUpdatedAt: string | null;
  fetchedAt: string;
};
