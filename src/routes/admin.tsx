import { Link, useLocation, Outlet, useNavigate, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import {
  LayoutDashboard, Users, ListOrdered, CheckCircle2, Bell as BellIcon,
  Settings, FileDown, LogOut, PiggyBank, Loader2, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: any; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/cadastros", label: "Cadastros", icon: Users },
  { to: "/admin/fila", label: "Fila / Posições", icon: ListOrdered },
  { to: "/admin/pagamentos", label: "Pagamentos", icon: CheckCircle2 },
  { to: "/admin/notificacoes", label: "Notificações", icon: BellIcon },
  { to: "/admin/relatorios", label: "Relatórios", icon: FileDown },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

function AdminLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!roleLoading && user && !isAdmin) navigate({ to: "/dashboard" });
  }, [roleLoading, isAdmin, user, navigate]);

  if (authLoading || roleLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <SidebarDesktop />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 backdrop-blur px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContents />
            </SheetContent>
          </Sheet>
          <p className="font-display font-bold text-sm sm:text-base truncate">Painel Admin</p>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <NotificationBell />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate({ to: "/dashboard" })}>
              Meu painel
            </Button>
            <Button variant="outline" size="icon" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarDesktop() {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <SidebarContents />
    </aside>
  );
}

function SidebarContents() {
  const loc = useLocation();
  return (
    <>
      <Link to="/" className="flex items-center gap-2 p-4 border-b font-display font-extrabold">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground">
          <PiggyBank className="h-5 w-5" />
        </span>
        Caixinha
      </Link>
      <nav className="flex-1 p-2 space-y-1">
        {NAV.map((n) => {
          const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to as any}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t text-[10px] text-muted-foreground">
        Modo administrador • use com responsabilidade
      </div>
    </>
  );
}
