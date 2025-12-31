import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
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

export function WebhookLogsTab() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data as WebhookLog[]) || []);
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
    if (statusCode >= 400 && statusCode < 500) return "destructive";
    if (statusCode >= 500) return "destructive";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Logs do Webhook</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {logs.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum log de webhook encontrado. Os logs aparecerão aqui quando o
            Mercado Pago enviar notificações para sua URL de webhook.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <CardHeader
                className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(log.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(log.status_code)}>
                      {log.status_code || "N/A"}
                    </Badge>
                    <Badge variant="outline">{log.method}</Badge>
                    <span className="text-sm font-medium text-foreground">
                      {log.source}
                    </span>
                    {log.error_message && (
                      <Badge variant="destructive" className="text-xs">
                        Erro
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
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
                <CardContent className="pt-0 pb-4 px-4 space-y-4">
                  {log.error_message && (
                    <div>
                      <h4 className="text-sm font-medium text-destructive mb-1">
                        Mensagem de Erro
                      </h4>
                      <pre className="text-xs bg-destructive/10 p-2 rounded border border-destructive/20 overflow-x-auto">
                        {log.error_message}
                      </pre>
                    </div>
                  )}

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
                    <pre className="text-xs bg-muted p-2 rounded border overflow-x-auto max-h-40">
                      {formatJson(log.headers)}
                    </pre>
                  </div>

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
                    <pre className="text-xs bg-muted p-2 rounded border overflow-x-auto max-h-60">
                      {formatJson(log.body)}
                    </pre>
                  </div>

                  {log.query_params && Object.keys(log.query_params).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">
                        Query Parameters
                      </h4>
                      <pre className="text-xs bg-muted p-2 rounded border overflow-x-auto">
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
                    <pre className="text-xs bg-muted p-2 rounded border overflow-x-auto max-h-40">
                      {formatJson(log.response)}
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
