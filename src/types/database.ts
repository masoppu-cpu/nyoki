/**
 * Supabase データベーススキーマ型定義
 * チケット: COMMON-002 TypeScript型定義
 */

import { Plant, UserPlant, PlantCategory, PlantSize, DifficultyLevel, LightRequirement, WateringFrequency } from './index';

// Supabase Database型定義
export interface Database {
  public: {
    Tables: {
      // プロファイルテーブル
      profiles: {
        Row: {
          id: string;
          name: string | null;
          avatar_url: string | null;
          is_premium: boolean;
          plant_count: number;
          ai_generation_used: number;
          ai_consultation_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          plant_count?: number;
          ai_generation_used?: number;
          ai_consultation_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          plant_count?: number;
          ai_generation_used?: number;
          ai_consultation_used?: number;
          updated_at?: string;
        };
      };

      // 植物マスタテーブル
      plants: {
        Row: {
          id: string;
          name: string;
          scientific_name: string | null;
          price: number;
          size: PlantSize;
          difficulty: DifficultyLevel;
          light_requirement: LightRequirement;
          watering_frequency: WateringFrequency;
          description: string;
          care_tips: string | null;
          image_url: string;
          category: PlantCategory;
          stock: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['plants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['plants']['Row'], 'id' | 'created_at'>>;
      };

      // ユーザー植物テーブル
      user_plants: {
        Row: {
          id: string;
          user_id: string;
          plant_id: string;
          nickname: string | null;
          location: string;
          last_watered: string;
          watering_interval_days: number;
          health_status: 'healthy' | 'warning' | 'critical';
          notes: string | null;
          purchase_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_plants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['user_plants']['Row'], 'id' | 'created_at' | 'user_id'>>;
      };

      // 水やり履歴テーブル
      watering_logs: {
        Row: {
          id: string;
          user_plant_id: string;
          watered_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['watering_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['watering_logs']['Row'], 'id' | 'created_at'>>;
      };

      // 部屋分析テーブル
      room_analyses: {
        Row: {
          id: string;
          user_id: string | null;
          image_url: string;
          room_type: string;
          light_level: LightRequirement;
          room_style: PlantCategory | null;
          ai_suggestions: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['room_analyses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['room_analyses']['Row'], 'id' | 'created_at'>>;
      };

      // AR画像生成履歴テーブル
      ar_generations: {
        Row: {
          id: string;
          user_id: string | null;
          room_analysis_id: string;
          plant_id: string;
          original_image_url: string;
          generated_image_url: string;
          position: { x: number; y: number } | null;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ar_generations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['ar_generations']['Row'], 'id' | 'created_at'>>;
      };

      // 購入検討リストテーブル
      purchase_lists: {
        Row: {
          id: string;
          user_id: string;
          plant_id: string;
          status: 'considering' | 'purchased';
          external_url: string | null;
          notes: string | null;
          added_at: string;
          purchased_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['purchase_lists']['Row'], 'id' | 'added_at'>;
        Update: Partial<Omit<Database['public']['Tables']['purchase_lists']['Row'], 'id' | 'user_id' | 'plant_id' | 'added_at'>>;
      };

      // サブスクリプションテーブル
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: 'free' | 'premium';
          status: 'active' | 'cancelled' | 'expired';
          started_at: string;
          expires_at: string | null;
          cancelled_at: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'user_id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// ヘルパー型
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// テーブル名の型
export type TableName = keyof Database['public']['Tables'];

// RLSポリシー用の型
export interface RLSPolicy {
  table: TableName;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  check?: string;
  using?: string;
}