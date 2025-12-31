import { useState, useEffect } from "react";
import { Search, RefreshCw, Edit2, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type UserRank = Database["public"]["Enums"]["user_rank"];

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  rank: UserRank;
  points: number | null;
  kda_global: number | null;
  hs_rate: number | null;
  cpf: string | null;
  whatsapp: string | null;
  is_banned: boolean;
  created_at: string;
}

const RANKS: UserRank[] = ["D", "C", "B", "A", "S", "PRO"];

export function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [newRank, setNewRank] = useState<UserRank>("D");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers((data as Profile[]) || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRank = (user: Profile) => {
    setEditingUser(user);
    setNewRank(user.rank);
  };

  const saveRank = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ rank: newRank })
        .eq("id", editingUser.id);

      if (error) throw error;
      toast.success("Rank atualizado com sucesso!");
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Error updating rank:", err);
      toast.error("Erro ao atualizar rank");
    }
  };

  const toggleBan = async (user: Profile) => {
    const action = user.is_banned ? "desbanir" : "banir";
    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !user.is_banned })
        .eq("id", user.id);

      if (error) throw error;
      toast.success(
        user.is_banned ? "Usuário desbanido!" : "Usuário banido!"
      );
      fetchUsers();
    } catch (err) {
      console.error("Error toggling ban:", err);
      toast.error(`Erro ao ${action} usuário`);
    }
  };

  const getRankColor = (rank: UserRank) => {
    const colors: Record<UserRank, string> = {
      D: "bg-muted text-muted-foreground",
      C: "bg-blue-500/10 text-blue-500",
      B: "bg-green-500/10 text-green-500",
      A: "bg-purple-500/10 text-purple-500",
      S: "bg-amber-500/10 text-amber-500",
      PRO: "bg-primary/10 text-primary",
    };
    return colors[rank];
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.username?.toLowerCase().includes(term) ||
      u.full_name?.toLowerCase().includes(term) ||
      u.cpf?.includes(searchTerm) ||
      u.whatsapp?.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar por nome, CPF ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchUsers}>
          <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Usuário
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Contato
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Rank
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Stats
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      "border-b border-border/50",
                      user.is_banned && "bg-destructive/5"
                    )}
                  >
                    <td className="p-4">
                      <p className="font-medium">
                        {user.full_name || user.username || "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{user.username || "sem-username"}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{user.whatsapp || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.cpf || "—"}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          getRankColor(user.rank)
                        )}
                      >
                        {user.rank}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      <p>Pts: {user.points || 0}</p>
                      <p>
                        KDA: {user.kda_global?.toFixed(2) || "0.00"} | HS:{" "}
                        {user.hs_rate?.toFixed(1) || "0.0"}%
                      </p>
                    </td>
                    <td className="p-4">
                      {user.is_banned ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                          Banido
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          onClick={() => handleEditRank(user)}
                          title="Editar Rank"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            user.is_banned
                              ? "text-primary hover:bg-primary/10"
                              : "text-destructive hover:bg-destructive/10"
                          )}
                          onClick={() => toggleBan(user)}
                          title={user.is_banned ? "Desbanir" : "Banir"}
                        >
                          {user.is_banned ? (
                            <CheckCircle size={16} />
                          ) : (
                            <Ban size={16} />
                          )}
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

      {/* Edit Rank Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rank do Jogador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Jogador:{" "}
              <span className="text-foreground font-medium">
                {editingUser?.full_name || editingUser?.username}
              </span>
            </p>
            <div className="space-y-2">
              <Label>Novo Rank</Label>
              <Select
                value={newRank}
                onValueChange={(value: UserRank) => setNewRank(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANKS.map((r) => (
                    <SelectItem key={r} value={r}>
                      Rank {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={saveRank}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
