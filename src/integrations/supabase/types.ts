export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      participations: {
        Row: {
          created_at: string
          id: string
          mercado_pago_payment_id: string | null
          partner_2_nick: string | null
          partner_3_nick: string | null
          partner_nick: string | null
          payment_created_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          screenshot_1_url: string | null
          screenshot_2_url: string | null
          screenshot_3_url: string | null
          screenshot_4_url: string | null
          slot_number: number | null
          tournament_id: string
          unique_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mercado_pago_payment_id?: string | null
          partner_2_nick?: string | null
          partner_3_nick?: string | null
          partner_nick?: string | null
          payment_created_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          screenshot_1_url?: string | null
          screenshot_2_url?: string | null
          screenshot_3_url?: string | null
          screenshot_4_url?: string | null
          slot_number?: number | null
          tournament_id: string
          unique_token?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mercado_pago_payment_id?: string | null
          partner_2_nick?: string | null
          partner_3_nick?: string | null
          partner_nick?: string | null
          payment_created_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          screenshot_1_url?: string | null
          screenshot_2_url?: string | null
          screenshot_3_url?: string | null
          screenshot_4_url?: string | null
          slot_number?: number | null
          tournament_id?: string
          unique_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cep: string | null
          cpf: string | null
          created_at: string
          full_name: string | null
          hs_rate: number | null
          id: string
          is_banned: boolean
          kda_global: number | null
          points: number | null
          rank: Database["public"]["Enums"]["user_rank"]
          updated_at: string
          username: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          cep?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          hs_rate?: number | null
          id: string
          is_banned?: boolean
          kda_global?: number | null
          points?: number | null
          rank?: Database["public"]["Enums"]["user_rank"]
          updated_at?: string
          username?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          cep?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          hs_rate?: number | null
          id?: string
          is_banned?: boolean
          kda_global?: number | null
          points?: number | null
          rank?: Database["public"]["Enums"]["user_rank"]
          updated_at?: string
          username?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      social_feed: {
        Row: {
          caption: string | null
          comments_count: number | null
          content_type: string | null
          content_url: string | null
          created_at: string
          id: string
          likes_count: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participant_counts: {
        Row: {
          paid_count: number
          tournament_id: string
          updated_at: string
        }
        Insert: {
          paid_count?: number
          tournament_id: string
          updated_at?: string
        }
        Update: {
          paid_count?: number
          tournament_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          entry_fee: number
          game: Database["public"]["Enums"]["game_type"]
          game_mode: Database["public"]["Enums"]["game_mode"]
          id: string
          max_participants: number | null
          name: string
          prize_pool: number
          rules: string | null
          start_date: string
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          entry_fee?: number
          game: Database["public"]["Enums"]["game_type"]
          game_mode?: Database["public"]["Enums"]["game_mode"]
          id?: string
          max_participants?: number | null
          name: string
          prize_pool?: number
          rules?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          entry_fee?: number
          game?: Database["public"]["Enums"]["game_type"]
          game_mode?: Database["public"]["Enums"]["game_mode"]
          id?: string
          max_participants?: number | null
          name?: string
          prize_pool?: number
          rules?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          body: Json | null
          created_at: string
          error_message: string | null
          headers: Json | null
          id: string
          method: string
          query_params: Json | null
          response: Json | null
          source: string
          status_code: number | null
        }
        Insert: {
          body?: Json | null
          created_at?: string
          error_message?: string | null
          headers?: Json | null
          id?: string
          method: string
          query_params?: Json | null
          response?: Json | null
          source?: string
          status_code?: number | null
        }
        Update: {
          body?: Json | null
          created_at?: string
          error_message?: string | null
          headers?: Json | null
          id?: string
          method?: string
          query_params?: Json | null
          response?: Json | null
          source?: string
          status_code?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _refresh_tournament_participant_count: {
        Args: { _tournament_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      game_mode: "solo" | "dupla" | "trio" | "squad"
      game_type:
        | "freefire"
        | "wildrift"
        | "valorant"
        | "codmobile"
        | "cs2"
        | "pubg"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      tournament_status:
        | "upcoming"
        | "open"
        | "in_progress"
        | "finished"
        | "cancelled"
      user_rank: "D" | "C" | "B" | "A" | "S" | "PRO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      game_mode: ["solo", "dupla", "trio", "squad"],
      game_type: [
        "freefire",
        "wildrift",
        "valorant",
        "codmobile",
        "cs2",
        "pubg",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      tournament_status: [
        "upcoming",
        "open",
        "in_progress",
        "finished",
        "cancelled",
      ],
      user_rank: ["D", "C", "B", "A", "S", "PRO"],
    },
  },
} as const
