import { PawPrint, MagnifyingGlass, Plus, Trash, WarningOctagon, Dog, Cat, Bird, Rabbit, Horse } from '@phosphor-icons/react';
import { LoadingView } from '../../ui/LoadingView';
import { useState } from 'react';
import type { Pet, PetStatus } from '../../../types';
import { StyledSelect } from '../../styled-select';
import { fmtDate, statusBadgeColor, statusDotColor, statusLabel } from '../helpers';
import type { PetsSort } from '../types';
import { useTranslation } from '../../../i18n/useTranslation';

interface PetsViewProps {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  onDeletePet: (petId: string) => void;
  onSelectPet: (pet: Pet) => void;
  onOpenAddModal: () => void;
}

const getSpeciesIcon = (species: string) => {
  const s = (species || '').toLowerCase().trim();
  if (s.includes('perr') || s.includes('dog') || s.includes('can')) {
    return <Dog size={18} weight="fill" className="text-pink-500 dark:text-pink-400 shrink-0" />;
  }
  if (s.includes('gat') || s.includes('cat') || s.includes('fel')) {
    return <Cat size={18} weight="fill" className="text-pink-500 dark:text-pink-400 shrink-0" />;
  }
  if (s.includes('pajar') || s.includes('pájar') || s.includes('bird') || s.includes('ave')) {
    return <Bird size={18} weight="fill" className="text-sky-500 dark:text-sky-400 shrink-0" />;
  }
  if (s.includes('conej') || s.includes('rabbit') || s.includes('liebr')) {
    return <Rabbit size={18} weight="fill" className="text-emerald-500 dark:text-emerald-400 shrink-0" />;
  }
  if (s.includes('caball') || s.includes('hors') || s.includes('equin')) {
    return <Horse size={18} weight="fill" className="text-amber-500 dark:text-amber-400 shrink-0" />;
  }
  return <PawPrint size={16} weight="fill" className="text-ink-light dark:text-slate-500 shrink-0" />;
};


const getPrimaryPhoto = (pet: Pet): string | null => {
  const fromArray = Array.isArray(pet.ai_profile?.photoUrls) ? pet.ai_profile.photoUrls[0] : null;
  const fromSingle = typeof pet.ai_profile?.photoUrl === 'string' ? pet.ai_profile.photoUrl : null;
  return fromArray || fromSingle || null;
};


