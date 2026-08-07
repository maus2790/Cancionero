'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { addSongToSetlist, createSetlist } from '@/app/actions/setlists';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AddToSetlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    songId: number;
    songTitle: string;
    existingSetlists: any[];
    currentTransposition: number;
    currentFontSize: 'small' | 'medium' | 'large' | 'xlarge';
    onSuccess?: () => void;
}

export function AddToSetlistModal({
    isOpen,
    onClose,
    songId,
    songTitle,
    existingSetlists,
    currentTransposition,
    currentFontSize,
    onSuccess,
}: AddToSetlistModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSetlistId, setSelectedSetlistId] = useState<number | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let setlistId = selectedSetlistId;

            // Si está creando una nueva lista
            if (isCreatingNew) {
                if (!newListName.trim()) {
                    setError('El nombre de la lista es obligatorio');
                    setLoading(false);
                    return;
                }
                const newSetlist = await createSetlist({
                    name: newListName.trim(),
                    description: newListDescription.trim() || undefined,
                });
                setlistId = newSetlist.id;
            }

            if (!setlistId) {
                setError('Selecciona una lista o crea una nueva');
                setLoading(false);
                return;
            }

            // Agregar canción a la lista con la configuración actual
            await addSongToSetlist({
                setlistId,
                songId,
                transposition: currentTransposition,
                fontSize: currentFontSize,
            });

            // Éxito
            router.refresh();
            toast.success('Canción agregada a la lista');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al agregar la canción');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Agregar a lista
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Agregando <span className="font-semibold">"{songTitle}"</span> a una lista
                    </p>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Selector de lista existente o nueva */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Seleccionar lista
                        </label>
                        <div className="space-y-2">
                            {/* Opción: lista existente */}
                            {existingSetlists.length > 0 && (
                                <div className="space-y-2">
                                    {existingSetlists.map((list) => (
                                        <label
                                            key={list.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${!isCreatingNew && selectedSetlistId === list.id
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="setlist"
                                                checked={!isCreatingNew && selectedSetlistId === list.id}
                                                onChange={() => {
                                                    setIsCreatingNew(false);
                                                    setSelectedSetlistId(list.id);
                                                }}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800 dark:text-white">
                                                    {list.name}
                                                </p>
                                                {list.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {list.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400">
                                                    {list.songCount || 0} canciones
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Opción: crear nueva */}
                            <label
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition ${isCreatingNew
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="setlist"
                                    checked={isCreatingNew}
                                    onChange={() => {
                                        setIsCreatingNew(true);
                                        setSelectedSetlistId(null);
                                    }}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <div className="flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-blue-600">Crear nueva lista</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Campos para nueva lista */}
                    {isCreatingNew && (
                        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre de la lista *
                                </label>
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Ej: Culto de adoración"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descripción (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={newListDescription}
                                    onChange={(e) => setNewListDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Descripción de la lista"
                                />
                            </div>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
