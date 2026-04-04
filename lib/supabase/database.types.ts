export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"];
          bus_id: string | null;
          created_at: string;
          daily_record_id: string | null;
          dedupe_key: string | null;
          id: string;
          message: string;
          metadata: Json;
          profile_id: string | null;
          read: boolean;
          read_at: string | null;
          severity: Database["public"]["Enums"]["alert_severity"];
        };
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"];
          bus_id?: string | null;
          created_at?: string;
          daily_record_id?: string | null;
          dedupe_key?: string | null;
          id?: string;
          message: string;
          metadata?: Json;
          profile_id?: string | null;
          read?: boolean;
          read_at?: string | null;
          severity: Database["public"]["Enums"]["alert_severity"];
        };
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"];
          bus_id?: string | null;
          created_at?: string;
          daily_record_id?: string | null;
          dedupe_key?: string | null;
          id?: string;
          message?: string;
          metadata?: Json;
          profile_id?: string | null;
          read?: boolean;
          read_at?: string | null;
          severity?: Database["public"]["Enums"]["alert_severity"];
        };
        Relationships: [
          {
            foreignKeyName: "alerts_bus_id_fkey";
            columns: ["bus_id"];
            isOneToOne: false;
            referencedRelation: "buses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_daily_record_id_fkey";
            columns: ["daily_record_id"];
            isOneToOne: false;
            referencedRelation: "daily_records";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"];
          created_at: string;
          id: string;
          new_values: Json | null;
          old_values: Json | null;
          record_id: string;
          table_name: string;
          user_id: string | null;
        };
        Insert: {
          action: Database["public"]["Enums"]["audit_action"];
          created_at?: string;
          id?: string;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id: string;
          table_name: string;
          user_id?: string | null;
        };
        Update: {
          action?: Database["public"]["Enums"]["audit_action"];
          created_at?: string;
          id?: string;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id?: string;
          table_name?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      buses: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          plate: string;
          route_id: string;
          status: Database["public"]["Enums"]["bus_status"];
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          plate: string;
          route_id: string;
          status?: Database["public"]["Enums"]["bus_status"];
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          plate?: string;
          route_id?: string;
          status?: Database["public"]["Enums"]["bus_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "buses_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_records: {
        Row: {
          bus_id: string;
          calculated_net: string;
          closed_at: string | null;
          closure_hash: string | null;
          created_at: string;
          departure_time: string | null;
          difference: string;
          exchange_rate: string | null;
          fuel_cost: string | null;
          id: string;
          income_bs: string | null;
          income_usd: string;
          net_profit_usd: string | null;
          notes: string | null;
          other_expenses: string | null;
          record_date: string;
          status: Database["public"]["Enums"]["daily_record_status"];
          updated_at: string;
          user_id: string;
          worker_payment: string | null;
        };
        Insert: {
          bus_id: string;
          calculated_net?: string;
          closed_at?: string | null;
          closure_hash?: string | null;
          created_at?: string;
          departure_time?: string | null;
          difference?: string;
          exchange_rate?: string | null;
          fuel_cost?: string | null;
          id?: string;
          income_bs?: string | null;
          income_usd?: string;
          net_profit_usd?: string | null;
          notes?: string | null;
          other_expenses?: string | null;
          record_date: string;
          status?: Database["public"]["Enums"]["daily_record_status"];
          updated_at?: string;
          user_id: string;
          worker_payment?: string | null;
        };
        Update: {
          bus_id?: string;
          calculated_net?: string;
          closed_at?: string | null;
          closure_hash?: string | null;
          created_at?: string;
          departure_time?: string | null;
          difference?: string;
          exchange_rate?: string | null;
          fuel_cost?: string | null;
          id?: string;
          income_bs?: string | null;
          income_usd?: string;
          net_profit_usd?: string | null;
          notes?: string | null;
          other_expenses?: string | null;
          record_date?: string;
          status?: Database["public"]["Enums"]["daily_record_status"];
          updated_at?: string;
          user_id?: string;
          worker_payment?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_records_bus_id_fkey";
            columns: ["bus_id"];
            isOneToOne: false;
            referencedRelation: "buses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_records_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      debt_payments: {
        Row: {
          amount_usd: string;
          created_at: string;
          created_by: string;
          debt_id: string;
          id: string;
          notes: string | null;
          payment_date: string;
          updated_at: string;
        };
        Insert: {
          amount_usd: string;
          created_at?: string;
          created_by: string;
          debt_id: string;
          id?: string;
          notes?: string | null;
          payment_date?: string;
          updated_at?: string;
        };
        Update: {
          amount_usd?: string;
          created_at?: string;
          created_by?: string;
          debt_id?: string;
          id?: string;
          notes?: string | null;
          payment_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "debt_payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "debt_payments_debt_id_fkey";
            columns: ["debt_id"];
            isOneToOne: false;
            referencedRelation: "debts";
            referencedColumns: ["id"];
          },
        ];
      };
      debts: {
        Row: {
          amount_paid_usd: string;
          amount_usd: string;
          balance_due_usd: string;
          created_at: string;
          created_by: string;
          creditor: string;
          daily_record_id: string | null;
          description: string;
          due_date: string | null;
          id: string;
          status: Database["public"]["Enums"]["debt_status"];
          updated_at: string;
        };
        Insert: {
          amount_paid_usd?: string;
          amount_usd: string;
          balance_due_usd?: string;
          created_at?: string;
          created_by: string;
          creditor: string;
          daily_record_id?: string | null;
          description: string;
          due_date?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["debt_status"];
          updated_at?: string;
        };
        Update: {
          amount_paid_usd?: string;
          amount_usd?: string;
          balance_due_usd?: string;
          created_at?: string;
          created_by?: string;
          creditor?: string;
          daily_record_id?: string | null;
          description?: string;
          due_date?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["debt_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "debts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "debts_daily_record_id_fkey";
            columns: ["daily_record_id"];
            isOneToOne: false;
            referencedRelation: "daily_records";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount_bs: string | null;
          amount_usd: string;
          category: Database["public"]["Enums"]["expense_category"];
          created_at: string;
          daily_record_id: string;
          description: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          amount_bs?: string | null;
          amount_usd?: string;
          category: Database["public"]["Enums"]["expense_category"];
          created_at?: string;
          daily_record_id: string;
          description?: string | null;
          id?: string;
          updated_at?: string;
        };
        Update: {
          amount_bs?: string | null;
          amount_usd?: string;
          category?: Database["public"]["Enums"]["expense_category"];
          created_at?: string;
          daily_record_id?: string;
          description?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_daily_record_id_fkey";
            columns: ["daily_record_id"];
            isOneToOne: false;
            referencedRelation: "daily_records";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          active: boolean;
          created_at: string;
          email: string;
          id: string;
          last_login: string | null;
          name: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          email: string;
          id: string;
          last_login?: string | null;
          name: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          email?: string;
          id?: string;
          last_login?: string | null;
          name?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      repair_attachments: {
        Row: {
          bucket_name: string;
          content_type: string;
          created_at: string;
          file_size_bytes: number;
          id: string;
          object_path: string;
          original_name: string;
          repair_id: string;
        };
        Insert: {
          bucket_name?: string;
          content_type: string;
          created_at?: string;
          file_size_bytes: number;
          id?: string;
          object_path: string;
          original_name: string;
          repair_id: string;
        };
        Update: {
          bucket_name?: string;
          content_type?: string;
          created_at?: string;
          file_size_bytes?: number;
          id?: string;
          object_path?: string;
          original_name?: string;
          repair_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "repair_attachments_repair_id_fkey";
            columns: ["repair_id"];
            isOneToOne: false;
            referencedRelation: "repairs";
            referencedColumns: ["id"];
          },
        ];
      };
      repairs: {
        Row: {
          bus_id: string;
          category: Database["public"]["Enums"]["repair_category"];
          cost_usd: string;
          created_at: string;
          created_by: string;
          description: string;
          id: string;
          next_service_due_date: string | null;
          next_service_notes: string | null;
          provider: string;
          repair_date: string;
          updated_at: string;
        };
        Insert: {
          bus_id: string;
          category?: Database["public"]["Enums"]["repair_category"];
          cost_usd: string;
          created_at?: string;
          created_by: string;
          description: string;
          id?: string;
          next_service_due_date?: string | null;
          next_service_notes?: string | null;
          provider: string;
          repair_date?: string;
          updated_at?: string;
        };
        Update: {
          bus_id?: string;
          category?: Database["public"]["Enums"]["repair_category"];
          cost_usd?: string;
          created_at?: string;
          created_by?: string;
          description?: string;
          id?: string;
          next_service_due_date?: string | null;
          next_service_notes?: string | null;
          provider?: string;
          repair_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "repairs_bus_id_fkey";
            columns: ["bus_id"];
            isOneToOne: false;
            referencedRelation: "buses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "repairs_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      routes: {
        Row: {
          active: boolean;
          created_at: string;
          destination: string;
          expected_income: string | null;
          id: string;
          name: string;
          origin: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          destination: string;
          expected_income?: string | null;
          id?: string;
          name: string;
          origin: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          destination?: string;
          expected_income?: string | null;
          id?: string;
          name?: string;
          origin?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_login_alert: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      create_repair_with_receipt: {
        Args: {
          _bucket_name?: string | null;
          _bus_id: string;
          _category: Database["public"]["Enums"]["repair_category"];
          _content_type?: string | null;
          _cost_usd: string | number;
          _description: string;
          _file_size_bytes?: number | null;
          _next_service_due_date?: string | null;
          _next_service_notes?: string | null;
          _object_path?: string | null;
          _original_name?: string | null;
          _provider: string;
          _repair_date: string;
          _repair_id: string;
        };
        Returns: string;
      };
      current_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["app_role"] | null;
      };
      get_difference_alert_severity: {
        Args: {
          _difference: string | number | null;
        };
        Returns: Database["public"]["Enums"]["alert_severity"];
      };
      is_active_user: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_registrador: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      reconcile_missing_closure_alerts: {
        Args: {
          _record_date?: string | null;
        };
        Returns: number;
      };
      touch_last_login: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      alert_severity: "info" | "warning" | "critical";
      alert_type: "login" | "closure" | "difference" | "missing";
      app_role: "admin" | "registrador";
      audit_action: "create" | "update" | "delete" | "close";
      bus_status: "active" | "maintenance" | "inactive";
      debt_status: "pending" | "partial" | "paid";
      daily_record_status: "draft" | "closed";
      expense_category: "fuel" | "worker_payment" | "other";
      repair_category:
        | "mechanical"
        | "electrical"
        | "bodywork"
        | "tires"
        | "oil_change"
        | "inspection"
        | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer Insert;
    }
    ? Insert
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer Insert;
      }
      ? Insert
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer Update;
    }
    ? Update
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer Update;
      }
      ? Update
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;
