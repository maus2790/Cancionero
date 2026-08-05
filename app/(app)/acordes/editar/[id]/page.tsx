'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getChordById, updateChord } from '@/app/actions/chords';
import { ChordEditor, ChordEditorData } from '@/components/ChordEditor';
import { useTitle } from '@/lib/TitleContext';

export default function EditChordPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setTitle } = useTitle();
    useEffect(() => setTitle('Editar Acorde'), [setTitle]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [chord, setChord] = useState<any>(null);
    const [guitarPositions, setGuitarPositions] = useState<ChordEditorData>({
        barre: null,
        fingers: Array(6).fill(-1),
        baseFret: 1,
    });

    useEffect(() => {
        const loadChord = async () => {
            try {
                const data = await getChordById(Number(id));
                setChord(data);
                if (data.guitarPositions) {
                    const parsed = JSON.parse(data.guitarPositions);
                    // Asegurar que tenga baseFret (si no, poner 1)
                    setGuitarPositions({
                        barre: parsed.barre ?? null,
                        fingers: parsed.fingers || Array(6).fill(-1),
                        baseFret: parsed.baseFret ?? 1,
                    });
                }
            } catch (err) {
                setError('No se pudo cargar el acorde');
            } finally {
                setLoading(false);
            }
        };
        loadChord();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await updateChord(Number(id), {
                name: chord.name,
                root: chord.root || '',
                type: chord.type || '',
                guitarPositions: JSON.stringify(guitarPositions),
                pianoPositions: '[]',
            });
            router.push('/acordes');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar');
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!chord) {
        return <div className="text-center py-12 text-red-500">Acorde no encontrado</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Editar Acorde</h1>

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
                            value={chord.name}
                            onChange={(e) => setChord({ ...chord, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Raíz
                        </label>
                        <input
                            type="text"
                            value={chord.root || ''}
                            onChange={(e) => setChord({ ...chord, root: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo
                        </label>
                        <input
                            type="text"
                            value={chord.type || ''}
                            onChange={(e) => setChord({ ...chord, type: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Posición en Guitarra
                    </label>
                    <ChordEditor
                        key={chord?.id}
                        initialPositions={guitarPositions}
                        onChange={setGuitarPositions}
                        width={400}
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Guardando...' : 'Actualizar Acorde'}
                </button>
            </form>
        </div>
    );
}