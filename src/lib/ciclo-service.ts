import { supabase } from "@/integrations/supabase/client";
import { distribuirBlocos, sequenciarBlocos, type DisciplinaParaCiclo } from "@/lib/ciclo";

export type CicloItem = {
  id: string;
  ciclo_id: string;
  disciplina_id: string;
  blocos_previstos: number;
  blocos_concluidos: number;
  ordem: number;
};

export type Ciclo = {
  id: string;
  concurso_id: string;
  nome: string;
  carga_semanal_horas: number;
  duracao_bloco_min: number;
  voltas: number;
  ativo: boolean;
};

export async function gerarCiclo(opcoes: {
  concursoId: string;
  cargaSemanalHoras: number;
  duracaoBlocoMin: number;
  nome?: string;
  priorizarFracos?: boolean;
}) {
  const { concursoId, cargaSemanalHoras, duracaoBlocoMin } = opcoes;

  const { data: disciplinas, error: erroDisc } = await supabase
    .from("disciplinas")
    .select("id, nome, peso, ativa")
    .eq("concurso_id", concursoId)
    .eq("ativa", true);
  if (erroDisc) throw erroDisc;
  if (!disciplinas || disciplinas.length === 0) {
    throw new Error("Ative pelo menos uma disciplina para gerar o ciclo.");
  }

  const ids = disciplinas.map((d) => d.id);
  const { data: assuntos } = await supabase
    .from("assuntos")
    .select("id, disciplina_id, incidencia")
    .in("disciplina_id", ids);
  const { data: questoes } = await supabase
    .from("questoes_log")
    .select("total, acertos, assunto_id");

  const incidenciaPorDisciplina = new Map<string, number[]>();
  const assuntoParaDisciplina = new Map<string, string>();
  for (const a of assuntos ?? []) {
    assuntoParaDisciplina.set(a.id, a.disciplina_id);
    const lista = incidenciaPorDisciplina.get(a.disciplina_id) ?? [];
    lista.push(a.incidencia);
    incidenciaPorDisciplina.set(a.disciplina_id, lista);
  }

  const acertosPorDisciplina = new Map<string, { total: number; acertos: number }>();
  for (const q of questoes ?? []) {
    const dId = q.assunto_id ? assuntoParaDisciplina.get(q.assunto_id) : null;
    if (!dId) continue;
    const atual = acertosPorDisciplina.get(dId) ?? { total: 0, acertos: 0 };
    atual.total += q.total;
    atual.acertos += q.acertos;
    acertosPorDisciplina.set(dId, atual);
  }

  const entrada: DisciplinaParaCiclo[] = disciplinas.map((d) => {
    const incidencias = incidenciaPorDisciplina.get(d.id) ?? [];
    const media = incidencias.length
      ? incidencias.reduce((a, b) => a + b, 0) / incidencias.length
      : 3;
    const desempenho = acertosPorDisciplina.get(d.id);
    return {
      id: d.id,
      nome: d.nome,
      peso: d.peso,
      incidenciaMedia: media,
      desempenho:
        desempenho && desempenho.total > 0 ? desempenho.acertos / desempenho.total : null,
    };
  });

  const distribuicao = distribuirBlocos(entrada, cargaSemanalHoras, duracaoBlocoMin);
  const sequencia = sequenciarBlocos(distribuicao);

  // desativa ciclos anteriores
  await supabase.from("ciclos").update({ ativo: false }).eq("concurso_id", concursoId);

  const { data: ciclo, error: erroCiclo } = await supabase
    .from("ciclos")
    .insert({
      concurso_id: concursoId,
      nome: opcoes.nome ?? `Ciclo de ${cargaSemanalHoras}h`,
      carga_semanal_horas: cargaSemanalHoras,
      duracao_bloco_min: duracaoBlocoMin,
      ativo: true,
    })
    .select()
    .single();
  if (erroCiclo) throw erroCiclo;

  const itens = sequencia.map((bloco, i) => ({
    ciclo_id: ciclo.id,
    disciplina_id: bloco.disciplinaId,
    blocos_previstos: 1,
    ordem: i,
  }));
  const { error: erroItens } = await supabase.from("ciclo_itens").insert(itens);
  if (erroItens) throw erroItens;

  return ciclo as Ciclo;
}

export async function buscarCicloAtivo(concursoId: string) {
  const { data, error } = await supabase
    .from("ciclos")
    .select("*")
    .eq("concurso_id", concursoId)
    .eq("ativo", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Ciclo | null;
}

export async function buscarItensCiclo(cicloId: string) {
  const { data, error } = await supabase
    .from("ciclo_itens")
    .select("*")
    .eq("ciclo_id", cicloId)
    .order("ordem");
  if (error) throw error;
  return (data ?? []) as CicloItem[];
}
