import { useState, useEffect } from "react";
import { Search, RefreshCw, Check, X, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Participation {
  id: string;
  user_id: string;
  tournament_id: string;
  unique_token: string;
  payment_status: string;
  created_at: string;
  screenshot_1_url: string | null;
  screenshot_2_url: string | null;
  screenshot_3_url: string | null;
  screenshot_4_url: string | null;
  profiles: {
    username: string | null;
    full_name: string | null;
    whatsapp: string | null;
  } | null;
  tournaments: {
    name: string;
    entry_fee: number;
  } | null;
}

export function TicketsTab() {
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingScreenshots, setViewingScreenshots] = useState<Participation | null>(null);

  useEffect(() => {
    fetchParticipations();
  }, []);

  const fetchParticipations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("participations")
        .select(`
          *,
          profiles:user_id (username, full_name, whatsapp),
          tournaments:tournament_id (name, entry_fee)
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
    if (!confirm("Tem certeza que deseja rejeitar este pagamento?")) return;

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
      failed: { label: "Rejeitado", color: "bg-destructive/10 text-destructive" },
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

  const getScreenshots = (p: Participation) => {
    return [
      p.screenshot_1_url,
      p.screenshot_2_url,
      p.screenshot_3_url,
      p.screenshot_4_url,
    ].filter(Boolean) as string[];
  };

  const filteredParticipations = participations.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.unique_token?.toLowerCase().includes(term) ||
      p.profiles?.username?.toLowerCase().includes(term) ||
      p.profiles?.full_name?.toLowerCase().includes(term) ||
      p.tournaments?.name?.toLowerCase().includes(term) ||
      p.payment_status.toLowerCase().includes(term)
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
            placeholder="Buscar por token, nome, torneio ou status..."
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
                  Valor
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Prints
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
                  <td colSpan={8} className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredParticipations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhuma inscrição encontrada
                  </td>
                </tr>
              ) : (
                filteredParticipations.map((p) => {
                  const screenshots = getScreenshots(p);
                  return (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="p-4">
                        <p className="font-medium">
                          {p.profiles?.full_name || p.profiles?.username || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.profiles?.whatsapp || "Sem WhatsApp"}
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
                      <td className="p-4 font-medium">
                        R$ {p.tournaments?.entry_fee?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-4">{getStatusBadge(p.payment_status)}</td>
                      <td className="p-4">
                        {screenshots.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary"
                            onClick={() => setViewingScreenshots(p)}
                          >
                            <Eye size={16} className="mr-1" />
                            {screenshots.length} print(s)
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Nenhum
                          </span>
                        )}
                      </td>
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
                              title="Aprovar"
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => rejectPayment(p.id)}
                              title="Rejeitar"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screenshots Dialog */}
      <Dialog
        open={!!viewingScreenshots}
        onOpenChange={() => setViewingScreenshots(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Screenshots de Comprovante -{" "}
              {viewingScreenshots?.profiles?.full_name ||
                viewingScreenshots?.profiles?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {viewingScreenshots &&
              getScreenshots(viewingScreenshots).map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-video bg-muted rounded-lg overflow-hidden"
                >
                  <img
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-2 bg-background/80 rounded-lg hover:bg-background transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              ))}
          </div>
          <div className="flex justify-end gap-3">
            {viewingScreenshots?.payment_status === "pending" && (
              <>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    rejectPayment(viewingScreenshots.id);
                    setViewingScreenshots(null);
                  }}
                >
                  <X size={16} className="mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => {
                    confirmPayment(viewingScreenshots.id);
                    setViewingScreenshots(null);
                  }}
                >
                  <Check size={16} className="mr-2" />
                  Aprovar
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
