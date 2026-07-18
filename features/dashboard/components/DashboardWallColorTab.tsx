import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, ClipboardList, Download, Eraser, Image as ImageIcon, Layers, Minus, Paintbrush, RotateCcw, SlidersHorizontal, Trash2, Upload, X } from 'lucide-react';
import cimentoQueimadoTexture from '../../../imagens/texturas/CIMENTO QUEIMADO COR ESCURA.png';
import grafiatoTexture from '../../../imagens/texturas/GRAFIATO COR ESCURA.png';
import projetadaTexture from '../../../imagens/texturas/PROJETADA COR ESCURA.png';
import cabeloDeAnjoTexture from '../../../imagens/texturas/TEXTURA COM CABELO DE ANJO.png';

type ToolMode = 'brush' | 'eraser' | 'eraser-line' | 'line' | 'curve';
type ShapeToolMode = Extract<ToolMode, 'eraser-line' | 'line' | 'curve'>;
type EditorModal = 'tools' | 'walls' | 'delete-photo' | null;
type ToolSection = 'tools' | 'color' | 'texture' | 'adjustments';
type PaintLayer = 'paint' | 'texture';
type TextureId = 'cimento-queimado' | 'grafiato' | 'projetada' | 'cabelo-de-anjo';
type CanvasPoint = { x: number; y: number };
type PanPoint = { x: number; y: number };
type ActivePointer = { x: number; y: number; type: string };
type RgbColor = { r: number; g: number; b: number };
type HsvColor = { h: number; s: number; v: number };
type WallPaint = {
  id: string;
  name: string;
  color: string;
  strength: number;
  blendMode: number;
  opacity: number;
  hasPaint: boolean;
  textureId: TextureId | null;
  textureStrength: number;
  textureBlendMode: number;
  textureOpacity: number;
};
type CursorPreview = {
  x: number;
  y: number;
  diameter: number;
  visible: boolean;
};

