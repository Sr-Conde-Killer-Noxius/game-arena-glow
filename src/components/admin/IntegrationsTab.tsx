import { useState, useEffect } from "react";
import { Save, Eye, EyeOff, RefreshCw, CreditCard, Zap, Copy, Check, X } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MercadoPagoConfig {
  public_key: string;
  access_token: string;
  client_id: string;
  client_secret: string;
}

interface TestPaymentResult {
  success: boolean;
  paymentId?: string;
  pixCopyPaste?: string;
  pixQrCodeBase64?: string;
  error?: string;
}

export function IntegrationsTab() {
  const [config, setConfig] = useState<MercadoPagoConfig>({
    public_key: "",
    access_token: "",
    client_id: "",
    client_secret: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    access_token: false,
    client_secret: false,
  });

  // Test payment state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testForm, setTestForm] = useState({
    amount: "1.00",
    email: "",
    name: "",
    cpf: "",
  });
  const [isTestingPayment, setIsTestingPayment] = useState(false);
  const [testResult, setTestResult] = useState<TestPaymentResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", [
          "mp_public_key",
          "mp_access_token",
          "mp_client_id",
          "mp_client_secret",
        ]);

      if (error) throw error;

      const settings: MercadoPagoConfig = {
        public_key: "",
        access_token: "",
        client_id: "",
        client_secret: "",
      };

      data?.forEach((item) => {
        if (item.key === "mp_public_key") settings.public_key = item.value || "";
        if (item.key === "mp_access_token") settings.access_token = item.value || "";
        if (item.key === "mp_client_id") settings.client_id = item.value || "";
        if (item.key === "mp_client_secret") settings.client_secret = item.value || "";
      });

      setConfig(settings);
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Erro ao carregar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const settingsToSave = [
        { key: "mp_public_key", value: config.public_key },
        { key: "mp_access_token", value: config.access_token },
        { key: "mp_client_id", value: config.client_id },
        { key: "mp_client_secret", value: config.client_secret },
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from("settings")
          .upsert(
            { key: setting.key, value: setting.value },
            { onConflict: "key" }
          );

        if (error) throw error;
      }

      toast.success("Configurações salvas com sucesso!");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSecret = (field: "access_token" | "client_secret") => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const openTestModal = () => {
    setTestResult(null);
    setShowTestModal(true);
  };

  const testPayment = async () => {
    if (!testForm.email || !testForm.cpf) {
      toast.error("Preencha email e CPF");
      return;
    }

    setIsTestingPayment(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("test-pix-payment", {
        body: {
          amount: parseFloat(testForm.amount) || 1.00,
          description: "Teste de Integração JPG",
          payerEmail: testForm.email,
          payerName: testForm.name || "Teste",
          payerCpf: testForm.cpf,
        },
      });

      if (error) throw error;

      setTestResult(data);
      if (data.success) {
        toast.success("QR Code gerado com sucesso!");
      } else {
        toast.error(data.error || "Erro ao gerar QR Code");
      }
    } catch (err) {
      console.error("Error testing payment:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao testar integração";
      setTestResult({ success: false, error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsTestingPayment(false);
    }
  };

  const copyPixCode = () => {
    if (testResult?.pixCopyPaste) {
      navigator.clipboard.writeText(testResult.pixCopyPaste);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mercado Pago Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#009ee3]/10 rounded-lg flex items-center justify-center">
            <CreditCard className="text-[#009ee3]" size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Configurações Mercado Pago</h3>
            <p className="text-sm text-muted-foreground">
              Configure suas credenciais de produção do Mercado Pago.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Public Key */}
          <div className="space-y-2">
            <Label htmlFor="public_key">Public Key *</Label>
            <Input
              id="public_key"
              placeholder="APP_USR-..."
              value={config.public_key}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, public_key: e.target.value }))
              }
            />
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="access_token">Access Token *</Label>
            <div className="relative">
              <Input
                id="access_token"
                type={showSecrets.access_token ? "text" : "password"}
                placeholder="APP_USR-..."
                value={config.access_token}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, access_token: e.target.value }))
                }
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => toggleSecret("access_token")}
              >
                {showSecrets.access_token ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          {/* Client ID */}
          <div className="space-y-2">
            <Label htmlFor="client_id">Client ID *</Label>
            <Input
              id="client_id"
              placeholder="123456789"
              value={config.client_id}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, client_id: e.target.value }))
              }
            />
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label htmlFor="client_secret">Client Secret *</Label>
            <div className="relative">
              <Input
                id="client_secret"
                type={showSecrets.client_secret ? "text" : "password"}
                placeholder="..."
                value={config.client_secret}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, client_secret: e.target.value }))
                }
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => toggleSecret("client_secret")}
              >
                {showSecrets.client_secret ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-border">
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw size={16} className="animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Salvar Configurações
          </Button>
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
          <Button variant="secondary" onClick={openTestModal}>
            <Zap size={16} className="mr-2" />
            Testar Integração
          </Button>
        </div>
      </div>

      {/* Webhook Info */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-display font-bold text-lg mb-4">Webhook do Mercado Pago</h3>
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              URL do Webhook
            </Label>
            <p className="font-mono text-sm mt-1 break-all">
              https://ojgxyixgddhkceisbyjg.supabase.co/functions/v1/mercadopago-webhook
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure esta URL no painel do Mercado Pago para receber notificações de pagamento.
            Eventos suportados: <code className="bg-muted px-1 rounded">payment.created</code>,{" "}
            <code className="bg-muted px-1 rounded">payment.updated</code>
          </p>
        </div>
      </div>

      {/* Test Payment Modal */}
      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Testar Integração PIX</DialogTitle>
          </DialogHeader>

          {!testResult?.success ? (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Preencha os dados abaixo para gerar um QR Code de teste.
              </p>

              <div className="space-y-2">
                <Label htmlFor="test_amount">Valor (R$) *</Label>
                <Input
                  id="test_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={testForm.amount}
                  onChange={(e) => setTestForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_email">Email do Pagador *</Label>
                <Input
                  id="test_email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={testForm.email}
                  onChange={(e) => setTestForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_name">Nome (opcional)</Label>
                <Input
                  id="test_name"
                  placeholder="Nome do Pagador"
                  value={testForm.name}
                  onChange={(e) => setTestForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_cpf">CPF *</Label>
                <Input
                  id="test_cpf"
                  placeholder="000.000.000-00"
                  value={testForm.cpf}
                  onChange={(e) => setTestForm((prev) => ({ ...prev, cpf: e.target.value }))}
                />
              </div>

              {testResult?.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{testResult.error}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTestModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={testPayment} disabled={isTestingPayment}>
                  {isTestingPayment ? (
                    <RefreshCw size={16} className="animate-spin mr-2" />
                  ) : (
                    <Zap size={16} className="mr-2" />
                  )}
                  Gerar QR Code
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="text-primary" size={24} />
                </div>
                <p className="font-medium text-lg">QR Code Gerado!</p>
                <p className="text-sm text-muted-foreground">
                  ID do Pagamento: {testResult.paymentId}
                </p>
              </div>

              {testResult.pixQrCodeBase64 && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img
                    src={`data:image/png;base64,${testResult.pixQrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={testResult.pixCopyPaste || ""}
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={copyPixCode}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => { setTestResult(null); setShowTestModal(false); }}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
