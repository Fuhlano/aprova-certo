import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useConcursoAtivo } from "@/hooks/useConcursoAtivo";
import { usePerfil } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatarData } from "@/lib/format";
import { INTERVALOS_PADRAO } from "@/lib/revisoes";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: Configuracoes,
});

function Configuracoes() {
  const { data: perfil } = usePerfil();
  const { concursos } = useConcursoAtivo();
  const qc = useQueryClient();

  const [nome, setNome] = useState("");
  const [meta, setMeta] = useState("20");
  const [intervalos, setIntervalos] = useState(INTERVALOS_PADRAO.join(", "));

  useEffect(() => {
    if (!perfil) return;
    setNome(perfil.nome ?? "");
    setMeta(String(perfil.meta_horas_semanais ?? 20));
    setIntervalos((perfil.intervalos_revisao ?? INTERVALOS_PADRAO).join(", "));
  }, [perfil]);

  const salvar = useMutation({
    mutationFn: async () => {
      const lista = intervalos
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (lista.length === 0) throw new Error("Informe ao menos um intervalo de revisão");
      const { data: usuario } = await supabase.auth.getUser();
      if (!usuario.user) throw new Error("Sessão expirada");
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: nome.trim() || null,
          meta_horas_semanais: Number(meta) || 20,
          intervalos_revisao: lista,
        })
        .eq("id", usuario.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["perfil"] });
    },
    onError: (e) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  const excluirConcurso = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("concursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Concurso excluído");
      localStorage.removeItem("aprova:concurso");
      qc.invalidateQueries();
    },
  });

  return (
    <PageContainer>
      <PageHeader titulo="Configurações" descricao="Perfil, metas e revisões." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Seu perfil e metas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                maxLength={80}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="meta">Meta de horas por semana</Label>
              <Input
                id="meta"
                type="number"
                min={1}
                max={80}
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="intervalos">Intervalos de revisão (dias)</Label>
              <Input
                id="intervalos"
                value={intervalos}
                onChange={(e) => setIntervalos(e.target.value)}
                placeholder="1, 7, 15, 30, 60"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Separe por vírgula. Ajustamos automaticamente conforme seu acerto em questões.
              </p>
            </div>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              Salvar
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Seus concursos</CardTitle>
            <CardDescription>Troque o concurso ativo no topo da tela.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {concursos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum concurso cadastrado ainda.</p>
            )}
            {concursos.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {[c.banca, c.cargo].filter(Boolean).join(" · ")}
                    {c.data_prova ? ` · prova em ${formatarData(c.data_prova)}` : ""}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir {c.nome}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Todas as disciplinas, assuntos, ciclos e revisões deste concurso serão
                        apagados. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => excluirConcurso.mutate(c.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link to="/onboarding">Cadastrar novo concurso</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
