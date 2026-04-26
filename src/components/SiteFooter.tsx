export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground">
        <p className="font-display font-bold text-foreground text-base">Caixinha de Amigos Eldorado</p>
        <p className="mt-2 max-w-2xl">
          Plataforma de organização coletiva entre amigos. <strong>Não é investimento</strong>, não há promessa
          de lucro, rendimento ou retorno garantido. O funcionamento depende do compromisso dos participantes.
        </p>
        <p className="mt-4 text-xs">© {new Date().getFullYear()} Caixinha Eldorado · Feito com carinho 💚💛</p>
      </div>
    </footer>
  );
}
