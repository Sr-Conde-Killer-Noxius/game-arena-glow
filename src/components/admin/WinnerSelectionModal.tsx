import { useState, useEffect } from "react";
import { X, Trophy, Medal, Target, Crown, Loader2, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";

interface Participation {
  id: string;
  player_nick: string | null;
  player_game_id: string | null;
  partner_nick: string | null;
  slot_number: number | null;
}

interface WinnerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentId: string;
  tournamentName: string;
  gameMode: string;
  prize1st?: number | null;
  prize2nd?: number | null;
  prize3rd?: number | null;
  prizeMvp?: number | null;
  currentWinner1st?: string | null;
  currentWinner2nd?: string | null;
  currentWinner3rd?: string | null;
  currentWinnerMvp?: string | null;
}

const gameModeNames: Record<string, string> = {
  solo: "Solo",
  dupla: "Dupla",
  trio: "Trio",
  squad: "Squad",
};

export function WinnerSelectionModal({
  isOpen,
  onClose,
  onSuccess,
  tournamentId,
  tournamentName,
  gameMode,
  prize1st,
  prize2nd,
  prize3rd,
  prizeMvp,
  currentWinner1st,
  currentWinner2nd,
  currentWinner3rd,
  currentWinnerMvp,
}: WinnerSelectionModalProps) {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [winner1st, setWinner1st] = useState<string | null>(currentWinner1st || null);
  const [winner2nd, setWinner2nd] = useState<string | null>(currentWinner2nd || null);
  const [winner3rd, setWinner3rd] = useState<string | null>(currentWinner3rd || null);
  const [winnerMvp, setWinnerMvp] = useState<string | null>(currentWinnerMvp || null);

  const [selectingFor, setSelectingFor] = useState<"1st" | "2nd" | "3rd" | "mvp" | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchParticipations = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("participations")
          .select("id, player_nick, player_game_id, partner_nick, slot_number")
          .eq("tournament_id", tournamentId)
          .eq("payment_status", "paid")
          .order("slot_number", { ascending: true });

        if (error) throw error;
        setParticipations(data || []);
      } catch (err) {
        console.error("Error fetching participations:", err);
        toast.error("Erro ao carregar participações");
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipations();
  }, [isOpen, tournamentId]);

  useEffect(() => {
    setWinner1st(currentWinner1st || null);
    setWinner2nd(currentWinner2nd || null);
    setWinner3rd(currentWinner3rd || null);
    setWinnerMvp(currentWinnerMvp || null);
  }, [currentWinner1st, currentWinner2nd, currentWinner3rd, currentWinnerMvp]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Use type assertion as the winner columns were just added to the schema
      const { error } = await supabase
        .from("tournaments")
        .update({
          winner_1st_id: winner1st,
          winner_2nd_id: winner2nd,
          winner_3rd_id: winner3rd,
          winner_mvp_id: winnerMvp,
        } as any)
        .eq("id", tournamentId);

      if (error) throw error;

      toast.success("Vencedores salvos com sucesso!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error saving winners:", err);
      toast.error("Erro ao salvar vencedores");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectWinner = (participationId: string) => {
    if (!selectingFor) return;

    switch (selectingFor) {
      case "1st":
        setWinner1st(participationId);
        break;
      case "2nd":
        setWinner2nd(participationId);
        break;
      case "3rd":
        setWinner3rd(participationId);
        break;
      case "mvp":
        setWinnerMvp(participationId);
        break;
    }
    setSelectingFor(null);
  };

  const clearWinner = (position: "1st" | "2nd" | "3rd" | "mvp") => {
    switch (position) {
      case "1st":
        setWinner1st(null);
        break;
      case "2nd":
        setWinner2nd(null);
        break;
      case "3rd":
        setWinner3rd(null);
        break;
      case "mvp":
        setWinnerMvp(null);
        break;
    }
  };

  const getParticipationLabel = (id: string | null) => {
    if (!id) return "Selecionar";
    const p = participations.find((p) => p.id === id);
    if (!p) return "Selecionar";
    const nick = p.player_nick || "—";
    const slot = p.slot_number ? `Slot #${p.slot_number}` : "";
    return `${nick} ${slot}`.trim();
  };

  const filteredParticipations = participations.filter((p) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      p.player_nick?.toLowerCase().includes(search) ||
      p.player_game_id?.toLowerCase().includes(search) ||
      p.partner_nick?.toLowerCase().includes(search) ||
      p.slot_number?.toString().includes(search)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Trophy className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Definir Vencedores</h2>
              <p className="text-sm text-muted-foreground">{tournamentName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : participations.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma participação confirmada neste torneio</p>
            </div>
          ) : (
            <>
              {/* Prize Positions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1st Place */}
                <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="text-amber-500" size={20} />
                    <span className="font-bold text-amber-500">1º Lugar</span>
                    {prize1st && prize1st > 0 && (
                      <span className="ml-auto text-sm text-amber-500">
                        {formatCurrency(prize1st)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectingFor === "1st" ? "default" : "outline"}
                      className="flex-1 justify-start"
                      onClick={() => setSelectingFor(selectingFor === "1st" ? null : "1st")}
                    >
                      {winner1st && <Check size={14} className="mr-2 text-primary" />}
                      {getParticipationLabel(winner1st)}
                    </Button>
                    {winner1st && (
                      <Button variant="ghost" size="icon" onClick={() => clearWinner("1st")}>
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 2nd Place */}
                <div className="border border-slate-400/30 bg-slate-400/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Medal className="text-slate-400" size={20} />
                    <span className="font-bold text-slate-400">2º Lugar</span>
                    {prize2nd && prize2nd > 0 && (
                      <span className="ml-auto text-sm text-slate-400">
                        {formatCurrency(prize2nd)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectingFor === "2nd" ? "default" : "outline"}
                      className="flex-1 justify-start"
                      onClick={() => setSelectingFor(selectingFor === "2nd" ? null : "2nd")}
                    >
                      {winner2nd && <Check size={14} className="mr-2 text-primary" />}
                      {getParticipationLabel(winner2nd)}
                    </Button>
                    {winner2nd && (
                      <Button variant="ghost" size="icon" onClick={() => clearWinner("2nd")}>
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="border border-orange-600/30 bg-orange-600/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Medal className="text-orange-600" size={20} />
                    <span className="font-bold text-orange-600">3º Lugar</span>
                    {prize3rd && prize3rd > 0 && (
                      <span className="ml-auto text-sm text-orange-600">
                        {formatCurrency(prize3rd)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectingFor === "3rd" ? "default" : "outline"}
                      className="flex-1 justify-start"
                      onClick={() => setSelectingFor(selectingFor === "3rd" ? null : "3rd")}
                    >
                      {winner3rd && <Check size={14} className="mr-2 text-primary" />}
                      {getParticipationLabel(winner3rd)}
                    </Button>
                    {winner3rd && (
                      <Button variant="ghost" size="icon" onClick={() => clearWinner("3rd")}>
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* MVP */}
                <div className="border border-primary/30 bg-primary/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="text-primary" size={20} />
                    <span className="font-bold text-primary">MVP (+Kills)</span>
                    {prizeMvp && prizeMvp > 0 && (
                      <span className="ml-auto text-sm text-primary">
                        {formatCurrency(prizeMvp)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectingFor === "mvp" ? "default" : "outline"}
                      className="flex-1 justify-start"
                      onClick={() => setSelectingFor(selectingFor === "mvp" ? null : "mvp")}
                    >
                      {winnerMvp && <Check size={14} className="mr-2 text-primary" />}
                      {getParticipationLabel(winnerMvp)}
                    </Button>
                    {winnerMvp && (
                      <Button variant="ghost" size="icon" onClick={() => clearWinner("mvp")}>
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Participation Selector */}
              {selectingFor && (
                <div className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">
                      Selecionar para{" "}
                      {selectingFor === "1st"
                        ? "1º Lugar"
                        : selectingFor === "2nd"
                        ? "2º Lugar"
                        : selectingFor === "3rd"
                        ? "3º Lugar"
                        : "MVP"}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectingFor(null)}
                      className="ml-auto"
                    >
                      Cancelar
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      placeholder="Buscar por nick, ID ou slot..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredParticipations.map((p) => {
                      const isSelected =
                        p.id === winner1st || p.id === winner2nd || p.id === winner3rd || p.id === winnerMvp;

                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelectWinner(p.id)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-colors",
                            isSelected
                              ? "border-primary/50 bg-primary/10"
                              : "border-border hover:border-primary/30 hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{p.player_nick || "—"}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {p.player_game_id || "—"}
                                {p.partner_nick && ` • Parceiro: ${p.partner_nick}`}
                              </p>
                            </div>
                            <div className="text-right">
                              {p.slot_number && (
                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                  Slot #{p.slot_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Modo: {gameModeNames[gameMode] || gameMode} • {participations.length} participante(s)
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar Vencedores
          </Button>
        </div>
      </div>
    </div>
  );
}
