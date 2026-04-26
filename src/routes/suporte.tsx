import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/SiteHeader";
import { LifeBuoy, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/suporte")({
  component: Suporte,
});

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

function Suporte() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState({ subject: "", description: "", priority: "normal" });
  const [msgToAdmin, setMsgToAdmin] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { if (user) void load(); }, [user]);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("support_tickets").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTickets((data as Ticket[]) || []);
  }

  async function openTicket() {
    if (!user) return;
    if (!form.subject.trim() || !form.description.trim()) return toast.error("Preencha tudo");
    setSending(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id, subject: form.subject, description: form.description, priority: form.priority as any,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Chamado aberto! Em breve responderemos.");
    setForm({ subject: "", description: "", priority: "normal" });
    void load();
  }

  async function sendToAdmin() {
    if (!user || !msgToAdmin.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      from_user_id: user.id, to_admins: true, body: msgToAdmin,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Mensagem enviada aos admins");
    setMsgToAdmin("");
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Suporte</h1>
            <p className="text-sm text-muted-foreground">Tire dúvidas ou abra um chamado.</p>
          </div>
          <Link to="/dashboard" className="text-sm text-primary hover:underline">← Voltar ao painel</Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5 space-y-3">
            <h2 className="font-bold flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> Mensagem rápida ao admin</h2>
            <Textarea
              value={msgToAdmin} onChange={(e) => setMsgToAdmin(e.target.value)}
              rows={4} maxLength={500} placeholder="Olá, gostaria de..."
            />
            <Button onClick={sendToAdmin} disabled={sending || !msgToAdmin.trim()} className="bg-primary w-full">
              <Send className="mr-2 h-4 w-4" /> Enviar
            </Button>
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="font-bold flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-primary" /> Abrir chamado</h2>
            <div>
              <Label>Assunto</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} maxLength={1000} />
            </div>
            <Button onClick={openTicket} disabled={sending} className="bg-gradient-hero text-primary-foreground w-full">
              Abrir chamado
            </Button>
          </Card>
        </div>

        <Card className="p-5 mt-4">
          <h2 className="font-bold mb-3">Meus chamados</h2>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Você não abriu chamados.</p>
          ) : (
            <div className="divide-y">
              {tickets.map((t) => (
                <div key={t.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{t.subject}</p>
                    <Badge variant={t.status === "closed" ? "secondary" : t.status === "in_progress" ? "default" : "outline"} className={t.status === "in_progress" ? "bg-primary" : ""}>
                      {t.status === "closed" ? "Fechado" : t.status === "in_progress" ? "Em atendimento" : "Aberto"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(t.created_at).toLocaleString("pt-BR")} • prioridade {t.priority}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
