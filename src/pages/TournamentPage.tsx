import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
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
  Loader2,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketPurchaseModal } from "@/components/TicketPurchaseModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Game images
import freefireImg from "@/assets/games/freefire.jpg";
import valorantImg from "@/assets/games/valorant.jpg";
import cs2Img from "@/assets/games/cs2.jpg";
import pubgImg from "@/assets/games/pubg.jpg";
import codmobileImg from "@/assets/games/codmobile.jpg";
import wildriftImg from "@/assets/games/wildrift.jpg";

// Game mappings
const gameImages: Record<string, string> = {
  freefire: freefireImg,
  valorant: valorantImg,
  cs2: cs2Img,
  pubg: pubgImg,
  codmobile: codmobileImg,
  wildrift: wildriftImg,
};

const gameNames: Record<string, string> = {
  freefire: "Free Fire",
  valorant: "Valorant",
  cs2: "Counter-Strike 2",
  pubg: "PUBG Mobile",
  codmobile: "Call of Duty Mobile",
  wildrift: "Wild Rift",
};

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  rules: string | null;
  game: string;
  start_date: string;
  end_date: string | null;
  entry_fee: number;
  prize_pool: number;
  max_participants: number | null;
  status: string;
  banner_url: string | null;
}

const defaultRules = [
  "Proibido uso de hacks, emuladores ou qualquer software ilegal",
  "Todos os participantes devem ter conta válida no jogo",
  "É obrigatório estar no grupo do WhatsApp para comunicados",
  "Atrasos superiores a 10 minutos resultam em desclassificação",
  "Decisões da organização são finais e irrevogáveis",
  "Prints de resultado devem ser enviados em até 5 minutos",
];

const defaultRequirements = [
  "Seguir @jogapraganhar no Instagram",
  "Entrar no canal e no grupo do WhatsApp da JPG",
  "Ter conta verificada no jogo",
  "Aceitar os termos e regras do torneio",
];

