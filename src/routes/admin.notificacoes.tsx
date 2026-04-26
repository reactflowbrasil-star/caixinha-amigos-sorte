import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Megaphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notificacoes")({
  component: Notificacoes,
});

interface Profile { id: string; full_name: string }
interface Notif {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  type: string;
  created_at: string;
}

function Notificacoes() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [history, setHistory] = useState<Notif[]>([]);
  const [form, setForm] = useState({ title: "", body: "", type: "info", target: "all" });
  const [sending, setSending] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    const [{ data: profs }, { data: notifs }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").order("full_name"),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setUsers((profs as Profile[]) || []);
    setHistory((notifs as Notif[]) || []);
  }

  async function send() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }
    setSending(true);
    try {
      if (form.target === "all") {
        const { error } = await supabase.from("notifications").insert({
          title: form.title,
          body: form.body,
          type: form.type,
          user_id: null,
          created_by: user?.id,
        });
        if (error) throw error;
        toast.success("Aviso enviado para todos os usuários");
      } else {
        const { error } = await supabase.from("notifications").insert({
          title: form.title,
          body: form.body,
          type: form.type,
          user_id: form.target,
          created_by: user?.id,
        });
        if (error) throw error;
        toast.success("Aviso enviado");
      }
      setForm({ title: "", body: "", type: "info", target: "all" });
      void load();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Notificações</h1>
        <p className="text-sm text-muted-foreground">Envie alertas in-app para usuários (com toast em tempo real).</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5 space-y-3">
          <h2 className="font-bold flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Nova mensagem</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Destinatário</Label>
              <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📢 Todos os usuários (broadcast)</SelectItem>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="alert">Alerta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} placeholder="Lembrete de contribuição" />
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={500} rows={4} placeholder="Não esqueça do Pix de hoje! 💚" />
          </div>
          <Button onClick={send} disabled={sending} className="bg-gradient-hero text-primary-foreground">
            <Send className="mr-2 h-4 w-4" /> {sending ? "Enviando..." : "Enviar"}
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold mb-3">Histórico</h2>
          <div className="space-y-2 max-h-[460px] overflow-y-auto">
            {history.map((h) => (
              <div key={h.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{h.title}</p>
                  <Badge variant="outline" className="text-[10px]">{h.user_id ? "individual" : "todos"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{h.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(h.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
            {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma ainda.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
