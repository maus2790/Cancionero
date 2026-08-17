'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    getUserSetlists,
    deleteSetlist,
    updateSetlist,
    getSetlistById,
    addSongToSetlist,
    removeSongFromSetlist,
    reorderSetlistSongs,
    getPublicSetlists,
} from '@/app/actions/setlists';
import { getSongs } from '@/app/actions/songs';
import { getCurrentUser } from '@/app/actions/auth';
import {
    Edit, Trash2, Plus, Music, X, Guitar, Headphones,
    MicVocal, Disc3, Radio, GripVertical, Loader2, Globe, Lock, MoreVertical,
} from 'lucide-react';
import { useTitle } from '@/lib/TitleContext';
import toast from 'react-hot-toast';
import { getSetlistAppearance } from '@/lib/setlistAppearance';

const setlistIcons = {
    music: Music, guitar: Guitar, headphones: Headphones,
    mic: MicVocal, disc: Disc3, radio: Radio,
};
const setlistColors: Record<string, string> = {
    sky: 'from-sky-400 to-blue-600',
    violet: 'from-violet-400 to-indigo-600',
    rose: 'from-rose-400 to-pink-600',
    amber: 'from-amber-400 to-orange-600',
    emerald: 'from-emerald-400 to-teal-600',
    indigo: 'from-indigo-400 to-blue-700',
};

type SetlistEntry = { id: number; songId: number; order: number; song: any };

