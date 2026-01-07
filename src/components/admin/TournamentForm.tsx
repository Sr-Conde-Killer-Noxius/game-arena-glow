import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type GameType = Database["public"]["Enums"]["game_type"];
type TournamentStatus = Database["public"]["Enums"]["tournament_status"];
type GameMode = "solo" | "dupla" | "trio" | "squad";

// Internal form state type
interface TournamentFormState {
  name: string;
  game: GameType;
  game_mode: GameMode;
  description: string;
  rules: string;
  start_date: string;
  end_date: string;
  start_date_pending: boolean;
  end_date_pending: boolean;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  status: TournamentStatus;
  banner_url: string;
  room_id: string;
  room_password: string;
  room_pending: boolean;
}

interface TournamentFormProps {
  tournamentId?: string; // Pass only the ID, form fetches the data
  onClose: () => void;
  onSuccess: () => void;
}

const GAMES: { value: GameType; label: string }[] = [
  { value: "freefire", label: "Free Fire" },
  { value: "valorant", label: "Valorant" },
  { value: "cs2", label: "CS2" },
  { value: "pubg", label: "PUBG Mobile" },
  { value: "codmobile", label: "COD Mobile" },
  { value: "wildrift", label: "Wild Rift" },
];

const STATUSES: { value: TournamentStatus; label: string }[] = [
  { value: "upcoming", label: "Em Breve" },
  { value: "open", label: "Inscrições Abertas" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "finished", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
];

const GAME_MODES: { value: GameMode; label: string; players: number }[] = [
  { value: "solo", label: "Solo", players: 1 },
  { value: "dupla", label: "Dupla", players: 2 },
  { value: "trio", label: "Trio", players: 3 },
  { value: "squad", label: "Squad", players: 4 },
];

// Helper to format date to local datetime-local input value
const formatToLocalDatetime = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper to get time only from datetime-local value
const getTimeFromDatetime = (datetimeValue: string): string => {
  if (!datetimeValue) return "";
  const parts = datetimeValue.split("T");
  return parts[1] || "";
};

// Helper to combine date and time
const combineDateAndTime = (date: string, time: string): string => {
  if (!time) return "";
  if (!date) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    date = `${year}-${month}-${day}`;
  }
  return `${date}T${time}`;
};

// Default form state for new tournaments
const getDefaultFormState = (): TournamentFormState => ({
  name: "",
  game: "freefire",
  game_mode: "solo",
  description: "",
  rules: "",
  start_date: "",
  end_date: "",
  start_date_pending: false,
  end_date_pending: false,
  entry_fee: 0,
  prize_pool: 0,
  max_participants: 100,
  status: "upcoming",
  banner_url: "",
  room_id: "",
  room_password: "",
  room_pending: true,
});

