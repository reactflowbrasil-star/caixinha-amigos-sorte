import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CalendarDays, Users, ListOrdered, Eye, ShieldAlert, HandCoins, ArrowRight, Check } from "lucide-react";
import heroImg from "@/assets/hero-friends.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-10" aria-hidden />
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-secondary/40 blur-3xl" aria-hidden />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" aria-hidden />

          <div className="container relative mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:py-24 md:gap-16 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-1 text-xs font-semibold text-secondary-foreground">
                💰 Para grupos de amigos
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05]">
                Organize dinheiro <br />
                <span className="text-gradient">entre amigos</span>, <br />
                de um jeito simples.
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                A Caixinha de Amigos Eldorado é uma plataforma para grupos fechados se organizarem.
                Cada participante contribui com <strong className="text-foreground">R$5 por dia</strong> e,
                quando chega sua vez na ordem, recebe o valor total arrecadado naquele dia.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/auth" search={{ mode: "signup" } as any}>
                  <Button size="lg" className="bg-gradient-hero text-primary-foreground shadow-elegant hover:opacity-95">
                    Quero participar <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline">Como funciona</Button>
                </a>
              </div>
              <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4 text-accent" />
                <span><strong>Não é investimento.</strong> Não há promessa de lucro garantido.</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-warm rounded-[2rem] rotate-3 opacity-30" aria-hidden />
              <img
                src={heroImg}
                alt="Grupo de amigos felizes celebrando junto com cofrinho"
                width={1280}
                height={960}
                className="relative rounded-[2rem] shadow-elegant w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Como funciona</p>
            <h2 className="text-3xl md:text-5xl font-extrabold">Três passos. Sem mistério.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: HandCoins, title: "Você contribui R$5 por dia", desc: "Pagamento simples via Pix. O sistema registra sua participação automaticamente." },
              { icon: ListOrdered, title: "Existe uma ordem definida", desc: "Cada participante tem uma posição fixa na fila de recebimento, visível para todos." },
              { icon: Users, title: "Sua vez chega, você recebe", desc: "No seu dia, você recebe o total arrecadado pelos participantes ativos daquela rodada." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <Card key={title} className="p-6 bg-gradient-card border-border/60 shadow-card hover:shadow-elegant transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-hero text-primary-foreground font-bold">
                    {i + 1}
                  </span>
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* REGRAS */}
        <section id="regras" className="bg-muted/40 border-y border-border/60">
          <div className="container mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-accent mb-3">Regras claras</p>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6">A caixinha funciona com compromisso coletivo.</h2>
              <p className="text-muted-foreground text-lg">
                Quanto mais participantes ativos, maior o valor que cada um recebe na sua vez.
                Mas quando alguém deixa de pagar, todo o grupo é afetado.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "Contribuição diária fixa de R$5 por participante.",
                "Ordem de recebimento definida no momento da entrada.",
                "Pagamento via Pix com confirmação registrada.",
                "Histórico transparente de depósitos e recebimentos.",
                "Quem não paga é marcado como inadimplente.",
                "Indicações ajudam o grupo a crescer.",
              ].map((r) => (
                <li key={r} className="flex gap-3 items-start bg-card rounded-xl p-4 border border-border/60">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary mt-0.5">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* TRANSPARÊNCIA */}
        <section id="transparencia" className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 md:col-span-2 bg-gradient-hero text-primary-foreground border-0 shadow-elegant">
              <Eye className="h-8 w-8 mb-4 opacity-90" />
              <h3 className="text-2xl font-extrabold mb-3">Tudo à vista, sempre</h3>
              <p className="opacity-90 max-w-xl">
                Você acompanha quem já pagou, quem ainda não pagou, quem é o próximo a receber e
                qual é a sua posição na fila — em tempo real, no painel.
              </p>
            </Card>
            <Card className="p-6 bg-secondary/40 border-secondary/60">
              <CalendarDays className="h-8 w-8 mb-4 text-secondary-foreground" />
              <h3 className="font-bold text-lg mb-2">Estimativa do dia</h3>
              <p className="text-sm text-muted-foreground">
                O valor a receber depende de quantas pessoas pagaram naquele dia. Sem promessas, só números reais.
              </p>
            </Card>
          </div>

          <div className="mt-12 rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 p-6 md:p-8">
            <div className="flex gap-4 items-start">
              <ShieldAlert className="h-6 w-6 text-accent shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-lg mb-2">Aviso importante</h4>
                <p className="text-sm text-muted-foreground">
                  A Caixinha Eldorado <strong>não é um investimento</strong> e não promete rendimento, lucro
                  ou retorno garantido. É uma plataforma de organização para grupos fechados de pessoas que se conhecem
                  e confiam umas nas outras. O funcionamento depende inteiramente do compromisso de todos os participantes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-24">
          <Card className="p-10 md:p-16 text-center bg-gradient-warm border-0 shadow-elegant">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Pronto para entrar na sua caixinha?</h2>
            <p className="text-lg text-foreground/80 max-w-xl mx-auto mb-8">
              Cadastre-se, aceite os termos e comece a participar com seu grupo de amigos.
            </p>
            <Link to="/auth" search={{ mode: "signup" } as any}>
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90">
                Criar minha conta <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
