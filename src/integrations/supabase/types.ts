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
      admins: {
        Row: {
          created_at: string | null
          department: string | null
          designation: string | null
          email: string
          full_name: string
          id: string
          is_super_admin: boolean | null
          phone: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          designation?: string | null
          email: string
          full_name: string
          id?: string
          is_super_admin?: boolean | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          designation?: string | null
          email?: string
          full_name?: string
          id?: string
          is_super_admin?: boolean | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_partners: {
        Row: {
          aadhar_back_url: string | null
          aadhar_front_url: string | null
          aadhar_number: string | null
          address_line1: string | null
          address_line2: string | null
          alternate_phone: string | null
          city: string | null
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          date_of_birth: string | null
          document_verified_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          license_back_url: string | null
          license_front_url: string | null
          license_number: string | null
          pan_number: string | null
          phone: string | null
          pincode: string | null
          profile_image_url: string | null
          rating: number | null
          state: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          total_deliveries: number | null
          updated_at: string
          user_id: string | null
          vehicle_number: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          aadhar_back_url?: string | null
          aadhar_front_url?: string | null
          aadhar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          alternate_phone?: string | null
          city?: string | null
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          date_of_birth?: string | null
          document_verified_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          license_back_url?: string | null
          license_front_url?: string | null
          license_number?: string | null
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          profile_image_url?: string | null
          rating?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_number?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          aadhar_back_url?: string | null
          aadhar_front_url?: string | null
          aadhar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          alternate_phone?: string | null
          city?: string | null
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          date_of_birth?: string | null
          document_verified_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          license_back_url?: string | null
          license_front_url?: string | null
          license_number?: string | null
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          profile_image_url?: string | null
          rating?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_number?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
      discounts: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          max_uses_per_user: number | null
          max_uses_total: number | null
          min_order_amount: number | null
          name: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses_per_user?: number | null
          max_uses_total?: number | null
          min_order_amount?: number | null
          name: string
          updated_at?: string
          valid_from: string
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses_per_user?: number | null
          max_uses_total?: number | null
          min_order_amount?: number | null
          name?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          id: string
          mrp: number
          order_id: string
          product_id: string | null
          product_snapshot: Json
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          mrp: number
          order_id: string
          product_id?: string | null
          product_snapshot: Json
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          mrp?: number
          order_id?: string
          product_id?: string | null
          product_snapshot?: Json
          quantity?: number
          total_price?: number
          unit_price?: number
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
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_time: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          credit_used: number | null
          customer_id: string
          customer_notes: string | null
          delivered_at: string | null
          delivery_address: Json
          delivery_fee: number | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          delivery_otp: string | null
          delivery_partner_id: string | null
          discount_amount: number | null
          estimated_delivery_time: string | null
          id: string
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          picked_up_at: string | null
          placed_at: string
          platform_fee: number | null
          preparing_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount: number | null
          tip_amount: number | null
          total_amount: number
          transaction_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          actual_delivery_time?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          credit_used?: number | null
          customer_id: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivery_address: Json
          delivery_fee?: number | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_otp?: string | null
          delivery_partner_id?: string | null
          discount_amount?: number | null
          estimated_delivery_time?: string | null
          id?: string
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          picked_up_at?: string | null
          placed_at?: string
          platform_fee?: number | null
          preparing_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount?: number | null
          tip_amount?: number | null
          total_amount: number
          transaction_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          actual_delivery_time?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          credit_used?: number | null
          customer_id?: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivery_address?: Json
          delivery_fee?: number | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_otp?: string | null
          delivery_partner_id?: string | null
          discount_amount?: number | null
          estimated_delivery_time?: string | null
          id?: string
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          picked_up_at?: string | null
          placed_at?: string
          platform_fee?: number | null
          preparing_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number | null
          tip_amount?: number | null
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_partner_id_fkey"
            columns: ["delivery_partner_id"]
            isOneToOne: false
            referencedRelation: "delivery_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          image_urls: string[] | null
          is_featured: boolean | null
          is_trending: boolean | null
          max_order_quantity: number | null
          min_order_quantity: number | null
          mrp: number
          name: string
          primary_image_url: string | null
          rating: number | null
          search_tags: string[] | null
          selling_price: number
          sku: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number
          total_orders: number | null
          total_reviews: number | null
          unit_type: Database["public"]["Enums"]["unit_type"] | null
          unit_value: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_urls?: string[] | null
          is_featured?: boolean | null
          is_trending?: boolean | null
          max_order_quantity?: number | null
          min_order_quantity?: number | null
          mrp: number
          name: string
          primary_image_url?: string | null
          rating?: number | null
          search_tags?: string[] | null
          selling_price: number
          sku: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          total_orders?: number | null
          total_reviews?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"] | null
          unit_value?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_urls?: string[] | null
          is_featured?: boolean | null
          is_trending?: boolean | null
          max_order_quantity?: number | null
          min_order_quantity?: number | null
          mrp?: number
          name?: string
          primary_image_url?: string | null
          rating?: number | null
          search_tags?: string[] | null
          selling_price?: number
          sku?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          total_orders?: number | null
          total_reviews?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"] | null
          unit_value?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          fcm_token: string | null
          full_name: string
          id: string
          last_login_at: string | null
          metadata: Json | null
          phone: string | null
          profile_image_url: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fcm_token?: string | null
          full_name: string
          id?: string
          last_login_at?: string | null
          metadata?: Json | null
          phone?: string | null
          profile_image_url?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fcm_token?: string | null
          full_name?: string
          id?: string
          last_login_at?: string | null
          metadata?: Json | null
          phone?: string | null
          profile_image_url?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_areas: {
        Row: {
          center_latitude: number
          center_longitude: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          radius_km: number
          updated_at: string
        }
        Insert: {
          center_latitude: number
          center_longitude: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          radius_km?: number
          updated_at?: string
        }
        Update: {
          center_latitude?: number
          center_longitude?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          radius_km?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          address_type: string
          city: string
          created_at: string
          id: string
          is_default: boolean | null
          landmark: string | null
          latitude: number | null
          longitude: number | null
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          address_type?: string
          city: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          address_type?: string
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          pincode?: string
          state?: string
          updated_at?: string
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
      vendors: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          alternate_phone: string | null
          bank_account_number: string | null
          business_license: string | null
          business_name: string
          city: string | null
          commission_rate: number | null
          created_at: string
          email: string | null
          fssai_certificate_url: string | null
          fssai_number: string | null
          gst_number: string | null
          id: string
          ifsc_code: string | null
          is_accepting_orders: boolean | null
          operating_hours: Json | null
          owner_aadhar_number: string | null
          owner_name: string | null
          owner_photo_url: string | null
          pan_number: string | null
          phone: string | null
          pincode: string | null
          rating: number | null
          state: string | null
          status: Database["public"]["Enums"]["vendor_status"]
          store_address: string | null
          store_latitude: number | null
          store_longitude: number | null
          store_photo_url: string | null
          total_orders: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          alternate_phone?: string | null
          bank_account_number?: string | null
          business_license?: string | null
          business_name: string
          city?: string | null
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          fssai_certificate_url?: string | null
          fssai_number?: string | null
          gst_number?: string | null
          id?: string
          ifsc_code?: string | null
          is_accepting_orders?: boolean | null
          operating_hours?: Json | null
          owner_aadhar_number?: string | null
          owner_name?: string | null
          owner_photo_url?: string | null
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          rating?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          store_address?: string | null
          store_latitude?: number | null
          store_longitude?: number | null
          store_photo_url?: string | null
          total_orders?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          alternate_phone?: string | null
          bank_account_number?: string | null
          business_license?: string | null
          business_name?: string
          city?: string | null
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          fssai_certificate_url?: string | null
          fssai_number?: string | null
          gst_number?: string | null
          id?: string
          ifsc_code?: string | null
          is_accepting_orders?: boolean | null
          operating_hours?: Json | null
          owner_aadhar_number?: string | null
          owner_name?: string | null
          owner_photo_url?: string | null
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          rating?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          store_address?: string | null
          store_latitude?: number | null
          store_longitude?: number | null
          store_photo_url?: string | null
          total_orders?: number | null
          updated_at?: string
          user_id?: string | null
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_delivery_partner: { Args: { _user_id: string }; Returns: boolean }
      is_vendor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "customer" | "vendor" | "delivery_partner" | "admin"
      delivery_status: "offline" | "available" | "busy" | "on_break"
      discount_type: "percentage" | "fixed" | "bogo" | "free_delivery"
      notification_type:
        | "order_placed"
        | "order_confirmed"
        | "order_preparing"
        | "order_dispatched"
        | "order_delivered"
        | "order_cancelled"
        | "payment_success"
        | "payment_failed"
        | "credit_low"
        | "promotion"
        | "general"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready_for_pickup"
        | "assigned_to_delivery"
        | "picked_up"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_method: "cash" | "upi" | "card" | "wallet" | "credit"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      product_status: "active" | "inactive" | "out_of_stock" | "discontinued"
      transaction_type: "credit" | "debit" | "refund" | "penalty"
      unit_type: "kg" | "g" | "l" | "ml" | "piece" | "pack" | "dozen"
      user_status: "active" | "inactive" | "suspended" | "blocked"
      vehicle_type: "bicycle" | "bike" | "scooter" | "car"
      vendor_status: "pending" | "active" | "inactive" | "suspended"
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
      app_role: ["customer", "vendor", "delivery_partner", "admin"],
      delivery_status: ["offline", "available", "busy", "on_break"],
      discount_type: ["percentage", "fixed", "bogo", "free_delivery"],
      notification_type: [
        "order_placed",
        "order_confirmed",
        "order_preparing",
        "order_dispatched",
        "order_delivered",
        "order_cancelled",
        "payment_success",
        "payment_failed",
        "credit_low",
        "promotion",
        "general",
      ],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "assigned_to_delivery",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_method: ["cash", "upi", "card", "wallet", "credit"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      product_status: ["active", "inactive", "out_of_stock", "discontinued"],
      transaction_type: ["credit", "debit", "refund", "penalty"],
      unit_type: ["kg", "g", "l", "ml", "piece", "pack", "dozen"],
      user_status: ["active", "inactive", "suspended", "blocked"],
      vehicle_type: ["bicycle", "bike", "scooter", "car"],
      vendor_status: ["pending", "active", "inactive", "suspended"],
    },
  },
} as const
