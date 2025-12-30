import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gamepad2, Trophy, Users, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Esports Arena"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-[size:60px_60px] opacity-5" />

        {/* Floating elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center neon-glow">
                <span className="font-display font-bold text-primary-foreground text-xl">
                  J
                </span>
              </div>
              <span className="font-display font-bold text-2xl text-foreground">
                JPG
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" size="lg">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button variant="default" size="lg">
                  Cadastrar
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="animate-fade-in">
            <span className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-semibold uppercase tracking-wider mb-6">
              Plataforma de E-sports
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight animate-slide-in-left">
            <span className="text-foreground">SUA JORNADA</span>
            <br />
            <span className="text-primary text-neon-glow">PROFISSIONAL</span>
            <br />
            <span className="text-foreground">COMEÇA AQUI</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Participe de torneios, suba no ranking e torne-se um jogador
            profissional. Jogue para ganhar com a JPG.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in" style={{ animationDelay: "0.5s" }}>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Começar Agora
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              POR QUE <span className="text-primary text-neon-glow">JPG</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A plataforma definitiva para jogadores que querem evoluir e
              competir no cenário competitivo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Gamepad2,
                title: "Multi-Jogos",
                description:
                  "Free Fire, Valorant, LoL Wild Rift e muito mais em uma só plataforma.",
              },
              {
                icon: Trophy,
                title: "Torneios Diários",
                description:
                  "Competições constantes com premiações reais para todos os níveis.",
              },
              {
                icon: Users,
                title: "Comunidade Ativa",
                description:
                  "Conecte-se com milhares de jogadores e forme seu time.",
              },
              {
                icon: Zap,
                title: "Ranking Competitivo",
                description:
                  "Sistema de ranking que valoriza sua dedicação e habilidade.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="gradient-card p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:neon-glow transition-all duration-300">
                  <feature.icon className="text-primary" size={28} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="gradient-card p-12 rounded-2xl border border-primary/30 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />

            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              PRONTO PARA <span className="text-primary text-neon-glow">JOGAR</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Junte-se a milhares de jogadores e comece sua jornada rumo ao
              profissionalismo agora mesmo.
            </p>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl">
                Criar Conta Grátis
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="font-display font-bold text-primary-foreground text-sm">
                J
              </span>
            </div>
            <span className="font-display font-bold text-foreground">
              JPG Platform
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 JPG - Joga para Ganhar. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
