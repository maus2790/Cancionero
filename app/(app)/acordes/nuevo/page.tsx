'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createChord } from '@/app/actions/chords';
import { ChordEditor, ChordEditorData } from '@/components/ChordEditor';
import { useTitle } from '@/lib/TitleContext';

export default function NewChordPage() {
    const { setTitle } = useTitle();
    useEffect(() => setTitle('Nuevo Acorde'), [setTitle]);

    const router = useRouter();
    const [name, setName] = useState('');
    const [root, setRoot] = useState('');
    const [type, setType] = useState('');
    const [guitarPositions, setGuitarPositions] = useState<ChordEditorData>({
        barre: null,
        fingers: Array(6).fill(-1),
        baseFret: 1,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await createChord({
                name,
                root,
                type,
                guitarPositions: JSON.stringify(guitarPositions),
                pianoPositions: '[]',
            });
            router.push('/acordes');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear acorde');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Nuevo Acorde</h1>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                            placeholder="Ej: C, G7, Am"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Raíz
                        </label>
                        <input
                            type="text"
                            value={root}
                            onChange={(e) => setRoot(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                            placeholder="Ej: C, F#"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo
                        </label>
                        <input
                            type="text"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                            placeholder="Ej: m, 7, maj7"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Posición en Guitarra
                    </label>
                    <ChordEditor
                        initialPositions={guitarPositions}
                        onChange={setGuitarPositions}
                        width={400}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Guardando...' : 'Guardar Acorde'}
                </button>
            </form>
        </div>
    );
}