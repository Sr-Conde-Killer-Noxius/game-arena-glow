import { useRef } from "react";
import { X, Printer, Download, Copy, Users, User, Hash, Trophy, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TicketSheetProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    uniqueToken: string;
    slotNumber: number | null;
    tournamentName: string;
    tournamentGame: string;
    tournamentGameMode: string;
    tournamentDate: string;
    playerName: string;
    playerNick?: string;
    partnerNick?: string;
    partner2Nick?: string;
    partner3Nick?: string;
  };
}

export function TicketSheet({ isOpen, onClose, ticket }: TicketSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ingresso - ${ticket.tournamentName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', system-ui, sans-serif;
              background: #fff;
              padding: 40px;
            }
            .ticket {
              max-width: 600px;
              margin: 0 auto;
              border: 3px solid #10b981;
              border-radius: 16px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 24px;
              text-align: center;
            }
            .header h1 { font-size: 24px; margin-bottom: 8px; }
            .header p { opacity: 0.9; font-size: 14px; }
            .body { padding: 24px; }
            .section {
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px dashed #e5e7eb;
            }
            .section:last-child { border-bottom: none; margin-bottom: 0; }
            .section-title {
              font-size: 12px;
              text-transform: uppercase;
              color: #6b7280;
              margin-bottom: 8px;
              font-weight: 600;
            }
            .token-box {
              background: #f0fdf4;
              border: 2px solid #10b981;
              border-radius: 12px;
              padding: 16px;
              text-align: center;
            }
            .token {
              font-family: monospace;
              font-size: 28px;
              font-weight: bold;
              color: #10b981;
              letter-spacing: 2px;
            }
            .slot-box {
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 12px;
              padding: 16px;
              text-align: center;
            }
            .slot {
              font-size: 48px;
              font-weight: bold;
              color: #d97706;
            }
            .slot-label {
              font-size: 14px;
              color: #92400e;
              margin-top: 4px;
            }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .info-item label { 
              font-size: 12px; 
              color: #6b7280; 
              display: block;
              margin-bottom: 4px;
            }
            .info-item span { font-weight: 600; font-size: 16px; }
            .footer {
              background: #f9fafb;
              padding: 16px 24px;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .footer strong { color: #374151; }
            @media print {
              body { padding: 20px; }
              .ticket { border-width: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1>🎮 JPG - Joga para Ganhar</h1>
              <p>Ingresso de Participação</p>
            </div>
            <div class="body">
              <div class="section">
                <div class="token-box">
                  <div class="section-title">Seu Token de Acesso</div>
                  <div class="token">${ticket.uniqueToken}</div>
                </div>
              </div>
              ${ticket.slotNumber ? `
              <div class="section">
                <div class="slot-box">
                  <div class="section-title">Seu Slot</div>
                  <div class="slot">#${ticket.slotNumber}</div>
                  <div class="slot-label">Use este número para entrar na sala do jogo</div>
                </div>
              </div>
              ` : ''}
              <div class="section">
                <div class="section-title">Torneio</div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Nome</label>
                    <span>${ticket.tournamentName}</span>
                  </div>
                  <div class="info-item">
                    <label>Jogo</label>
                    <span>${ticket.tournamentGame}</span>
                  </div>
                  <div class="info-item">
                    <label>Modo</label>
                    <span>${ticket.tournamentGameMode}</span>
                  </div>
                  <div class="info-item">
                    <label>Data</label>
                    <span>${ticket.tournamentDate}</span>
                  </div>
                </div>
              </div>
              <div class="section">
                <div class="section-title">Jogador</div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Nome</label>
                    <span>${ticket.playerName}</span>
                  </div>
                  ${ticket.playerNick ? `
                  <div class="info-item">
                    <label>Nick</label>
                    <span>${ticket.playerNick}</span>
                  </div>
                  ` : ''}
                </div>
                ${ticket.partnerNick ? `
                <div style="margin-top: 12px;">
                  <div class="info-item">
                    <label>Parceiro(s)</label>
                    <span>${[ticket.partnerNick, ticket.partner2Nick, ticket.partner3Nick].filter(Boolean).join(', ')}</span>
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
            <div class="footer">
              <strong>Instruções:</strong><br/>
              1. Use o <strong>Token</strong> para validar sua participação<br/>
              ${ticket.slotNumber ? `2. Entre na sala do jogo e aguarde no <strong>Slot #${ticket.slotNumber}</strong><br/>
              3. Use o mesmo número no Discord para call (opcional)` : ''}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const copyToken = () => {
    navigator.clipboard.writeText(ticket.uniqueToken);
    toast.success("Token copiado!");
  };

  const copySlot = () => {
    if (ticket.slotNumber) {
      navigator.clipboard.writeText(ticket.slotNumber.toString());
      toast.success("Slot copiado!");
    }
  };

  const getGameModeIcon = () => {
    switch (ticket.tournamentGameMode.toLowerCase()) {
      case "solo": return <User size={16} />;
      default: return <Users size={16} />;
    }
  };

  const formattedDate = ticket.tournamentDate 
    ? format(new Date(ticket.tournamentDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : "A definir";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-xl">Ficha do Ingresso</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div ref={printRef} className="p-6 space-y-6">
          {/* Token Section */}
          <div className="bg-primary/10 border-2 border-primary rounded-xl p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Token de Acesso
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-2xl md:text-3xl font-bold text-primary tracking-wider">
                {ticket.uniqueToken}
              </span>
              <Button variant="ghost" size="icon" onClick={copyToken}>
                <Copy size={18} />
              </Button>
            </div>
          </div>

          {/* Slot Section */}
          {ticket.slotNumber && (
            <div className="bg-amber-500/10 border-2 border-amber-500 rounded-xl p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Seu Slot
              </p>
              <div className="flex items-center justify-center gap-2">
                <Hash className="text-amber-500" size={24} />
                <span className="text-4xl md:text-5xl font-bold text-amber-500">
                  {ticket.slotNumber}
                </span>
                <Button variant="ghost" size="icon" onClick={copySlot}>
                  <Copy size={18} />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Use este número para entrar na sala do jogo e no Discord
              </p>
            </div>
          )}

          {/* Tournament Info */}
          <div className="space-y-4">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Trophy size={18} className="text-primary" />
              Torneio
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="font-semibold">{ticket.tournamentName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Jogo</p>
                  <p className="font-medium">{ticket.tournamentGame}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {getGameModeIcon()} Modo
                  </p>
                  <p className="font-medium capitalize">{ticket.tournamentGameMode}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} /> Data
                </p>
                <p className="font-medium">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Player Info */}
          <div className="space-y-4">
            <h3 className="font-display font-bold flex items-center gap-2">
              <User size={18} className="text-primary" />
              Jogador
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-semibold">{ticket.playerName}</p>
                </div>
                {ticket.playerNick && (
                  <div>
                    <p className="text-xs text-muted-foreground">Nick</p>
                    <p className="font-medium">{ticket.playerNick}</p>
                  </div>
                )}
              </div>
              {ticket.partnerNick && (
                <div>
                  <p className="text-xs text-muted-foreground">Parceiro(s)</p>
                  <p className="font-medium">
                    {[ticket.partnerNick, ticket.partner2Nick, ticket.partner3Nick]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <p className="text-sm font-medium mb-2">📋 Instruções:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use o <strong className="text-foreground">Token</strong> para validar sua participação</li>
              {ticket.slotNumber && (
                <>
                  <li>• Entre na sala do jogo e aguarde no <strong className="text-foreground">Slot #{ticket.slotNumber}</strong></li>
                  <li>• Use o mesmo número no Discord para call (opcional)</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 flex gap-3">
          <Button onClick={handlePrint} className="flex-1 gap-2">
            <Printer size={18} />
            Imprimir / Salvar PDF
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}