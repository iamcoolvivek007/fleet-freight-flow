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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      charges: {
        Row: {
          amount: number
          charge_type: string
          charged_to: string
          created_at: string
          description: string | null
          id: string
          load_assignment_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          charge_type: string
          charged_to: string
          created_at?: string
          description?: string | null
          id?: string
          load_assignment_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          charge_type?: string
          charged_to?: string
          created_at?: string
          description?: string | null
          id?: string
          load_assignment_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expense_type: string
          id: string
          load_assignment_id: string
          payment_date: string
          payment_method: string
          receipt_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          expense_type: string
          id?: string
          load_assignment_id: string
          payment_date?: string
          payment_method: string
          receipt_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_type?: string
          id?: string
          load_assignment_id?: string
          payment_date?: string
          payment_method?: string
          receipt_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      load_assignments: {
        Row: {
          assigned_at: string | null
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string | null
          final_settlement_date: string | null
          id: string
          load_id: string
          net_profit: number | null
          settlement_status: string | null
          total_charges: number | null
          total_expenses: number | null
          truck_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          final_settlement_date?: string | null
          id?: string
          load_id: string
          net_profit?: number | null
          settlement_status?: string | null
          total_charges?: number | null
          total_expenses?: number | null
          truck_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          final_settlement_date?: string | null
          id?: string
          load_id?: string
          net_profit?: number | null
          settlement_status?: string | null
          total_charges?: number | null
          total_expenses?: number | null
          truck_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "load_assignments_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_assignments_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      load_providers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          phone: string
          provider_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          phone: string
          provider_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string
          provider_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loads: {
        Row: {
          created_at: string | null
          id: string
          load_provider_id: string
          loading_location: string
          material_description: string
          material_weight: number
          payment_model: string | null
          profit: number | null
          provider_freight: number
          status: Database["public"]["Enums"]["load_status"] | null
          truck_freight: number | null
          unloading_location: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          load_provider_id: string
          loading_location: string
          material_description: string
          material_weight: number
          payment_model?: string | null
          profit?: number | null
          provider_freight: number
          status?: Database["public"]["Enums"]["load_status"] | null
          truck_freight?: number | null
          unloading_location: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          load_provider_id?: string
          loading_location?: string
          material_description?: string
          material_weight?: number
          payment_model?: string | null
          profit?: number | null
          provider_freight?: number
          status?: Database["public"]["Enums"]["load_status"] | null
          truck_freight?: number | null
          unloading_location?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loads_load_provider_id_fkey"
            columns: ["load_provider_id"]
            isOneToOne: false
            referencedRelation: "load_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          load_assignment_id: string | null
          notes: string | null
          payment_details: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          transaction_date: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          load_assignment_id?: string | null
          notes?: string | null
          payment_details?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          transaction_date?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          load_assignment_id?: string | null
          notes?: string | null
          payment_details?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          transaction_date?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_load_assignment_id_fkey"
            columns: ["load_assignment_id"]
            isOneToOne: false
            referencedRelation: "load_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      trucks: {
        Row: {
          carrying_capacity: number
          created_at: string | null
          driver_image_url: string | null
          driver_name: string
          driver_phone: string
          id: string
          inactive_reason: string | null
          is_active: boolean | null
          owner_name: string
          owner_phone: string
          third_party_contact: string | null
          third_party_name: string | null
          truck_image_url: string | null
          truck_length: number
          truck_number: string
          truck_type: Database["public"]["Enums"]["truck_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          carrying_capacity: number
          created_at?: string | null
          driver_image_url?: string | null
          driver_name: string
          driver_phone: string
          id?: string
          inactive_reason?: string | null
          is_active?: boolean | null
          owner_name: string
          owner_phone: string
          third_party_contact?: string | null
          third_party_name?: string | null
          truck_image_url?: string | null
          truck_length: number
          truck_number: string
          truck_type: Database["public"]["Enums"]["truck_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          carrying_capacity?: number
          created_at?: string | null
          driver_image_url?: string | null
          driver_name?: string
          driver_phone?: string
          id?: string
          inactive_reason?: string | null
          is_active?: boolean | null
          owner_name?: string
          owner_phone?: string
          third_party_contact?: string | null
          third_party_name?: string | null
          truck_image_url?: string | null
          truck_length?: number
          truck_number?: string
          truck_type?: Database["public"]["Enums"]["truck_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      load_status:
        | "pending"
        | "assigned"
        | "in_transit"
        | "delivered"
        | "completed"
      payment_method: "cash" | "upi" | "bank_transfer"
      transaction_type:
        | "advance_to_driver"
        | "balance_to_driver"
        | "advance_from_provider"
        | "balance_from_provider"
        | "commission"
      truck_type: "open" | "container"
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
      load_status: [
        "pending",
        "assigned",
        "in_transit",
        "delivered",
        "completed",
      ],
      payment_method: ["cash", "upi", "bank_transfer"],
      transaction_type: [
        "advance_to_driver",
        "balance_to_driver",
        "advance_from_provider",
        "balance_from_provider",
        "commission",
      ],
      truck_type: ["open", "container"],
    },
  },
} as const
