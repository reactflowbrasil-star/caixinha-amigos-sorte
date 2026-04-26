import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PiggyBank, Loader2 } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional().default("signin"),
  invite: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const signinSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Informe a senha"),
});

function AuthPage() {
  const { mode, invite } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });

  useEffect(() => { setIsSignup(mode === "signup"); }, [mode]);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [user, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        if (!acceptedTerms) {
          toast.error("Você precisa aceitar os termos de participação.");
          setLoading(false);
          return;
        }
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          setLoading(false);
          return;
        }
        const redirectUrl = `${window.location.origin}/dashboard`;
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: parsed.data.full_name,
              phone: parsed.data.phone,
              ...(invite ? { invite_code: invite } : {}),
            },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Bem-vindo(a) à Caixinha 💚");
      } else {
        const parsed = signinSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Bem-vindo(a) de volta!");
      }
    } catch (err: any) {
      const msg = err?.message || "Algo deu errado";
      if (msg.includes("Invalid login")) toast.error("Email ou senha incorretos.");
      else if (msg.includes("already registered")) toast.error("Este email já está cadastrado.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex relative bg-gradient-hero p-12 text-primary-foreground flex-col justify-between overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-secondary/40 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2 font-display font-extrabold text-xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-background/15 backdrop-blur">
            <PiggyBank className="h-5 w-5" />
          </span>
          Caixinha Eldorado
        </Link>
        <div className="relative space-y-4">
          <h2 className="text-4xl font-extrabold leading-tight">Entre amigos, tudo é mais simples.</h2>
          <p className="opacity-90 max-w-sm">R$5 por dia, ordem clara e total transparência. Bem-vindo à sua caixinha.</p>
        </div>
        <p className="relative text-xs opacity-70">Não é investimento. Sem promessa de lucro.</p>
      </div>

      <div className="flex flex-col justify-center p-6 md:p-12 bg-background">
        <Card className="mx-auto w-full max-w-md p-8 border-border/60 shadow-card">
          <div className="md:hidden mb-6 flex items-center gap-2 font-display font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground">
              <PiggyBank className="h-5 w-5" />
            </span>
            Caixinha Eldorado
          </div>
          <h1 className="text-2xl font-extrabold mb-1">
            {isSignup ? "Criar conta" : "Entrar"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isSignup ? "Junte-se à sua caixinha de amigos" : "Acesse seu painel"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone (com DDD)</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>

            {isSignup && (
              <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
                <Checkbox checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(v === true)} className="mt-0.5" />
                <span>
                  Eu li e aceito os termos de participação. Entendo que <strong>não é investimento</strong> e
                  que o funcionamento depende do compromisso coletivo.
                </span>
              </label>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-gradient-hero text-primary-foreground hover:opacity-95 shadow-elegant">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignup ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="mt-6 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignup ? "Já tenho conta — Entrar" : "Não tenho conta — Cadastrar"}
          </button>
        </Card>
      </div>
    </div>
  );
}
