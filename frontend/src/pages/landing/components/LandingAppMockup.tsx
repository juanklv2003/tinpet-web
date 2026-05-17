import { Heart, MessageSquare, User, Star, X, PawPrint, Download } from 'lucide-react';
import tinpetLogo from '../../../assets/tinpetLogo (2).ico';

export function LandingAppMockup() {
  return (
    <section id="app" className="scroll-mt-24 py-20 w-full relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-16">
        
        {/* Texto Explicativo */}
        <div className="flex-1 text-center md:text-left order-2 md:order-1">
          <span className="text-brand font-bold uppercase tracking-widest text-sm block mb-2">Nueva Experiencia</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-6">La adopción literal en la palma de tu mano</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-lg">
            Descarga nuestra app oficial. Explora perfiles deslizando a la derecha si sientes una conexión, o chatea en tiempo real directamente con los refugios y veterinarias locales.
          </p>
          
          <ul className="space-y-6 mb-10 text-left max-w-md mx-auto md:mx-0">
            <li className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand shrink-0 mr-4">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Sistema de Match</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Desliza para conectar con perfiles afines a tu estilo de vida.</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-brand-cream dark:bg-amber-900/30 flex items-center justify-center text-[#d28f69] dark:text-orange-400 shrink-0 mr-4">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Chat Directo</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Comunícate al instante con los cuidadores para organizar visitas.</p>
              </div>
            </li>
          </ul>

          <div className="flex items-center justify-center md:justify-start space-x-4">
            <button
              type="button"
              className="px-5 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold shadow-md shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              <span>Descargar APK</span>
            </button>
          </div>
        </div>

        {/* Mockup Interactivo del Teléfono (Tilted) */}
        <div className="flex-1 flex justify-center order-1 md:order-2">
          <div className="relative w-[320px] h-[650px] bg-white rounded-[3rem] shadow-2xl border border-stone-200/60 rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden flex flex-col">
            
            {/* Header de la App (Logotipo y Contador) */}
            <div className="px-5 pt-10 pb-2 flex justify-between items-center bg-white z-10">
              <div className="flex items-center text-brand font-black text-xl space-x-2">
                <img src={tinpetLogo} alt="Tinpet Logo" className="h-6 w-6 object-contain" />
                <span>TinPet</span>
              </div>
              <span className="text-slate-400 font-medium text-sm">1 / 1</span>
            </div>
            
            {/* Tarjeta de Mascota en la App */}
            <div className="flex-1 relative mx-4 mt-2 mb-2 rounded-2xl overflow-hidden shadow-sm group bg-slate-100">
              {/* Foto de Rex */}
              <img
                src="https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=400"
                alt="Boby el perro"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Botón de perfil superior derecho */}
              <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 shadow-sm z-20 hover:scale-105 transition-transform cursor-pointer">
                <User className="h-4 w-4" />
              </div>

              {/* Gradiente inferior oscuro */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              
              {/* Información de la mascota */}
              <div className="absolute bottom-0 inset-x-0 p-5 text-white z-10 text-left">
                <h3 className="text-3xl font-bold mb-1">Rex</h3>
                <p className="text-sm opacity-90 font-medium flex items-center gap-1.5">
                  <PawPrint className="h-3.5 w-3.5 fill-current" />
                  <span>1 año • Perro</span>
                </p>
                <p className="text-sm opacity-80 font-medium mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cream"></span>
                  <span>veterinaria carlos</span>
                </p>
              </div>
            </div>

            {/* Botones de Acción (Like/Dislike - 2 botones) */}
            <div className="h-20 bg-white flex items-center justify-center space-x-6 pb-2 z-10">
              <button className="w-14 h-14 rounded-full bg-white border border-slate-200 text-[#ff4b4b] flex items-center justify-center shadow-sm hover:bg-red-50 hover:scale-105 active:scale-95 transition-all">
                <X className="h-6 w-6 stroke-[3]" />
              </button>
              <button className="w-14 h-14 rounded-full bg-white border border-slate-200 text-[#4ade80] flex items-center justify-center shadow-sm hover:bg-green-50 hover:scale-105 active:scale-95 transition-all">
                <Heart className="h-6 w-6 fill-current" />
              </button>
            </div>

            {/* Navbar Inferior Rosa */}
            <div className="h-[72px] bg-brand flex justify-around items-center text-white px-2 relative z-20">
              
              {/* Botón activo (huella) con reborde circular */}
              <div className="relative w-12 flex justify-center items-center">
                <div className="absolute -top-10 w-16 h-16 bg-white rounded-full flex justify-center items-center shadow-md">
                  <div className="w-[52px] h-[52px] bg-brand rounded-full flex justify-center items-center shadow-inner">
                    <PawPrint className="h-5 w-5 fill-current" />
                  </div>
                </div>
              </div>

              {/* Otros iconos */}
              <Heart className="h-5 w-5 stroke-[2] hover:text-pink-200 cursor-pointer transition-colors" />
              <Star className="h-5 w-5 stroke-[2] hover:text-pink-200 cursor-pointer transition-colors" />
              <MessageSquare className="h-5 w-5 stroke-[2] hover:text-pink-200 cursor-pointer transition-colors" />
              <User className="h-5 w-5 stroke-[2] hover:text-pink-200 cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
