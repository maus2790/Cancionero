'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { GuitarChordDiagram } from './GuitarChordDiagram';
import { deleteChord } from '@/app/actions/chords';

interface ChordModalProps {
    chord: any;
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
}

export default function ChordModal({ chord, isOpen, onClose, onDelete }: ChordModalProps) {
    const router = useRouter();
    const [showImage, setShowImage] = useState(false);
    const [imageError, setImageError] = useState(false);

    if (!isOpen || !chord) return null;

    const positions = chord.guitarPositions ? JSON.parse(chord.guitarPositions) : null;
    const imageUrl = chord.imageUrl;

    const handleDelete = async () => {
        if (confirm(`¿Eliminar el acorde "${chord.name}"?`)) {
            await deleteChord(chord.id);
            onDelete();
            onClose();
        }
    };

    const handleEdit = () => {
        router.push(`/acordes/editar/${chord.id}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 relative max-h-[90vh] overflow-y-auto">
                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>

                {/* Nombre del acorde */}
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-4">
                    {chord.name}
                </h2>

                {/* Diagrama más grande */}
                <div className="flex justify-center mb-6">
                    <GuitarChordDiagram
                        chordName={chord.name}
                        width={300}
                        positions={positions}
                    />
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap justify-center gap-3 mb-4">
                    <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Edit className="w-4 h-4" /> Editar
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
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

                {/* Área de imagen */}
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