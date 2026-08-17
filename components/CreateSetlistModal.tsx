'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Globe, Lock, Music, GripVertical, Trash2 } from 'lucide-react';
import { createSetlist, addSongToSetlist } from '@/app/actions/setlists';
import { getSongs } from '@/app/actions/songs';
import toast from 'react-hot-toast';

interface CreateSetlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateSetlistModal({ isOpen, onClose, onSuccess }: CreateSetlistModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [allSongs, setAllSongs] = useState<any[]>([]);
    const [selectedSongs, setSelectedSongs] = useState<any[]>([]);

    const dragIndex = useRef<number | null>(null);
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            getSongs('', 1, 2000).then(d => setAllSongs(d.items));
            setName('');
            setDescription('');
            setIsPublic(true);
            setSelectedSongs([]);
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const newSetlist = await createSetlist({ name: name.trim(), description: description.trim() || undefined, isPublic });
            
            for (let i = 0; i < selectedSongs.length; i++) {
                await addSongToSetlist({ setlistId: newSetlist.id, songId: selectedSongs[i].id });
            }

            toast.success('Lista creada correctamente');
            onClose();
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear la lista');
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragIndex.current = index;
        setDraggingIdx(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragIndex.current === null || dragIndex.current === index) return;
        const next = [...selectedSongs];
        const [item] = next.splice(dragIndex.current, 1);
        next.splice(index, 0, item);
        dragIndex.current = index;
        setDraggingIdx(index);
        setSelectedSongs(next);
    };

    const handleDragEnd = () => {
        dragIndex.current = null;
        setDraggingIdx(null);
    };

    const handleRemoveSong = (indexToRemove: number) => {
        setSelectedSongs(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleAddSong = (songId: string) => {
        if (!songId) return;
        const numId = Number(songId);
        if (selectedSongs.some(s => s.id === numId)) return;
        const song = allSongs.find(s => s.id === numId);
        if (song) {
            setSelectedSongs(prev => [...prev, song]);
        }
    };

    const availableSongs = allSongs.filter(s => !selectedSongs.some(e => e.id === s.id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                {/* header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Nueva lista</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre de la lista *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Ej: Culto de adoración"
                            required
                        />
                    </div>

                    {/* descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción (opcional)
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Descripción de la lista"
                        />
                    </div>

                    {/* visibilidad */}
                    <div
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                            isPublic
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30'
                        }`}
                        onClick={() => setIsPublic(p => !p)}
                    >
                        <div className={`p-2 rounded-lg flex-shrink-0 ${isPublic ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {isPublic ? 'Lista pública' : 'Lista privada'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isPublic ? 'Visible para todos los usuarios' : 'Solo visible para ti'}
                            </p>
                        </div>
                    </div>

                    {/* canciones */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Canciones de la Setlist</h4>

                        {selectedSongs.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-gray-400 dark:text-gray-500 text-sm">
                                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                Esta lista no tiene canciones aún
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {selectedSongs.map((song, index) => (
                                    <div
                                        key={song.id}
                                        draggable
                                        onDragStart={e => handleDragStart(e, index)}
                                        onDragOver={e => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all select-none ${
                                            draggingIdx === index
                                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-[1.01]'
                                                : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                                {song?.title ?? '—'}
                                            </p>
                                            {song?.artist && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.artist}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex-shrink-0 w-5 text-right">{index + 1}</span>
                                        <button
                                            onClick={() => handleRemoveSong(index)}
                                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex-shrink-0"
                                            title="Quitar de la lista"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Agregar canción</label>
                            <select
                                value=""
                                onChange={e => handleAddSong(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">
                                    {availableSongs.length === 0 ? 'No hay canciones disponibles' : '+ Seleccionar una canción…'}
                                </option>
                                {availableSongs.map(song => (
                                    <option key={song.id} value={song.id}>
                                        {song.title}{song.artist ? ` — ${song.artist}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* botones */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !name.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
                        ) : (
                            'Crear lista'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
