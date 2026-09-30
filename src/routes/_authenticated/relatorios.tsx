import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Printer } from "lucide-react";

import { EstadoVazio, PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAssuntos, useDisciplinas, useQuestoes, useSessoes } from "@/lib/queries";
import { formatarData, formatarDuracao, formatarPorcentagem, TIPOS_ESTUDO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/relatorios")({
  component: Relatorios,
});

function isoDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

function Relatorios() {
  const { concursoId } = useConcursoAtivo();
  const { data: disciplinas } = useDisciplinas(concursoId);
  const { data: assuntos } = useAssuntos(concursoId);
  const { data: sessoes } = useSessoes();
  const { data: questoes } = useQuestoes();

  const hoje = new Date();
  const trintaDias = new Date(hoje.getTime() - 29 * 86400000);
  const [de, setDe] = useState(isoDia(trintaDias));
  const [ate, setAte] = useState(isoDia(hoje));
  const [disciplinaId, setDisciplinaId] = useState("todas");

  const linhas = useMemo(() => {
    const questoesPorSessao = new Map<string, { total: number; acertos: number }>();
    for (const q of questoes ?? []) {
      if (!q.sessao_id) continue;
      const atual = questoesPorSessao.get(q.sessao_id) ?? { total: 0, acertos: 0 };
      atual.total += q.total;
      atual.acertos += q.acertos;
      questoesPorSessao.set(q.sessao_id, atual);
    }
    return (sessoes ?? [])
      .filter((s) => {
        const dia = s.inicio.slice(0, 10);
        if (dia < de || dia > ate) return false;
        if (disciplinaId !== "todas" && s.disciplina_id !== disciplinaId) return false;
        if (disciplinaId === "todas" && concursoId) {
          const pertence = (disciplinas ?? []).some((d) => d.id === s.disciplina_id);
          if (s.disciplina_id && !pertence) return false;
        }
        return true;
      })
      .map((s) => {
        const q = s.id ? questoesPorSessao.get(s.id) : undefined;
        return {
          id: s.id,
          data: s.inicio,
          disciplina: disciplinas?.find((d) => d.id === s.disciplina_id)?.nome ?? "—",
          assunto: assuntos?.find((a) => a.id === s.assunto_id)?.nome ?? "—",
          tipo: TIPOS_ESTUDO.find((t) => t.value === s.tipo)?.label ?? s.tipo,
          segundos: s.duracao_seg,
          total: q?.total ?? 0,
          percentual: q && q.total > 0 ? Math.round((q.acertos / q.total) * 100) : null,
        };
      });
  }, [sessoes, questoes, disciplinas, assuntos, de, ate, disciplinaId, concursoId]);

  const totalSegundos = linhas.reduce((acc, l) => acc + l.segundos, 0);
  const totalQuestoes = linhas.reduce((acc, l) => acc + l.total, 0);

  function exportarCsv() {
    const cabecalho = ["Data", "Disciplina", "Assunto", "Tipo", "Minutos", "Questões", "% acerto"];
    const csv = [
      cabecalho,
      ...linhas.map((l) => [
        formatarData(l.data),
        l.disciplina,
        l.assunto,
        l.tipo,
        Math.round(l.segundos / 60),
        l.total,
        l.percentual ?? "",
      ]),
    ]
      .map((linha) => linha.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${de}-a-${ate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado");
  }

  return (
    <PageContainer>
      <PageHeader
        titulo="Relatórios"
        descricao="Suas sessões por período e disciplina."
        acoes={
          <>
            <Button variant="outline" onClick={exportarCsv} disabled={linhas.length === 0}>
              <Download className="mr-2 size-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 size-4" /> Imprimir
            </Button>
          </>
        }
      />

      <Card className="mb-4 rounded-2xl">
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-3">
          <div>
            <Label htmlFor="de">De</Label>
            <Input id="de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ate">Até</Label>
            <Input id="ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
          <div>
            <Label>Disciplina</Label>
            <Select value={disciplinaId} onValueChange={setDisciplinaId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {(disciplinas ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo estudado
            </CardTitle>
          </CardHeader>
          <CardContent className="tabular text-2xl font-semibold">
            {formatarDuracao(totalSegundos)}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessões</CardTitle>
          </CardHeader>
          <CardContent className="tabular text-2xl font-semibold">{linhas.length}</CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Questões</CardTitle>
          </CardHeader>
          <CardContent className="tabular text-2xl font-semibold">{totalQuestoes}</CardContent>
        </Card>
      </div>

      {linhas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma sessão no período"
          descricao="Ajuste as datas ou registre uma sessão no cronômetro."
        />
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Tempo</TableHead>
                  <TableHead className="text-right">Questões</TableHead>
                  <TableHead className="text-right">% acerto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="tabular">{formatarData(l.data)}</TableCell>
                    <TableCell>{l.disciplina}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{l.assunto}</TableCell>
                    <TableCell className="text-muted-foreground">{l.tipo}</TableCell>
                    <TableCell className="tabular text-right">
                      {formatarDuracao(l.segundos)}
                    </TableCell>
                    <TableCell className="tabular text-right">{l.total}</TableCell>
                    <TableCell className="tabular text-right">
                      {formatarPorcentagem(l.percentual)}
                    </TableCell>
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
