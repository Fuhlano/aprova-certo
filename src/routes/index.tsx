import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, FileText, Repeat, Timer, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aprova — organize seus estudos para concursos" },
      {
        name: "description",
        content:
          "Transforme o edital em plano de estudos: ciclo automático, cronômetro com pomodoro, revisões programadas e relatórios de desempenho.",
      },
      { property: "og:title", content: "Aprova — organize seus estudos para concursos" },
      {
        property: "og:description",
        content:
          "Edital verticalizado, ciclo de estudos, cronômetro, revisões espaçadas e estatísticas do que mais cai.",
      },
    ],
  }),
  component: Landing,
});

const RECURSOS = [
  { icon: FileText, titulo: "Edital estruturado", texto: "Cole ou envie o edital e vire disciplinas e assuntos em minutos." },
  { icon: Repeat, titulo: "Ciclo de estudos", texto: "Blocos distribuídos por peso, incidência e seus pontos fracos." },
  { icon: Timer, titulo: "Cronômetro e pomodoro", texto: "Tempo preciso, continua certo mesmo se você fechar o navegador." },
  { icon: CalendarCheck, titulo: "Revisões na hora certa", texto: "Repetição espaçada em 1, 7, 15, 30 e 60 dias, ajustada ao seu acerto." },
  { icon: TrendingUp, titulo: "O que mais cai", texto: "Prioridades por incidência × desempenho para estudar o que importa." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">
            A
          </span>
          <span className="text-xl font-semibold tracking-tight">Aprova</span>
        </div>
        <Button asChild variant="ghost">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        <section className="py-14 sm:py-24">
          <p className="mb-4 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-foreground">
            Feito para concurseiros
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Do edital à aprovação, com método e sem planilha.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            O Aprova organiza seu edital, monta o ciclo de estudos, cronometra suas sessões, agenda
            revisões e mostra exatamente onde você precisa melhorar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Começar agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r) => (
            <Card key={r.titulo} className="rounded-2xl shadow-none">
              <CardContent className="pt-6">
                <r.icon className="size-6 text-primary" />
                <h2 className="mt-4 font-semibold">{r.titulo}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{r.texto}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