export function TournamentForm({ tournamentId, onClose, onSuccess }: TournamentFormProps) {
  const isEditing = !!tournamentId;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [formData, setFormData] = useState<TournamentFormState>(getDefaultFormState());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Fetch tournament data from database when editing
  useEffect(() => {
    if (!tournamentId) return;

    const fetchTournament = async () => {
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", tournamentId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast.error("Torneio não encontrado");
          onClose();
          return;
        }

        // Map database data to form state
        const startDatetime = formatToLocalDatetime(data.start_date);
        const endDatetime = formatToLocalDatetime(data.end_date);

        setFormData({
          name: data.name,
          game: data.game,
          game_mode: data.game_mode as GameMode,
          description: data.description || "",
          rules: data.rules || "",
          start_date: startDatetime,
          end_date: endDatetime,
          start_date_pending: data.start_date_pending,
          end_date_pending: data.end_date_pending,
          entry_fee: Number(data.entry_fee),
          prize_pool: Number(data.prize_pool),
          max_participants: data.max_participants ?? 100,
          status: data.status,
          banner_url: data.banner_url || "",
          room_id: data.room_id || "",
          room_password: data.room_password || "",
          room_pending: data.room_pending,
        });

        // Set time states from the fetched dates
        setStartTime(getTimeFromDatetime(startDatetime));
        setEndTime(getTimeFromDatetime(endDatetime));
      } catch (err) {
        console.error("Error fetching tournament:", err);
        toast.error("Erro ao carregar dados do torneio");
      } finally {
        setIsFetching(false);
      }
    };

    fetchTournament();
  }, [tournamentId, onClose]);

  // Calculate total slots based on game_mode
  const getPlayersPerSlot = () => {
    return GAME_MODES.find(m => m.value === formData.game_mode)?.players || 1;
  };
  const totalSlots = Math.floor(formData.max_participants / getPlayersPerSlot());

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Build the start_date and end_date
      let startDateValue = formData.start_date;
      let endDateValue = formData.end_date;

      // If pending, we still need a time but use current date as placeholder
      if (formData.start_date_pending && startTime) {
        startDateValue = combineDateAndTime("", startTime);
      }
      if (formData.end_date_pending && endTime) {
        endDateValue = combineDateAndTime("", endTime);
      }

      const payload = {
        name: formData.name,
        game: formData.game,
        game_mode: formData.game_mode,
        description: formData.description || null,
        rules: formData.rules || null,
        start_date: startDateValue ? new Date(startDateValue).toISOString() : new Date().toISOString(),
        end_date: endDateValue ? new Date(endDateValue).toISOString() : null,
        start_date_pending: formData.start_date_pending,
        end_date_pending: formData.end_date_pending,
        entry_fee: formData.entry_fee,
        prize_pool: formData.prize_pool,
        max_participants: formData.max_participants,
        status: formData.status,
        banner_url: formData.banner_url || null,
        room_id: formData.room_id || null,
        room_password: formData.room_password || null,
        room_pending: formData.room_pending,
      };

      if (isEditing && tournamentId) {
        const { error } = await supabase
          .from("tournaments")
          .update(payload)
          .eq("id", tournamentId);

        if (error) throw error;
        toast.success("Torneio atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("tournaments").insert(payload);

        if (error) throw error;
        toast.success("Torneio criado com sucesso!");
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error saving tournament:", err);
      toast.error("Erro ao salvar torneio");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="bg-card border border-border rounded-xl p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Carregando dados do torneio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-display text-xl font-bold">
            {isEditing ? "Editar Torneio" : "Novo Torneio"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Torneio *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Campeonato FF Brasil"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="game">Jogo *</Label>
              <Select
                value={formData.game}
                onValueChange={(value: GameType) =>
                  setFormData((prev) => ({ ...prev, game: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o jogo" />
                </SelectTrigger>
                <SelectContent>
                  {GAMES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="game_mode">Modo de Jogo *</Label>
              <Select
                value={formData.game_mode}
                onValueChange={(value: GameMode) =>
                  setFormData((prev) => ({ ...prev, game_mode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modo" />
                </SelectTrigger>
                <SelectContent>
                  {GAME_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label} ({m.players} jogador{m.players > 1 ? "es" : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.max_participants} vagas = {totalSlots} slots
              </p>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="start_date_pending"
                  checked={formData.start_date_pending}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, start_date_pending: !!checked }))
                  }
                />
                <Label htmlFor="start_date_pending" className="text-sm cursor-pointer">
                  Aguardando (data a definir)
                </Label>
              </div>
              {formData.start_date_pending ? (
                <div className="space-y-2">
                  <Label htmlFor="start_time" className="text-xs text-muted-foreground">Horário de Início</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <Input
                  id="start_date"
                  name="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="end_date_pending"
                  checked={formData.end_date_pending}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, end_date_pending: !!checked }))
                  }
                />
                <Label htmlFor="end_date_pending" className="text-sm cursor-pointer">
                  Aguardando (data a definir)
                </Label>
              </div>
              {formData.end_date_pending ? (
                <div className="space-y-2">
                  <Label htmlFor="end_time" className="text-xs text-muted-foreground">Horário de Término</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              ) : (
                <Input
                  id="end_date"
                  name="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={handleChange}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_fee">Taxa de Inscrição (R$) *</Label>
              <Input
                id="entry_fee"
                name="entry_fee"
                type="number"
                step="0.01"
                min="0"
                value={formData.entry_fee}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prize_pool">Premiação (R$) *</Label>
              <Input
                id="prize_pool"
                name="prize_pool"
                type="number"
                step="0.01"
                min="0"
                value={formData.prize_pool}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participants">Máx. Participantes</Label>
              <Input
                id="max_participants"
                name="max_participants"
                type="number"
                min="1"
                value={formData.max_participants}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TournamentStatus) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner_url">URL do Banner</Label>
            <Input
              id="banner_url"
              name="banner_url"
              value={formData.banner_url}
              onChange={handleChange}
              placeholder="https://exemplo.com/banner.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrição do torneio..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Regras</Label>
            <Textarea
              id="rules"
              name="rules"
              value={formData.rules}
              onChange={handleChange}
              placeholder="Regras do torneio..."
              rows={4}
            />
          </div>

          {/* Room Configuration Section */}
          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Configuração da Sala (Entrar na Play)
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="room_pending"
                checked={formData.room_pending}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, room_pending: !!checked }))
                }
              />
              <Label htmlFor="room_pending" className="text-sm cursor-pointer">
                Sala pendente (usuários verão "Aguardando")
              </Label>
            </div>
            {!formData.room_pending && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room_id">ID da Sala</Label>
                  <Input
                    id="room_id"
                    name="room_id"
                    value={formData.room_id}
                    onChange={handleChange}
                    placeholder="Ex: 123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room_password">Senha da Sala</Label>
                  <Input
                    id="room_password"
                    name="room_password"
                    value={formData.room_password}
                    onChange={handleChange}
                    placeholder="Ex: abc123"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Torneio"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
