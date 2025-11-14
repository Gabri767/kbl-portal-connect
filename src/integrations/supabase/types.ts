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
      auditoria: {
        Row: {
          acao: string
          criado_em: string | null
          detalhe: Json | null
          id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          criado_em?: string | null
          detalhe?: Json | null
          id?: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          criado_em?: string | null
          detalhe?: Json | null
          id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      contas: {
        Row: {
          codigo: string | null
          criado_em: string | null
          departamento: string
          empresa_id: string
          id: string
          nome: string
          saldo: number | null
          tipo: string | null
        }
        Insert: {
          codigo?: string | null
          criado_em?: string | null
          departamento?: string
          empresa_id: string
          id?: string
          nome: string
          saldo?: number | null
          tipo?: string | null
        }
        Update: {
          codigo?: string | null
          criado_em?: string | null
          departamento?: string
          empresa_id?: string
          id?: string
          nome?: string
          saldo?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      grupo_de_empresas: {
        Row: {
          criado_em: string | null
          id: number
          nome: string
        }
        Insert: {
          criado_em?: string | null
          id?: number
          nome: string
        }
        Update: {
          criado_em?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          conta_id: string | null
          criado_em: string | null
          criado_por: string | null
          data: string
          departamento: string
          descricao: string | null
          empresa_id: string
          id: string
          tipo: string
          valor: number
        }
        Insert: {
          conta_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data: string
          departamento?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          tipo: string
          valor: number
        }
        Update: {
          conta_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data?: string
          departamento?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      regimes: {
        Row: {
          criado_em: string | null
          id: number
          nome: string
        }
        Insert: {
          criado_em?: string | null
          id?: number
          nome: string
        }
        Update: {
          criado_em?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          criado_em: string | null
          id: number
          nome: string
        }
        Insert: {
          criado_em?: string | null
          id?: number
          nome: string
        }
        Update: {
          criado_em?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          bloqueado_until: string | null
          comercial: boolean | null
          compliance_fiscal: boolean | null
          compliance_tributario: boolean | null
          conciliacao_contabil: boolean | null
          contabil: boolean | null
          controladoria: boolean | null
          convite_expires_at: string | null
          convite_token: string | null
          criado_em: string | null
          departamentos: string[] | null
          email: string
          empresa_id: string | null
          financeiro: boolean | null
          fiscal: boolean | null
          folha_de_pagamento_kit_mensal: boolean | null
          gente_e_gestao: boolean | null
          id: string
          mfa_enabled: boolean | null
          mfa_secret: string | null
          nome: string
          pessoal: boolean | null
          senha_hash: string
          societario: boolean | null
          status: string | null
          sucesso_do_cliente: boolean | null
          tentativas_login: number | null
        }
        Insert: {
          bloqueado_until?: string | null
          comercial?: boolean | null
          compliance_fiscal?: boolean | null
          compliance_tributario?: boolean | null
          conciliacao_contabil?: boolean | null
          contabil?: boolean | null
          controladoria?: boolean | null
          convite_expires_at?: string | null
          convite_token?: string | null
          criado_em?: string | null
          departamentos?: string[] | null
          email: string
          empresa_id?: string | null
          financeiro?: boolean | null
          fiscal?: boolean | null
          folha_de_pagamento_kit_mensal?: boolean | null
          gente_e_gestao?: boolean | null
          id?: string
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          nome: string
          pessoal?: boolean | null
          senha_hash: string
          societario?: boolean | null
          status?: string | null
          sucesso_do_cliente?: boolean | null
          tentativas_login?: number | null
        }
        Update: {
          bloqueado_until?: string | null
          comercial?: boolean | null
          compliance_fiscal?: boolean | null
          compliance_tributario?: boolean | null
          conciliacao_contabil?: boolean | null
          contabil?: boolean | null
          controladoria?: boolean | null
          convite_expires_at?: string | null
          convite_token?: string | null
          criado_em?: string | null
          departamentos?: string[] | null
          email?: string
          empresa_id?: string | null
          financeiro?: boolean | null
          fiscal?: boolean | null
          folha_de_pagamento_kit_mensal?: boolean | null
          gente_e_gestao?: boolean | null
          id?: string
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          nome?: string
          pessoal?: boolean | null
          senha_hash?: string
          societario?: boolean | null
          status?: string | null
          sucesso_do_cliente?: boolean | null
          tentativas_login?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_to_uuid: { Args: { input_text: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "colaborador" | "cliente"
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
      app_role: ["admin", "gestor", "colaborador", "cliente"],
    },
  },
} as const
