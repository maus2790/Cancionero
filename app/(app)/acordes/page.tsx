'use client';

import { useState, useMemo, useEffect } from 'react';
import { GuitarChordDiagram } from '@/components/GuitarChordDiagram';
import { PianoChordDiagram } from '@/components/PianoChordDiagram';
import { useTitle } from '@/lib/TitleContext';
import { Chord } from '@tonaljs/tonal';

export default function ChordsPage() {
  const { setTitle } = useTitle();
  useEffect(() => setTitle('Banco de Acordes'), [setTitle]);

  const [view, setView] = useState<'guitar' | 'piano'>('guitar');
  const [search, setSearch] = useState('');
  const [selectedRoot, setSelectedRoot] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const chordNames = useMemo(() => {
    const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const types = ['', 'm', '7', 'm7', 'maj7', 'sus4', 'aug', 'dim'];
    const list: string[] = [];
    roots.forEach(root => {
      types.forEach(type => {
        const name = root + type;
        try {
          const chord = Chord.get(name);
          if (chord.notes.length > 0) {
            list.push(name);
          }
        } catch { }
      });
    });
    return list;
  }, []);

  const { roots, types } = useMemo(() => {
    const rootSet = new Set<string>();
    const typeSet = new Set<string>();
    chordNames.forEach(name => {
      let root = name.charAt(0);
      if (name.length > 1 && (name[1] === '#' || name[1] === 'b')) {
        root += name[1];
      }
      let type = name.substring(root.length);
      type = type || 'major';
      rootSet.add(root);
      typeSet.add(type);
    });
    return { roots: Array.from(rootSet).sort(), types: Array.from(typeSet).sort() };
  }, [chordNames]);

  const filteredChords = useMemo(() => {
    return chordNames.filter(name => {
      let root = name.charAt(0);
      if (name.length > 1 && (name[1] === '#' || name[1] === 'b')) {
        root += name[1];
      }
      let type = name.substring(root.length);
      type = type || 'major';
      const matchesRoot = selectedRoot ? root === selectedRoot : true;
      const matchesType = selectedType ? type === selectedType : true;
      const matchesSearch = search ? name.toLowerCase().includes(search.toLowerCase()) : true;
      return matchesRoot && matchesType && matchesSearch;
    });
  }, [chordNames, selectedRoot, selectedType, search]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-24 sm:pb-6">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredChords.map(name => (
          <div key={name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 flex flex-col items-center">
            <span className="text-sm font-bold text-gray-800 dark:text-white mb-1">{name}</span>
            <div className="w-full flex justify-center">
              {view === 'guitar' ? (
                <GuitarChordDiagram chordName={name} width={100} />
              ) : (
                <PianoChordDiagram chordName={name} width={180} />
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredChords.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No se encontraron acordes.
        </div>
      )}
    </div>
  );
}