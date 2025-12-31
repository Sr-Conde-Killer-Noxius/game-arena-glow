import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Ticket,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Participation {
  id: string;
  unique_token: string;
  payment_status: string;
  created_at: string;
  tournament_id: string;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para ver seus ingressos");
        return;
      }

      const { data, error } = await supabase
        .from("participations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Erro ao carregar ingressos");
        return;
      }

      setTickets(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado!");
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return {
          label: "Confirmado",
          icon: CheckCircle2,
          color: "text-primary",
          bg: "bg-primary/10",
        };
      case "pending":
        return {
          label: "Aguardando",
          icon: Clock,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        };
      case "failed":
        return {
          label: "Falhou",
          icon: XCircle,
          color: "text-destructive",
          bg: "bg-destructive/10",
        };
      case "refunded":
        return {
          label: "Reembolsado",
          icon: RefreshCw,
          color: "text-muted-foreground",
          bg: "bg-muted",
        };
      default:
        return {
          label: status,
          icon: Clock,
          color: "text-muted-foreground",
          bg: "bg-muted",
        };
    }
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Meus Ingressos
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas participações em torneios
            </p>
          </div>
          <Button variant="outline" onClick={fetchTickets} disabled={isLoading}>
            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-6 animate-pulse"
            >
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="text-muted-foreground" size={32} />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">
            Nenhum ingresso encontrado
          </h3>
          <p className="text-muted-foreground mb-6">
            Você ainda não se inscreveu em nenhum torneio
          </p>
          <Link to="/dashboard">
            <Button variant="default">Ver Torneios Disponíveis</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => {
            const statusConfig = getStatusConfig(ticket.payment_status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={ticket.id}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Ticket className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg mb-1">
                        Free Fire Pro League
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Inscrito em {formatDate(ticket.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* Status Badge */}
                    <div
                      className={cn(
                        "px-3 py-1.5 rounded-full flex items-center gap-2",
                        statusConfig.bg
                      )}
                    >
                      <StatusIcon size={14} className={statusConfig.color} />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          statusConfig.color
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Token */}
                    {ticket.payment_status === "paid" && ticket.unique_token && (
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 border border-primary/30 px-4 py-2 rounded-lg">
                          <span className="font-mono font-bold text-primary">
                            {ticket.unique_token}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToken(ticket.unique_token)}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    )}

                    {ticket.payment_status === "pending" && (
                      <p className="text-sm text-amber-500">
                        Aguardando confirmação do pagamento...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
