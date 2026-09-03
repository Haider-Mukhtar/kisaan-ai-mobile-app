import { useLocalSearchParams } from "expo-router";

import { MandiRateSheet } from "@/components/mandi/rate-sheet";

export default function MandiRateScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <MandiRateSheet id={id} />;
}
