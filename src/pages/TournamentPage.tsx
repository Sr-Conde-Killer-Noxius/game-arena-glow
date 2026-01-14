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
import { cn, formatCurrency } from "@/lib/utils";

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

const gameModeNames: Record<string, string> = {
  solo: "Solo",
  dupla: "Dupla",
  trio: "Trio",
  squad: "Squad",
};

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  rules: string | null;
  game: string;
  game_mode: string;
  start_date: string;
  end_date: string | null;
  start_date_pending: boolean;
  end_date_pending: boolean;
  entry_fee: number;
  prize_pool: number;
  max_participants: number | null;
  status: string;
  banner_url: string | null;
  prize_1st: number | null;
  prize_2nd: number | null;
  prize_3rd: number | null;
  prize_mvp: number | null;
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

      // Fetch participant counts from public counters table
      if (data && data.length > 0) {
        const tournamentIds = data.map((t) => t.id);
        const { data: countsData } = await supabase
          .from("tournament_participant_counts")
          .select("tournament_id, paid_count")
          .in("tournament_id", tournamentIds);

        if (countsData) {
          const counts: Record<string, number> = {};
          countsData.forEach((c) => {
            counts[c.tournament_id] = c.paid_count;
          });
          setParticipantCounts(counts);
        }
      }

      setIsLoading(false);
    };

    fetchTournaments();
  }, [gameId]);

  // Realtime subscription for participant counts (public table)
  useEffect(() => {
    if (tournaments.length === 0) return;

    const tournamentIds = tournaments.map((t) => t.id);

    const channel = supabase
      .channel('tournament-counts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_participant_counts',
        },
        (payload) => {
          const record = (payload.new || payload.old) as {
            tournament_id?: string;
            paid_count?: number;
          };

          if (record?.tournament_id && tournamentIds.includes(record.tournament_id)) {
            const newCount = payload.eventType === 'DELETE' ? 0 : record.paid_count ?? 0;
            setParticipantCounts((prev) => ({
              ...prev,
              [record.tournament_id!]: newCount,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournaments]);

  const formatDate = (dateStr: string, isPending: boolean = false) => {
    if (isPending) return "Aguardando";
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

  const formatFullDate = (dateStr: string, isPending: boolean = false) => {
    if (isPending) return "Aguardando";
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        {/* How to Participate - Above tournaments */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Info className="text-primary" size={18} />
            </div>
            <h3 className="font-display font-bold text-sm sm:text-base">Como Participar</h3>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                1
              </span>
              <span>Selecione um torneio da lista</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                2
              </span>
              <span>Clique em "Comprar Ingresso"</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                3
              </span>
              <span>Preencha seus dados e envie os prints</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                4
              </span>
              <span>Pague via PIX e receba seu token</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                5
              </span>
              <span>Entre na sala no horário com seu slot</span>
            </li>
          </ol>
        </div>

        {/* Tournament List */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="font-display font-bold text-base sm:text-lg lg:text-xl mb-3 sm:mb-4">
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
                  "bg-card border rounded-xl overflow-hidden transition-all cursor-pointer touch-manipulation",
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                )}
                onClick={() => handleSelectTournament(tournament)}
              >
                {/* Tournament Card Header */}
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="space-y-2">
                      {getStatusBadge(tournament.status)}
                      <h3 className="font-display font-bold text-base sm:text-lg lg:text-xl">
                        {tournament.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 sm:gap-1.5">
                          <Calendar size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
                          {formatDate(tournament.start_date, tournament.start_date_pending)}
                        </span>
                        <span className="flex items-center gap-1 sm:gap-1.5">
                          <Clock size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
                          {formatTime(tournament.start_date)}
                        </span>
                        <span className="flex items-center gap-1 sm:gap-1.5">
                          <Users size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
                          {participantCount}/{maxParticipants}
                        </span>
                        <span className="flex items-center gap-1 sm:gap-1.5">
                          <Gamepad2 size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
                          {gameModeNames[tournament.game_mode] || tournament.game_mode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Entrada</p>
                        <p className="font-display font-bold text-sm sm:text-base text-primary">
                          {formatCurrency(Number(tournament.entry_fee))}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Premiação</p>
                        <p className="font-display font-bold text-sm sm:text-base text-primary">
                          {formatCurrency(Number(tournament.prize_pool))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="border-t border-border p-3 sm:p-4 lg:p-6 bg-muted/30 space-y-4 sm:space-y-6">
                    {/* Description */}
                    {tournament.description && (
                      <div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {tournament.description}
                        </p>
                      </div>
                    )}

                    {/* Info Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                      <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
                        <Calendar className="text-primary mb-1 sm:mb-2" size={20} />
                        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                          Data
                        </p>
                        <p className="font-display font-bold text-xs sm:text-sm">
                          {formatFullDate(tournament.start_date, tournament.start_date_pending)}
                        </p>
                      </div>

                      <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
                        <Clock className="text-primary mb-1 sm:mb-2" size={20} />
                        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                          Horário
                        </p>
                        <p className="font-display font-bold text-xs sm:text-sm">
                          {formatTime(tournament.start_date)}
                        </p>
                      </div>

                      <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
                        <Users className="text-primary mb-1 sm:mb-2" size={20} />
                        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                          Vagas
                        </p>
                        <p className="font-display font-bold text-xs sm:text-sm">
                          {spotsLeft} restantes
                        </p>
                      </div>

                      <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
                        <Trophy className="text-primary mb-1 sm:mb-2" size={20} />
                        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                          Premiação
                        </p>
                        <p className="font-display font-bold text-xs sm:text-sm text-primary">
                          {formatCurrency(Number(tournament.prize_pool))}
                        </p>
                      </div>
                    </div>

                    {/* Prize Distribution - Inside tournament card */}
                    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                          <Trophy className="text-amber-500" size={18} />
                        </div>
                        <h4 className="font-display font-bold text-sm sm:text-base">Premiação Detalhada</h4>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                        {tournament.prize_1st != null && tournament.prize_1st > 0 && (
                          <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                            <span className="text-xl sm:text-2xl">🥇</span>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">1º Lugar</p>
                            <p className="font-bold text-xs sm:text-sm text-primary">{formatCurrency(Number(tournament.prize_1st))}</p>
                          </div>
                        )}
                        {tournament.prize_2nd != null && tournament.prize_2nd > 0 && (
                          <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                            <span className="text-xl sm:text-2xl">🥈</span>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">2º Lugar</p>
                            <p className="font-bold text-xs sm:text-sm">{formatCurrency(Number(tournament.prize_2nd))}</p>
                          </div>
                        )}
                        {tournament.prize_3rd != null && tournament.prize_3rd > 0 && (
                          <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                            <span className="text-xl sm:text-2xl">🥉</span>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">3º Lugar</p>
                            <p className="font-bold text-xs sm:text-sm">{formatCurrency(Number(tournament.prize_3rd))}</p>
                          </div>
                        )}
                        {tournament.prize_mvp != null && tournament.prize_mvp > 0 && (
                          <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                            <span className="text-xl sm:text-2xl">🎯</span>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">MVP (+Kills)</p>
                            <p className="font-bold text-xs sm:text-sm text-amber-500">{formatCurrency(Number(tournament.prize_mvp))}</p>
                          </div>
                        )}
                        {/* Fallback if no prizes configured */}
                        {(!tournament.prize_1st && !tournament.prize_2nd && !tournament.prize_3rd && !tournament.prize_mvp) && (
                          <div className="col-span-full text-center">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Premiação total: {formatCurrency(Number(tournament.prize_pool))}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rules */}
                    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                          <Shield className="text-destructive" size={18} />
                        </div>
                        <h4 className="font-display font-bold text-sm sm:text-base">Regras do Torneio</h4>
                      </div>
                      <ul className="space-y-2">
                        {parseRules(tournament.rules).map((rule, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                          >
                            <AlertTriangle
                              size={12}
                              className="text-destructive shrink-0 mt-0.5 sm:w-3.5 sm:h-3.5"
                            />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Requirements */}
                    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Target className="text-primary" size={18} />
                        </div>
                        <h4 className="font-display font-bold text-sm sm:text-base">
                          Requisitos para Participar
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {defaultRequirements.map((req, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                          >
                            <CheckCircle2
                              size={12}
                              className="text-primary shrink-0 mt-0.5 sm:w-3.5 sm:h-3.5"
                            />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Buy Button */}
                    <Button
                      size="lg"
                      className="w-full gap-2 text-sm sm:text-base touch-manipulation"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyTicket(tournament);
                      }}
                      disabled={spotsLeft <= 0 || tournament.status !== "open"}
                    >
                      <Ticket size={16} className="sm:w-[18px] sm:h-[18px]" />
                      {spotsLeft <= 0
                        ? "Esgotado"
                        : tournament.status !== "open"
                        ? "Inscrições Fechadas"
                        : `Comprar Ingresso - ${formatCurrency(Number(tournament.entry_fee))}`}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchase Modal */}
      {selectedTournament && (
        <TicketPurchaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tournamentName={selectedTournament.name}
          tournamentId={selectedTournament.id}
          tournamentGame={selectedTournament.game}
          tournamentGameMode={selectedTournament.game_mode}
          tournamentDate={selectedTournament.start_date}
          entryFee={Number(selectedTournament.entry_fee)}
        />
      )}
    </div>
  );
}
