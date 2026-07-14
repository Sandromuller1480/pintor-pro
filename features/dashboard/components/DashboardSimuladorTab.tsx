import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Paintbrush,
  Eraser,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Sliders,
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import type { CurrentPainterProfile } from '../types';

interface DashboardSimuladorTabProps {
  currentProfile: CurrentPainterProfile | null;
}

interface ColorOption {
  name: string;
  hex: string;
}

interface TextureOption {
  id: string;
  name: string;
  description: string;
}

const PREMIUM_COLORS: ColorOption[] = [
  { name: 'Branco Gelo', hex: '#F0F4F8' },
  { name: 'Cinza Crômio', hex: '#A0AAB2' },
  { name: 'Azul Petróleo', hex: '#1E3E54' },
  { name: 'Verde Alecrim', hex: '#5E7260' },
  { name: 'Terracota', hex: '#B85843' },
  { name: 'Rosa Algodão', hex: '#E6C0C6' },
  { name: 'Amarelo Mostarda', hex: '#DB9B3B' },
  { name: 'Verde Eucalipto', hex: '#3E5C52' },
  { name: 'Preto Absoluto', hex: '#1C1C1C' },
  { name: 'Camurça', hex: '#C2B095' },
  { name: 'Off White', hex: '#F7F5F0' },
  { name: 'Cinza Grafite', hex: '#42494D' }
];

const TEXTURE_OPTIONS: TextureOption[] = [
  { id: 'lisa', name: 'Pintura Lisa', description: 'Acabamento acrílico fosco padrão.' },
  { id: 'cimento', name: 'Cimento Queimado', description: 'Efeito manchado contemporâneo.' },
  { id: 'grafiato', name: 'Grafiato / Rústico', description: 'Ranhuras verticais marcadas.' },
  { id: 'areia', name: 'Textura de Areia', description: 'Aspecto levemente granulado.' }
];

