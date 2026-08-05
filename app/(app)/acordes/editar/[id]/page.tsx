'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getChordById, updateChord } from '@/app/actions/chords';
import { ChordEditor, ChordEditorData } from '@/components/ChordEditor';
import { useTitle } from '@/lib/TitleContext';
import { NOTES, CHORD_TYPES, getChordName } from '@/lib/constants';
import { X } from 'lucide-react';

export default function EditChordPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setTitle, setShowBack, setOnBack } = useTitle();

    // Configuramos el header al montar
    useEffect(() => {
        setShowBack(true);
        setOnBack(() => router.push('/acordes'));
        return () => {
            setShowBack(false);
            setOnBack(() => {});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [chord, setChord] = useState<any>(null);
    const [selectedNote, setSelectedNote] = useState('C');
    const [selectedType, setSelectedType] = useState('major');
    const [guitarPositions, setGuitarPositions] = useState<ChordEditorData>({
        barre: null,
        fingers: Array(6).fill(-1),
        baseFret: 1,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [removeImageFlag, setRemoveImageFlag] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadChord = async () => {
            try {
                const data = await getChordById(Number(id));
                setChord(data);
                if (data) {
                    setSelectedNote(data.root || data.name.charAt(0));
                    setSelectedType(data.type || 'major');
                    if (data.guitarPositions) {
                        const parsed = JSON.parse(data.guitarPositions);
                        setGuitarPositions({
                            barre: parsed.barre ?? null,
                            fingers: parsed.fingers || Array(6).fill(-1),
                            baseFret: parsed.baseFret ?? 1,
                        });
                    }
                    if (data.imageUrl) {
                        setImagePreview(data.imageUrl);
                    }
                }
            } catch (err) {
                setError('No se pudo cargar el acorde');
            } finally {
                setLoading(false);
            }
        };
        loadChord();
    }, [id]);

    const chordName = getChordName(selectedNote, selectedType);
    useEffect(() => {
        setTitle(`Editar Acorde (${chordName})`);
    }, [setTitle, chordName]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setRemoveImageFlag(false);
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
        setRemoveImageFlag(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const formData = new FormData();
        formData.append('name', chordName);
        formData.append('root', selectedNote);
        formData.append('type', selectedType);
        formData.append('guitarPositions', JSON.stringify(guitarPositions));
        formData.append('pianoPositions', '[]');
        if (imageFile) {
            formData.append('image', imageFile);
        }
        if (removeImageFlag) {
            formData.append('removeImage', 'true');
        }

        try {
            await updateChord(Number(id), formData);
            router.push('/acordes');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar');
            setSaving(false);
        }
    };

    const handleClear = () => {
        setGuitarPositions({
            barre: null,
            fingers: Array(6).fill(-1),
            baseFret: 1,
        });
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Editar Acorde ({chordName})
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Imagen
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="flex-1 text-sm border rounded-lg p-2 bg-white dark:bg-gray-800"
                        />
                        {(imagePreview || chord.imageUrl) && (
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
                    {!imagePreview && chord.imageUrl && (
                        <div className="mt-2 text-sm text-gray-500">Imagen actual guardada</div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Posición en Guitarra
                    </label>
                    <ChordEditor
                        key={chord.id}
                        initialPositions={guitarPositions}
                        onChange={setGuitarPositions}
                        width={400}
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Actualizar Acorde'}
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