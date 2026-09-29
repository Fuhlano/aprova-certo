import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import { Play } from "lucide-react";

import { EstadoVazio, PageContainer, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useConcursoAtivo } from "@/hooks/useConcursoAtivo";
import {
  calcularEstatisticas,
  useAssuntos,
  useDisciplinas,
  useQuestoes,
  useRevisoes,
  useSessoes,
} from "@/lib/queries";
import { formatarDuracao, formatarPorcentagem } from "@/lib/format";
import { estaAtrasada } from "@/lib/revisoes";

export const Route = createFileRoute("/_authenticated/desempenho")({
  component: DesempenhoPage,
});

function DesempenhoPage() {
  const navigate = useNavigate();
  const { concursoId } = useConcursoAtivo();
  const { data: assuntos } = useAssuntos(concursoId);
  const { data: disciplinas } = useDisciplinas(concursoId);
  const { data: sessoes } = useSessoes();
  const { data: questoes } = useQuestoes();
  const { data: revisoes } = useRevisoes();

  const dados = useMemo(() => {
    const estat = calcularEstatisticas(assuntos ?? [], sessoes ?? [], questoes ?? []);
    const atrasadasPorAssunto = new Set(
      (revisoes ?? [])
        .filter((r) => r.status === "pendente" && estaAtrasada(r.data_prevista))
        .map((r) => r.assunto_id),
    );

    return (assuntos ?? []).map((a) => {
      const e = estat.get(a.id);
      const percentual = e?.percentual ?? null;
      const diasSemEstudo = e?.ultimoEstudo
        ? Math.max(0, Math.round((Date.now() - new Date(e.ultimoEstudo).getTime()) / 86400000))
        : 999;
      const score =
        a.incidencia * (1 - (percentual ?? 40) / 100) * Math.min(Math.max(diasSemEstudo, 1), 60);
      return {
        id: a.id,
        nome: a.nome,
        disciplinaId: a.disciplina_id,
        disciplina: disciplinas?.find((d) => d.id === a.disciplina_id)?.nome ?? "",
        incidencia: a.incidencia,
        desempenho: percentual ?? 0,
        temQuestoes: percentual !== null,
        segundos: e?.segundos ?? 0,
        diasSemEstudo,
        revisaoAtrasada: atrasadasPorAssunto.has(a.id),
        score,
      };
    });
  }, [assuntos, sessoes, questoes, revisoes, disciplinas]);

  const prioridades = [...dados].sort((a, b) => b.score - a.score).slice(0, 15);
  const precisaRevisar = dados.filter(
    (d) =>
      d.revisaoAtrasada ||
      (d.temQuestoes && d.desempenho < 60) ||
      (d.diasSemEstudo > 30 && d.segundos > 0),
  );

  const pontosGrafico = dados
    .filter((d) => d.segundos > 0 || d.temQuestoes)
    .map((d) => ({ x: d.incidencia, y: d.desempenho, z: 100, nome: d.nome }));

  if (!concursoId || dados.length === 0) {
    return (
      <PageContainer>
        <PageHeader titulo="Desempenho" />
        <EstadoVazio
          titulo="Ainda sem dados suficientes"
          descricao="Cadastre o edital e registre sessões com questões para ver suas prioridades."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        titulo="Desempenho e prioridades"
        descricao="O que mais cai cruzado com o quanto você acerta."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Matriz incidência × desempenho</CardTitle>
            <CardDescription>
              Canto inferior direito: cai muito e você vai mal — estude primeiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pontosGrafico.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Registre questões para posicionar seus assuntos.
              </p>
            ) : (
              <ChartContainer
                config={{ assuntos: { label: "Assuntos", color: "var(--chart-1)" } }}
                className="h-72 w-full"
              >
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Incidência"
                    domain={[0, 5]}
                    tickLine={false}
                    fontSize={11}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="% acerto"
                    domain={[0, 100]}
                    tickLine={false}
                    fontSize={11}
                  />
                  <ZAxis type="number" dataKey="z" range={[60, 60]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Scatter data={pontosGrafico} fill="var(--color-assuntos)" />
                </ScatterChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Precisa revisar</CardTitle>
            <CardDescription>
              Revisão atrasada, acerto abaixo de 60% ou mais de 30 dias sem estudar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {precisaRevisar.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nada urgente por aqui. Bom trabalho!
              </p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {precisaRevisar.slice(0, 20).map((d) => (
                  <li key={d.id} className="flex items-center gap-2 rounded-xl border p-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{d.nome}</p>
                      <p className="text-xs text-muted-foreground">{d.disciplina}</p>
                    </div>
                    {d.revisaoAtrasada && (
                      <Badge className="bg-warning text-warning-foreground">atrasada</Badge>
                    )}
                    <Badge variant="secondary">
                      {d.temQuestoes ? formatarPorcentagem(d.desempenho) : "sem questões"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Ordem de prioridade</CardTitle>
          <CardDescription>
            incidência × (1 − % de acerto) × dias desde o último estudo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {prioridades.map((p, i) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm"
              >
                <span className="tabular w-6 text-muted-foreground">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.disciplina} · incidência {p.incidencia} ·{" "}
                    {p.segundos > 0 ? formatarDuracao(p.segundos) : "nunca estudado"}
                  </p>
                </div>
                <Badge variant="secondary">
                  {p.temQuestoes ? formatarPorcentagem(p.desempenho) : "sem questões"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate({
                      to: "/cronometro",
                      search: { disciplina: p.disciplinaId, assunto: p.id },
                    })
                  }
                >
                  <Play className="mr-1 size-3" /> Estudar
                </Button>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