export const DashboardSimuladorTab: React.FC<DashboardSimuladorTabProps> = ({ currentProfile }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#A0AAB2');
  const [selectedTexture, setSelectedTexture] = useState<string>('lisa');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [opacity, setOpacity] = useState<number>(85); // em %
  const [tolerance, setTolerance] = useState<number>(25); // Sensibilidade do balde/varredura
  const [tool, setTool] = useState<'brush' | 'eraser' | 'magic'>('brush');
  const [description, setDescription] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Limpa feedback após 4 segundos
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Função para desenhar a textura no Canvas
  const createTexturePattern = (
    ctx: CanvasRenderingContext2D,
    type: string,
    width: number,
    height: number,
    colorHex: string
  ): CanvasPattern | string => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return colorHex;

    tempCanvas.width = 120;
    tempCanvas.height = 120;

    // Fundo da cor base
    tempCtx.fillStyle = colorHex;
    tempCtx.fillRect(0, 0, 120, 120);

    if (type === 'cimento') {
      // Efeito manchado do cimento queimado (nuvens com gradiente/ruído)
      for (let i = 0; i < 6; i++) {
        const x = Math.random() * 120;
        const y = Math.random() * 120;
        const r = 20 + Math.random() * 30;
        const grad = tempCtx.createRadialGradient(x, y, 0, x, y, r);
        
        // Variações sutis de tom (mais claro e mais escuro)
        const alpha = 0.08 + Math.random() * 0.12;
        const shade = Math.random() > 0.5 ? '255, 255, 255' : '0, 0, 0';
        
        grad.addColorStop(0, `rgba(${shade}, ${alpha})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        tempCtx.fillStyle = grad;
        tempCtx.beginPath();
        tempCtx.arc(x, y, r, 0, Math.PI * 2);
        tempCtx.fill();
      }
    } else if (type === 'grafiato') {
      // Ranhuras verticais
      tempCtx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      tempCtx.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * 120;
        const yLength = 15 + Math.random() * 35;
        const yStart = Math.random() * 120;
        tempCtx.beginPath();
        tempCtx.moveTo(x, yStart);
        tempCtx.lineTo(x, yStart + yLength);
        tempCtx.stroke();
      }
      
      // Detalhes em branco para profundidade
      tempCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      tempCtx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 120;
        const yLength = 10 + Math.random() * 20;
        const yStart = Math.random() * 120;
        tempCtx.beginPath();
        tempCtx.moveTo(x, yStart);
        tempCtx.lineTo(x, yStart + yLength);
        tempCtx.stroke();
      }
    } else if (type === 'areia') {
      // Pontinhos finos
      tempCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let i = 0; i < 180; i++) {
        const x = Math.random() * 120;
        const y = Math.random() * 120;
        tempCtx.fillRect(x, y, 1, 1);
      }
      tempCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let i = 0; i < 120; i++) {
        const x = Math.random() * 120;
        const y = Math.random() * 120;
        tempCtx.fillRect(x, y, 1, 1);
      }
    }

    const pattern = ctx.createPattern(tempCanvas, 'repeat');
    return pattern || colorHex;
  };

  // Renderiza o Canvas juntando a Imagem Original e a Máscara Pintada
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const img = imageRef.current;

    if (!canvas || !maskCanvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Limpa e desenha a foto de fundo original
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // 2. Cria canvas temporário para aplicar a cor do pincel na máscara
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Desenha a máscara desenhada no tempCanvas
    tempCtx.drawImage(maskCanvas, 0, 0);

    // Aplica a cor / textura selecionada usando 'source-in' (recorta o desenho da máscara)
    tempCtx.globalCompositeOperation = 'source-in';
    
    const patternOrColor = createTexturePattern(tempCtx, selectedTexture, width, height, selectedColor);
    tempCtx.fillStyle = patternOrColor;
    tempCtx.fillRect(0, 0, width, height);

    // 3. Desenha a máscara colorizada de volta no canvas principal usando Blend Mode
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    
    // Blend mode multiply preserva sombras e ranhuras.
    // Para texturas claras, 'overlay' pode dar mais relevo, mas 'multiply' garante realismo de sombras.
    ctx.globalCompositeOperation = selectedTexture !== 'lisa' ? 'overlay' : 'multiply';
    
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
  };

  // Atualiza as dimensões do Canvas e carrega a imagem
  const handleImageLoad = (src: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      imageRef.current = img;
      
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (!canvas || !maskCanvas) return;

      // Mantém proporções da imagem dentro de uma área útil máxima (ex: 800px)
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      maskCanvas.width = width;
      maskCanvas.height = height;

      // Garante que o canvas da máscara esteja limpo inicialmente
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.clearRect(0, 0, width, height);
      }

      redrawCanvas();
    };
  };

  // Observa mudanças nas configurações para redesenhar
  useEffect(() => {
    if (imageSrc) {
      redrawCanvas();
    }
  }, [selectedColor, selectedTexture, opacity]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageSrc(event.target.result);
        handleImageLoad(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Coordenadas relativas do toque/mouse
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calcula coordenadas baseado na proporção do desenho real x tamanho exibido em tela
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    return { x, y };
  };

  // Algoritmo Flood Fill para Varredura Mágica
  const executeFloodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const img = imageRef.current;

    if (!canvas || !maskCanvas || !img) return;

    const width = canvas.width;
    const height = canvas.height;

    // Desenha imagem limpa no temp canvas para pegar as cores reais originais
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(img, 0, 0, width, height);
    const imgData = tempCtx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    // Pega cor inicial clicada
    const px = Math.floor(startX);
    const py = Math.floor(startY);
    if (px < 0 || px >= width || py < 0 || py >= height) return;

    const startIdx = (py * width + px) * 4;
    const startR = pixels[startIdx];
    const startG = pixels[startIdx + 1];
    const startB = pixels[startIdx + 2];

    const visited = new Uint8Array(width * height);
    const mask = new Uint8Array(width * height);

    // Estrutura de fila rápida usando ponteiro (head++)
    const queueX = new Int32Array(width * height);
    const queueY = new Int32Array(width * height);
    let head = 0;
    let tail = 0;

    queueX[tail] = px;
    queueY[tail] = py;
    visited[py * width + px] = 1;
    tail++;

    while (head < tail) {
      const cx = queueX[head];
      const cy = queueY[head];
      head++;

      const currentIdx = cy * width + cx;
      mask[currentIdx] = 255;

      // 4 Direções
      const neighbors = [
        { x: cx + 1, y: cy },
        { x: cx - 1, y: cy },
        { x: cx, y: cy + 1 },
        { x: cx, y: cy - 1 }
      ];

      for (let i = 0; i < 4; i++) {
        const nx = neighbors[i].x;
        const ny = neighbors[i].y;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (visited[nIdx] === 0) {
            visited[nIdx] = 1;
            const pIdx = nIdx * 4;
            const r = pixels[pIdx];
            const g = pixels[pIdx + 1];
            const b = pixels[pIdx + 2];

            // Diferença de cor euclidiana
            const diff = Math.sqrt(
              (r - startR) ** 2 +
              (g - startG) ** 2 +
              (b - startB) ** 2
            );

            if (diff <= tolerance) {
              queueX[tail] = nx;
              queueY[tail] = ny;
              tail++;
            }
          }
        }
      }
    }

    // Desenha o resultado na máscara atual do canvas
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    const maskImgData = maskCtx.getImageData(0, 0, width, height);
    const maskData = maskImgData.data;

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 255) {
        const idx = i * 4;
        maskData[idx] = 0;       // R
        maskData[idx + 1] = 0;   // G
        maskData[idx + 2] = 0;   // B
        maskData[idx + 3] = 255; // Alpha sólido
      }
    }

    maskCtx.putImageData(maskImgData, 0, 0);
    redrawCanvas();
  };

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;
    e.preventDefault();

    const { x, y } = getCanvasCoords(e);

    // Se estiver usando varredura mágica, executa flood fill direto e encerra
    if (tool === 'magic') {
      executeFloodFill(x, y);
      return;
    }

    isDrawingRef.current = true;

    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    maskCtx.beginPath();
    maskCtx.moveTo(x, y);

    // Configura o traço da máscara
    maskCtx.lineWidth = brushSize;
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';

    if (tool === 'brush') {
      // Desenha com cor preta sólida na máscara
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.strokeStyle = 'rgba(0, 0, 0, 1)';
    } else {
      // Apaga desenhando transparente
      maskCtx.globalCompositeOperation = 'destination-out';
    }

    maskCtx.lineTo(x, y);
    maskCtx.stroke();
    redrawCanvas();
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !imageSrc || tool === 'magic') return;
    e.preventDefault();

    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    const { x, y } = getCanvasCoords(e);
    maskCtx.lineTo(x, y);
    maskCtx.stroke();
    redrawCanvas();
  };

  const handleStopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClear = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    redrawCanvas();
  };

  // Exportar PDF
  const handleExportPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) {
      setFeedback({ type: 'error', message: 'Carregue e pinte uma imagem antes de gerar o PDF.' });
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Cabeçalho Corporativo
      doc.setFillColor(0, 7, 71); // #000747
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('PINTOR PRO', 15, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('RELATÓRIO DE SIMULAÇÃO DE CORES & TEXTURAS', 15, 26);

      // Data de Emissão
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      doc.setFontSize(9);
      doc.text(`Data: ${formattedDate}`, 170, 20);

      // 2. Informações do Pintor
      doc.setTextColor(30, 41, 59); // #1e293b
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('PROFISSIONAL RESPONSÁVEL', 15, 48);
      doc.line(15, 50, 195, 50);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const name = currentProfile?.fullName || 'Pintor Profissional';
      const whatsapp = currentProfile?.whatsapp || 'Não informado';
      const email = currentProfile?.email || 'Não informado';
      const cityUf = currentProfile?.city ? `${currentProfile.city} - ${currentProfile.uf}` : 'Não informada';

      doc.text(`Nome: ${name}`, 15, 56);
      doc.text(`WhatsApp: ${whatsapp}`, 15, 62);
      doc.text(`E-mail: ${email}`, 110, 56);
      doc.text(`Região: ${cityUf}`, 110, 62);

      // 3. Informações do Cliente (se fornecidas)
      let currentY = 70;
      if (clientName || clientAddress) {
        doc.setFont('helvetica', 'bold');
        doc.text('DADOS DO CLIENTE / OBRA', 15, 75);
        doc.line(15, 77, 195, 77);

        doc.setFont('helvetica', 'normal');
        if (clientName) {
          doc.text(`Cliente: ${clientName}`, 15, 83);
        }
        if (clientAddress) {
          doc.text(`Local da Obra: ${clientAddress}`, 15, 89);
        }
        currentY = 95;
      } else {
        currentY = 72;
      }

      // 4. Detalhes da Simulação
      doc.setFont('helvetica', 'bold');
      doc.text('ESPECIFICAÇÕES DA PINTURA SIMULADA', 15, currentY + 3);
      doc.line(15, currentY + 5, 195, currentY + 5);

      doc.setFont('helvetica', 'normal');
      const colorName = PREMIUM_COLORS.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name || 'Cor Personalizada';
      const textureName = TEXTURE_OPTIONS.find(t => t.id === selectedTexture)?.name || 'Pintura Lisa';

      doc.text(`Cor Selecionada: ${colorName} (${selectedColor})`, 15, currentY + 11);
      doc.text(`Acabamento/Efeito: ${textureName}`, 110, currentY + 11);

      // 5. Imagem da Simulação
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      // Proporções para encaixar no PDF mantendo o aspect ratio
      const maxImgW = 180;
      const maxImgH = 100;
      let imgW = canvas.width;
      let imgH = canvas.height;

      const scale = Math.min(maxImgW / imgW, maxImgH / imgH);
      imgW = imgW * scale;
      imgH = imgH * scale;

      // Centraliza a imagem horizontalmente
      const imgX = 15 + (maxImgW - imgW) / 2;
      const imgY = currentY + 18;

      doc.rect(15, imgY - 2, 180, imgH + 4, 'S'); // Borda de proteção
      doc.addImage(imgData, 'JPEG', imgX, imgY, imgW, imgH);

      // 6. Descrição e Observações do Pintor
      const descY = imgY + imgH + 10;
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIÇÃO E INSTRUÇÕES TÉCNICAS', 15, descY + 3);
      doc.line(15, descY + 5, 195, descY + 5);

      doc.setFont('helvetica', 'normal');
      const textToPrint = description.trim() || 'Sem observações técnicas adicionais. Simulação apenas para fins de visualização estética das cores aplicadas.';
      
      // Divide o texto para que caiba na largura da página
      const splitText = doc.splitTextToSize(textToPrint, 180);
      doc.text(splitText, 15, descY + 11);

      // 7. Rodapé de Termos
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('* Nota: Esta é uma simulação meramente ilustrativa. Variações na tela do celular/monitor, iluminação real do ambiente e fabricante da tinta podem influenciar no resultado final.', 15, 280);
      doc.text('Documento gerado através do Pintor Pro - Todos os direitos reservados.', 15, 284);

      // Salva o arquivo PDF
      const pdfFileName = `simulacao-obra-${clientName.trim().replace(/\s+/g, '-') || 'cliente'}-${formattedDate.replace(/\//g, '-')}.pdf`;
      doc.save(pdfFileName);

      setFeedback({ type: 'success', message: 'PDF gerado e baixado com sucesso!' });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Ocorreu um erro ao renderizar o PDF.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-8 p-6 bg-slate-50 min-h-screen rounded-3xl">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#000747] uppercase tracking-wide">Simulador de Cores</h2>
          <p className="text-slate-500 font-medium">Tire fotos do ambiente, pinte e exporte um relatório em PDF realista para enviar ao seu cliente.</p>
        </div>
        
        {imageSrc && (
          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPdf}
            className="bg-[#000747] hover:bg-[#9A077B] text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition duration-300 shadow-lg shadow-[#000747]/10 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Gerando Relatório...
              </span>
            ) : (
              <>
                <Download size={20} />
                <span>Salvar & Exportar PDF</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Feedbacks de Alerta */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 shadow-sm border ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="shrink-0" /> : <AlertCircle className="shrink-0" />}
          <span className="font-bold text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Grid Principal do Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lado Esquerdo: Área do Canvas */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[480px] relative overflow-hidden">
          {!imageSrc ? (
            <div className="text-center py-20 px-6 max-w-md w-full">
              <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                <Upload size={36} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide mb-2">Selecione uma foto da Obra</h3>
              <p className="text-slate-400 font-medium text-sm mb-6">Tire uma foto na hora com o seu celular ou selecione uma imagem da sua galeria de fotos.</p>
              
              <label className="cursor-pointer bg-[#000747] text-white px-8 py-5 rounded-2xl font-black uppercase text-sm tracking-wider hover:bg-[#9A077B] transition duration-300 shadow-md inline-block">
                <span>Escolher ou Tirar Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-4">
              {/* Barra de Ações Rápidas do Canvas */}
              <div className="w-full flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTool('brush')}
                    className={`p-3 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition ${
                      tool === 'brush' ? 'bg-[#9A077B] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Paintbrush size={16} />
                    <span>Pincel</span>
                  </button>
                  <button
                    onClick={() => setTool('eraser')}
                    className={`p-3 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition ${
                      tool === 'eraser' ? 'bg-[#9A077B] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Eraser size={16} />
                    <span>Borracha</span>
                  </button>
                  <button
                    onClick={() => setTool('magic')}
                    className={`p-3 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition ${
                      tool === 'magic' ? 'bg-[#9A077B] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Preenchimento automático por detecção de cores"
                  >
                    <Sparkles size={16} />
                    <span>Varredura Mágica</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClear}
                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition"
                    title="Limpar toda a pintura"
                  >
                    <Trash2 size={16} />
                    <span>Limpar Tela</span>
                  </button>
                  <label className="cursor-pointer p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition">
                    <Upload size={16} />
                    <span>Trocar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Área do Canvas de Trabalho */}
              <div className="relative border-4 border-slate-200 rounded-2xl overflow-hidden shadow-inner max-w-full bg-slate-800">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleStartDrawing}
                  onMouseMove={handleDrawing}
                  onMouseUp={handleStopDrawing}
                  onMouseLeave={handleStopDrawing}
                  onTouchStart={handleStartDrawing}
                  onTouchMove={handleDrawing}
                  onTouchEnd={handleStopDrawing}
                  className="block max-w-full cursor-crosshair relative z-10"
                />
                
                {/* Canvas oculto exclusivo para armazenar o desenho puro da máscara */}
                <canvas ref={maskCanvasRef} className="hidden" />
              </div>

              {/* Controles deslizantes (Sliders) integrados */}
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="bg-slate-50 p-4 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                    <span>Tamanho do Pincel</span>
                    <span className="text-slate-800">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    disabled={tool === 'magic'}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#9A077B] disabled:opacity-50"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                    <span>Opacidade / Realismo</span>
                    <span className="text-slate-800">{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#9A077B]"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                    <span>Sensibilidade Mágica</span>
                    <span className="text-slate-800">{tolerance}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    disabled={tool !== 'magic'}
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#9A077B] disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Paleta de Cores, Texturas e Detalhes do Relatório */}
        <div className="lg:col-span-4 space-y-6">
          {/* Seção 1: Paleta de Cores */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#000747] uppercase tracking-widest flex items-center gap-2">
              <Paintbrush size={16} className="text-[#9A077B]" />
              <span>Paleta de Cores Premium</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">Toque em uma cor para pintar.</p>
            
            <div className="grid grid-cols-4 gap-3">
              {PREMIUM_COLORS.map((color) => {
                const isSelected = selectedColor === color.hex;
                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.hex)}
                    className="flex flex-col items-center gap-1.5 focus:outline-none"
                  >
                    <div
                      style={{ backgroundColor: color.hex }}
                      className={`w-12 h-12 rounded-xl transition-all duration-200 shadow-inner relative flex items-center justify-center ${
                        isSelected ? 'scale-110 ring-4 ring-[#9A077B]/20 border border-[#9A077B]' : 'hover:scale-105 border border-slate-200'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 bg-[#9A077B] rounded-full"></div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 text-center truncate w-full">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Tipos de Acabamento/Textura */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#000747] uppercase tracking-widest flex items-center gap-2">
              <Sliders size={16} className="text-[#9A077B]" />
              <span>Tipos de Textura / Efeitos</span>
            </h3>
            
            <div className="space-y-3">
              {TEXTURE_OPTIONS.map((texture) => {
                const isSelected = selectedTexture === texture.id;
                return (
                  <button
                    key={texture.id}
                    onClick={() => setSelectedTexture(texture.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition duration-200 flex flex-col gap-1 ${
                      isSelected ? 'border-[#9A077B] bg-[#9A077B]/5 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm font-black text-slate-800 uppercase tracking-wide leading-none">{texture.name}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{texture.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 3: Dados de Relatório de Obra */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#000747] uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} className="text-[#9A077B]" />
              <span>Dados para o PDF</span>
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome do Cliente</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#9A077B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Endereço da Obra</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Ex: Av. Brasil, 1200 - Centro"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#9A077B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descrição Técnica / Materiais</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva detalhes como: Tinta utilizada (ex: Suvinil Fosca Completo), quantidade de demãos, reparos prévios necessários na parede, etc..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#9A077B] resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