export function PetsView({
  pets,
  loading,
  error,
  onDeletePet,
  onSelectPet,
  onOpenAddModal,
}: PetsViewProps) {
  const t = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PetStatus>('all');
  const [sortBy, setSortBy] = useState<PetsSort>('newest');
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const filteredPets = [...pets]
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => {
      const needle = searchTerm.trim().toLowerCase();
      if (!needle) return true;
      return [p.name, p.species, p.ai_profile?.breed].filter(Boolean).join(' ').toLowerCase().includes(needle);
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortBy === 'oldest' ? aT - bT : bT - aT;
    });

  const totalPages = Math.max(1, Math.ceil(filteredPets.length / ITEMS_PER_PAGE));
  const paginatedPets = filteredPets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const exportCsv = () => {
    if (!filteredPets.length) return;
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Nombre', 'Especie', 'Raza', 'Estado', 'Fecha alta'];
    const rows = filteredPets.map(p => [p.name, p.species, p.ai_profile?.breed ?? '', statusLabel[p.status], fmtDate(p.created_at) ?? '']);
    const csv = [header, ...rows].map(r => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `tinpet-mascotas-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectClass = "w-full bg-white dark:bg-slate-900 border border-ink-light/20 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-medium text-ink-dark dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-left";

  return (
    <section className="animate-bento-in">
      {/* Header */}
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="font-serif text-4xl md:text-5xl text-ink-dark dark:text-white leading-tight">
            {t('pets.title')}
          </h2>
          <p className="text-ink-medium dark:text-slate-400 mt-3 font-medium text-sm">
            {filteredPets.length === 1
              ? t('pets.subtitle_one', { count: filteredPets.length })
              : t('pets.subtitle_other', { count: filteredPets.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-2.5 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-sm shadow-brand-500/25 transition-colors shrink-0"
        >
          <Plus size={18} weight="bold" />
          {t('pets.addPet')}
        </button>
      </header>

      {error && (
        <p className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl">{error}</p>
      )}

      {/* Content */}
      {loading ? (
        <LoadingView message={t('common.loading')} minHeight="200px" />
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface dark:bg-slate-800 rounded-3xl border border-white dark:border-slate-700 shadow-bento bento-item">
          <PawPrint size={40} weight="fill" className="text-brand-500/30 mb-4" />
          <p className="text-sm font-medium text-ink-medium dark:text-slate-400 mb-4">{t('pets.empty')}</p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors"
          >
            <Plus size={16} weight="bold" />
            Añadir la primera
          </button>
        </div>
      ) : (
        <>
          {/* Desktop unified card */}
          <div className="hidden xl:block bg-surface dark:bg-slate-800 rounded-3xl shadow-bento border border-white dark:border-slate-700 overflow-hidden bento-item transition-colors">
            {/* Search Header inside card */}
            <div className="p-6 flex items-center gap-4">
              <input
                type="text"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Buscar por nombre, especie o raza..."
                className="flex-1 bg-white dark:bg-slate-900 border border-ink-light/20 dark:border-slate-600 rounded-xl px-5 py-3 text-sm font-medium text-ink-dark dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-3 rounded-xl border text-sm font-bold transition-all ${
                  showFilters
                    ? 'bg-brand-50 dark:bg-brand-950/20 border-brand-500 text-brand-500'
                    : 'border-ink-light/20 dark:border-slate-600 text-ink-dark dark:text-white hover:border-brand-500'
                }`}
              >
                Filtros
              </button>
            </div>

            {/* Collapsible filters block */}
            {showFilters && (
              <div className="px-6 pb-6 border-b border-ink-light/5 dark:border-slate-700/50 flex gap-4 animate-fade-up">
                <div className="w-52">
                  <StyledSelect
                    value={statusFilter}
                    onChange={v => { setStatusFilter(v as 'all' | PetStatus); setCurrentPage(1); }}
                    options={[
                      { value: 'all', label: 'Todos los estados' },
                      { value: 'disponible', label: t('pets.status.available') },
                      { value: 'pendiente', label: t('pets.status.pending') },
                      { value: 'adoptado', label: t('pets.status.adopted') },
                    ]}
                    className={selectClass}
                  />
                </div>
                <div className="w-52">
                  <StyledSelect
                    value={sortBy}
                    onChange={v => { setSortBy(v as PetsSort); setCurrentPage(1); }}
                    options={[
                      { value: 'newest', label: 'Más recientes' },
                      { value: 'oldest', label: 'Más antiguas' },
                      { value: 'name', label: 'Alfabético' },
                    ]}
                    className={selectClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={!filteredPets.length}
                  className="shrink-0 px-5 py-3 rounded-xl border border-ink-light/20 dark:border-slate-600 text-sm font-bold text-ink-medium dark:text-slate-300 hover:border-brand-500 transition-all disabled:opacity-40"
                >
                  {t('common.export')} CSV
                </button>
              </div>
            )}

            <div className="border-t border-ink-light/10 dark:border-slate-700" />

            {/* Table or Empty filtered state */}
            {filteredPets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 p-8">
                <MagnifyingGlass size={36} className="text-ink-light dark:text-slate-500" />
                <p className="text-sm text-ink-medium dark:text-slate-400">Sin resultados con los filtros actuales.</p>
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSortBy('newest'); }}
                  className="px-4 py-2 rounded-xl border border-ink-light/20 dark:border-slate-600 text-sm font-bold text-ink-medium dark:text-slate-300 hover:border-brand-500 transition-all"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    {[t('pets.table.animal'), t('pets.table.species'), t('pets.table.status'), t('pets.table.intake'), t('pets.table.actions')].map((h, i) => (
                      <th key={h} className={`px-8 py-5 text-xs font-bold text-ink-light dark:text-slate-400 uppercase tracking-widest border-b border-ink-light/10 dark:border-slate-700 ${i > 1 ? 'text-center' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedPets.map(pet => {
                    const photo = getPrimaryPhoto(pet);
                    return (
                      <tr
                        key={pet.id}
                        onClick={() => onSelectPet(pet)}
                        className="hover:bg-brand-50/30 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-8 py-5 border-b border-ink-light/5 dark:border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-background dark:bg-slate-900 overflow-hidden shrink-0 border border-ink-light/10 dark:border-slate-700">
                              {photo
                                ? <img src={photo} alt={pet.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-ink-light dark:text-slate-500"><PawPrint size={18} weight="fill" /></div>
                              }
                            </div>
                            <span className="font-bold text-ink-dark dark:text-white group-hover:text-brand-600 transition-colors">{pet.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 border-b border-ink-light/5 dark:border-slate-700/50 text-sm">
                          <div className="flex flex-col items-start pl-8">
                            <div className="flex items-center gap-2 font-bold text-ink-dark dark:text-white">
                              {getSpeciesIcon(pet.species)}
                              <span>{pet.species}</span>
                            </div>
                            <span className="text-xs text-ink-light dark:text-slate-500 mt-1 pl-6">
                              {pet.ai_profile?.breed || 'Sin definir'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 border-b border-ink-light/5 dark:border-slate-700/50 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusBadgeColor[pet.status]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor[pet.status]}`} />
                            {statusLabel[pet.status]}
                          </span>
                        </td>
                        <td className="px-8 py-5 border-b border-ink-light/5 dark:border-slate-700/50 text-sm text-ink-light dark:text-slate-400 text-center">
                          {fmtDate(pet.created_at) ?? '—'}
                        </td>
                        <td className="px-8 py-5 border-b border-ink-light/5 dark:border-slate-700/50 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setPetToDelete(pet)}
                            className="inline-flex items-center justify-center p-2.5 rounded-xl text-brand-500 hover:bg-brand-500/10 hover:border-brand-500/20 border border-transparent transition-all"
                            title={t('common.delete')}
                            aria-label={t('common.delete')}
                          >
                            <Trash size={18} weight="bold" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile layout */}
          <div className="xl:hidden">
            {/* Mobile Filters toolbar */}
            <div className="bg-surface dark:bg-slate-800 rounded-3xl p-6 shadow-bento border border-white dark:border-slate-700 mb-8 flex flex-col gap-4 transition-colors bento-item">
              <div className="relative">
                <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-light" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder={t('pets.searchPlaceholder')}
                  className="w-full bg-white dark:bg-slate-900 border border-ink-light/20 dark:border-slate-600 rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-ink-dark dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StyledSelect
                  value={statusFilter}
                  onChange={v => { setStatusFilter(v as 'all' | PetStatus); setCurrentPage(1); }}
                  options={[
                    { value: 'all', label: 'Todos los estados' },
                    { value: 'available', label: t('pets.status.available') },
                    { value: 'pending', label: t('pets.status.pending') },
                    { value: 'adopted', label: t('pets.status.adopted') },
                  ]}
                  className={selectClass}
                />
                <StyledSelect
                  value={sortBy}
                  onChange={v => { setSortBy(v as PetsSort); setCurrentPage(1); }}
                  options={[
                    { value: 'newest', label: 'Más recientes' },
                    { value: 'oldest', label: 'Más antiguas' },
                    { value: 'name', label: 'Alfabético' },
                  ]}
                  className={selectClass}
                />
              </div>
              <button
                type="button"
                onClick={exportCsv}
                disabled={!filteredPets.length}
                className="w-full px-5 py-3 rounded-xl border border-ink-light/20 dark:border-slate-600 text-sm font-bold text-ink-medium dark:text-slate-300 hover:border-brand-500 transition-all disabled:opacity-40"
              >
                {t('common.export')} CSV
              </button>
            </div>

            {/* Mobile cards or empty state */}
            {filteredPets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 bg-surface dark:bg-slate-800 rounded-3xl border border-white dark:border-slate-700 shadow-bento gap-4 bento-item">
                <MagnifyingGlass size={36} className="text-ink-light dark:text-slate-500" />
                <p className="text-sm text-ink-medium dark:text-slate-400">Sin resultados con los filtros actuales.</p>
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSortBy('newest'); }}
                  className="px-4 py-2 rounded-xl border border-ink-light/20 dark:border-slate-600 text-sm font-bold text-ink-medium dark:text-slate-300 hover:border-brand-500 transition-all"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginatedPets.map(pet => {
                  const photo = getPrimaryPhoto(pet);
                  return (
                    <div
                      key={pet.id}
                      onClick={() => onSelectPet(pet)}
                      className="bg-surface dark:bg-slate-800 rounded-3xl border border-white dark:border-slate-700 shadow-bento hover:shadow-bento-hover transition-all cursor-pointer p-6 bento-item"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-background dark:bg-slate-900 shrink-0 border border-ink-light/10">
                          {photo
                            ? <img src={photo} alt={pet.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-ink-light"><PawPrint size={22} weight="fill" /></div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-ink-dark dark:text-white truncate">{pet.name}</p>
                          <p className="text-xs text-ink-medium dark:text-slate-400 truncate">{pet.species}{pet.ai_profile?.breed ? ` · ${pet.ai_profile.breed}` : ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusBadgeColor[pet.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor[pet.status]}`} />
                          {statusLabel[pet.status]}
                        </span>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setPetToDelete(pet); }}
                          className="text-brand-500 hover:text-brand-600 transition-colors"
                        >
                          <Trash size={18} weight="bold" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-5 py-2.5 rounded-xl border border-ink-light/20 dark:border-slate-600 text-sm font-bold text-ink-dark dark:text-white hover:border-brand-500 transition-all disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm font-medium text-ink-medium dark:text-slate-400">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-5 py-2.5 rounded-xl border border-ink-light/20 dark:border-slate-600 text-sm font-bold text-ink-dark dark:text-white hover:border-brand-500 transition-all disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      {petToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-dark/60 backdrop-blur-sm p-4 animate-fade-up">
          <div className="bg-surface dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white dark:border-slate-700">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                <WarningOctagon size={24} weight="fill" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-ink-dark dark:text-white">¿Eliminar a {petToDelete.name}?</h3>
                <p className="text-sm text-ink-light dark:text-slate-400 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 mb-6 leading-relaxed">
              Todos los datos, fotos e historial de <strong>{petToDelete.name}</strong> serán eliminados por completo.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPetToDelete(null)}
                className="px-6 py-3 rounded-xl border border-ink-light/20 dark:border-slate-600 text-sm font-bold text-ink-medium dark:text-slate-300 hover:bg-background dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => { onDeletePet(petToDelete.id); setPetToDelete(null); }}
                className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                Eliminar mascota
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