export default function SetlistsPage() {
    const router = useRouter();
    const { setTitle, setShowBack } = useTitle();

    const [setlists, setSetlists] = useState<any[]>([]);
    const [publicSetlists, setPublicSetlists] = useState<any[]>([]);
    const [isGuest, setIsGuest] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [allSongs, setAllSongs] = useState<any[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [editingList, setEditingList] = useState<any | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(true);
    const [editSongs, setEditSongs] = useState<SetlistEntry[]>([]);
    const [loadingSongs, setLoadingSongs] = useState(false);
    const [saving, setSaving] = useState(false);

    const dragIndex = useRef<number | null>(null);
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const loadSetlists = async () => {
        const user = await getCurrentUser();
        setIsGuest(user?.provider === 'guest');

        try {
            const [data, publicData] = await Promise.all([
                user?.provider === 'guest' ? [] : getUserSetlists(),
                getPublicSetlists()
            ]);
            setSetlists(data);
            setPublicSetlists(publicData);
        } catch (e) {
            console.error(e);
            toast.error('Error al cargar listas');
        }
        setPageLoading(false);
    };

    useEffect(() => {
        setTitle('Mis Setlists');
        setShowBack(false);
        loadSetlists();
        getSongs('', 1, 2000).then(d => setAllSongs(d.items));
    }, [setTitle, setShowBack]);

    const handleEdit = async (list: any) => {
        setEditingList(list);
        setEditName(list.name);
        setEditDescription(list.description || '');
        setEditIsPublic(list.isPublic ?? true);
        setEditSongs([]);
        setShowModal(true);
        setLoadingSongs(true);
        try {
            const full = await getSetlistById(list.id);
            setEditSongs(full.songs as SetlistEntry[]);
            setEditIsPublic(full.isPublic ?? true);
        } catch {
            toast.error('Error al cargar las canciones de la lista');
        } finally {
            setLoadingSongs(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingList(null);
        setEditSongs([]);
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
        const next = [...editSongs];
        const [item] = next.splice(dragIndex.current, 1);
        next.splice(index, 0, item);
        dragIndex.current = index;
        setDraggingIdx(index);
        setEditSongs(next);
    };

    const handleDragEnd = () => {
        dragIndex.current = null;
        setDraggingIdx(null);
    };

    const handleRemoveSong = (setlistSongId: number) => {
        setEditSongs(prev => prev.filter(s => s.id !== setlistSongId));
    };

    const handleAddSong = async (songId: string) => {
        if (!songId || !editingList) return;
        const numId = Number(songId);
        if (editSongs.some(s => s.songId === numId)) return;
        try {
            const newEntry = await addSongToSetlist({ setlistId: editingList.id, songId: numId });
            const song = allSongs.find(s => s.id === numId);
            if (song) {
                setEditSongs(prev => [
                    ...prev,
                    { id: newEntry.id, songId: numId, order: prev.length, song },
                ]);
            }
        } catch (e: any) {
            toast.error(e.message || 'Error al añadir canción');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingList) return;
        setSaving(true);
        try {
            await updateSetlist(editingList.id, {
                name: editName,
                description: editDescription,
                isPublic: editIsPublic,
            });

            const current = await getSetlistById(editingList.id);
            const currentIds = new Set(current.songs.map((s: any) => s.id));
            const keepIds = new Set(editSongs.map(s => s.id));

            const toRemove = [...currentIds].filter(id => !keepIds.has(id));
            for (const id of toRemove) {
                await removeSongFromSetlist(id);
            }

            const remainingIds = editSongs.filter(s => keepIds.has(s.id)).map(s => s.id);
            if (remainingIds.length > 0) {
                await reorderSetlistSongs(editingList.id, remainingIds);
            }

            toast.success('Lista guardada correctamente');
            handleCloseModal();
            await loadSetlists();
        } catch (e: any) {
            toast.error(e.message || 'Error al guardar la lista');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta lista?')) return;
        try {
            await deleteSetlist(id);
            await loadSetlists();
            toast.success('Lista eliminada');
        } catch {
            toast.error('No se pudo eliminar la lista');
        }
    };

    const availableSongs = allSongs.filter(s => !editSongs.some(e => e.songId === s.id));

    if (pageLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    const renderSetlistGrid = (lists: any[], isPublicSection: boolean) => {
        if (lists.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>{isPublicSection ? 'No hay listas públicas aún.' : 'No tienes listas aún. Crea una nueva.'}</p>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lists.map((list) => {
                    const appearance = getSetlistAppearance(list.id, list.icon, list.color);
                    const Icon = setlistIcons[appearance.icon as keyof typeof setlistIcons] || Music;
                    const colorClass = setlistColors[appearance.color] || setlistColors.sky;
                    return (
                        <div
                            key={list.id}
                            className="bg-white dark:bg-slate-800 rounded-2xl border border-sky-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition cursor-pointer group relative overflow-hidden"
                        >
                            <div onClick={() => router.push(`/setlists/${list.id}`)} className="flex gap-4 p-5">
                                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClass} text-white shadow-lg`}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <div className="min-w-0 flex-1 pr-10">
                                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white truncate">{list.name}</h3>
                                    {list.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{list.description}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <p className="text-xs font-medium text-sky-600 dark:text-sky-400">{list.songCount || 0} canciones</p>
                                        {!isPublicSection && list.isPublic === false && (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                                <Lock className="w-3 h-3" /> Privada
                                            </span>
                                        )}
                                        {isPublicSection && list.userName && (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                • de {list.userName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!isPublicSection && (
                                <div className="absolute top-2 right-2" ref={openMenuId === list.id ? menuRef : null}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === list.id ? null : list.id);
                                        }}
                                        className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-700/80 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 shadow-sm transition"
                                        title="Opciones"
                                        aria-label="Opciones"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {openMenuId === list.id && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 top-8 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50"
                                        >
                                            <button
                                                onClick={() => { setOpenMenuId(null); handleEdit(list); }}
                                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                            >
                                                <Edit className="w-4 h-4 text-sky-500" /> Editar
                                            </button>
                                            <button
                                                onClick={() => { setOpenMenuId(null); handleDelete(list.id); }}
                                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                            >
                                                <Trash2 className="w-4 h-4" /> Eliminar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:pb-6">

            {!isGuest && (
                <div className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Mis Setlists</h2>
                    {renderSetlistGrid(setlists, false)}
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Setlists Públicos</h2>
                {renderSetlistGrid(publicSetlists, true)}
            </div>

            {!isGuest && (
                <button
                    onClick={() => router.push('/setlists/nueva')}
                    className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
                    aria-label="Nueva lista"
                >
                    <Plus className="w-6 h-6" />
                </button>
            )}

            {/* ══ MODAL DE EDICIÓN ══════════════════════════════ */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

                        {/* header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Editar Setlist</h3>
                            <button onClick={handleCloseModal} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* body */}
                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

                            {/* nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {/* descripción */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
                                <input
                                    type="text"
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {/* visibilidad */}
                            <div
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${editIsPublic
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30'
                                    }`}
                                onClick={() => setEditIsPublic(p => !p)}
                            >
                                <div className={`p-2 rounded-lg flex-shrink-0 ${editIsPublic ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                                    {editIsPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {editIsPublic ? 'Lista pública' : 'Lista privada'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {editIsPublic ? 'Visible para todos los usuarios' : 'Solo visible para ti'}
                                    </p>
                                </div>
                            </div>

                            {/* canciones */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Canciones de la Setlist</h4>

                                {loadingSongs ? (
                                    <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Cargando canciones…</span>
                                    </div>
                                ) : editSongs.length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-gray-400 dark:text-gray-500 text-sm">
                                        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        Esta lista no tiene canciones aún
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {editSongs.map((entry, index) => (
                                            <div
                                                key={entry.id}
                                                draggable
                                                onDragStart={e => handleDragStart(e, index)}
                                                onDragOver={e => handleDragOver(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all select-none ${draggingIdx === index
                                                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-[1.01]'
                                                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
                                                    <GripVertical className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                                        {entry.song?.title ?? '—'}
                                                    </p>
                                                    {entry.song?.artist && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{entry.song.artist}</p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex-shrink-0 w-5 text-right">{index + 1}</span>
                                                <button
                                                    onClick={() => handleRemoveSong(entry.id)}
                                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex-shrink-0"
                                                    title="Quitar de la lista"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!loadingSongs && (
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
                                )}
                            </div>
                        </div>

                        {/* footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <button
                                onClick={handleCloseModal}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving || !editName.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
