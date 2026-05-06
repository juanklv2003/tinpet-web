import { Heart, Mail, PawPrint } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand">
                <PawPrint className="h-4.5 w-4.5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                <span className="text-brand">tin</span>pet
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              La plataforma profesional que conecta refugios, adoptantes y veterinarias para dar un hogar a cada animal.
            </p>
            <a
              href="mailto:hola@tinpet.es"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              <Mail className="h-4 w-4 text-brand" aria-hidden="true" />
              hola@tinpet.es
            </a>
          </div>

          {/* Plataforma */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Plataforma</p>
            <ul className="space-y-2.5 text-sm">
              {['Refugios', 'Adoptantes', 'Veterinarias', 'Panel de administración'].map(link => (
                <li key={link}>
                  <a href="#" className="hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Legal</p>
            <ul className="space-y-2.5 text-sm">
              {['Privacidad', 'Términos de uso', 'Cookies'].map(link => (
                <li key={link}>
                  <a href="#" className="hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-600">
          <p>© {new Date().getFullYear()} TinPet. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            Desarrollado con{' '}
            <Heart className="h-3 w-3 text-brand fill-[color:var(--tp-pink)]" aria-hidden="true" />{' '}
            para el bienestar animal
          </p>
        </div>
      </div>
    </footer>
  );
}
