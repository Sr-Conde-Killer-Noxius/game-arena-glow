import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface WebhookLog {
  id: string;
  source: string;
  method: string;
  headers: Record<string, string> | null;
  body: unknown;
  query_params: Record<string, string> | null;
  status_code: number | null;
  response: unknown;
  error_message: string | null;
  created_at: string;
}

interface WebhookStats {
  total: number;
  success: number;
  errors: number;
  pending: number;
}

export function WebhooksTab() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState<WebhookStats>({
    total: 0,
    success: 0,
    errors: 0,
    pending: 0,
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const logsData = (data as WebhookLog[]) || [];
      setLogs(logsData);

      // Calculate stats
      const total = logsData.length;
      const success = logsData.filter(
        (l) => l.status_code && l.status_code >= 200 && l.status_code < 300
      ).length;
      const errors = logsData.filter(
        (l) => l.status_code && l.status_code >= 400
      ).length;
      const pending = logsData.filter((l) => !l.status_code).length;

      setStats({ total, success, errors, pending });
    } catch (error) {
      console.error("Error fetching webhook logs:", error);
      toast.error("Erro ao carregar logs do webhook");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copiado!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const getStatusColor = (statusCode: number | null) => {
    if (!statusCode) return "secondary";
    if (statusCode >= 200 && statusCode < 300) return "default";
    if (statusCode >= 400) return "destructive";
    return "secondary";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatJson = (data: unknown) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getPaymentIdFromBody = (body: unknown): string | null => {
    try {
      const parsed = body as { data?: { id?: string | number } };
      return parsed?.data?.id?.toString() || null;
    } catch {
      return null;
    }
  };

  const getActionFromBody = (body: unknown): string | null => {
    try {
      const parsed = body as { action?: string };
      return parsed?.action || null;
    } catch {
      return null;
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "success" && !(log.status_code && log.status_code >= 200 && log.status_code < 300)) {
        return false;
      }
      if (statusFilter === "error" && !(log.status_code && log.status_code >= 400)) {
        return false;
      }
      if (statusFilter === "pending" && log.status_code) {
        return false;
      }
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const paymentId = getPaymentIdFromBody(log.body);
      const action = getActionFromBody(log.body);
      
      return (
        log.source.toLowerCase().includes(term) ||
        log.method.toLowerCase().includes(term) ||
        (paymentId && paymentId.includes(term)) ||
        (action && action.toLowerCase().includes(term)) ||
        (log.error_message && log.error_message.toLowerCase().includes(term))
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="text-green-500" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.success}</p>
                <p className="text-xs text-muted-foreground">Sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="text-destructive" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.errors}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertCircle className="text-yellow-500" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook URL Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">URL do Webhook Mercado Pago</p>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                https://ojgxyixgddhkceisbyjg.supabase.co/functions/v1/mercadopago-webhook
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://ojgxyixgddhkceisbyjg.supabase.co/functions/v1/mercadopago-webhook"
                );
                toast.success("URL copiada!");
              }}
            >
              <Copy size={14} className="mr-2" />
              Copiar URL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Buscar por Payment ID, ação, fonte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter size={16} className="mr-2" />
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erros</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Nenhum log encontrado com os filtros aplicados."
                : "Nenhum log de webhook encontrado. Os logs aparecerão aqui quando o Mercado Pago enviar notificações."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            const paymentId = getPaymentIdFromBody(log.body);
            const action = getActionFromBody(log.body);

            return (
              <Card key={log.id} className="overflow-hidden">
                <CardHeader
                  className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={getStatusColor(log.status_code)}>
                        {log.status_code || "N/A"}
                      </Badge>
                      <Badge variant="outline">{log.method}</Badge>
                      {action && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {action}
                        </Badge>
                      )}
                      {paymentId && (
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: {paymentId}
                        </span>
                      )}
                      {log.error_message && (
                        <Badge variant="destructive" className="text-xs">
                          Erro
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {formatDate(log.created_at)}
                      </span>
                      {expandedLog === log.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedLog === log.id && (
                  <CardContent className="pt-0 pb-4 px-4 space-y-4 border-t border-border">
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {formatDate(log.created_at)}
                    </p>

                    {log.error_message && (
                      <div>
                        <h4 className="text-sm font-medium text-destructive mb-1">
                          Mensagem de Erro
                        </h4>
                        <pre className="text-xs bg-destructive/10 p-3 rounded border border-destructive/20 overflow-x-auto whitespace-pre-wrap">
                          {log.error_message}
                        </pre>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-foreground">
                          Body (Payload)
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(formatJson(log.body), `body-${log.id}`);
                          }}
                        >
                          {copiedId === `body-${log.id}` ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto max-h-60">
                        {formatJson(log.body)}
                      </pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-foreground">
                          Headers
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(formatJson(log.headers), `headers-${log.id}`);
                          }}
                        >
                          {copiedId === `headers-${log.id}` ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto max-h-40">
                        {formatJson(log.headers)}
                      </pre>
                    </div>

                    {log.query_params && Object.keys(log.query_params).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          Query Parameters
                        </h4>
                        <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto">
                          {formatJson(log.query_params)}
                        </pre>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-foreground">
                          Response
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(formatJson(log.response), `response-${log.id}`);
                          }}
                        >
                          {copiedId === `response-${log.id}` ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="text-xs bg-muted p-3 rounded border overflow-x-auto max-h-40">
                        {formatJson(log.response)}
                      </pre>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
