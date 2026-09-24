import { useCallback, useEffect, useRef, useState } from "react";

const CHAVE = "aprova:timer";

export type ModoTimer = "livre" | "pomodoro";
export type FasePomodoro = "foco" | "pausa_curta" | "pausa_longa";

export type ConfigPomodoro = {
  foco: number; // minutos
  pausaCurta: number;
  pausaLonga: number;
  ciclos: number;
};

export const CONFIG_POMODORO_PADRAO: ConfigPomodoro = {
  foco: 25,
  pausaCurta: 5,
  pausaLonga: 15,
  ciclos: 4,
};

export type EstadoTimer = {
  modo: ModoTimer;
  fase: FasePomodoro;
  rodando: boolean;
  /** timestamp (ms) do início do trecho atual */
  iniciadoEm: number | null;
  /** segundos acumulados antes do trecho atual */
  acumulado: number;
  /** total de segundos de foco na sessão (não conta pausas) */
  focoTotal: number;
  pomodorosConcluidos: number;
  config: ConfigPomodoro;
  contexto: {
    disciplinaId: string | null;
    assuntoId: string | null;
    tipo: string;
    cicloItemId: string | null;
  };
};

const ESTADO_INICIAL: EstadoTimer = {
  modo: "livre",
  fase: "foco",
  rodando: false,
  iniciadoEm: null,
  acumulado: 0,
  focoTotal: 0,
  pomodorosConcluidos: 0,
  config: CONFIG_POMODORO_PADRAO,
  contexto: { disciplinaId: null, assuntoId: null, tipo: "teoria", cicloItemId: null },
};

function ler(): EstadoTimer {
  if (typeof window === "undefined") return ESTADO_INICIAL;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return ESTADO_INICIAL;
    return { ...ESTADO_INICIAL, ...(JSON.parse(bruto) as EstadoTimer) };
  } catch {
    return ESTADO_INICIAL;
  }
}

function salvar(estado: EstadoTimer) {
  localStorage.setItem(CHAVE, JSON.stringify(estado));
}

export function duracaoFase(estado: EstadoTimer) {
  if (estado.modo === "livre") return null;
  const { config, fase } = estado;
  const minutos =
    fase === "foco" ? config.foco : fase === "pausa_curta" ? config.pausaCurta : config.pausaLonga;
  return minutos * 60;
}

/** Segundos decorridos no trecho atual, calculados por timestamp. */
export function decorrido(estado: EstadoTimer, agora = Date.now()) {
  const extra = estado.rodando && estado.iniciadoEm ? (agora - estado.iniciadoEm) / 1000 : 0;
  return Math.floor(estado.acumulado + extra);
}

export function useTimer() {
  const [estado, setEstado] = useState<EstadoTimer>(ESTADO_INICIAL);
  const [tick, setTick] = useState(0);
  const hidratado = useRef(false);

  useEffect(() => {
    setEstado(ler());
    hidratado.current = true;
  }, []);

  useEffect(() => {
    if (hidratado.current) salvar(estado);
  }, [estado]);

  useEffect(() => {
    if (!estado.rodando) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [estado.rodando]);

  const segundos = decorrido(estado);
  const total = duracaoFase(estado);
  const restante = total === null ? null : Math.max(0, total - segundos);

  const atualizar = useCallback((patch: Partial<EstadoTimer>) => {
    setEstado((atual) => ({ ...atual, ...patch }));
  }, []);

  const iniciar = useCallback(() => {
    setEstado((atual) => ({ ...atual, rodando: true, iniciadoEm: Date.now() }));
  }, []);

  const pausar = useCallback(() => {
    setEstado((atual) => {
      if (!atual.rodando) return atual;
      const s = decorrido(atual);
      return { ...atual, rodando: false, iniciadoEm: null, acumulado: s };
    });
  }, []);

  const reiniciarTrecho = useCallback(
    (patch: Partial<EstadoTimer> = {}) => {
      setEstado((atual) => ({
        ...atual,
        acumulado: 0,
        iniciadoEm: atual.rodando ? Date.now() : null,
        ...patch,
      }));
    },
    [],
  );

  const descartar = useCallback(() => {
    setEstado((atual) => ({
      ...ESTADO_INICIAL,
      modo: atual.modo,
      config: atual.config,
      contexto: atual.contexto,
    }));
  }, []);

  /** Conclui a fase atual do pomodoro e avança (foco -> pausa -> foco...). */
  const avancarFase = useCallback(() => {
    setEstado((atual) => {
      const s = decorrido(atual);
      if (atual.fase === "foco") {
        const pomodoros = atual.pomodorosConcluidos + 1;
        const proxima: FasePomodoro =
          pomodoros % atual.config.ciclos === 0 ? "pausa_longa" : "pausa_curta";
        return {
          ...atual,
          fase: proxima,
          pomodorosConcluidos: pomodoros,
          focoTotal: atual.focoTotal + s,
          acumulado: 0,
          iniciadoEm: atual.rodando ? Date.now() : null,
        };
      }
      return {
        ...atual,
        fase: "foco",
        acumulado: 0,
        iniciadoEm: atual.rodando ? Date.now() : null,
      };
    });
  }, []);

  /** Total de segundos de foco para registrar a sessão. */
  const segundosDeFoco =
    estado.modo === "livre" ? segundos : estado.focoTotal + (estado.fase === "foco" ? segundos : 0);

  return {
    estado,
    segundos,
    restante,
    total,
    segundosDeFoco,
    tick,
    atualizar,
    iniciar,
    pausar,
    reiniciarTrecho,
    descartar,
    avancarFase,
  };
}
