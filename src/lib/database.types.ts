// Mirrors dietplan/src/lib/database.types.ts. Hand-written to match the
// `dp` schema. Keep in sync when migrations change. We intentionally
// duplicate rather than alias the web file because mobile and web evolve
// at different paces; the migrations themselves are the source of truth.

import type { PlanSnapshot, PlanSnapshotRevision } from '@/lib/plans/snapshot';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TickStatus = 'eaten' | 'partial' | 'skipped';
export type PlanStatus = 'active' | 'upcoming' | 'archived';
export type FoodCategory = 'produce' | 'dairy' | 'grains' | 'protein' | 'other';
export type FoodCategorySource = 'seed' | 'llm' | 'manual';

type DietitianRow = {
  id: string;
  email: string;
  name: string;
  locale: string;
  timezone: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

type ClientRow = {
  id: string;
  dietitian_id: string;
  user_id: string | null;
  email: string;
  name: string;
  locale: string;
  timezone: string;
  invited_at: string;
  activated_at: string | null;
  archived_at: string | null;
  show_macros_to_client: boolean;
  last_viewed_cycle_day: number | null;
};

type ClientPlanRow = {
  id: string;
  client_id: string;
  template_id: string | null;
  name: string;
  snapshot: PlanSnapshot;
  revisions: PlanSnapshotRevision[];
  start_date: string | null;
  status: PlanStatus;
  archived_at: string | null;
  created_at: string;
};

type TickRow = {
  id: string;
  client_plan_id: string;
  snapshot_recipe_id: string;
  snapshot_alternative_id: string | null;
  cycle_day: number;
  status: TickStatus;
  eaten_at: string;
  note: string | null;
  ingredients_eaten: string[] | null;
  photo_url: string | null;
};

type WeightLogRow = {
  id: string;
  client_id: string;
  kg: string;
  logged_at: string;
};

type MealNoteRow = {
  id: string;
  client_plan_id: string;
  cycle_day: number;
  meal_label: string;
  body: string;
  created_at: string;
};

type ShoppingListOverrideRow = {
  id: string;
  client_id: string;
  item_name_normalized: string;
  marked_have_at: string;
};

type FoodCategoryRow = {
  id: string;
  item_name_normalized: string;
  category: FoodCategory;
  source: FoodCategorySource;
  locale: string;
  created_at: string;
};

type FoodCategoryOverrideRow = {
  id: string;
  dietitian_id: string;
  item_name_normalized: string;
  category: FoodCategory;
  created_at: string;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: '12' };
  dp: {
    Tables: {
      dietitians: { Row: DietitianRow; Insert: DietitianRow; Update: Partial<DietitianRow>; Relationships: [] };
      clients: {
        Row: ClientRow;
        Insert: Partial<ClientRow> & { dietitian_id: string; email: string; name: string };
        Update: Partial<ClientRow>;
        Relationships: [];
      };
      client_plans: {
        Row: ClientPlanRow;
        Insert: Partial<ClientPlanRow> & { client_id: string; name: string; snapshot: PlanSnapshot };
        Update: Partial<ClientPlanRow>;
        Relationships: [];
      };
      ticks: {
        Row: TickRow;
        Insert: Partial<TickRow> & {
          client_plan_id: string;
          snapshot_recipe_id: string;
          cycle_day: number;
          status: TickStatus;
        };
        Update: Partial<TickRow>;
        Relationships: [];
      };
      weight_logs: {
        Row: WeightLogRow;
        Insert: Partial<Omit<WeightLogRow, 'kg'>> & {
          client_id: string;
          kg: number | string;
        };
        Update: Partial<WeightLogRow>;
        Relationships: [];
      };
      meal_notes: {
        Row: MealNoteRow;
        Insert: Partial<MealNoteRow> & {
          client_plan_id: string;
          cycle_day: number;
          meal_label: string;
          body: string;
        };
        Update: Partial<MealNoteRow>;
        Relationships: [];
      };
      shopping_list_overrides: {
        Row: ShoppingListOverrideRow;
        Insert: Partial<ShoppingListOverrideRow> & {
          client_id: string;
          item_name_normalized: string;
        };
        Update: Partial<ShoppingListOverrideRow>;
        Relationships: [];
      };
      food_categories: {
        Row: FoodCategoryRow;
        Insert: Partial<FoodCategoryRow> & {
          item_name_normalized: string;
          category: FoodCategory;
          source: FoodCategorySource;
        };
        Update: Partial<FoodCategoryRow>;
        Relationships: [];
      };
      food_category_overrides: {
        Row: FoodCategoryOverrideRow;
        Insert: Partial<FoodCategoryOverrideRow> & {
          dietitian_id: string;
          item_name_normalized: string;
          category: FoodCategory;
        };
        Update: Partial<FoodCategoryOverrideRow>;
        Relationships: [];
      };
    };
    Enums: {
      tick_status: TickStatus;
      plan_status: PlanStatus;
      food_category: FoodCategory;
      food_category_source: FoodCategorySource;
    };
    Views: Record<never, never>;
    Functions: {
      set_last_viewed_cycle_day: { Args: { p_cycle_day: number }; Returns: void };
      bind_invited_client: { Args: { p_email: string }; Returns: void };
      delete_my_client_account: { Args: Record<string, never>; Returns: void };
    };
    CompositeTypes: Record<never, never>;
  };
};

export type Dietitian = DietitianRow;
export type Client = ClientRow;
export type ClientPlan = ClientPlanRow;
export type Tick = TickRow;
export type WeightLog = WeightLogRow;
export type MealNote = MealNoteRow;
export type ShoppingListOverride = ShoppingListOverrideRow;
