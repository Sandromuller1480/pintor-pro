import React, { useEffect, useRef, useState } from 'react';
import { Download, Eraser, Minus, Move, Paintbrush, RotateCcw, SlidersHorizontal, Upload, ZoomIn, ZoomOut } from 'lucide-react';

type ToolMode = 'brush' | 'eraser' | 'line' | 'curve' | 'pan';
type CanvasPoint = { x: number; y: number };
type PanPoint = { x: number; y: number };
type CursorPreview = {
  x: number;
  y: number;
  diameter: number;
  visible: boolean;
};

const DEFAULT_COLOR = '#c8a070';
const MAX_CANVAS_SIDE = 1200;

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
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastPointRef = useRef<CanvasPoint | null>(null);
  const shapeStartPointRef = useRef<CanvasPoint | null>(null);
  const panStartPointRef = useRef<PanPoint | null>(null);
  const panStartOffsetRef = useRef<PanPoint>({ x: 0, y: 0 });
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const displayScaleRef = useRef(1);
  const [hasImage, setHasImage] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>('brush');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState(42);
  const [curveBend, setCurveBend] = useState(35);
  const [strength, setStrength] = useState(72);
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

  const renderPreview = () => {
    const visibleCanvas = visibleCanvasRef.current;
    const baseCanvas = baseCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!visibleCanvas || !baseCanvas || !maskCanvas) {
      return;
    }

    const context = visibleCanvas.getContext('2d');
    const baseContext = baseCanvas.getContext('2d');
    const maskContext = maskCanvas.getContext('2d');

    if (!context || !baseContext || !maskContext) {
      return;
    }

    context.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);

    if (!hasImage) {
      return;
    }

    const baseImageData = baseContext.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    const maskImageData = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const outputImageData = new ImageData(
      new Uint8ClampedArray(baseImageData.data),
      baseImageData.width,
      baseImageData.height
    );
    const color = hexToRgb(selectedColor);
    const normalizedStrength = strength / 100;

    for (let index = 0; index < outputImageData.data.length; index += 4) {
      const maskAlpha = (maskImageData.data[index + 3] / 255) * normalizedStrength;

      if (maskAlpha <= 0) {
        continue;
      }

      const baseR = baseImageData.data[index];
      const baseG = baseImageData.data[index + 1];
      const baseB = baseImageData.data[index + 2];
      const luminance = (0.2126 * baseR + 0.7152 * baseG + 0.0722 * baseB) / 255;
      const shadedR = color.r * (0.42 + luminance * 0.7);
      const shadedG = color.g * (0.42 + luminance * 0.7);
      const shadedB = color.b * (0.42 + luminance * 0.7);

      outputImageData.data[index] = Math.round(baseR * (1 - maskAlpha) + shadedR * maskAlpha);
      outputImageData.data[index + 1] = Math.round(baseG * (1 - maskAlpha) + shadedG * maskAlpha);
      outputImageData.data[index + 2] = Math.round(baseB * (1 - maskAlpha) + shadedB * maskAlpha);
    }

    context.putImageData(outputImageData, 0, 0);

    if (showMask) {
      context.save();
      context.globalAlpha = 0.22;
      context.fillStyle = selectedColor;
      context.globalCompositeOperation = 'source-atop';
      context.drawImage(maskCanvas, 0, 0);
      context.restore();
    }
  };

  useEffect(() => {
    renderPreview();
  }, [selectedColor, strength, showMask, hasImage]);

  useEffect(() => {
    setCursorPreview((currentPreview) => ({
      ...currentPreview,
      diameter: brushSize * displayScaleRef.current
    }));
  }, [brushSize]);

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
        const maskCanvas = maskCanvasRef.current;

        if (!visibleCanvas || !baseCanvas || !maskCanvas) {
          return;
        }

        for (const canvas of [visibleCanvas, baseCanvas, maskCanvas]) {
          canvas.width = width;
          canvas.height = height;
        }

        const baseContext = baseCanvas.getContext('2d');
        const maskContext = maskCanvas.getContext('2d');

        if (!baseContext || !maskContext) {
          return;
        }

        baseContext.clearRect(0, 0, width, height);
        baseContext.drawImage(image, 0, 0, width, height);
        maskContext.clearRect(0, 0, width, height);
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
    const maskCanvas = maskCanvasRef.current;

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
    mode: Extract<ToolMode, 'line' | 'curve'>
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
    mode: Extract<ToolMode, 'line' | 'curve'>
  ) => {
    const maskCanvas = maskCanvasRef.current;
    const context = maskCanvas?.getContext('2d');

    if (!maskCanvas || !context) {
      return;
    }

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = brushSize;
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = 'rgba(255,255,255,1)';
    traceShapePath(context, startPoint, endPoint, mode);
    context.restore();
    renderPreview();
  };

  const drawShapePreview = (
    startPoint: CanvasPoint,
    endPoint: CanvasPoint,
    mode: Extract<ToolMode, 'line' | 'curve'>
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
    context.strokeStyle = selectedColor;
    context.setLineDash([Math.max(10, brushSize * 0.6), Math.max(8, brushSize * 0.35)]);
    traceShapePath(context, startPoint, endPoint, mode);
    context.restore();
  };

  const updateCursorPreview = (
    canvas: HTMLCanvasElement,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!hasImage || toolMode === 'pan') {
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

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!hasImage || !visibleCanvasRef.current) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    updateCursorPreview(event.currentTarget, event);

    if (toolMode === 'pan') {
      isPanningRef.current = true;
      panStartPointRef.current = { x: event.clientX, y: event.clientY };
      panStartOffsetRef.current = panOffset;
      return;
    }

    const point = getCanvasPoint(event.currentTarget, event);
    isDrawingRef.current = true;
    lastPointRef.current = point;
    shapeStartPointRef.current = point;

    if (toolMode === 'brush' || toolMode === 'eraser') {
      drawPoint(point, null);
      return;
    }

    drawShapePreview(point, point, toolMode);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    updateCursorPreview(event.currentTarget, event);

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

    if (shapeStartPointRef.current) {
      drawShapePreview(shapeStartPointRef.current, point, toolMode);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      isDrawingRef.current
      && hasImage
      && shapeStartPointRef.current
      && (toolMode === 'line' || toolMode === 'curve')
    ) {
      const point = getCanvasPoint(event.currentTarget, event);
      commitShapeToMask(shapeStartPointRef.current, point, toolMode);
    }

    stopDrawing();
  };

  const stopPan = () => {
    isPanningRef.current = false;
    panStartPointRef.current = null;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    shapeStartPointRef.current = null;
    stopPan();
  };

  const hideCursorPreview = () => {
    stopDrawing();
    setCursorPreview((currentPreview) => ({ ...currentPreview, visible: false }));
  };

  const adjustZoom = (nextZoom: number) => {
    setZoom(Math.min(4, Math.max(0.5, nextZoom)));
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!hasImage) {
      return;
    }

    event.preventDefault();
    adjustZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1));
  };

  const clearMask = () => {
    const maskCanvas = maskCanvasRef.current;
    const context = maskCanvas?.getContext('2d');

    if (!maskCanvas || !context) {
      return;
    }

    context.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    renderPreview();
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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#9A077B]">Colorir parede</p>
          <h1 className="mt-1 text-2xl font-black text-[#000747]">Teste cores em uma foto real</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveImage}
            disabled={!hasImage}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} />
            Salvar
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex h-[min(72vh,44rem)] min-h-[30rem] items-center justify-center bg-slate-100 p-3">
            <div
              className="relative h-full w-full max-w-5xl overflow-hidden rounded-xl bg-slate-950"
              onWheel={handleCanvasWheel}
            >
              <canvas
                ref={visibleCanvasRef}
                className={`block h-auto w-full touch-none ${hasImage ? (toolMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-none') : 'min-h-[24rem]'}`}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: 'top left'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={stopDrawing}
                onPointerLeave={hideCursorPreview}
              />
              {hasImage && cursorPreview.visible && (
                <div
                  className={`pointer-events-none absolute rounded-full border-2 shadow-[0_0_0_1px_rgba(15,23,42,0.35),0_0_22px_rgba(255,255,255,0.45)] ${
                    toolMode === 'eraser'
                      ? 'border-white bg-white/10'
                      : 'border-white'
                  }`}
                  style={{
                    left: cursorPreview.x,
                    top: cursorPreview.y,
                    width: cursorPreview.diameter,
                    height: cursorPreview.diameter,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: toolMode !== 'eraser' ? `${selectedColor}26` : undefined
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
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6 xl:self-start">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <Paintbrush size={16} />
              Ferramenta
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setToolMode('pan')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition ${
                  toolMode === 'pan'
                    ? 'bg-[#9A077B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Move size={17} />
                Mover
              </button>
              <button
                type="button"
                onClick={() => setToolMode('brush')}
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
                onClick={() => setToolMode('eraser')}
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
                onClick={() => setToolMode('line')}
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
                onClick={() => setToolMode('curve')}
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

          <div className="space-y-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <ZoomIn size={16} />
              Visualização
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => adjustZoom(zoom - 0.15)}
                disabled={!hasImage}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-3 py-3 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Diminuir zoom"
              >
                <ZoomOut size={18} />
              </button>
              <button
                type="button"
                onClick={resetView}
                disabled={!hasImage}
                className="rounded-xl bg-slate-100 px-3 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => adjustZoom(zoom + 0.15)}
                disabled={!hasImage}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-3 py-3 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Aumentar zoom"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            <input
              type="range"
              min="50"
              max="400"
              value={Math.round(zoom * 100)}
              onChange={(event) => adjustZoom(Number(event.target.value) / 100)}
              disabled={!hasImage}
              className="w-full accent-[#9A077B] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Cor da tinta
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={selectedColor}
                onChange={(event) => setSelectedColor(event.target.value)}
                className="h-12 w-16 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
              />
              <input
                type="text"
                value={selectedColor.toUpperCase()}
                onChange={(event) => setSelectedColor(event.target.value)}
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
                onChange={(event) => setStrength(Number(event.target.value))}
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
              disabled={!hasImage}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={17} />
              Limpar parede
            </button>
          </div>
        </aside>
      </div>

      <canvas ref={baseCanvasRef} className="hidden" />
      <canvas ref={maskCanvasRef} className="hidden" />
    </section>
  );
};
