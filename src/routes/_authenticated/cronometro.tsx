import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Maximize2, Pause, Play, RotateCcw, Square, Volume2, VolumeX } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConcursoAtivo } from "@/hooks/useConcursoAtivo";
import { useAssuntos, useDisciplinas, usePerfil } from "@/lib/queries";
import { useTimer, duracaoFase } from "@/hooks/useTimer";
import { formatarCronometro, TIPOS_ESTUDO } from "@/lib/format";
import { registrarSessao } from "@/lib/sessao-service";
import { INTERVALOS_PADRAO } from "@/lib/revisoes";

type Busca = {
  disciplina?: string;
  assunto?: string;
  tipo?: string;
  cicloItem?: string;
};

export const Route = createFileRoute("/_authenticated/cronometro")({
  validateSearch: (busca: Record<string, unknown>): Busca => ({
    disciplina: typeof busca.disciplina === "string" ? busca.disciplina : undefined,
    assunto: typeof busca.assunto === "string" ? busca.assunto : undefined,
    tipo: typeof busca.tipo === "string" ? busca.tipo : undefined,
    cicloItem: typeof busca.cicloItem === "string" ? busca.cicloItem : undefined,
  }),
  component: Cronometro,
});

function tocarAlerta() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    /* silencioso */
  }
}

