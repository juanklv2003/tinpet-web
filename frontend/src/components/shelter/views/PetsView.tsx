import { useState } from 'react';
import { IconPlus, IconTrash } from '../Icons';
import { fmtDate, statusBadgeColor, statusDotColor, statusLabel } from '../helpers';
import type { Pet, PetStatus } from '../../../types';
import type { PetsSort } from '../types';
import { Cat, Dog, PawPrint, Search } from 'lucide-react';

interface PetsViewProps {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  onDeletePet: (petId: string) => void;
  onSelectPet: (pet: Pet) => void;
  onOpenAddModal: () => void;
}

const speciesIcon = (species: string) => {
  const normalizedSpecies = species.trim().toLowerCase();

  if (normalizedSpecies.includes('dog') || normalizedSpecies.includes('perro')) {
    return <Dog className="w-4 h-4 text-amber-600 dark:text-amber-300" />;
  }

  if (normalizedSpecies.includes('cat') || normalizedSpecies.includes('gato')) {
    return <Cat className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />;
  }

  return <PawPrint className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
};

export function PetsView({
  pets,
  loading,
  error,
  onDeletePet,
  onSelectPet,
  onOpenAddModal,
}: PetsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PetStatus>('all');
  const [sortBy, setSortBy] = useState<PetsSort>('newest');

  const filteredPets = [...pets]
    .filter(pet => {
      if (statusFilter === 'all') return true;
      return pet.status === statusFilter;
    })
    .filter(pet => {
      const needle = searchTerm.trim().toLowerCase();
      if (!needle) return true;
      const haystack = [pet.name, pet.species, pet.ai_profile?.breed]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    })
    .sort((a, b) => {
      if (sortBy === 'name')
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (sortBy === 'oldest') return aTime - bTime;
      return bTime - aTime;
    });

  const exportPetsCsv = () => {
    if (filteredPets.length === 0) return;

    const escapeCsv = (value: unknown) => {
      const v = value == null ? '' : String(value);
      const escaped = v.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const header = ['Nombre', 'Especie', 'Raza', 'Estado', 'Fecha alta'];
    const rows = filteredPets.map(pet => [
      pet.name,
      pet.species,
      pet.ai_profile?.breed ?? '',
      statusLabel[pet.status],
      fmtDate(pet.created_at) ?? '',
    ]);

    const csv = [header, ...rows]
      .map(row => row.map(escapeCsv).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `tinpet-mascotas-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 lg:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, especie o raza"
            className="md:col-span-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white px-3 py-2 outline-none focus:border-gray-400"
          />

          <select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as 'all' | PetStatus)
            }
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white px-3 py-2 outline-none focus:border-gray-400"
          >
            <option value="all">Todos los estados</option>
            <option value="available">Disponible</option>
            <option value="pending">Pendiente</option>
            <option value="adopted">Adoptado</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as PetsSort)}
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white px-3 py-2 outline-none focus:border-gray-400"
          >
            <option value="newest">Mas recientes primero</option>
            <option value="oldest">Mas antiguas primero</option>
            <option value="name">Orden alfabetico</option>
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Mostrando {filteredPets.length} de {pets.length} mascota
            {pets.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={exportPetsCsv}
            disabled={filteredPets.length === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
          Cargando...
        </div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm gap-3">
          <PawPrint className="w-9 h-9 text-gray-500 dark:text-gray-400" />
          <p>No tienes mascotas registradas aún.</p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            <IconPlus /> Añadir la primera
          </button>
        </div>
      ) : filteredPets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm gap-2">
          <Search className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          <p>No hay resultados con los filtros actuales.</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setSortBy('newest');
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        /* Table for desktop, cards for mobile */
        <div className="hidden lg:block rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {['Animal', 'Especie / Raza', 'Estado', 'Alta', 'Acciones'].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                        i === 4 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredPets.map(pet => (
                <tr
                  key={pet.id}
                  onClick={() => onSelectPet(pet)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                        {pet.ai_profile?.photoUrl ? (
                          <img
                            src={pet.ai_profile.photoUrl}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          speciesIcon(pet.species)
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {pet.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      {speciesIcon(pet.species)}
                      {pet.species}
                    </span>
                    {pet.ai_profile?.breed && (
                      <span className="text-gray-400 dark:text-gray-600">
                        {' '}
                        · {pet.ai_profile.breed}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeColor[pet.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor[pet.status]}`} />
                      {statusLabel[pet.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{fmtDate(pet.created_at)}</td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={() => onDeletePet(pet.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 transition-colors">
                      <IconTrash />Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {filteredPets.length > 0 && (
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPets.map(pet => (
            <div key={pet.id} onClick={() => onSelectPet(pet)} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                  {pet.ai_profile?.photoUrl ? (
                    <img src={pet.ai_profile.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    speciesIcon(pet.species)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{pet.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-1.5">{speciesIcon(pet.species)} {pet.species}{pet.ai_profile?.breed && ` · ${pet.ai_profile.breed}`}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeColor[pet.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor[pet.status]}`} />
                  {statusLabel[pet.status]}
                </span>
                <span className="text-xs text-gray-400">{fmtDate(pet.created_at)}</span>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); onDeletePet(pet.id); }} className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/15 border border-red-500/30 transition-colors">
                <IconTrash />Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
