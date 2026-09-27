import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, Clock, Play, SkipForward } from "lucide-react";

import { EstadoVazio, PageContainer, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConcursoAtivo } from "@/hooks/useConcursoAtivo";
import { useDisciplinas } from "@/lib/queries";
import { buscarCicloAtivo, buscarItensCiclo, gerarCiclo } from "@/lib/ciclo-service";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/ciclo")({
  component: CicloPage,
});

function CicloPage() {
  const { concursoId } = useConcursoAtivo();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: disciplinas } = useDisciplinas(concursoId);
  const [carga, setCarga] = useState(20);
  const [bloco, setBloco] = useState(50);
  const [priorizarFracos, setPriorizarFracos] = useState(true);

  const { data: ciclo, isLoading } = useQuery({
    queryKey: ["ciclo", concursoId],
    enabled: !!concursoId,
    queryFn: () => buscarCicloAtivo(concursoId!),
  });

  const { data: itens } = useQuery({
    queryKey: ["ciclo_itens", ciclo?.id],
    enabled: !!ciclo?.id,
    queryFn: () => buscarItensCiclo(ciclo!.id),
  });

  const gerar = useMutation({
    mutationFn: () =>
      gerarCiclo({
        concursoId: concursoId!,
        cargaSemanalHoras: carga,
        duracaoBlocoMin: bloco,
        priorizarFracos,
      }),
    onSuccess: () => {
      toast.success("Ciclo gerado!");
      qc.invalidateQueries();
    },
    onError: (e) => toast.error("Não foi possível gerar", { description: e.message }),
  });

  const atualizarItem = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("ciclo_itens").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ciclo_itens"] }),
  });

  const reiniciar = useMutation({
    mutationFn: async () => {
      if (!ciclo) return;
      await supabase.from("ciclo_itens").update({ blocos_concluidos: 0 }).eq("ciclo_id", ciclo.id);
      await supabase.from("ciclos").update({ voltas: ciclo.voltas + 1 }).eq("id", ciclo.id);
    },
    onSuccess: () => {
      toast.success("Nova volta iniciada!");
      qc.invalidateQueries();
    },
  });

  const nomeDisciplina = (id: string) =>
    disciplinas?.find((d) => d.id === id)?.nome ?? "Disciplina";

  if (!concursoId) {
    return (
      <PageContainer>
        <PageHeader titulo="Ciclo de Estudos" />
        <EstadoVazio
          titulo="Cadastre um concurso primeiro"
          descricao="O ciclo é montado a partir das disciplinas do seu edital."
          acao={
            <Button asChild>
              <Link to="/onboarding">Cadastrar concurso</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const concluidos = (itens ?? []).filter((i) => i.blocos_concluidos > 0).length;
  const totalBlocos = itens?.length ?? 0;
  const percentual = totalBlocos > 0 ? Math.round((concluidos / totalBlocos) * 100) : 0;
  const atual = (itens ?? []).find((i) => i.blocos_concluidos === 0);

  return (
    <PageContainer>
      <PageHeader
        titulo="Ciclo de Estudos"
        descricao="Blocos distribuídos por peso, incidência e seus pontos fracos."
        acoes={
          ciclo && (
            <Button variant="outline" onClick={() => reiniciar.mutate()} disabled={percentual < 100}>
              Reiniciar ciclo
            </Button>
          )
        }
      />

      <Card className="mb-6 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Configurar e gerar</CardTitle>
          <CardDescription>
            Usa apenas as disciplinas marcadas como ativas no edital.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="carga">Horas por semana</Label>
            <Input
              id="carga"
              type="number"
              min={1}
              max={80}
              value={carga}
              onChange={(e) => setCarga(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Duração do bloco</Label>
            <Select value={String(bloco)} onValueChange={(v) => setBloco(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[30, 45, 50, 60, 90].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Switch
              id="fracos"
              checked={priorizarFracos}
              onCheckedChange={setPriorizarFracos}
            />
            <Label htmlFor="fracos" className="text-sm">
              Priorizar pontos fracos
            </Label>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => gerar.mutate()} disabled={gerar.isPending}>
              {ciclo ? "Gerar novo ciclo" : "Gerar ciclo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-64 w-full rounded-2xl" />}

      {!isLoading && !ciclo && (
        <EstadoVazio
          titulo="Você ainda não tem um ciclo"
          descricao="Defina sua carga semanal acima e gere o primeiro ciclo de estudos."
        />
      )}

      {ciclo && (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <div className="relative grid size-32 place-items-center">
                <svg viewBox="0 0 100 100" className="size-32 -rotate-90">
                  <circle cx="50" cy="50" r="42" className="fill-none stroke-muted" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="fill-none stroke-primary transition-all"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(percentual / 100) * 264} 264`}
                  />
                </svg>
                <span className="tabular absolute text-2xl font-bold">{percentual}%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {concluidos} de {totalBlocos} blocos
              </p>
              <Badge variant="secondary">{ciclo.voltas + 1}ª volta</Badge>
              <p className="text-center text-xs text-muted-foreground">
                {ciclo.nome} · blocos de {ciclo.duracao_bloco_min} min
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {(itens ?? []).map((item, i) => {
              const feito = item.blocos_concluidos > 0;
              const ehAtual = atual?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3 ${
                    ehAtual ? "border-primary ring-1 ring-primary/30" : ""
                  }`}
                >
                  <span className="tabular w-8 text-sm text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium ${feito ? "text-muted-foreground line-through" : ""}`}>
                      {nomeDisciplina(item.disciplina_id)}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {ciclo.duracao_bloco_min} min
                      {ehAtual && <Badge className="ml-2">bloco atual</Badge>}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={ehAtual ? "default" : "outline"}
                      onClick={() =>
                        navigate({
                          to: "/cronometro",
                          search: { disciplina: item.disciplina_id, cicloItem: item.id },
                        })
                      }
                    >
                      <Play className="mr-1 size-3" /> Estudar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Marcar como concluído"
                      onClick={() =>
                        atualizarItem.mutate({
                          id: item.id,
                          patch: { blocos_concluidos: feito ? 0 : 1 },
                        })
                      }
                    >
                      <Check className={`size-4 ${feito ? "text-success" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Adiar para o fim"
                      onClick={() =>
                        atualizarItem.mutate({
                          id: item.id,
                          patch: { ordem: (itens?.length ?? 0) + 1 },
                        })
                      }
                    >
                      <SkipForward className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Subir"
                      onClick={() =>
                        atualizarItem.mutate({ id: item.id, patch: { ordem: item.ordem - 1.5 } })
                      }
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Descer"
                      onClick={() =>
                        atualizarItem.mutate({ id: item.id, patch: { ordem: item.ordem + 1.5 } })
                      }
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <Progress value={percentual} className="mt-2" />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
