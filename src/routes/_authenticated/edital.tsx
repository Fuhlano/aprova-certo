import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Printer, Search } from "lucide-react";

import { EstadoVazio, PageContainer, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConcursoAtivo } from "@/hooks/useConcursoAtivo";
import {
  calcularEstatisticas,
  useAssuntos,
  useAtualizarAssunto,
  useAtualizarDisciplina,
  useDisciplinas,
  useQuestoes,
  useRevisoes,
  useSessoes,
} from "@/lib/queries";
import { formatarData, formatarDuracao, formatarPorcentagem, STATUS_ASSUNTO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/edital")({
  component: EditalPage,
});

function EditalPage() {
  const { concursoId } = useConcursoAtivo();
  const { data: disciplinas, isLoading } = useDisciplinas(concursoId);
  const { data: assuntos } = useAssuntos(concursoId);
  const { data: sessoes } = useSessoes();
  const { data: questoes } = useQuestoes();
  const { data: revisoes } = useRevisoes();
  const atualizarAssunto = useAtualizarAssunto();
  const atualizarDisciplina = useAtualizarDisciplina();

  const [busca, setBusca] = useState("");
  const [filtroDisciplina, setFiltroDisciplina] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const estat = useMemo(
    () => calcularEstatisticas(assuntos ?? [], sessoes ?? [], questoes ?? []),
    [assuntos, sessoes, questoes],
  );

  const ultimaRevisao = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const r of revisoes ?? []) {
      if (r.status !== "feita" || !r.data_concluida) continue;
      const atual = mapa.get(r.assunto_id);
      if (!atual || r.data_concluida > atual) mapa.set(r.assunto_id, r.data_concluida);
    }
    return mapa;
  }, [revisoes]);

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (assuntos ?? [])
      .filter((a) => {
        if (filtroDisciplina !== "todas" && a.disciplina_id !== filtroDisciplina) return false;
        if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
        if (termo && !a.nome.toLowerCase().includes(termo)) return false;
        return true;
      })
      .map((a) => {
        const e = estat.get(a.id);
        const disciplina = disciplinas?.find((d) => d.id === a.disciplina_id);
        return {
          ...a,
          disciplinaNome: disciplina?.nome ?? "",
          segundos: e?.segundos ?? 0,
          totalQuestoes: e?.total ?? 0,
          percentual: e?.percentual ?? null,
          ultimaRevisao: ultimaRevisao.get(a.id) ?? null,
        };
      });
  }, [assuntos, busca, filtroDisciplina, filtroStatus, estat, disciplinas, ultimaRevisao]);

  function exportarCsv() {
    const cabecalho = [
      "Disciplina",
      "Assunto",
      "Status",
      "Incidencia",
      "Horas",
      "Questoes",
      "Percentual",
      "Ultima revisao",
    ];
    const corpo = linhas.map((l) => [
      l.disciplinaNome,
      l.nome,
      l.status,
      l.incidencia,
      (l.segundos / 3600).toFixed(2).replace(".", ","),
      l.totalQuestoes,
      l.percentual ?? "",
      l.ultimaRevisao ?? "",
    ]);
    const csv = [cabecalho, ...corpo]
      .map((linha) => linha.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "edital-verticalizado.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  }

  if (!concursoId) {
    return (
      <PageContainer>
        <PageHeader titulo="Edital" />
        <EstadoVazio
          titulo="Nenhum concurso cadastrado"
          descricao="Importe seu edital para montar o plano de estudos."
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
        titulo="Edital verticalizado"
        descricao="Acompanhe status, horas, questões e revisões de cada assunto."
        acoes={
          <>
            <Button variant="outline" onClick={exportarCsv}>
              <Download className="mr-2 size-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 size-4" /> Imprimir
            </Button>
            <Button asChild>
              <Link to="/onboarding">Novo concurso</Link>
            </Button>
          </>
        }
      />

      <Card className="mb-4 rounded-2xl">
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar assunto"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Select value={filtroDisciplina} onValueChange={setFiltroDisciplina}>
            <SelectTrigger aria-label="Filtrar por disciplina">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as disciplinas</SelectItem>
              {(disciplinas ?? []).map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_ASSUNTO.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="mb-4 rounded-2xl">
        <CardContent className="flex flex-wrap gap-4 pt-6">
          {(disciplinas ?? []).map((d) => (
            <div key={d.id} className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <span className="text-sm font-medium">{d.nome}</span>
              <Badge variant="secondary">peso {d.peso}</Badge>
              <Switch
                checked={d.ativa}
                onCheckedChange={(v) =>
                  atualizarDisciplina.mutate({ id: d.id, patch: { ativa: v } })
                }
                aria-label={`Ativar ${d.nome} no ciclo`}
              />
              <Label className="text-xs text-muted-foreground">no ciclo</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : linhas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum assunto encontrado"
          descricao="Ajuste os filtros ou importe o conteúdo programático do edital."
        />
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Incidência</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Questões</TableHead>
                  <TableHead className="text-right">% acerto</TableHead>
                  <TableHead>Última revisão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-muted-foreground">{l.disciplinaNome}</TableCell>
                    <TableCell className="font-medium">{l.nome}</TableCell>
                    <TableCell>
                      <Select
                        value={l.status}
                        onValueChange={(v) =>
                          atualizarAssunto.mutate({ id: l.id, patch: { status: v } })
                        }
                      >
                        <SelectTrigger className="h-8 w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ASSUNTO.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(l.incidencia)}
                        onValueChange={(v) =>
                          atualizarAssunto.mutate({ id: l.id, patch: { incidencia: Number(v) } })
                        }
                      >
                        <SelectTrigger className="h-8 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatarDuracao(l.segundos)}
                    </TableCell>
                    <TableCell className="tabular text-right">{l.totalQuestoes}</TableCell>
                    <TableCell className="tabular text-right">
                      {formatarPorcentagem(l.percentual)}
                    </TableCell>
                    <TableCell>{l.ultimaRevisao ? formatarData(l.ultimaRevisao) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
