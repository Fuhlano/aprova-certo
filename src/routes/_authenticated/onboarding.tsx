import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileUp, Loader2 } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/page-header";
import { EditalArvore } from "@/components/edital-arvore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extrairTextoDePdf, parseEdital, type DisciplinaParseada } from "@/lib/edital-parser";
import { salvarEstruturaEdital } from "@/lib/edital-service";
import { gerarCiclo } from "@/lib/ciclo-service";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const PASSOS = ["Concurso", "Edital", "Revisar", "Carga horária"];

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [passo, setPasso] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [lendoPdf, setLendoPdf] = useState(false);

  const [dados, setDados] = useState({
    nome: "",
    banca: "",
    orgao: "",
    cargo: "",
    data_prova: "",
  });
  const [texto, setTexto] = useState("");
  const [estrutura, setEstrutura] = useState<DisciplinaParseada[]>([]);
  const [carga, setCarga] = useState(20);
  const [bloco, setBloco] = useState(50);

  async function lerPdf(arquivo: File) {
    setLendoPdf(true);
    try {
      const extraido = await extrairTextoDePdf(arquivo);
      setTexto(extraido);
      toast.success("PDF lido", { description: "Confira o texto extraído abaixo." });
    } catch {
      toast.error("Não conseguimos ler este PDF", {
        description: "Tente copiar e colar o conteúdo programático.",
      });
    } finally {
      setLendoPdf(false);
    }
  }

  function analisar() {
    const resultado = parseEdital(texto);
    if (resultado.length === 0) {
      toast.error("Não identificamos disciplinas", {
        description: "Confira se o texto contém o conteúdo programático.",
      });
      return;
    }
    setEstrutura(resultado);
    setPasso(2);
  }

  function adicionarDisciplinaManual() {
    setEstrutura((atual) => [
      ...atual,
      { nome: "Nova disciplina", peso: 3, ativa: true, assuntos: [] },
    ]);
  }

  async function finalizar() {
    if (!dados.nome.trim()) {
      toast.error("Informe o nome do concurso");
      setPasso(0);
      return;
    }
    setSalvando(true);
    try {
      const { data: concurso, error } = await supabase
        .from("concursos")
        .insert({
          nome: dados.nome.trim(),
          banca: dados.banca.trim() || null,
          orgao: dados.orgao.trim() || null,
          cargo: dados.cargo.trim() || null,
          data_prova: dados.data_prova || null,
          edital_texto: texto || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (estrutura.length > 0) {
        await salvarEstruturaEdital(concurso.id, estrutura);
        await gerarCiclo({
          concursoId: concurso.id,
          cargaSemanalHoras: carga,
          duracaoBlocoMin: bloco,
        }).catch(() => null);
      }

      await supabase.from("profiles").update({ meta_horas_semanais: carga }).neq("id", "");
      localStorage.setItem("aprova:concurso", concurso.id);
      qc.invalidateQueries();
      toast.success("Tudo pronto!", { description: "Seu plano de estudos foi criado." });
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error("Não foi possível salvar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        titulo="Cadastrar concurso"
        descricao={`Passo ${passo + 1} de 4 — ${PASSOS[passo]}`}
      />
      <Progress value={((passo + 1) / 4) * 100} className="mb-6" />

      {passo === 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Dados do concurso</CardTitle>
            <CardDescription>Só o nome é obrigatório; o resto ajuda nos relatórios.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nome">Nome do concurso</Label>
              <Input
                id="nome"
                value={dados.nome}
                maxLength={120}
                onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                placeholder="Ex.: Polícia Federal — Agente"
              />
            </div>
            <div>
              <Label htmlFor="banca">Banca</Label>
              <Input
                id="banca"
                value={dados.banca}
                maxLength={60}
                onChange={(e) => setDados({ ...dados, banca: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="orgao">Órgão</Label>
              <Input
                id="orgao"
                value={dados.orgao}
                maxLength={60}
                onChange={(e) => setDados({ ...dados, orgao: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={dados.cargo}
                maxLength={60}
                onChange={(e) => setDados({ ...dados, cargo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="data">Data da prova</Label>
              <Input
                id="data"
                type="date"
                value={dados.data_prova}
                onChange={(e) => setDados({ ...dados, data_prova: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button onClick={() => setPasso(1)} disabled={!dados.nome.trim()}>
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {passo === 1 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Importar edital</CardTitle>
            <CardDescription>
              Cole o conteúdo programático, envie o PDF do edital ou monte manualmente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="colar">
              <TabsList>
                <TabsTrigger value="colar">Colar texto</TabsTrigger>
                <TabsTrigger value="pdf">Enviar PDF</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
              <TabsContent value="colar" className="pt-4">
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={14}
                  placeholder={"CONHECIMENTOS BÁSICOS\nLÍNGUA PORTUGUESA\n1. Interpretação de texto; ortografia; crase.\n2. Concordância verbal e nominal."}
                />
              </TabsContent>
              <TabsContent value="pdf" className="pt-4">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  {lendoPdf ? (
                    <Loader2 className="size-6 animate-spin text-primary" />
                  ) : (
                    <FileUp className="size-6 text-primary" />
                  )}
                  <span>Clique para escolher o PDF do edital</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const arquivo = e.target.files?.[0];
                      if (arquivo) lerPdf(arquivo);
                    }}
                  />
                </label>
                {texto && (
                  <Textarea
                    className="mt-4"
                    rows={10}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                  />
                )}
              </TabsContent>
              <TabsContent value="manual" className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Você pode seguir sem texto e cadastrar disciplinas e assuntos na próxima etapa.
                </p>
              </TabsContent>
            </Tabs>
            <div className="mt-6 flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setPasso(0)}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEstrutura([]);
                    setPasso(2);
                  }}
                >
                  Montar manualmente
                </Button>
                <Button onClick={analisar} disabled={!texto.trim()}>
                  Estruturar edital
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {passo === 2 && (
        <div>
          <Card className="mb-4 rounded-2xl border-primary/30 bg-accent-soft">
            <CardContent className="pt-6 text-sm">
              Confira o que identificamos no edital. Desmarque o que não vai estudar, ajuste nomes,
              defina o peso de cada disciplina e marque quais entram no ciclo.
            </CardContent>
          </Card>
          <EditalArvore disciplinas={estrutura} onChange={setEstrutura} />
          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <Button variant="ghost" onClick={() => setPasso(1)}>
              Voltar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={adicionarDisciplinaManual}>
                Adicionar disciplina
              </Button>
              <Button onClick={() => setPasso(3)}>Continuar</Button>
            </div>
          </div>
        </div>
      )}

      {passo === 3 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Carga horária semanal</CardTitle>
            <CardDescription>Usamos isso para distribuir os blocos do seu ciclo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
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
                      {m} minutos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex justify-between">
              <Button variant="ghost" onClick={() => setPasso(2)}>
                Voltar
              </Button>
              <Button onClick={finalizar} disabled={salvando}>
                {salvando && <Loader2 className="mr-2 size-4 animate-spin" />}
                Criar meu plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
