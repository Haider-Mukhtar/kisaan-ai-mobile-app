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
  farm_size_acres: number | null;
  crops: string[];
  profile_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  phone: string;
  full_name?: string | null;
  village?: string | null;
  farm_size_acres?: number | null;
  crops?: string[];
  profile_completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Partial<Omit<ProfileInsert, "id">>;

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