export default function TournamentPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const gameName = gameId ? gameNames[gameId] || gameId : "Jogo";
  const gameImage = gameId ? gameImages[gameId] : freefireImg;

  useEffect(() => {
    const fetchTournaments = async () => {
      if (!gameId) return;

      setIsLoading(true);

      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("game", gameId as "codmobile" | "cs2" | "freefire" | "pubg" | "valorant" | "wildrift")
        .in("status", ["open", "upcoming", "in_progress"])
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching tournaments:", error);
        toast.error("Erro ao carregar torneios");
        setIsLoading(false);
        return;
      }

      setTournaments(data || []);

      // Fetch participant counts for each tournament
      if (data && data.length > 0) {
        const counts: Record<string, number> = {};
        for (const tournament of data) {
          const { count } = await supabase
            .from("participations")
            .select("*", { count: "exact", head: true })
            .eq("tournament_id", tournament.id)
            .eq("payment_status", "paid");
          counts[tournament.id] = count || 0;
        }
        setParticipantCounts(counts);
      }

      setIsLoading(false);
    };

    fetchTournaments();
  }, [gameId]);

  // Realtime subscription for participant counts
  useEffect(() => {
    if (tournaments.length === 0) return;

    const tournamentIds = tournaments.map(t => t.id);

    const channel = supabase
      .channel('participations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participations',
        },
        async (payload) => {
          const newRecord = payload.new as { tournament_id?: string; payment_status?: string };
          const oldRecord = payload.old as { tournament_id?: string; payment_status?: string };
          
          const affectedTournamentId = newRecord?.tournament_id || oldRecord?.tournament_id;
          
          if (affectedTournamentId && tournamentIds.includes(affectedTournamentId)) {
            // Refetch count for this specific tournament
            const { count } = await supabase
              .from("participations")
              .select("*", { count: "exact", head: true })
              .eq("tournament_id", affectedTournamentId)
              .eq("payment_status", "paid");
            
            setParticipantCounts(prev => ({
              ...prev,
              [affectedTournamentId]: count || 0
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournaments]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
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

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1.5 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Inscrições Abertas
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-medium">
            <Clock size={12} />
            Em Breve
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-medium">
            <Gamepad2 size={12} />
            Em Andamento
          </span>
        );
      default:
        return null;
    }
  };

  const parseRules = (rulesText: string | null): string[] => {
    if (!rulesText) return defaultRules;
    return rulesText.split("\n").filter((rule) => rule.trim() !== "");
  };

  const handleSelectTournament = (tournament: Tournament) => {
    setSelectedTournament(selectedTournament?.id === tournament.id ? null : tournament);
  };

  const handleBuyTicket = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsModalOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando torneios...</p>
        </div>
      </div>
    );
  }

  // No tournaments available
  if (tournaments.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative h-[40vh]">
          <img
            src={gameImage}
            alt={gameName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

          <div className="absolute top-6 left-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Voltar</span>
            </Link>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
              <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">
                {gameName}
              </h1>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">
              Nenhum torneio disponível
            </h2>
            <p className="text-muted-foreground mb-6">
              Não há torneios ativos para {gameName} no momento. Fique de olho, novos torneios serão anunciados em breve!
            </p>
            <Link to="/dashboard">
              <Button variant="default">
                <ArrowLeft size={18} />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh]">
        <img
          src={selectedTournament?.banner_url || gameImage}
          alt={gameName}
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

        {/* Game Title */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">
              Torneios de {gameName}
            </h1>
            <p className="text-muted-foreground text-lg">
              {tournaments.length} torneio{tournaments.length !== 1 ? "s" : ""} disponível{tournaments.length !== 1 ? "is" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tournament List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display font-bold text-xl mb-4">
              Selecione um Torneio
            </h2>

            {tournaments.map((tournament) => {
              const isSelected = selectedTournament?.id === tournament.id;
              const participantCount = participantCounts[tournament.id] || 0;
              const maxParticipants = tournament.max_participants || 100;
              const spotsLeft = maxParticipants - participantCount;

              return (
                <div
                  key={tournament.id}
                  className={cn(
                    "bg-card border rounded-xl overflow-hidden transition-all cursor-pointer",
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleSelectTournament(tournament)}
                >
                  {/* Tournament Card Header */}
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        {getStatusBadge(tournament.status)}
                        <h3 className="font-display font-bold text-lg md:text-xl">
                          {tournament.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-primary" />
                            {formatDate(tournament.start_date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-primary" />
                            {formatTime(tournament.start_date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users size={14} className="text-primary" />
                            {participantCount}/{maxParticipants}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Entrada</p>
                          <p className="font-display font-bold text-primary">
                            R$ {Number(tournament.entry_fee).toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Premiação</p>
                          <p className="font-display font-bold text-primary">
                            R$ {Number(tournament.prize_pool).toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isSelected && (
                    <div className="border-t border-border p-4 md:p-6 bg-muted/30 space-y-6">
                      {/* Description */}
                      {tournament.description && (
                        <div>
                          <p className="text-muted-foreground whitespace-pre-line">
                            {tournament.description}
                          </p>
                        </div>
                      )}

                      {/* Info Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card border border-border rounded-xl p-4">
                          <Calendar className="text-primary mb-2" size={24} />
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Data
                          </p>
                          <p className="font-display font-bold text-sm">
                            {formatFullDate(tournament.start_date)}
                          </p>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-4">
                          <Clock className="text-primary mb-2" size={24} />
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Horário
                          </p>
                          <p className="font-display font-bold text-sm">
                            {formatTime(tournament.start_date)}
                          </p>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-4">
                          <Users className="text-primary mb-2" size={24} />
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Vagas
                          </p>
                          <p className="font-display font-bold text-sm">
                            {spotsLeft} restantes
                          </p>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-4">
                          <Trophy className="text-primary mb-2" size={24} />
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Premiação
                          </p>
                          <p className="font-display font-bold text-sm text-primary">
                            R$ {Number(tournament.prize_pool).toFixed(0)}
                          </p>
                        </div>
                      </div>

                      {/* Rules */}
                      <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                            <Shield className="text-destructive" size={20} />
                          </div>
                          <h4 className="font-display font-bold text-lg">
                            Regras do Torneio
                          </h4>
                        </div>

                        <ul className="space-y-3">
                          {parseRules(tournament.rules).map((rule, index) => (
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
                          <h4 className="font-display font-bold text-lg">
                            Requisitos para Participar
                          </h4>
                        </div>

                        <ul className="space-y-3">
                          {defaultRequirements.map((req, index) => (
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

                      {/* Buy Button */}
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyTicket(tournament);
                        }}
                        disabled={tournament.status !== "open"}
                      >
                        <Ticket size={18} />
                        {tournament.status === "open" ? "Comprar Ingresso" : "Inscrições em breve"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar - Quick Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Info className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">
                      Como Participar
                    </p>
                  </div>
                </div>

                <ol className="space-y-4 text-sm">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </span>
                    <span className="text-muted-foreground">
                      Selecione um torneio da lista ao lado
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </span>
                    <span className="text-muted-foreground">
                      Clique em "Comprar Ingresso" e preencha seus dados
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </span>
                    <span className="text-muted-foreground">
                      Pague via PIX e receba seu token de confirmação
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      4
                    </span>
                    <span className="text-muted-foreground">
                      Entre no grupo do WhatsApp e aguarde o dia do torneio
                    </span>
                  </li>
                </ol>

                {/* Prize Distribution Info */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy size={14} className="text-primary" />
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
        tournamentName={selectedTournament?.name || ""}
        tournamentId={selectedTournament?.id}
      />
    </div>
  );
}
