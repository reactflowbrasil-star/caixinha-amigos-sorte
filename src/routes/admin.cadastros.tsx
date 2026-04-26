import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Ban, CheckCircle2, FileDown } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cadastros")({
  component: Cadastros,
});

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  cpf: string | null;
  invite_code: string;
  is_active: boolean;
  is_banned: boolean;
  has_received: boolean;
  receive_position: number | null;
  created_at: string;
}

function Cadastros() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState("");
  const [banDialog, setBanDialog] = useState<Profile | null>(null);
  const [banReason, setBanReason] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers((data as Profile[]) || []);
  }

  const filtered = users.filter((u) => {
    const t = filter.toLowerCase();
    return !t || u.full_name.toLowerCase().includes(t) || (u.phone || "").includes(t) || (u.cpf || "").includes(t);
  });

  async function toggleBan(u: Profile) {
    if (u.is_banned) {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: false, banned_at: null, banned_reason: null, is_active: true })
        .eq("id", u.id);
      if (error) return toast.error(error.message);
      toast.success(`${u.full_name} desbanido`);
      void load();
    } else {
      setBanDialog(u);
    }
  }

  async function confirmBan() {
    if (!banDialog) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: banReason || null,
        is_active: false,
      })
      .eq("id", banDialog.id);
    if (error) return toast.error(error.message);
    toast.success(`${banDialog.full_name} banido`);
    setBanDialog(null);
    setBanReason("");
    void load();
  }

  function exportCSV() {
    const rows = filtered.map((u) => ({
      nome: u.full_name,
      telefone: u.phone || "",
      cpf: u.cpf || "",
      ativo: u.is_active ? "sim" : "não",
      banido: u.is_banned ? "sim" : "não",
      recebeu: u.has_received ? "sim" : "não",
      posicao: u.receive_position ?? "",
      cadastrado_em: new Date(u.created_at).toLocaleString("pt-BR"),
      codigo_convite: u.invite_code,
    }));
    downloadCSV(rows, `cadastros-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Cadastros</h1>
          <p className="text-sm text-muted-foreground">{users.length} participantes no histórico.</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nome, telefone ou CPF..."
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Posição</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.cpf || "—"}</td>
                <td className="px-4 py-3">
                  {u.is_banned ? (
                    <Badge variant="destructive">Banido</Badge>
                  ) : u.is_active ? (
                    <Badge className="bg-primary">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                  {u.has_received && <Badge variant="outline" className="ml-1">Já recebeu</Badge>}
                </td>
                <td className="px-4 py-3">{u.receive_position ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant={u.is_banned ? "outline" : "ghost"}
                    onClick={() => toggleBan(u)}
                    className={u.is_banned ? "" : "text-destructive hover:text-destructive"}
                  >
                    {u.is_banned ? (<><CheckCircle2 className="h-4 w-4 mr-1" /> Desbanir</>) : (<><Ban className="h-4 w-4 mr-1" /> Banir</>)}
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum cadastro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!banDialog} onOpenChange={(o) => !o && setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir {banDialog?.full_name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            O usuário ficará impedido de participar das próximas rodadas. Você pode desbanir depois.
          </p>
          <Textarea
            placeholder="Motivo (opcional, visível só para admins)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmBan}>Confirmar banimento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
