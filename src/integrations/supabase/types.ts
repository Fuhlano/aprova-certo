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
      assuntos: {
        Row: {
          confianca: number
          disciplina_id: string
          id: string
          incidencia: number
          nome: string
          ordem: number
          parent_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          confianca?: number
          disciplina_id: string
          id?: string
          incidencia?: number
          nome: string
          ordem?: number
          parent_id?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          confianca?: number
          disciplina_id?: string
          id?: string
          incidencia?: number
          nome?: string
          ordem?: number
          parent_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assuntos_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assuntos_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclo_itens: {
        Row: {
          blocos_concluidos: number
          blocos_previstos: number
          ciclo_id: string
          disciplina_id: string
          id: string
          ordem: number
          user_id: string
        }
        Insert: {
          blocos_concluidos?: number
          blocos_previstos?: number
          ciclo_id: string
          disciplina_id: string
          id?: string
          ordem?: number
          user_id?: string
        }
        Update: {
          blocos_concluidos?: number
          blocos_previstos?: number
          ciclo_id?: string
          disciplina_id?: string
          id?: string
          ordem?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ciclo_itens_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ciclo_itens_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclos: {
        Row: {
          ativo: boolean
          carga_semanal_horas: number
          concurso_id: string
          criado_em: string
          duracao_bloco_min: number
          id: string
          nome: string
          user_id: string
          voltas: number
        }
        Insert: {
          ativo?: boolean
          carga_semanal_horas?: number
          concurso_id: string
          criado_em?: string
          duracao_bloco_min?: number
          id?: string
          nome?: string
          user_id?: string
          voltas?: number
        }
        Update: {
          ativo?: boolean
          carga_semanal_horas?: number
          concurso_id?: string
          criado_em?: string
          duracao_bloco_min?: number
          id?: string
          nome?: string
          user_id?: string
          voltas?: number
        }
        Relationships: [
          {
            foreignKeyName: "ciclos_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      concursos: {
        Row: {
          banca: string | null
          cargo: string | null
          criado_em: string
          data_prova: string | null
          edital_arquivo_url: string | null
          edital_texto: string | null
          id: string
          nome: string
          orgao: string | null
          status: string
          user_id: string
        }
        Insert: {
          banca?: string | null
          cargo?: string | null
          criado_em?: string
          data_prova?: string | null
          edital_arquivo_url?: string | null
          edital_texto?: string | null
          id?: string
          nome: string
          orgao?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          banca?: string | null
          cargo?: string | null
          criado_em?: string
          data_prova?: string | null
          edital_arquivo_url?: string | null
          edital_texto?: string | null
          id?: string
          nome?: string
          orgao?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      disciplinas: {
        Row: {
          ativa: boolean
          concurso_id: string
          cor: string | null
          id: string
          nome: string
          ordem: number
          peso: number
          user_id: string
        }
        Insert: {
          ativa?: boolean
          concurso_id: string
          cor?: string | null
          id?: string
          nome: string
          ordem?: number
          peso?: number
          user_id?: string
        }
        Update: {
          ativa?: boolean
          concurso_id?: string
          cor?: string | null
          id?: string
          nome?: string
          ordem?: number
          peso?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinas_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          id: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          id?: string
          tipo: string
          user_id?: string
          valor?: number
        }
        Update: {
          id?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      notas: {
        Row: {
          assunto_id: string
          atualizado_em: string
          conteudo: string
          id: string
          user_id: string
        }
        Insert: {
          assunto_id: string
          atualizado_em?: string
          conteudo?: string
          id?: string
          user_id?: string
        }
        Update: {
          assunto_id?: string
          atualizado_em?: string
          conteudo?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          criado_em: string
          id: string
          intervalos_revisao: number[]
          meta_horas_semanais: number
          nome: string | null
          timezone: string
        }
        Insert: {
          avatar_url?: string | null
          criado_em?: string
          id: string
          intervalos_revisao?: number[]
          meta_horas_semanais?: number
          nome?: string | null
          timezone?: string
        }
        Update: {
          avatar_url?: string | null
          criado_em?: string
          id?: string
          intervalos_revisao?: number[]
          meta_horas_semanais?: number
          nome?: string | null
          timezone?: string
        }
        Relationships: []
      }
      questoes_log: {
        Row: {
          acertos: number
          assunto_id: string | null
          criado_em: string
          em_branco: number
          erros: number
          id: string
          sessao_id: string | null
          total: number
          user_id: string
        }
        Insert: {
          acertos?: number
          assunto_id?: string | null
          criado_em?: string
          em_branco?: number
          erros?: number
          id?: string
          sessao_id?: string | null
          total?: number
          user_id?: string
        }
        Update: {
          acertos?: number
          assunto_id?: string | null
          criado_em?: string
          em_branco?: number
          erros?: number
          id?: string
          sessao_id?: string | null
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_log_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questoes_log_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
        ]
      }
      revisoes: {
        Row: {
          assunto_id: string
          data_concluida: string | null
          data_prevista: string
          id: string
          indice_intervalo: number
          origem_sessao_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          assunto_id: string
          data_concluida?: string | null
          data_prevista: string
          id?: string
          indice_intervalo?: number
          origem_sessao_id?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          assunto_id?: string
          data_concluida?: string | null
          data_prevista?: string
          id?: string
          indice_intervalo?: number
          origem_sessao_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisoes_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisoes_origem_sessao_id_fkey"
            columns: ["origem_sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes: {
        Row: {
          anotacoes: string | null
          assunto_id: string | null
          ciclo_item_id: string | null
          concurso_id: string | null
          disciplina_id: string | null
          duracao_seg: number
          fim: string | null
          id: string
          inicio: string
          pomodoros: number
          tipo: string
          user_id: string
        }
        Insert: {
          anotacoes?: string | null
          assunto_id?: string | null
          ciclo_item_id?: string | null
          concurso_id?: string | null
          disciplina_id?: string | null
          duracao_seg?: number
          fim?: string | null
          id?: string
          inicio?: string
          pomodoros?: number
          tipo?: string
          user_id?: string
        }
        Update: {
          anotacoes?: string | null
          assunto_id?: string | null
          ciclo_item_id?: string | null
          concurso_id?: string | null
          disciplina_id?: string | null
          duracao_seg?: number
          fim?: string | null
          id?: string
          inicio?: string
          pomodoros?: number
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_ciclo_item_id_fkey"
            columns: ["ciclo_item_id"]
            isOneToOne: false
            referencedRelation: "ciclo_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      simulados: {
        Row: {
          acertos: number
          concurso_id: string | null
          data: string
          id: string
          nome: string
          observacoes: string | null
          tempo_min: number
          total: number
          user_id: string
        }
        Insert: {
          acertos?: number
          concurso_id?: string | null
          data?: string
          id?: string
          nome: string
          observacoes?: string | null
          tempo_min?: number
          total?: number
          user_id?: string
        }
        Update: {
          acertos?: number
          concurso_id?: string | null
          data?: string
          id?: string
          nome?: string
          observacoes?: string | null
          tempo_min?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulados_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
