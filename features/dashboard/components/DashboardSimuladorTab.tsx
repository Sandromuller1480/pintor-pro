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
  Sparkles,
  X,
  Hammer,
  Check,
  Palette,
  Layers,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
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

interface Point {
  x: number;
  y: number;
}

interface WallLayer {
  id: string;
  name: string;
  color: string;
  texture: string;
  opacity: number;
  maskCanvas: HTMLCanvasElement;
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
  const [tolerance, setTolerance] = useState<number>(25); // Sensibilidade da varredura
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'magic' | null>(null);
  const [description, setDescription] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados de Zoom & Pan (Mover foto livremente)
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Estados para multi-camadas (paredes individuais)
  const [layers, setLayers] = useState<WallLayer[]>([]);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [isDraftDirty, setIsDraftDirty] = useState(false);

  // Modais centralizados
  const [activeGroupModal, setActiveGroupModal] = useState<'edition' | 'colors' | 'textures' | 'layers' | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showPdfForm, setShowPdfForm] = useState(false);

  // Posição do Card Flutuante de ferramenta ativa
  const [toolCardPos, setToolCardPos] = useState<Point>({ x: 20, y: 20 });
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [isSliderExpanded, setIsSliderExpanded] = useState<boolean>(false);
  const dragStartCardRef = useRef<Point>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draftMaskCanvasRef = useRef<HTMLCanvasElement | null>(null); // Máscara temporária de desenho
  const isDrawingRef = useRef<boolean>(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Refs de zoom/pan touch/mouse
  const isPanningRef = useRef<boolean>(false);
  const startPanXRef = useRef<number>(0);
  const startPanYRef = useRef<number>(0);
  const isZoomingRef = useRef<boolean>(false);
  const initialTouchDistanceRef = useRef<number>(0);
  const initialZoomRef = useRef<number>(1.0);

  // Limpa feedback após 4 segundos
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Sincroniza a paleta/controles com a camada selecionada para edição
  useEffect(() => {
    if (editingLayerId) {
      const layer = layers.find(l => l.id === editingLayerId);
      if (layer) {
        setSelectedColor(layer.color);
        setSelectedTexture(layer.texture);
        setOpacity(layer.opacity);
      }
    }
  }, [editingLayerId]);

  // Aplica as edições de cor, textura e opacidade da camada editada em tempo real
  useEffect(() => {
    if (editingLayerId) {
      setLayers(prev => prev.map(layer => {
        if (layer.id === editingLayerId) {
          return {
            ...layer,
            color: selectedColor,
            texture: selectedTexture,
            opacity: opacity
          };
        }
        return layer;
      }));
    }
  }, [selectedColor, selectedTexture, opacity, editingLayerId]);

  // Redesenha se mudar a ferramenta, zoom, pan ou camadas
  useEffect(() => {
    if (imageSrc) {
      redrawCanvas();
    }
  }, [activeTool, layers, editingLayerId, zoom, panX, panY]);

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
      for (let i = 0; i < 6; i++) {
        const x = Math.random() * 120;
        const y = Math.random() * 120;
        const r = 20 + Math.random() * 30;
        const grad = tempCtx.createRadialGradient(x, y, 0, x, y, r);
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

  // Renderiza o Canvas aplicando transformações de zoom e pan
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const draftCanvas = draftMaskCanvasRef.current;
    const img = imageRef.current;

    if (!canvas || !draftCanvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Limpa tela geral
    ctx.clearRect(0, 0, width, height);

    // 2. Aplica matriz de transformação de zoom/pan para toda a renderização
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Desenha foto original
    ctx.drawImage(img, 0, 0);

    // 3. Renderiza cada parede salva
    layers.forEach(layer => {
      const tempLayerCanvas = document.createElement('canvas');
      tempLayerCanvas.width = img.width;
      tempLayerCanvas.height = img.height;
      const tempLayerCtx = tempLayerCanvas.getContext('2d');
      if (!tempLayerCtx) return;

      tempLayerCtx.drawImage(layer.maskCanvas, 0, 0);
      tempLayerCtx.globalCompositeOperation = 'source-in';
      const patternOrColor = createTexturePattern(tempLayerCtx, layer.texture, img.width, img.height, layer.color);
      tempLayerCtx.fillStyle = patternOrColor;
      tempLayerCtx.fillRect(0, 0, img.width, img.height);

      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.texture !== 'lisa' ? 'overlay' : 'multiply';
      ctx.drawImage(tempLayerCanvas, 0, 0);
      ctx.restore();
    });

    // 4. Desenha o rascunho de pintura ativo
    if (!editingLayerId) {
      const tempDraftCanvas = document.createElement('canvas');
      tempDraftCanvas.width = img.width;
      tempDraftCanvas.height = img.height;
      const tempDraftCtx = tempDraftCanvas.getContext('2d');
      if (tempDraftCtx) {
        tempDraftCtx.drawImage(draftCanvas, 0, 0);
        tempDraftCtx.globalCompositeOperation = 'source-in';
        const patternOrColor = createTexturePattern(tempDraftCtx, selectedTexture, img.width, img.height, selectedColor);
        tempDraftCtx.fillStyle = patternOrColor;
        tempDraftCtx.fillRect(0, 0, img.width, img.height);

        ctx.save();
        ctx.globalAlpha = opacity / 100;
        ctx.globalCompositeOperation = selectedTexture !== 'lisa' ? 'overlay' : 'multiply';
        ctx.drawImage(tempDraftCanvas, 0, 0);
        ctx.restore();
      }
    }

    ctx.restore();
  };

  // Cria uma nova camada de parede independente
  const createNewWallLayer = (maskSrcCanvas: HTMLCanvasElement, defaultName?: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const newMaskCanvas = document.createElement('canvas');
    newMaskCanvas.width = imageRef.current.width;
    newMaskCanvas.height = imageRef.current.height;
    const newMaskCtx = newMaskCanvas.getContext('2d');
    if (newMaskCtx) {
      newMaskCtx.drawImage(maskSrcCanvas, 0, 0);
    }

    const layerId = `layer-${Date.now()}`;
    const layerName = defaultName || `Parede ${layers.length + 1}`;

    const newLayer: WallLayer = {
      id: layerId,
      name: layerName,
      color: selectedColor,
      texture: selectedTexture,
      opacity: opacity,
      maskCanvas: newMaskCanvas
    };

    setLayers(prev => [...prev, newLayer]);
    setEditingLayerId(layerId);
    setIsDraftDirty(false);
  };

  // Calcula a distância entre toques
  const getDistanceBetweenTouches = (e: React.TouchEvent) => {
    if (e.touches.length < 2) return 0;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    return Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);
  };

  // Algoritmo Flood Fill para Varredura Mágica
  const executeFloodFillOnCanvas = (startX: number, startY: number, targetCanvas: HTMLCanvasElement) => {
    const img = imageRef.current;
    if (!img) return;

    const width = img.width;
    const height = img.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(img, 0, 0, width, height);
    const imgData = tempCtx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    const px = Math.floor(startX);
    const py = Math.floor(startY);
    if (px < 0 || px >= width || py < 0 || py >= height) return;

    const startIdx = (py * width + px) * 4;
    const startR = pixels[startIdx];
    const startG = pixels[startIdx + 1];
    const startB = pixels[startIdx + 2];

    const visited = new Uint8Array(width * height);
    const mask = new Uint8Array(width * height);

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

    const maskCtx = targetCanvas.getContext('2d');
    if (!maskCtx) return;

    const maskImgData = maskCtx.getImageData(0, 0, width, height);
    const maskData = maskImgData.data;

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 255) {
        const idx = i * 4;
        maskData[idx] = 0;
        maskData[idx + 1] = 0;
        maskData[idx + 2] = 0;
        maskData[idx + 3] = 255;
      }
    }

    maskCtx.putImageData(maskImgData, 0, 0);
  };

  // Coordenadas relativas do toque/mouse
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) {
        if ('changedTouches' in e && e.changedTouches.length > 0) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        } else {
          return { x: 0, y: 0 };
        }
      } else {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    return { x, y };
  };

  // Carrega e desenha a imagem
  const handleImageLoad = (src: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      imageRef.current = img;
      
      const canvas = canvasRef.current;
      const draftCanvas = draftMaskCanvasRef.current;
      if (!canvas || !draftCanvas) return;

      // Habilita tamanho de canvas correspondente às proporções exatas da foto enviada
      canvas.width = img.width;
      canvas.height = img.height;
      draftCanvas.width = img.width;
      draftCanvas.height = img.height;

      const draftCtx = draftCanvas.getContext('2d');
      if (draftCtx) {
        draftCtx.clearRect(0, 0, img.width, img.height);
      }

      setLayers([]);
      setEditingLayerId(null);
      setActiveTool(null);
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      redrawCanvas();
    };
  };

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

  // Trata início de Toque / Mouse Down (Pintar ou Pano)
  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Se NÃO tem ferramenta selecionada: ativa pan/zoom (Mover Foto)
    if (activeTool === null) {
      if ('touches' in e && e.touches.length === 2) {
        isZoomingRef.current = true;
        initialTouchDistanceRef.current = getDistanceBetweenTouches(e);
        initialZoomRef.current = zoom;
      } else {
        isPanningRef.current = true;
        startPanXRef.current = clientX - panX;
        startPanYRef.current = clientY - panY;
      }
      return;
    }

    // Se TEM ferramenta selecionada: Pintar no Canvas
    const canvasCoords = getCanvasCoords(e);
    
    // Mapeia coordenadas clicadas da tela de volta para pixels originais da imagem (inverte transform)
    const imageX = (canvasCoords.x - panX) / zoom;
    const imageY = (canvasCoords.y - panY) / zoom;

    const activeLayer = layers.find(l => l.id === editingLayerId);

    // 1. Varredura Mágica
    if (activeTool === 'magic') {
      if (activeLayer) {
        executeFloodFillOnCanvas(imageX, imageY, activeLayer.maskCanvas);
        redrawCanvas();
      } else {
        const tempMaskCanvas = document.createElement('canvas');
        if (imageRef.current) {
          tempMaskCanvas.width = imageRef.current.width;
          tempMaskCanvas.height = imageRef.current.height;
        }
        executeFloodFillOnCanvas(imageX, imageY, tempMaskCanvas);
        createNewWallLayer(tempMaskCanvas, `Parede Varredura ${layers.length + 1}`);
      }
      return;
    }

    // 2. Pincel / Borracha
    isDrawingRef.current = true;

    const targetCanvas = activeLayer ? activeLayer.maskCanvas : draftMaskCanvasRef.current;
    if (!targetCanvas) return;

    const targetCtx = targetCanvas.getContext('2d');
    if (!targetCtx) return;

    targetCtx.beginPath();
    targetCtx.moveTo(imageX, imageY);
    
    // Ajusta o tamanho do traço do pincel de acordo com o nível do zoom atual para manter proporção estética
    targetCtx.lineWidth = brushSize / zoom;
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    if (activeTool === 'brush') {
      targetCtx.globalCompositeOperation = 'source-over';
      targetCtx.strokeStyle = 'rgba(0, 0, 0, 1)';
    } else {
      targetCtx.globalCompositeOperation = 'destination-out';
    }

    targetCtx.lineTo(imageX, imageY);
    targetCtx.stroke();
    if (!activeLayer) {
      setIsDraftDirty(true);
    }
    redrawCanvas();
  };

  // Trata Movimento (Pintar ou Pano)
  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (activeTool === null) {
      if ('touches' in e && e.touches.length === 2 && isZoomingRef.current) {
        const dist = getDistanceBetweenTouches(e);
        const newZoom = initialZoomRef.current * (dist / initialTouchDistanceRef.current);
        setZoom(Math.max(0.5, Math.min(newZoom, 5.0)));
        redrawCanvas();
      } else if (isPanningRef.current) {
        setPanX(clientX - startPanXRef.current);
        setPanY(clientY - startPanYRef.current);
        redrawCanvas();
      }
      return;
    }

    if (!isDrawingRef.current || activeTool === 'magic') return;
    e.preventDefault();

    const canvasCoords = getCanvasCoords(e);
    const imageX = (canvasCoords.x - panX) / zoom;
    const imageY = (canvasCoords.y - panY) / zoom;

    const activeLayer = layers.find(l => l.id === editingLayerId);
    const targetCanvas = activeLayer ? activeLayer.maskCanvas : draftMaskCanvasRef.current;
    if (!targetCanvas) return;

    const targetCtx = targetCanvas.getContext('2d');
    if (!targetCtx) return;

    targetCtx.lineTo(imageX, imageY);
    targetCtx.stroke();
    redrawCanvas();
  };

  // Trata Mouse Up / Fim de Toque
  const handleStopDrawing = () => {
    isDrawingRef.current = false;
    isPanningRef.current = false;
    isZoomingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDrawingRef.current = false;
    isPanningRef.current = false;
    isZoomingRef.current = false;
  };

  // Zoom no scroll do mouse
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (activeTool !== null || !imageSrc) return;
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = zoom * zoomFactor;
    } else {
      newZoom = zoom / zoomFactor;
    }
    setZoom(Math.max(0.5, Math.min(newZoom, 5.0)));
  };

  const handleClear = () => {
    const draftCanvas = draftMaskCanvasRef.current;
    if (draftCanvas && imageRef.current) {
      const draftCtx = draftCanvas.getContext('2d');
      if (draftCtx) draftCtx.clearRect(0, 0, imageRef.current.width, imageRef.current.height);
    }
    
    setIsDraftDirty(false);
    setEditingLayerId(null);
    setLayers([]);
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    redrawCanvas();
  };

  const handleDeleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (editingLayerId === id) {
      setEditingLayerId(null);
    }
  };

  const handleSaveDraftAsLayer = () => {
    const draftCanvas = draftMaskCanvasRef.current;
    if (!draftCanvas || !isDraftDirty) return;

    createNewWallLayer(draftCanvas, `Parede Pincel ${layers.length + 1}`);

    const draftCtx = draftCanvas.getContext('2d');
    if (draftCtx && imageRef.current) {
      draftCtx.clearRect(0, 0, imageRef.current.width, imageRef.current.height);
    }
  };

  // Arrastar o Card Flutuante de ferramenta ativa
  const handleCardPointerDown = (e: React.PointerEvent) => {
    if (isSliderExpanded) return;
    setIsDraggingCard(true);
    dragStartCardRef.current = {
      x: e.clientX - toolCardPos.x,
      y: e.clientY - toolCardPos.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleCardPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingCard) return;
    setToolCardPos({
      x: e.clientX - dragStartCardRef.current.x,
      y: e.clientY - dragStartCardRef.current.y
    });
  };

  const handleCardPointerUp = (e: React.PointerEvent) => {
    setIsDraggingCard(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Baixar JPG da simulação
  const handleExportJPG = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) {
      setFeedback({ type: 'error', message: 'Carregue e pinte uma imagem antes de baixar o JPG.' });
      return;
    }

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `simulacao-obra-${clientName.trim().replace(/\s+/g, '-') || 'cliente'}-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
      
      setFeedback({ type: 'success', message: 'Imagem JPG baixada com sucesso!' });
      setIsSaveModalOpen(false);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Ocorreu um erro ao gerar o JPG.' });
    }
  };

  // Exportar PDF do relatório
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

      doc.setFillColor(0, 7, 71);
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('PINTOR PRO', 15, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('RELATÓRIO DE SIMULAÇÃO DE CORES & TEXTURAS', 15, 26);

      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      doc.setFontSize(9);
      doc.text(`Data: ${formattedDate}`, 170, 20);

      doc.setTextColor(30, 41, 59);
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

      doc.setFont('helvetica', 'bold');
      doc.text('ESPECIFICAÇÕES DAS PAREDES SIMULADAS', 15, currentY + 3);
      doc.line(15, currentY + 5, 195, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      let textOffset = 11;
      
      if (layers.length > 0) {
        layers.forEach((layer) => {
          const colorName = PREMIUM_COLORS.find(c => c.hex.toLowerCase() === layer.color.toLowerCase())?.name || 'Cor Personalizada';
          const textureName = TEXTURE_OPTIONS.find(t => t.id === layer.texture)?.name || 'Pintura Lisa';
          doc.text(`${layer.name}: Cor ${colorName} (${layer.color}) | Efeito: ${textureName} | Opacidade: ${layer.opacity}%`, 15, currentY + textOffset);
          textOffset += 5.5;
        });
      } else {
        doc.text('Nenhuma parede salva individualmente. Pintura geral simulada.', 15, currentY + textOffset);
        textOffset += 5.5;
      }

      currentY = currentY + textOffset;

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const maxImgW = 180;
      const maxImgH = 90;
      let imgW = canvas.width;
      let imgH = canvas.height;

      const scale = Math.min(maxImgW / imgW, maxImgH / imgH);
      imgW = imgW * scale;
      imgH = imgH * scale;

      const imgX = 15 + (maxImgW - imgW) / 2;
      const imgY = currentY + 2;

      doc.rect(15, imgY - 2, 180, imgH + 4, 'S');
      doc.addImage(imgData, 'JPEG', imgX, imgY, imgW, imgH);

      const descY = imgY + imgH + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DESCRIÇÃO E INSTRUÇÕES TÉCNICAS', 15, descY + 3);
      doc.line(15, descY + 5, 195, descY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const textToPrint = description.trim() || 'Sem observações técnicas adicionais. Simulação apenas para fins de visualização estética das cores aplicadas.';
      const splitText = doc.splitTextToSize(textToPrint, 180);
      doc.text(splitText, 15, descY + 11);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('* Nota: Esta é uma simulação meramente ilustrativa. Variações na tela do celular/monitor, iluminação real do ambiente e fabricante da tinta podem influenciar no resultado final.', 15, 280);
      doc.text('Documento gerado através do Pintor Pro - Todos os direitos reservados.', 15, 284);

      const pdfFileName = `simulacao-obra-${clientName.trim().replace(/\s+/g, '-') || 'cliente'}-${formattedDate.replace(/\//g, '-')}.pdf`;
      doc.save(pdfFileName);

      setFeedback({ type: 'success', message: 'PDF gerado e baixado com sucesso!' });
      setIsSaveModalOpen(false);
      setShowPdfForm(false);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Ocorreu um erro ao renderizar o PDF.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getToolLabel = (toolName: string | null) => {
    switch (toolName) {
      case 'brush': return 'Pincel Ativo';
      case 'eraser': return 'Borracha Ativa';
      case 'magic': return 'Varredura Mágica';
      default: return 'Nenhuma';
    }
  };

  return (
    <div className={`w-full max-w-2xl bg-slate-50 rounded-3xl relative flex flex-col items-center select-none overflow-hidden justify-center ${
      imageSrc ? 'h-[520px] md:h-[620px] p-2 gap-2' : 'space-y-6 p-6'
    }`}>

      {/* Feedbacks de Alerta */}
      {feedback && (
        <div className="w-full max-w-2xl p-4 rounded-2xl flex items-start gap-3 shadow-sm border bg-emerald-50 border-emerald-200 text-emerald-800 animate-in fade-in duration-150 shrink-0">
          {feedback.type === 'success' ? <CheckCircle2 className="shrink-0" /> : <AlertCircle className="shrink-0" />}
          <span className="font-bold text-xs">{feedback.message}</span>
        </div>
      )}

      {/* Lado Esquerdo: Área do Canvas (Foto Fixa na Tela) */}
      {!imageSrc ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] w-full max-w-2xl text-center">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
            <Upload size={36} />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide mb-2">Selecione uma foto da Obra</h3>
          <p className="text-slate-400 font-medium text-xs mb-6 max-w-sm">Tire uma foto (horizontal ou vertical) na hora ou selecione da sua galeria.</p>
          
          <label className="cursor-pointer bg-[#000747] text-white px-8 py-4.5 rounded-2xl font-black uppercase text-xs tracking-wider hover:bg-[#9A077B] transition duration-300 shadow-md inline-block">
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
        <div className="w-full flex-1 flex flex-col items-center gap-2 overflow-hidden">
          
          {/* Container Principal da Foto (Fixa com barra de ferramentas flutuante) */}
          <div className="relative flex flex-col items-center w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 animate-in zoom-in-95 duration-200 flex-1 min-h-[300px]">
            {/* O Canvas da Foto */}
            <div className="relative overflow-hidden w-full flex-1 flex items-center justify-center bg-slate-900">
              <canvas
                ref={canvasRef}
                onMouseDown={handleStartDrawing}
                onMouseMove={handleDrawing}
                onMouseUp={handleStopDrawing}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleStartDrawing}
                onTouchMove={handleDrawing}
                onTouchEnd={handleStopDrawing}
                onWheel={handleWheel}
                className="block cursor-grab active:cursor-grabbing max-h-full max-w-full"
              />
              
              {/* Canvas oculto exclusivo para armazenar o desenho puro do rascunho */}
              <canvas ref={draftMaskCanvasRef} className="hidden" />

              {/* CARD FLUTUANTE DA FERRAMENTA ATIVA (Arrastável quando recolhido) */}
              {activeTool !== null && (
                <div
                  style={{ top: `${toolCardPos.y}px`, left: `${toolCardPos.x}px` }}
                  className={`absolute z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-2xl flex flex-col gap-2 min-w-[200px] select-none animate-in fade-in duration-200 ${
                    isSliderExpanded ? 'cursor-default' : 'cursor-move'
                  }`}
                  onPointerDown={handleCardPointerDown}
                  onPointerMove={handleCardPointerMove}
                  onPointerUp={handleCardPointerUp}
                >
                  <div className="flex items-center justify-between pointer-events-none gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="p-1.5 bg-[#9A077B] text-white rounded-lg">
                        {activeTool === 'brush' && <Paintbrush size={13} />}
                        {activeTool === 'eraser' && <Eraser size={13} />}
                        {activeTool === 'magic' && <Sparkles size={13} />}
                      </div>
                      <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider">
                        {activeTool === 'magic' ? 'Varredura' : activeTool === 'brush' ? 'Pincel' : 'Borracha'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botão de expandir/recolher */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSliderExpanded(!isSliderExpanded);
                        }}
                        className="text-slate-400 hover:text-slate-600 pointer-events-auto cursor-pointer p-1 rounded hover:bg-slate-100 transition"
                        title={isSliderExpanded ? "Recolher opções" : "Expandir opções"}
                      >
                        {isSliderExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>

                      {/* Botão de Fechar no card (Re-habilita zoom/pan) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTool(null);
                        }}
                        className="text-slate-400 hover:text-slate-600 pointer-events-auto cursor-pointer p-1 rounded hover:bg-slate-100 transition"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Slider integrado no Card Flutuante (Somente exibido se expandido) */}
                  {isSliderExpanded && (
                    <div className="pointer-events-auto border-t border-slate-100 pt-2.5 animate-in slide-in-from-top-2 duration-150">
                      {activeTool === 'magic' ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Sensibilidade</span>
                            <span className="text-[#9A077B]">{tolerance}</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="80"
                            value={tolerance}
                            onChange={(e) => setTolerance(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#9A077B]"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Tamanho</span>
                            <span className="text-[#9A077B]">{brushSize}px</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#9A077B]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rodapé da Foto com Ícones */}
            <div className="w-full bg-slate-900 border-t border-slate-800/80 px-4 py-3 flex items-center justify-around z-20 backdrop-blur-md bg-slate-900/90 shrink-0">
              {/* Grupo 1: Ajustes/Ferramentas */}
              <button
                onClick={() => setActiveGroupModal('edition')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                  activeGroupModal === 'edition' ? 'bg-[#9A077B]/10 text-[#9A077B]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Paintbrush size={20} />
                <span className="text-[9px] font-black uppercase tracking-wider">Ajustes</span>
              </button>

              {/* Grupo 2: Cores */}
              <button
                onClick={() => setActiveGroupModal('colors')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                  activeGroupModal === 'colors' ? 'bg-[#9A077B]/10 text-[#9A077B]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette size={20} />
                <span className="text-[9px] font-black uppercase tracking-wider">Cores</span>
              </button>

              {/* Grupo 3: Texturas */}
              <button
                onClick={() => setActiveGroupModal('textures')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                  activeGroupModal === 'textures' ? 'bg-[#9A077B]/10 text-[#9A077B]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders size={20} />
                <span className="text-[9px] font-black uppercase tracking-wider">Texturas</span>
              </button>

              {/* Grupo 4: Paredes (Lista de Camadas) */}
              <button
                onClick={() => setActiveGroupModal('layers')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
                  activeGroupModal === 'layers' ? 'bg-[#9A077B]/10 text-[#9A077B]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Layers size={20} />
                  {layers.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#9A077B] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {layers.length}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider">Paredes</span>
              </button>
            </div>
          </div>

          {/* Botões Fora / Abaixo da Foto */}
          <div className="flex items-center gap-4 w-full justify-center py-2 shrink-0">
            <button
              onClick={handleClear}
              className="px-5 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl font-black uppercase text-[10px] tracking-wider transition flex items-center gap-1.5"
            >
              <Trash2 size={15} />
              <span>Limpar Tudo</span>
            </button>
            
            {activeTool === 'brush' && isDraftDirty && !editingLayerId && (
              <button
                onClick={handleSaveDraftAsLayer}
                className="px-5 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-wider transition flex items-center gap-1.5 shadow-md shadow-amber-500/10 animate-bounce"
              >
                <Check size={15} />
                <span>Salvar Parede Pintada</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsSaveModalOpen(true);
                setShowPdfForm(false);
              }}
              className="px-7 py-3.5 bg-[#000747] hover:bg-[#9A077B] text-white rounded-2xl font-black uppercase text-[10px] tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-[#000747]/10"
            >
              <Download size={15} />
              <span>Salvar Foto</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL CENTRAL: AJUSTES / SELEÇÃO DE FERRAMENTA */}
      {activeGroupModal === 'edition' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 space-y-5 mx-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-[#000747] uppercase text-sm tracking-wider flex items-center gap-1.5">
                <Hammer size={16} className="text-[#9A077B]" />
                <span>Ferramentas de Edição</span>
              </h3>
              <button onClick={() => setActiveGroupModal(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {/* Seleção de Ferramenta */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setActiveTool('brush');
                  setActiveGroupModal(null);
                }}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  activeTool === 'brush' ? 'border-[#9A077B] bg-[#9A077B]/5 text-[#9A077B]' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <Paintbrush size={18} />
                <span className="text-[10px] font-black uppercase tracking-wider">Pincel</span>
              </button>
              <button
                onClick={() => {
                  setActiveTool('eraser');
                  setActiveGroupModal(null);
                }}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  activeTool === 'eraser' ? 'border-[#9A077B] bg-[#9A077B]/5 text-[#9A077B]' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <Eraser size={18} />
                <span className="text-[10px] font-black uppercase tracking-wider">Borracha</span>
              </button>
              <button
                onClick={() => {
                  setActiveTool('magic');
                  setActiveGroupModal(null);
                }}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  activeTool === 'magic' ? 'border-[#9A077B] bg-[#9A077B]/5 text-[#9A077B]' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <Sparkles size={18} />
                <span className="text-[10px] font-black uppercase tracking-wider">Varredura</span>
              </button>
            </div>

            {/* Controles deslizantes de opacidade e visualizações */}
            <div className="space-y-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
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
            </div>
          </div>
        </div>
      )}

      {/* MODAL CENTRAL: PALETA DE CORES */}
      {activeGroupModal === 'colors' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 space-y-4 mx-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-[#000747] uppercase text-sm tracking-wider flex items-center gap-1.5">
                <Palette size={16} className="text-[#9A077B]" />
                <span>Paleta de Cores Premium</span>
              </h3>
              <button onClick={() => setActiveGroupModal(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-2">
              {PREMIUM_COLORS.map((color) => {
                const isSelected = selectedColor === color.hex;
                return (
                  <button
                    key={color.name}
                    onClick={() => {
                      setSelectedColor(color.hex);
                    }}
                    className="flex flex-col items-center gap-1.5 focus:outline-none"
                  >
                    <div
                      style={{ backgroundColor: color.hex }}
                      className={`w-11 h-11 rounded-xl transition-all duration-200 shadow-inner relative flex items-center justify-center ${
                        isSelected ? 'scale-105 ring-4 ring-[#9A077B]/20 border border-[#9A077B]' : 'hover:scale-105 border border-slate-200'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 bg-[#9A077B] rounded-full"></div>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 text-center truncate w-full">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CENTRAL: TEXTURAS E EFEITOS */}
      {activeGroupModal === 'textures' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 space-y-4 mx-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-[#000747] uppercase text-sm tracking-wider flex items-center gap-1.5">
                <Sliders size={16} className="text-[#9A077B]" />
                <span>Tipos de Textura / Efeitos</span>
              </h3>
              <button onClick={() => setActiveGroupModal(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 py-2">
              {TEXTURE_OPTIONS.map((texture) => {
                const isSelected = selectedTexture === texture.id;
                return (
                  <button
                    key={texture.id}
                    onClick={() => {
                      setSelectedTexture(texture.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition duration-200 flex flex-col gap-0.5 ${
                      isSelected ? 'border-[#9A077B] bg-[#9A077B]/5 shadow-sm' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide leading-none">{texture.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{texture.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CENTRAL: LISTA DE PAREDES */}
      {activeGroupModal === 'layers' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 space-y-4 mx-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-[#000747] uppercase text-sm tracking-wider flex items-center gap-1.5">
                <Layers size={16} className="text-[#9A077B]" />
                <span>Paredes Simuladas ({layers.length})</span>
              </h3>
              <button onClick={() => setActiveGroupModal(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {editingLayerId && (
              <div className="bg-[#9A077B]/5 border border-[#9A077B]/20 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-[#9A077B] uppercase tracking-widest leading-none block mb-0.5">Editando ativamente</span>
                  <span className="text-xs font-bold text-slate-800">{layers.find(l => l.id === editingLayerId)?.name}</span>
                </div>
                <button
                  onClick={() => setEditingLayerId(null)}
                  className="px-3 py-1 bg-[#9A077B] text-white text-[9px] font-black uppercase rounded-lg"
                >
                  Concluir
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {layers.length > 0 ? (
                layers.map((layer) => {
                  const isEditing = editingLayerId === layer.id;
                  const textureLabel = TEXTURE_OPTIONS.find(t => t.id === layer.texture)?.name || 'Lisa';
                  return (
                    <div
                      key={layer.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition duration-200 ${
                        isEditing ? 'border-[#9A077B] bg-[#9A077B]/5 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <button
                        onClick={() => setEditingLayerId(layer.id)}
                        className="flex items-center gap-2 text-left focus:outline-none flex-1"
                      >
                        <div
                          style={{ backgroundColor: layer.color }}
                          className="w-4.5 h-4.5 rounded-full border border-slate-300 shrink-0 shadow-inner"
                        />
                        <div className="truncate">
                          <span className="text-xs font-black text-slate-700 block truncate uppercase tracking-wide">{layer.name}</span>
                          <span className="text-[9px] text-slate-400 block truncate">{textureLabel} | {layer.opacity}%</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteLayer(layer.id)}
                        className="p-1 text-red-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="border border-dashed border-slate-200 p-6 rounded-2xl text-center">
                  <p className="text-xs text-slate-400 font-medium">Nenhuma parede cadastrada ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRINCIPAL: SALVAR FOTO (PDF COM DESCRIÇÃO OU APENAS JPG) */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-6 mx-4 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsSaveModalOpen(false);
                setShowPdfForm(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition"
            >
              <X size={24} />
            </button>

            {!showPdfForm ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-black text-[#000747] uppercase tracking-wide">Como deseja salvar?</h3>
                  <p className="text-slate-500 text-xs font-semibold mt-1">Selecione o formato de exportação para a sua simulação de obra.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Opção A: Apenas Imagem JPG */}
                  <button
                    onClick={handleExportJPG}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-[#9A077B] text-left flex items-start gap-3.5 hover:bg-slate-50/50 transition group"
                  >
                    <div className="p-3 bg-indigo-50 text-indigo-600 group-hover:bg-[#9A077B] group-hover:text-white rounded-xl transition">
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">Apenas Imagem (JPG)</h4>
                      <p className="text-slate-400 text-xs mt-0.5 leading-normal">Baixa somente a imagem final pintada direto no seu celular ou computador.</p>
                    </div>
                  </button>

                  {/* Opção B: Relatório Completo PDF */}
                  <button
                    onClick={() => setShowPdfForm(true)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-[#9A077B] text-left flex items-start gap-3.5 hover:bg-slate-50/50 transition group"
                  >
                    <div className="p-3 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">Relatório Completo (PDF)</h4>
                      <p className="text-slate-400 text-xs mt-0.5 leading-normal">Gera um PDF profissional com seus dados, dados do cliente e notas técnicas.</p>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-right duration-200">
                <div>
                  <h3 className="text-xl font-black text-[#000747] uppercase tracking-wide">Dados do Relatório</h3>
                  <p className="text-slate-500 text-xs font-semibold mt-1">Preencha os campos abaixo para constar no documento final.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome do Cliente</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#9A077B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço da Obra</label>
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Ex: Av. Brasil, 1200 - Centro"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#9A077B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Especificações Técnicas / Materiais</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva detalhes como: Tinta utilizada (ex: Suvinil Fosca Completo), quantidade de demãos, reparos prévios necessários na parede, etc..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#9A077B] resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowPdfForm(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider rounded-xl transition"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={isGeneratingPdf}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[11px] tracking-wider rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-emerald-600/10 disabled:opacity-75"
                  >
                    {isGeneratingPdf ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Gerar PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
