import { useRef, useState } from "react";
import { X, Printer, Copy, Users, User, Hash, Trophy, Calendar, Phone, MapPin, FileText, Download } from "lucide-react";
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
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // Build partners info
  const partnersInfo = [];
  if (ticket.partnerNick) partnersInfo.push({ nick: ticket.partnerNick, id: ticket.partnerGameId });
  if (ticket.partner2Nick) partnersInfo.push({ nick: ticket.partner2Nick, id: ticket.partner2GameId });
  if (ticket.partner3Nick) partnersInfo.push({ nick: ticket.partner3Nick, id: ticket.partner3GameId });

  const formattedDate = ticket.tournamentDate 
    ? format(new Date(ticket.tournamentDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    : "A definir";

  const generatePrintHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ingresso - ${ticket.tournamentName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 12mm; }
            body { 
              font-family: 'Segoe UI', system-ui, sans-serif;
              background: #fff;
              padding: 0;
              font-size: 12px;
              height: 100vh;
            }
            .ticket {
              width: 100%;
              height: calc(100vh - 24mm);
              border: 3px solid #10b981;
              border-radius: 16px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }
            .header {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 20px;
              text-align: center;
            }
            .header h1 { font-size: 22px; margin-bottom: 4px; font-weight: 700; }
            .header p { opacity: 0.9; font-size: 13px; }
            .body { 
              padding: 20px;
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .top-section {
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              gap: 20px;
              align-items: center;
              margin-bottom: 24px;
              padding-bottom: 20px;
              border-bottom: 2px dashed #e5e7eb;
            }
            .token-box {
              background: #f0fdf4;
              border: 2px solid #10b981;
              border-radius: 12px;
              padding: 16px;
              text-align: center;
            }
            .token-label {
              font-size: 10px;
              text-transform: uppercase;
              color: #6b7280;
              margin-bottom: 8px;
              font-weight: 600;
              letter-spacing: 1px;
            }
            .token {
              font-family: 'Courier New', monospace;
              font-size: 22px;
              font-weight: bold;
              color: #10b981;
              letter-spacing: 3px;
            }
            .qr-box {
              background: #fff;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 12px;
              text-align: center;
            }
            .qr-box img { width: 100px; height: 100px; }
            .qr-label { font-size: 9px; color: #6b7280; margin-top: 6px; }
            .slot-box {
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 12px;
              padding: 16px;
              text-align: center;
            }
            .slot {
              font-size: 42px;
              font-weight: bold;
              color: #d97706;
              line-height: 1;
            }
            .slot-label {
              font-size: 10px;
              color: #92400e;
              margin-top: 8px;
              font-weight: 500;
            }
            .content-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              flex: 1;
            }
            .section {
              background: #f9fafb;
              border-radius: 12px;
              padding: 16px;
            }
            .section-title {
              font-size: 11px;
              text-transform: uppercase;
              color: #10b981;
              margin-bottom: 12px;
              font-weight: 700;
              letter-spacing: 1px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .section-title::before {
              content: '';
              width: 4px;
              height: 16px;
              background: #10b981;
              border-radius: 2px;
            }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .info-item label { 
              font-size: 10px; 
              color: #6b7280; 
              display: block;
              margin-bottom: 2px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-item span { 
              font-weight: 600; 
              font-size: 13px;
              color: #1f2937;
            }
            .info-full { grid-column: span 2; }
            .partner-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .partner-item:last-child { border-bottom: none; }
            .footer {
              background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
              border-top: 2px solid #10b981;
              padding: 16px 20px;
              margin-top: auto;
            }
            .footer-title { 
              font-size: 13px; 
              font-weight: 700; 
              color: #059669;
              margin-bottom: 10px;
            }
            .footer-list { 
              margin: 0; 
              padding-left: 20px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 6px 20px;
            }
            .footer-list li { 
              font-size: 11px;
              color: #374151;
            }
            .footer-list li strong { color: #10b981; }
            .footer-note { 
              margin-top: 12px; 
              font-size: 10px; 
              color: #6b7280;
              font-style: italic;
              text-align: center;
              padding-top: 10px;
              border-top: 1px dashed #d1d5db;
            }
            @media print {
              body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .ticket { page-break-inside: avoid; height: auto; min-height: calc(100vh - 24mm); }
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
              <div class="top-section">
                <div class="token-box">
                  <div class="token-label">Seu Token de Acesso</div>
                  <div class="token">${ticket.uniqueToken}</div>
                </div>
                <div class="qr-box">
                  <img src="${generateQRCodeDataURL()}" alt="QR Code" />
                  <div class="qr-label">Escaneie para verificar</div>
                </div>
                ${ticket.slotNumber ? `
                <div class="slot-box">
                  <div class="token-label">Seu Slot</div>
                  <div class="slot">#${ticket.slotNumber}</div>
                  <div class="slot-label">Use na sala do jogo</div>
                </div>
                ` : '<div class="slot-box"><div class="token-label">Slot</div><div class="slot" style="font-size: 20px; color: #9ca3af;">Pendente</div><div class="slot-label">Aguardando atribuição</div></div>'}
              </div>
              <div class="content-grid">
                <div class="section">
                  <div class="section-title">🏆 Torneio</div>
                  <div class="info-grid">
                    <div class="info-item info-full">
                      <label>Nome do Torneio</label>
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
                    <div class="info-item info-full">
                      <label>Data e Hora</label>
                      <span>${formattedDate}</span>
                    </div>
                  </div>
                </div>
                <div class="section">
                  <div class="section-title">👤 Jogador Principal</div>
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
                <div class="section" style="grid-column: span 2;">
                  <div class="section-title">👥 Parceiro(s)</div>
                  <div style="display: grid; grid-template-columns: repeat(${Math.min(partnersInfo.length, 3)}, 1fr); gap: 16px;">
                    ${partnersInfo.map((p, i) => `
                    <div class="partner-item" style="flex-direction: column; border: none; background: #fff; padding: 12px; border-radius: 8px;">
                      <div class="info-item">
                        <label>Parceiro ${i + 1}</label>
                        <span>${p.nick}</span>
                      </div>
                      <div class="info-item" style="margin-top: 8px;">
                        <label>ID</label>
                        <span>${p.id || '-'}</span>
                      </div>
                    </div>
                    `).join('')}
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
            <div class="footer">
              <div class="footer-title">📋 Como usar seu ingresso:</div>
              <ol class="footer-list">
                <li>Acesse o menu <strong>"Entrar na Play"</strong></li>
                <li>Digite o <strong>Token</strong> para ver a sala</li>
                ${ticket.slotNumber ? `<li>Entre usando seu <strong>Slot #${ticket.slotNumber}</strong></li>
                <li>Use o Slot no <strong>Discord</strong> (opcional)</li>` : `<li>Aguarde a <strong>atribuição do slot</strong></li><li></li>`}
              </ol>
              <div class="footer-note">⚠️ Se a sala não estiver disponível, aguarde a configuração pelo administrador.</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generateQRCodeDataURL = () => {
    const canvas = document.createElement('canvas');
    const size = 100;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Simple QR code placeholder - the actual QR will be rendered properly in print
    const qrData = `JPG-TICKET:${ticket.uniqueToken}`;
    
    // Create a temporary SVG element to get the QR code
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"></svg>`;
    
    // We'll use a data URL approach for the QR code
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#10b981">${ticket.uniqueToken}</text>
      </svg>
    `)}`;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    // Generate proper QR code for print
    const qrCanvas = document.getElementById('qr-code-print') as HTMLCanvasElement | null;
    let qrDataUrl = '';
    
    // Get QR code as data URL
    const qrElement = document.querySelector('#hidden-qr svg') as SVGElement | null;
    if (qrElement) {
      const svgData = new XMLSerializer().serializeToString(qrElement);
      qrDataUrl = `data:image/svg+xml;base64,${btoa(svgData)}`;
    }

    const htmlContent = generatePrintHTML().replace(
      `<img src="${generateQRCodeDataURL()}" alt="QR Code" />`,
      `<img src="${qrDataUrl || generateQRCodeDataURL()}" alt="QR Code" />`
    );

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Create a temporary container for PDF generation
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm';
      tempContainer.style.minHeight = '297mm';
      tempContainer.style.background = 'white';
      document.body.appendChild(tempContainer);

      // Get QR code as data URL
      const qrElement = document.querySelector('#hidden-qr svg') as SVGElement | null;
      let qrDataUrl = '';
      if (qrElement) {
        const svgData = new XMLSerializer().serializeToString(qrElement);
        qrDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
      }

      const htmlContent = generatePrintHTML().replace(
        `<img src="${generateQRCodeDataURL()}" alt="QR Code" />`,
        `<img src="${qrDataUrl}" alt="QR Code" style="width: 100px; height: 100px;" />`
      );

      // Extract body content
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      
      if (bodyMatch && styleMatch) {
        tempContainer.innerHTML = `<style>${styleMatch[1]}</style>${bodyMatch[1]}`;
      }

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width at 96 DPI
        height: 1123, // A4 height at 96 DPI
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
      console.error('Error generating PDF:', error);
      toast.error("Erro ao gerar PDF. Tente usar a opção de impressão.");
    } finally {
      setIsDownloading(false);
    }
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

      {/* Hidden QR Code for capturing */}
      <div id="hidden-qr" className="hidden">
        <QRCodeSVG
          value={`JPG-TICKET:${ticket.uniqueToken}`}
          size={100}
          level="M"
          bgColor="#ffffff"
          fgColor="#10b981"
        />
      </div>

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

          {/* QR Code and Slot Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <QRCodeSVG
                value={`JPG-TICKET:${ticket.uniqueToken}`}
                size={80}
                level="M"
                bgColor="transparent"
                fgColor="currentColor"
                className="text-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">Escaneie para verificar</p>
            </div>
            
            {ticket.slotNumber ? (
              <div className="bg-amber-500/10 border-2 border-amber-500 rounded-xl p-4 text-center flex flex-col justify-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Seu Slot
                </p>
                <div className="flex items-center justify-center gap-1">
                  <Hash className="text-amber-500" size={20} />
                  <span className="text-4xl font-bold text-amber-500">
                    {ticket.slotNumber}
                  </span>
                  <Button variant="ghost" size="icon" onClick={copySlot} className="h-8 w-8">
                    <Copy size={14} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use na sala e Discord
                </p>
              </div>
            ) : (
              <div className="bg-muted/30 border border-border rounded-xl p-4 text-center flex flex-col justify-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Slot
                </p>
                <span className="text-2xl font-bold text-muted-foreground">
                  Pendente
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando atribuição
                </p>
              </div>
            )}
          </div>

          {/* Tournament Info */}
          <div className="space-y-3">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Trophy size={18} className="text-primary" />
              Torneio
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="font-semibold">{ticket.tournamentName}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar size={12} /> Data
                  </p>
                  <p className="font-medium text-sm">{formattedDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Player Info */}
          <div className="space-y-3">
            <h3 className="font-display font-bold flex items-center gap-2">
              <User size={18} className="text-primary" />
              Jogador Principal
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-2 gap-3">
                {ticket.playerGameId && (
                  <div>
                    <p className="text-xs text-muted-foreground">ID do Jogo</p>
                    <p className="font-medium">{ticket.playerGameId}</p>
                  </div>
                )}
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
          </div>

          {/* Partners Info */}
          {partners.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Parceiro(s)
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  {partners.map((partner, index) => (
                    <div key={index} className="bg-background/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Parceiro {index + 1}</p>
                      <p className="font-medium">{partner.nick}</p>
                      {partner.id && (
                        <p className="text-xs text-muted-foreground mt-1">ID: {partner.id}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <p className="text-sm font-medium mb-2">📋 Como usar seu ingresso:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. Acesse o menu <strong className="text-foreground">"Entrar na Play"</strong></li>
              <li>2. Digite o <strong className="text-foreground">Token</strong> para ver a sala</li>
              {ticket.slotNumber ? (
                <>
                  <li>3. Entre usando seu <strong className="text-foreground">Slot #{ticket.slotNumber}</strong></li>
                  <li>4. Use o Slot no Discord (opcional)</li>
                </>
              ) : (
                <li>3. Aguarde a atribuição do seu slot</li>
              )}
            </ul>
            <p className="text-xs text-muted-foreground mt-2 italic">
              ⚠️ Aguarde a configuração se a sala não estiver disponível.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 flex gap-3">
          <Button 
            onClick={handleDownloadPDF} 
            className="flex-1 gap-2"
            disabled={isDownloading}
          >
            <Download size={18} />
            {isDownloading ? "Gerando..." : "Baixar PDF"}
          </Button>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer size={18} />
            Imprimir
          </Button>
          <Button variant="ghost" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
