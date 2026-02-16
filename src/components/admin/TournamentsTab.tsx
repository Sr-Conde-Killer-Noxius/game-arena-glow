import { useState, useEffect } from "react";
import { Plus, RefreshCw, Edit2, Trash2, Trophy, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { TournamentForm } from "./TournamentForm";
import { RoomReportModal } from "./RoomReportModal";
import { WinnerSelectionModal } from "./WinnerSelectionModal";
import type { Database } from "@/integrations/supabase/types";

type GameType = Database["public"]["Enums"]["game_type"];
type GameMode = Database["public"]["Enums"]["game_mode"];
type TournamentStatus = Database["public"]["Enums"]["tournament_status"];

// Extended type to include winner fields that were just added
type BaseTournament = Database["public"]["Tables"]["tournaments"]["Row"];
type Tournament = BaseTournament & {
  winner_1st_id?: string | null;
  winner_2nd_id?: string | null;
  winner_3rd_id?: string | null;
  winner_mvp_id?: string | null;
};

export function TournamentsTab() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [roomReportTournament, setRoomReportTournament] = useState<Tournament | null>(null);
  const [winnerSelectionTournament, setWinnerSelectionTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Map data to include winner fields
      setTournaments((data || []).map((t: any) => ({
        ...t,
        winner_1st_id: t.winner_1st_id || null,
        winner_2nd_id: t.winner_2nd_id || null,
        winner_3rd_id: t.winner_3rd_id || null,
        winner_mvp_id: t.winner_mvp_id || null,
      })));
    } catch (err) {
      console.error("Error fetching tournaments:", err);
      toast.error("Erro ao carregar torneios");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTournament = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este torneio?")) return;

    try {
      const { error } = await supabase.from("tournaments").delete().eq("id", id);

      if (error) throw error;
      toast.success("Torneio excluído com sucesso!");
      fetchTournaments();
    } catch (err) {
      console.error("Error deleting tournament:", err);
      toast.error("Erro ao excluir torneio");
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

  const getStatusBadge = (status: TournamentStatus) => {
    const config: Record<TournamentStatus, { label: string; color: string }> = {
      upcoming: { label: "Em Breve", color: "bg-muted text-muted-foreground" },
      open: { label: "Aberto", color: "bg-primary/10 text-primary" },
      in_progress: { label: "Em Andamento", color: "bg-amber-500/10 text-amber-500" },
      finished: { label: "Finalizado", color: "bg-blue-500/10 text-blue-500" },
      cancelled: { label: "Cancelado", color: "bg-destructive/10 text-destructive" },
    };
    const c = config[status];
    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", c.color)}>
        {c.label}
      </span>
    );
  };

  const getGameLabel = (game: GameType) => {
    const labels: Record<GameType, string> = {
      freefire: "Free Fire",
      valorant: "Valorant",
      cs2: "CS2",
      pubg: "PUBG",
      codmobile: "COD Mobile",
      wildrift: "Wild Rift",
    };
    return labels[game];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Novo Torneio
        </Button>
        <Button variant="outline" onClick={fetchTournaments}>
          <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Trophy className="mx-auto text-muted-foreground mb-4" size={40} />
          <p className="text-muted-foreground">Nenhum torneio cadastrado</p>
          <Button onClick={() => setShowForm(true)} className="mt-4">
            <Plus size={18} />
            Criar Primeiro Torneio
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display font-bold text-lg">{t.name}</h3>
                    {getStatusBadge(t.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {getGameLabel(t.game)} • {formatDate(t.start_date)}
                    {t.end_date && ` - ${formatDate(t.end_date)}`}
                  </p>
                  {t.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {t.description}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-display text-xl font-bold text-primary">
                    {formatCurrency(t.prize_pool)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Entrada: {formatCurrency(t.entry_fee)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Máx: {t.max_participants} jogadores
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRoomReportTournament(t)}
                >
                  <Users size={14} />
                  Sala
                </Button>
                {(t.status === "finished" || t.status === "in_progress") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-500 hover:bg-amber-500/10"
                    onClick={() => setWinnerSelectionTournament(t)}
                  >
                    <Crown size={14} />
                    Vencedores
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTournament(t);
                    setShowForm(true);
                  }}
                >
                  <Edit2 size={14} />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => deleteTournament(t.id)}
                >
                  <Trash2 size={14} />
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TournamentForm
          tournamentId={editingTournament?.id}
          onClose={() => {
            setShowForm(false);
            setEditingTournament(null);
          }}
          onSuccess={fetchTournaments}
        />
      )}

      {roomReportTournament && (
        <RoomReportModal
          tournamentId={roomReportTournament.id}
          tournamentName={roomReportTournament.name}
          gameMode={roomReportTournament.game_mode}
          onClose={() => setRoomReportTournament(null)}
        />
      )}

      {winnerSelectionTournament && (
        <WinnerSelectionModal
          isOpen={!!winnerSelectionTournament}
          onClose={() => setWinnerSelectionTournament(null)}
          onSuccess={fetchTournaments}
          tournamentId={winnerSelectionTournament.id}
          tournamentName={winnerSelectionTournament.name}
          gameMode={winnerSelectionTournament.game_mode}
          prize1st={winnerSelectionTournament.prize_1st}
          prize2nd={winnerSelectionTournament.prize_2nd}
          prize3rd={winnerSelectionTournament.prize_3rd}
          prizeMvp={winnerSelectionTournament.prize_mvp}
          currentWinner1st={winnerSelectionTournament.winner_1st_id}
          currentWinner2nd={winnerSelectionTournament.winner_2nd_id}
          currentWinner3rd={winnerSelectionTournament.winner_3rd_id}
          currentWinnerMvp={winnerSelectionTournament.winner_mvp_id}
        />
      )}
    </div>
  );
}
