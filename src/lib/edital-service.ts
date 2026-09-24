import { supabase } from "@/integrations/supabase/client";
import type { DisciplinaParseada } from "@/lib/edital-parser";

/** Salva a árvore revisada (somente itens marcados) no banco. */
export async function salvarEstruturaEdital(
  concursoId: string,
  disciplinas: DisciplinaParseada[],
) {
  for (const [indice, disciplina] of disciplinas.entries()) {
    const { data: disc, error } = await supabase
      .from("disciplinas")
      .insert({
        concurso_id: concursoId,
        nome: disciplina.nome,
        peso: disciplina.peso,
        ativa: disciplina.ativa,
        ordem: indice,
      })
      .select("id")
      .single();
    if (error) throw error;

    const incluidos = disciplina.assuntos.filter((a) => a.incluir);
    for (const [i, assunto] of incluidos.entries()) {
      const { data: pai, error: erroPai } = await supabase
        .from("assuntos")
        .insert({ disciplina_id: disc.id, nome: assunto.nome, ordem: i })
        .select("id")
        .single();
      if (erroPai) throw erroPai;

      const filhos = assunto.filhos.filter((f) => f.incluir);
      if (filhos.length > 0) {
        const { error: erroFilhos } = await supabase.from("assuntos").insert(
          filhos.map((f, j) => ({
            disciplina_id: disc.id,
            parent_id: pai.id,
            nome: f.nome,
            ordem: j,
          })),
        );
        if (erroFilhos) throw erroFilhos;
      }
    }
  }
}
