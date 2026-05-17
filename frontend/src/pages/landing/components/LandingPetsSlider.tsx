const petsData = [
  { id: 1, name: "Coco", age: "1 año", gender: "Macho", size: "Mediano", img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=500", badge: "Juguetón" },
  { id: 2, name: "Luna", age: "2 años", gender: "Hembra", size: "Pequeño", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=500", badge: "Tranquila" },
  { id: 3, name: "Toby", age: "3 meses", gender: "Macho", size: "Pequeño", img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=500", badge: "Cachorro" },
  { id: 4, name: "Oliver", age: "8 meses", gender: "Macho", size: "Pequeño", img: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=500", badge: "Explorador" },
  { id: 5, name: "Copito", age: "6 meses", gender: "Macho", size: "Pequeño", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=500", badge: "Dócil" },
  { id: 6, name: "Mila", age: "4 años", gender: "Hembra", size: "Grande", img: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=500", badge: "Protectora" }
];

// Generar una lista repetida para asegurar un scroll continuo infinito fluido
const repeatedPets = [...petsData, ...petsData, ...petsData, ...petsData, ...petsData];

export function LandingPetsSlider() {
  return (
    <section id="buscar" className="scroll-mt-24 py-16 overflow-hidden w-full relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4 transition-colors duration-300">
            ¿Quién será tu próximo compañero de siestas?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
            Observa a nuestros peluditos pasar. ¿Sientes que hubo conexión? Búscalo en nuestra App.
          </p>
        </div>
      </div>

      <div className="relative w-full flex overflow-hidden group">
        {/* Máscaras de difuminado a los lados */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-[#fdfaf8] dark:from-dark-bg to-transparent z-10 pointer-events-none transition-colors duration-500"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-[#fdfaf8] dark:from-dark-bg to-transparent z-10 pointer-events-none transition-colors duration-500"></div>
        
        {/* Pista del slider animado */}
        <div className="flex gap-6 animate-scroll pause-on-hover px-4 py-6 w-max">
          {repeatedPets.map((pet, idx) => (
            <div
              key={`${pet.id}-${idx}`}
              className="w-64 sm:w-72 shrink-0 bg-white dark:bg-dark-card rounded-[32px] overflow-hidden shadow-sm border border-stone-200/60 dark:border-slate-800 flex flex-col group hover:shadow-md transition-all duration-300"
            >
              <div className="relative overflow-hidden h-48 bg-stone-100 dark:bg-slate-800">
                <img
                  src={pet.img}
                  alt={pet.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-4 left-4 bg-brand-cream text-[#d28f69] dark:text-orange-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  {pet.badge}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">{pet.name}</h3>
                  <span className="bg-brand/10 dark:bg-brand/20 text-brand dark:text-pink-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    {pet.age}
                  </span>
                </div>
                <div className="flex space-x-2 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  <span>{pet.gender}</span>
                  <span>•</span>
                  <span>{pet.size}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
