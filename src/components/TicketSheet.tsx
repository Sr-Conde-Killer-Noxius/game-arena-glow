import { useRef, useState } from "react";
import { X, Printer, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const partnersInfo = [];
  if (ticket.partnerNick) partnersInfo.push({ nick: ticket.partnerNick, id: ticket.partnerGameId });
  if (ticket.partner2Nick) partnersInfo.push({ nick: ticket.partner2Nick, id: ticket.partner2GameId });
  if (ticket.partner3Nick) partnersInfo.push({ nick: ticket.partner3Nick, id: ticket.partner3GameId });

  const formattedDate = ticket.tournamentDate 
    ? format(new Date(ticket.tournamentDate), "dd/MM/yyyy", { locale: ptBR })
    : "A definir";

  const formattedTime = ticket.tournamentDate 
    ? format(new Date(ticket.tournamentDate), "HH:mm", { locale: ptBR })
    : "A definir";

  const generatePrintHTML = (qrDataUrl: string) => {
    return `
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <title>Ingresso - ${ticket.tournamentName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @page { size: A4; margin: 0; }
          body {
            font-family: 'Roboto', 'Segoe UI', system-ui, sans-serif;
            background-color: #0a0a0a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .ticket-page {
            width: 210mm;
            height: 297mm;
            background: linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%);
            padding: 12mm;
            display: flex;
            flex-direction: column;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #22c55e;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand {
            font-size: 14px;
            color: #22c55e;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .header h1 {
            font-size: 22px;
            color: #ffffff;
            text-transform: uppercase;
            margin-bottom: 12px;
            font-weight: 900;
          }
          .token-box {
            background-color: #000;
            color: #22c55e;
            padding: 10px 24px;
            display: inline-block;
            font-weight: 900;
            font-size: 18px;
            border-radius: 6px;
            letter-spacing: 3px;
            border: 2px solid #22c55e;
            font-family: 'Courier New', monospace;
          }
          .highlight-section {
            display: flex;
            justify-content: space-around;
            align-items: center;
            flex: 1;
            margin: 16px 0;
            background: linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 100%);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid #333;
          }
          .qr-area {
            text-align: center;
          }
          .qr-container {
            width: 160px;
            height: 160px;
            background: #ffffff;
            padding: 10px;
            border-radius: 8px;
            margin: 0 auto 10px;
          }
          .qr-container img {
            width: 100%;
            height: 100%;
          }
          .qr-label {
            font-size: 11px;
            color: #888;
          }
          .slot-area {
            text-align: center;
          }
          .slot-title {
            font-size: 14px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 8px;
          }
          .slot-number {
            font-size: 72px;
            font-weight: 900;
            color: #22c55e;
            line-height: 1;
            text-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
          }
          .slot-subtitle {
            font-size: 11px;
            color: #22c55e;
            margin-top: 8px;
          }
          .tournament-info {
            display: flex;
            justify-content: space-between;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 10px;
            margin-bottom: 16px;
          }
          .info-block {
            text-align: center;
            flex: 1;
          }
          .info-label {
            font-size: 10px;
            text-transform: uppercase;
            opacity: 0.85;
            margin-bottom: 4px;
            letter-spacing: 1px;
          }
          .info-value {
            font-size: 15px;
            font-weight: 700;
          }
          .players-section {
            background: #1a1a1a;
            border: 2px solid #22c55e;
            border-radius: 10px;
            padding: 16px 20px;
            flex: 1;
          }
          .section-title {
            font-size: 13px;
            font-weight: 900;
            color: #22c55e;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-title::before {
            content: '';
            width: 4px;
            height: 16px;
            background: #22c55e;
            border-radius: 2px;
          }
          .player-card {
            margin-bottom: 14px;
            border-bottom: 1px dashed #333;
            padding-bottom: 14px;
          }
          .player-card:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .data-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 12px;
          }
          .data-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 10px;
          }
          .data-item strong {
            display: block;
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .data-item span {
            font-size: 13px;
            font-weight: 700;
            color: #fff;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-top: 16px;
            border-top: 1px solid #333;
            padding-top: 12px;
          }
          .footer-brand {
            color: #22c55e;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="ticket-page">
          <div class="header">
            <div class="brand">🎮 JPG - Joga para Ganhar</div>
            <h1>${ticket.tournamentName}</h1>
            <div class="token-box">TOKEN: ${ticket.uniqueToken}</div>
          </div>

          <div class="highlight-section">
            <div class="qr-area">
              <div class="qr-container">
                <img src="${qrDataUrl}" alt="QR Code" />
              </div>
              <div class="qr-label">Escaneie para verificar</div>
            </div>
            <div class="slot-area">
              <div class="slot-title">Seu Slot</div>
              <div class="slot-number">#${ticket.slotNumber || '?'}</div>
              <div class="slot-subtitle">Use na sala do jogo</div>
            </div>
          </div>

          <div class="tournament-info">
            <div class="info-block">
              <div class="info-label">Jogo / Modo</div>
              <div class="info-value">${ticket.tournamentGame} - ${ticket.tournamentGameMode}</div>
            </div>
            <div class="info-block">
              <div class="info-label">Data</div>
              <div class="info-value">${formattedDate}</div>
            </div>
            <div class="info-block">
              <div class="info-label">Horário</div>
              <div class="info-value">${formattedTime}</div>
            </div>
          </div>

          <div class="players-section">
            <div class="player-card">
              <div class="section-title">👤 Jogador Principal</div>
              <div class="data-grid">
                <div class="data-item">
                  <strong>Nome</strong>
                  <span>${ticket.playerName}</span>
                </div>
                <div class="data-item">
                  <strong>Nick</strong>
                  <span>${ticket.playerNick || '-'}</span>
                </div>
                <div class="data-item">
                  <strong>ID</strong>
                  <span>${ticket.playerGameId || '-'}</span>
                </div>
              </div>
              <div class="data-grid-2">
                <div class="data-item">
                  <strong>CPF</strong>
                  <span>${ticket.playerCpf || '-'}</span>
                </div>
                <div class="data-item">
                  <strong>WhatsApp</strong>
                  <span>${ticket.playerWhatsapp || '-'}</span>
                </div>
              </div>
            </div>

            ${partnersInfo.length > 0 ? `
            <div class="player-card">
              <div class="section-title">🤝 Parceiro(s)</div>
              ${partnersInfo.map((p, i) => `
              <div class="data-grid" style="margin-bottom: ${i < partnersInfo.length - 1 ? '10px' : '0'};">
                <div class="data-item">
                  <strong>Parceiro ${i + 1}</strong>
                  <span>${p.nick}</span>
                </div>
                <div class="data-item">
                  <strong>ID</strong>
                  <span>${p.id || '-'}</span>
                </div>
                <div class="data-item"></div>
              </div>
              `).join('')}
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <span class="footer-brand">JPG - Joga para Ganhar</span> | Ingresso pessoal e intransferível.
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const getQRDataUrl = (): string => {
    const qrElement = document.querySelector('#hidden-qr svg') as SVGElement | null;
    if (qrElement) {
      const svgData = new XMLSerializer().serializeToString(qrElement);
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    }
    return '';
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    const qrDataUrl = getQRDataUrl();
    const htmlContent = generatePrintHTML(qrDataUrl);

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm';
      tempContainer.style.minHeight = '297mm';
      document.body.appendChild(tempContainer);

      const qrDataUrl = getQRDataUrl();
      const htmlContent = generatePrintHTML(qrDataUrl);

      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      
      if (bodyMatch && styleMatch) {
        tempContainer.innerHTML = `<style>${styleMatch[1]}</style>${bodyMatch[1]}`;
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0a',
        width: 794,
        height: 1123,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ingresso_${ticket.tournamentName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

      document.body.removeChild(tempContainer);
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(ticket.uniqueToken);
    toast.success("Token copiado!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-foreground">Ficha de Ingresso</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tournament Name */}
          <div className="text-center border-b border-primary/30 pb-4">
            <p className="text-xs text-primary font-semibold tracking-widest mb-1">🎮 JPG - JOGA PARA GANHAR</p>
            <h3 className="text-xl font-bold text-foreground">{ticket.tournamentName}</h3>
          </div>

          {/* Token & QR & Slot */}
          <div className="bg-muted/50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-around gap-6">
            {/* QR Code */}
            <div className="text-center">
              <div className="bg-white p-3 rounded-lg inline-block mb-2">
                <QRCodeSVG value={`JPG-TICKET:${ticket.uniqueToken}`} size={120} />
              </div>
              <p className="text-xs text-muted-foreground">Escaneie para verificar</p>
            </div>

            {/* Slot */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Seu Slot</p>
              <p className="text-6xl font-black text-primary" style={{ textShadow: '0 0 20px hsl(var(--primary) / 0.5)' }}>
                #{ticket.slotNumber || '?'}
              </p>
              <p className="text-xs text-primary mt-1">Use na sala do jogo</p>
            </div>
          </div>

          {/* Token Box */}
          <div className="bg-black border-2 border-primary rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">TOKEN DE ACESSO</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-xl font-bold text-primary tracking-widest">{ticket.uniqueToken}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToken}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tournament Info */}
          <div className="bg-primary text-primary-foreground rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs opacity-80 uppercase">Jogo / Modo</p>
              <p className="font-bold text-sm">{ticket.tournamentGame} - {ticket.tournamentGameMode}</p>
            </div>
            <div>
              <p className="text-xs opacity-80 uppercase">Data</p>
              <p className="font-bold text-sm">{formattedDate}</p>
            </div>
            <div>
              <p className="text-xs opacity-80 uppercase">Horário</p>
              <p className="font-bold text-sm">{formattedTime}</p>
            </div>
          </div>

          {/* Player Info */}
          <div className="border border-primary/50 rounded-lg p-4">
            <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              👤 Jogador Principal
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Nome</p>
                <p className="font-semibold text-foreground">{ticket.playerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Nick</p>
                <p className="font-semibold text-foreground">{ticket.playerNick || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">ID</p>
                <p className="font-semibold text-foreground">{ticket.playerGameId || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase">CPF</p>
                <p className="font-semibold text-foreground">{ticket.playerCpf || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">WhatsApp</p>
                <p className="font-semibold text-foreground">{ticket.playerWhatsapp || '-'}</p>
              </div>
            </div>
          </div>

          {/* Partners Info */}
          {partnersInfo.length > 0 && (
            <div className="border border-primary/50 rounded-lg p-4">
              <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                🤝 Parceiro(s)
              </h4>
              {partnersInfo.map((partner, index) => (
                <div key={index} className={`grid grid-cols-2 gap-4 text-sm ${index > 0 ? 'mt-3 pt-3 border-t border-border/50' : ''}`}>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Parceiro {index + 1}</p>
                    <p className="font-semibold text-foreground">{partner.nick}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">ID</p>
                    <p className="font-semibold text-foreground">{partner.id || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleDownloadPDF} 
            className="flex-1"
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Gerando...' : 'Baixar PDF'}
          </Button>
          <Button 
            onClick={handlePrint} 
            variant="outline" 
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Hidden QR for PDF/Print generation */}
      <div id="hidden-qr" className="hidden">
        <QRCodeSVG value={`JPG-TICKET:${ticket.uniqueToken}`} size={150} />
      </div>
    </div>
  );
}
