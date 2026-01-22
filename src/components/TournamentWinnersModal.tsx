import { useState, useEffect } from "react";
import { X, Trophy, Medal, Target, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";

interface Winner {
  participationId: string;
  playerNick: string | null;
  playerGameId: string | null;
  partnerNick: string | null;
  partnerGameId: string | null;
  partner2Nick: string | null;
  partner2GameId: string | null;
  partner3Nick: string | null;
  partner3GameId: string | null;
  slotNumber: number | null;
}

interface TournamentWinnersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentName: string;
  gameMode: string;
  prize1st?: number | null;
  prize2nd?: number | null;
  prize3rd?: number | null;
  prizeMvp?: number | null;
  winner1stId?: string | null;
  winner2ndId?: string | null;
  winner3rdId?: string | null;
  winnerMvpId?: string | null;
}

const gameModeNames: Record<string, string> = {
  solo: "Solo",
  dupla: "Dupla",
  trio: "Trio",
  squad: "Squad",
};

export function TournamentWinnersModal({
  isOpen,
  onClose,
  tournamentName,
  gameMode,
  prize1st,
  prize2nd,
  prize3rd,
  prizeMvp,
  winner1stId,
  winner2ndId,
  winner3rdId,
  winnerMvpId,
}: TournamentWinnersModalProps) {
  const [winners, setWinners] = useState<{
    first: Winner | null;
    second: Winner | null;
    third: Winner | null;
    mvp: Winner | null;
  }>({
    first: null,
    second: null,
    third: null,
    mvp: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchWinners = async () => {
      setIsLoading(true);
      
      const winnerIds = [winner1stId, winner2ndId, winner3rdId, winnerMvpId].filter(Boolean);
      
      if (winnerIds.length === 0) {
        setWinners({ first: null, second: null, third: null, mvp: null });
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("participations")
          .select("id, player_nick, player_game_id, partner_nick, partner_game_id, partner_2_nick, partner_2_game_id, partner_3_nick, partner_3_game_id, slot_number")
          .in("id", winnerIds);

        if (error) throw error;

        const mapWinner = (id: string | null | undefined): Winner | null => {
          if (!id) return null;
          const p = data?.find((d) => d.id === id);
          if (!p) return null;
          return {
            participationId: p.id,
            playerNick: p.player_nick,
            playerGameId: p.player_game_id,
            partnerNick: p.partner_nick,
            partnerGameId: p.partner_game_id,
            partner2Nick: p.partner_2_nick,
            partner2GameId: p.partner_2_game_id,
            partner3Nick: p.partner_3_nick,
            partner3GameId: p.partner_3_game_id,
            slotNumber: p.slot_number,
          };
        };

        setWinners({
          first: mapWinner(winner1stId),
          second: mapWinner(winner2ndId),
          third: mapWinner(winner3rdId),
          mvp: mapWinner(winnerMvpId),
        });
      } catch (err) {
        console.error("Error fetching winners:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWinners();
  }, [isOpen, winner1stId, winner2ndId, winner3rdId, winnerMvpId]);

  if (!isOpen) return null;

  const renderPlayerInfo = (winner: Winner | null) => {
    if (!winner) return <p className="text-muted-foreground text-sm">Não definido</p>;

    const isTeamMode = gameMode !== "solo";

    return (
      <div className="space-y-2">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Jogador Principal</p>
          <p className="font-bold">{winner.playerNick || "—"}</p>
          <p className="text-xs text-muted-foreground">ID: {winner.playerGameId || "—"}</p>
        </div>

        {isTeamMode && winner.partnerNick && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Parceiro 1</p>
            <p className="font-medium">{winner.partnerNick}</p>
            <p className="text-xs text-muted-foreground">ID: {winner.partnerGameId || "—"}</p>
          </div>
        )}

        {isTeamMode && winner.partner2Nick && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Parceiro 2</p>
            <p className="font-medium">{winner.partner2Nick}</p>
            <p className="text-xs text-muted-foreground">ID: {winner.partner2GameId || "—"}</p>
          </div>
        )}

        {isTeamMode && winner.partner3Nick && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Parceiro 3</p>
            <p className="font-medium">{winner.partner3Nick}</p>
            <p className="text-xs text-muted-foreground">ID: {winner.partner3GameId || "—"}</p>
          </div>
        )}

        {winner.slotNumber && (
          <p className="text-xs text-muted-foreground text-center">Slot #{winner.slotNumber}</p>
        )}
      </div>
    );
  };

  const hasAnyWinner = winner1stId || winner2ndId || winner3rdId || winnerMvpId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Trophy className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Resultados</h2>
              <p className="text-sm text-muted-foreground">{tournamentName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !hasAnyWinner ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Resultados ainda não definidos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1st Place */}
              {(winner1stId || prize1st) && (
                <div className={cn(
                  "border rounded-xl p-4 relative overflow-hidden",
                  "bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/30"
                )}>
                  <div className="absolute top-2 right-2">
                    <span className="text-3xl">🥇</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="text-amber-500" size={20} />
                    <h3 className="font-bold text-amber-500">1º Lugar</h3>
                  </div>
                  {prize1st && prize1st > 0 && (
                    <p className="font-display text-2xl font-bold text-amber-500 mb-3">
                      {formatCurrency(prize1st)}
                    </p>
                  )}
                  {renderPlayerInfo(winners.first)}
                </div>
              )}

              {/* 2nd Place */}
              {(winner2ndId || prize2nd) && (
                <div className={cn(
                  "border rounded-xl p-4 relative overflow-hidden",
                  "bg-gradient-to-br from-slate-400/10 to-slate-500/5 border-slate-400/30"
                )}>
                  <div className="absolute top-2 right-2">
                    <span className="text-3xl">🥈</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Medal className="text-slate-400" size={20} />
                    <h3 className="font-bold text-slate-400">2º Lugar</h3>
                  </div>
                  {prize2nd && prize2nd > 0 && (
                    <p className="font-display text-2xl font-bold text-slate-400 mb-3">
                      {formatCurrency(prize2nd)}
                    </p>
                  )}
                  {renderPlayerInfo(winners.second)}
                </div>
              )}

              {/* 3rd Place */}
              {(winner3rdId || prize3rd) && (
                <div className={cn(
                  "border rounded-xl p-4 relative overflow-hidden",
                  "bg-gradient-to-br from-orange-600/10 to-orange-700/5 border-orange-600/30"
                )}>
                  <div className="absolute top-2 right-2">
                    <span className="text-3xl">🥉</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Medal className="text-orange-600" size={20} />
                    <h3 className="font-bold text-orange-600">3º Lugar</h3>
                  </div>
                  {prize3rd && prize3rd > 0 && (
                    <p className="font-display text-2xl font-bold text-orange-600 mb-3">
                      {formatCurrency(prize3rd)}
                    </p>
                  )}
                  {renderPlayerInfo(winners.third)}
                </div>
              )}

              {/* MVP */}
              {(winnerMvpId || prizeMvp) && (
                <div className={cn(
                  "border rounded-xl p-4 relative overflow-hidden",
                  "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"
                )}>
                  <div className="absolute top-2 right-2">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="text-primary" size={20} />
                    <h3 className="font-bold text-primary">MVP (+Kills)</h3>
                  </div>
                  {prizeMvp && prizeMvp > 0 && (
                    <p className="font-display text-2xl font-bold text-primary mb-3">
                      {formatCurrency(prizeMvp)}
                    </p>
                  )}
                  {renderPlayerInfo(winners.mvp)}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center mt-6">
            Modo: {gameModeNames[gameMode] || gameMode}
          </p>
        </div>
      </div>
    </div>
  );
}
