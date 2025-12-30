import { useState } from "react";
import { X, Users, User, Info, Instagram, MessageCircle, Gamepad2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "./FileUpload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TicketPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
}

type TicketType = "individual" | "duo";

interface FormData {
  fullName: string;
  cpf: string;
  cep: string;
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
}: TicketPurchaseModalProps) {
  const [ticketType, setTicketType] = useState<TicketType>("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    cpf: "",
    cep: "",
    partnerNick: "",
    gameProfile: null,
    instagramProof: null,
    whatsappProof: null,
    discordProfile: null,
  });

  const price = ticketType === "individual" ? 2.5 : 5.0;
  const prizeShare = (price * 0.7).toFixed(2);
  const organizationShare = (price * 0.3).toFixed(2);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullName || !formData.cpf || !formData.cep) {
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

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success("Inscrição realizada! Aguarde a confirmação do pagamento.");
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display font-bold text-xl">Comprar Ingresso</h2>
            <p className="text-sm text-muted-foreground">{tournamentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

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
                description="Print provando que você segue @jpgesports no Instagram"
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
                  <span>Processando...</span>
                </div>
              ) : (
                `Confirmar Inscrição - R$ ${price.toFixed(2).replace(".", ",")}`
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Ao confirmar, você concorda com as regras do torneio
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