const DEFAULT_COLOR = '#c8a070';
const MAX_CANVAS_SIDE = 1200;
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 4;
const DEFAULT_BLEND_MODE = 100;
const DEFAULT_OPACITY = 100;
const TEXTURE_OPTIONS: Array<{ id: TextureId; name: string; src: string }> = [
  { id: 'cimento-queimado', name: 'Cimento queimado', src: cimentoQueimadoTexture },
  { id: 'grafiato', name: 'Grafiato', src: grafiatoTexture },
  { id: 'projetada', name: 'Projetada', src: projetadaTexture },
  { id: 'cabelo-de-anjo', name: 'Cabelo de anjo', src: cabeloDeAnjoTexture }
];

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split('').map((item) => `${item}${item}`).join('')
    : normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rgbToHex({ r, g, b }: RgbColor) {
  return `#${[r, g, b].map((value) => clampNumber(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function hsvToRgb({ h, s, v }: HsvColor): RgbColor {
  const chroma = v * s;
  const huePrime = h / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const match = v - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma;
    green = x;
  } else if (huePrime >= 1 && huePrime < 2) {
    red = x;
    green = chroma;
  } else if (huePrime >= 2 && huePrime < 3) {
    green = chroma;
    blue = x;
  } else if (huePrime >= 3 && huePrime < 4) {
    green = x;
    blue = chroma;
  } else if (huePrime >= 4 && huePrime < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255)
  };
}

function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  return {
    h: hue < 0 ? hue + 360 : hue,
    s: max === 0 ? 0 : delta / max,
    v: max
  };
}

function getCanvasPoint(canvas: HTMLCanvasElement, event: React.PointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

export const DashboardWallColorTab: React.FC = () => {
  const visibleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const colorAreaRef = useRef<HTMLDivElement | null>(null);
  const hueSliderRef = useRef<HTMLDivElement | null>(null);
  const lastPointRef = useRef<CanvasPoint | null>(null);
  const shapeStartPointRef = useRef<CanvasPoint | null>(null);
  const panStartPointRef = useRef<PanPoint | null>(null);
  const panStartOffsetRef = useRef<PanPoint>({ x: 0, y: 0 });
  const activePointersRef = useRef<Map<number, ActivePointer>>(new Map<number, ActivePointer>());
  const wallMasksRef = useRef<Map<string, HTMLCanvasElement>>(new Map<string, HTMLCanvasElement>());
  const textureImagesRef = useRef<Map<TextureId, HTMLImageElement>>(new Map<TextureId, HTMLImageElement>());
  const wallsRef = useRef<WallPaint[]>([]);
  const activeWallIdRef = useRef<string | null>(null);
  const drawingWallIdRef = useRef<string | null>(null);
  const drawingLayerRef = useRef<PaintLayer>('paint');
  const wallSequenceRef = useRef(0);
  const pinchStartDistanceRef = useRef(0);
  const pinchStartZoomRef = useRef(1);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const isPinchingRef = useRef(false);
  const displayScaleRef = useRef(1);
  const [hasImage, setHasImage] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode | null>(null);
  const [walls, setWalls] = useState<WallPaint[]>([]);
  const [activeWallId, setActiveWallId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<EditorModal>(null);
  const [expandedToolSections, setExpandedToolSections] = useState<Record<ToolSection, boolean>>({
    tools: false,
    color: false,
    texture: false,
    adjustments: false
  });
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [activeLayer, setActiveLayer] = useState<PaintLayer>('paint');
  const [selectedTextureId, setSelectedTextureId] = useState<TextureId | null>(TEXTURE_OPTIONS[0]?.id ?? null);
  const [colorPicker, setColorPicker] = useState<HsvColor>(() => rgbToHsv(hexToRgb(DEFAULT_COLOR)));
  const [brushSize, setBrushSize] = useState(42);
  const [curveBend, setCurveBend] = useState(35);
  const [strength, setStrength] = useState(72);
  const [blendMode, setBlendMode] = useState(DEFAULT_BLEND_MODE);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<PanPoint>({ x: 0, y: 0 });
  const [showMask, setShowMask] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [cursorPreview, setCursorPreview] = useState<CursorPreview>({
    x: 0,
    y: 0,
    diameter: brushSize,
    visible: false
  });

  const createMaskCanvas = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };

  const getWallMaskKey = (wallId: string, layer: PaintLayer) => `${wallId}:${layer}`;

  const getWallMaskCanvas = (wallId: string | null, layer: PaintLayer = 'paint') => {
    if (!wallId) {
      return null;
    }

    return wallMasksRef.current.get(getWallMaskKey(wallId, layer)) ?? null;
  };

  const createWallForDrawing = () => {
    const visibleCanvas = visibleCanvasRef.current;

    if (!visibleCanvas) {
      return null;
    }

    const nextSequence = wallSequenceRef.current + 1;
    const wallId = `wall-${nextSequence}`;
    const nextWall: WallPaint = {
      id: wallId,
      name: `Parede ${String(nextSequence).padStart(2, '0')}`,
      color: selectedColor,
      strength,
      blendMode,
      opacity,
      hasPaint: activeLayer === 'paint',
      textureId: activeLayer === 'texture' ? selectedTextureId : null,
      textureStrength: strength,
      textureBlendMode: blendMode,
      textureOpacity: opacity
    };

    wallSequenceRef.current = nextSequence;
    wallMasksRef.current.set(getWallMaskKey(wallId, 'paint'), createMaskCanvas(visibleCanvas.width, visibleCanvas.height));
    wallMasksRef.current.set(getWallMaskKey(wallId, 'texture'), createMaskCanvas(visibleCanvas.width, visibleCanvas.height));
    activeWallIdRef.current = wallId;
    drawingWallIdRef.current = wallId;
    wallsRef.current = [...wallsRef.current, nextWall];
    setWalls(wallsRef.current);
    setActiveWallId(wallId);

    return wallId;
  };

  const getDrawingWallId = () => {
    const wallId = activeWallIdRef.current ?? createWallForDrawing();
    drawingWallIdRef.current = wallId;
    drawingLayerRef.current = activeLayer;
    return wallId;
  };

  const tintMaskPreview = (
    context: CanvasRenderingContext2D,
    maskCanvas: HTMLCanvasElement,
    color: string,
    alpha: number
  ) => {
    const tintCanvas = createMaskCanvas(maskCanvas.width, maskCanvas.height);
    const tintContext = tintCanvas.getContext('2d');

    if (!tintContext) {
      return;
    }

    tintContext.fillStyle = color;
    tintContext.fillRect(0, 0, tintCanvas.width, tintCanvas.height);
    tintContext.globalCompositeOperation = 'destination-in';
    tintContext.drawImage(maskCanvas, 0, 0);

    context.save();
    context.globalAlpha = alpha;
    context.drawImage(tintCanvas, 0, 0);
    context.restore();
  };

  const drawTextureOverlay = (
    context: CanvasRenderingContext2D,
    maskCanvas: HTMLCanvasElement,
    textureId: TextureId,
    alpha: number,
    blendAmount: number
  ) => {
    const textureImage = textureImagesRef.current.get(textureId);

    if (!textureImage?.complete) {
      return;
    }

    const textureCanvas = createMaskCanvas(maskCanvas.width, maskCanvas.height);
    const textureContext = textureCanvas.getContext('2d');

    if (!textureContext) {
      return;
    }

    const pattern = textureContext.createPattern(textureImage, 'repeat');

    if (!pattern) {
      return;
    }

    textureContext.fillStyle = pattern;
    textureContext.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
    textureContext.globalCompositeOperation = 'destination-in';
    textureContext.drawImage(maskCanvas, 0, 0);

    context.save();
    context.globalAlpha = alpha * (1 - blendAmount);
    context.globalCompositeOperation = 'source-over';
    context.drawImage(textureCanvas, 0, 0);
    context.restore();

    if (blendAmount > 0) {
      context.save();
      context.globalAlpha = alpha * blendAmount;
      context.globalCompositeOperation = 'multiply';
      context.drawImage(textureCanvas, 0, 0);
      context.restore();
    }
  };

  const renderPreview = () => {
    const visibleCanvas = visibleCanvasRef.current;
    const baseCanvas = baseCanvasRef.current;

    if (!visibleCanvas || !baseCanvas) {
      return;
    }

    const context = visibleCanvas.getContext('2d');
    const baseContext = baseCanvas.getContext('2d');

    if (!context || !baseContext) {
      return;
    }

    context.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);

    if (!hasImage) {
      return;
    }

    const baseImageData = baseContext.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    const outputImageData = new ImageData(
      new Uint8ClampedArray(baseImageData.data),
      baseImageData.width,
      baseImageData.height
    );

    for (const wall of wallsRef.current) {
      if (!wall.hasPaint) {
        continue;
      }

      const maskCanvas = getWallMaskCanvas(wall.id, 'paint');
      const maskContext = maskCanvas?.getContext('2d');

      if (!maskCanvas || !maskContext) {
        continue;
      }

      const maskImageData = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const color = hexToRgb(wall.color);
      const normalizedStrength = wall.strength / 100;
      const normalizedBlendMode = wall.blendMode / 100;
      const normalizedOpacity = wall.opacity / 100;

      for (let index = 0; index < outputImageData.data.length; index += 4) {
        const maskAlpha = (maskImageData.data[index + 3] / 255) * normalizedStrength * normalizedOpacity;

        if (maskAlpha <= 0) {
          continue;
        }

        const baseR = baseImageData.data[index];
        const baseG = baseImageData.data[index + 1];
        const baseB = baseImageData.data[index + 2];
        const luminance = (0.2126 * baseR + 0.7152 * baseG + 0.0722 * baseB) / 255;
        const shadeMultiplier = 1 + (((0.42 + luminance * 0.7) - 1) * normalizedBlendMode);
        const shadedR = color.r * shadeMultiplier;
        const shadedG = color.g * shadeMultiplier;
        const shadedB = color.b * shadeMultiplier;

        outputImageData.data[index] = Math.round(outputImageData.data[index] * (1 - maskAlpha) + shadedR * maskAlpha);
        outputImageData.data[index + 1] = Math.round(outputImageData.data[index + 1] * (1 - maskAlpha) + shadedG * maskAlpha);
        outputImageData.data[index + 2] = Math.round(outputImageData.data[index + 2] * (1 - maskAlpha) + shadedB * maskAlpha);
      }
    }

    context.putImageData(outputImageData, 0, 0);

    for (const wall of wallsRef.current) {
      if (!wall.textureId) {
        continue;
      }

      const maskCanvas = getWallMaskCanvas(wall.id, 'texture');

      if (maskCanvas) {
        drawTextureOverlay(
          context,
          maskCanvas,
          wall.textureId,
          (wall.textureStrength / 100) * (wall.textureOpacity / 100),
          wall.textureBlendMode / 100
        );
      }
    }

    if (showMask) {
      for (const wall of wallsRef.current) {
        const paintMaskCanvas = getWallMaskCanvas(wall.id, 'paint');
        const textureMaskCanvas = getWallMaskCanvas(wall.id, 'texture');

        if (paintMaskCanvas && wall.hasPaint) {
          tintMaskPreview(context, paintMaskCanvas, wall.color, wall.id === activeWallIdRef.current ? 0.28 : 0.16);
        }

        if (textureMaskCanvas && wall.textureId) {
          tintMaskPreview(context, textureMaskCanvas, '#ffffff', wall.id === activeWallIdRef.current ? 0.2 : 0.12);
        }
      }
    }
  };

  useEffect(() => {
    wallsRef.current = walls;
    renderPreview();
  }, [walls, showMask, hasImage]);

  useEffect(() => {
    activeWallIdRef.current = activeWallId;
  }, [activeWallId]);

  useEffect(() => {
    setCursorPreview((currentPreview) => ({
      ...currentPreview,
      diameter: brushSize * displayScaleRef.current
    }));
  }, [brushSize]);

  useEffect(() => {
    for (const texture of TEXTURE_OPTIONS) {
      const image = new Image();
      image.onload = () => renderPreview();
      image.src = texture.src;
      textureImagesRef.current.set(texture.id, image);
    }
  }, []);

  const loadImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFeedback('Selecione uma imagem valida.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const scale = Math.min(1, MAX_CANVAS_SIDE / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const visibleCanvas = visibleCanvasRef.current;
        const baseCanvas = baseCanvasRef.current;

        if (!visibleCanvas || !baseCanvas) {
          return;
        }

        for (const canvas of [visibleCanvas, baseCanvas]) {
          canvas.width = width;
          canvas.height = height;
        }

        const baseContext = baseCanvas.getContext('2d');

        if (!baseContext) {
          return;
        }

        baseContext.clearRect(0, 0, width, height);
        baseContext.drawImage(image, 0, 0, width, height);
        wallMasksRef.current.clear();
        wallsRef.current = [];
        wallSequenceRef.current = 0;
        activeWallIdRef.current = null;
        drawingWallIdRef.current = null;
        setWalls([]);
        setActiveWallId(null);
        setHasImage(true);
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
        setFeedback('');
      };

      image.onerror = () => setFeedback('Nao foi possivel abrir esta imagem.');
      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file) {
      loadImageFile(file);
    }
  };

  const drawPoint = (
    point: CanvasPoint,
    previousPoint: CanvasPoint | null
  ) => {
    const maskCanvas = getWallMaskCanvas(drawingWallIdRef.current, drawingLayerRef.current);

    if (!maskCanvas) {
      return;
    }

    const context = maskCanvas.getContext('2d');

    if (!context) {
      return;
    }

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = brushSize;

    if (toolMode === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = 'rgba(255,255,255,1)';
    }

    context.beginPath();
    context.moveTo(previousPoint?.x ?? point.x, previousPoint?.y ?? point.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    context.restore();
    renderPreview();
  };

  const getCurveControlPoint = (startPoint: CanvasPoint, endPoint: CanvasPoint) => {
    const middleX = (startPoint.x + endPoint.x) / 2;
    const middleY = (startPoint.y + endPoint.y) / 2;
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const length = Math.hypot(deltaX, deltaY) || 1;
    const bendOffset = length * (curveBend / 100);

    return {
      x: middleX - (deltaY / length) * bendOffset,
      y: middleY + (deltaX / length) * bendOffset
    };
  };

  const traceShapePath = (
    context: CanvasRenderingContext2D,
    startPoint: CanvasPoint,
    endPoint: CanvasPoint,
    mode: ShapeToolMode
  ) => {
    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);

    if (mode === 'curve') {
      const controlPoint = getCurveControlPoint(startPoint, endPoint);
      context.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
    } else {
      context.lineTo(endPoint.x, endPoint.y);
    }

    context.stroke();
  };

  const commitShapeToMask = (
    startPoint: CanvasPoint,
    endPoint: CanvasPoint,
    mode: ShapeToolMode
  ) => {
    const maskCanvas = getWallMaskCanvas(drawingWallIdRef.current, drawingLayerRef.current);
    const context = maskCanvas?.getContext('2d');

    if (!maskCanvas || !context) {
      return;
    }

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = brushSize;
    context.globalCompositeOperation = mode === 'eraser-line' ? 'destination-out' : 'source-over';
    context.strokeStyle = mode === 'eraser-line' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';
    traceShapePath(context, startPoint, endPoint, mode);
    context.restore();
    renderPreview();
  };

  const drawShapePreview = (
    startPoint: CanvasPoint,
    endPoint: CanvasPoint,
    mode: ShapeToolMode
  ) => {
    const visibleCanvas = visibleCanvasRef.current;
    const context = visibleCanvas?.getContext('2d');

    if (!visibleCanvas || !context) {
      return;
    }

    renderPreview();
    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = brushSize;
    context.globalAlpha = 0.9;
    context.strokeStyle = mode === 'eraser-line' ? 'rgba(255,255,255,0.95)' : selectedColor;
    context.setLineDash([Math.max(10, brushSize * 0.6), Math.max(8, brushSize * 0.35)]);
    traceShapePath(context, startPoint, endPoint, mode);
    context.restore();
  };

  const updateCursorPreview = (
    canvas: HTMLCanvasElement,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!hasImage || !toolMode) {
      setCursorPreview((currentPreview) => ({ ...currentPreview, visible: false }));
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const parentRect = canvas.parentElement?.getBoundingClientRect() ?? rect;
    const displayScale = rect.width / canvas.width;
    displayScaleRef.current = displayScale;

    setCursorPreview({
      x: event.clientX - parentRect.left,
      y: event.clientY - parentRect.top,
      diameter: brushSize * displayScale,
      visible: true
    });
  };

  const getActivePointers = () => Array.from(activePointersRef.current.values()) as ActivePointer[];

  const startPinch = () => {
    const touchPointers = getActivePointers().filter((pointer) => pointer.type === 'touch');

    if (touchPointers.length < 2) {
      return false;
    }

    const [firstPointer, secondPointer] = touchPointers;
    pinchStartDistanceRef.current = Math.hypot(
      secondPointer.x - firstPointer.x,
      secondPointer.y - firstPointer.y
    );
    pinchStartZoomRef.current = zoom;
    isPinchingRef.current = true;
    isPanningRef.current = false;
    panStartPointRef.current = null;

    return true;
  };

  const toggleToolMode = (mode: ToolMode) => {
    setToolMode((currentMode) => (currentMode === mode ? null : mode));
    stopDrawing();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!hasImage || !visibleCanvasRef.current) {
      return;
    }

    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      type: event.pointerType
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    updateCursorPreview(event.currentTarget, event);

    if (!toolMode) {
      if (event.pointerType === 'touch' && startPinch()) {
        return;
      }

      isPanningRef.current = true;
      panStartPointRef.current = { x: event.clientX, y: event.clientY };
      panStartOffsetRef.current = panOffset;
      return;
    }

    const point = getCanvasPoint(event.currentTarget, event);
    const drawingWallId = getDrawingWallId();

    if (!drawingWallId) {
      return;
    }

    markActiveLayerUsed();
    isDrawingRef.current = true;
    lastPointRef.current = point;
    shapeStartPointRef.current = point;

    if (toolMode === 'brush' || toolMode === 'eraser') {
      drawPoint(point, null);
      return;
    }

    if (toolMode === 'line' || toolMode === 'curve' || toolMode === 'eraser-line') {
      drawShapePreview(point, point, toolMode);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const activePointer = activePointersRef.current.get(event.pointerId);

    if (activePointer) {
      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        type: activePointer.type
      });
    }

    updateCursorPreview(event.currentTarget, event);

    if (!toolMode && event.pointerType === 'touch' && (isPinchingRef.current || activePointersRef.current.size >= 2)) {
      if (!isPinchingRef.current && !startPinch()) {
        return;
      }

      const touchPointers = getActivePointers().filter((pointer) => pointer.type === 'touch');

      if (touchPointers.length >= 2 && pinchStartDistanceRef.current > 0) {
        const [firstPointer, secondPointer] = touchPointers;
        const nextDistance = Math.hypot(
          secondPointer.x - firstPointer.x,
          secondPointer.y - firstPointer.y
        );

        adjustZoom(pinchStartZoomRef.current * (nextDistance / pinchStartDistanceRef.current));
      }

      return;
    }

    if (isPanningRef.current && panStartPointRef.current) {
      const deltaX = event.clientX - panStartPointRef.current.x;
      const deltaY = event.clientY - panStartPointRef.current.y;

      setPanOffset({
        x: panStartOffsetRef.current.x + deltaX,
        y: panStartOffsetRef.current.y + deltaY
      });
      return;
    }

    if (!isDrawingRef.current || !hasImage) {
      return;
    }

    const point = getCanvasPoint(event.currentTarget, event);
    const previousPoint = lastPointRef.current;

    if (toolMode === 'brush' || toolMode === 'eraser') {
      drawPoint(point, previousPoint);
      lastPointRef.current = point;
      return;
    }

    lastPointRef.current = point;

    if (shapeStartPointRef.current && (toolMode === 'line' || toolMode === 'curve' || toolMode === 'eraser-line')) {
      drawShapePreview(shapeStartPointRef.current, point, toolMode);
    }
  };

  const stopPan = () => {
    isPanningRef.current = false;
    isPinchingRef.current = false;
    panStartPointRef.current = null;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    shapeStartPointRef.current = null;
    drawingWallIdRef.current = null;
    stopPan();
  };

  const hideCursorPreview = () => {
    stopDrawing();
    activePointersRef.current.clear();
    setCursorPreview((currentPreview) => ({ ...currentPreview, visible: false }));
  };

  const adjustZoom = (nextZoom: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom)));
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!hasImage) {
      return;
    }

    event.preventDefault();
    adjustZoom(zoom * (event.deltaY < 0 ? 1.12 : 0.88));
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(event.pointerId);

    if (
      isDrawingRef.current
      && hasImage
      && shapeStartPointRef.current
      && (toolMode === 'line' || toolMode === 'curve' || toolMode === 'eraser-line')
    ) {
      const point = getCanvasPoint(event.currentTarget, event);
      commitShapeToMask(shapeStartPointRef.current, point, toolMode);
    }

    if (!toolMode && activePointersRef.current.size === 1) {
      const [remainingPointer] = getActivePointers();
      isPinchingRef.current = false;
      isPanningRef.current = true;
      panStartPointRef.current = { x: remainingPointer.x, y: remainingPointer.y };
      panStartOffsetRef.current = panOffset;
      return;
    }

    stopDrawing();
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(event.pointerId);
    stopDrawing();
  };

  const selectWall = (wall: WallPaint) => {
    stopDrawing();
    activeWallIdRef.current = wall.id;
    setActiveWallId(wall.id);

    if (activeLayer === 'texture') {
      setSelectedTextureId(wall.textureId ?? selectedTextureId ?? TEXTURE_OPTIONS[0].id);
      setStrength(wall.textureStrength);
      setBlendMode(wall.textureBlendMode);
      setOpacity(wall.textureOpacity);
    } else {
      setSelectedColor(wall.color);
      setColorPicker(rgbToHsv(hexToRgb(wall.color)));
      setStrength(wall.strength);
      setBlendMode(wall.blendMode);
      setOpacity(wall.opacity);
    }

    renderPreview();
  };

  const finishPainting = () => {
    stopDrawing();
    activeWallIdRef.current = null;
    setActiveWallId(null);
    renderPreview();
  };

  const deleteWall = (wallId: string) => {
    stopDrawing();
    wallMasksRef.current.delete(getWallMaskKey(wallId, 'paint'));
    wallMasksRef.current.delete(getWallMaskKey(wallId, 'texture'));
    wallsRef.current = wallsRef.current.filter((wall) => wall.id !== wallId);
    setWalls(wallsRef.current);

    if (activeWallIdRef.current === wallId) {
      activeWallIdRef.current = null;
      setActiveWallId(null);
    }

    renderPreview();
  };

  const updateSelectedColor = (nextColor: string) => {
    setActiveLayer('paint');
    setSelectedColor(nextColor);
    setColorPicker(rgbToHsv(hexToRgb(nextColor)));

    if (activeWallIdRef.current) {
      wallsRef.current = wallsRef.current.map((wall) => (
        wall.id === activeWallIdRef.current ? { ...wall, color: nextColor } : wall
      ));
      setWalls(wallsRef.current);
    }
  };

  const selectTexture = (textureId: TextureId) => {
    setActiveLayer('texture');
    setSelectedTextureId(textureId);

    if (activeWallIdRef.current) {
      wallsRef.current = wallsRef.current.map((wall) => (
        wall.id === activeWallIdRef.current ? { ...wall, textureId } : wall
      ));
      const activeWall = wallsRef.current.find((wall) => wall.id === activeWallIdRef.current);

      if (activeWall) {
        setStrength(activeWall.textureStrength);
        setBlendMode(activeWall.textureBlendMode);
        setOpacity(activeWall.textureOpacity);
      }

      setWalls(wallsRef.current);
    }
  };

  const updateColorFromHsv = (nextColorPicker: HsvColor) => {
    const normalizedColorPicker = {
      h: clampNumber(nextColorPicker.h, 0, 359.999),
      s: clampNumber(nextColorPicker.s, 0, 1),
      v: clampNumber(nextColorPicker.v, 0, 1)
    };

    setColorPicker(normalizedColorPicker);
    updateSelectedColor(rgbToHex(hsvToRgb(normalizedColorPicker)));
  };

  const updateColorFromRgb = (channel: keyof RgbColor, value: number) => {
    const currentRgb = hexToRgb(selectedColor);
    const nextRgb = {
      ...currentRgb,
      [channel]: clampNumber(Number.isFinite(value) ? value : 0, 0, 255)
    };

    updateSelectedColor(rgbToHex(nextRgb));
  };

  const updateColorFromAreaPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = colorAreaRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const saturation = clampNumber((event.clientX - rect.left) / rect.width, 0, 1);
    const value = clampNumber(1 - ((event.clientY - rect.top) / rect.height), 0, 1);
    updateColorFromHsv({ ...colorPicker, s: saturation, v: value });
  };

  const updateColorFromHuePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = hueSliderRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    updateColorFromHsv({
      ...colorPicker,
      h: clampNumber(((event.clientX - rect.left) / rect.width) * 360, 0, 359.999)
    });
  };

  const updateStrength = (nextStrength: number) => {
    setStrength(nextStrength);

    if (activeWallIdRef.current) {
      wallsRef.current = wallsRef.current.map((wall) => (
        wall.id === activeWallIdRef.current
          ? activeLayer === 'texture'
            ? { ...wall, textureStrength: nextStrength }
            : { ...wall, strength: nextStrength }
          : wall
      ));
      setWalls(wallsRef.current);
    }
  };

  const updateBlendMode = (nextBlendMode: number) => {
    setBlendMode(nextBlendMode);

    if (activeWallIdRef.current) {
      wallsRef.current = wallsRef.current.map((wall) => (
        wall.id === activeWallIdRef.current
          ? activeLayer === 'texture'
            ? { ...wall, textureBlendMode: nextBlendMode }
            : { ...wall, blendMode: nextBlendMode }
          : wall
      ));
      setWalls(wallsRef.current);
    }
  };

  const updateOpacity = (nextOpacity: number) => {
    setOpacity(nextOpacity);

    if (activeWallIdRef.current) {
      wallsRef.current = wallsRef.current.map((wall) => (
        wall.id === activeWallIdRef.current
          ? activeLayer === 'texture'
            ? { ...wall, textureOpacity: nextOpacity }
            : { ...wall, opacity: nextOpacity }
          : wall
      ));
      setWalls(wallsRef.current);
    }
  };

  const markActiveLayerUsed = () => {
    if (!activeWallIdRef.current) {
      return;
    }

    wallsRef.current = wallsRef.current.map((wall) => {
      if (wall.id !== activeWallIdRef.current) {
        return wall;
      }

      if (activeLayer === 'texture') {
        return {
          ...wall,
          textureId: selectedTextureId ?? TEXTURE_OPTIONS[0].id,
          textureStrength: strength,
          textureBlendMode: blendMode,
          textureOpacity: opacity
        };
      }

      return {
        ...wall,
        hasPaint: true,
        color: selectedColor,
        strength,
        blendMode,
        opacity
      };
    });
    setWalls(wallsRef.current);
  };

  const clearMask = () => {
    const maskCanvas = getWallMaskCanvas(activeWallIdRef.current, activeLayer);
    const context = maskCanvas?.getContext('2d');

    if (!maskCanvas || !context) {
      return;
    }

    context.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    renderPreview();
  };

  const deleteWallLayer = (wallId: string, layer: PaintLayer) => {
    const maskCanvas = getWallMaskCanvas(wallId, layer);
    const context = maskCanvas?.getContext('2d');

    if (maskCanvas && context) {
      context.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }

    wallsRef.current = wallsRef.current.map((wall) => (
      wall.id === wallId
        ? layer === 'texture'
          ? { ...wall, textureId: null }
          : { ...wall, hasPaint: false }
        : wall
    ));
    setWalls(wallsRef.current);
    renderPreview();
  };

  const deletePhoto = () => {
    const visibleCanvas = visibleCanvasRef.current;
    const baseCanvas = baseCanvasRef.current;
    const visibleContext = visibleCanvas?.getContext('2d');
    const baseContext = baseCanvas?.getContext('2d');

    stopDrawing();
    activePointersRef.current.clear();
    wallMasksRef.current.clear();
    wallsRef.current = [];
    wallSequenceRef.current = 0;
    activeWallIdRef.current = null;
    drawingWallIdRef.current = null;
    visibleContext?.clearRect(0, 0, visibleCanvas?.width ?? 0, visibleCanvas?.height ?? 0);
    baseContext?.clearRect(0, 0, baseCanvas?.width ?? 0, baseCanvas?.height ?? 0);
    setWalls([]);
    setActiveWallId(null);
    setHasImage(false);
    setToolMode(null);
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setFeedback('');
    setActiveModal(null);
  };

  const saveImage = () => {
    const visibleCanvas = visibleCanvasRef.current;

    if (!visibleCanvas || !hasImage) {
      setFeedback('Adicione uma foto antes de salvar.');
      return;
    }

    const link = document.createElement('a');
    link.href = visibleCanvas.toDataURL('image/png');
    link.download = `pintor-pro-parede-${Date.now()}.png`;
    link.click();
  };

  const openToolsModal = () => {
    setExpandedToolSections({
      tools: false,
      color: false,
      texture: false,
      adjustments: false
    });
    setActiveModal('tools');
  };

  const activeWall = walls.find((wall) => wall.id === activeWallId) ?? null;
  const selectedRgb = hexToRgb(selectedColor);
  const getTextureName = (textureId: TextureId | null) => (
    TEXTURE_OPTIONS.find((texture) => texture.id === textureId)?.name ?? 'Textura'
  );
  const renderToolSectionHeader = (section: ToolSection, label: string, Icon: typeof Paintbrush) => {
    const isExpanded = expandedToolSections[section];
    const ArrowIcon = isExpanded ? ChevronDown : ChevronRight;

    return (
      <button
        type="button"
        onClick={() => setExpandedToolSections((currentSections) => ({
          ...currentSections,
          [section]: !currentSections[section]
        }))}
        className="flex w-full items-center justify-between gap-3 text-xs font-black uppercase tracking-widest text-slate-500 transition hover:text-[#9A077B]"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          <Icon size={16} />
          {label}
        </span>
        <ArrowIcon size={16} />
      </button>
    );
  };

  return (
    <section className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex h-[min(72vh,44rem)] min-h-[30rem] items-center justify-center bg-slate-100 p-3">
            <div
              className="relative h-full w-full max-w-5xl overflow-hidden rounded-xl bg-slate-950"
              onWheel={handleCanvasWheel}
            >
              <canvas
                ref={visibleCanvasRef}
                className={`block h-auto w-full touch-none ${hasImage ? (!toolMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-none') : 'min-h-[24rem]'}`}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: 'top left'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={hideCursorPreview}
              />
              {hasImage && cursorPreview.visible && (
                <div
                  className={`pointer-events-none absolute rounded-full border-2 shadow-[0_0_0_1px_rgba(15,23,42,0.35),0_0_22px_rgba(255,255,255,0.45)] ${
                    toolMode === 'eraser' || toolMode === 'eraser-line'
                      ? 'border-white bg-white/10'
                      : 'border-white'
                  }`}
                  style={{
                    left: cursorPreview.x,
                    top: cursorPreview.y,
                    width: cursorPreview.diameter,
                    height: cursorPreview.diameter,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: toolMode !== 'eraser' && toolMode !== 'eraser-line' ? `${selectedColor}26` : undefined
                  }}
                >
                  <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" />
                </div>
              )}
              {!hasImage && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-slate-500 hover:text-white">
                    <Upload size={26} />
                  </span>
                  <span className="text-lg font-black uppercase tracking-wide text-white">Adicione uma foto do ambiente</span>
                  <span className="mt-2 max-w-md text-sm font-semibold text-slate-400">
                    Depois marque a parede com o pincel e escolha a cor.
                  </span>
                </button>
              )}
            </div>
          </div>
          {feedback && (
            <div className="border-t border-slate-200 px-5 py-3 text-sm font-bold text-red-600">
              {feedback}
            </div>
          )}
          {hasImage && (
            <div className="flex items-center justify-center gap-3 border-t border-slate-200 bg-white px-5 py-3">
              <button
                type="button"
                onClick={saveImage}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-[#9A077B]"
                aria-label="Salvar"
                title="Salvar"
              >
                <Download size={20} />
              </button>
              <button
                type="button"
                onClick={openToolsModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-[#9A077B]"
                aria-label="Ferramentas"
                title="Ferramentas"
              >
                <Paintbrush size={20} />
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('walls')}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-[#9A077B]"
                aria-label="Paredes"
                title="Paredes"
              >
                <Layers size={20} />
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('delete-photo')}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Deletar foto"
                title="Deletar foto"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>

        {false && (
        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6 xl:self-start">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <Paintbrush size={16} />
              Ferramenta
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => toggleToolMode('brush')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                  toolMode === 'brush'
                    ? 'bg-[#9A077B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Paintbrush size={17} />
                Pincel
              </button>
              <button
                type="button"
                onClick={() => toggleToolMode('eraser')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                  toolMode === 'eraser'
                    ? 'bg-[#9A077B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Eraser size={17} />
                Borracha
              </button>
              <button
                type="button"
                onClick={() => toggleToolMode('line')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                  toolMode === 'line'
                    ? 'bg-[#9A077B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Minus size={17} />
                Reta
              </button>
              <button
                type="button"
                onClick={() => toggleToolMode('curve')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                  toolMode === 'curve'
                    ? 'bg-[#9A077B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Paintbrush size={17} />
                Curva
              </button>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <Layers size={16} />
              Paredes
            </p>
            <div className="space-y-2">
              {walls.map((wall) => (
                <div
                  key={wall.id}
                  className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-black transition ${
                    wall.id === activeWallId
                      ? 'bg-[#9A077B] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectWall(wall)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-1 py-1 text-left"
                  >
                    <span className="truncate">{wall.name}</span>
                    <span
                      className="h-5 w-5 shrink-0 rounded-md border border-white/50 shadow-sm"
                      style={{ backgroundColor: wall.color }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteWall(wall.id)}
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                      wall.id === activeWallId
                        ? 'text-white/85 hover:bg-white/15 hover:text-white'
                        : 'text-slate-400 hover:bg-white hover:text-red-600'
                    }`}
                    aria-label={`Excluir ${wall.name}`}
                    title={`Excluir ${wall.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {walls.length === 0 && (
                <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-400">
                  Nenhuma parede
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={finishPainting}
              disabled={!activeWall}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={17} />
              Finalizar Pintura
            </button>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Cor da tinta
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={selectedColor}
                onChange={(event) => updateSelectedColor(event.target.value)}
                className="h-12 w-16 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
              />
              <input
                type="text"
                value={selectedColor.toUpperCase()}
                onChange={(event) => updateSelectedColor(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm font-black uppercase text-slate-700 outline-[#9A077B]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <SlidersHorizontal size={16} />
              Ajustes
            </p>
            <label className="block">
              <span className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                <span>Pincel</span>
                <span>{brushSize}px</span>
              </span>
              <input
                type="range"
                min="8"
                max="120"
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
                className="w-full accent-[#9A077B]"
              />
            </label>
            {toolMode === 'curve' && (
              <label className="block">
                <span className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>Curvatura</span>
                  <span>{curveBend > 0 ? `+${curveBend}` : curveBend}</span>
                </span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={curveBend}
                  onChange={(event) => setCurveBend(Number(event.target.value))}
                  className="w-full accent-[#9A077B]"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                <span>Intensidade</span>
                <span>{strength}%</span>
              </span>
              <input
                type="range"
                min="15"
                max="100"
                value={strength}
                onChange={(event) => updateStrength(Number(event.target.value))}
                className="w-full accent-[#9A077B]"
              />
            </label>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-600">
              Ver marcação
              <input
                type="checkbox"
                checked={showMask}
                onChange={(event) => setShowMask(event.target.checked)}
                className="h-4 w-4 accent-[#9A077B]"
              />
            </label>
            <button
              type="button"
              onClick={clearMask}
              disabled={!hasImage || !activeWall}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={17} />
              Limpar parede
            </button>
          </div>
        </aside>
        )}
      </div>

      {hasImage && activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              aria-label="Fechar"
              title="Fechar"
            >
              <X size={18} />
            </button>

            {activeModal === 'tools' && (
              <div className="max-h-[min(78vh,38rem)] space-y-5 overflow-y-auto pr-10">
                <div className="space-y-3">
                  {renderToolSectionHeader('tools', 'Ferramentas', Paintbrush)}
                  {expandedToolSections.tools && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleToolMode('brush')}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                          toolMode === 'brush'
                            ? 'bg-[#9A077B] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Paintbrush size={17} />
                        Pincel
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleToolMode('eraser')}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                          toolMode === 'eraser'
                            ? 'bg-[#9A077B] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Eraser size={17} />
                        Borracha
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleToolMode('eraser-line')}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                          toolMode === 'eraser-line'
                            ? 'bg-[#9A077B] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Minus size={17} />
                        Borracha reta
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleToolMode('line')}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                          toolMode === 'line'
                            ? 'bg-[#9A077B] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Minus size={17} />
                        Reta
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleToolMode('curve')}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                          toolMode === 'curve'
                            ? 'bg-[#9A077B] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Paintbrush size={17} />
                        Curva
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {renderToolSectionHeader('color', 'Cor da tinta', ClipboardList)}
                  {expandedToolSections.color && (
                    <div className="space-y-3">
                      <div
                        ref={colorAreaRef}
                        className="relative h-44 touch-none overflow-hidden rounded-xl border border-slate-200"
                        style={{
                          backgroundColor: `hsl(${colorPicker.h}, 100%, 50%)`,
                          backgroundImage: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)'
                        }}
                        onPointerDown={(event) => {
                          event.currentTarget.setPointerCapture(event.pointerId);
                          updateColorFromAreaPointer(event);
                        }}
                        onPointerMove={(event) => {
                          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                            updateColorFromAreaPointer(event);
                          }
                        }}
                      >
                        <span
                          className="pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,0.55)]"
                          style={{
                            left: `${colorPicker.s * 100}%`,
                            top: `${(1 - colorPicker.v) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      </div>
                      <div
                        ref={hueSliderRef}
                        className="relative h-4 touch-none rounded-full border border-slate-200"
                        style={{
                          background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                        }}
                        onPointerDown={(event) => {
                          event.currentTarget.setPointerCapture(event.pointerId);
                          updateColorFromHuePointer(event);
                        }}
                        onPointerMove={(event) => {
                          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                            updateColorFromHuePointer(event);
                          }
                        }}
                      >
                        <span
                          className="pointer-events-none absolute top-1/2 h-6 w-6 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,0.45)]"
                          style={{
                            left: `${(colorPicker.h / 360) * 100}%`,
                            backgroundColor: `hsl(${colorPicker.h}, 100%, 50%)`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="h-10 w-10 shrink-0 rounded-full border border-slate-200 shadow-sm"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <input
                          type="text"
                          value={selectedColor.toUpperCase()}
                          onChange={(event) => {
                            const nextValue = event.target.value.trim();

                            if (/^#[0-9a-fA-F]{6}$/.test(nextValue)) {
                              updateSelectedColor(nextValue);
                            }
                          }}
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm font-black uppercase text-slate-700 outline-[#9A077B]"
                          aria-label="Cor em hexadecimal"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['r', 'g', 'b'] as const).map((channel) => (
                          <label key={channel} className="block text-center">
                            <input
                              type="number"
                              min="0"
                              max="255"
                              value={selectedRgb[channel]}
                              onChange={(event) => updateColorFromRgb(channel, Number(event.target.value))}
                              className="w-full rounded-xl border border-slate-200 px-2 py-2 text-center text-sm font-bold text-slate-700 outline-[#9A077B]"
                              aria-label={channel.toUpperCase()}
                            />
                            <span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                              {channel.toUpperCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {renderToolSectionHeader('texture', 'Textura', ImageIcon)}
                  {expandedToolSections.texture && (
                    <div className="grid grid-cols-2 gap-2">
                      {TEXTURE_OPTIONS.map((texture) => (
                        <button
                          key={texture.id}
                          type="button"
                          onClick={() => selectTexture(texture.id)}
                          className={`overflow-hidden rounded-xl border text-left transition ${
                            activeLayer === 'texture' && selectedTextureId === texture.id
                              ? 'border-[#9A077B] bg-[#FDF3FA] text-[#9A077B] shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={texture.src}
                            alt=""
                            className="h-16 w-full object-cover"
                          />
                          <span className="block px-3 py-2 text-xs font-black uppercase tracking-wider">
                            {texture.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {renderToolSectionHeader('adjustments', 'Ajustes', SlidersHorizontal)}
                  {expandedToolSections.adjustments && (
                    <>
                      <label className="block">
                    <span className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                      <span>Pincel</span>
                      <span>{brushSize}px</span>
                    </span>
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={brushSize}
                      onChange={(event) => setBrushSize(Number(event.target.value))}
                      className="w-full accent-[#9A077B]"
                    />
                  </label>
                  {toolMode === 'curve' && (
                    <label className="block">
                      <span className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                        <span>Curvatura</span>
                        <span>{curveBend > 0 ? `+${curveBend}` : curveBend}</span>
                      </span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={curveBend}
                        onChange={(event) => setCurveBend(Number(event.target.value))}
                        className="w-full accent-[#9A077B]"
                      />
                    </label>
                  )}
                  <label className="block">
                    <span className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                      <span>Intensidade</span>
                      <span>{strength}%</span>
                    </span>
                    <input
                      type="range"
                      min="15"
                      max="100"
                      value={strength}
                      onChange={(event) => updateStrength(Number(event.target.value))}
                      className="w-full accent-[#9A077B]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                      <span>Blend mode</span>
                      <span>{blendMode}%</span>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={blendMode}
                      onChange={(event) => updateBlendMode(Number(event.target.value))}
                      className="w-full accent-[#9A077B]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                      <span>Opacidade</span>
                      <span>{opacity}%</span>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity}
                      onChange={(event) => updateOpacity(Number(event.target.value))}
                      className="w-full accent-[#9A077B]"
                    />
                  </label>
                  </>
                  )}
                </div>
              </div>
            )}

            {activeModal === 'walls' && (
              <div className="space-y-4 pr-10">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                  <Layers size={16} />
                  Paredes
                </p>
                <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                  {walls.map((wall) => (
                    <div
                      key={wall.id}
                      className={`rounded-xl px-2 py-2 text-sm font-black transition ${
                        wall.id === activeWallId
                          ? 'bg-[#9A077B] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <div className="flex w-full items-center gap-2">
                        <button
                          type="button"
                          onClick={() => selectWall(wall)}
                          className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-1 py-1 text-left"
                        >
                          <span className="truncate">{wall.name}</span>
                          <span
                            className="h-5 w-5 shrink-0 rounded-md border border-white/50 shadow-sm"
                            style={{ backgroundColor: wall.color }}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteWall(wall.id)}
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                            wall.id === activeWallId
                              ? 'text-white/85 hover:bg-white/15 hover:text-white'
                              : 'text-slate-400 hover:bg-white hover:text-red-600'
                          }`}
                          aria-label={`Excluir ${wall.name}`}
                          title={`Excluir ${wall.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {(wall.hasPaint || wall.textureId) && (
                        <div className="mt-2 space-y-1">
                          {wall.hasPaint && (
                            <div className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                              wall.id === activeWallId ? 'bg-white/12 text-white/90' : 'bg-white/70 text-slate-500'
                            }`}>
                              <span>Pintura</span>
                              <button
                                type="button"
                                onClick={() => deleteWallLayer(wall.id, 'paint')}
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition ${
                                  wall.id === activeWallId ? 'hover:bg-white/15' : 'hover:bg-red-50 hover:text-red-600'
                                }`}
                                aria-label={`Excluir pintura de ${wall.name}`}
                                title={`Excluir pintura de ${wall.name}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                          {wall.textureId && (
                            <div className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                              wall.id === activeWallId ? 'bg-white/12 text-white/90' : 'bg-white/70 text-slate-500'
                            }`}>
                              <span className="truncate">Textura: {getTextureName(wall.textureId)}</span>
                              <button
                                type="button"
                                onClick={() => deleteWallLayer(wall.id, 'texture')}
                                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${
                                  wall.id === activeWallId ? 'hover:bg-white/15' : 'hover:bg-red-50 hover:text-red-600'
                                }`}
                                aria-label={`Excluir textura de ${wall.name}`}
                                title={`Excluir textura de ${wall.name}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {walls.length === 0 && (
                    <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-400">
                      Nenhuma parede
                    </div>
                  )}
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-600">
                  Ver marcação
                  <input
                    type="checkbox"
                    checked={showMask}
                    onChange={(event) => setShowMask(event.target.checked)}
                    className="h-4 w-4 accent-[#9A077B]"
                  />
                </label>
                <button
                  type="button"
                  onClick={finishPainting}
                  disabled={!activeWall}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check size={17} />
                  Finalizar Pintura
                </button>
                <button
                  type="button"
                  onClick={clearMask}
                  disabled={!hasImage || !activeWall}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={17} />
                  Limpar parede
                </button>
              </div>
            )}

            {activeModal === 'delete-photo' && (
              <div className="space-y-5 pr-10">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                  <Trash2 size={16} />
                  Deletar foto
                </p>
                <p className="text-sm font-semibold leading-6 text-slate-600">
                  Esta ação remove a foto atual e todas as paredes criadas nela.
                </p>
                <button
                  type="button"
                  onClick={deletePhoto}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700"
                >
                  <Trash2 size={17} />
                  Deletar foto
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <canvas ref={baseCanvasRef} className="hidden" />
    </section>
  );
};
