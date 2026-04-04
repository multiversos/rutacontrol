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
      current_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["app_role"] | null;
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
      touch_last_login: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin" | "registrador";
      audit_action: "create" | "update" | "delete" | "close";
      bus_status: "active" | "maintenance" | "inactive";
      daily_record_status: "draft" | "closed";
      expense_category: "fuel" | "worker_payment" | "other";
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
