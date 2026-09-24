/** Lógica pura do gerador de ciclo de estudos. */

export type DisciplinaParaCiclo = {
  id: string;
  nome: string;
  peso: number;
  incidenciaMedia: number; // 0-5
  desempenho: number | null; // 0-1 (% de acerto), null quando sem questões
};

export type BlocoCiclo = {
  disciplinaId: string;
  nome: string;
  blocos: number;
};

export function pontuacaoDisciplina(d: DisciplinaParaCiclo) {
  const incidencia = Math.max(0.5, d.incidenciaMedia || 3);
  const desempenho = d.desempenho ?? 0.5;
  return d.peso * incidencia * (1 - desempenho * 0.8);
}

/**
 * Distribui blocos proporcionalmente a peso x incidência x (1 - desempenho).
 */
export function distribuirBlocos(
  disciplinas: DisciplinaParaCiclo[],
  cargaSemanalHoras: number,
  duracaoBlocoMin: number,
): BlocoCiclo[] {
  if (disciplinas.length === 0) return [];
  const totalBlocos = Math.max(
    disciplinas.length,
    Math.round((cargaSemanalHoras * 60) / duracaoBlocoMin),
  );
  const pesos = disciplinas.map(pontuacaoDisciplina);
  const somaPesos = pesos.reduce((a, b) => a + b, 0) || 1;

  const brutos = disciplinas.map((d, i) => ({
    disciplinaId: d.id,
    nome: d.nome,
    exato: (pesos[i] / somaPesos) * totalBlocos,
  }));

  const resultado = brutos.map((b) => ({
    disciplinaId: b.disciplinaId,
    nome: b.nome,
    blocos: Math.max(1, Math.floor(b.exato)),
  }));

  let restante = totalBlocos - resultado.reduce((a, b) => a + b.blocos, 0);
  const ordemResto = brutos
    .map((b, i) => ({ i, resto: b.exato - Math.floor(b.exato) }))
    .sort((a, b) => b.resto - a.resto);
  let k = 0;
  while (restante > 0 && ordemResto.length > 0) {
    resultado[ordemResto[k % ordemResto.length].i].blocos += 1;
    restante -= 1;
    k += 1;
  }

  return resultado;
}

/**
 * Sequência de blocos evitando duas disciplinas iguais em sequência.
 */
export function sequenciarBlocos(itens: BlocoCiclo[]): BlocoCiclo[] {
  const fila = itens
    .map((i) => ({ ...i, restantes: i.blocos }))
    .sort((a, b) => b.restantes - a.restantes);
  const saida: BlocoCiclo[] = [];
  let anterior: string | null = null;

  while (fila.some((f) => f.restantes > 0)) {
    const candidatos = fila
      .filter((f) => f.restantes > 0)
      .sort((a, b) => b.restantes - a.restantes);
    const escolhido =
      candidatos.find((c) => c.disciplinaId !== anterior) ?? candidatos[0];
    escolhido.restantes -= 1;
    anterior = escolhido.disciplinaId;
    saida.push({
      disciplinaId: escolhido.disciplinaId,
      nome: escolhido.nome,
      blocos: 1,
    });
  }
  return saida;
}
