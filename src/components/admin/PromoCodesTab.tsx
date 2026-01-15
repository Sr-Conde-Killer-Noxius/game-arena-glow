import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Gift,
  Users,
  Trophy,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PromoCode {
  id: string;
  code: string;
  partner_id: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  partner_name?: string;
}

interface Tournament {
  id: string;
  name: string;
}

interface CodeTournament {
  tournament_id: string;
  tournament_name: string;
}

export function PromoCodesTab() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [newMaxUses, setNewMaxUses] = useState("");
  const [codeTournaments, setCodeTournaments] = useState<string[]>([]);
  const [viewingCodeTournaments, setViewingCodeTournaments] = useState<CodeTournament[]>([]);

  useEffect(() => {
    fetchCodes();
    fetchTournaments();
  }, []);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      // Fetch codes with partner profile info
      const { data: codesData, error: codesError } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (codesError) throw codesError;

      // Get partner names
      const partnerIds = [...new Set(codesData?.map(c => c.partner_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", partnerIds);

      const profileMap = new Map(
        profilesData?.map(p => [p.id, p.full_name || p.username || "Sem nome"]) || []
      );

      const codesWithNames = codesData?.map(c => ({
        ...c,
        partner_name: profileMap.get(c.partner_id) || "Desconhecido",
      })) || [];

      setCodes(codesWithNames);
    } catch (err) {
      console.error("Error fetching codes:", err);
      toast.error("Erro ao carregar códigos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    }
  };

  const handleEditCode = async (code: PromoCode) => {
    setEditingCode(code);
    setNewMaxUses(code.max_uses.toString());

    // Fetch code tournaments
    const { data } = await supabase
      .from("promo_code_tournaments")
      .select("tournament_id")
      .eq("promo_code_id", code.id);

    setCodeTournaments(data?.map(d => d.tournament_id) || []);
  };

  const saveCodeChanges = async () => {
    if (!editingCode) return;

    try {
      // Update code
      const { error: updateError } = await supabase
        .from("promo_codes")
        .update({ max_uses: parseInt(newMaxUses) || editingCode.max_uses })
        .eq("id", editingCode.id);

      if (updateError) throw updateError;

      // Update tournament restrictions
      // First delete existing
      await supabase
        .from("promo_code_tournaments")
        .delete()
        .eq("promo_code_id", editingCode.id);

      // Then insert new ones
      if (codeTournaments.length > 0) {
        const links = codeTournaments.map(tid => ({
          promo_code_id: editingCode.id,
          tournament_id: tid,
        }));

        await supabase.from("promo_code_tournaments").insert(links);
      }

      toast.success("Código atualizado!");
      setEditingCode(null);
      fetchCodes();
    } catch (err) {
      console.error("Error updating code:", err);
      toast.error("Erro ao atualizar código");
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
      fetchCodes();
    } catch (err) {
      console.error("Error toggling code:", err);
      toast.error("Erro ao atualizar código");
    }
  };

  const deleteCode = async (code: PromoCode) => {
    if (!confirm(`Excluir o código "${code.code}"?`)) return;

    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", code.id);

      if (error) throw error;
      toast.success("Código excluído");
      fetchCodes();
    } catch (err) {
      console.error("Error deleting code:", err);
      toast.error("Erro ao excluir código");
    }
  };

  const filteredCodes = codes.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.code.toLowerCase().includes(term) ||
      c.partner_name?.toLowerCase().includes(term)
    );
  });

  // Calculate stats
  const totalCodes = codes.length;
  const activeCodes = codes.filter(c => c.is_active).length;
  const totalUses = codes.reduce((sum, c) => sum + c.current_uses, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCodes}</p>
              <p className="text-sm text-muted-foreground">Total de Códigos</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="text-green-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCodes}</p>
              <p className="text-sm text-muted-foreground">Códigos Ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Users className="text-amber-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUses}</p>
              <p className="text-sm text-muted-foreground">Ingressos Gerados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar por código ou parceiro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchCodes}>
          <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Código</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Parceiro</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Usos</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Criado</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum código encontrado
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={code.id} className="border-b border-border/50">
                    <td className="p-4">
                      <code className="bg-muted px-3 py-1 rounded font-mono text-sm">
                        {code.code}
                      </code>
                    </td>
                    <td className="p-4 text-sm">{code.partner_name}</td>
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
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditCode(code)}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </Button>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingCode} onOpenChange={() => setEditingCode(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Código: {editingCode?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Máximo de Usos</Label>
              <Input
                type="number"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                min={editingCode?.current_uses || 0}
              />
              <p className="text-xs text-muted-foreground">
                Já utilizado: {editingCode?.current_uses || 0} vezes
              </p>
            </div>

            <div className="space-y-2">
              <Label>Torneios Válidos</Label>
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
                      checked={codeTournaments.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCodeTournaments([...codeTournaments, t.id]);
                        } else {
                          setCodeTournaments(codeTournaments.filter(id => id !== t.id));
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
            <Button variant="outline" onClick={() => setEditingCode(null)}>
              Cancelar
            </Button>
            <Button onClick={saveCodeChanges}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
