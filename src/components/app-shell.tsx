import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, Moon, Search, Sun, User } from "lucide-react";

import { AppSidebar, NAV_ITENS } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useConcursoAtivo } from "@/hooks/useConcursoAtivo";
import { useTema } from "@/hooks/useTema";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function BottomNav() {
  const caminho = useRouterState({ select: (r) => r.location.pathname });
  const principais = NAV_ITENS.slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card/95 backdrop-blur md:hidden">
      {principais.map((item) => (
        <Link
          key={item.url}
          to={item.url}
          className={cn(
            "flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground",
            caminho === item.url && "text-primary",
          )}
        >
          <item.icon className="size-5" />
          <span className="truncate px-1">{item.title.split(" ")[0]}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children?: ReactNode }) {
  const { concursos, concursoId, selecionar } = useConcursoAtivo();
  const { tema, alternar } = useTema();
  const [buscaAberta, setBuscaAberta] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setBuscaAberta((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/90 px-3 backdrop-blur">
            <SidebarTrigger />
            {concursos.length > 0 && (
              <Select value={concursoId ?? undefined} onValueChange={selecionar}>
                <SelectTrigger className="h-9 w-[180px] sm:w-[260px]" aria-label="Concurso ativo">
                  <SelectValue placeholder="Concurso ativo" />
                </SelectTrigger>
                <SelectContent>
                  {concursos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBuscaAberta(true)}
                className="gap-2 text-muted-foreground"
              >
                <Search className="size-4" />
                <span className="hidden sm:inline">Buscar</span>
                <kbd className="hidden rounded border bg-muted px-1.5 text-[10px] sm:inline">⌘K</kbd>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={alternar}
                aria-label="Alternar tema"
              >
                {tema === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Sua conta">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        <User className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate({ to: "/configuracoes" })}>
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate({ to: "/auth" });
                    }}
                  >
                    <LogOut className="mr-2 size-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 pb-20 md:pb-8">{children ?? <Outlet />}</main>
        </div>
      </div>
      <BottomNav />
      <CommandDialog open={buscaAberta} onOpenChange={setBuscaAberta}>
        <CommandInput placeholder="Ir para..." />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Navegar">
            {NAV_ITENS.map((item) => (
              <CommandItem
                key={item.url}
                value={item.title}
                onSelect={() => {
                  setBuscaAberta(false);
                  navigate({ to: item.url });
                }}
              >
                <item.icon className="mr-2 size-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Ações">
            <CommandItem
              value="Iniciar cronômetro"
              onSelect={() => {
                setBuscaAberta(false);
                navigate({ to: "/cronometro" });
              }}
            >
              Iniciar cronômetro
            </CommandItem>
            <CommandItem
              value="Novo concurso"
              onSelect={() => {
                setBuscaAberta(false);
                navigate({ to: "/onboarding" });
              }}
            >
              Cadastrar concurso
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
}
