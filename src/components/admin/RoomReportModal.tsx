import { useState, useEffect } from "react";
import { X, Users, Loader2, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  slot_number: number | null;
  player_nick: string | null;
  player_game_id: string | null;
  partner_nick: string | null;
  partner_game_id: string | null;
  partner_2_nick: string | null;
  partner_2_game_id: string | null;
  partner_3_nick: string | null;
  partner_3_game_id: string | null;
}

interface SlotGroup {
  slot: number;
  players: {
    nick: string;
    gameId: string;
    role: string;
  }[];
}

interface RoomReportModalProps {
  tournamentId: string;
  tournamentName: string;
  gameMode: string;
  onClose: () => void;
}

const gameModeNames: Record<string, string> = {
  solo: "Solo",
  dupla: "Dupla",
  trio: "Trio",
  squad: "Squad",
};

export function RoomReportModal({
  tournamentId,
  tournamentName,
  gameMode,
  onClose,
}: RoomReportModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedSlot, setCopiedSlot] = useState<number | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, [tournamentId]);

  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("participations")
        .select(
          "id, slot_number, player_nick, player_game_id, partner_nick, partner_game_id, partner_2_nick, partner_2_game_id, partner_3_nick, partner_3_game_id"
        )
        .eq("tournament_id", tournamentId)
        .eq("payment_status", "paid")
        .order("slot_number", { ascending: true });

      if (error) throw error;
      setParticipants(data || []);
    } catch (err) {
      console.error("Error fetching participants:", err);
      toast.error("Erro ao carregar participantes");
    } finally {
      setIsLoading(false);
    }
  };

  // Group participants by slot
  const groupBySlot = (): SlotGroup[] => {
    const slotMap = new Map<number, SlotGroup>();

    participants.forEach((p) => {
      const slotNum = p.slot_number || 0;

      if (!slotMap.has(slotNum)) {
        slotMap.set(slotNum, { slot: slotNum, players: [] });
      }

      const group = slotMap.get(slotNum)!;

      // Add main player
      if (p.player_nick || p.player_game_id) {
        group.players.push({
          nick: p.player_nick || "-",
          gameId: p.player_game_id || "-",
          role: "Jogador",
        });
      }

      // Add partner 1 (for dupla, trio, squad)
      if (
        (gameMode === "dupla" || gameMode === "trio" || gameMode === "squad") &&
        (p.partner_nick || p.partner_game_id)
      ) {
        group.players.push({
          nick: p.partner_nick || "-",
          gameId: p.partner_game_id || "-",
          role: "Parceiro 1",
        });
      }

      // Add partner 2 (for trio, squad)
      if (
        (gameMode === "trio" || gameMode === "squad") &&
        (p.partner_2_nick || p.partner_2_game_id)
      ) {
        group.players.push({
          nick: p.partner_2_nick || "-",
          gameId: p.partner_2_game_id || "-",
          role: "Parceiro 2",
        });
      }

      // Add partner 3 (for squad)
      if (gameMode === "squad" && (p.partner_3_nick || p.partner_3_game_id)) {
        group.players.push({
          nick: p.partner_3_nick || "-",
          gameId: p.partner_3_game_id || "-",
          role: "Parceiro 3",
        });
      }
    });

    return Array.from(slotMap.values()).sort((a, b) => a.slot - b.slot);
  };

  const slotGroups = groupBySlot();

  const copySlotInfo = (group: SlotGroup) => {
    const text = `Slot #${group.slot}\n${group.players
      .map((p) => `${p.nick} - ID: ${p.gameId}`)
      .join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedSlot(group.slot);
    setTimeout(() => setCopiedSlot(null), 2000);
    toast.success("Copiado para a área de transferência!");
  };

  const exportToText = () => {
    let content = `RELATÓRIO DE SALA\n${tournamentName}\nModo: ${gameModeNames[gameMode] || gameMode}\n\n`;

    slotGroups.forEach((group) => {
      content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      content += `SLOT #${group.slot}\n`;
      content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      group.players.forEach((p) => {
        content += `${p.role}: ${p.nick} | ID: ${p.gameId}\n`;
      });
      content += `\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sala-${tournamentName.replace(/\s+/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-xl flex items-center gap-2">
              <Users className="text-primary" size={24} />
              Relatório da Sala
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tournamentName} • {gameModeNames[gameMode] || gameMode}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToText}>
              <Download size={14} />
              Exportar
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : slotGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">
                Nenhum participante confirmado ainda
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {slotGroups.map((group) => (
                <div
                  key={group.slot}
                  className="bg-muted/30 border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-display font-bold text-lg">
                        {group.slot}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Slot
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copySlotInfo(group)}
                    >
                      {copiedSlot === group.slot ? (
                        <Check size={14} className="text-primary" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {group.players.map((player, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg",
                          idx === 0 ? "bg-primary/10" : "bg-muted/50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{player.nick}</p>
                          <p className="text-xs text-muted-foreground">
                            {player.role}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm text-primary">
                            {player.gameId}
                          </p>
                          <p className="text-xs text-muted-foreground">ID</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Total: {slotGroups.length} slots •{" "}
              {slotGroups.reduce((acc, g) => acc + g.players.length, 0)} jogadores
            </span>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
