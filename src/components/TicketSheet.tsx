import { useRef } from "react";
import { X, Printer, Copy, Users, User, Hash, Trophy, Calendar, Phone, MapPin, FileText } from "lucide-react";
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
    playerGameId?: string;
    playerCpf?: string;
    playerCep?: string;
    playerWhatsapp?: string;
    partnerNick?: string;
    partnerGameId?: string;
    partner2Nick?: string;
    partner2GameId?: string;
    partner3Nick?: string;
    partner3GameId?: string;
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

    // Build partners info for print
    const partnersInfo = [];
    if (ticket.partnerNick) partnersInfo.push({ nick: ticket.partnerNick, id: ticket.partnerGameId });
    if (ticket.partner2Nick) partnersInfo.push({ nick: ticket.partner2Nick, id: ticket.partner2GameId });
    if (ticket.partner3Nick) partnersInfo.push({ nick: ticket.partner3Nick, id: ticket.partner3GameId });

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
            .info-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
            .info-item label { 
              font-size: 12px; 
              color: #6b7280; 
              display: block;
              margin-bottom: 4px;
            }
            .info-item span { font-weight: 600; font-size: 14px; }
            .partner-row {
              display: flex;
              gap: 16px;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .partner-row:last-child { border-bottom: none; }
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
                  <div class="slot-label">Use este número quando entrar na sala do jogo</div>
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
                <div class="section-title">Jogador Principal</div>
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
                  ${ticket.playerGameId ? `
                  <div class="info-item">
                    <label>ID do Jogo</label>
                    <span>${ticket.playerGameId}</span>
                  </div>
                  ` : ''}
                  ${ticket.playerCpf ? `
                  <div class="info-item">
                    <label>CPF</label>
                    <span>${ticket.playerCpf}</span>
                  </div>
                  ` : ''}
                  ${ticket.playerCep ? `
                  <div class="info-item">
                    <label>CEP</label>
                    <span>${ticket.playerCep}</span>
                  </div>
                  ` : ''}
                  ${ticket.playerWhatsapp ? `
                  <div class="info-item">
                    <label>WhatsApp</label>
                    <span>${ticket.playerWhatsapp}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ${partnersInfo.length > 0 ? `
              <div class="section">
                <div class="section-title">Parceiro(s)</div>
                ${partnersInfo.map((p, i) => `
                <div class="partner-row">
                  <div class="info-item">
                    <label>Parceiro ${i + 1}</label>
                    <span>${p.nick}</span>
                  </div>
                  <div class="info-item">
                    <label>ID</label>
                    <span>${p.id || '-'}</span>
                  </div>
                </div>
                `).join('')}
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <strong>📋 Como usar seu ingresso:</strong><br/><br/>
              1. Acesse o menu <strong>"Entrar na Play"</strong> no painel lateral<br/>
              2. Digite o <strong>Token</strong> acima para visualizar o ID e Senha da sala<br/>
              ${ticket.slotNumber ? `3. Entre na sala do jogo usando seu <strong>Slot #${ticket.slotNumber}</strong><br/>
              4. Use o mesmo número de Slot no Discord para a call (opcional)<br/><br/>
              <em>⚠️ Se a sala ainda não estiver disponível, aguarde a configuração pelo administrador.</em>` : `3. Aguarde a atribuição do seu slot após a configuração da sala<br/><br/>
              <em>⚠️ Se a sala ainda não estiver disponível, aguarde a configuração pelo administrador.</em>`}
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

  // Build partners list
  const partners = [];
  if (ticket.partnerNick) partners.push({ nick: ticket.partnerNick, id: ticket.partnerGameId });
  if (ticket.partner2Nick) partners.push({ nick: ticket.partner2Nick, id: ticket.partner2GameId });
  if (ticket.partner3Nick) partners.push({ nick: ticket.partner3Nick, id: ticket.partner3GameId });

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
                Use este número quando entrar na sala e no Discord
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
              Jogador Principal
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
              {ticket.playerGameId && (
                <div>
                  <p className="text-xs text-muted-foreground">ID do Jogo</p>
                  <p className="font-medium">{ticket.playerGameId}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {ticket.playerCpf && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText size={12} /> CPF
                    </p>
                    <p className="font-medium">{ticket.playerCpf}</p>
                  </div>
                )}
                {ticket.playerCep && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={12} /> CEP
                    </p>
                    <p className="font-medium">{ticket.playerCep}</p>
                  </div>
                )}
              </div>
              {ticket.playerWhatsapp && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone size={12} /> WhatsApp
                  </p>
                  <p className="font-medium">{ticket.playerWhatsapp}</p>
                </div>
              )}
            </div>
          </div>

          {/* Partners Info */}
          {partners.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Parceiro(s)
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                {partners.map((partner, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs text-muted-foreground">Parceiro {index + 1}</p>
                      <p className="font-medium">{partner.nick}</p>
                    </div>
                    {partner.id && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">ID</p>
                        <p className="font-medium">{partner.id}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <p className="text-sm font-medium mb-2">📋 Como usar seu ingresso:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>1. Acesse o menu <strong className="text-foreground">"Entrar na Play"</strong> no painel lateral</li>
              <li>2. Digite o <strong className="text-foreground">Token</strong> acima para ver ID e Senha da sala</li>
              {ticket.slotNumber ? (
                <>
                  <li>3. Entre na sala do jogo usando seu <strong className="text-foreground">Slot #{ticket.slotNumber}</strong></li>
                  <li>4. Use o mesmo número de Slot no Discord para a call (opcional)</li>
                </>
              ) : (
                <li>3. Aguarde a atribuição do seu slot após a configuração da sala</li>
              )}
            </ul>
            <p className="text-xs text-muted-foreground mt-3 italic">
              ⚠️ Se a sala ainda não estiver disponível, aguarde a configuração pelo administrador.
            </p>
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
