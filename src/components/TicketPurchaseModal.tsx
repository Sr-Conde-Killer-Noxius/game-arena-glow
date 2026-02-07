import { useState, useEffect } from "react";
import { X, Users, User, Info, AlertCircle, Copy, CheckCircle2, Clock, QrCode, FileText, Gamepad2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "./FileUpload";
import { TicketSheet } from "./TicketSheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TicketPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
  tournamentId?: string;
  tournamentGame?: string;
  tournamentGameMode?: string;
  tournamentDate?: string;
  entryFee?: number;
}

type Step = "form" | "pix" | "success";

interface FormData {
  fullName: string;
  cpf: string;
  cep: string;
  email: string;
  whatsapp: string;
  playerNick: string;
  playerGameId: string;
  partnerNick: string;
  partnerGameId: string;
  partner2Nick: string;
  partner2GameId: string;
  partner3Nick: string;
  partner3GameId: string;
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
  tournamentGame = "freefire",
  tournamentGameMode = "solo",
  tournamentDate = "",
  entryFee = 2.5,
}: TicketPurchaseModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participationId, setParticipationId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{
    pixCopyPaste: string;
    pixQrCodeBase64: string;
  } | null>(null);
  const [uniqueToken, setUniqueToken] = useState<string | null>(null);
  const [slotNumber, setSlotNumber] = useState<number | null>(null);
  const [isTicketSheetOpen, setIsTicketSheetOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [validatedPromo, setValidatedPromo] = useState<{
    promo_code_id: string;
    partner_id: string;
  } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    cpf: "",
    cep: "",
    email: "",
    whatsapp: "",
    playerNick: "",
    playerGameId: "",
    partnerNick: "",
    partnerGameId: "",
    partner2Nick: "",
    partner2GameId: "",
    partner3Nick: "",
    partner3GameId: "",
    gameProfile: null,
    instagramProof: null,
    whatsappProof: null,
    discordProfile: null,
  });

  // Calculate actual price (0 if promo code is valid)
  const actualPrice = validatedPromo ? 0 : entryFee;
  const price = entryFee;
  const prizeShare = (price * 0.7).toFixed(2);
  const organizationShare = (price * 0.3).toFixed(2);

  // Calculate how many partners are needed based on game mode
  const getPartnersCount = () => {
    switch (tournamentGameMode) {
      case "dupla": return 1;
      case "trio": return 2;
      case "squad": return 3;
      default: return 0;
    }
  };
  const partnersCount = getPartnersCount();

  // Duplicate Game ID validation
  const getDuplicateGameIds = (): Record<string, string> => {
    if (partnersCount === 0) return {};
    const errors: Record<string, string> = {};
    const ids: { field: string; label: string; value: string }[] = [];

    if (formData.playerGameId.trim()) {
      ids.push({ field: "playerGameId", label: "Jogador Principal", value: formData.playerGameId.trim() });
    }
    if (partnersCount >= 1 && formData.partnerGameId.trim()) {
      ids.push({ field: "partnerGameId", label: "Parceiro 1", value: formData.partnerGameId.trim() });
    }
    if (partnersCount >= 2 && formData.partner2GameId.trim()) {
      ids.push({ field: "partner2GameId", label: "2º Parceiro", value: formData.partner2GameId.trim() });
    }
    if (partnersCount >= 3 && formData.partner3GameId.trim()) {
      ids.push({ field: "partner3GameId", label: "3º Parceiro", value: formData.partner3GameId.trim() });
    }

    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < i; j++) {
        if (ids[i].value === ids[j].value) {
          errors[ids[i].field] = `ID duplicado com ${ids[j].label}`;
          if (!errors[ids[j].field]) {
            errors[ids[j].field] = `ID duplicado com ${ids[i].label}`;
          }
        }
      }
    }
    return errors;
  };

  const duplicateErrors = getDuplicateGameIds();
  const hasDuplicates = Object.keys(duplicateErrors).length > 0;

  // Load profile data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, cpf, cep, whatsapp")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          fullName: profile.full_name || "",
          cpf: profile.cpf || "",
          cep: profile.cep || "",
          whatsapp: profile.whatsapp || "",
          email: user.email || "",
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          email: user.email || "",
        }));
      }
    };

    loadProfileData();
  }, [isOpen]);

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
          const newData = payload.new as { payment_status: string; unique_token: string; slot_number: number | null };
          
          if (newData.payment_status === "paid") {
            setUniqueToken(newData.unique_token);
            setSlotNumber(newData.slot_number);
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
          setSlotNumber(data.slotNumber || null);
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

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para usar um código promocional");
      return;
    }

    setIsValidatingPromo(true);
    try {
      const { data, error } = await supabase.rpc("validate_promo_code", {
        _code: promoCode.trim(),
        _tournament_id: tournamentId,
        _user_id: user.id,
      });

      if (error) throw error;

      const result = data as { valid: boolean; error?: string; promo_code_id?: string; partner_id?: string };

      if (!result.valid) {
        toast.error(result.error || "Código inválido");
        setValidatedPromo(null);
        return;
      }

      setValidatedPromo({
        promo_code_id: result.promo_code_id!,
        partner_id: result.partner_id!,
      });
      toast.success("Código promocional aplicado! Entrada gratuita.");
    } catch (err) {
      console.error("Error validating promo code:", err);
      toast.error("Erro ao validar código");
      setValidatedPromo(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setValidatedPromo(null);
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
    if (!formData.fullName || !formData.cpf || !formData.cep || !formData.email || !formData.whatsapp) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    if (!formData.playerNick || !formData.playerGameId) {
      toast.error("Preencha seu Nick e ID do jogo!");
      return;
    }

    if (!formData.gameProfile || !formData.instagramProof || !formData.whatsappProof) {
      toast.error("Envie todos os prints obrigatórios!");
      return;
    }

    // Validate partners based on game mode
    if (partnersCount >= 1 && (!formData.partnerNick || !formData.partnerGameId)) {
      toast.error("Preencha o Nick e ID do parceiro!");
      return;
    }
    if (partnersCount >= 2 && (!formData.partner2Nick || !formData.partner2GameId)) {
      toast.error("Preencha o Nick e ID do segundo parceiro!");
      return;
    }
    if (partnersCount >= 3 && (!formData.partner3Nick || !formData.partner3GameId)) {
      toast.error("Preencha o Nick e ID do terceiro parceiro!");
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

      // Update profile with form data (sync to /profile)
      await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          cpf: formData.cpf,
          cep: formData.cep,
          whatsapp: formData.whatsapp,
        })
        .eq("id", user.id);

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

        // Create participation record with all user data
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
            // User data for ticket
            full_name: formData.fullName,
            cpf: formData.cpf,
            cep: formData.cep,
            whatsapp: formData.whatsapp,
            player_nick: formData.playerNick,
            player_game_id: formData.playerGameId,
            // Partner data
            partner_nick: formData.partnerNick || null,
            partner_game_id: formData.partnerGameId || null,
            partner_2_nick: formData.partner2Nick || null,
            partner_2_game_id: formData.partner2GameId || null,
            partner_3_nick: formData.partner3Nick || null,
            partner_3_game_id: formData.partner3GameId || null,
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
        // Update existing participation with new screenshots and data
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
            // User data for ticket
            full_name: formData.fullName,
            cpf: formData.cpf,
            cep: formData.cep,
            whatsapp: formData.whatsapp,
            player_nick: formData.playerNick,
            player_game_id: formData.playerGameId,
            // Partner data
            partner_nick: formData.partnerNick || null,
            partner_game_id: formData.partnerGameId || null,
            partner_2_nick: formData.partner2Nick || null,
            partner_2_game_id: formData.partner2GameId || null,
            partner_3_nick: formData.partner3Nick || null,
            partner_3_game_id: formData.partner3GameId || null,
          })
          .eq("id", existingParticipation.id);
      }

      setParticipationId(currentParticipationId!);

      // Helper function to calculate slot number
      const calculateSlotNumber = async (): Promise<number> => {
        // Get count of paid participations for this tournament
        const { count } = await supabase
          .from("participations")
          .select("id", { count: "exact", head: true })
          .eq("tournament_id", tournamentId)
          .eq("payment_status", "paid");

        return (count || 0) + 1;
      };

      // If promo code is applied OR tournament is free, skip payment and mark as paid directly
      const isFreeEntry = validatedPromo || entryFee === 0;

      if (isFreeEntry) {
        // If using promo code, redeem it first
        if (validatedPromo) {
          const { data: redeemResult, error: redeemError } = await supabase.rpc("redeem_promo_code", {
            _promo_code_id: validatedPromo.promo_code_id,
            _tournament_id: tournamentId,
            _user_id: user.id,
            _participation_id: currentParticipationId,
          });

          if (redeemError || !redeemResult) {
            console.error("Error redeeming promo code:", redeemError);
            toast.error("Erro ao resgatar código promocional. Tente novamente.");
            setIsSubmitting(false);
            return;
          }
        }

        // Calculate slot number before marking as paid (required by database trigger)
        const calculatedSlot = await calculateSlotNumber();

        // Update participation to paid status with slot number
        const { data: updatedParticipation, error: updateError } = await supabase
          .from("participations")
          .update({ 
            payment_status: "paid",
            slot_number: calculatedSlot,
          })
          .eq("id", currentParticipationId)
          .select("unique_token, slot_number")
          .single();

        if (updateError) {
          console.error("Error updating participation:", updateError);
          toast.error("Erro ao confirmar inscrição. Tente novamente.");
          setIsSubmitting(false);
          return;
        }

        setUniqueToken(updatedParticipation.unique_token);
        setSlotNumber(updatedParticipation.slot_number);
        setStep("success");
        toast.success(validatedPromo ? "Inscrição gratuita confirmada!" : "Inscrição confirmada!");
        setIsSubmitting(false);
        return;
      }

      // Create PIX payment (only for paid tournaments without promo code)
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        "create-pix-payment",
        {
          body: {
            participationId: currentParticipationId,
            amount: entryFee,
            description: `Ingresso ${tournamentGameMode} - ${tournamentName}`,
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
    setSlotNumber(null);
    setParticipationId(null);
    setIsTicketSheetOpen(false);
    setPromoCode("");
    setValidatedPromo(null);
    setFormData({
      fullName: "",
      cpf: "",
      cep: "",
      email: "",
      whatsapp: "",
      playerNick: "",
      playerGameId: "",
      partnerNick: "",
      partnerGameId: "",
      partner2Nick: "",
      partner2GameId: "",
      partner3Nick: "",
      partner3GameId: "",
      gameProfile: null,
      instagramProof: null,
      whatsappProof: null,
      discordProfile: null,
    });
    onClose();
  };

  const gameNames: Record<string, string> = {
    freefire: "Free Fire",
    valorant: "Valorant",
    cs2: "Counter-Strike 2",
    pubg: "PUBG Mobile",
    codmobile: "Call of Duty Mobile",
    wildrift: "Wild Rift",
  };

  const gameModeNames: Record<string, string> = {
    solo: "Solo",
    dupla: "Dupla",
    trio: "Trio",
    squad: "Squad",
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
            {/* Game Mode Info */}
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
              <Gamepad2 className="text-primary shrink-0" size={24} />
              <div>
                <p className="font-medium text-foreground">
                  Modo: {gameModeNames[tournamentGameMode] || tournamentGameMode}
                </p>
                <p className="text-sm text-muted-foreground">
                  {partnersCount === 0 ? "Inscrição individual" : `Você + ${partnersCount} parceiro${partnersCount > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            {/* Entry Fee Info */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">
                    Taxa de inscrição
                  </p>
                  <p className="text-muted-foreground">
                    O pagamento garante sua vaga no torneio e concorre às premiações definidas.
                  </p>
                </div>
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift size={18} className="text-primary" />
                <Label>Código Promocional (opcional)</Label>
              </div>
              
              {validatedPromo ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-green-500" size={18} />
                      <span className="text-green-500 font-medium">
                        Código aplicado: <code className="bg-green-500/20 px-2 py-0.5 rounded">{promoCode}</code>
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removePromoCode}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Remover
                    </Button>
                  </div>
                  <p className="text-sm text-green-500/80 mt-2">
                    🎉 Entrada gratuita! Você não precisará pagar.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite seu código..."
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toLowerCase())}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={validatePromoCode}
                    disabled={!promoCode.trim() || isValidatingPromo}
                  >
                    {isValidatingPromo ? "Validando..." : "Aplicar"}
                  </Button>
                </div>
              )}
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

              <div className="space-y-2">
                <Label htmlFor="whatsapp">
                  WhatsApp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="whatsapp"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: formatWhatsApp(e.target.value) })
                  }
                  maxLength={15}
                  required
                />
              </div>
            </div>

            {/* Game Profile Data */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg border-b border-border pb-2 flex items-center gap-2">
                <User size={18} className="text-primary" />
                Seus Dados no Jogo
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="playerNick">
                    Seu Nick <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="playerNick"
                    placeholder="Seu nick no jogo"
                    value={formData.playerNick}
                    onChange={(e) =>
                      setFormData({ ...formData, playerNick: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="playerGameId">
                    Seu ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="playerGameId"
                    placeholder="Seu ID no jogo"
                    value={formData.playerGameId}
                    onChange={(e) =>
                      setFormData({ ...formData, playerGameId: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Partner Data - Only show if game mode requires partners */}
            {partnersCount >= 1 && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg border-b border-border pb-2 flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  Dados do Parceiro
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partnerNick">
                      Nick do Parceiro <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="partnerNick"
                      placeholder="Nick do parceiro"
                      value={formData.partnerNick}
                      onChange={(e) =>
                        setFormData({ ...formData, partnerNick: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partnerGameId">
                      ID do Parceiro <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="partnerGameId"
                      placeholder="ID do parceiro"
                      value={formData.partnerGameId}
                      onChange={(e) =>
                        setFormData({ ...formData, partnerGameId: e.target.value })
                      }
                      required
                      className={duplicateErrors.partnerGameId ? "border-destructive" : ""}
                    />
                    {duplicateErrors.partnerGameId && (
                      <p className="text-xs text-destructive mt-1">{duplicateErrors.partnerGameId}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Partner 2 Data - Only show for trio and squad */}
            {partnersCount >= 2 && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg border-b border-border pb-2 flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  Dados do 2º Parceiro
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partner2Nick">
                      Nick do 2º Parceiro <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="partner2Nick"
                      placeholder="Nick do 2º parceiro"
                      value={formData.partner2Nick}
                      onChange={(e) =>
                        setFormData({ ...formData, partner2Nick: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partner2GameId">
                      ID do 2º Parceiro <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="partner2GameId"
                      placeholder="ID do 2º parceiro"
                      value={formData.partner2GameId}
                      onChange={(e) =>
                        setFormData({ ...formData, partner2GameId: e.target.value })
                      }
                      required
                      className={duplicateErrors.partner2GameId ? "border-destructive" : ""}
                    />
                    {duplicateErrors.partner2GameId && (
                      <p className="text-xs text-destructive mt-1">{duplicateErrors.partner2GameId}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Partner 3 Data - Only show for squad */}
            {partnersCount >= 3 && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg border-b border-border pb-2 flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  Dados do 3º Parceiro
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partner3Nick">
                      Nick do 3º Parceiro <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="partner3Nick"
                      placeholder="Nick do 3º parceiro"
                      value={formData.partner3Nick}
                      onChange={(e) =>
                        setFormData({ ...formData, partner3Nick: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partner3GameId">
                      ID do 3º Parceiro <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="partner3GameId"
                      placeholder="ID do 3º parceiro"
                      value={formData.partner3GameId}
                      onChange={(e) =>
                        setFormData({ ...formData, partner3GameId: e.target.value })
                      }
                      required
                      className={duplicateErrors.partner3GameId ? "border-destructive" : ""}
                    />
                    {duplicateErrors.partner3GameId && (
                      <p className="text-xs text-destructive mt-1">{duplicateErrors.partner3GameId}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Required Uploads */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg border-b border-border pb-2 flex items-center gap-2">
                <AlertCircle size={18} className="text-destructive" />
                Prints Obrigatórios
              </h3>

              <div className="grid gap-4">
                <FileUpload
                  label="Perfil do Jogo"
                  description="Print mostrando seu ID/Nick no jogo"
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
              {hasDuplicates && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4 flex items-start gap-3">
                  <AlertCircle className="text-destructive shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-medium text-destructive text-sm">IDs duplicados detectados</p>
                    <p className="text-xs text-destructive/80 mt-1">
                      Este jogador já foi vinculado à equipe. Insira um ID JPG exclusivo para cada parceiro.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Total:</span>
                <div className="text-right">
                  {validatedPromo ? (
                    <>
                      <span className="font-display text-lg text-muted-foreground line-through mr-2">
                        R$ {price.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="font-display text-2xl font-bold text-green-500">
                        GRÁTIS
                      </span>
                    </>
                  ) : (
                    <span className="font-display text-2xl font-bold text-primary">
                      R$ {price.toFixed(2).replace(".", ",")}
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full"
                disabled={isSubmitting || hasDuplicates}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>{validatedPromo ? "Confirmando..." : "Gerando PIX..."}</span>
                  </div>
                ) : validatedPromo ? (
                  "Confirmar Inscrição Gratuita"
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

            {/* Slot Display */}
            {slotNumber && (
              <div className="bg-amber-500/10 border-2 border-amber-500 rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Seu Slot:</p>
                <p className="font-display text-4xl font-bold text-amber-500 tracking-wider">
                  #{slotNumber}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Use este número quando entrar na sala do jogo
                </p>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Guarde este token em um local seguro</li>
                <li>Você precisará dele para entrar no torneio</li>
                <li>Acesse "Meus Ingressos" para ver todos os seus tokens</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsTicketSheetOpen(true)}
                className="gap-2"
              >
                <FileText size={18} />
                Ver Ficha
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={handleClose}
              >
                Concluir
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Sheet Modal */}
      <TicketSheet
        isOpen={isTicketSheetOpen}
        onClose={() => setIsTicketSheetOpen(false)}
        ticket={{
          uniqueToken: uniqueToken || "",
          slotNumber: slotNumber,
          tournamentName: tournamentName,
          tournamentGame: gameNames[tournamentGame] || tournamentGame,
          tournamentGameMode: gameModeNames[tournamentGameMode] || tournamentGameMode,
          tournamentDate: tournamentDate,
          playerName: formData.fullName,
          playerNick: formData.playerNick,
          playerGameId: formData.playerGameId,
          playerCpf: formData.cpf,
          playerCep: formData.cep,
          playerWhatsapp: formData.whatsapp,
          partnerNick: formData.partnerNick || undefined,
          partnerGameId: formData.partnerGameId || undefined,
          partner2Nick: formData.partner2Nick || undefined,
          partner2GameId: formData.partner2GameId || undefined,
          partner3Nick: formData.partner3Nick || undefined,
          partner3GameId: formData.partner3GameId || undefined,
        }}
      />
    </div>
  );
}
