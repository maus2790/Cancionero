'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSongs, getArtists, getStyles, toggleFavorite } from '@/app/actions/songs';
import { Search, Plus, Heart, Filter, X, ListPlus, Play, Pause } from 'lucide-react';
import Link from 'next/link';
import { AddToSetlistModal } from '@/components/AddToSetlistModal';
import { getUserSetlists } from '@/app/actions/setlists';
import { SongCard } from '@/components/SongCard';
import { useTitle } from '@/lib/TitleContext';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STYLES = ['Adoración', 'Gozo', 'Contemporánea', 'Balada', 'Ritmo', 'Tradicional', 'Otro'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function SongsPage() {
    const router = useRouter();
    const { setTitle, setShowBack } = useTitle();
    const [songs, setSongs] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [artists, setArtists] = useState<string[]>([]);
    const [styles, setStyles] = useState<string[]>([]);
    const [selectedArtist, setSelectedArtist] = useState('');
    const [selectedKey, setSelectedKey] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState('');
    const [userSetlists, setUserSetlists] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
    const [selectedSongTitle, setSelectedSongTitle] = useState('');
    const filterRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const limit = 10;

    useEffect(() => {
        setTitle('Canciones');
        setShowBack(false);
    }, [setTitle, setShowBack]);

    useEffect(() => {
        const loadSetlists = async () => {
            try {
                const lists = await getUserSetlists();
                setUserSetlists(lists);
            } catch (e) {
                // Usuario no autenticado o error
            }
        };
        loadSetlists();
    }, []);

    useEffect(() => {
        const loadFilters = async () => {
            const [artistsData, stylesData] = await Promise.all([
                getArtists(),
                getStyles(),
            ]);
            setArtists(artistsData.filter(a => a !== null));
            setStyles(stylesData.filter(s => s !== null));
        };
        loadFilters();
    }, []);

    useEffect(() => {
        loadSongs();
    }, [search, page, selectedArtist, selectedKey, selectedStyle, selectedLetter]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadSongs = async () => {
        setLoading(true);
        const filters: any = {};
        if (selectedArtist) filters.artist = selectedArtist;
        if (selectedKey) filters.key = selectedKey;
        if (selectedStyle) filters.style = selectedStyle;

        if (selectedLetter) {
            const data = await getSongs(search, page, limit, filters);
            const filteredItems = data.items.filter((song: any) =>
                song.title.toUpperCase().startsWith(selectedLetter)
            );
            setSongs(filteredItems);
            setTotalPages(Math.ceil(filteredItems.length / limit));
            setLoading(false);
            return;
        }

        const data = await getSongs(search, page, limit, filters);
        setSongs(data.items);
        setTotalPages(data.totalPages);
        setLoading(false);
    };

    const clearFilter = (filterType: string) => {
        if (filterType === 'artist') setSelectedArtist('');
        if (filterType === 'key') setSelectedKey('');
        if (filterType === 'style') setSelectedStyle('');
        if (filterType === 'letter') setSelectedLetter('');
        if (filterType === 'search') setSearch('');
        setPage(1);
    };

    const clearAllFilters = () => {
        setSelectedArtist('');
        setSelectedKey('');
        setSelectedStyle('');
        setSelectedLetter('');
        setSearch('');
        setPage(1);
    };

    const handleLetterClick = (letter: string) => {
        if (selectedLetter === letter) {
            setSelectedLetter('');
        } else {
            setSelectedLetter(letter);
            setPage(1);
        }
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    const handlePlayPause = (song: any) => {
        if (!song.audioUrl) return;

        // Misma canción: toggle play/pause
        if (playingId === song.id) {
            if (audioRef.current) {
                if (audioRef.current.paused) {
                    audioRef.current.play();
                } else {
                    audioRef.current.pause();
                    setPlayingId(null);
                }
            }
            return;
        }

        // Otra canción: parar la actual y reproducir la nueva
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        const audio = new Audio(song.audioUrl);
        audioRef.current = audio;
        audio.play();
        setPlayingId(song.id);
        audio.onended = () => setPlayingId(null);
    };

    const handleToggleFavorite = async (songId: number) => {
        await toggleFavorite(songId);
        // Actualizar el estado local sin recargar toda la lista
        setSongs(prev => prev.map(s =>
            s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s
        ));
    };

    const hasActiveFilters = selectedArtist || selectedKey || selectedStyle || selectedLetter || search;

    return (
        <div className="max-w-6xl mx-auto px-4 py-4 pb-24 sm:pb-6">
            {/* Fila: buscador + filtro */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={toggleFilters}
                    className={`p-2 rounded-lg border transition flex-shrink-0 ${hasActiveFilters
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                        }`}
                    aria-label="Toggle filters"
                >
                    <Filter className="w-5 h-5" />
                </button>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar canción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {search && (
                        <button
                            onClick={() => clearFilter('search')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Etiquetas de filtros activos */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {search && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                            Buscar: {search}
                            <button onClick={() => clearFilter('search')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedArtist && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                            Artista: {selectedArtist}
                            <button onClick={() => clearFilter('artist')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedKey && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                            Tono: {selectedKey}
                            <button onClick={() => clearFilter('key')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedStyle && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                            Estilo: {selectedStyle}
                            <button onClick={() => clearFilter('style')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedLetter && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                            Letra: {selectedLetter}
                            <button onClick={() => clearFilter('letter')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    <button
                        onClick={clearAllFilters}
                        className="text-sm text-red-500 hover:text-red-700 px-2 py-1"
                    >
                        Limpiar todos
                    </button>
                </div>
            )}

            {/* Panel de filtros desplegable */}
            {showFilters && (
                <div
                    ref={filterRef}
                    className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                    <button
                        onClick={() => setShowFilters(false)}
                        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400"
                        aria-label="Cerrar filtros"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Artista
                        </label>
                        <select
                            value={selectedArtist}
                            onChange={(e) => {
                                setSelectedArtist(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                        >
                            <option value="">Todos</option>
                            {artists.map((artist) => (
                                <option key={artist} value={artist}>
                                    {artist}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tonalidad
                        </label>
                        <select
                            value={selectedKey}
                            onChange={(e) => {
                                setSelectedKey(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                        >
                            <option value="">Todas</option>
                            {NOTES.map((note) => (
                                <option key={note} value={note}>
                                    {note}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estilo
                        </label>
                        <select
                            value={selectedStyle}
                            onChange={(e) => {
                                setSelectedStyle(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                        >
                            <option value="">Todos</option>
                            {styles.map((style) => (
                                <option key={style} value={style}>
                                    {style}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Contenido principal */}
            <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-shrink-0 w-8 sm:w-8">
                    {ALPHABET.map((letter) => (
                        <button
                            key={letter}
                            onClick={() => handleLetterClick(letter)}
                            className={`text-center py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium transition ${selectedLetter === letter
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {letter}
                        </button>
                    ))}
                </div>

                <div className="flex-1 min-w-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : songs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p>No hay canciones con estos filtros</p>
                            <button
                                onClick={clearAllFilters}
                                className="mt-2 text-blue-600 hover:underline text-sm"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {songs.map((song) => (
                                <SongCard
                                    key={song.id}
                                    song={song}
                                    playingId={playingId}
                                    onPlayPause={handlePlayPause}
                                    isFavorite={song.isFavorite}
                                    onToggleFavorite={handleToggleFavorite}
                                    onAddToList={(songId, songTitle) => {
                                        setSelectedSongId(songId);
                                        setSelectedSongTitle(songTitle);
                                        setShowAddModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 text-sm"
                            >
                                Anterior
                            </button>
                            <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border text-sm">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 text-sm"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Botón flotante para nueva canción */}
            <button
                onClick={() => router.push('/canciones/nueva')}
                className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Modal para agregar a setlist */}
            <AddToSetlistModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                songId={selectedSongId || 0}
                songTitle={selectedSongTitle}
                existingSetlists={userSetlists}
                currentTransposition={0}
                currentFontSize="medium"
                onSuccess={() => {
                    setShowAddModal(false);
                }}
            />
        </div>
    );
}