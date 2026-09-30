import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, Check, Play, X } from "lucide-react";

import { EstadoVazio, PageContainer, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConcursoAtivo } from "@/hooks/useConcursoAtivo";
import { useAssuntos, useDisciplinas, useRevisoes, type Revisao } from "@/lib/queries";
import { formatarData } from "@/lib/format";
import { ehHoje, estaAtrasada } from "@/lib/revisoes";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/revisoes")({
  component: RevisoesPage,
});

function RevisoesPage() {
  const { concursoId } = useConcursoAtivo();
  const { data: assuntos } = useAssuntos(concursoId);
  const { data: disciplinas } = useDisciplinas(concursoId);
  const { data: revisoes, isLoading } = useRevisoes();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const acao = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: {
        status?: string;
        data_prevista?: string;
        data_concluida?: string | null;
        indice_intervalo?: number;
      };
    }) => {
      const { error } = await supabase.from("revisoes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revisoes"] }),
  });

  const pendentes = (revisoes ?? []).filter((r) => r.status === "pendente");
  const emSeteDias = (r: Revisao) => {
    const limite = new Date();
    limite.setDate(limite.getDate() + 7);
    return r.data_prevista > new Date().toISOString().slice(0, 10) &&
      r.data_prevista <= limite.toISOString().slice(0, 10);
  };

  const grupos = {
    atrasadas: pendentes.filter((r) => estaAtrasada(r.data_prevista)),
    hoje: pendentes.filter((r) => ehHoje(r.data_prevista)),
    proximas: pendentes.filter(emSeteDias),
    todas: revisoes ?? [],
  };

  const infoAssunto = (id: string) => {
    const assunto = assuntos?.find((a) => a.id === id);
    const disciplina = disciplinas?.find((d) => d.id === assunto?.disciplina_id);
    return { assunto: assunto?.nome ?? "Assunto", disciplina: disciplina?.nome ?? "" };
  };

  function Lista({ itens }: { itens: Revisao[] }) {
    if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
    if (itens.length === 0) {
      return (
        <EstadoVazio
          titulo="Nada por aqui"
          descricao="As revisões aparecem automaticamente quando você conclui sessões de estudo."
        />
      );
    }
    return (
      <ul className="space-y-2">
        {itens.map((r) => {
          const info = infoAssunto(r.assunto_id);
          const atrasada = r.status === "pendente" && estaAtrasada(r.data_prevista);
          return (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{info.assunto}</p>
                <p className="text-xs text-muted-foreground">
                  {info.disciplina} · prevista para {formatarData(r.data_prevista)} ·{" "}
                  {r.indice_intervalo + 1}ª revisão
                </p>
              </div>
              {r.status === "feita" && <Badge variant="secondary">Feita</Badge>}
              {r.status === "cancelada" && <Badge variant="outline">Cancelada</Badge>}
              {atrasada && (
                <Badge className="bg-warning text-warning-foreground">Atrasada</Badge>
              )}
              {r.status === "pendente" && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => {
                      const assunto = assuntos?.find((a) => a.id === r.assunto_id);
                      navigate({
                        to: "/cronometro",
                        search: {
                          disciplina: assunto?.disciplina_id,
                          assunto: r.assunto_id,
                          tipo: "revisao",
                        },
                      });
                    }}
                  >
                    <Play className="mr-1 size-3" /> Revisar agora
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Marcar como feita"
                    onClick={() => {
                      acao.mutate({
                        id: r.id,
                        patch: {
                          status: "feita",
                          data_concluida: new Date().toISOString().slice(0, 10),
                        },
                      });
                      toast.success("Revisão concluída");
                    }}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Adiar um dia"
                    onClick={() => {
                      const d = new Date(`${r.data_prevista}T12:00:00`);
                      d.setDate(d.getDate() + 1);
                      acao.mutate({
                        id: r.id,
                        patch: { data_prevista: d.toISOString().slice(0, 10) },
                      });
                    }}
                  >
                    <CalendarClock className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Cancelar revisão"
                    onClick={() => acao.mutate({ id: r.id, patch: { status: "cancelada" } })}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        titulo="Revisões"
        descricao="Repetição espaçada ajustada ao seu desempenho em questões."
      />
      <Tabs defaultValue="hoje">
        <TabsList>
          <TabsTrigger value="atrasadas">Atrasadas ({grupos.atrasadas.length})</TabsTrigger>
          <TabsTrigger value="hoje">Hoje ({grupos.hoje.length})</TabsTrigger>
          <TabsTrigger value="proximas">Próximos 7 dias ({grupos.proximas.length})</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
        <TabsContent value="atrasadas" className="pt-4">
          <Lista itens={grupos.atrasadas} />
        </TabsContent>
        <TabsContent value="hoje" className="pt-4">
          <Lista itens={grupos.hoje} />
        </TabsContent>
        <TabsContent value="proximas" className="pt-4">
          <Lista itens={grupos.proximas} />
        </TabsContent>
        <TabsContent value="todas" className="pt-4">
          <Lista itens={grupos.todas} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
