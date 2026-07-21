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
      admin_auth_settings: {
        Row: {
          password_hash: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          password_hash: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          password_hash?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          business_days: number[]
          business_hour_end: number
          business_hour_start: number
          created_at: string
          delivery_time_label: string
          facebook_capi_token: string
          facebook_pixel_id: string
          id: string
          pix_key: string
          pix_key_type: string
          pix_merchant_city: string
          pix_merchant_name: string
          singleton: boolean
          support_phone: string
          updated_at: string
          utmify_api_key: string
          whatsapp_group_url: string
        }
        Insert: {
          business_days?: number[]
          business_hour_end?: number
          business_hour_start?: number
          created_at?: string
          delivery_time_label?: string
          facebook_capi_token?: string
          facebook_pixel_id?: string
          id?: string
          pix_key?: string
          pix_key_type?: string
          pix_merchant_city?: string
          pix_merchant_name?: string
          singleton?: boolean
          support_phone?: string
          updated_at?: string
          utmify_api_key?: string
          whatsapp_group_url?: string
        }
        Update: {
          business_days?: number[]
          business_hour_end?: number
          business_hour_start?: number
          created_at?: string
          delivery_time_label?: string
          facebook_capi_token?: string
          facebook_pixel_id?: string
          id?: string
          pix_key?: string
          pix_key_type?: string
          pix_merchant_city?: string
          pix_merchant_name?: string
          singleton?: boolean
          support_phone?: string
          updated_at?: string
          utmify_api_key?: string
          whatsapp_group_url?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json
          ms_on_section: number | null
          path: string | null
          referrer: string | null
          session_id: string
          target: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json
          ms_on_section?: number | null
          path?: string | null
          referrer?: string | null
          session_id: string
          target?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json
          ms_on_section?: number | null
          path?: string | null
          referrer?: string | null
          session_id?: string
          target?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          created_at: string
          display_name: string
          id: string
          last_login_at: string | null
          password_hash: string
          password_salt: string
          role: string
          status: string
          tenant_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id?: string
          last_login_at?: string | null
          password_hash: string
          password_salt: string
          role: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          last_login_at?: string | null
          password_hash?: string
          password_salt?: string
          role?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gateways: {
        Row: {
          ativo: boolean
          chave_pix: string
          chave_publica: string
          chave_secreta: string
          created_at: string
          id: string
          nome: string
          padrao: boolean
          prioridade: number
          tipo: Database["public"]["Enums"]["gateway_tipo"]
          tipo_chave_pix: string
          updated_at: string
          webhook_secret: string
        }
        Insert: {
          ativo?: boolean
          chave_pix?: string
          chave_publica?: string
          chave_secreta?: string
          created_at?: string
          id?: string
          nome: string
          padrao?: boolean
          prioridade?: number
          tipo: Database["public"]["Enums"]["gateway_tipo"]
          tipo_chave_pix?: string
          updated_at?: string
          webhook_secret?: string
        }
        Update: {
          ativo?: boolean
          chave_pix?: string
          chave_publica?: string
          chave_secreta?: string
          created_at?: string
          id?: string
          nome?: string
          padrao?: boolean
          prioridade?: number
          tipo?: Database["public"]["Enums"]["gateway_tipo"]
          tipo_chave_pix?: string
          updated_at?: string
          webhook_secret?: string
        }
        Relationships: []
      }
      impersonation_logs: {
        Row: {
          ended_at: string | null
          id: string
          ip: string | null
          master_user_id: string
          started_at: string
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          ip?: string | null
          master_user_id: string
          started_at?: string
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          ip?: string | null
          master_user_id?: string
          started_at?: string
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impersonation_logs_master_user_id_fkey"
            columns: ["master_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          quantity: number
          tenant_id: string | null
          unit_price_cents: number
          variant_id: string
          variant_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          quantity: number
          tenant_id?: string | null
          unit_price_cents: number
          variant_id: string
          variant_name: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          tenant_id?: string | null
          unit_price_cents?: number
          variant_id?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_city: string
          address_complement: string
          address_district: string
          address_number: string
          address_state: string
          address_street: string
          address_zip: string
          card_installments: number
          chargeback_flag: boolean
          created_at: string
          customer_cpf: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_status_override: string | null
          gateway_charge_id: string | null
          gateway_utilizado: string | null
          id: string
          invoice_url: string | null
          notes: string
          paid_at: string | null
          payment_method: string
          payment_status: string
          public_token: string
          rastreio_atualizado_em: string | null
          status_rastreio: string
          tenant_id: string | null
          total_cents: number
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          address_city: string
          address_complement?: string
          address_district?: string
          address_number: string
          address_state: string
          address_street: string
          address_zip: string
          card_installments?: number
          chargeback_flag?: boolean
          created_at?: string
          customer_cpf: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_status_override?: string | null
          gateway_charge_id?: string | null
          gateway_utilizado?: string | null
          id?: string
          invoice_url?: string | null
          notes?: string
          paid_at?: string | null
          payment_method: string
          payment_status?: string
          public_token?: string
          rastreio_atualizado_em?: string | null
          status_rastreio?: string
          tenant_id?: string | null
          total_cents: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          address_city?: string
          address_complement?: string
          address_district?: string
          address_number?: string
          address_state?: string
          address_street?: string
          address_zip?: string
          card_installments?: number
          chargeback_flag?: boolean
          created_at?: string
          customer_cpf?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivery_status_override?: string | null
          gateway_charge_id?: string | null
          gateway_utilizado?: string | null
          id?: string
          invoice_url?: string | null
          notes?: string
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          public_token?: string
          rastreio_atualizado_em?: string | null
          status_rastreio?: string
          tenant_id?: string | null
          total_cents?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_config: {
        Row: {
          data: Json
          id: string
          singleton: boolean
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          singleton?: boolean
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          singleton?: boolean
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          company_name: string
          contact_email: string
          contact_phone: string
          created_at: string
          expires_at: string | null
          id: string
          last_login_at: string | null
          order_limit: number
          plan: string
          product_limit: number
          responsible_name: string
          slug: string
          status: string
          updated_at: string
          user_limit: number
        }
        Insert: {
          company_name: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_login_at?: string | null
          order_limit?: number
          plan?: string
          product_limit?: number
          responsible_name?: string
          slug: string
          status?: string
          updated_at?: string
          user_limit?: number
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_login_at?: string | null
          order_limit?: number
          plan?: string
          product_limit?: number
          responsible_name?: string
          slug?: string
          status?: string
          updated_at?: string
          user_limit?: number
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
          role: Database["public"]["Enums"]["app_role"]
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
          assinatura_valida: boolean
          created_at: string
          erro: string | null
          gateway_tipo: string
          id: string
          payload: Json
          pedido_id: string | null
          sucesso: boolean
        }
        Insert: {
          assinatura_valida?: boolean
          created_at?: string
          erro?: string | null
          gateway_tipo: string
          id?: string
          payload?: Json
          pedido_id?: string | null
          sucesso?: boolean
        }
        Update: {
          assinatura_valida?: boolean
          created_at?: string
          erro?: string | null
          gateway_tipo?: string
          id?: string
          payload?: Json
          pedido_id?: string | null
          sucesso?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      save_site_config: { Args: { payload: Json; pwd: string }; Returns: Json }
      set_admin_password: {
        Args: { current_pwd: string; new_pwd: string }
        Returns: boolean
      }
      verify_admin_password: { Args: { pwd: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      gateway_tipo: "ironpay" | "pagarme" | "mercadopago" | "outro"
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
      gateway_tipo: ["ironpay", "pagarme", "mercadopago", "outro"],
    },
  },
} as const
