import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Users,
  Trophy,
  Ticket,
  Plus,
  Check,
  X,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tab = "tournaments" | "participations";

interface Tournament {
  id: string;
  name: string;
  game: string;
  start_date: string;
  entry_fee: number;
  prize_pool: number;
  status: string;
}

interface Participation {
  id: string;
  user_id: string;
  tournament_id: string;
  unique_token: string;
  payment_status: string;
  created_at: string;
  profiles: {
    username: string | null;
    full_name: string | null;
  } | null;
  tournaments: {
    name: string;
  } | null;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("participations");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === "tournaments") {
        fetchTournaments();
      } else {
        fetchParticipations();
      }
    }
  }, [isAdmin, activeTab]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!error && data !== null);
    } catch {
      setIsAdmin(false);
    }
  };

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
      toast.error("Erro ao carregar torneios");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParticipations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("participations")
        .select(`
          *,
          profiles:user_id (username, full_name),
          tournaments:tournament_id (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setParticipations(data || []);
    } catch (err) {
      console.error("Error fetching participations:", err);
      toast.error("Erro ao carregar participações");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async (participationId: string) => {
    try {
      // Generate unique token
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randomPart = "";
      for (let i = 0; i < 5; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const uniqueToken = `JPG-FF-${randomPart}`;

      const { error } = await supabase
        .from("participations")
        .update({
          payment_status: "paid",
          unique_token: uniqueToken,
        })
        .eq("id", participationId);

      if (error) throw error;

      toast.success("Pagamento confirmado!");
      fetchParticipations();
    } catch (err) {
      console.error("Error confirming payment:", err);
      toast.error("Erro ao confirmar pagamento");
    }
  };

  const rejectPayment = async (participationId: string) => {
    try {
      const { error } = await supabase
        .from("participations")
        .update({ payment_status: "failed" })
        .eq("id", participationId);

      if (error) throw error;

      toast.success("Pagamento rejeitado");
      fetchParticipations();
    } catch (err) {
      console.error("Error rejecting payment:", err);
      toast.error("Erro ao rejeitar pagamento");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "bg-amber-500/10 text-amber-500" },
      paid: { label: "Pago", color: "bg-primary/10 text-primary" },
      failed: { label: "Falhou", color: "bg-destructive/10 text-destructive" },
      refunded: { label: "Reembolsado", color: "bg-muted text-muted-foreground" },
    };
    const c = config[status] || config.pending;
    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", c.color)}>
        {c.label}
      </span>
    );
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

  const filteredParticipations = participations.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.unique_token?.toLowerCase().includes(searchLower) ||
      p.profiles?.username?.toLowerCase().includes(searchLower) ||
      p.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      p.payment_status.toLowerCase().includes(searchLower)
    );
  });

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
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
          <Shield className="text-primary" size={28} />
          <h1 className="font-display text-3xl font-bold">Painel Admin</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie torneios e participações
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "participations" ? "default" : "outline"}
          onClick={() => setActiveTab("participations")}
        >
          <Ticket size={18} />
          Participações
        </Button>
        <Button
          variant={activeTab === "tournaments" ? "default" : "outline"}
          onClick={() => setActiveTab("tournaments")}
        >
          <Trophy size={18} />
          Torneios
        </Button>
      </div>

      {/* Content */}
      {activeTab === "participations" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder="Buscar por token, nome ou status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchParticipations}>
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
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Usuário
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Torneio
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Token
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Data
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
                  ) : filteredParticipations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-muted-foreground"
                      >
                        Nenhuma participação encontrada
                      </td>
                    </tr>
                  ) : (
                    filteredParticipations.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="p-4">
                          <p className="font-medium">
                            {p.profiles?.full_name || p.profiles?.username || "—"}
                          </p>
                        </td>
                        <td className="p-4">
                          <p>{p.tournaments?.name || "—"}</p>
                        </td>
                        <td className="p-4">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {p.unique_token || "—"}
                          </code>
                        </td>
                        <td className="p-4">{getStatusBadge(p.payment_status)}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(p.created_at)}
                        </td>
                        <td className="p-4">
                          {p.payment_status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={() => confirmPayment(p.id)}
                              >
                                <Check size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => rejectPayment(p.id)}
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tournaments" && (
        <div className="space-y-4">
          <div className="flex justify-end">
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
              <p className="text-sm text-muted-foreground mt-1">
                Use o SQL Editor do Supabase para adicionar torneios
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg">{t.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t.game} • {formatDate(t.start_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold text-primary">
                        R$ {t.prize_pool}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Entrada: R$ {t.entry_fee}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
