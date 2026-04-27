import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import {
  HandCoins, ListOrdered, Calendar, TrendingUp, Users, Copy, MessageCircle,
  CheckCircle2, Clock, Loader2, Share2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  invite_code: string;
  receive_position: number | null;
  is_active: boolean;
  has_received: boolean;
}

interface Contribution {
  id: string;
  amount: number;
  contribution_date: string;
  status: string;
  created_at: string;
}

// admin WhatsApp number for Pix payment confirmations
const ADMIN_WHATSAPP = "5511999999999"; // alterar no painel admin futuramente
const PIX_KEY = "caixinha@eldorado.com.br";
const DAILY_AMOUNT = 5;

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [invited, setInvited] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const [{ data: prof }, { data: contribs }, { count }, { data: inv }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("contributions").select("*").eq("user_id", user.id).order("contribution_date", { ascending: false }).limit(20),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("profiles").select("*").eq("invited_by", user.id),
    ]);
    setProfile(prof as Profile | null);
    setContributions((contribs as Contribution[]) || []);
    setActiveCount(count || 0);
    setInvited((inv as Profile[]) || []);
    setLoading(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const paidToday = contributions.find((c) => c.contribution_date === today);
  const estimatedReceive = activeCount * DAILY_AMOUNT;

  const inviteUrl = profile
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth?mode=signup&invite=${profile.invite_code}`
    : "";

  async function handlePayViaWhatsApp() {
    if (!user || !profile) return;
    setPaying(true);
    try {
      // Register a pending contribution (or update existing)
      const { error } = await supabase.from("contributions").upsert(
        {
          user_id: user.id,
          contribution_date: today,
          amount: DAILY_AMOUNT,
          status: "pending",
          payment_method: "pix_whatsapp",
        },
        { onConflict: "user_id,contribution_date" }
      );
      if (error) throw error;

      const msg = encodeURIComponent(
        `Olá! Sou ${profile.full_name}.\n\nAcabei de fazer o Pix de R$${DAILY_AMOUNT},00 da Caixinha Eldorado de hoje (${new Date().toLocaleDateString("pt-BR")}).\n\nChave Pix usada: ${PIX_KEY}\n\nSegue o comprovante 👇`
      );
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, "_blank");
      toast.success("Contribuição registrada! Envie o comprovante no WhatsApp.");
      void loadData();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao registrar pagamento");
    } finally {
      setPaying(false);
    }
  }

  function copyInvite() {
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Link de convite copiado!");
  }

  function shareInviteWhatsApp() {
    const text = encodeURIComponent(
      `Vem participar da nossa Caixinha de Amigos Eldorado! 💚\n\nSão só R$5 por dia e quando chega sua vez você recebe o valor da rodada.\n\nCadastra aqui: ${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (authLoading || loading || !profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-5 sm:py-8 md:py-12">
        {/* Boas-vindas */}
        <div className="mb-5 sm:mb-8 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Olá,</p>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold truncate">{profile.full_name} 👋</h1>
          </div>
          <Badge variant={profile.is_active ? "default" : "secondary"} className={profile.is_active ? "bg-primary" : ""}>
            {profile.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {/* Cards principais */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-5 sm:mb-6">
          <Card className="p-5 bg-gradient-hero text-primary-foreground border-0 shadow-elegant">
            <HandCoins className="h-6 w-6 mb-3 opacity-90" />
            <p className="text-xs opacity-80 uppercase tracking-wider font-semibold">Contribuição diária</p>
            <p className="text-3xl font-extrabold mt-1">R$ {DAILY_AMOUNT},00</p>
          </Card>

          <Card className="p-5 bg-gradient-card border-border/60 shadow-card">
            <ListOrdered className="h-6 w-6 mb-3 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sua posição</p>
            <p className="text-3xl font-extrabold mt-1">
              {profile.receive_position ?? "—"}
              {profile.receive_position && <span className="text-base text-muted-foreground font-normal">º</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.receive_position ? "na ordem de recebimento" : "aguardando definição pelo admin"}
            </p>
          </Card>

          <Card className="p-5 bg-gradient-card border-border/60 shadow-card">
            <Users className="h-6 w-6 mb-3 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Participantes ativos</p>
            <p className="text-3xl font-extrabold mt-1">{activeCount}</p>
          </Card>

          <Card className="p-5 bg-secondary/40 border-secondary/60">
            <TrendingUp className="h-6 w-6 mb-3 text-secondary-foreground" />
            <p className="text-xs uppercase tracking-wider font-semibold opacity-80">Estimativa de recebimento</p>
            <p className="text-3xl font-extrabold mt-1">R$ {estimatedReceive},00</p>
            <p className="text-xs opacity-70 mt-1">se todos pagarem hoje</p>
          </Card>
        </div>

        {/* Pagamento + Convites */}
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          <Card className="lg:col-span-2 p-6 border-border/60 shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Contribuição de hoje
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date().toLocaleDateString("pt-BR", { dateStyle: "full" })}
                </p>
              </div>
              {paidToday ? (
                <Badge
                  className={paidToday.status === "confirmed" ? "bg-primary" : ""}
                  variant={paidToday.status === "confirmed" ? "default" : "secondary"}
                >
                  {paidToday.status === "confirmed" ? (
                    <><CheckCircle2 className="mr-1 h-3 w-3" /> Confirmado</>
                  ) : (
                    <><Clock className="mr-1 h-3 w-3" /> Aguardando confirmação</>
                  )}
                </Badge>
              ) : (
                <Badge variant="outline">Pendente</Badge>
              )}
            </div>

            <div className="rounded-xl bg-muted/60 p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-1">Chave Pix</p>
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-sm font-semibold">{PIX_KEY}</code>
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(PIX_KEY); toast.success("Chave Pix copiada"); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handlePayViaWhatsApp}
              disabled={paying || paidToday?.status === "confirmed"}
              className="w-full bg-gradient-hero text-primary-foreground hover:opacity-95 shadow-elegant"
              size="lg"
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><MessageCircle className="mr-2 h-4 w-4" /> Já paguei — Enviar comprovante no WhatsApp</>
              )}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Faça o Pix de R$5 e envie o comprovante. Um admin confirmará a contribuição.
            </p>
          </Card>

          <Card className="p-6 border-border/60 shadow-card">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-3">
              <Share2 className="h-5 w-5 text-primary" />
              Convide amigos
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Quanto mais amigos ativos, maior a estimativa.
            </p>
            <div className="rounded-xl bg-muted/60 p-3 mb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Seu link</p>
              <p className="text-xs font-mono break-all">{inviteUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyInvite} className="flex-1">
                <Copy className="mr-1 h-3.5 w-3.5" /> Copiar
              </Button>
              <Button size="sm" onClick={shareInviteWhatsApp} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                <MessageCircle className="mr-1 h-3.5 w-3.5" /> WhatsApp
              </Button>
            </div>
            <div className="mt-4 pt-4 border-t border-border/60">
              <p className="text-xs text-muted-foreground mb-2">Você convidou</p>
              <p className="text-2xl font-extrabold">{invited.length}</p>
              <p className="text-xs text-muted-foreground">{invited.filter(i => i.is_active).length} ativos</p>
            </div>
          </Card>
        </div>

        {/* Histórico */}
        <Card className="p-6 border-border/60 shadow-card">
          <h2 className="text-xl font-bold mb-4">Histórico de contribuições</h2>
          {contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Você ainda não fez nenhuma contribuição. Comece hoje!
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {contributions.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold">
                      R$ {Number(c.amount).toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.contribution_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge
                    variant={c.status === "confirmed" ? "default" : c.status === "rejected" ? "destructive" : "secondary"}
                    className={c.status === "confirmed" ? "bg-primary" : ""}
                  >
                    {c.status === "confirmed" ? "Confirmado" : c.status === "rejected" ? "Rejeitado" : "Aguardando"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
