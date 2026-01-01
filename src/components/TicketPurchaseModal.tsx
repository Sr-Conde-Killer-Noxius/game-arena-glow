import { useState, useEffect } from "react";
import { X, Users, User, Info, AlertCircle, Copy, CheckCircle2, Clock, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "./FileUpload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TicketPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
  tournamentId?: string;
}

type TicketType = "individual" | "duo";
type Step = "form" | "pix" | "success";

interface FormData {
  fullName: string;
  cpf: string;
  cep: string;
  email: string;
  partnerNick: string;
  gameProfile: File | null;
  instagramProof: File | null;
  whatsappProof: File | null;
  discordProfile: File | null;
}

export function TicketPurchaseModal({
  isOpen,
  onClose,
  tournamentName,
  tournamentId = "demo-tournament",
}: TicketPurchaseModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [ticketType, setTicketType] = useState<TicketType>("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participationId, setParticipationId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{
    pixCopyPaste: string;
    pixQrCodeBase64: string;
  } | null>(null);
  const [uniqueToken, setUniqueToken] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    cpf: "",
    cep: "",
    email: "",
    partnerNick: "",
    gameProfile: null,
    instagramProof: null,
    whatsappProof: null,
    discordProfile: null,
  });

  const price = ticketType === "individual" ? 2.5 : 5.0;
  const prizeShare = (price * 0.7).toFixed(2);
  const organizationShare = (price * 0.3).toFixed(2);

  // Listen for payment status updates via Supabase Realtime
  useEffect(() => {
    if (step !== "pix" || !participationId) return;

    console.log("Setting up realtime subscription for participation:", participationId);

    // Subscribe to realtime changes on the participation
    const channel = supabase
      .channel(`participation-${participationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "participations",
          filter: `id=eq.${participationId}`,
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          const newData = payload.new as { payment_status: string; unique_token: string };
          
          if (newData.payment_status === "paid") {
            setUniqueToken(newData.unique_token);
            setStep("success");
            toast.success("Pagamento confirmado!");
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    // Also poll as fallback every 10 seconds (in case realtime fails)
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-payment-status", {
          body: { participationId },
        });

        if (error) {
          console.error("Error checking status:", error);
          return;
        }

        if (data.isPaid && data.token) {
          setUniqueToken(data.token);
          setStep("success");
          toast.success("Pagamento confirmado!");
        }
      } catch (err) {
        console.error("Error polling status:", err);
      }
    }, 10000);

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [step, participationId]);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
  };

  const uploadFile = async (file: File, userId: string, fieldName: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${fieldName}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("tournament-screenshots")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("tournament-screenshots")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullName || !formData.cpf || !formData.cep || !formData.email) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    if (!formData.gameProfile || !formData.instagramProof || !formData.whatsappProof) {
      toast.error("Envie todos os prints obrigatórios!");
      return;
    }

    if (ticketType === "duo" && !formData.partnerNick) {
      toast.error("Informe o nick do seu parceiro!");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para comprar ingressos!");
        setIsSubmitting(false);
        return;
      }

      // Check if user already has a pending participation for this tournament
      const { data: existingParticipation } = await supabase
        .from("participations")
        .select("*")
        .eq("user_id", user.id)
        .eq("tournament_id", tournamentId)
        .maybeSingle();

      // If user already paid for this tournament, show message
      if (existingParticipation && existingParticipation.payment_status === "paid") {
        toast.error("Você já tem um ingresso pago para este torneio!");
        setIsSubmitting(false);
        return;
      }

      let currentParticipationId = existingParticipation?.id;

      // Only create new participation if one doesn't exist
      if (!existingParticipation) {
        // Upload screenshots
        const [gameProfileUrl, instagramUrl, whatsappUrl, discordUrl] = await Promise.all([
          uploadFile(formData.gameProfile!, user.id, "game-profile"),
          uploadFile(formData.instagramProof!, user.id, "instagram-proof"),
          uploadFile(formData.whatsappProof!, user.id, "whatsapp-proof"),
          formData.discordProfile ? uploadFile(formData.discordProfile, user.id, "discord-profile") : null,
        ]);

        // Create participation record
        const { data: participation, error: participationError } = await supabase
          .from("participations")
          .insert({
            user_id: user.id,
            tournament_id: tournamentId,
            payment_status: "pending",
            screenshot_1_url: gameProfileUrl,
            screenshot_2_url: instagramUrl,
            screenshot_3_url: whatsappUrl,
            screenshot_4_url: discordUrl,
          })
          .select()
          .single();

        if (participationError) {
          console.error("Error creating participation:", participationError);
          toast.error("Erro ao criar inscrição. Tente novamente.");
          setIsSubmitting(false);
          return;
        }

        currentParticipationId = participation.id;
      } else {
        // Update existing participation with new screenshots if needed
        const [gameProfileUrl, instagramUrl, whatsappUrl, discordUrl] = await Promise.all([
          uploadFile(formData.gameProfile!, user.id, "game-profile"),
          uploadFile(formData.instagramProof!, user.id, "instagram-proof"),
          uploadFile(formData.whatsappProof!, user.id, "whatsapp-proof"),
          formData.discordProfile ? uploadFile(formData.discordProfile, user.id, "discord-profile") : null,
        ]);

        await supabase
          .from("participations")
          .update({
            screenshot_1_url: gameProfileUrl,
            screenshot_2_url: instagramUrl,
            screenshot_3_url: whatsappUrl,
            screenshot_4_url: discordUrl,
          })
          .eq("id", existingParticipation.id);
      }

      setParticipationId(currentParticipationId!);

      // Create PIX payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        "create-pix-payment",
        {
          body: {
            participationId: currentParticipationId,
            amount: price,
            description: `Ingresso ${ticketType === "duo" ? "Dupla" : "Individual"} - ${tournamentName}`,
            payerEmail: formData.email,
            payerName: formData.fullName,
            payerCpf: formData.cpf,
          },
        }
      );

      if (paymentError || !paymentData?.success) {
        console.error("Payment error:", paymentError || paymentData?.error);
        toast.error("Erro ao gerar PIX. Tente novamente.");
        setIsSubmitting(false);
        return;
      }

      setPixData({
        pixCopyPaste: paymentData.pixCopyPaste,
        pixQrCodeBase64: paymentData.pixQrCodeBase64,
      });

      setStep("pix");
      toast.success("PIX gerado! Escaneie o QR Code ou copie o código.");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleClose = () => {
    setStep("form");
    setPixData(null);
    setUniqueToken(null);
    setParticipationId(null);
    setFormData({
      fullName: "",
      cpf: "",
      cep: "",
      email: "",
      partnerNick: "",
      gameProfile: null,
      instagramProof: null,
      whatsappProof: null,
      discordProfile: null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={step === "success" ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display font-bold text-xl">
              {step === "form" && "Comprar Ingresso"}
              {step === "pix" && "Pagamento PIX"}
              {step === "success" && "Pagamento Confirmado!"}
            </h2>
            <p className="text-sm text-muted-foreground">{tournamentName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: Form */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Ticket Type Selection */}
            <div className="space-y-3">
              <Label className="text-base">Tipo de Ingresso</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTicketType("individual")}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-left",
                    ticketType === "individual"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        ticketType === "individual"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold">Individual</p>
                      <p className="text-lg font-display text-primary">R$ 2,50</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTicketType("duo")}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-left",
                    ticketType === "duo"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        ticketType === "duo"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="font-bold">Dupla</p>
                      <p className="text-lg font-display text-primary">R$ 5,00</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Prize Distribution Info */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">
                    Distribuição do valor:
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-primary font-bold">70%</span> (R${" "}
                    {prizeShare}) vai para a premiação
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-muted-foreground font-bold">30%</span>{" "}
                    (R$ {organizationShare}) vai para a organização
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Data */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg border-b border-border pb-2">
                Dados Pessoais
              </h3>

              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  E-mail <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">
                    CPF <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData({ ...formData, cpf: formatCPF(e.target.value) })
                    }
                    maxLength={14}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">
                    CEP <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={(e) =>
                      setFormData({ ...formData, cep: formatCEP(e.target.value) })
                    }
                    maxLength={9}
                    required
                  />
                </div>
              </div>

              {ticketType === "duo" && (
                <div className="space-y-2">
                  <Label htmlFor="partnerNick">
                    Nick do Parceiro <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="partnerNick"
                    placeholder="Nick do seu parceiro no jogo"
                    value={formData.partnerNick}
                    onChange={(e) =>
                      setFormData({ ...formData, partnerNick: e.target.value })
                    }
                    required
                  />
                </div>
              )}
            </div>

            {/* Required Uploads */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg border-b border-border pb-2 flex items-center gap-2">
                <AlertCircle size={18} className="text-destructive" />
                Prints Obrigatórios
              </h3>

              <div className="grid gap-4">
                <FileUpload
                  label="Perfil do Jogo"
                  description="Print mostrando seu ID/Nick no Free Fire"
                  required
                  value={formData.gameProfile}
                  onChange={(file) =>
                    setFormData({ ...formData, gameProfile: file })
                  }
                />

                <FileUpload
                  label="Seguindo JPG no Instagram"
                  description="Print provando que você segue @jogapraganhar no Instagram"
                  required
                  value={formData.instagramProof}
                  onChange={(file) =>
                    setFormData({ ...formData, instagramProof: file })
                  }
                />

                <FileUpload
                  label="Canal do WhatsApp JPG"
                  description="Print mostrando que você está no canal do WhatsApp da JPG"
                  required
                  value={formData.whatsappProof}
                  onChange={(file) =>
                    setFormData({ ...formData, whatsappProof: file })
                  }
                />
              </div>
            </div>

            {/* Optional Upload */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg border-b border-border pb-2">
                Print Opcional
              </h3>

              <FileUpload
                label="Perfil do Discord"
                description="Print do seu perfil no Discord (para comunicação)"
                value={formData.discordProfile}
                onChange={(file) =>
                  setFormData({ ...formData, discordProfile: file })
                }
              />
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-display text-2xl font-bold text-primary">
                  R$ {price.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Gerando PIX...</span>
                  </div>
                ) : (
                  `Pagar com PIX - R$ ${price.toFixed(2).replace(".", ",")}`
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Ao confirmar, você concorda com as regras do torneio
              </p>
            </div>
          </form>
        )}

        {/* STEP 2: PIX Payment */}
        {step === "pix" && pixData && (
          <div className="p-6 space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl mb-4">
                {pixData.pixQrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${pixData.pixQrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-muted">
                    <QrCode size={64} className="text-muted-foreground" />
                  </div>
                )}
              </div>

              <p className="text-center text-muted-foreground text-sm">
                Escaneie o QR Code com o app do seu banco
              </p>
            </div>

            {/* Copy Paste Code */}
            <div className="space-y-2">
              <Label>Ou copie o código PIX:</Label>
              <div className="flex gap-2">
                <Input
                  value={pixData.pixCopyPaste}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(pixData.pixCopyPaste, "Código PIX copiado!")}
                >
                  <Copy size={18} />
                </Button>
              </div>
            </div>

            {/* Status */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="text-amber-500 animate-pulse" size={24} />
                <div>
                  <p className="font-medium text-foreground">Aguardando pagamento...</p>
                  <p className="text-sm text-muted-foreground">
                    O status será atualizado automaticamente após o pagamento
                  </p>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor a pagar</p>
              <p className="font-display text-3xl font-bold text-primary">
                R$ {price.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === "success" && uniqueToken && (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-neon">
                <CheckCircle2 className="text-primary" size={40} />
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">
                Inscrição Confirmada!
              </h3>
              <p className="text-muted-foreground">
                Seu pagamento foi processado com sucesso
              </p>
            </div>

            {/* Token Display */}
            <div className="bg-primary/10 border-2 border-primary rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Seu Token de Acesso:</p>
              <p className="font-display text-3xl font-bold text-primary tracking-wider mb-4">
                {uniqueToken}
              </p>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(uniqueToken, "Token copiado!")}
                className="gap-2"
              >
                <Copy size={16} />
                Copiar Token
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Guarde este token em um local seguro</li>
                <li>Você precisará dele para entrar no torneio</li>
                <li>Acesse "Meus Ingressos" para ver todos os seus tokens</li>
              </ul>
            </div>

            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={handleClose}
            >
              Concluir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
