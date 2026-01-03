import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Ticket,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  FileText,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketSheet } from "@/components/TicketSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Tournament {
  id: string;
  name: string;
  game: string;
  game_mode: string;
  start_date: string;
}

interface Participation {
  id: string;
  unique_token: string;
  payment_status: string;
  created_at: string;
  tournament_id: string;
  slot_number: number | null;
  partner_nick: string | null;
  partner_2_nick: string | null;
  partner_3_nick: string | null;
}

interface Profile {
  full_name: string | null;
  username: string | null;
}

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

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Participation[]>([]);
  const [tournaments, setTournaments] = useState<Record<string, Tournament>>({});
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Participation | null>(null);
  const [isTicketSheetOpen, setIsTicketSheetOpen] = useState(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para ver seus ingressos");
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch participations
      const { data, error } = await supabase
        .from("participations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Erro ao carregar ingressos");
        return;
      }

      setTickets(data || []);

      // Fetch tournament details for each participation
      if (data && data.length > 0) {
        const tournamentIds = [...new Set(data.map(t => t.tournament_id))];
        const { data: tournamentsData } = await supabase
          .from("tournaments")
          .select("id, name, game, game_mode, start_date")
          .in("id", tournamentIds);

        if (tournamentsData) {
          const tournamentsMap: Record<string, Tournament> = {};
          tournamentsData.forEach(t => {
            tournamentsMap[t.id] = t;
          });
          setTournaments(tournamentsMap);
        }
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado!");
  };

  const handleViewTicket = (ticket: Participation) => {
    setSelectedTicket(ticket);
    setIsTicketSheetOpen(true);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return {
          label: "Confirmado",
          icon: CheckCircle2,
          color: "text-primary",
          bg: "bg-primary/10",
        };
      case "pending":
        return {
          label: "Aguardando",
          icon: Clock,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        };
      case "failed":
        return {
          label: "Falhou",
          icon: XCircle,
          color: "text-destructive",
          bg: "bg-destructive/10",
        };
      case "refunded":
        return {
          label: "Reembolsado",
          icon: RefreshCw,
          color: "text-muted-foreground",
          bg: "bg-muted",
        };
      default:
        return {
          label: status,
          icon: Clock,
          color: "text-muted-foreground",
          bg: "bg-muted",
        };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedTournament = selectedTicket ? tournaments[selectedTicket.tournament_id] : null;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Voltar ao Dashboard</span>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Meus Ingressos
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas participações em torneios
            </p>
          </div>
          <Button variant="outline" onClick={fetchTickets} disabled={isLoading}>
            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-6 animate-pulse"
            >
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="text-muted-foreground" size={32} />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">
            Nenhum ingresso encontrado
          </h3>
          <p className="text-muted-foreground mb-6">
            Você ainda não se inscreveu em nenhum torneio
          </p>
          <Link to="/dashboard">
            <Button variant="default">Ver Torneios Disponíveis</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => {
            const statusConfig = getStatusConfig(ticket.payment_status);
            const StatusIcon = statusConfig.icon;
            const tournament = tournaments[ticket.tournament_id];

            return (
              <div
                key={ticket.id}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Ticket className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg mb-1">
                        {tournament?.name || "Torneio"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tournament ? gameNames[tournament.game] || tournament.game : ""} 
                        {tournament?.game_mode ? ` • ${gameModeNames[tournament.game_mode] || tournament.game_mode}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Inscrito em {formatDate(ticket.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* Slot Badge */}
                    {ticket.payment_status === "paid" && ticket.slot_number && (
                      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full">
                        <Hash size={14} className="text-amber-500" />
                        <span className="font-bold text-amber-500">
                          Slot {ticket.slot_number}
                        </span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div
                      className={cn(
                        "px-3 py-1.5 rounded-full flex items-center gap-2",
                        statusConfig.bg
                      )}
                    >
                      <StatusIcon size={14} className={statusConfig.color} />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          statusConfig.color
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Token & Actions */}
                    {ticket.payment_status === "paid" && ticket.unique_token && (
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 border border-primary/30 px-4 py-2 rounded-lg">
                          <span className="font-mono font-bold text-primary text-sm">
                            {ticket.unique_token.slice(0, 8)}...
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToken(ticket.unique_token)}
                        >
                          <Copy size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          <FileText size={16} />
                        </Button>
                      </div>
                    )}

                    {ticket.payment_status === "pending" && (
                      <p className="text-sm text-amber-500">
                        Aguardando confirmação do pagamento...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Sheet Modal */}
      {selectedTicket && selectedTournament && (
        <TicketSheet
          isOpen={isTicketSheetOpen}
          onClose={() => {
            setIsTicketSheetOpen(false);
            setSelectedTicket(null);
          }}
          ticket={{
            uniqueToken: selectedTicket.unique_token,
            slotNumber: selectedTicket.slot_number,
            tournamentName: selectedTournament.name,
            tournamentGame: gameNames[selectedTournament.game] || selectedTournament.game,
            tournamentGameMode: gameModeNames[selectedTournament.game_mode] || selectedTournament.game_mode,
            tournamentDate: selectedTournament.start_date,
            playerName: profile?.full_name || "Jogador",
            playerNick: profile?.username || undefined,
            partnerNick: selectedTicket.partner_nick || undefined,
            partner2Nick: selectedTicket.partner_2_nick || undefined,
            partner3Nick: selectedTicket.partner_3_nick || undefined,
          }}
        />
      )}
    </div>
  );
}
