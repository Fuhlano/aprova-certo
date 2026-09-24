import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  RefreshCcw,
  Repeat,
  Settings,
  Timer,
  FileText,
  TrendingUp,
  ClipboardList,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export const NAV_ITENS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Ciclo de Estudos", url: "/ciclo", icon: Repeat },
  { title: "Cronômetro", url: "/cronometro", icon: Timer },
  { title: "Revisões", url: "/revisoes", icon: RefreshCcw },
  { title: "Edital", url: "/edital", icon: FileText },
  { title: "Desempenho", url: "/desempenho", icon: TrendingUp },
  { title: "Simulados", url: "/simulados", icon: ClipboardList },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const recolhida = state === "collapsed";
  const caminho = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">
            A
          </span>
          {!recolhida && <span className="text-lg font-semibold tracking-tight">Aprova</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Estudos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITENS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={caminho === item.url} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      {!recolhida && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
