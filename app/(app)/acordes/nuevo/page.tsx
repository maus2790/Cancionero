'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createChord } from '@/app/actions/chords';
import { ChordEditor, ChordEditorData } from '@/components/ChordEditor';
import { ChordEditorPiano, PianoData } from '@/components/ChordEditorPiano';
import { ImageDropCrop } from '@/components/ImageDropCrop';
import { useTitle } from '@/lib/TitleContext';
import { NOTES, CHORD_TYPES, getChordName } from '@/lib/constants';
import toast from 'react-hot-toast';

function NewChordForm() {
    const { setTitle, setShowBack, setOnBack } = useTitle();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        setShowBack(true);
        setOnBack(() => router.push('/acordes'));
        return () => {
            setShowBack(false);
            setOnBack(() => { });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [activeTab, setActiveTab] = useState<'guitar' | 'piano'>(
        searchParams.get('tab') === 'piano' ? 'piano' : 'guitar'
    );
    const [selectedNote, setSelectedNote] = useState('C');
    const [selectedType, setSelectedType] = useState('major');
    const [guitarPositions, setGuitarPositions] = useState<ChordEditorData>({
        barre: null,
        fingers: Array(6).fill(-1),
        baseFret: 1,
    });
    const [pianoData, setPianoData] = useState<PianoData>({ startingNote: 'C', notes: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    const chordName = getChordName(selectedNote, selectedType);
    useEffect(() => {
        setTitle(`Nuevo Acorde (${chordName})`);
    }, [setTitle, chordName]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('name', chordName);
        formData.append('root', selectedNote);
        formData.append('type', selectedType);
        formData.append('guitarPositions', JSON.stringify(guitarPositions));
        formData.append('pianoPositions', JSON.stringify(pianoData));
        formData.append('imageFolder', activeTab === 'piano' ? 'piano' : 'chords');
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            await createChord(formData);
            toast.success('Acorde creado correctamente');
            router.push('/acordes');
        } catch (err) {
            toast.error('No se pudo crear el acorde');
            setError(err instanceof Error ? err.message : 'Error al crear acorde');
            setLoading(false);
        }
    };

    const handleClear = () => {
        if (activeTab === 'guitar') {
            setGuitarPositions({ barre: null, fingers: Array(6).fill(-1), baseFret: 1 });
        } else {
            setPianoData({ startingNote: 'C', notes: [] });
        }
        setSelectedNote('C');
        setSelectedType('major');
        setImageFile(null);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Nuevo Acorde ({chordName})
            </h1>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Fila: Nota + Tipo */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nota *
                        </label>
                        <select
                            value={selectedNote}
                            onChange={(e) => setSelectedNote(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                        >
                            {NOTES.map((note) => (
                                <option key={note} value={note}>{note}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo *
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                        >
                            {CHORD_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Diagrama + Imagen lado a lado en desktop, apilado en móvil */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    {/* Diagrama */}
                    <div className="w-full md:flex-1 min-w-0">
                        {/* Tabs de Instrumento */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-4 w-fit">
                            <button
                                type="button"
                                onClick={() => setActiveTab('guitar')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'guitar' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                Guitarra
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('piano')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'piano' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                Piano
                            </button>
                        </div>

                        <div className={activeTab === 'guitar' ? 'block' : 'hidden'}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Posición en Guitarra
                                </label>
                                <ChordEditor
                                    initialPositions={guitarPositions}
                                    onChange={setGuitarPositions}
                                    width={400}
                                />
                            </div>
                        <div className={activeTab === 'piano' ? 'block' : 'hidden'}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notas en Piano
                                </label>
                                <ChordEditorPiano
                                    initialData={pianoData}
                                    onChange={setPianoData}
                                    width={460}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Imagen drag & drop con recorte */}
                    <div className="w-full md:w-80 shrink-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Imagen (opcional)
                        </label>
                        <ImageDropCrop
                            type={activeTab}
                            onCroppedFile={(file) => setImageFile(file)}
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Guardar Acorde'}
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="py-2 px-4 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                        Limpiar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function NewChordPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <NewChordForm />
        </Suspense>
    );
}
