import { supabase } from "@/integrations/supabase/client";
import { gerarAgendaRevisoes, INTERVALOS_PADRAO, ajustarIntervalo } from "@/lib/revisoes";

export type RegistroSessao = {
  concursoId: string | null;
  disciplinaId: string | null;
  assuntoId: string | null;
  cicloItemId: string | null;
  tipo: string;
  inicio: string;
  duracaoSeg: number;
  pomodoros: number;
  anotacoes: string | null;
  questoes: { total: number; acertos: number; erros: number; emBranco: number } | null;
  novoStatusAssunto: string | null;
  agendarRevisao: boolean;
  intervalos?: number[];
};

export async function registrarSessao(registro: RegistroSessao) {
  const { data: sessao, error } = await supabase
    .from("sessoes")
    .insert({
      concurso_id: registro.concursoId,
      disciplina_id: registro.disciplinaId,
      assunto_id: registro.assuntoId,
      ciclo_item_id: registro.cicloItemId,
      inicio: registro.inicio,
      fim: new Date().toISOString(),
      duracao_seg: registro.duracaoSeg,
      tipo: registro.tipo,
      pomodoros: registro.pomodoros,
      anotacoes: registro.anotacoes,
    })
    .select("id")
    .single();
  if (error) throw error;

  let percentual: number | null = null;
  if (registro.questoes && registro.questoes.total > 0) {
    const q = registro.questoes;
    percentual = Math.round((q.acertos / q.total) * 100);
    const { error: erroQ } = await supabase.from("questoes_log").insert({
      sessao_id: sessao.id,
      assunto_id: registro.assuntoId,
      total: q.total,
      acertos: q.acertos,
      erros: q.erros,
      em_branco: q.emBranco,
    });
    if (erroQ) throw erroQ;
  }

  if (registro.assuntoId && registro.novoStatusAssunto) {
    await supabase
      .from("assuntos")
      .update({ status: registro.novoStatusAssunto })
      .eq("id", registro.assuntoId);
  }

  if (registro.cicloItemId) {
    const { data: item } = await supabase
      .from("ciclo_itens")
      .select("blocos_concluidos")
      .eq("id", registro.cicloItemId)
      .maybeSingle();
    if (item) {
      await supabase
        .from("ciclo_itens")
        .update({ blocos_concluidos: item.blocos_concluidos + 1 })
        .eq("id", registro.cicloItemId);
    }
  }

  if (registro.agendarRevisao && registro.assuntoId) {
    const intervalos = (registro.intervalos ?? INTERVALOS_PADRAO).map((dias) =>
      ajustarIntervalo(dias, percentual),
    );
    const agenda = gerarAgendaRevisoes(new Date(), intervalos);
    await supabase.from("revisoes").insert(
      agenda.map((r) => ({
        assunto_id: registro.assuntoId as string,
        origem_sessao_id: sessao.id,
        data_prevista: r.data,
        indice_intervalo: r.indice,
      })),
    );
  }

  return sessao.id as string;
}
