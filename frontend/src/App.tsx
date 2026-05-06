import { Loader2 } from 'lucide-react';
import { usePets } from './hooks/usePets';
import { AuthManager } from './components/AuthManager';

function App() {
  const { loading, error } = usePets();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="Cargando…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 p-6 text-center max-w-md">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            Error de conexión: {error}
          </p>
          <p className="mt-1 text-xs text-red-500/70">Revisa que el backend esté activo y vuelve a cargar la página.</p>
        </div>
      </div>
    );
  }

  return <AuthManager />;
}

export default App;