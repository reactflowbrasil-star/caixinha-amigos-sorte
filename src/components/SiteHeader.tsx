import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationBell } from "@/components/NotificationBell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PiggyBank, LogOut, Shield, Menu, LayoutDashboard, User, ListOrdered, HelpCircle } from "lucide-react";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (to: string) => { setOpen(false); navigate({ to: to as any }); };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between gap-2 px-3 sm:px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-base sm:text-lg min-w-0">
          <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow shrink-0">
            <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="truncate">
            Caixinha <span className="text-gradient hidden xs:inline">Eldorado</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin" })}>
                  <Shield className="h-4 w-4 mr-1" /> Admin
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>Painel</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/perfil" })}>Perfil</Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth" })}>Entrar</Button>
              <Button size="sm" className="bg-gradient-hero text-primary-foreground shadow-elegant hover:opacity-95" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as any })}>
                Participar
              </Button>
            </>
          )}
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-1">
          {user && <NotificationBell />}
          {user ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="p-4 border-b">
                  <p className="text-xs text-muted-foreground">Conectado como</p>
                  <p className="font-semibold truncate">{user.email}</p>
                </div>
                <nav className="p-2 flex flex-col">
                  {isAdmin && (
                    <button onClick={() => go("/admin")} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted text-left">
                      <Shield className="h-4 w-4 text-primary" /> Admin
                    </button>
                  )}
                  <button onClick={() => go("/dashboard")} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted text-left">
                    <LayoutDashboard className="h-4 w-4 text-primary" /> Painel
                  </button>
                  <button onClick={() => go("/perfil")} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted text-left">
                    <User className="h-4 w-4 text-primary" /> Meu perfil
                  </button>
                  <button onClick={() => go("/fila")} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted text-left">
                    <ListOrdered className="h-4 w-4 text-primary" /> Fila
                  </button>
                  <button onClick={() => go("/suporte")} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted text-left">
                    <HelpCircle className="h-4 w-4 text-primary" /> Suporte
                  </button>
                </nav>
                <div className="p-3 border-t mt-auto">
                  <Button variant="outline" className="w-full" onClick={async () => { setOpen(false); await signOut(); navigate({ to: "/" }); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth" })}>Entrar</Button>
              <Button size="sm" className="bg-gradient-hero text-primary-foreground" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as any })}>
                Entrar
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
