import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { Crown, ListOrdered, Loader2 } from "lucide-react";

export const Route = createFileRoute("/fila")({
  component: FilaPublica,
});

interface Item {
  id: string;
  full_name: string;
  receive_position: number | null;
  has_received: boolean;
  is_active: boolean;
  is_banned: boolean;
}

function FilaPublica() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("fila-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []);

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, receive_position, has_received, is_active, is_banned")
      .eq("is_active", true).eq("is_banned", false)
      .order("receive_position", { ascending: true, nullsFirst: false });
    setItems((data as Item[]) || []);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <ListOrdered className="h-6 w-6 text-primary" /> Fila de recebimento
            </h1>
            <p className="text-sm text-muted-foreground">Em tempo real. Quem já recebeu sai automaticamente.</p>
          </div>
          <Link to="/dashboard" className="text-sm text-primary hover:underline">← Voltar</Link>
        </div>

        <Card className="divide-y">
          {items.map((p, i) => {
            const me = user?.id === p.id;
            return (
              <div key={p.id} className={`flex items-center justify-between p-3 ${me ? "bg-primary/5" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`grid place-items-center h-10 w-10 rounded-xl font-extrabold ${i === 0 ? "bg-secondary text-secondary-foreground" : "bg-muted"}`}>
                    {i === 0 ? <Crown className="h-5 w-5" /> : i + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{p.full_name} {me && <Badge variant="outline" className="ml-1">você</Badge>}</p>
                    <p className="text-xs text-muted-foreground">{i === 0 ? "Próximo a receber" : `Posição ${i + 1}`}</p>
                  </div>
                </div>
                {p.has_received && <Badge variant="secondary">Já recebeu</Badge>}
              </div>
            );
          })}
          {items.length === 0 && <p className="text-center py-10 text-muted-foreground">Fila ainda vazia.</p>}
        </Card>
      </main>
    </div>
  );
}
