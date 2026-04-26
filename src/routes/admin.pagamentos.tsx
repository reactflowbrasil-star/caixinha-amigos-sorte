import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, FileDown, Clock } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pagamentos")({
  component: Pagamentos,
});

interface Contribution {
  id: string;
  user_id: string;
  amount: number;
  contribution_date: string;
  status: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  profiles?: { full_name: string; phone: string | null } | null;
}

function Pagamentos() {
  const { user } = useAuth();
  const [items, setItems] = useState<Contribution[]>([]);
  const [tab, setTab] = useState<"pending" | "confirmed" | "rejected">("pending");

  useEffect(() => { void load(); }, []);

  async function load() {
    const [{ data: contribs }, { data: profs }] = await Promise.all([
      supabase.from("contributions").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("profiles").select("id, full_name, phone"),
    ]);
    const map = new Map((profs || []).map((p: any) => [p.id, p]));
    const merged = ((contribs as Contribution[]) || []).map((c) => ({
      ...c,
      profiles: map.get(c.user_id) || null,
    }));
    setItems(merged);
  }

  async function setStatus(c: Contribution, status: "confirmed" | "rejected" | "pending") {
    const patch: any = { status };
    if (status === "confirmed") {
      patch.confirmed_at = new Date().toISOString();
      patch.confirmed_by = user?.id;
    } else {
      patch.confirmed_at = null;
      patch.confirmed_by = null;
    }
    const { error } = await supabase.from("contributions").update(patch).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(
      status === "confirmed" ? "Pagamento confirmado" :
      status === "rejected" ? "Pagamento cancelado" : "Voltado para pendente"
    );
    void load();
  }

  function exportCSV() {
    const rows = items
      .filter((i) => i.status === tab)
      .map((c) => ({
        usuario: c.profiles?.full_name || c.user_id,
        telefone: c.profiles?.phone || "",
        data: c.contribution_date,
        valor: Number(c.amount).toFixed(2),
        status: c.status,
        metodo: c.payment_method,
        criado_em: new Date(c.created_at).toLocaleString("pt-BR"),
        confirmado_em: c.confirmed_at ? new Date(c.confirmed_at).toLocaleString("pt-BR") : "",
      }));
    downloadCSV(rows, `pagamentos-${tab}-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const filtered = items.filter((c) => c.status === tab);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Pagamentos</h1>
          <p className="text-sm text-muted-foreground">Confirme, cancele ou reverta contribuições.</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <FileDown className="mr-2 h-4 w-4" /> Exportar {tab}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes <Badge variant="secondary" className="ml-2">{items.filter(i => i.status === "pending").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmados <Badge className="ml-2 bg-primary">{items.filter(i => i.status === "confirmed").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Cancelados <Badge variant="destructive" className="ml-2">{items.filter(i => i.status === "rejected").length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.profiles?.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{c.profiles?.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(c.contribution_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-semibold">R$ {Number(c.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.payment_method}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {c.status !== "confirmed" && (
                        <Button size="sm" variant="ghost" onClick={() => setStatus(c, "confirmed")} className="text-primary">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar
                        </Button>
                      )}
                      {c.status !== "rejected" && (
                        <Button size="sm" variant="ghost" onClick={() => setStatus(c, "rejected")} className="text-destructive">
                          <XCircle className="h-4 w-4 mr-1" /> Cancelar
                        </Button>
                      )}
                      {c.status !== "pending" && (
                        <Button size="sm" variant="ghost" onClick={() => setStatus(c, "pending")}>
                          <Clock className="h-4 w-4 mr-1" /> Pendente
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nada por aqui.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
