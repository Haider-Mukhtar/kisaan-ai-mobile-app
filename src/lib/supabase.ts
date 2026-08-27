import "expo-sqlite/localStorage/install";

import { createClient } from "@supabase/supabase-js";
import { AppState, type AppStateStatus } from "react-native";

import type { Database } from "@/types/database";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env",
  );
}

const serverStorageValues = new Map<string, string>();
const serverStorage: Pick<Storage, "getItem" | "setItem" | "removeItem"> = {
  getItem: (key) => serverStorageValues.get(key) ?? null,
  setItem: (key, value) => serverStorageValues.set(key, value),
  removeItem: (key) => serverStorageValues.delete(key),
};
const hasPersistentStorage = typeof globalThis.localStorage !== "undefined";
const authStorage = hasPersistentStorage
  ? globalThis.localStorage
  : serverStorage;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: hasPersistentStorage,
      detectSessionInUrl: false,
    },
  },
);

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState === "active") {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
}

AppState.addEventListener("change", handleAppStateChange);
