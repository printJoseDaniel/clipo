import { useEffect, useState } from 'react';
import { Type, Image, Upload, MousePointer, Square, Circle, Minus } from 'lucide-react';

function App() {
  type CanvasElement = {
    id: number;
    type: 'text' | 'image';
    content?: string;
    src?: string;
    x: number;
    y: number;
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    width: number;
    height: number;
  };

  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const [showEffectDropdown, setShowEffectDropdown] = useState<boolean>(false);
  const [editingTextId, setEditingTextId] = useState<number | null>(null);
  
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
    resizeCorner?: 'nw' | 'ne' | 'sw' | 'se' | null;
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

  // Borrar elemento seleccionado con la tecla Supr (Delete)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedElementId !== null && editingTextId === null) {
        e.preventDefault();
        setCanvasElements((prev) => prev.filter((el) => el.id !== selectedElementId));
        setSelectedElementId(null);
        setShowEffectDropdown(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedElementId, editingTextId]);
  
  const handleAddText = () => {
    const newText: CanvasElement = {
      id: Date.now(),
      type: 'text',
      content: 'Haz doble clic para editar',
      x: 300,
      y: 200,
      fontSize: 24,
      color: '#333333',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      width: 200,
      height: 60,
    };
    setCanvasElements((prev) => [...prev, newText]);
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
            const newImage: CanvasElement = {
              id: Date.now(),
              type: 'image',
              src: result,
              x: 250,
              y: 150,
              width: 200,
              height: 150,
            };
            setCanvasElements((prev) => [...prev, newImage]);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden">
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
              <Image className="w-5 h-5" />
              <span>Subir una imagen</span>
            </button>
          </div>

          {/* Additional Tools */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Herramientas</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors duration-200 flex items-center justify-center">
                <MousePointer className="w-4 h-4 text-slate-600" />
              </button>
              <button className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors duration-200 flex items-center justify-center">
                <Square className="w-4 h-4 text-slate-600" />
              </button>
              <button className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors duration-200 flex items-center justify-center">
                <Circle className="w-4 h-4 text-slate-600" />
              </button>
              <button className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors duration-200 flex items-center justify-center">
                <Minus className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-auto space-y-3">
            <button className="w-full bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg border border-slate-200 font-medium transition-colors duration-200">
              Guardar Proyecto
            </button>
            <button className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 h-full bg-white relative overflow-hidden">
        {/* Top Toolbar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-slate-800">Presentación sin título</h1>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Guardado automáticamente</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200">
              Vista previa
            </button>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200">
              Presentar
            </button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100"
        onMouseMove={(e) => {
          // Solo mover/redimensionar mientras el botón izquierdo está presionado
          if ((e.buttons & 1) !== 1) return;

          if (action.type === 'moving' && action.elementId) {
            const newX = e.clientX - action.initialX;
            const newY = e.clientY - action.initialY;

            setCanvasElements((prev) =>
              prev.map((el) => (el.id === action.elementId ? { ...el, x: newX, y: newY } : el))
            );
          } else if (action.type === 'resizing' && action.elementId && action.resizeCorner) {
            const deltaX = e.clientX - action.initialX;
            const deltaY = e.clientY - action.initialY;
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
            }

            // Apply min size and optional proportional scaling (Alt)
            const aspect = action.initialHeight > 0 ? action.initialWidth / action.initialHeight : 1;
            let newWidth = Math.max(minSize, rawWidth);
            let newHeight = Math.max(minSize, rawHeight);

            if (e.altKey) {
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
            }

            setCanvasElements((prev) =>
              prev.map((el) =>
                el.id === action.elementId
                  ? { ...el, x: newLeft, y: newTop, width: newWidth, height: newHeight }
                  : el
              )
            );
          }
        }}
        onMouseUp={() => {
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
          <div className="relative w-[60%] h-[70%] bg-white rounded-2xl shadow-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-all duration-300 cursor-pointer group overflow-hidden">
            {/* Canvas Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }}></div>
            </div>

            {/* Canvas Content */}
            <div className="relative w-full h-full p-8" onClick={() => setSelectedElementId(null)}>
              {canvasElements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    Haz clic para cambiar el color de fondo
                  </h3>
                  <p className="text-slate-500 mb-1">o subir una imagen</p>
                  <p className="text-sm text-slate-400">
                    Usa las herramientas de la izquierda para añadir contenido
                  </p>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {canvasElements.map((element) => (
                    <div
                      key={element.id}
                      className="absolute cursor-move hover:shadow-lg transition-shadow duration-200 relative"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        // Si estamos editando texto (o doble clic), no impedir el foco ni iniciar movimiento
                        if (editingTextId === element.id || e.detail >= 2) return;
                        // Prevenir selección de texto/imagen cuando sí vamos a mover
                        e.preventDefault();
                        setAction({
                          type: 'moving',
                          elementId: element.id,
                          initialX: e.clientX - element.x,
                          initialY: e.clientY - element.y,
                          initialWidth: element.width || 0,
                          initialHeight: element.height || 0,
                        });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(element.id);
                        setShowEffectDropdown(false);
                      }}
                      onDoubleClick={(e) => {
                        if (element.type === 'text') {
                          e.stopPropagation();
                          setSelectedElementId(element.id);
                          setEditingTextId(element.id);
                        }
                      }}
                      style={{
                        left: element.x,
                        top: element.y,
                        fontSize: element.fontSize,
                        color: element.color,
                        width: element.width,
                        height: element.height,
                      }}
                    >
                      {element.type === 'text' ? (
                        <div
                          className="bg-white/90 w-full h-full px-3 py-2 rounded-lg border border-slate-200 backdrop-blur-sm flex items-center justify-center overflow-hidden"
                          style={{
                            fontFamily: element.fontFamily,
                            fontWeight: element.fontWeight,
                            fontStyle: element.fontStyle,
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
                              className="outline-none w-full text-center"
                              style={{
                                fontFamily: element.fontFamily,
                                fontWeight: element.fontWeight,
                                fontStyle: element.fontStyle,
                                fontSize: element.fontSize,
                                color: element.color,
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
                            <span className="truncate w-full text-center" title={element.content}>
                              {element.content}
                            </span>
                          )}
                        </div>
                      ) : element.type === 'image' ? (
                        <img
                          src={element.src}
                          alt="Canvas element"
                          className="rounded-lg shadow-md border border-slate-200 w-full h-full"
                          draggable={false}
                        />
                      ) : null}

                      {selectedElementId === element.id && (
                        <>
                          {/* Esquinas de redimensionado */}
                          <div
                            className="absolute -right-2 -bottom-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-se-resize"
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
                            className="absolute -left-2 -top-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize"
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
                            className="absolute -right-2 -top-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize"
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
                            className="absolute -left-2 -bottom-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize"
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
                          <div className="relative">
                            <button
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm shadow-md transition-colors duration-200"
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0%',
                                marginTop: '10px',
                              }}
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
                                style={{
                                  top: 'calc(100% + 50px)',
                                  left: '0%',
                                  minWidth: '180px',
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                                  onClick={() => {
                                    console.log('Applying fade animation to element:', element.id);
                                    setShowEffectDropdown(false);
                                  }}
                                >
                                  🎭 Animación de entrada
                                </button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                                  onClick={() => {
                                    console.log('Applying transition to element:', element.id);
                                    setShowEffectDropdown(false);
                                  }}
                                >
                                  ⚡ Transición
                                </button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                                  onClick={() => {
                                    console.log('Applying filter to element:', element.id);
                                    setShowEffectDropdown(false);
                                  }}
                                >
                                  🎨 Filtro visual
                                </button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                                  onClick={() => {
                                    console.log('Applying shadow to element:', element.id);
                                    setShowEffectDropdown(false);
                                  }}
                                >
                                  💫 Sombra
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
                            {element.type === 'text' && (
                              <div
                                className="absolute bg-white border border-slate-200 rounded-md shadow-lg p-3 z-10 flex items-center space-x-2"
                                style={{
                                  top: 'calc(100% + 10px)',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <select
                                  className="border border-slate-300 rounded px-2 py-1 text-sm"
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
                                    className="w-20 border border-slate-300 rounded px-2 py-1 text-sm"
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
                          </div>
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
            <span>Zoom: 100%</span>
            <span>•</span>
            <span>1920 × 1080</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Elementos: {canvasElements.length}</span>
            <span>•</span>
            <span>Diapositiva 1 de 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
