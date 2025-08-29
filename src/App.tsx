import React, { useState } from 'react';
import { Type, Image, Upload, MousePointer, Square, Circle, Minus } from 'lucide-react';

function App() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [canvasElements, setCanvasElements] = useState<any[]>([]);

  const handleAddText = () => {
    const newText = {
      id: Date.now(),
      type: 'text',
      content: 'Haz clic para editar',
      x: 300,
      y: 200,
      fontSize: 24,
      color: '#333333'
    };
    setCanvasElements([...canvasElements, newText]);
    setSelectedTool('text');
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
          const newImage = {
            id: Date.now(),
            type: 'image',
            src: event.target?.result,
            x: 250,
            y: 150,
            width: 200,
            height: 150
          };
          setCanvasElements([...canvasElements, newImage]);
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
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
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
            <div className="relative w-full h-full p-8">
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
                      className="absolute cursor-move hover:shadow-lg transition-shadow duration-200"
                      style={{
                        left: element.x,
                        top: element.y,
                        fontSize: element.fontSize,
                        color: element.color
                      }}
                    >
                      {element.type === 'text' ? (
                        <div className="bg-white/90 px-3 py-2 rounded-lg border border-slate-200 backdrop-blur-sm">
                          {element.content}
                        </div>
                      ) : element.type === 'image' ? (
                        <img
                          src={element.src}
                          alt="Canvas element"
                          className="rounded-lg shadow-md border border-slate-200"
                          style={{
                            width: element.width,
                            height: element.height
                          }}
                        />
                      ) : null}
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