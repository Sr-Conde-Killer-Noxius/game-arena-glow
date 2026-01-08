import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Ticket, Key, Lock, Clock, GamepadIcon } from "lucide-react";

interface RoomInfo {
  tournamentName: string;
  roomId: string | null;
  roomPassword: string | null;
  roomPending: boolean;
  slotNumber: number | null;
}

export default function EntrarNaPlayPage() {
  const [ticketToken, setTicketToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCheckTicket = async () => {
    if (!ticketToken.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o número do ingresso.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setRoomInfo(null);

    try {
      // First, find the participation by unique_token
      const { data: participation, error: partError } = await supabase
        .from("participations")
        .select("id, tournament_id, payment_status, slot_number")
        .eq("unique_token", ticketToken.trim())
        .maybeSingle();

      if (partError) throw partError;

      if (!participation) {
        setError("Ingresso não encontrado. Verifique o número informado.");
        setIsLoading(false);
        return;
      }

      if (participation.payment_status !== "paid") {
        setError("Este ingresso ainda não foi pago. Complete o pagamento para acessar a sala.");
        setIsLoading(false);
        return;
      }

      let slotNumber = participation.slot_number;

      // Auto-repair: If paid but no slot, call check-payment-status to repair
      if (slotNumber == null) {
        console.log("Slot missing for paid ticket, attempting repair...");
        try {
          const { data: repairData, error: repairError } = await supabase.functions.invoke(
            "check-payment-status",
            { body: { participationId: participation.id } }
          );
          
          if (!repairError && repairData?.slotNumber != null) {
            slotNumber = repairData.slotNumber;
            console.log("Slot repaired:", slotNumber);
          }
        } catch (repairErr) {
          console.error("Error repairing slot:", repairErr);
        }
      }

      // Get tournament room info
      const { data: tournament, error: tournError } = await supabase
        .from("tournaments")
        .select("name, room_id, room_password, room_pending")
        .eq("id", participation.tournament_id)
        .single();

      if (tournError) throw tournError;

      setRoomInfo({
        tournamentName: tournament.name,
        roomId: tournament.room_id,
        roomPassword: tournament.room_password,
        roomPending: tournament.room_pending,
        slotNumber: slotNumber,
      });
    } catch (err) {
      console.error("Error checking ticket:", err);
      setError("Ocorreu um erro ao verificar o ingresso. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCheckTicket();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <GamepadIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Entrar na Play
        </h1>
        <p className="text-muted-foreground">
          Insira o número do seu ingresso para acessar a sala do torneio
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Verificar Ingresso
          </CardTitle>
          <CardDescription>
            Digite o token único do seu ingresso (encontrado na ficha do ingresso)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Ex: a1b2c3d4e5f6..."
              value={ticketToken}
              onChange={(e) => setTicketToken(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleCheckTicket} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verificar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {roomInfo && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">{roomInfo.tournamentName}</CardTitle>
          </CardHeader>
          <CardContent>
            {roomInfo.roomPending ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-warning" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">Aguardando Configuração</h3>
                  <p className="text-muted-foreground">
                    O ID da sala e senha ainda não foram definidos pelo administrador.
                    <br />
                    Por favor, aguarde e verifique novamente em breve.
                  </p>
                  {roomInfo.slotNumber && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-sm text-muted-foreground mb-1">Seu Slot</p>
                      <p className="text-2xl font-bold text-amber-500">#{roomInfo.slotNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Slot */}
                {roomInfo.slotNumber && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                      <Ticket className="w-4 h-4 text-amber-500" />
                      <span className="text-sm">Seu Slot</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-500">
                      #{roomInfo.slotNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use este número ao entrar na sala e no Discord
                    </p>
                  </div>
                )}
                
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Key className="w-4 h-4" />
                    <span className="text-sm">ID da Sala</span>
                  </div>
                  <p className="text-2xl font-mono font-bold text-foreground">
                    {roomInfo.roomId || "—"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Senha</span>
                  </div>
                  <p className="text-2xl font-mono font-bold text-foreground">
                    {roomInfo.roomPassword || "—"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Guarde essas informações! Você pode consultar novamente a qualquer momento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
