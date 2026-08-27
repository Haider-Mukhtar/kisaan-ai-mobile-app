/**
 * Hand-maintained to match `supabase/migrations`. Regenerate from the live
 * schema once the CLI is linked to the project:
 * npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  id: string;
  phone: string;
  full_name: string | null;
  village: string | null;
  city: string | null;
  farm_size_acres: number | null;
  crops: string[];
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  location_source: string | null;
  location_updated_at: string | null;
  profile_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  phone: string;
  full_name?: string | null;
  village?: string | null;
  city?: string | null;
  farm_size_acres?: number | null;
  crops?: string[];
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_source?: string | null;
  location_updated_at?: string | null;
  profile_completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Partial<Omit<ProfileInsert, "id">>;

export type WeatherForecastRow = {
  district: string;
  forecast_date: string;
  latitude: number;
  longitude: number;
  weather_code: number;
  temp_max_c: number;
  temp_min_c: number;
  precipitation_mm: number;
  precipitation_chance: number | null;
  wind_max_kph: number | null;
  observed_temp_c: number | null;
  observed_humidity: number | null;
  observed_wind_kph: number | null;
  observed_weather_code: number | null;
  observed_at: string | null;
  fetched_at: string;
};

/** Rows are only ever written through `cache_weather_forecast`. */
export type WeatherForecastInsert = WeatherForecastRow;
export type WeatherForecastUpdate = Partial<WeatherForecastRow>;

export type CacheWeatherForecastArgs = {
  p_district: string;
  p_latitude: number;
  p_longitude: number;
  p_days: Json;
  p_observation?: Json;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      weather_forecasts: {
        Row: WeatherForecastRow;
        Insert: WeatherForecastInsert;
        Update: WeatherForecastUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      cache_weather_forecast: {
        Args: CacheWeatherForecastArgs;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
