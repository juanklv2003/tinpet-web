import { Heart, Mail, PawPrint } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 dark:bg-black py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-between border-b border-slate-800 pb-12">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">tinpet</span>
          </div>

          {/* Contact */}
          <div className="flex flex-col md:items-end gap-2 text-sm font-medium">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
              Contacto
            </p>
            <a href="mailto:hola@tinpet.es" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="h-4 w-4 text-pink-500" />
              hola@tinpet.es
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} TinPet. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            Desarrollado con <Heart className="h-3 w-3 text-pink-500 fill-pink-500" /> para el bienestar animal
          </p>
        </div>
      </div>
    </footer>
  );
}
