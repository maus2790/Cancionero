'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit, Trash2, Image as ImageIcon, Plus } from 'lucide-react';
import { GuitarChordDiagram } from './GuitarChordDiagram';
import { PianoChordDiagram } from './PianoChordDiagram';
import { deleteChord } from '@/app/actions/chords';
import { getChordDisplayName } from '@/lib/constants';

interface ChordModalProps {
    chord: any;
    chordName?: string; // Para cuando no se encuentra el acorde
    isOpen: boolean;
    onClose: () => void;
    onDelete?: () => void; // Hacemos opcional onDelete
    initialView?: 'guitar' | 'piano';
    allowToggle?: boolean; // Nuevo prop para permitir alternar entre instrumentos
    canCreate?: boolean;
    canManage?: boolean;
    onEdit?: () => void;
}

export default function ChordModal({ chord, chordName, isOpen, onClose, onDelete, initialView = 'guitar', allowToggle = false, canCreate = false, canManage = false, onEdit }: ChordModalProps) {
    const router = useRouter();
    const [showImage, setShowImage] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [viewMode, setViewMode] = useState<'guitar' | 'piano'>(initialView);

    useEffect(() => {
        if (isOpen) {
            setViewMode(initialView);
            setShowImage(false);
            setImageError(false);
        }
    }, [isOpen, initialView]);

    if (!isOpen) return null;

    // Estado "No Encontrado"
    if (!chord) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-2">
                        {chordName}
                    </h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                        El acorde <strong>{chordName}</strong> no existe en la base de datos.
                    </p>
                    {canCreate && <div className="flex justify-center">
                        <button
                            onClick={() => {
                                router.push(`/acordes/nuevo?name=${encodeURIComponent(chordName || '')}`);
                                onClose();
                            }}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            <Plus className="w-5 h-5" /> Crear Acorde
                        </button>
                    </div>}
                </div>
            </div>
        );
    }

    let positions = null;
    try {
        positions = chord.guitarPositions ? JSON.parse(chord.guitarPositions) : null;
    } catch {}
    
    let pianoData: { startingNote: string, notes: string[] } = { startingNote: 'C', notes: [] };
    try {
        if (chord.pianoPositions) {
            const parsed = JSON.parse(chord.pianoPositions);
            if (Array.isArray(parsed)) {
                pianoData = { startingNote: 'C', notes: parsed };
            } else if (parsed && typeof parsed === 'object') {
                pianoData = parsed;
            }
        }
    } catch {}

    const imageUrl = viewMode === 'piano' ? chord.pianoImageUrl : chord.imageUrl;

    const handleDelete = async () => {
        if (confirm(`¿Eliminar el acorde "${chord.name}"?`)) {
            await deleteChord(chord.id);
            if (onDelete) onDelete();
            onClose();
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit();
            return;
        }
        const tab = viewMode === 'piano' ? '?tab=piano' : '';
        router.push(`/acordes/editar/${chord.id}${tab}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>

                {allowToggle && (
                    <div className="flex justify-center mb-2">
                        <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg inline-flex">
                            <button
                                onClick={() => setViewMode('guitar')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'guitar' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                Guitarra
                            </button>
                            <button
                                onClick={() => setViewMode('piano')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'piano' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                Piano
                            </button>
                        </div>
                    </div>
                )}

                <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-4 mt-2">
                    {getChordDisplayName(chord.root, chord.type, chord.name)}
                </h2>

                <div className="flex justify-center mb-6">
                    {viewMode === 'guitar' ? (
                        <GuitarChordDiagram
                            chordName={chord.name}
                            width={300}
                            positions={positions}
                        />
                    ) : (
                        <PianoChordDiagram chordName={chord.name} width={340} notes={pianoData.notes} startingNote={pianoData.startingNote} />
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-3 mb-4">
                    {canManage && <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Edit className="w-4 h-4" /> Editar
                    </button>}
                    {canManage && <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar
                    </button>}
                    <button
                        onClick={() => {
                            setShowImage(!showImage);
                            setImageError(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        <ImageIcon className="w-4 h-4" /> {showImage ? 'Ocultar imagen' : 'Ver imagen'}
                    </button>
                </div>

                {showImage && (
                    <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                        {imageUrl && !imageError ? (
                            <img
                                src={imageUrl}
                                alt={chord.name}
                                className="max-w-full max-h-64 mx-auto rounded"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Imagen no disponible</p>
                                <p className="text-xs mt-1">Sube una imagen desde la edición del acorde</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
