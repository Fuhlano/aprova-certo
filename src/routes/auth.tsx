import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no Aprova" },
      { name: "description", content: "Acesse sua conta para continuar seus estudos no Aprova." },
      { property: "og:title", content: "Entrar no Aprova" },
      { property: "og:description", content: "Acesse sua conta do Aprova." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const esquemaLogin = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

const esquemaCadastro = esquemaLogin.extend({
  nome: z.string().trim().min(2, "Informe seu nome").max(80, "Nome muito longo"),
});

const esquemaMagico = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
});

function AuthPage() {
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const formLogin = useForm<z.infer<typeof esquemaLogin>>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { email: "", senha: "" },
  });
  const formCadastro = useForm<z.infer<typeof esquemaCadastro>>({
    resolver: zodResolver(esquemaCadastro),
    defaultValues: { nome: "", email: "", senha: "" },
  });
  const formMagico = useForm<z.infer<typeof esquemaMagico>>({
    resolver: zodResolver(esquemaMagico),
    defaultValues: { email: "" },
  });

  async function entrar(valores: z.infer<typeof esquemaLogin>) {
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: valores.email,
      password: valores.senha,
    });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: "Verifique e-mail e senha." });
      return;
    }
    toast.success("Bem-vindo de volta!");
  }

  async function cadastrar(valores: z.infer<typeof esquemaCadastro>) {
    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email: valores.email,
      password: valores.senha,
      options: {
        data: { nome: valores.nome },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }
    if (!data.session) {
      toast.success("Confira seu e-mail", {
        description: "Enviamos um link para confirmar seu cadastro.",
      });
    }
  }

  async function linkMagico(valores: z.infer<typeof esquemaMagico>) {
    setEnviando(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: valores.email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível enviar o link", { description: error.message });
      return;
    }
    toast.success("Link enviado", { description: "Confira sua caixa de entrada." });
  }

  async function entrarComGoogle() {
    const resultado = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (resultado.error) {
      toast.error("Não foi possível entrar com o Google");
      return;
    }
    if (resultado.redirected) return;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">
            A
          </span>
          <span className="text-xl font-semibold tracking-tight">Aprova</span>
        </Link>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Acesse sua conta</CardTitle>
            <CardDescription>Seus estudos, organizados de ponta a ponta.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={entrarComGoogle}>
              Continuar com Google
            </Button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
            </div>
            <Tabs defaultValue="entrar">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="criar">Criar conta</TabsTrigger>
                <TabsTrigger value="link">Link</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar" className="pt-4">
                <Form {...formLogin}>
                  <form onSubmit={formLogin.handleSubmit(entrar)} className="space-y-4">
                    <FormField
                      control={formLogin.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="voce@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={formLogin.control}
                      name="senha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={enviando}>
                      Entrar
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="criar" className="pt-4">
                <Form {...formCadastro}>
                  <form onSubmit={formCadastro.handleSubmit(cadastrar)} className="space-y-4">
                    <FormField
                      control={formCadastro.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={formCadastro.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="voce@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={formCadastro.control}
                      name="senha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={enviando}>
                      Criar conta
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="link" className="pt-4">
                <Form {...formMagico}>
                  <form onSubmit={formMagico.handleSubmit(linkMagico)} className="space-y-4">
                    <FormField
                      control={formMagico.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="voce@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={enviando}>
                      Enviar link de acesso
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
