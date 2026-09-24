/** Repetição espaçada — lógica pura. */

export const INTERVALOS_PADRAO = [1, 7, 15, 30, 60];

export function ajustarIntervalo(
  intervaloDias: number,
  percentualAcerto: number | null,
) {
  if (percentualAcerto === null) return intervaloDias;
  if (percentualAcerto < 60) return Math.max(1, Math.round(intervaloDias * 0.6));
  if (percentualAcerto > 85) return Math.round(intervaloDias * 1.4);
  return intervaloDias;
}

export function proximaData(
  base: Date,
  intervalos: number[],
  indice: number,
  percentualAcerto: number | null,
): { data: string; indice: number } | null {
  if (indice >= intervalos.length) return null;
  const dias = ajustarIntervalo(intervalos[indice], percentualAcerto);
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return { data: d.toISOString().slice(0, 10), indice };
}

export function gerarAgendaRevisoes(
  base: Date,
  intervalos: number[] = INTERVALOS_PADRAO,
): Array<{ data: string; indice: number }> {
  return intervalos.map((dias, indice) => {
    const d = new Date(base);
    d.setDate(d.getDate() + dias);
    return { data: d.toISOString().slice(0, 10), indice };
  });
}

export function estaAtrasada(dataPrevista: string) {
  const hoje = new Date().toISOString().slice(0, 10);
  return dataPrevista < hoje;
}

export function ehHoje(dataPrevista: string) {
  return dataPrevista === new Date().toISOString().slice(0, 10);
}
