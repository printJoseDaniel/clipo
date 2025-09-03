import { useEffect, useRef, useState } from 'react';
import { Type, Image as ImageIcon, MousePointer, Square, Lock, Unlock, Shapes, Trash2, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

function App() {
  type CanvasElement = {
    id: number;
    type: 'text' | 'image' | 'shape';
    name?: string;
    content?: string;
    src?: string;
    x: number;
    y: number;
    fontSize?: number;
    color?: string; // text color
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    borderRadius?: number; // 0-100 (porcentaje)
    borderWidth?: number; // px
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed';
    backgroundColor?: string; // for text box background
    locked?: boolean;
    shapeKind?: 'rectangle' | 'square' | 'circle' | 'triangle' | 'diamond' | 'star' | 'arrow' | 'line' | 'pentagon' | 'hexagon';
    // Imagen: posicionamiento interno para recorte
    imgScale?: number;
    imgOffsetX?: number;
    imgOffsetY?: number;
    imgNatW?: number;
    imgNatH?: number;
    // Imagen: filtros y transparencia
    opacity?: number; // 0-100
    brightness?: number; // 0-200
    contrast?: number; // 0-200
    saturate?: number; // 0-200
    hueRotate?: number; // 0-360
    grayscale?: number; // 0-100
    sepia?: number; // 0-100
    blur?: number; // 0-10 px
    width: number;
    height: number;
  };

  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const [showEffectDropdown, setShowEffectDropdown] = useState<boolean>(false);
  const [editingTextId, setEditingTextId] = useState<number | null>(null);
  const [showCornersOptions, setShowCornersOptions] = useState<boolean>(false);
  const [showImageCornersOptions, setShowImageCornersOptions] = useState<boolean>(false);
  const [showImageBorderOptions, setShowImageBorderOptions] = useState<boolean>(false);
  const [showImageFiltersOptions, setShowImageFiltersOptions] = useState<boolean>(false);
  const [showImageOpacityOptions, setShowImageOpacityOptions] = useState<boolean>(false);
  const [showImageSizeOptions, setShowImageSizeOptions] = useState<boolean>(false);
  const [imageKeepAspect, setImageKeepAspect] = useState<boolean>(true);
  const [cropping, setCropping] = useState<{active: boolean; elementId: number | null; backup?: {imgScale: number; imgOffsetX: number; imgOffsetY: number}}>(
    { active: false, elementId: null, backup: undefined }
  );
  const [showBackgroundPanel, setShowBackgroundPanel] = useState<boolean>(false);
  const [showLayersPanel, setShowLayersPanel] = useState<boolean>(false);
  const [showElementPanel, setShowElementPanel] = useState<boolean>(false);
  const [backgroundLocked, setBackgroundLocked] = useState<boolean>(false);
  const [dragLayerId, setDragLayerId] = useState<number | null>(null);
  const [currentTool, setCurrentTool] = useState<'select'>('select');
  const [selectedElementIds, setSelectedElementIds] = useState<number[]>([]);
  const [marquee, setMarquee] = useState<{ active: boolean; startX: number; startY: number; currentX: number; currentY: number }>({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [showShapeKindOptions, setShowShapeKindOptions] = useState<boolean>(false);
  // Zoom del lienzo
  const [zoom, setZoom] = useState<number>(1);
  const clampZoom = (z: number) => Math.max(0.25, Math.min(4, Math.round(z * 100) / 100));
  // Nombre del proyecto (editable desde el título)
  const [projectName, setProjectName] = useState<string>('Presentación sin título');
  const [editingProjectName, setEditingProjectName] = useState<boolean>(false);
  // Guias de alineación (centros) durante movimiento
  const [guideOverlay, setGuideOverlay] = useState<{
    v: number[];
    h: number[];
    bounds: { left: number; top: number; width: number; height: number } | null;
  }>({ v: [], h: [], bounds: null });
  // Modo presentación
  const [presenting, setPresenting] = useState<{ active: boolean; cw: number; ch: number; scale: number }>({ active: false, cw: 0, ch: 0, scale: 1 });
  
  // Utilidades de dibujo para exportación
  const roundedRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radiusPercent?: number) => {
    const rp = Math.max(0, Math.min(100, radiusPercent ?? 0));
    const r = (rp / 100) * (Math.min(w, h) / 2);
    const rClamped = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    if (rClamped <= 0) {
      ctx.rect(x, y, w, h);
      return;
    }
    ctx.moveTo(x + rClamped, y);
    ctx.lineTo(x + w - rClamped, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rClamped);
    ctx.lineTo(x + w, y + h - rClamped);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rClamped, y + h);
    ctx.lineTo(x + rClamped, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rClamped);
    ctx.lineTo(x, y + rClamped);
    ctx.quadraticCurveTo(x, y, x + rClamped, y);
  };

  const drawTrianglePath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.beginPath();
    ctx.moveTo(x + 0.5 * w, y + 0.1 * h);
    ctx.lineTo(x + 0.9 * w, y + 0.9 * h);
    ctx.lineTo(x + 0.1 * w, y + 0.9 * h);
    ctx.closePath();
  };

  const drawArrowPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    // Escala del path SVG M20 40 H60 V30 L85 50 L60 70 V60 H20 Z en un viewBox 100x100
    const p = (px: number, py: number) => [x + (px / 100) * w, y + (py / 100) * h] as const;
    const [x1, y1] = p(20, 40);
    const [x2, y2] = p(60, 40);
    const [x3, y3] = p(60, 30);
    const [x4, y4] = p(85, 50);
    const [x5, y5] = p(60, 70);
    const [x6, y6] = p(60, 60);
    const [x7, y7] = p(20, 60);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.lineTo(x5, y5);
    ctx.lineTo(x6, y6);
    ctx.lineTo(x7, y7);
    ctx.closePath();
  };

  const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const buildCanvasFilter = (el: CanvasElement) => {
    const brightness = el.brightness ?? 100;
    const contrast = el.contrast ?? 100;
    const saturate = el.saturate ?? 100;
    const hueRotate = el.hueRotate ?? 0;
    const grayscale = el.grayscale ?? 0;
    const sepia = el.sepia ?? 0;
    const blur = el.blur ?? 0;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) grayscale(${grayscale}%) sepia(${sepia}%) blur(${blur}px)`;
  };

  const handleExport = async () => {
    const areaEl = canvasAreaRef.current;
    if (!areaEl) return;
    const width = Math.max(1, areaEl.clientWidth);
    const height = Math.max(1, areaEl.clientHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo
    ctx.fillStyle = hexToRgba(backgroundColor, backgroundOpacity);
    ctx.fillRect(0, 0, width, height);

    // Precargar imágenes
    const imgEls = canvasElements.filter((e) => e.type === 'image' && e.src) as (CanvasElement & { src: string })[];
    const imgMap = new Map<number, HTMLImageElement>();
    await Promise.all(
      imgEls.map(async (el) => {
        try {
          const img = await loadImage(el.src);
          imgMap.set(el.id, img);
        } catch (err) {
          // Ignorar errores de carga individuales
        }
      })
    );

    // Dibujar elementos en orden de capas
    for (const el of canvasElements) {
      const x = el.x;
      const y = el.y;
      const w = el.width;
      const h = el.height;
      if (w <= 0 || h <= 0) continue;

      if (el.type === 'image') {
        ctx.save();
        // Clip con borde redondeado
        roundedRectPath(ctx, x, y, w, h, el.borderRadius);
        ctx.clip();
        // Filtros y opacidad
        ctx.filter = buildCanvasFilter(el);
        ctx.globalAlpha = Math.max(0, Math.min(100, el.opacity ?? 100)) / 100;
        const img = imgMap.get(el.id);
        if (img) {
          const scale = el.imgScale ?? 1;
          const dx = x + (el.imgOffsetX ?? 0);
          const dy = y + (el.imgOffsetY ?? 0);
          const dw = (el.imgNatW ?? img.naturalWidth) * scale;
          const dh = (el.imgNatH ?? img.naturalHeight) * scale;
          ctx.drawImage(img, dx, dy, dw, dh);
        }
        ctx.restore();
        // Borde
        const bw = el.borderWidth ?? 0;
        if (bw > 0) {
          ctx.save();
          roundedRectPath(ctx, x, y, w, h, el.borderRadius);
          ctx.strokeStyle = el.borderColor ?? '#e2e8f0';
          ctx.lineWidth = bw;
          if (el.borderStyle === 'dashed') ctx.setLineDash([6, 4]); else ctx.setLineDash([]);
          ctx.stroke();
          ctx.restore();
        }
        // Reset filtros
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
        continue;
      }

      if (el.type === 'text') {
        // Fondo del texto (caja)
        const bg = el.backgroundColor ?? 'transparent';
        if (bg !== 'transparent') {
          ctx.save();
          roundedRectPath(ctx, x, y, w, h, el.borderRadius);
          ctx.fillStyle = bg;
          ctx.fill();
          ctx.restore();
        }
        // Borde
        const bw = el.borderWidth ?? 0;
        if (bw > 0) {
          ctx.save();
          roundedRectPath(ctx, x, y, w, h, el.borderRadius);
          ctx.strokeStyle = el.borderColor ?? '#e2e8f0';
          ctx.lineWidth = bw;
          if (el.borderStyle === 'dashed') ctx.setLineDash([6, 4]); else ctx.setLineDash([]);
          ctx.stroke();
          ctx.restore();
        }
        // Texto centrado
        const fontSize = el.fontSize ?? 24;
        const fontFamily = el.fontFamily ?? 'Inter, system-ui, sans-serif';
        const fontWeight = el.fontWeight ?? 'normal';
        const fontStyle = el.fontStyle ?? 'normal';
        ctx.fillStyle = el.color ?? '#333333';
        // Alineación horizontal
        const align = el.textAlign ?? 'center';
        let drawX = x + w / 2;
        if (align === 'left' || align === 'justify') { ctx.textAlign = 'left'; drawX = x + 8; }
        else if (align === 'right') { ctx.textAlign = 'right'; drawX = x + w - 8; }
        else { ctx.textAlign = 'center'; drawX = x + w / 2; }
        ctx.textBaseline = 'middle';
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        const lines = (el.content ?? '').split(/\n/);
        const lineHeight = Math.round(fontSize * 1.2);
        const totalHeight = lines.length * lineHeight;
        let startY = y + h / 2 - totalHeight / 2 + lineHeight / 2;
        for (const line of lines) {
          ctx.fillText(line, drawX, startY);
          startY += lineHeight;
        }
        continue;
      }

      if (el.type === 'shape') {
        ctx.save();
        const fill = el.backgroundColor || '#60a5fa';
        const stroke = el.borderColor || 'transparent';
        const bw = el.borderWidth || 0;
        const dashed = el.borderStyle === 'dashed';
        if (el.shapeKind === 'circle') {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = fill;
          ctx.fill();
          if (bw > 0) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = bw;
            if (dashed) ctx.setLineDash([6, 4]); else ctx.setLineDash([]);
            ctx.stroke();
          }
        } else if (el.shapeKind === 'triangle') {
          drawTrianglePath(ctx, x, y, w, h);
          ctx.fillStyle = fill;
          ctx.fill();
          if (bw > 0) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = bw;
            if (dashed) ctx.setLineDash([6, 4]); else ctx.setLineDash([]);
            ctx.stroke();
          }
        } else if (el.shapeKind === 'arrow') {
          drawArrowPath(ctx, x, y, w, h);
          ctx.fillStyle = fill;
          ctx.fill();
          if (bw > 0) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = bw;
            if (dashed) ctx.setLineDash([6, 4]); else ctx.setLineDash([]);
            ctx.stroke();
          }
        } else {
          // rectangle/square y fallback
          roundedRectPath(ctx, x, y, w, h, el.shapeKind === 'rectangle' ? (el.borderRadius ?? 0) : 0);
          ctx.fillStyle = fill;
          ctx.fill();
          if (bw > 0) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = bw;
            if (dashed) ctx.setLineDash([6, 4]); else ctx.setLineDash([]);
            ctx.stroke();
          }
        }
        ctx.restore();
        continue;
      }
    }

    // Descargar PNG
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clipo-export.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  };

  const handlePresent = async () => {
    const area = canvasAreaRef.current;
    const cw = Math.max(1, area?.clientWidth ?? 0);
    const ch = Math.max(1, area?.clientHeight ?? 0);
    const scale = Math.min(window.innerWidth / cw, window.innerHeight / ch);
    setPresenting({ active: true, cw, ch, scale: isFinite(scale) && scale > 0 ? scale : 1 });
    const el: any = appRootRef.current || document.documentElement;
    try {
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }
      }
    } catch (_) {
      // Ignorar errores de fullscreen
    }
  };

  const handleExitPresent = async () => {
    setPresenting((p) => ({ ...p, active: false }));
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {}
  };

  useEffect(() => {
    if (!presenting.active) return;
    const onResize = () => {
      setPresenting((p) => {
        const cw = p.cw || (canvasAreaRef.current?.clientWidth ?? 1);
        const ch = p.ch || (canvasAreaRef.current?.clientHeight ?? 1);
        const scale = Math.min(window.innerWidth / cw, window.innerHeight / ch);
        return { ...p, scale: isFinite(scale) && scale > 0 ? scale : 1 };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [presenting.active]);
  const handleAddShape = () => {
    const nextShapeIndex = canvasElements.filter((el) => el.type === 'shape').length + 1;
    const defaultWidth = 200;
    const defaultHeight = 120;
    const cw = canvasAreaRef.current?.clientWidth ?? 0;
    const ch = canvasAreaRef.current?.clientHeight ?? 0;
    const centerX = Math.max(0, Math.round((cw - defaultWidth) / 2));
    const centerY = Math.max(0, Math.round((ch - defaultHeight) / 2));

    const newShape: CanvasElement = {
      id: Date.now(),
      type: 'shape',
      name: `forma${nextShapeIndex}`,
      x: centerX,
      y: centerY,
      width: defaultWidth,
      height: defaultHeight,
      borderRadius: 0,
      borderWidth: 1,
      borderColor: '#94a3b8',
      borderStyle: 'solid',
      backgroundColor: '#60a5fa',
      shapeKind: 'rectangle',
      locked: false,
    };
    setCanvasElements((prev) => [...prev, newShape]);
    setSelectedElementId(newShape.id);
    setShowElementPanel(true);
    setShowBackgroundPanel(false);
  };
  // Fondo sólido: color + transparencia
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(100);

  // Deshabilitado: imagen de fondo (se mantienen referencias para evitar errores)
  // No se usa; la subida de imagen de fondo está eliminada
  const setBackgroundImage = (_: string | null) => {};
  const showBackgroundImageDialog = false;
  const setShowBackgroundImageDialog = (_: boolean) => {};

  const hexToRgba = (hex: string, alphaPercent: number) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.substring(0, 2), 16) || 255;
    const g = parseInt(h.substring(2, 4), 16) || 255;
    const b = parseInt(h.substring(4, 6), 16) || 255;
    const a = Math.max(0, Math.min(100, alphaPercent)) / 100;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };
  
  // Estado para gestionar acciones de movimiento y redimensionamiento
  const [action, setAction] = useState<{
    type: 'moving' | 'resizing' | null;
    elementId: number | null;
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
    initialLeft?: number;
    initialTop?: number;
    resizeCorner?: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;
  }>({
    type: null,
    elementId: null,
    initialX: 0,
    initialY: 0,
    initialWidth: 0,
    initialHeight: 0,
    initialLeft: 0,
    initialTop: 0,
    resizeCorner: null,
  });

  // Asegurar que al soltar el ratón en cualquier lugar se termine la acción
  useEffect(() => {
    const handleGlobalClick = () => {
      setShowEffectDropdown(false);
      setShowCornersOptions(false);
      setShowImageCornersOptions(false);
      setShowImageBorderOptions(false);
      setShowImageFiltersOptions(false);
      setShowImageOpacityOptions(false);
      setShowElementPanel(false);
      // No deseleccionamos; solo cerramos desplegables
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      setAction({
        type: null,
        elementId: null,
        initialX: 0,
        initialY: 0,
        initialWidth: 0,
        initialHeight: 0,
      });
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, []);

  // Borrar elemento seleccionado con la tecla Supr (Delete) y atajos de zoom
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Atajos de zoom (Ctrl + / Ctrl - / Ctrl 0)
      if (e.ctrlKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setZoom((z) => clampZoom(z * 1.1));
          return;
        }
        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setZoom((z) => clampZoom(z / 1.1));
          return;
        }
        if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
          return;
        }
      }
      // Modo presentación: Esc para salir y bloquear otros atajos
      if (presenting.active) {
        if (e.key === 'Escape') {
          e.preventDefault();
          try {
            if (document.fullscreenElement && document.exitFullscreen) {
              document.exitFullscreen();
            }
          } catch {}
          setPresenting((p) => ({ ...p, active: false }));
        }
        return;
      }
      // Selección con tecla V (ignorar si se está editando texto)
      if (e.key.toLowerCase() === 'v') {
        if (editingTextId !== null) return; // no interceptar mientras se escribe
        e.preventDefault();
        setCurrentTool('select');
        // Recoger paneles/desplegables
        setShowEffectDropdown(false);
        setShowCornersOptions(false);
        setShowImageCornersOptions(false);
        setShowImageBorderOptions(false);
        setShowImageFiltersOptions(false);
        setShowImageOpacityOptions(false);
        setShowElementPanel(false);
        setShowBackgroundPanel(false);
        setEditingTextId(null);
        return;
      }
      // Toggle panel de capas con Alt+1
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setShowLayersPanel((v) => !v);
        setShowBackgroundPanel(false);
        setShowElementPanel(false);
        return;
      }
      if (e.key === 'Delete' && selectedElementId !== null && editingTextId === null) {
        const el = canvasElements.find((x) => x.id === selectedElementId);
        if (el?.locked) return;
        e.preventDefault();
        setCanvasElements((prev) => prev.filter((el) => el.id !== selectedElementId));
        setSelectedElementId(null);
        setShowEffectDropdown(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedElementId, editingTextId, canvasElements, presenting.active]);

  // Recalcular posición de paneles (imagen/texto/fondo) centrados respecto al lienzo, sobre su borde superior
  useEffect(() => {
    const updatePos = () => {
      if (!showElementPanel && !showBackgroundPanel) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setImagePanelPos({ top: Math.round(rect.top), left: Math.round(rect.left + rect.width / 2) });
      }
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [showElementPanel, showBackgroundPanel, selectedElementId, canvasElements]);
  
  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const appRootRef = useRef<HTMLDivElement | null>(null);
  const [imagePanelPos, setImagePanelPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Dimensiones visibles del lienzo (para barra inferior)
  useEffect(() => {
    const handle = () => {
      const el = canvasRef.current;
      if (el) {
        setCanvasSize({ w: Math.round(el.offsetWidth), h: Math.round(el.offsetHeight) });
      }
    };
    handle();
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
    };
  }, []);

  const handleAddText = () => {
    const nextTextIndex = canvasElements.filter((el) => el.type === 'text').length + 1;
    const defaultWidth = 200;
    const defaultHeight = 60;
    // Calcular centro real del área de contenido descontando el padding
    const el = canvasAreaRef.current;
    const cs = el ? getComputedStyle(el) : null;
    const padX = cs ? parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) : 0;
    const padY = cs ? parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : 0;
    const cw = (el?.clientWidth ?? 0) - padX;
    const ch = (el?.clientHeight ?? 0) - padY;
    const centerX = Math.max(0, Math.round(cw / 2));
    const centerY = Math.max(0, Math.round(ch / 2));

    const newText: CanvasElement = {
      id: Date.now(),
      type: 'text',
      name: `texto${nextTextIndex}`,
      content: 'Haz doble clic para editar',
      // Posicionar de modo que el centro del cuadro coincida con el centro del lienzo
      x: Math.max(0, centerX - Math.round(defaultWidth / 2)),
      y: Math.max(0, centerY - Math.round(defaultHeight / 2)),
      fontSize: 24,
      color: '#333333',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      borderRadius: 0,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      locked: false,
      width: defaultWidth,
      height: defaultHeight,
    };
    setCanvasElements((prev) => [...prev, newText]);
    setSelectedElementId(newText.id);
    setShowElementPanel(true);
    setShowBackgroundPanel(false);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            const img = new window.Image();
            img.onload = () => {
              const nextImageIndex = canvasElements.filter((el) => el.type === 'image').length + 1;
              // Ajustar a que quepa en el lienzo manteniendo proporción
              const natW = Math.max(1, img.naturalWidth || 200);
              const natH = Math.max(1, img.naturalHeight || 150);
              const areaEl = canvasAreaRef.current;
              const cs = areaEl ? getComputedStyle(areaEl) : null;
              const padX = cs ? parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) : 0;
              const padY = cs ? parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : 0;
              const cw2 = (areaEl?.clientWidth ?? 0) - padX;
              const ch2 = (areaEl?.clientHeight ?? 0) - padY;
              const fitScale = Math.max(0.0001, Math.min(1, Math.min(
                cw2 > 0 ? cw2 / natW : 1,
                ch2 > 0 ? ch2 / natH : 1
              )));
              const w = Math.max(1, Math.round(natW * fitScale));
              const h = Math.max(1, Math.round(natH * fitScale));
              const centerX = Math.max(0, Math.round((cw2 - w) / 2));
              const centerY = Math.max(0, Math.round((ch2 - h) / 2));

              const newImage: CanvasElement = {
                id: Date.now(),
                type: 'image',
                name: `imagen${nextImageIndex}`,
                src: result,
                x: centerX,
                y: centerY,
                borderRadius: 0,
                borderWidth: 0,
                borderColor: '#e2e8f0',
                borderStyle: 'solid',
                backgroundColor: 'transparent',
                locked: false,
                opacity: 100,
                brightness: 100,
                contrast: 100,
                saturate: 100,
                hueRotate: 0,
                grayscale: 0,
                sepia: 0,
                blur: 0,
                width: w,
                height: h,
                imgScale: 1,
                imgOffsetX: 0,
                imgOffsetY: 0,
                imgNatW: natW,
                imgNatH: natH,
              };
              setCanvasElements((prev) => [...prev, newImage]);
              // Forzar selección en el siguiente frame para asegurar layout correcto del bounding box
              requestAnimationFrame(() => {
                setSelectedElementId(newImage.id);
                setSelectedElementIds([newImage.id]);
              });
              setShowElementPanel(true);
              setShowBackgroundPanel(false);
            };
            img.src = result;
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div ref={appRootRef} className="h-screen w-screen flex bg-gray-50 overflow-hidden">
      {/* Left Sidebar Toolbar */}
      <div className="w-[15%] min-w-[200px] h-full bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 shadow-lg">
        <div className="p-6 h-full flex flex-col">
          {/* Logo Area */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Square className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">Clipo</span>
            </div>
            <p className="text-sm text-slate-600">Editor de Presentaciones</p>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-4 mb-8">
            <button
              onClick={handleAddText}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              <Type className="w-5 h-5" />
              <span>Añadir texto</span>
            </button>

            <button
              onClick={handleImageUpload}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center space-x-2"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Subir una imagen</span>
            </button>
          </div>

          {/* Additional Tools */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Herramientas</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`p-3 border rounded-lg transition-colors duration-200 flex items-center justify-center ${currentTool === 'select' ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                title="Selector (V)"
                onClick={() => {
                  setCurrentTool('select');
                  setShowEffectDropdown(false);
                  setShowCornersOptions(false);
                  setShowImageCornersOptions(false);
                  setShowImageBorderOptions(false);
                  setShowImageFiltersOptions(false);
                  setShowImageOpacityOptions(false);
                  setShowElementPanel(false);
                  setShowBackgroundPanel(false);
                  setEditingTextId(null);
                }}
              >
                <MousePointer className="w-4 h-4 text-slate-600" />
              </button>
              <button
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors duration-200 flex items-center justify-center"
                title="Formas"
                onClick={handleAddShape}
              >
                <Shapes className="w-4 h-4 text-slate-600" />
              </button>
              
              
            </div>
          </div>

          {/* Bottom Actions removed (Exportar moved to top-right only) */}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 h-full bg-white relative overflow-hidden">
        {showLayersPanel && (
          <div className="absolute top-16 left-0 w-[22rem] min-w-[300px] h-[calc(100%-4rem)] border-r border-slate-200 bg-slate-50/90 backdrop-blur-sm p-4 overflow-y-auto z-20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Capas</h2>
              <button
                className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-white"
                onClick={() => setShowLayersPanel(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="mb-4 p-2 rounded border border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Fondo</span>
                <label className="text-xs text-slate-700 flex items-center space-x-1">
                  <input type="checkbox" checked={backgroundLocked} onChange={(e) => setBackgroundLocked(e.target.checked)} />
                  <span>Bloquear</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              {[...canvasElements].map((el) => el).reverse().map((el) => (
                <div key={el.id} className={`p-2 pr-3 rounded border ${selectedElementId === el.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'} flex items-center justify-between`}
                  onDragOver={(e) => {
                    if (dragLayerId == null) return;
                    e.preventDefault();
                    const from = canvasElements.findIndex((x) => x.id === dragLayerId);
                    const to = canvasElements.findIndex((x) => x.id === el.id);
                    if (from === -1 || to === -1 || from === to) return;
                    setCanvasElements((prev) => {
                      const list = [...prev];
                      const curFrom = list.findIndex((x) => x.id === dragLayerId);
                      const curTo = list.findIndex((x) => x.id === el.id);
                      if (curFrom === -1 || curTo === -1 || curFrom === curTo) return prev;
                      const [item] = list.splice(curFrom, 1);
                      list.splice(curTo, 0, item);
                      return list;
                    });
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragLayerId(null);
                  }}
                >
                  <button
                    className="flex items-center flex-1 mr-3 text-left"
                    title={`${el.type} #${el.id}`}
                    onClick={() => {
                      setSelectedElementId(el.id);
                      setShowElementPanel(true);
                      setShowBackgroundPanel(false);
                    }}
                  >
                    <div className="w-16 h-12 mr-2 border border-slate-200 rounded overflow-hidden bg-white flex items-center justify-center">
                      {el.type === 'image' ? (
                        <img
                          src={el.src}
                          alt={"thumb-" + el.id}
                          className="max-w-full max-h-full block"
                          style={{
                            filter: `brightness(${el.brightness ?? 100}%) contrast(${el.contrast ?? 100}%) saturate(${el.saturate ?? 100}%) hue-rotate(${el.hueRotate ?? 0}deg) grayscale(${el.grayscale ?? 0}%) sepia(${el.sepia ?? 0}%) blur(${el.blur ?? 0}px)`,
                            opacity: Math.max(0, Math.min(100, el.opacity ?? 100)) / 100,
                          }}
                        />
                      ) : el.type === 'shape' ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {el.shapeKind === 'circle' ? (
                            <circle cx="50" cy="50" r="40" fill={el.backgroundColor || '#60a5fa'} stroke={el.borderColor || 'transparent'} strokeWidth={el.borderWidth || 0} strokeDasharray={el.borderStyle === 'dashed' ? '6 4' : undefined} />
                          ) : el.shapeKind === 'triangle' ? (
                            <polygon points="50,15 85,85 15,85" fill={el.backgroundColor || '#60a5fa'} stroke={el.borderColor || 'transparent'} strokeWidth={el.borderWidth || 0} strokeDasharray={el.borderStyle === 'dashed' ? '6 4' : undefined} />
                          ) : el.shapeKind === 'arrow' ? (
                            <path d="M20 40 H60 V30 L85 50 L60 70 V60 H20 Z" fill={el.backgroundColor || '#60a5fa'} stroke={el.borderColor || 'transparent'} strokeWidth={el.borderWidth || 0} strokeDasharray={el.borderStyle === 'dashed' ? '6 4' : undefined} />
                          ) : (
                            <rect x="20" y="20" width="60" height="60" rx={el.shapeKind === 'rectangle' ? (el.borderRadius ?? 0) : 0} fill={el.backgroundColor || '#60a5fa'} stroke={el.borderColor || 'transparent'} strokeWidth={el.borderWidth || 0} strokeDasharray={el.borderStyle === 'dashed' ? '6 4' : undefined} />
                          )}
                        </svg>
                      ) : (
                        <div
                          className="px-1 py-0.5 rounded border text-[10px] leading-tight truncate max-w-[56px]"
                          style={{
                            fontFamily: el.fontFamily,
                            fontWeight: el.fontWeight,
                            fontStyle: el.fontStyle,
                            color: el.color || '#333',
                            backgroundColor: el.backgroundColor || 'transparent',
                          }}
                        >
                          {(el.content || 'Texto').slice(0, 10)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-slate-700 truncate">{
                        el.name ?? (
                          (el.type === 'text' ? 'Texto' : el.type === 'image' ? 'Imagen' : 'Forma') + ' #' + el.id
                        )
                      }</span>
                      <span className="text-[10px] text-slate-500">{Math.round(el.width)}×{Math.round(el.height)} px</span>
                    </div>
                  </button>
                  <div className="flex items-center space-x-1">
                    <button
                      className={`text-xs px-2 py-1 rounded border border-slate-300 cursor-grab active:cursor-grabbing ${dragLayerId === el.id ? 'bg-slate-200' : ''}`}
                      title="Arrastrar para reordenar"
                      draggable
                      onDragStart={(e) => {
                        setDragLayerId(el.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => setDragLayerId(null)}
                    >≡</button>
                    <button
                      className="text-xs px-2 py-1 rounded border border-slate-300"
                      title={el.locked ? 'Desbloquear capa' : 'Bloquear capa'}
                      onClick={() => {
                        setCanvasElements((prev) => prev.map((x) => (x.id === el.id ? { ...x, locked: !x.locked } : x)));
                      }}
                    >
                      {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                      title="Eliminar capa"
                      onClick={() => {
                        setCanvasElements((prev) => prev.filter((x) => x.id !== el.id));
                        setSelectedElementId((id) => (id === el.id ? null : id));
                        setSelectedElementIds((ids) => ids.filter((id) => id !== el.id));
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Top Toolbar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm w-full">
          <div className="flex items-center space-x-4">
            {editingProjectName ? (
              <input
                className="text-lg font-semibold text-slate-800 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
                onBlur={() => setEditingProjectName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.currentTarget as HTMLInputElement).blur();
                  } else if (e.key === 'Escape') {
                    setEditingProjectName(false);
                  }
                }}
              />
            ) : (
              <h1
                className="text-lg font-semibold text-slate-800"
                onDoubleClick={() => setEditingProjectName(true)}
                title="Doble clic para renombrar"
              >
                {projectName}
              </h1>
            )}
            {/* Removed auto-save indicator */}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Vista previa button removed */}
            <button onClick={handlePresent} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200">
              Presentar
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Exportar
            </button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100"
        onWheel={(e) => {
          if (e.ctrlKey) {
            e.preventDefault();
            const dir = e.deltaY < 0 ? 1 : -1;
            setZoom((z) => clampZoom(z * (dir > 0 ? 1.1 : 1 / 1.1)));
          }
        }}
        onMouseMove={(e) => {
          // Actualizar rectángulo de selección (marquee)
          if (marquee.active) {
            setMarquee((m) => ({ ...m, currentX: e.clientX, currentY: e.clientY }));
              const areaEl = canvasAreaRef.current;
              const contentRect = areaEl?.getBoundingClientRect();
              if (contentRect) {
              const cs = areaEl ? getComputedStyle(areaEl) : null;
              const padL = (cs ? parseFloat(cs.paddingLeft) : 0) * zoom;
              const padT = (cs ? parseFloat(cs.paddingTop) : 0) * zoom;
                const x1 = Math.min(marquee.startX, e.clientX);
                const y1 = Math.min(marquee.startY, e.clientY);
                const x2 = Math.max(marquee.startX, e.clientX);
                const y2 = Math.max(marquee.startY, e.clientY);
                const ids: number[] = [];
                for (const el of canvasElements) {
                const elLeft = contentRect.left + padL + el.x * zoom;
                const elTop = contentRect.top + padT + el.y * zoom;
                const elRight = elLeft + el.width * zoom;
                const elBottom = elTop + el.height * zoom;
                  if (elRight > x1 && elLeft < x2 && elBottom > y1 && elTop < y2) {
                    ids.push(el.id);
                  }
                }
                setSelectedElementIds(ids);
              }
            return;
          }
          // Solo mover/redimensionar mientras el botón izquierdo está presionado
          if ((e.buttons & 1) !== 1) return;

          if (action.type === 'moving' && action.elementId) {
            const deltaXScreen = e.clientX - action.initialX;
            const deltaYScreen = e.clientY - action.initialY;
            const newX = (action.initialLeft ?? 0) + deltaXScreen / zoom;
            const newY = (action.initialTop ?? 0) + deltaYScreen / zoom;
            // Actualizar guías de alineación (centro con lienzo y otros elementos)
            const areaEl = canvasAreaRef.current;
            const contentRect = areaEl?.getBoundingClientRect();
            if (contentRect) {
              const cs = areaEl ? getComputedStyle(areaEl) : null;
              const padL = (cs ? parseFloat(cs.paddingLeft) : 0) * zoom;
              const padT = (cs ? parseFloat(cs.paddingTop) : 0) * zoom;
              const movingEl = canvasElements.find((x) => x.id === action.elementId);
              const w = movingEl?.width ?? action.initialWidth;
              const h = movingEl?.height ?? action.initialHeight;
              const centerX = contentRect.left + padL + (newX + w / 2) * zoom;
              const centerY = contentRect.top + padT + (newY + h / 2) * zoom;
              const tol = 4; // tolerancia en px
              const v: number[] = [];
              const hLines: number[] = [];
              // Centro del lienzo
              const canvasCenterX = contentRect.left + contentRect.width / 2;
              const canvasCenterY = contentRect.top + contentRect.height / 2;
              if (Math.abs(centerX - canvasCenterX) <= tol) v.push(canvasCenterX);
              if (Math.abs(centerY - canvasCenterY) <= tol) hLines.push(canvasCenterY);
              // Centros de otros elementos
              for (const el of canvasElements) {
                if (el.id === action.elementId) continue;
                const elCenterX = contentRect.left + padL + (el.x + el.width / 2) * zoom;
                const elCenterY = contentRect.top + padT + (el.y + el.height / 2) * zoom;
                if (Math.abs(centerX - elCenterX) <= tol) v.push(elCenterX);
                if (Math.abs(centerY - elCenterY) <= tol) hLines.push(elCenterY);
              }
              // Quitar duplicados aproximando a entero para estabilidad visual
              const uniq = (arr: number[]) => Array.from(new Set(arr.map((n) => Math.round(n))));
              setGuideOverlay({
                v: uniq(v),
                h: uniq(hLines),
                bounds: { left: contentRect.left, top: contentRect.top, width: contentRect.width, height: contentRect.height },
              });
            }

            setCanvasElements((prev) => prev.map((el) => (el.id === action.elementId ? { ...el, x: newX, y: newY } : el)));
          } else if (action.type === 'resizing' && action.elementId && action.resizeCorner) {
            const deltaX = (e.clientX - action.initialX) / zoom;
            const deltaY = (e.clientY - action.initialY) / zoom;
            const minSize = 20;

            const initialLeft = action.initialLeft ?? 0;
            const initialTop = action.initialTop ?? 0;
            const right = initialLeft + action.initialWidth;
            const bottom = initialTop + action.initialHeight;

            // Raw new sizes before aspect constraints
            let rawWidth = action.initialWidth;
            let rawHeight = action.initialHeight;
            switch (action.resizeCorner) {
              case 'se':
                rawWidth = action.initialWidth + deltaX;
                rawHeight = action.initialHeight + deltaY;
                break;
              case 'ne':
                rawWidth = action.initialWidth + deltaX;
                rawHeight = action.initialHeight - deltaY;
                break;
              case 'sw':
                rawWidth = action.initialWidth - deltaX;
                rawHeight = action.initialHeight + deltaY;
                break;
              case 'nw':
                rawWidth = action.initialWidth - deltaX;
                rawHeight = action.initialHeight - deltaY;
                break;
              case 'e':
                rawWidth = action.initialWidth + deltaX;
                rawHeight = action.initialHeight;
                break;
              case 'w':
                rawWidth = action.initialWidth - deltaX;
                rawHeight = action.initialHeight;
                break;
              case 's':
                rawWidth = action.initialWidth;
                rawHeight = action.initialHeight + deltaY;
                break;
              case 'n':
                rawWidth = action.initialWidth;
                rawHeight = action.initialHeight - deltaY;
                break;
            }

            // Apply min size and proportional scaling
            const aspect = action.initialHeight > 0 ? action.initialWidth / action.initialHeight : 1;
            let newWidth = Math.max(minSize, rawWidth);
            let newHeight = Math.max(minSize, rawHeight);

            // Mantener proporción por defecto para imágenes al usar esquinas; Alt mantiene proporción para otros
            const targetEl = canvasElements.find((x) => x.id === action.elementId);
            const isCorner = ['se', 'ne', 'sw', 'nw'].includes(action.resizeCorner);
            const proportional = (targetEl?.type === 'image' && isCorner) || e.altKey;
            if (proportional) {
              const widthChange = Math.abs(rawWidth - action.initialWidth);
              const heightChange = Math.abs(rawHeight - action.initialHeight);
              if (widthChange >= heightChange) {
                newWidth = Math.max(minSize, rawWidth);
                newHeight = Math.max(minSize, Math.round(newWidth / aspect));
              } else {
                newHeight = Math.max(minSize, rawHeight);
                newWidth = Math.max(minSize, Math.round(newHeight * aspect));
              }
            }

            // Compute new position keeping opposite corner anchored
            let newLeft = initialLeft;
            let newTop = initialTop;
            switch (action.resizeCorner) {
              case 'se':
                newLeft = initialLeft;
                newTop = initialTop;
                break;
              case 'ne':
                newLeft = initialLeft;
                newTop = bottom - newHeight;
                break;
              case 'sw':
                newLeft = right - newWidth;
                newTop = initialTop;
                break;
              case 'nw':
                newLeft = right - newWidth;
                newTop = bottom - newHeight;
                break;
              case 'e':
                newLeft = initialLeft;
                newTop = initialTop;
                break;
              case 'w':
                newLeft = right - newWidth;
                newTop = initialTop;
                break;
              case 's':
                newLeft = initialLeft;
                newTop = initialTop;
                break;
              case 'n':
                newLeft = initialLeft;
                newTop = bottom - newHeight;
                break;
            }

            // Para imágenes, si recortamos desde el lado izquierdo o superior,
            // ajustamos el offset interno para que la imagen no se desplace visualmente
            const deltaLeftChange = newLeft - initialLeft;
            const deltaTopChange = newTop - initialTop;

            setCanvasElements((prev) =>
              prev.map((el) => {
                if (el.id !== action.elementId) return el;
                if (el.type === 'image') {
                  let imgOffsetX = el.imgOffsetX ?? 0;
                  let imgOffsetY = el.imgOffsetY ?? 0;
                  if (action.resizeCorner === 'w') {
                    imgOffsetX = (el.imgOffsetX ?? 0) - deltaLeftChange;
                  }
                  if (action.resizeCorner === 'n') {
                    imgOffsetY = (el.imgOffsetY ?? 0) - deltaTopChange;
                  }

                  // Asegurar que no queden huecos: la imagen debe cubrir el contenedor
                  const scale = el.imgScale ?? 1;
                  const natW = el.imgNatW ?? el.width;
                  const natH = el.imgNatH ?? el.height;
                  const imgW = natW * scale;
                  const imgH = natH * scale;

                  let adjLeft = newLeft;
                  let adjTop = newTop;
                  let adjWidth = newWidth;
                  let adjHeight = newHeight;

                  const isSideHandle = ['e', 'w', 'n', 's'].includes(action.resizeCorner);
                  if (isSideHandle) {
                    // Limitar tamaño para que no exceda el tamaño visible de la imagen con el offset actual
                    // Calcular límites de offset válidos para cubrir el contenedor [min, max]
                    const minOffX = Math.min(0, adjWidth - imgW);
                    const maxOffX = 0;
                    const minOffY = Math.min(0, adjHeight - imgH);
                    const maxOffY = 0;

                    // Si el contenedor es mayor que la imagen, reducir el contenedor según el lado activo
                    if (imgW < adjWidth) {
                      if (action.resizeCorner === 'e') {
                        adjWidth = imgW;
                      } else if (action.resizeCorner === 'w') {
                        adjLeft = right - imgW;
                        adjWidth = imgW;
                      }
                    }
                    if (imgH < adjHeight) {
                      if (action.resizeCorner === 's') {
                        adjHeight = imgH;
                      } else if (action.resizeCorner === 'n') {
                        adjTop = bottom - imgH;
                        adjHeight = imgH;
                      }
                    }

                    // Recalcular límites de offset tras posibles ajustes
                    const minOffX2 = Math.min(0, adjWidth - imgW);
                    const minOffY2 = Math.min(0, adjHeight - imgH);
                    imgOffsetX = Math.max(minOffX2, Math.min(maxOffX, imgOffsetX));
                    imgOffsetY = Math.max(minOffY2, Math.min(maxOffY, imgOffsetY));
                  } else {
                    // Para esquinas: clamp offset para evitar huecos si los hubiera
                    const minOffX = Math.min(0, adjWidth - imgW);
                    const minOffY = Math.min(0, adjHeight - imgH);
                    imgOffsetX = Math.max(minOffX, Math.min(0, imgOffsetX));
                    imgOffsetY = Math.max(minOffY, Math.min(0, imgOffsetY));
                  }

                  return {
                    ...el,
                    x: adjLeft,
                    y: adjTop,
                    width: adjWidth,
                    height: adjHeight,
                    imgOffsetX,
                    imgOffsetY,
                  };
                }
                return { ...el, x: newLeft, y: newTop, width: newWidth, height: newHeight };
              })
            );
          }
        }}
        onMouseUp={() => {
          if (marquee.active) {
            setMarquee({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
            if (selectedElementIds.length === 1) {
              setSelectedElementId(selectedElementIds[0]);
            } else {
              setSelectedElementId(null);
            }
          }
          // Limpiar guías al soltar
          setGuideOverlay({ v: [], h: [], bounds: null });
          setAction({
            type: null,
            elementId: null,
            initialX: 0,
            initialY: 0,
            initialWidth: 0,
            initialHeight: 0,
          });
        }}
        onMouseLeave={() => {
          if (marquee.active) {
            setMarquee({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
          }
          // Limpiar guías al salir
          setGuideOverlay({ v: [], h: [], bounds: null });
          setAction({
            type: null,
            elementId: null,
            initialX: 0,
            initialY: 0,
            initialWidth: 0,
            initialHeight: 0,
          });
        }}>
        
          {/* Interactive Canvas Zone */}
          <div
            className="relative w-[80%] h-[85%] bg-white shadow-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-all duration-300 cursor-default group overflow-hidden"
            style={{ backgroundColor: hexToRgba(backgroundColor, backgroundOpacity), transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            ref={canvasRef}
          >
            {/* Background image layer removed (solo color sólido) */}
            {/* Canvas Background Pattern */}
            <div className="absolute inset-0 opacity-5 z-10 pointer-events-none">
              <div className="w-full h-full" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }}></div>
            </div>

            {/* Canvas Content */}
            <div
              className="relative w-full h-full p-8"
              ref={canvasAreaRef}
              onMouseDown={(e) => {
                // Iniciar selección por arrastre (marquee) solo con herramienta de selección
                if (currentTool !== 'select') return;
                setMarquee({
                  active: true,
                  startX: e.clientX,
                  startY: e.clientY,
                  currentX: e.clientX,
                  currentY: e.clientY,
                });
                // Limpiar selección anterior
                setSelectedElementIds([]);
                setSelectedElementId(null);
              }}
              onClick={() => {
                // Evitar abrir el panel de fondo inmediatamente después de una selección múltiple
                setSelectedElementId(null);
                setShowEffectDropdown(false);
                setShowCornersOptions(false);
                setShowImageCornersOptions(false);
                setShowImageBorderOptions(false);
                setShowImageFiltersOptions(false);
                setShowImageOpacityOptions(false);
                setShowElementPanel(false);
                if (!backgroundLocked && selectedElementIds.length === 0) setShowBackgroundPanel(true);
        }}
        >
              {canvasElements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  {showIntro && (
                    <>
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">Haz clic para cambiar el color de fondo</h3>
                      <p className="text-sm text-slate-400 mb-4">Usa las herramientas de la izquierda para añadir contenido</p>
                      <button
                        className="mt-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowIntro(false);
                        }}
                      >
                        Aceptar
                      </button>
                    </>
                  )}

                  {showBackgroundImageDialog && (
                    <div
                      className="mt-6 inline-flex flex-col items-stretch space-y-2 bg-white text-black border border-slate-200 rounded-lg shadow-lg p-4"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm font-medium mb-1">Subir imagen de fondo</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Pega un enlace (URL) de imagen"
                          className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const url = (e.currentTarget as HTMLInputElement).value.trim();
                              if (url) {
                                setBackgroundImage(url);
                                setShowBackgroundImageDialog(false);
                              }
                            }
                          }}
                        />
                        <button
                          className="px-2 py-1 text-sm rounded border border-slate-300 bg-white text-black"
                          onClick={(e) => {
                            const inputEl = (e.currentTarget.parentElement?.querySelector('input[type="text"]') as HTMLInputElement) || null;
                            const url = inputEl?.value.trim();
                            if (url) {
                              setBackgroundImage(url);
                              setShowBackgroundImageDialog(false);
                            }
                          }}
                        >
                          Aplicar
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="px-2 py-1 text-sm rounded border border-slate-300 bg-white text-black"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (ev) => {
                              const file = (ev.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (re) => {
                                  const result = re.target?.result;
                                  if (typeof result === 'string') {
                                    setBackgroundImage(result);
                                    setShowBackgroundImageDialog(false);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                        >
                          Desde este equipo
                        </button>
                        <button
                          className="px-2 py-1 text-sm rounded border border-slate-300 bg-white text-black"
                          onClick={() => setShowBackgroundImageDialog(false)}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {canvasElements.map((element, idx) => (
                    <div
                      key={element.id}
                      className="absolute cursor-move hover:shadow-lg transition-shadow duration-200 relative"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        // Si estamos editando texto (o doble clic), no iniciar movimiento
                        if (editingTextId === element.id || e.detail >= 2) return;
                        // Solo permitir mover en modo selector
                        if (currentTool !== 'select') return;
                        if (element.locked) return;
                        // Prevenir selección de texto/imagen
                        e.preventDefault();

                        // Alt + arrastrar => duplicar y mover la copia (si no está bloqueado)
                        if (e.altKey) {
                          if (element.locked) return;
                          const cloneId = Date.now();
                          const nextIndex =
                            element.type === 'image'
                              ? canvasElements.filter((x) => x.type === 'image').length + 1
                              : element.type === 'text'
                              ? canvasElements.filter((x) => x.type === 'text').length + 1
                              : canvasElements.filter((x) => x.type === 'shape').length + 1;
                          const gap = 8;
                          const offsetY = Math.max(0, element.y - (element.height || 0) - gap);
                          const clone: CanvasElement = {
                            ...element,
                            id: cloneId,
                            y: offsetY,
                            name:
                              element.type === 'image'
                                ? `imagen${nextIndex}`
                                : element.type === 'text'
                                ? `texto${nextIndex}`
                                : `forma${nextIndex}`,
                          };
                          setCanvasElements((prev) => [...prev, clone]);
                          setSelectedElementId(cloneId);
                          setAction({
                            type: 'moving',
                            elementId: cloneId,
                            initialX: e.clientX,
                            initialY: e.clientY,
                            initialWidth: clone.width || 0,
                            initialHeight: clone.height || 0,
                            initialLeft: clone.x,
                            initialTop: clone.y,
                          });
                          return;
                        }

                      // Comportamiento normal: mover el elemento original (respetando zoom)
                      setAction({
                        type: 'moving',
                        elementId: element.id,
                        initialX: e.clientX,
                        initialY: e.clientY,
                        initialWidth: element.width || 0,
                        initialHeight: element.height || 0,
                        initialLeft: element.x,
                        initialTop: element.y,
                      });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentTool !== 'select') return;
                        setSelectedElementId(element.id);
                        setShowEffectDropdown(false);
                        setShowCornersOptions(false);
                        setShowImageCornersOptions(false);
                        setShowImageBorderOptions(false);
                        setShowImageFiltersOptions(false);
                        setShowImageOpacityOptions(false);
                        setShowBackgroundPanel(false);
                        setShowElementPanel(true);
                      }}
                      onDoubleClick={(e) => {
                        if (element.type === 'text') {
                          e.stopPropagation();
                          if (element.locked) return;
                          setSelectedElementId(element.id);
                          setEditingTextId(element.id);
                          setShowElementPanel(true);
                        }
                      }}
                      style={{
                        left: element.x,
                        top: element.y,
                        fontSize: element.fontSize,
                        color: element.color,
                        width: element.width,
                        height: element.height,
                        zIndex: 20 + idx,
                      }}
                    >
                      {element.type === 'text' ? (
                        <div
                          className="w-full h-full px-3 py-2 rounded-lg border flex items-center justify-center overflow-hidden"
                          style={{
                            fontFamily: element.fontFamily,
                            fontWeight: element.fontWeight,
                            fontStyle: element.fontStyle,
                            borderRadius: `${element.borderRadius ?? 0}%`,
                            borderWidth: (element.borderWidth ?? 0) + 'px',
                            borderColor: element.borderColor ?? '#e2e8f0',
                            borderStyle: element.borderStyle ?? 'solid',
                            backgroundColor: element.backgroundColor ?? 'transparent',
                          }}
                        >
                          {editingTextId === element.id ? (
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              ref={(el) => {
                                if (el) {
                                  el.focus();
                                  // Colocar el cursor al final
                                  const range = document.createRange();
                                  range.selectNodeContents(el);
                                  range.collapse(false);
                                  const sel = window.getSelection();
                                  sel?.removeAllRanges();
                                  sel?.addRange(range);
                                }
                              }}
                              className="outline-none w-full whitespace-pre-wrap"
                              style={{
                                fontFamily: element.fontFamily,
                                fontWeight: element.fontWeight,
                                fontStyle: element.fontStyle,
                                fontSize: element.fontSize,
                                color: element.color,
                                textAlign: (element.textAlign as any) || 'center',
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              onInput={(e) => {
                                const text = (e.currentTarget as HTMLDivElement).innerText;
                                setCanvasElements((prev) =>
                                  prev.map((el) => (el.id === element.id ? { ...el, content: text } : el))
                                );
                              }}
                              onBlur={() => setEditingTextId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  e.preventDefault();
                                  (e.currentTarget as HTMLDivElement).blur();
                                }
                              }}
                            >
                              {element.content}
                            </div>
                          ) : (
                            <div className="w-full whitespace-pre-wrap" title={element.content} style={{ color: element.color, textAlign: (element.textAlign as any) || 'center' }}>
                              {element.content}
                            </div>
                          )}
                        </div>
                      ) : element.type === 'image' ? (
                        <div
                          className="w-full h-full shadow-md relative"
                          style={{
                            borderRadius: `${element.borderRadius ?? 0}%`,
                            borderWidth: (element.borderWidth ?? 0) + 'px',
                            borderColor: element.borderColor ?? '#e2e8f0',
                            borderStyle: element.borderStyle ?? 'solid',
                            backgroundColor: element.backgroundColor ?? 'transparent',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={element.src}
                            alt="Canvas element"
                            className="block absolute"
                            style={{
                              left: `${element.imgOffsetX ?? 0}px`,
                              top: `${element.imgOffsetY ?? 0}px`,
                              transform: `scale(${element.imgScale ?? 1})`,
                              transformOrigin: 'top left',
                              filter: `brightness(${element.brightness ?? 100}%) contrast(${element.contrast ?? 100}%) saturate(${element.saturate ?? 100}%) hue-rotate(${element.hueRotate ?? 0}deg) grayscale(${element.grayscale ?? 0}%) sepia(${element.sepia ?? 0}%) blur(${element.blur ?? 0}px)`,
                              opacity: Math.max(0, Math.min(100, element.opacity ?? 100)) / 100,
                            }}
                            draggable={false}
                          />
                        </div>
                      ) : element.type === 'shape' ? (
                        <div className="w-full h-full" style={{ position: 'relative' }}>
                          {element.shapeKind === 'rectangle' || element.shapeKind === 'square' ? (
                            <div
                              className="w-full h-full"
                              style={{
                                backgroundColor: element.backgroundColor || '#60a5fa',
                                borderRadius: element.shapeKind === 'rectangle' ? `${element.borderRadius ?? 0}%` : '0%'
                              }}
                            />
                          ) : element.shapeKind === 'circle' ? (
                            <div
                              className="w-full h-full"
                              style={{ backgroundColor: element.backgroundColor || '#60a5fa', borderRadius: '50%' }}
                            />
                          ) : (
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                              {element.shapeKind === 'triangle' ? (
                                <polygon
                                  points="50,10 90,90 10,90"
                                  fill={element.backgroundColor || '#60a5fa'}
                                  stroke={element.borderColor || 'transparent'}
                                  strokeWidth={element.borderWidth || 0}
                                  strokeDasharray={element.borderStyle === 'dashed' ? '6 4' : undefined}
                                />
                              ) : (
                                <path
                                  d="M20 40 H60 V30 L85 50 L60 70 V60 H20 Z"
                                  fill={element.backgroundColor || '#60a5fa'}
                                  stroke={element.borderColor || 'transparent'}
                                  strokeWidth={element.borderWidth || 0}
                                  strokeDasharray={element.borderStyle === 'dashed' ? '6 4' : undefined}
                                />
                              )}
                            </svg>
                          )}
                          {/* Contorno sobre la forma, no alrededor del bounding box */}
                          {element.shapeKind === 'rectangle' || element.shapeKind === 'square' || element.shapeKind === 'circle' ? (
                            <div
                              className="pointer-events-none absolute inset-0"
                              style={{
                                border: `${element.borderWidth ?? 0}px ${element.borderStyle ?? 'solid'} ${element.borderColor ?? 'transparent'}`,
                                borderRadius: element.shapeKind === 'circle' ? '50%' : element.shapeKind === 'rectangle' ? `${element.borderRadius ?? 0}%` : '0%'
                              }}
                            />
                          ) : null}
                        </div>
                      ) : null}

                      {(selectedElementId === element.id || selectedElementIds.includes(element.id)) && (
                        <>
                          {/* Selection frame */}
                          <div className="pointer-events-none absolute inset-0 border-2 border-purple-500" />
                          {/* Esquinas de redimensionado */}
                          <div
                            className="absolute -right-2 -bottom-2 w-3.5 h-3.5 bg-white border-2 border-purple-500 rounded-full cursor-se-resize shadow-sm"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setAction({
                                type: 'resizing',
                                elementId: element.id,
                                initialX: e.clientX,
                                initialY: e.clientY,
                                initialWidth: element.width || 0,
                                initialHeight: element.height || 0,
                                initialLeft: element.x,
                                initialTop: element.y,
                                resizeCorner: 'se',
                              });
                            }}
                          />
                          <div
                            className="absolute -left-2 -top-2 w-3.5 h-3.5 bg-white border-2 border-purple-500 rounded-full cursor-nwse-resize shadow-sm"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setAction({
                                type: 'resizing',
                                elementId: element.id,
                                initialX: e.clientX,
                                initialY: e.clientY,
                                initialWidth: element.width || 0,
                                initialHeight: element.height || 0,
                                initialLeft: element.x,
                                initialTop: element.y,
                                resizeCorner: 'nw',
                              });
                            }}
                          />
                          <div
                            className="absolute -right-2 -top-2 w-3.5 h-3.5 bg-white border-2 border-purple-500 rounded-full cursor-nesw-resize shadow-sm"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setAction({
                                type: 'resizing',
                                elementId: element.id,
                                initialX: e.clientX,
                                initialY: e.clientY,
                                initialWidth: element.width || 0,
                                initialHeight: element.height || 0,
                                initialLeft: element.x,
                                initialTop: element.y,
                                resizeCorner: 'ne',
                              });
                            }}
                          />
                          <div
                            className="absolute -left-2 -bottom-2 w-3.5 h-3.5 bg-white border-2 border-purple-500 rounded-full cursor-nesw-resize shadow-sm"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setAction({
                                type: 'resizing',
                                elementId: element.id,
                                initialX: e.clientX,
                                initialY: e.clientY,
                                initialWidth: element.width || 0,
                                initialHeight: element.height || 0,
                                initialLeft: element.x,
                                initialTop: element.y,
                                resizeCorner: 'sw',
                              });
                            }}
                          />
                          {/* Side handles for single-side cropping (images y formas) */}
                          {element.type !== 'text' && (
                            <>
                              {/* East */}
                              <div
                                className="absolute -right-2 top-1/2 -translate-y-1/2 w-2.5 h-6 bg-white border-2 border-purple-500 rounded-sm cursor-ew-resize shadow-sm"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setAction({
                                    type: 'resizing',
                                    elementId: element.id,
                                    initialX: e.clientX,
                                    initialY: e.clientY,
                                    initialWidth: element.width || 0,
                                    initialHeight: element.height || 0,
                                    initialLeft: element.x,
                                    initialTop: element.y,
                                    resizeCorner: 'e',
                                  });
                                }}
                              />
                              {/* West */}
                              <div
                                className="absolute -left-2 top-1/2 -translate-y-1/2 w-2.5 h-6 bg-white border-2 border-purple-500 rounded-sm cursor-ew-resize shadow-sm"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setAction({
                                    type: 'resizing',
                                    elementId: element.id,
                                    initialX: e.clientX,
                                    initialY: e.clientY,
                                    initialWidth: element.width || 0,
                                    initialHeight: element.height || 0,
                                    initialLeft: element.x,
                                    initialTop: element.y,
                                    resizeCorner: 'w',
                                  });
                                }}
                              />
                              {/* North */}
                              <div
                                className="absolute left-1/2 -translate-x-1/2 -top-2 w-6 h-2.5 bg-white border-2 border-purple-500 rounded-sm cursor-ns-resize shadow-sm"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setAction({
                                    type: 'resizing',
                                    elementId: element.id,
                                    initialX: e.clientX,
                                    initialY: e.clientY,
                                    initialWidth: element.width || 0,
                                    initialHeight: element.height || 0,
                                    initialLeft: element.x,
                                    initialTop: element.y,
                                    resizeCorner: 'n',
                                  });
                                }}
                              />
                              {/* South */}
                              <div
                                className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-6 h-2.5 bg-white border-2 border-purple-500 rounded-sm cursor-ns-resize shadow-sm"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setAction({
                                    type: 'resizing',
                                    elementId: element.id,
                                    initialX: e.clientX,
                                    initialY: e.clientY,
                                    initialWidth: element.width || 0,
                                    initialHeight: element.height || 0,
                                    initialLeft: element.x,
                                    initialTop: element.y,
                                    resizeCorner: 's',
                                  });
                                }}
                              />
                            </>
                          )}
                          {element.type === 'image' && (
                            <div className="relative">
                              <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm shadow-md transition-colors duration-200"
                                style={{ position: 'absolute', top: '100%', left: '0%', marginTop: '10px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowEffectDropdown(!showEffectDropdown);
                                }}
                              >
                                Añadir efecto
                              </button>

                              {showEffectDropdown && (
                                <div
                                  className="absolute bg-white border border-slate-200 rounded-md shadow-lg py-1 z-10"
                                  style={{ top: 'calc(100% + 50px)', left: '0%', minWidth: '180px' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                                    onClick={() => {
                                      console.log('Añadir animación al elemento:', element.id);
                                      setShowEffectDropdown(false);
                                    }}
                                  >
                                    🎬 Añadir animación
                                  </button>
                                  <div className="border-t border-slate-200 my-1"></div>
                                  <button
                                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                                    onClick={() => {
                                      setCanvasElements(canvasElements.filter((el) => el.id !== element.id));
                                      setSelectedElementId(null);
                                      setShowEffectDropdown(false);
                                    }}
                                  >
                                    🗑️ Eliminar elemento
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                            {showElementPanel && element.type === 'shape' && (
                              <div
                                className="fixed bg-white border border-slate-200 rounded-md shadow-lg px-3 py-2 z-30 flex items-center space-x-3 text-black"
                                style={{
                                  top: `${imagePanelPos.top}px`,
                                  left: `${imagePanelPos.left}px`,
                                  transform: 'translate(-50%, 0%)',
                                  color: '#000',
                                  minWidth: '320px',
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Tipo de forma - dropdown con iconos */}
                                <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="px-2 py-1 text-sm rounded border border-slate-300 bg-white text-black"
                                    onClick={() => setShowShapeKindOptions((v) => !v)}
                                  >
                                    Forma ▾
                                  </button>
                                  {showShapeKindOptions && (
                                    <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-40 flex flex-col space-y-2">
                                      <button
                                        className="w-36 h-10 border border-slate-300 rounded flex items-center space-x-2 px-2 hover:bg-slate-50"
                                        title="Rectángulo"
                                        onClick={() => {
                                          setCanvasElements((prev) => prev.map((el) => (el.id === element.id ? { ...el, shapeKind: 'rectangle' } : el)));
                                          setShowShapeKindOptions(false);
                                        }}
                                      >
                                        <svg viewBox="0 0 100 100" className="w-7 h-7"><rect x="15" y="30" width="70" height="40" rx="0" fill="#94a3b8"/></svg>
                                        <span className="text-xs text-slate-700">Rectángulo</span>
                                      </button>
                                      <button
                                        className="w-36 h-10 border border-slate-300 rounded flex items-center space-x-2 px-2 hover:bg-slate-50"
                                        title="Cuadrado"
                                        onClick={() => {
                                          setCanvasElements((prev) => prev.map((el) => {
                                            if (el.id !== element.id) return el;
                                            const size = Math.max(1, Math.min(el.width, el.height));
                                            const centerX = el.x + (el.width / 2);
                                            const centerY = el.y + (el.height / 2);
                                            return { ...el, shapeKind: 'square', borderRadius: 0, width: size, height: size, x: Math.round(centerX - size/2), y: Math.round(centerY - size/2) };
                                          }));
                                          setShowShapeKindOptions(false);
                                        }}
                                      >
                                        <svg viewBox="0 0 100 100" className="w-7 h-7"><rect x="25" y="25" width="50" height="50" fill="#94a3b8"/></svg>
                                        <span className="text-xs text-slate-700">Cuadrado</span>
                                      </button>
                                      <button
                                        className="w-36 h-10 border border-slate-300 rounded flex items-center space-x-2 px-2 hover:bg-slate-50"
                                        title="Círculo"
                                        onClick={() => {
                                          setCanvasElements((prev) => prev.map((el) => {
                                            if (el.id !== element.id) return el;
                                            const size = Math.max(1, Math.min(el.width, el.height));
                                            const centerX = el.x + (el.width / 2);
                                            const centerY = el.y + (el.height / 2);
                                            return { ...el, shapeKind: 'circle', borderRadius: 50, width: size, height: size, x: Math.round(centerX - size/2), y: Math.round(centerY - size/2) };
                                          }));
                                          setShowShapeKindOptions(false);
                                        }}
                                      >
                                        <svg viewBox="0 0 100 100" className="w-7 h-7"><circle cx="50" cy="50" r="28" fill="#94a3b8"/></svg>
                                        <span className="text-xs text-slate-700">Círculo</span>
                                      </button>
                                      <button
                                        className="w-36 h-10 border border-slate-300 rounded flex items-center space-x-2 px-2 hover:bg-slate-50"
                                        title="Triángulo"
                                        onClick={() => {
                                          setCanvasElements((prev) => prev.map((el) => (el.id === element.id ? { ...el, shapeKind: 'triangle' } : el)));
                                          setShowShapeKindOptions(false);
                                        }}
                                      >
                                        <svg viewBox="0 0 100 100" className="w-7 h-7"><polygon points="50,20 80,80 20,80" fill="#94a3b8"/></svg>
                                        <span className="text-xs text-slate-700">Triángulo</span>
                                      </button>
                                      <button
                                        className="w-36 h-10 border border-slate-300 rounded flex items-center space-x-2 px-2 hover:bg-slate-50"
                                        title="Flecha"
                                        onClick={() => {
                                          setCanvasElements((prev) => prev.map((el) => (el.id === element.id ? { ...el, shapeKind: 'arrow' } : el)));
                                          setShowShapeKindOptions(false);
                                        }}
                                      >
                                        <svg viewBox="0 0 100 100" className="w-7 h-7"><path d="M20 40 H60 V30 L85 50 L60 70 V60 H20 Z" fill="#94a3b8"/></svg>
                                        <span className="text-xs text-slate-700">Flecha</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {/* Color relleno */}
                                <div className="flex items-center space-x-1">
                                  <label className="text-xs text-slate-600">Relleno</label>
                                  <input
                                    type="color"
                                    className="w-8 h-8 p-0 border border-slate-300 rounded bg-white"
                                    value={element.backgroundColor || '#60a5fa'}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setCanvasElements((prev) => prev.map((el) => (el.id === element.id ? { ...el, backgroundColor: v } : el)));
                                    }}
                                  />
                                </div>
                                {/* Borde */}
                                <div className="flex items-center space-x-1">
                                  <label className="text-xs text-slate-600">Borde</label>
                                  <input
                                    type="number"
                                    className="w-16 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                    min={0}
                                    max={20}
                                    step={1}
                                    value={Number(element.borderWidth ?? 0)}
                                    onChange={(e) => {
                                      const v = Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0));
                                      setCanvasElements((prev) => prev.map((el) => (el.id === element.id ? { ...el, borderWidth: v } : el)));
                                    }}
                                  />
                                  <input
                                    type="color"
                                    className="w-8 h-8 p-0 border border-slate-300 rounded bg-white"
                                    value={element.borderColor || '#94a3b8'}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setCanvasElements((prev) => prev.map((el) => (el.id === element.id ? { ...el, borderColor: v } : el)));
                                    }}
                                  />
                                  <select
                                    className="border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                    value={element.borderStyle || 'solid'}
                                    onChange={(e) => {
                                      const v = e.target.value as 'solid' | 'dashed';
                                      setCanvasElements((prev) => prev.map((el) => (el.id === element.id ? { ...el, borderStyle: v } : el)));
                                    }}
                                  >
                                    <option value="solid">Continua</option>
                                    <option value="dashed">Discontinua</option>
                                  </select>
                                </div>
                                {/* Esquinas (para rectángulo/cuadrado) */}
                                <div className="flex items-center space-x-1">
                                  <label className="text-xs text-slate-600">Esquinas</label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={Number(element.borderRadius ?? 0)}
                                    onChange={(e) => {
                                      const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                      setCanvasElements((prev) => prev.map((el) => (el.id === element.id ? { ...el, borderRadius: v } : el)));
                                    }}
                                  />
                                  <input
                                    type="number"
                                    className="w-16 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={Number(element.borderRadius ?? 0)}
                                    onChange={(e) => {
                                      const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                      setCanvasElements((prev) => prev.map((el) => (el.id === element.id ? { ...el, borderRadius: v } : el)));
                                    }}
                                  />
                                  <span className="text-xs text-slate-500">%</span>
                                </div>
                              </div>
                            )}
                            {showElementPanel && element.type === 'image' && (
                              <div
                                className="fixed bg-white border border-slate-200 rounded-md shadow-lg px-3 py-2 z-30 flex items-center space-x-3 text-black"
                                style={{
                                  top: `${imagePanelPos.top - 8}px`,
                                  left: `${imagePanelPos.left}px`,
                                  transform: 'translate(-50%, -100%)',
                                  color: '#000',
                                  minWidth: '320px',
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="relative">
                                  <button
                                    className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-black"
                                    onClick={() => {
                                      setShowImageSizeOptions((v) => !v);
                                      setShowImageCornersOptions(false);
                                      setShowImageBorderOptions(false);
                                      setShowImageOpacityOptions(false);
                                      setShowImageFiltersOptions(false);
                                    }}
                                  >
                                    Tamaño ▾
                                  </button>
                                  {showImageSizeOptions && (
                                  <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-40 w-[260px]">
                                    <label className="flex items-center space-x-2 text-xs text-slate-600">
                                      <input
                                        type="checkbox"
                                        className="accent-blue-600"
                                        checked={imageKeepAspect}
                                        onChange={(e) => setImageKeepAspect(e.target.checked)}
                                      />
                                      <span>Mantener proporción</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex items-center space-x-1">
                                        <span className="text-xs text-slate-600">Ancho</span>
                                        <input
                                          type="number"
                                          className="w-20 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                          min={20}
                                          max={4000}
                                          step={1}
                                          value={Number(element.width || 0)}
                                          onChange={(e) => {
                                            const w = Math.max(20, Math.min(4000, parseInt(e.target.value, 10) || 0));
                                            if (imageKeepAspect && (element.width ?? 0) > 0 && (element.height ?? 0) > 0) {
                                              const aspect = (element.height as number) > 0 ? (element.width as number) / (element.height as number) : 1;
                                              const h = Math.max(20, Math.round(w / aspect));
                                              setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, width: w, height: h } : el));
                                            } else {
                                              setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, width: w } : el));
                                            }
                                          }}
                                        />
                                        <span className="text-xs text-slate-500">px</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <span className="text-xs text-slate-600">Alto</span>
                                        <input
                                          type="number"
                                          className="w-20 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                          min={20}
                                          max={4000}
                                          step={1}
                                          value={Number(element.height || 0)}
                                          onChange={(e) => {
                                            const h = Math.max(20, Math.min(4000, parseInt(e.target.value, 10) || 0));
                                            if (imageKeepAspect && (element.width ?? 0) > 0 && (element.height ?? 0) > 0) {
                                              const aspect = (element.height as number) > 0 ? (element.width as number) / (element.height as number) : 1;
                                              const w = Math.max(20, Math.round(h * aspect));
                                              setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, width: w, height: h } : el));
                                            } else {
                                              setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, height: h } : el));
                                            }
                                          }}
                                        />
                                        <span className="text-xs text-slate-500">px</span>
                                      </div>
                                    </div>
                                  </div>
                                  )}
                                </div>
                                <div className="relative">
                                  <button
                                    className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-black"
                                    onClick={() => {
                                      setShowImageCornersOptions((v) => !v);
                                      setShowImageSizeOptions(false);
                                      setShowImageBorderOptions(false);
                                      setShowImageOpacityOptions(false);
                                      setShowImageFiltersOptions(false);
                                    }}
                                  >Esquinas ▾</button>
                                  {showImageCornersOptions && (
                                  <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-40 w-[220px] flex items-center space-x-2">
                                    <input
                                      type="range"
                                      min={0}
                                      max={100}
                                      step={1}
                                      value={Number(element.borderRadius ?? 0)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) =>
                                          prev.map((el) => (el.id === element.id ? { ...el, borderRadius: v } : el))
                                        );
                                      }}
                                    />
                                    <input
                                      type="number"
                                      className="w-16 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                      min={0}
                                      max={100}
                                      step={1}
                                      value={Number(element.borderRadius ?? 0)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) =>
                                          prev.map((el) => (el.id === element.id ? { ...el, borderRadius: v } : el))
                                        );
                                      }}
                                    />
                                    <span className="text-xs text-slate-500">%</span>
                                  </div>
                                  )}
                                </div>

                                <div className="relative">
                                  <button
                                    className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-black"
                                    onClick={() => {
                                      setShowImageBorderOptions((v) => !v);
                                      setShowImageSizeOptions(false);
                                      setShowImageCornersOptions(false);
                                      setShowImageOpacityOptions(false);
                                      setShowImageFiltersOptions(false);
                                    }}
                                  >Borde ▾</button>
                                  {showImageBorderOptions && (
                                  <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-40 w-[260px] flex items-center space-x-2">
                                    <input
                                      type="number"
                                      className="w-16 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                      min={0}
                                      max={20}
                                      step={1}
                                      value={Number(element.borderWidth ?? 0)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) =>
                                          prev.map((el) => (el.id === element.id ? { ...el, borderWidth: v } : el))
                                        );
                                      }}
                                    />
                                    <input
                                      type="color"
                                      className="w-8 h-8 p-0 border border-slate-300 rounded bg-white"
                                      value={element.borderColor || '#e2e8f0'}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setCanvasElements((prev) =>
                                          prev.map((el) => (el.id === element.id ? { ...el, borderColor: v } : el))
                                        );
                                      }}
                                    />
                                    <select
                                      className="border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                      value={element.borderStyle || 'solid'}
                                      onChange={(e) => {
                                        const v = e.target.value as 'solid' | 'dashed';
                                        setCanvasElements((prev) =>
                                          prev.map((el) => (el.id === element.id ? { ...el, borderStyle: v } : el))
                                        );
                                      }}
                                    >
                                      <option value="solid">Continua</option>
                                      <option value="dashed">Discontinua</option>
                                    </select>
                                  </div>
                                  )}
                                </div>

                                <div className="relative">
                                  <button
                                    className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-black"
                                    onClick={() => {
                                      setShowImageOpacityOptions((v) => !v);
                                      setShowImageSizeOptions(false);
                                      setShowImageCornersOptions(false);
                                      setShowImageBorderOptions(false);
                                      setShowImageFiltersOptions(false);
                                    }}
                                  >Transparencia ▾</button>
                                  {showImageOpacityOptions && (
                                  <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-40 w-[240px] flex items-center space-x-2">
                                    <input
                                      type="range"
                                      min={0}
                                      max={100}
                                      step={1}
                                      value={Number(element.opacity ?? 100)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) =>
                                          prev.map((el) => (el.id === element.id ? { ...el, opacity: v } : el))
                                        );
                                      }}
                                    />
                                    <input
                                      type="number"
                                      className="w-16 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                      min={0}
                                      max={100}
                                      step={1}
                                      value={Number(element.opacity ?? 100)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) =>
                                          prev.map((el) => (el.id === element.id ? { ...el, opacity: v } : el))
                                        );
                                      }}
                                    />
                                    <span className="text-xs text-slate-500">%</span>
                                  </div>
                                  )}
                                </div>

                                <div className="relative">
                                  <button
                                    className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-black"
                                    onClick={() => {
                                      setShowImageFiltersOptions((v) => !v);
                                      setShowImageSizeOptions(false);
                                      setShowImageCornersOptions(false);
                                      setShowImageBorderOptions(false);
                                      setShowImageOpacityOptions(false);
                                    }}
                                  >Filtros ▾</button>
                                  {showImageFiltersOptions && (
                                  <div
                                    className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-40 w-[300px] grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2"
                                    style={{ overscrollBehavior: 'contain' }}
                                    onWheel={(e) => e.stopPropagation()}
                                  >
                                    <label className="text-xs text-slate-600 col-span-2">Brillo</label>
                                    <input type="range" min={0} max={200} step={1}
                                      value={Number(element.brightness ?? 100)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(200, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, brightness: v } : el));
                                      }}
                                    />
                                    <label className="text-xs text-slate-600 col-span-2">Contraste</label>
                                    <input type="range" min={0} max={200} step={1}
                                      value={Number(element.contrast ?? 100)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(200, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, contrast: v } : el));
                                      }}
                                    />
                                    <label className="text-xs text-slate-600 col-span-2">Saturación</label>
                                    <input type="range" min={0} max={200} step={1}
                                      value={Number(element.saturate ?? 100)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(200, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, saturate: v } : el));
                                      }}
                                    />
                                    <label className="text-xs text-slate-600 col-span-2">Tono (Hue)</label>
                                    <input type="range" min={0} max={360} step={1}
                                      value={Number(element.hueRotate ?? 0)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(360, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, hueRotate: v } : el));
                                      }}
                                    />
                                    <label className="text-xs text-slate-600 col-span-2">Grises</label>
                                    <input type="range" min={0} max={100} step={1}
                                      value={Number(element.grayscale ?? 0)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, grayscale: v } : el));
                                      }}
                                    />
                                    <label className="text-xs text-slate-600 col-span-2">Sepia</label>
                                    <input type="range" min={0} max={100} step={1}
                                      value={Number(element.sepia ?? 0)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, sepia: v } : el));
                                      }}
                                    />
                                    <label className="text-xs text-slate-600 col-span-2">Desenfoque</label>
                                    <input type="range" min={0} max={10} step={1}
                                      value={Number(element.blur ?? 0)}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0));
                                        setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, blur: v } : el));
                                      }}
                                    />
                                  </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {showElementPanel && element.type === 'text' && (
                              <div
                                className="fixed bg-white border border-slate-200 rounded-md shadow-lg p-3 z-30 flex items-center space-x-2 text-black"
                                style={{
                                  top: `${imagePanelPos.top}px`,
                                  left: `${imagePanelPos.left}px`,
                                  transform: 'translate(-50%, 0%)',
                                  color: '#000',
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <select
                                  className="border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                  value={element.fontFamily || 'Inter, system-ui, sans-serif'}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setCanvasElements((prev) =>
                                      prev.map((el) => (el.id === element.id ? { ...el, fontFamily: v } : el))
                                      );
                                  }}
                                  >
                                  <option value="Inter, system-ui, sans-serif">Inter</option>
                                  <option value="Arial, Helvetica, sans-serif">Arial</option>
                                  <option value="Georgia, serif">Georgia</option>
                                  <option value="'Times New Roman', Times, serif">Times New Roman</option>
                                  <option value="Verdana, Geneva, sans-serif">Verdana</option>
                                  <option value="Roboto, system-ui, sans-serif">Roboto</option>
                                </select>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    className="w-20 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                    min={8}
                                    max={300}
                                    step={1}
                                    value={Number(element.fontSize || 16)}
                                    onChange={(e) => {
                                      const size = parseInt(e.target.value, 10);
                                      if (!isNaN(size)) {
                                        setCanvasElements((prev) =>
                                          prev.map((el) => (el.id === element.id ? { ...el, fontSize: size } : el))
                                          );
                                      }
                                    }}
                                    />
                                </div>
                                {/* Text alignment */}
                                <div className="flex items-center space-x-1">
                                  <label className="text-xs text-slate-600">Alineación</label>
                                  <button
                                    className={`p-2 border rounded ${element.textAlign === 'left' ? 'bg-slate-100 border-slate-400' : 'border-slate-300 hover:bg-slate-50'}`}
                                    title="Alinear a la izquierda"
                                    onClick={() => setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, textAlign: 'left' } : el))}
                                  >
                                    <AlignLeft className="w-4 h-4" />
                                  </button>
                                  <button
                                    className={`p-2 border rounded ${element.textAlign === 'center' || !element.textAlign ? 'bg-slate-100 border-slate-400' : 'border-slate-300 hover:bg-slate-50'}`}
                                    title="Centrar"
                                    onClick={() => setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, textAlign: 'center' } : el))}
                                  >
                                    <AlignCenter className="w-4 h-4" />
                                  </button>
                                  <button
                                    className={`p-2 border rounded ${element.textAlign === 'right' ? 'bg-slate-100 border-slate-400' : 'border-slate-300 hover:bg-slate-50'}`}
                                    title="Alinear a la derecha"
                                    onClick={() => setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, textAlign: 'right' } : el))}
                                  >
                                    <AlignRight className="w-4 h-4" />
                                  </button>
                                  <button
                                    className={`p-2 border rounded ${element.textAlign === 'justify' ? 'bg-slate-100 border-slate-400' : 'border-slate-300 hover:bg-slate-50'}`}
                                    title="Justificar"
                                    onClick={() => setCanvasElements((prev) => prev.map((el) => el.id === element.id ? { ...el, textAlign: 'justify' } : el))}
                                  >
                                    <AlignJustify className="w-4 h-4" />
                                  </button>
                                </div>
                                {/* Text color */}
                                <div className="flex items-center space-x-1">
                                  <label className="text-xs text-slate-600">Texto</label>
                                  <input
                                    type="color"
                                    className="w-8 h-8 p-0 border border-slate-300 rounded bg-white"
                                    value={element.color || '#333333'}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setCanvasElements((prev) =>
                                        prev.map((el) => (el.id === element.id ? { ...el, color: v } : el))
                                        );
                                    }}
                                    />
                                </div>
                                {/* Background color */}
                                <div className="flex items-center space-x-2">
                                  <label className="text-xs text-slate-600">Fondo</label>
                                  <input
                                    type="color"
                                    className="w-8 h-8 p-0 border border-slate-300 rounded bg-white"
                                    disabled={element.backgroundColor === 'transparent'}
                                    value={element.backgroundColor && element.backgroundColor !== 'transparent' ? element.backgroundColor : '#ffffff'}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setCanvasElements((prev) =>
                                        prev.map((el) =>
                                          el.id === element.id ? { ...el, backgroundColor: v } : el
                                        )
                                      );
                                    }}
                                  />
                                  <label className="text-xs text-slate-600 flex items-center space-x-1">
                                    <input
                                      type="checkbox"
                                      checked={element.backgroundColor === 'transparent'}
                                      onChange={(e) => {
                                        const transparent = e.target.checked;
                                        setCanvasElements((prev) =>
                                          prev.map((el) =>
                                            el.id === element.id
                                              ? { ...el, backgroundColor: transparent ? 'transparent' : (el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : '#ffffff') }
                                              : el
                                          )
                                        );
                                      }}
                                    />
                                    <span>Transparente</span>
                                  </label>
                                </div>
                                {/* Border width */}
                                <div className="flex items-center space-x-1">
                                  <label className="text-xs text-slate-600">Borde</label>
                                  <input
                                    type="number"
                                    className="w-16 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                    min={0}
                                    max={20}
                                    step={1}
                                    value={Number(element.borderWidth ?? 0)}
                                    onChange={(e) => {
                                      const v = Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0));
                                      setCanvasElements((prev) =>
                                        prev.map((el) => (el.id === element.id ? { ...el, borderWidth: v } : el))
                                        );
                                    }}
                                    />
                                  <input
                                    type="color"
                                    className="w-8 h-8 p-0 border border-slate-300 rounded bg-white"
                                    value={element.borderColor || '#e2e8f0'}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setCanvasElements((prev) =>
                                        prev.map((el) => (el.id === element.id ? { ...el, borderColor: v } : el))
                                        );
                                    }}
                                    />
                                  <select
                                    className="border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                    value={element.borderStyle || 'solid'}
                                    onChange={(e) => {
                                      const v = e.target.value as 'solid' | 'dashed';
                                      setCanvasElements((prev) =>
                                        prev.map((el) => (el.id === element.id ? { ...el, borderStyle: v } : el))
                                        );
                                    }}
                                    >
                                    <option value="solid">Continua</option>
                                    <option value="dashed">Discontinua</option>
                                  </select>
                                </div>
                                {/* Corners (text) dropdown opening downward */}
                                <div className="relative">
                                  <button
                                    className="px-2 py-1 text-sm rounded border border-slate-300 bg-white text-black"
                                    onClick={() => setShowCornersOptions((v) => !v)}
                                  >
                                    Esquinas ▾
                                  </button>
                                  {showCornersOptions && (
                                    <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-40 flex items-center space-x-2">
                                      <label className="text-xs text-slate-600">0–100%</label>
                                      <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={1}
                                        value={Number(element.borderRadius ?? 0)}
                                        onChange={(e) => {
                                          const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                          setCanvasElements((prev) =>
                                            prev.map((el) => (el.id === element.id ? { ...el, borderRadius: v } : el))
                                          );
                                        }}
                                      />
                                      <input
                                        type="number"
                                        className="w-16 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
                                        min={0}
                                        max={100}
                                        step={1}
                                        value={Number(element.borderRadius ?? 0)}
                                        onChange={(e) => {
                                          const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                          setCanvasElements((prev) =>
                                            prev.map((el) => (el.id === element.id ? { ...el, borderRadius: v } : el))
                                          );
                                        }}
                                      />
                                      <span className="text-xs text-slate-500">%</span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  className={`px-2 py-1 text-sm rounded border ${
                                    element.fontWeight === 'bold' ? 'bg-slate-200 border-slate-300' : 'border-slate-300'
                                  }`}
                                  onClick={() => {
                                    setCanvasElements((prev) =>
                                      prev.map((el) =>
                                        el.id === element.id
                                          ? { ...el, fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' }
                                          : el
                                      )
                                    );
                                  }}
                                >
                                  B
                                </button>
                                <button
                                  className={`px-2 py-1 text-sm rounded border ${
                                    element.fontStyle === 'italic' ? 'bg-slate-200 border-slate-300' : 'border-slate-300'
                                  }`}
                                  onClick={() => {
                                    setCanvasElements((prev) =>
                                      prev.map((el) =>
                                        el.id === element.id
                                          ? { ...el, fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' }
                                          : el
                                      )
                                    );
                                  }}
                                >
                                  I
                                </button>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Canvas Corner Indicators */}
            <div className="absolute top-4 left-4 w-3 h-3 border-l-2 border-t-2 border-slate-300 opacity-50"></div>
            <div className="absolute top-4 right-4 w-3 h-3 border-r-2 border-t-2 border-slate-300 opacity-50"></div>
            <div className="absolute bottom-4 left-4 w-3 h-3 border-l-2 border-b-2 border-slate-300 opacity-50"></div>
            <div className="absolute bottom-4 right-4 w-3 h-3 border-r-2 border-b-2 border-slate-300 opacity-50"></div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-6 text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span>{canvasSize.w} × {canvasSize.h}</span>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={25}
                max={400}
                step={5}
                value={Math.round(zoom * 100)}
                onChange={(e) => setZoom(clampZoom(Number((e.target as HTMLInputElement).value) / 100))}
                className="w-28 cursor-pointer"
              />
              <span>{Math.round(zoom * 100)}%</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span>Elementos: {canvasElements.length}</span>
            <span>•</span>
            <span>Diapositiva 1 de 1</span>
          </div>
        </div>
      </div>
      {/* Background settings panel (top, when clicking background) */}
      {showBackgroundPanel && (
        <div
          className="fixed bg-white text-black border border-slate-200 rounded-md shadow-lg p-3 z-30 flex items-center space-x-3"
          style={{ top: `${imagePanelPos.top}px`, left: `${imagePanelPos.left}px`, transform: 'translate(-50%, 0%)' }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-600">Color</label>
            <input
              type="color"
              className="w-8 h-8 p-0 border border-slate-300 rounded bg-white"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </div>
          {/* Transparencia */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-600">Transparencia</label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={backgroundOpacity}
              onChange={(e) => setBackgroundOpacity(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))}
            />
            <input
              type="number"
              className="w-16 border border-slate-300 rounded px-2 py-1 text-sm bg-white text-black"
              min={0}
              max={100}
              step={1}
              value={backgroundOpacity}
              onChange={(e) => setBackgroundOpacity(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))}
            />
            <span className="text-xs text-slate-500">%</span>
          </div>
          <button
            className="px-2 py-1 text-sm rounded border border-slate-300 bg-white text-black"
            onClick={() => setShowBackgroundPanel(false)}
          >
            Cerrar
          </button>
        </div>
      )}
      {/* Marquee selection overlay */}
      {marquee.active && (
        <div
          className="fixed pointer-events-none border-2 border-blue-400/60 bg-blue-200/10 z-40"
          style={{
            left: `${Math.min(marquee.startX, marquee.currentX)}px`,
            top: `${Math.min(marquee.startY, marquee.currentY)}px`,
            width: `${Math.abs(marquee.currentX - marquee.startX)}px`,
            height: `${Math.abs(marquee.currentY - marquee.startY)}px`,
          }}
        />
      )}
      {/* Alignment guides overlay */}
      {guideOverlay.bounds && (
        <>
          {guideOverlay.v.map((x, i) => (
            <div
              key={`gv-${i}`}
              className="fixed pointer-events-none z-50"
              style={{ left: `${x}px`, top: `${guideOverlay.bounds.top}px`, width: '2px', height: `${guideOverlay.bounds.height}px`, background: 'rgba(244,63,94,0.9)' }}
            />
          ))}
          {guideOverlay.h.map((y, i) => (
            <div
              key={`gh-${i}`}
              className="fixed pointer-events-none z-50"
              style={{ top: `${y}px`, left: `${guideOverlay.bounds.left}px`, height: '2px', width: `${guideOverlay.bounds.width}px`, background: 'rgba(244,63,94,0.9)' }}
            />
          ))}
        </>
      )}
      {/* Presentation overlay */}
      {presenting.active && (
        <div
          className="fixed inset-0"
          style={{ backgroundColor: hexToRgba(backgroundColor, backgroundOpacity), zIndex: 9999 }}
        >
          <button
            onClick={handleExitPresent}
            className="absolute top-4 right-4 px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 shadow"
          >
            Salir
          </button>
          <div className="w-full h-full flex items-center justify-center">
            <div style={{ width: `${presenting.cw * presenting.scale}px`, height: `${presenting.ch * presenting.scale}px` }}>
              <div
                className="relative"
                style={{ width: `${presenting.cw}px`, height: `${presenting.ch}px`, transform: `scale(${presenting.scale})`, transformOrigin: 'top left' }}
              >
                {canvasElements.map((element, idx) => (
                  <div
                    key={element.id}
                    className="absolute"
                    style={{ left: element.x, top: element.y, width: element.width, height: element.height, zIndex: 20 + idx }}
                  >
                    {element.type === 'text' ? (
                      <div
                        className="w-full h-full px-3 py-2 rounded-lg border flex items-center justify-center overflow-hidden"
                        style={{
                          fontFamily: element.fontFamily,
                          fontWeight: element.fontWeight,
                          fontStyle: element.fontStyle,
                          fontSize: element.fontSize,
                          color: element.color,
                          borderRadius: `${element.borderRadius ?? 0}%`,
                          borderWidth: (element.borderWidth ?? 0) + 'px',
                          borderColor: element.borderColor ?? '#e2e8f0',
                          borderStyle: element.borderStyle ?? 'solid',
                          backgroundColor: element.backgroundColor ?? 'transparent',
                        }}
                      >
                        <div className="w-full whitespace-pre-wrap" title={element.content} style={{ color: element.color, textAlign: (element.textAlign as any) || 'center' }}>
                          {element.content}
                        </div>
                      </div>
                    ) : element.type === 'image' ? (
                      <div
                        className="w-full h-full shadow-md relative"
                        style={{
                          borderRadius: `${element.borderRadius ?? 0}%`,
                          borderWidth: (element.borderWidth ?? 0) + 'px',
                          borderColor: element.borderColor ?? '#e2e8f0',
                          borderStyle: element.borderStyle ?? 'solid',
                          backgroundColor: element.backgroundColor ?? 'transparent',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={element.src}
                          alt="Canvas element"
                          className="block absolute"
                          style={{
                            left: `${element.imgOffsetX ?? 0}px`,
                            top: `${element.imgOffsetY ?? 0}px`,
                            transform: `scale(${element.imgScale ?? 1})`,
                            transformOrigin: 'top left',
                            filter: `brightness(${element.brightness ?? 100}%) contrast(${element.contrast ?? 100}%) saturate(${element.saturate ?? 100}%) hue-rotate(${element.hueRotate ?? 0}deg) grayscale(${element.grayscale ?? 0}%) sepia(${element.sepia ?? 0}%) blur(${element.blur ?? 0}px)`,
                            opacity: Math.max(0, Math.min(100, element.opacity ?? 100)) / 100,
                          }}
                          draggable={false}
                        />
                      </div>
                    ) : element.type === 'shape' ? (
                      <div className="w-full h-full" style={{ position: 'relative' }}>
                        {element.shapeKind === 'rectangle' || element.shapeKind === 'square' ? (
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundColor: element.backgroundColor || '#60a5fa',
                              borderRadius: element.shapeKind === 'rectangle' ? `${element.borderRadius ?? 0}%` : '0%'
                            }}
                          />
                        ) : element.shapeKind === 'circle' ? (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: element.backgroundColor || '#60a5fa', borderRadius: '50%' }}
                          />
                        ) : (
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            {element.shapeKind === 'triangle' ? (
                              <polygon
                                points="50,10 90,90 10,90"
                                fill={element.backgroundColor || '#60a5fa'}
                                stroke={element.borderColor || 'transparent'}
                                strokeWidth={element.borderWidth || 0}
                                strokeDasharray={element.borderStyle === 'dashed' ? '6 4' : undefined}
                              />
                            ) : (
                              <path
                                d="M20 40 H60 V30 L85 50 L60 70 V60 H20 Z"
                                fill={element.backgroundColor || '#60a5fa'}
                                stroke={element.borderColor || 'transparent'}
                                strokeWidth={element.borderWidth || 0}
                                strokeDasharray={element.borderStyle === 'dashed' ? '6 4' : undefined}
                              />
                            )}
                          </svg>
                        )}
                        {(element.shapeKind === 'rectangle' || element.shapeKind === 'square' || element.shapeKind === 'circle') && (
                          <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                              border: `${element.borderWidth ?? 0}px ${element.borderStyle ?? 'solid'} ${element.borderColor ?? 'transparent'}`,
                              borderRadius: element.shapeKind === 'circle' ? '50%' : element.shapeKind === 'rectangle' ? `${element.borderRadius ?? 0}%` : '0%'
                            }}
                          />
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
