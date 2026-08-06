'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getChordById, updateChord } from '@/app/actions/chords';
import { ChordEditor, ChordEditorData } from '@/components/ChordEditor';
import { ChordEditorPiano } from '@/components/ChordEditorPiano';
import { useTitle } from '@/lib/TitleContext';
import { NOTES, CHORD_TYPES, getChordName } from '@/lib/constants';
import { X } from 'lucide-react';

export default function EditChordPage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setTitle, setShowBack, setOnBack } = useTitle();

    useEffect(() => {
        setShowBack(true);
        setOnBack(() => router.push('/acordes'));
        return () => { setShowBack(false); setOnBack(() => { }); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [chord, setChord] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'guitar' | 'piano'>(
        searchParams.get('tab') === 'piano' ? 'piano' : 'guitar'
    );

    const [selectedNote, setSelectedNote] = useState('C');
    const [selectedType, setSelectedType] = useState('major');
    const [guitarPositions, setGuitarPositions] = useState<ChordEditorData>({
        barre: null, fingers: Array(6).fill(-1), baseFret: 1,
    });
    const [pianoNotes, setPianoNotes] = useState<string[]>([]);

    // Estado de imagen para GUITARRA
    const [guitarImageFile, setGuitarImageFile] = useState<File | null>(null);
    const [guitarImagePreview, setGuitarImagePreview] = useState<string | null>(null);
    const [removeGuitarImage, setRemoveGuitarImage] = useState(false);
    const guitarFileRef = useRef<HTMLInputElement>(null);

    // Estado de imagen para PIANO
    const [pianoImageFile, setPianoImageFile] = useState<File | null>(null);
    const [pianoImagePreview, setPianoImagePreview] = useState<string | null>(null);
    const [removePianoImage, setRemovePianoImage] = useState(false);
    const pianoFileRef = useRef<HTMLInputElement>(null);

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
                    if (data.pianoPositions) {
                        try {
                            const parsed = JSON.parse(data.pianoPositions);
                            if (Array.isArray(parsed)) setPianoNotes(parsed);
                        } catch { }
                    }
                    // Pre-cargar previews de imagenes guardadas
                    if (data.imageUrl) setGuitarImagePreview(data.imageUrl);
                    if (data.pianoImageUrl) setPianoImagePreview(data.pianoImageUrl);
                }
            } catch {
                setError('No se pudo cargar el acorde');
            } finally {
                setLoading(false);
            }
        };
        loadChord();
    }, [id]);

    const chordName = getChordName(selectedNote, selectedType);
    useEffect(() => { setTitle(`Editar Acorde (${chordName})`); }, [setTitle, chordName]);

    const handleGuitarImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setGuitarImageFile(file);
            setRemoveGuitarImage(false);
            const reader = new FileReader();
            reader.onload = (ev) => setGuitarImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handlePianoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPianoImageFile(file);
            setRemovePianoImage(false);
            const reader = new FileReader();
            reader.onload = (ev) => setPianoImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const clearGuitarImage = () => {
        setGuitarImageFile(null);
        setGuitarImagePreview(null);
        setRemoveGuitarImage(true);
        if (guitarFileRef.current) guitarFileRef.current.value = '';
    };

    const clearPianoImage = () => {
        setPianoImageFile(null);
        setPianoImagePreview(null);
        setRemovePianoImage(true);
        if (pianoFileRef.current) pianoFileRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        // Guardamos primero la actualizacion de posiciones + imagen del tab activo
        const imageFile = activeTab === 'guitar' ? guitarImageFile : pianoImageFile;
        const removeImageFlag = activeTab === 'guitar' ? removeGuitarImage : removePianoImage;

        const formData = new FormData();
        formData.append('name', chordName);
        formData.append('root', selectedNote);
        formData.append('type', selectedType);
        formData.append('guitarPositions', activeTab === 'guitar' ? JSON.stringify(guitarPositions) : (chord?.guitarPositions || ''));
        formData.append('pianoPositions', activeTab === 'piano' ? JSON.stringify(pianoNotes) : (chord?.pianoPositions || ''));
        formData.append('imageFolder', activeTab === 'piano' ? 'piano' : 'chords');
        if (imageFile) formData.append('image', imageFile);
        if (removeImageFlag) formData.append('removeImage', 'true');

        try {
            await updateChord(Number(id), formData);
            router.push('/acordes');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar');
            setSaving(false);
        }
    };

    const handleClear = () => {
        if (activeTab === 'guitar') {
            setGuitarPositions({ barre: null, fingers: Array(6).fill(-1), baseFret: 1 });
        } else {
            setPianoNotes([]);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!chord) return <div className="text-center py-12 text-red-500">Acorde no encontrado</div>;

    const currentImagePreview = activeTab === 'guitar' ? guitarImagePreview : pianoImagePreview;
    const hasCurrentSavedImage = activeTab === 'guitar' ? !!chord.imageUrl : !!chord.pianoImageUrl;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Editar Acorde ({chordName})
            </h1>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nota *</label>
                        <select value={selectedNote} onChange={(e) => setSelectedNote(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800">
                            {NOTES.map((note) => (<option key={note} value={note}>{note}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo *</label>
                        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800">
                            {CHORD_TYPES.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}
                        </select>
                    </div>
                </div>

                {/* Tabs */}
                <div>
                    <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit mb-4">
                        <button type="button" onClick={() => setActiveTab('guitar')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'guitar' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>Guitarra</button>
                        <button type="button" onClick={() => setActiveTab('piano')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'piano' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>Piano / Teclado</button>
                    </div>

                    {activeTab === 'guitar' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Posicion en Guitarra</label>
                            <ChordEditor key={chord.id} initialPositions={guitarPositions} onChange={setGuitarPositions} width={400} />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas en Piano</label>
                            <ChordEditorPiano key={`piano-${chord.id}`} initialNotes={pianoNotes} onChange={setPianoNotes} width={460} />
                        </div>
                    )}
                </div>

                {/* Imagen segun tab activo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Imagen de {activeTab === 'guitar' ? 'Guitarra' : 'Piano'}
                    </label>
                    <div className="flex items-center gap-3">
                        {activeTab === 'guitar' ? (
                            <input ref={guitarFileRef} type="file" accept="image/*" onChange={handleGuitarImageChange} className="flex-1 text-sm border rounded-lg p-2 bg-white dark:bg-gray-800" />
                        ) : (
                            <input ref={pianoFileRef} type="file" accept="image/*" onChange={handlePianoImageChange} className="flex-1 text-sm border rounded-lg p-2 bg-white dark:bg-gray-800" />
                        )}
                        {(currentImagePreview || hasCurrentSavedImage) && (
                            <button type="button" onClick={activeTab === 'guitar' ? clearGuitarImage : clearPianoImage} className="p-1 text-red-500 hover:text-red-700">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {currentImagePreview && (
                        <div className="mt-2">
                            <img src={currentImagePreview} alt="Vista previa" className="max-h-32 rounded" />
                        </div>
                    )}
                    {!currentImagePreview && hasCurrentSavedImage && (
                        <div className="mt-2 text-sm text-gray-500">Imagen actual guardada</div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Guardando...' : 'Actualizar Acorde'}
                    </button>
                    <button type="button" onClick={handleClear} className="py-2 px-4 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                        Limpiar
                    </button>
                </div>
            </form>
        </div>
    );
}