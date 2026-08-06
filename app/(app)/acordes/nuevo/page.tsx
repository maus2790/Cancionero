'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createChord } from '@/app/actions/chords';
import { ChordEditor, ChordEditorData } from '@/components/ChordEditor';
import { ChordEditorPiano, PianoData } from '@/components/ChordEditorPiano';
import { useTitle } from '@/lib/TitleContext';
import { NOTES, CHORD_TYPES, getChordName } from '@/lib/constants';
import { X } from 'lucide-react';

export default function NewChordPage() {
    const { setTitle, setShowBack, setOnBack } = useTitle();
    const router = useRouter();

    useEffect(() => {
        setShowBack(true);
        setOnBack(() => router.push('/acordes'));
        return () => {
            setShowBack(false);
            setOnBack(() => { });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const searchParams = useSearchParams();
    const [activeTab] = useState<'guitar' | 'piano'>(
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
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const chordName = getChordName(selectedNote, selectedType);
    useEffect(() => {
        setTitle(`Nuevo Acorde (${chordName})`);
    }, [setTitle, chordName]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('name', chordName);
        formData.append('root', selectedNote);
        formData.append('type', selectedType);
        formData.append('guitarPositions', activeTab === 'guitar' ? JSON.stringify(guitarPositions) : '');
        formData.append('pianoPositions', activeTab === 'piano' ? JSON.stringify(pianoData) : '');
        formData.append('imageFolder', activeTab === 'piano' ? 'piano' : 'chords');
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            await createChord(formData);
            router.push('/acordes');
        } catch (err) {
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
        removeImage();
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

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Editor según tab activo */}
                <div>

                    {activeTab === 'guitar' ? (
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
                    ) : (
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
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Imagen de {activeTab === 'guitar' ? 'Guitarra' : 'Piano'} (opcional)
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="flex-1 text-sm border rounded-lg p-2 bg-white dark:bg-gray-800"
                        />
                        {imagePreview && (
                            <button
                                type="button"
                                onClick={removeImage}
                                className="p-1 text-red-500 hover:text-red-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {imagePreview && (
                        <div className="mt-2">
                            <img src={imagePreview} alt="Vista previa" className="max-h-32 rounded" />
                        </div>
                    )}
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