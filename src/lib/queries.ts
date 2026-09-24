import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Disciplina = {
  id: string;
  concurso_id: string;
  nome: string;
  peso: number;
  ativa: boolean;
  cor: string | null;
  ordem: number;
};

export type Assunto = {
  id: string;
  disciplina_id: string;
  parent_id: string | null;
  nome: string;
  status: string;
  incidencia: number;
  confianca: number;
  ordem: number;
};

export type Sessao = {
  id: string;
  disciplina_id: string | null;
  assunto_id: string | null;
  ciclo_item_id: string | null;
  inicio: string;
  fim: string | null;
  duracao_seg: number;
  tipo: string;
  pomodoros: number;
  anotacoes: string | null;
};

export type QuestaoLog = {
  id: string;
  sessao_id: string | null;
  assunto_id: string | null;
  total: number;
  acertos: number;
  erros: number;
  em_branco: number;
  criado_em: string;
};

export type Revisao = {
  id: string;
  assunto_id: string;
  data_prevista: string;
  data_concluida: string | null;
  indice_intervalo: number;
  status: string;
};

export function useDisciplinas(concursoId: string | null) {
  return useQuery({
    queryKey: ["disciplinas", concursoId],
    enabled: !!concursoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disciplinas")
        .select("*")
        .eq("concurso_id", concursoId!)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Disciplina[];
    },
  });
}

export function useAssuntos(concursoId: string | null) {
  const { data: disciplinas } = useDisciplinas(concursoId);
  const ids = (disciplinas ?? []).map((d) => d.id);
  return useQuery({
    queryKey: ["assuntos", concursoId, ids.length],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assuntos")
        .select("*")
        .in("disciplina_id", ids)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Assunto[];
    },
  });
}

export function useSessoes() {
  return useQuery({
    queryKey: ["sessoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessoes")
        .select("*")
        .not("fim", "is", null)
        .order("inicio", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Sessao[];
    },
  });
}

export function useQuestoes() {
  return useQuery({
    queryKey: ["questoes_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questoes_log")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as QuestaoLog[];
    },
  });
}

export function useRevisoes() {
  return useQuery({
    queryKey: ["revisoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revisoes")
        .select("*")
        .order("data_prevista");
      if (error) throw error;
      return (data ?? []) as Revisao[];
    },
  });
}

export function usePerfil() {
  return useQuery({
    queryKey: ["perfil"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useInvalidarTudo() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries();
  };
}

export function useAtualizarAssunto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Assunto> }) => {
      const { error } = await supabase.from("assuntos").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assuntos"] }),
  });
}

export function useAtualizarDisciplina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Disciplina> }) => {
      const { error } = await supabase.from("disciplinas").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas"] }),
  });
}

/** Estatísticas por assunto: horas, questões, acerto, último estudo. */
export type EstatAssunto = {
  assuntoId: string;
  segundos: number;
  total: number;
  acertos: number;
  percentual: number | null;
  ultimoEstudo: string | null;
};

export function calcularEstatisticas(
  assuntos: Assunto[],
  sessoes: Sessao[],
  questoes: QuestaoLog[],
): Map<string, EstatAssunto> {
  const mapa = new Map<string, EstatAssunto>();
  for (const a of assuntos) {
    mapa.set(a.id, {
      assuntoId: a.id,
      segundos: 0,
      total: 0,
      acertos: 0,
      percentual: null,
      ultimoEstudo: null,
    });
  }
  for (const s of sessoes) {
    if (!s.assunto_id) continue;
    const e = mapa.get(s.assunto_id);
    if (!e) continue;
    e.segundos += s.duracao_seg;
    if (!e.ultimoEstudo || s.inicio > e.ultimoEstudo) e.ultimoEstudo = s.inicio;
  }
  for (const q of questoes) {
    if (!q.assunto_id) continue;
    const e = mapa.get(q.assunto_id);
    if (!e) continue;
    e.total += q.total;
    e.acertos += q.acertos;
  }
  for (const e of mapa.values()) {
    e.percentual = e.total > 0 ? Math.round((e.acertos / e.total) * 100) : null;
  }
  return mapa;
}
