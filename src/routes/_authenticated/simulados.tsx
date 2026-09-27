import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Plus, Trash2 } from "lucide-react";

import { EstadoVazio, PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConcursoAtivo } from "@/hooks/useConcursoAtivo";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, formatarPorcentagem } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/simulados")({
  component: SimuladosPage,
});

type Simulado = {
  id: string;
  nome: string;
  data: string;
  total: number;
  acertos: number;
  tempo_min: number;
  observacoes: string | null;
};

function SimuladosPage() {
  const { concursoId } = useConcursoAtivo();
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    data: new Date().toISOString().slice(0, 10),
    total: "",
    acertos: "",
    tempo_min: "",
    observacoes: "",
  });

  const { data: simulados } = useQuery({
    queryKey: ["simulados", concursoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulados")
        .select("*")
        .order("data", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Simulado[];
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const total = Number(form.total) || 0;
      const acertos = Number(form.acertos) || 0;
      if (!form.nome.trim()) throw new Error("Informe o nome do simulado");
      if (acertos > total) throw new Error("Acertos não podem passar do total");
      const { error } = await supabase.from("simulados").insert({
        concurso_id: concursoId,
        nome: form.nome.trim(),
        data: form.data,
        total,
        acertos,
        tempo_min: Number(form.tempo_min) || 0,
        observacoes: form.observacoes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Simulado registrado");
      setAberto(false);
      setForm({
        nome: "",
        data: new Date().toISOString().slice(0, 10),
        total: "",
        acertos: "",
        tempo_min: "",
        observacoes: "",
      });
      qc.invalidateQueries({ queryKey: ["simulados"] });
    },
    onError: (e) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("simulados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Simulado excluído");
      qc.invalidateQueries({ queryKey: ["simulados"] });
    },
  });

  const evolucao = (simulados ?? []).map((s) => ({
    data: formatarData(s.data).slice(0, 5),
    percentual: s.total > 0 ? Math.round((s.acertos / s.total) * 100) : 0,
  }));

  return (
    <PageContainer>
      <PageHeader
        titulo="Simulados"
        descricao="Registre seus simulados e acompanhe a evolução."
        acoes={
          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> Novo simulado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar simulado</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Nome</Label>
                  <Input
                    maxLength={120}
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tempo (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.tempo_min}
                    onChange={(e) => setForm({ ...form, tempo_min: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Total de questões</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.total}
                    onChange={(e) => setForm({ ...form, total: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Acertos</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.acertos}
                    onChange={(e) => setForm({ ...form, acertos: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    rows={3}
                    maxLength={1000}
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setAberto(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => criar.mutate()} disabled={criar.isPending}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {(simulados ?? []).length === 0 ? (
        <EstadoVazio
          titulo="Nenhum simulado registrado"
          descricao="Registre seus simulados para acompanhar a evolução do seu percentual de acerto."
        />
      ) : (
        <div className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Evolução do acerto</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ percentual: { label: "% de acerto", color: "var(--chart-1)" } }}
                className="h-64 w-full"
              >
                <LineChart data={evolucao}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="data" tickLine={false} fontSize={11} />
                  <YAxis domain={[0, 100]} tickLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="percentual"
                    stroke="var(--color-percentual)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="overflow-x-auto pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Simulado</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Acertos</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Tempo</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(simulados ?? [])].reverse().map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.nome}</TableCell>
                      <TableCell>{formatarData(s.data)}</TableCell>
                      <TableCell className="tabular text-right">
                        {s.acertos}/{s.total}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatarPorcentagem(s.total > 0 ? (s.acertos / s.total) * 100 : null)}
                      </TableCell>
                      <TableCell className="tabular text-right">{s.tempo_min} min</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="Excluir simulado">
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir simulado?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => excluir.mutate(s.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
