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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          admin_whatsapp: string | null
          daily_amount: number
          id: number
          pix_copy_paste: string | null
          pix_key: string | null
          pix_key_type: string | null
          pix_qr_url: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_whatsapp?: string | null
          daily_amount?: number
          id?: number
          pix_copy_paste?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          pix_qr_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_whatsapp?: string | null
          daily_amount?: number
          id?: number
          pix_copy_paste?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          pix_qr_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          contribution_date: string
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          contribution_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          contribution_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          from_user_id: string
          id: string
          read_at: string | null
          ticket_id: string | null
          to_admins: boolean
          to_user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          from_user_id: string
          id?: string
          read_at?: string | null
          ticket_id?: string | null
          to_admins?: boolean
          to_user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          from_user_id?: string
          id?: string
          read_at?: string | null
          ticket_id?: string | null
          to_admins?: boolean
          to_user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notif_type"]
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notif_type"]
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notif_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          active_participants: number
          amount: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payout_date: string
          user_id: string
        }
        Insert: {
          active_participants: number
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payout_date?: string
          user_id: string
        }
        Update: {
          active_participants?: number
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payout_date?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepted_terms_at: string
          avatar_url: string | null
          banned_at: string | null
          banned_reason: string | null
          cpf: string | null
          cpf_valid: boolean
          created_at: string
          face_match_score: number | null
          face_verified: boolean
          full_name: string
          has_received: boolean
          id: string
          invite_code: string
          invited_by: string | null
          is_active: boolean
          is_banned: boolean
          phone: string | null
          receive_position: number | null
          received_at: string | null
          selfie_url: string | null
          updated_at: string
        }
        Insert: {
          accepted_terms_at?: string
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          cpf?: string | null
          cpf_valid?: boolean
          created_at?: string
          face_match_score?: number | null
          face_verified?: boolean
          full_name: string
          has_received?: boolean
          id: string
          invite_code?: string
          invited_by?: string | null
          is_active?: boolean
          is_banned?: boolean
          phone?: string | null
          receive_position?: number | null
          received_at?: string | null
          selfie_url?: string | null
          updated_at?: string
        }
        Update: {
          accepted_terms_at?: string
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          cpf?: string | null
          cpf_valid?: boolean
          created_at?: string
          face_match_score?: number | null
          face_verified?: boolean
          full_name?: string
          has_received?: boolean
          id?: string
          invite_code?: string
          invited_by?: string | null
          is_active?: boolean
          is_banned?: boolean
          phone?: string | null
          receive_position?: number | null
          received_at?: string | null
          selfie_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      document_status: "pending" | "approved" | "rejected"
      document_type:
        | "rg"
        | "cnh"
        | "address_proof"
        | "payment_proof"
        | "other"
        | "selfie"
      notif_type: "info" | "warning" | "success" | "alert"
      ticket_priority: "low" | "normal" | "high"
      ticket_status: "open" | "in_progress" | "closed"
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
      app_role: ["admin", "user"],
      document_status: ["pending", "approved", "rejected"],
      document_type: [
        "rg",
        "cnh",
        "address_proof",
        "payment_proof",
        "other",
        "selfie",
      ],
      notif_type: ["info", "warning", "success", "alert"],
      ticket_priority: ["low", "normal", "high"],
      ticket_status: ["open", "in_progress", "closed"],
    },
  },
} as const
