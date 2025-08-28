import React, { useState, useEffect } from 'react';
import { Menu, X, Play, Users, BarChart3, BookOpen, Briefcase, Monitor } from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const useCases = [
    {
      id: 1,
      title: "Educación Interactiva",
      description: "Estudiantes creando presentaciones dinámicas para proyectos académicos",
      image: "https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
      icon: <BookOpen className="w-6 h-6" />,
      category: "Educación"
    },
    {
      id: 2,
      title: "Presentaciones Corporativas",
      description: "Profesionales presentando resultados y estrategias empresariales",
      image: "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
      icon: <Briefcase className="w-6 h-6" />,
      category: "Negocios"
    },
    {
      id: 3,
      title: "Análisis de Datos",
      description: "Visualización de estadísticas y métricas de rendimiento",
      image: "https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
      icon: <BarChart3 className="w-6 h-6" />,
      category: "Analytics"
    },
    {
      id: 4,
      title: "Conferencias Virtuales",
      description: "Presentaciones remotas para equipos distribuidos globalmente",
      image: "https://images.pexels.com/photos/4491461/pexels-photo-4491461.jpeg?auto=compress&cs=tinysrgb&w=500&h=350&fit=crop",
      icon: <Monitor className="w-6 h-6" />,
      category: "Remote"
    }
  ];

  const navigationItems = [
    { name: 'Inicio', href: '#home' },
    { name: 'Plantillas', href: '#templates' },
    { name: 'Contacto', href: '#contact' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-current ml-0.5" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                Clipo
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 font-medium"
                >
                  {item.name}
                </a>
              ))}
            </div>

            {/* User Account */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-slate-300 hover:text-blue-400 transition-colors duration-200 font-medium">
                Iniciar Sesión
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                Registrarse
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="py-4 space-y-2 border-t border-slate-800/50 bg-slate-900/95">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-2 text-slate-300 hover:text-blue-400 hover:bg-slate-800/50 rounded-lg transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="px-4 pt-4 border-t border-slate-800/50 space-y-2">
                <button className="w-full text-left py-2 text-slate-300 hover:text-blue-400 transition-colors duration-200">
                  Iniciar Sesión
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors duration-200">
                  Registrarse
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Clipo: anima lo que
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">
              importa, cuando quieras
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Crea presentaciones interactivas y profesionales que cautiven a tu audiencia. 
            Perfecto para estudiantes, profesionales y empresas que buscan impactar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 min-w-[200px]">
              <span className="flex items-center justify-center space-x-2">
                <Play className="w-5 h-5 fill-current" />
                <span>Presenta ahora</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                Ideas vivas, público atento
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
              Descubre cómo Clipo transforma la manera en que comunicas ideas, desde el aula hasta la sala de juntas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {useCases.map((useCase, index) => (
              <div
                key={useCase.id}
                className="group bg-slate-800/50 rounded-2xl overflow-hidden hover:bg-slate-800/70 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 border border-slate-700/50 hover:border-blue-500/30"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={useCase.image}
                    alt={useCase.title}
                    className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <div className="w-10 h-10 bg-blue-600/90 rounded-lg flex items-center justify-center text-white backdrop-blur-sm">
                      {useCase.icon}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-slate-900/70 text-slate-300 text-xs font-medium rounded-full backdrop-blur-sm border border-slate-700/50">
                      {useCase.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-blue-400 transition-colors duration-300">
                    {useCase.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="group inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200">
              <span>Ver más casos de uso</span>
              <Users className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            <div className="group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                10K+
              </div>
              <div className="text-slate-400 font-medium">Usuarios Activos</div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                50K+
              </div>
              <div className="text-slate-400 font-medium">Presentaciones Creadas</div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                95%
              </div>
              <div className="text-slate-400 font-medium">Satisfacción del Usuario</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-current ml-0.5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                Clipo
              </span>
            </div>
            
            <div className="text-slate-400 text-sm">
              © 2025 Clipo. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;