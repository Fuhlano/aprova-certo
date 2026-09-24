import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatarData(valor: string | Date | null | undefined) {
  if (!valor) return "—";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function formatarDataHora(valor: string | Date) {
  const d = typeof valor === "string" ? new Date(valor) : valor;
  return format(d, "dd/MM/yyyy 'às' HH'h'mm", { locale: ptBR });
}

/** Segundos -> "12h30" ou "45min" */
export function formatarDuracao(segundos: number) {
  const totalMin = Math.floor(segundos / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

/** Segundos -> "01:25:04" (cronômetro) */
export function formatarCronometro(segundos: number) {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(seg).padStart(2, "0");
  return h > 0 ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatarNumero(valor: number, decimais = 1) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

export function formatarPorcentagem(valor: number | null) {
  if (valor === null || Number.isNaN(valor)) return "—";
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
}

export function diasAte(data: string | null | undefined) {
  if (!data) return null;
  return differenceInCalendarDays(new Date(`${data}T12:00:00`), new Date());
}

export const TIPOS_ESTUDO = [
  { value: "teoria", label: "Teoria" },
  { value: "questoes", label: "Questões" },
  { value: "revisao", label: "Revisão" },
  { value: "lei_seca", label: "Lei seca" },
  { value: "videoaula", label: "Videoaula" },
  { value: "simulado", label: "Simulado" },
] as const;

export const STATUS_ASSUNTO = [
  { value: "nao_iniciado", label: "Não iniciado" },
  { value: "estudando", label: "Estudando" },
  { value: "revisar", label: "Revisar" },
  { value: "dominado", label: "Dominado" },
] as const;
