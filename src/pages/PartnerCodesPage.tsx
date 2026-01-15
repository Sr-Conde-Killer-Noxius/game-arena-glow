import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Gift,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Users,
  Trophy,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PromoCode {
  id: string;
  code: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
}

interface Tournament {
  id: string;
  name: string;
  game: string;
}

interface PartnerSettings {
  max_codes: number;
}

export default function PartnerCodesPage() {
  const { user, isPartner, isAdmin } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [settings, setSettings] = useState<PartnerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCodeName, setNewCodeName] = useState("");
  const [newCodeMaxUses, setNewCodeMaxUses] = useState("10");
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([]);

  useEffect(() => {
    if (isPartner || isAdmin) {
      setIsAuthorized(true);
      fetchData();
    } else if (isPartner === false && isAdmin === false) {
      setIsAuthorized(false);
    }
  }, [isPartner, isAdmin, user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch promo codes
      const { data: codesData, error: codesError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("partner_id", user.id)
        .order("created_at", { ascending: false });

      if (codesError) throw codesError;
      setCodes(codesData || []);

      // Fetch tournaments for selection
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select("id, name, game")
        .order("start_date", { ascending: false });

      if (tournamentsError) throw tournamentsError;
      setTournaments(tournamentsData || []);

      // Fetch partner settings
      const { data: settingsData } = await supabase
        .from("partner_settings")
        .select("max_codes")
        .eq("user_id", user.id)
        .maybeSingle();

      setSettings(settingsData || { max_codes: 5 });
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCode = async () => {
    if (!user || !newCodeName.trim()) {
      toast.error("Digite um nome para o código");
      return;
    }

    // Check code limit
    const maxCodes = settings?.max_codes || 5;
    if (codes.length >= maxCodes) {
      toast.error(`Você atingiu o limite de ${maxCodes} códigos`);
      return;
    }

    setIsCreating(true);

    try {
      // Create promo code
      const { data: codeData, error: codeError } = await supabase
        .from("promo_codes")
        .insert({
          code: newCodeName.trim().toLowerCase(),
          partner_id: user.id,
          max_uses: parseInt(newCodeMaxUses) || 10,
          is_active: true,
        })
        .select()
        .single();

      if (codeError) {
        if (codeError.code === "23505") {
          toast.error("Este código já existe. Escolha outro nome.");
        } else {
          throw codeError;
        }
        return;
      }

      // If specific tournaments selected, add restrictions
      if (selectedTournaments.length > 0) {
        const tournamentLinks = selectedTournaments.map(tid => ({
          promo_code_id: codeData.id,
          tournament_id: tid,
        }));

        const { error: linkError } = await supabase
          .from("promo_code_tournaments")
          .insert(tournamentLinks);

        if (linkError) {
          console.error("Error linking tournaments:", linkError);
        }
      }

      toast.success("Código criado com sucesso!");
      setShowCreateDialog(false);
      setNewCodeName("");
      setNewCodeMaxUses("10");
      setSelectedTournaments([]);
      fetchData();
    } catch (err) {
      console.error("Error creating code:", err);
      toast.error("Erro ao criar código");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCodeStatus = async (code: PromoCode) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !code.is_active })
        .eq("id", code.id);

      if (error) throw error;
      toast.success(code.is_active ? "Código desativado" : "Código ativado");
      fetchData();
    } catch (err) {
      console.error("Error toggling code:", err);
      toast.error("Erro ao atualizar código");
    }
  };

  const deleteCode = async (code: PromoCode) => {
    if (!confirm(`Tem certeza que deseja excluir o código "${code.code}"?`)) return;

    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", code.id);

      if (error) throw error;
      toast.success("Código excluído");
      fetchData();
    } catch (err) {
      console.error("Error deleting code:", err);
      toast.error("Erro ao excluir código");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  const maxCodes = settings?.max_codes || 5;
  const remainingCodes = maxCodes - codes.length;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Voltar ao Dashboard</span>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Gift className="text-primary" size={28} />
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Meus Códigos Promocionais</h1>
        </div>
        <p className="text-muted-foreground">
          Crie códigos para que players entrem gratuitamente nos torneios
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{codes.length}</p>
              <p className="text-sm text-muted-foreground">Códigos Criados</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="text-green-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {codes.reduce((sum, c) => sum + c.current_uses, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total de Usos</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Trophy className="text-amber-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{remainingCodes}</p>
              <p className="text-sm text-muted-foreground">Códigos Disponíveis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          onClick={() => setShowCreateDialog(true)}
          disabled={remainingCodes <= 0}
        >
          <Plus size={18} />
          Criar Código
        </Button>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Codes List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Código</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Usos</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Criado em</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Você ainda não criou nenhum código
                  </td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr key={code.id} className="border-b border-border/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-3 py-1 rounded font-mono text-sm">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyCode(code.code)}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "font-medium",
                        code.current_uses >= code.max_uses && "text-destructive"
                      )}>
                        {code.current_uses} / {code.max_uses}
                      </span>
                    </td>
                    <td className="p-4">
                      {code.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          <CheckCircle size={12} />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          <XCircle size={12} />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(code.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCodeStatus(code)}
                        >
                          {code.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteCode(code)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Code Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Código</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Código</Label>
              <Input
                placeholder="Ex: parceiro2024"
                value={newCodeName}
                onChange={(e) => setNewCodeName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas e números
              </p>
            </div>

            <div className="space-y-2">
              <Label>Máximo de Usos</Label>
              <Select value={newCodeMaxUses} onValueChange={setNewCodeMaxUses}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 usos</SelectItem>
                  <SelectItem value="10">10 usos</SelectItem>
                  <SelectItem value="20">20 usos</SelectItem>
                  <SelectItem value="50">50 usos</SelectItem>
                  <SelectItem value="100">100 usos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Válido para (opcional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Deixe vazio para funcionar em todos os torneios
              </p>
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                {tournaments.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTournaments.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTournaments([...selectedTournaments, t.id]);
                        } else {
                          setSelectedTournaments(selectedTournaments.filter(id => id !== t.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCode} disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar Código"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
