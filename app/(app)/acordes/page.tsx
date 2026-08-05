'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GuitarChordDiagram } from '@/components/GuitarChordDiagram';
import { PianoChordDiagram } from '@/components/PianoChordDiagram';
import { useTitle } from '@/lib/TitleContext';
import { getAllChords, deleteChord } from '@/app/actions/chords';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ChordsPage() {
  const { setTitle } = useTitle();
  const router = useRouter();
  useEffect(() => setTitle('Banco de Acordes'), [setTitle]);

  const [view, setView] = useState<'guitar' | 'piano'>('guitar');
  const [search, setSearch] = useState('');
  const [selectedRoot, setSelectedRoot] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [chordsList, setChordsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChords = async () => {
    setLoading(true);
    try {
      const data = await getAllChords();
      setChordsList(data);
    } catch (error) {
      console.error('Error loading chords:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChords();
  }, []);

  const { roots, types } = (() => {
    const rootSet = new Set<string>();
    const typeSet = new Set<string>();
    chordsList.forEach(chord => {
      const root = chord.root || chord.name.charAt(0);
      const type = chord.type || 'major';
      rootSet.add(root);
      typeSet.add(type);
    });
    return { roots: Array.from(rootSet).sort(), types: Array.from(typeSet).sort() };
  })();

  const filteredChords = chordsList.filter(chord => {
    const root = chord.root || chord.name.charAt(0);
    const type = chord.type || 'major';
    const matchesRoot = selectedRoot ? root === selectedRoot : true;
    const matchesType = selectedType ? type === selectedType : true;
    const matchesSearch = search ? chord.name.toLowerCase().includes(search.toLowerCase()) : true;
    return matchesRoot && matchesType && matchesSearch;
  });

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`¿Eliminar el acorde "${name}"?`)) {
      await deleteChord(id);
      await loadChords();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-24 sm:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Acordes</h2>
        <button
          onClick={() => router.push('/acordes/nuevo')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setView('guitar')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'guitar' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
          >
            Guitarra
          </button>
          <button
            onClick={() => setView('piano')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'piano' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
          >
            Teclado
          </button>
        </div>

        <div className="flex flex-wrap gap-2 flex-1">
          <select
            value={selectedRoot}
            onChange={e => setSelectedRoot(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-xs"
          >
            <option value="">Todas las notas</option>
            {roots.map(root => (
              <option key={root} value={root}>{root}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-xs"
          >
            <option value="">Todos los tipos</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Buscar acorde..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-xs flex-1 min-w-[100px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredChords.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No se encontraron acordes.
          <button
            onClick={() => router.push('/acordes/nuevo')}
            className="block mx-auto mt-4 text-blue-600 hover:underline"
          >
            Crear el primer acorde
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredChords.map(chord => {
            const positions = chord.guitarPositions ? JSON.parse(chord.guitarPositions) : null;
            return (
              <div
                key={chord.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 flex flex-col items-center relative group border border-gray-200 dark:border-gray-700"
              >
                <span className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                  {chord.name}
                </span>
                <div className="w-full flex justify-center">
                  {view === 'guitar' ? (
                    <GuitarChordDiagram
                      chordName={chord.name}
                      width={100}
                      positions={positions}
                    />
                  ) : (
                    <PianoChordDiagram chordName={chord.name} width={180} />
                  )}
                </div>
                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    onClick={() => router.push(`/acordes/editar/${chord.id}`)}
                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 transition"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(chord.id, chord.name)}
                    className="p-1 bg-red-200 dark:bg-red-800 rounded hover:bg-red-300 transition"
                  >
                    <Trash2 className="w-3 h-3 text-red-700 dark:text-red-300" />
                  </button>
                </div>
                {chord.isPredefined && (
                  <span className="absolute top-1 left-1 text-[8px] text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 rounded">
                    importado
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}