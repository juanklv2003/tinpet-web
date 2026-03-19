import { usePets } from './hooks/usePets';
import { AuthManager } from './components/AuthManager';

function App() {
  //  DEJARLO BONICO TAILWIND O MIUI
  const { pets, loading, error } = usePets();

  if (loading) return <h2>Loading pets...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>Critical error: {error}</h2>;

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Pet Matchmaking Agency</h1>
      
      {/* AQUÍ ESTÁ LA MAGIA DEL LOGIN */}
      <AuthManager />

      <p>Pets processed in memory: {pets.length}</p>
      <pre style={{ backgroundColor: '#1e1e1e', color: '#00ff00', padding: '15px', borderRadius: '8px', overflowX: 'auto' }}>
        {JSON.stringify(pets, null, 2)}
      </pre>
    </div>
  );
}

export default App;