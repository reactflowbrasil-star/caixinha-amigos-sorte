import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationBell } from "@/components/NotificationBell";
import { PiggyBank, LogOut, Shield } from "lucide-react";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow">
            <PiggyBank className="h-5 w-5" />
          </span>
          <span>
            Caixinha <span className="text-gradient">Eldorado</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin" })}>
                  <Shield className="h-4 w-4 mr-1" /> Admin
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                Painel
              </Button>
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
      </div>
    </header>
  );
}
