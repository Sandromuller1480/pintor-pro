import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, Eraser, Layers, Minus, Paintbrush, RotateCcw, SlidersHorizontal, Trash2, Upload, X } from 'lucide-react';

type ToolMode = 'brush' | 'eraser' | 'line' | 'curve';
type EditorModal = 'tools' | 'walls' | 'delete-photo' | null;
type CanvasPoint = { x: number; y: number };
type PanPoint = { x: number; y: number };
type ActivePointer = { x: number; y: number; type: string };
type WallPaint = {
  id: string;
  name: string;
  color: string;
  strength: number;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastPointRef = useRef<CanvasPoint | null>(null);
  const shapeStartPointRef = useRef<CanvasPoint | null>(null);
  const panStartPointRef = useRef<PanPoint | null>(null);
  const panStartOffsetRef = useRef<PanPoint>({ x: 0, y: 0 });
  const activePointersRef = useRef<Map<number, ActivePointer>>(new Map<number, ActivePointer>());
  const wallMasksRef = useRef<Map<string, HTMLCanvasElement>>(new Map<string, HTMLCanvasElement>());
  const wallsRef = useRef<WallPaint[]>([]);
  const activeWallIdRef = useRef<string | null>(null);
  const drawingWallIdRef = useRef<string | null>(null);
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

  const createMaskCanvas = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };

  const getWallMaskCanvas = (wallId: string | null) => {
    if (!wallId) {
      return null;
    }

    return wallMasksRef.current.get(wallId) ?? null;
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
      strength
    };

    wallSequenceRef.current = nextSequence;
    wallMasksRef.current.set(wallId, createMaskCanvas(visibleCanvas.width, visibleCanvas.height));
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
      const maskCanvas = getWallMaskCanvas(wall.id);
      const maskContext = maskCanvas?.getContext('2d');

      if (!maskCanvas || !maskContext) {
        continue;
      }

      const maskImageData = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const color = hexToRgb(wall.color);
      const normalizedStrength = wall.strength / 100;

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

        outputImageData.data[index] = Math.round(outputImageData.data[index] * (1 - maskAlpha) + shadedR * maskAlpha);
        outputImageData.data[index + 1] = Math.round(outputImageData.data[index + 1] * (1 - maskAlpha) + shadedG * maskAlpha);
        outputImageData.data[index + 2] = Math.round(outputImageData.data[index + 2] * (1 - maskAlpha) + shadedB * maskAlpha);
      }
    }

    context.putImageData(outputImageData, 0, 0);

    if (showMask) {
      for (const wall of wallsRef.current) {
        const maskCanvas = getWallMaskCanvas(wall.id);

        if (maskCanvas) {
          tintMaskPreview(context, maskCanvas, wall.color, wall.id === activeWallIdRef.current ? 0.28 : 0.16);
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
    const maskCanvas = getWallMaskCanvas(drawingWallIdRef.current);

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
    const maskCanvas = getWallMaskCanvas(drawingWallIdRef.current);
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

    isDrawingRef.current = true;
    lastPointRef.current = point;
    shapeStartPointRef.current = point;

    if (toolMode === 'brush' || toolMode === 'eraser') {
      drawPoint(point, null);
      return;
    }

    if (toolMode === 'line' || toolMode === 'curve') {
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

    if (shapeStartPointRef.current && (toolMode === 'line' || toolMode === 'curve')) {
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
      && (toolMode === 'line' || toolMode === 'curve')
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
    setSelectedColor(wall.color);
    setStrength(wall.strength);
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
    wallMasksRef.current.delete(wallId);
    wallsRef.current = wallsRef.current.filter((wall) => wall.id !== wallId);
    setWalls(wallsRef.current);

    if (activeWallIdRef.current === wallId) {
      activeWallIdRef.current = null;
      setActiveWallId(null);
    }

    renderPreview();
  };

  const updateSelectedColor = (nextColor: string) => {
    setSelectedColor(nextColor);

    if (activeWallIdRef.current) {
      wallsRef.current = wallsRef.current.map((wall) => (
        wall.id === activeWallIdRef.current ? { ...wall, color: nextColor } : wall
      ));
      setWalls(wallsRef.current);
    }
  };

  const updateStrength = (nextStrength: number) => {
    setStrength(nextStrength);

    if (activeWallIdRef.current) {
      wallsRef.current = wallsRef.current.map((wall) => (
        wall.id === activeWallIdRef.current ? { ...wall, strength: nextStrength } : wall
      ));
      setWalls(wallsRef.current);
    }
  };

  const clearMask = () => {
    const maskCanvas = getWallMaskCanvas(activeWallIdRef.current);
    const context = maskCanvas?.getContext('2d');

    if (!maskCanvas || !context) {
      return;
    }

    context.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
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

  const activeWall = walls.find((wall) => wall.id === activeWallId) ?? null;

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
                onClick={() => setActiveModal('tools')}
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
              <div className="space-y-5 pr-10">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                  <Paintbrush size={16} />
                  Ferramentas
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
