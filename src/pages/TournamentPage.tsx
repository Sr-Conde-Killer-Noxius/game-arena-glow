import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Trophy,
  Ticket,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketPurchaseModal } from "@/components/TicketPurchaseModal";
import freefireImg from "@/assets/games/freefire.jpg";

export default function TournamentPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock tournament data
  const tournament = {
    name: "Free Fire Pro League #001",
    game: "Free Fire",
    description:
      "Torneio competitivo de Free Fire com premiação em dinheiro. Mostre suas habilidades e conquiste o topo!",
    startDate: "2025-01-15T19:00:00",
    entryFee: 2.5,
    prizePool: 500,
    maxParticipants: 100,
    currentParticipants: 47,
    status: "open",
  };

  const rules = [
    "Proibido uso de hacks, emuladores ou qualquer software ilegal",
    "Todos os participantes devem ter conta válida no Free Fire",
    "É obrigatório estar no grupo do WhatsApp para comunicados",
    "Atrasos superiores a 10 minutos resultam em desclassificação",
    "Decisões da organização são finais e irrevogáveis",
    "Prints de resultado devem ser enviados em até 5 minutos",
  ];

  const requirements = [
    "Seguir @jpgesports no Instagram",
    "Entrar no canal do WhatsApp da JPG",
    "Ter conta verificada no Free Fire",
    "Aceitar os termos e regras do torneio",
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh]">
        <img
          src={freefireImg}
          alt={tournament.game}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
        </div>

        {/* Tournament Title */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium mb-3">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Inscrições Abertas
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">
              {tournament.name}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              {tournament.description}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <Calendar className="text-primary mb-2" size={24} />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Data
                </p>
                <p className="font-display font-bold">
                  {formatDate(tournament.startDate)}
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <Clock className="text-primary mb-2" size={24} />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Horário
                </p>
                <p className="font-display font-bold">
                  {formatTime(tournament.startDate)}
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <Users className="text-primary mb-2" size={24} />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Vagas
                </p>
                <p className="font-display font-bold">
                  {tournament.currentParticipants}/{tournament.maxParticipants}
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <Trophy className="text-primary mb-2" size={24} />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Premiação
                </p>
                <p className="font-display font-bold text-primary">
                  R$ {tournament.prizePool}
                </p>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <Shield className="text-destructive" size={20} />
                </div>
                <h2 className="font-display font-bold text-xl">
                  Regras do Torneio
                </h2>
              </div>

              <ul className="space-y-3">
                {rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertTriangle
                      size={16}
                      className="text-amber-500 mt-0.5 shrink-0"
                    />
                    <span className="text-muted-foreground text-sm">
                      {rule}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="text-primary" size={20} />
                </div>
                <h2 className="font-display font-bold text-xl">
                  Requisitos para Participar
                </h2>
              </div>

              <ul className="space-y-3">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2
                      size={16}
                      className="text-primary mt-0.5 shrink-0"
                    />
                    <span className="text-muted-foreground text-sm">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Ticket className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Valor do Ingresso
                    </p>
                    <p className="font-display text-2xl font-bold text-primary">
                      R$ 2,50
                    </p>
                  </div>
                </div>

                {/* Prize Distribution */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Info size={14} className="text-primary" />
                    <span className="font-medium">Distribuição do valor</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Premiação</span>
                    <span className="text-primary font-bold">70%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Organização</span>
                    <span className="font-bold">30%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Vagas preenchidas</span>
                    <span className="font-bold">
                      {Math.round(
                        (tournament.currentParticipants /
                          tournament.maxParticipants) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${
                          (tournament.currentParticipants /
                            tournament.maxParticipants) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tournament.maxParticipants - tournament.currentParticipants}{" "}
                    vagas restantes
                  </p>
                </div>

                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Ticket size={18} />
                  Comprar Ingresso
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Duplas pagam R$ 5,00 (mesmo preço por pessoa)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <TicketPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tournamentName={tournament.name}
      />
    </div>
  );
}
