import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface Tournament {
  id?: string;
  name: string;
  game: GameType;
  description: string;
  rules: string;
  start_date: string;
  end_date: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  status: TournamentStatus;
  banner_url: string;
}

interface TournamentFormProps {
  tournament?: Tournament;
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

export function TournamentForm({ tournament, onClose, onSuccess }: TournamentFormProps) {
  const isEditing = !!tournament?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Tournament>({
    name: tournament?.name || "",
    game: tournament?.game || "freefire",
    description: tournament?.description || "",
    rules: tournament?.rules || "",
    start_date: tournament?.start_date
      ? new Date(tournament.start_date).toISOString().slice(0, 16)
      : "",
    end_date: tournament?.end_date
      ? new Date(tournament.end_date).toISOString().slice(0, 16)
      : "",
    entry_fee: tournament?.entry_fee || 0,
    prize_pool: tournament?.prize_pool || 0,
    max_participants: tournament?.max_participants || 100,
    status: tournament?.status || "upcoming",
    banner_url: tournament?.banner_url || "",
  });

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
      const payload = {
        name: formData.name,
        game: formData.game,
        description: formData.description || null,
        rules: formData.rules || null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        entry_fee: formData.entry_fee,
        prize_pool: formData.prize_pool,
        max_participants: formData.max_participants,
        status: formData.status,
        banner_url: formData.banner_url || null,
      };

      if (isEditing && tournament?.id) {
        const { error } = await supabase
          .from("tournaments")
          .update(payload)
          .eq("id", tournament.id);

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
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                name="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={handleChange}
              />
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
