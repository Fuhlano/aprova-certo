import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Flame, Play, Target, Timer } from "lucide-react";

import { EstadoVazio, PageContainer, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useConcursoAtivo } from "@/hooks/useConcursoAtivo";
import {
  calcularEstatisticas,
  useAssuntos,
  useDisciplinas,
  usePerfil,
  useQuestoes,
  useRevisoes,
  useSessoes,
} from "@/lib/queries";
import { buscarCicloAtivo, buscarItensCiclo } from "@/lib/ciclo-service";
import { useQuery } from "@tanstack/react-query";
import { diasAte, formatarDuracao, formatarNumero } from "@/lib/format";
import { estaAtrasada } from "@/lib/revisoes";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function inicioDaSemana() {
  const d = new Date();
  const dia = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - dia);
  d.setHours(0, 0, 0, 0);
  return d;
}

function Heatmap({ porDia }: { porDia: Map<string, number> }) {
  const dias: Array<{ chave: string; segundos: number }> = [];
  const hoje = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const chave = d.toISOString().slice(0, 10);
    dias.push({ chave, segundos: porDia.get(chave) ?? 0 });
  }
  const nivel = (s: number) => {
    if (s === 0) return "bg-muted";
    if (s < 1800) return "bg-primary/25";
    if (s < 3600) return "bg-primary/50";
    if (s < 7200) return "bg-primary/75";
    return "bg-primary";
  };
  return (
    <div className="flex gap-[3px] overflow-x-auto pb-2">
      {Array.from({ length: 53 }).map((_, semana) => (
        <div key={semana} className="flex flex-col gap-[3px]">
          {dias.slice(semana * 7, semana * 7 + 7).map((dia) => (
            <span
              key={dia.chave}
              title={`${dia.chave}: ${formatarDuracao(dia.segundos)}`}
              className={`size-[10px] rounded-[2px] ${nivel(dia.segundos)}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { concurso, concursoId, isLoading: carregandoConcurso } = useConcursoAtivo();
  const { data: disciplinas } = useDisciplinas(concursoId);
  const { data: assuntos } = useAssuntos(concursoId);
  const { data: sessoes, isLoading } = useSessoes();
  const { data: questoes } = useQuestoes();
  const { data: revisoes } = useRevisoes();
  const { data: perfil } = usePerfil();

  const { data: ciclo } = useQuery({
    queryKey: ["ciclo", concursoId],
    enabled: !!concursoId,
    queryFn: () => buscarCicloAtivo(concursoId!),
  });
  const { data: itensCiclo } = useQuery({
    queryKey: ["ciclo_itens", ciclo?.id],
    enabled: !!ciclo?.id,
    queryFn: () => buscarItensCiclo(ciclo!.id),
  });

  const metricas = useMemo(() => {
    const lista = sessoes ?? [];
    const hoje = new Date().toISOString().slice(0, 10);
    const semana = inicioDaSemana().toISOString();
    const porDia = new Map<string, number>();
    let segHoje = 0;
    let segSemana = 0;
    let segTotal = 0;
    for (const s of lista) {
      const dia = s.inicio.slice(0, 10);
      porDia.set(dia, (porDia.get(dia) ?? 0) + s.duracao_seg);
      segTotal += s.duracao_seg;
      if (dia === hoje) segHoje += s.duracao_seg;
      if (s.inicio >= semana) segSemana += s.duracao_seg;
    }
    // streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const chave = d.toISOString().slice(0, 10);
      if ((porDia.get(chave) ?? 0) > 0) streak += 1;
      else if (i > 0) break;
    }
    return { porDia, segHoje, segSemana, segTotal, streak };
  }, [sessoes]);

  const horasPorDisciplina = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const s of sessoes ?? []) {
      if (!s.disciplina_id) continue;
      mapa.set(s.disciplina_id, (mapa.get(s.disciplina_id) ?? 0) + s.duracao_seg);
    }
    return (disciplinas ?? [])
      .map((d) => ({
        nome: d.nome.length > 16 ? `${d.nome.slice(0, 16)}…` : d.nome,
        horas: Number(((mapa.get(d.id) ?? 0) / 3600).toFixed(1)),
      }))
      .filter((d) => d.horas > 0)
      .sort((a, b) => b.horas - a.horas);
  }, [sessoes, disciplinas]);

  const evolucaoAcerto = useMemo(() => {
    const porDia = new Map<string, { total: number; acertos: number }>();
    for (const q of questoes ?? []) {
      const dia = q.criado_em.slice(0, 10);
      const atual = porDia.get(dia) ?? { total: 0, acertos: 0 };
      atual.total += q.total;
      atual.acertos += q.acertos;
      porDia.set(dia, atual);
    }
    return [...porDia.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([dia, v]) => ({
        dia: dia.slice(8, 10) + "/" + dia.slice(5, 7),
        percentual: v.total > 0 ? Math.round((v.acertos / v.total) * 100) : 0,
      }));
  }, [questoes]);

  const prioridades = useMemo(() => {
    const estat = calcularEstatisticas(assuntos ?? [], sessoes ?? [], questoes ?? []);
    return (assuntos ?? [])
      .map((a) => {
        const e = estat.get(a.id);
        const acerto = e?.percentual ?? null;
        const dias = e?.ultimoEstudo
          ? Math.max(1, Math.round((Date.now() - new Date(e.ultimoEstudo).getTime()) / 86400000))
          : 30;
        const score = a.incidencia * (1 - (acerto ?? 40) / 100) * Math.min(dias, 60);
        return { ...a, acerto, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [assuntos, sessoes, questoes]);

  const metaSemanal = Number(perfil?.meta_horas_semanais ?? 20);
  const progressoMeta = Math.min(100, (metricas.segSemana / 3600 / metaSemanal) * 100);
  const blocosFeitos = (itensCiclo ?? []).filter((i) => i.blocos_concluidos > 0).length;
  const progressoCiclo =
    itensCiclo && itensCiclo.length > 0 ? Math.round((blocosFeitos / itensCiclo.length) * 100) : 0;
  const revisoesPendentes = (revisoes ?? []).filter((r) => r.status === "pendente");
  const atrasadas = revisoesPendentes.filter((r) => estaAtrasada(r.data_prevista));
  const contagem = diasAte(concurso?.data_prova);

  if (carregandoConcurso) {
    return (
      <PageContainer>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </PageContainer>
    );
  }

  if (!concursoId) {
    return (
      <PageContainer>
        <PageHeader titulo="Dashboard" />
        <EstadoVazio
          titulo="Comece cadastrando seu concurso"
          descricao="Em quatro passos você importa o edital e ganha um ciclo de estudos pronto."
          acao={
            <Button asChild>
              <Link to="/onboarding">Cadastrar concurso</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        titulo={concurso?.nome ?? "Dashboard"}
        descricao={[concurso?.banca, concurso?.cargo].filter(Boolean).join(" · ") || undefined}
        acoes={
          <Button onClick={() => navigate({ to: "/cronometro" })}>
            <Play className="mr-2 size-4" /> Estudar agora
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Timer className="size-4" /> Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-3xl font-bold">{formatarDuracao(metricas.segHoje)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Semana: {formatarDuracao(metricas.segSemana)} · Total:{" "}
              {formatarDuracao(metricas.segTotal)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="size-4" /> Meta semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-3xl font-bold">
              {formatarNumero(progressoMeta, 0)}%
            </p>
            <Progress value={progressoMeta} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">Meta: {metaSemanal}h por semana</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Flame className="size-4" /> Constância
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-3xl font-bold">{metricas.streak} dias</p>
            <p className="mt-1 text-xs text-muted-foreground">Sequência estudando</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" /> Prova
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-3xl font-bold">
              {contagem === null ? "—" : `${contagem} dias`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {contagem === null ? "Defina a data da prova" : "Faltam para a prova"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Constância nos últimos 12 meses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-24 w-full" /> : <Heatmap porDia={metricas.porDia} />}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Ciclo atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-3xl font-bold">{progressoCiclo}%</p>
            <Progress value={progressoCiclo} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {blocosFeitos} de {itensCiclo?.length ?? 0} blocos concluídos
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/ciclo">Abrir ciclo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Horas por disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            {horasPorDisciplina.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Registre sessões para ver este gráfico.
              </p>
            ) : (
              <ChartContainer
                config={{ horas: { label: "Horas", color: "var(--chart-1)" } }}
                className="h-64 w-full"
              >
                <BarChart data={horasPorDisciplina}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="nome" tickLine={false} fontSize={11} />
                  <YAxis tickLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="horas" fill="var(--color-horas)" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Evolução do % de acerto</CardTitle>
          </CardHeader>
          <CardContent>
            {evolucaoAcerto.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Registre questões para acompanhar sua evolução.
              </p>
            ) : (
              <ChartContainer
                config={{ percentual: { label: "% de acerto", color: "var(--chart-1)" } }}
                className="h-64 w-full"
              >
                <LineChart data={evolucaoAcerto}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="dia" tickLine={false} fontSize={11} />
                  <YAxis domain={[0, 100]} tickLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="percentual"
                    stroke="var(--color-percentual)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Revisões pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-3xl font-bold">{revisoesPendentes.length}</p>
            {atrasadas.length > 0 && (
              <Badge className="mt-2 bg-warning text-warning-foreground">
                {atrasadas.length} atrasada(s)
              </Badge>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/revisoes">Ver revisões</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Top 5 assuntos prioritários</CardTitle>
          </CardHeader>
          <CardContent>
            {prioridades.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cadastre assuntos no edital.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {prioridades.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="tabular w-5 text-muted-foreground">{i + 1}.</span>
                    <span className="min-w-0 flex-1 truncate">{p.nome}</span>
                    <Badge variant="secondary">
                      {p.acerto === null ? "sem questões" : `${p.acerto}%`}
                    </Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