function Cronometro() {
  const busca = useSearch({ from: "/_authenticated/cronometro" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { concursoId } = useConcursoAtivo();
  const { data: disciplinas } = useDisciplinas(concursoId);
  const { data: assuntos } = useAssuntos(concursoId);
  const { data: perfil } = usePerfil();

  const timer = useTimer();
  const { estado } = timer;
  const [som, setSom] = useState(true);
  const [foco, setFoco] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [inicioSessao, setInicioSessao] = useState<string | null>(null);
  const alertado = useRef<string>("");

  const [registro, setRegistro] = useState({
    total: "",
    acertos: "",
    erros: "",
    emBranco: "",
    anotacoes: "",
    status: "estudando",
    agendarRevisao: true,
  });

  // Pré-preenche a partir do bloco do ciclo
  useEffect(() => {
    if (!busca.disciplina && !busca.assunto && !busca.tipo) return;
    timer.atualizar({
      contexto: {
        disciplinaId: busca.disciplina ?? estado.contexto.disciplinaId,
        assuntoId: busca.assunto ?? estado.contexto.assuntoId,
        tipo: busca.tipo ?? estado.contexto.tipo,
        cicloItemId: busca.cicloItem ?? null,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca.disciplina, busca.assunto, busca.tipo, busca.cicloItem]);

  const assuntosDaDisciplina = useMemo(
    () => (assuntos ?? []).filter((a) => a.disciplina_id === estado.contexto.disciplinaId),
    [assuntos, estado.contexto.disciplinaId],
  );

  const total = duracaoFase(estado);
  const exibir = estado.modo === "livre" ? timer.segundos : (timer.restante ?? 0);

  // Título da aba + alerta de fim de fase
  useEffect(() => {
    document.title = estado.rodando
      ? `${formatarCronometro(exibir)} — Aprova`
      : "Cronômetro — Aprova";
  }, [exibir, estado.rodando]);

  useEffect(() => {
    if (estado.modo !== "pomodoro" || total === null) return;
    if (timer.restante !== 0 || !estado.rodando) return;
    const chave = `${estado.fase}-${estado.pomodorosConcluidos}`;
    if (alertado.current === chave) return;
    alertado.current = chave;
    if (som) tocarAlerta();
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(estado.fase === "foco" ? "Hora da pausa!" : "De volta ao foco!");
    }
    timer.avancarFase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.restante, estado.rodando, estado.modo, total]);

  function iniciar() {
    if (!estado.contexto.disciplinaId) {
      toast.error("Escolha a disciplina antes de começar");
      return;
    }
    if (!inicioSessao) setInicioSessao(new Date().toISOString());
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    timer.iniciar();
  }

  function finalizar() {
    if (timer.segundosDeFoco < 10) {
      toast.error("Sessão muito curta para registrar");
      return;
    }
    timer.pausar();
    setModalAberto(true);
  }

  async function salvar() {
    const totalQ = Number(registro.total) || 0;
    const acertos = Number(registro.acertos) || 0;
    const erros = Number(registro.erros) || 0;
    const emBranco = Number(registro.emBranco) || 0;
    if (totalQ > 0 && acertos + erros + emBranco > totalQ) {
      toast.error("A soma de acertos, erros e brancos passa do total");
      return;
    }
    try {
      await registrarSessao({
        concursoId: concursoId,
        disciplinaId: estado.contexto.disciplinaId,
        assuntoId: estado.contexto.assuntoId,
        cicloItemId: estado.contexto.cicloItemId,
        tipo: estado.contexto.tipo,
        inicio: inicioSessao ?? new Date().toISOString(),
        duracaoSeg: timer.segundosDeFoco,
        pomodoros: estado.pomodorosConcluidos,
        anotacoes: registro.anotacoes.trim() || null,
        questoes: totalQ > 0 ? { total: totalQ, acertos, erros, emBranco } : null,
        novoStatusAssunto: estado.contexto.assuntoId ? registro.status : null,
        agendarRevisao: registro.agendarRevisao && estado.contexto.tipo !== "revisao",
        intervalos: perfil?.intervalos_revisao ?? INTERVALOS_PADRAO,
      });
      toast.success("Sessão registrada!");
      setModalAberto(false);
      setInicioSessao(null);
      setRegistro({
        total: "",
        acertos: "",
        erros: "",
        emBranco: "",
        anotacoes: "",
        status: "estudando",
        agendarRevisao: true,
      });
      timer.descartar();
      qc.invalidateQueries();
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error("Não foi possível registrar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const rotuloFase =
    estado.modo === "livre"
      ? "Cronômetro livre"
      : estado.fase === "foco"
        ? "Foco"
        : estado.fase === "pausa_curta"
          ? "Pausa curta"
          : "Pausa longa";

  return (
    <PageContainer>
      <PageHeader titulo="Cronômetro" descricao="Escolha o que vai estudar e comece." />

      <div
        className={
          foco
            ? "fixed inset-0 z-50 grid place-items-center bg-background p-6"
            : "grid gap-4 lg:grid-cols-[1fr_320px]"
        }
      >
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-6 py-10">
            <Tabs
              value={estado.modo}
              onValueChange={(v) =>
                timer.atualizar({ modo: v as "livre" | "pomodoro", fase: "foco" })
              }
            >
              <TabsList>
                <TabsTrigger value="livre">Cronômetro livre</TabsTrigger>
                <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
              </TabsList>
            </Tabs>

            <p className="text-sm font-medium text-muted-foreground">{rotuloFase}</p>
            <p className="tabular text-6xl font-bold tracking-tight sm:text-7xl">
              {formatarCronometro(exibir)}
            </p>
            {total !== null && (
              <Progress
                value={Math.min(100, (timer.segundos / total) * 100)}
                className="w-full max-w-sm"
              />
            )}
            {estado.modo === "pomodoro" && (
              <p className="text-xs text-muted-foreground">
                {estado.pomodorosConcluidos} pomodoro(s) concluído(s)
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              {estado.rodando ? (
                <Button size="lg" variant="outline" onClick={timer.pausar}>
                  <Pause className="mr-2 size-4" /> Pausar
                </Button>
              ) : (
                <Button size="lg" onClick={iniciar}>
                  <Play className="mr-2 size-4" /> {timer.segundos > 0 ? "Retomar" : "Iniciar"}
                </Button>
              )}
              <Button size="lg" variant="secondary" onClick={finalizar}>
                <Square className="mr-2 size-4" /> Finalizar
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  timer.descartar();
                  setInicioSessao(null);
                }}
              >
                <RotateCcw className="mr-2 size-4" /> Descartar
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setSom((s) => !s)} aria-label="Som">
                {som ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setFoco((f) => !f)}
                aria-label="Modo foco"
              >
                <Maximize2 className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {!foco && (
          <div className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">O que você vai estudar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Disciplina</Label>
                  <Select
                    value={estado.contexto.disciplinaId ?? undefined}
                    onValueChange={(v) =>
                      timer.atualizar({
                        contexto: { ...estado.contexto, disciplinaId: v, assuntoId: null },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha" />
                    </SelectTrigger>
                    <SelectContent>
                      {(disciplinas ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assunto</Label>
                  <Select
                    value={estado.contexto.assuntoId ?? undefined}
                    onValueChange={(v) =>
                      timer.atualizar({ contexto: { ...estado.contexto, assuntoId: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha" />
                    </SelectTrigger>
                    <SelectContent>
                      {assuntosDaDisciplina.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de estudo</Label>
                  <Select
                    value={estado.contexto.tipo}
                    onValueChange={(v) =>
                      timer.atualizar({ contexto: { ...estado.contexto, tipo: v } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_ESTUDO.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {estado.modo === "pomodoro" && (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Pomodoro</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["foco", "Foco (min)"],
                      ["pausaCurta", "Pausa curta"],
                      ["pausaLonga", "Pausa longa"],
                      ["ciclos", "Ciclos"],
                    ] as const
                  ).map(([chave, rotulo]) => (
                    <div key={chave}>
                      <Label className="text-xs">{rotulo}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={estado.config[chave]}
                        onChange={(e) =>
                          timer.atualizar({
                            config: { ...estado.config, [chave]: Number(e.target.value) || 1 },
                          })
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar sessão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tempo de foco: <strong className="tabular">{formatarCronometro(timer.segundosDeFoco)}</strong>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["total", "Questões resolvidas"],
                  ["acertos", "Acertos"],
                  ["erros", "Erros"],
                  ["emBranco", "Em branco"],
                ] as const
              ).map(([chave, rotulo]) => (
                <div key={chave}>
                  <Label className="text-xs">{rotulo}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={registro[chave]}
                    onChange={(e) => setRegistro({ ...registro, [chave]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Anotações</Label>
              <Textarea
                rows={3}
                maxLength={2000}
                value={registro.anotacoes}
                onChange={(e) => setRegistro({ ...registro, anotacoes: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Como ficou o assunto?</Label>
              <Select
                value={registro.status}
                onValueChange={(v) => setRegistro({ ...registro, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estudando">Estudando</SelectItem>
                  <SelectItem value="revisar">Preciso revisar</SelectItem>
                  <SelectItem value="dominado">Dominado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="revisao"
                checked={registro.agendarRevisao}
                onCheckedChange={(v) => setRegistro({ ...registro, agendarRevisao: v })}
              />
              <Label htmlFor="revisao" className="text-sm">
                Agendar revisões automáticas
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalAberto(false)}>
              Voltar
            </Button>
            <Button onClick={salvar}>Salvar sessão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
