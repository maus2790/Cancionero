'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSongById, toggleFavorite, deleteSong, updateChordPositions } from '@/app/actions/songs';
import { getChordByNameExact } from '@/app/actions/chords';
import { getUserSetlists } from '@/app/actions/setlists';
import { AddToSetlistModal } from '@/components/AddToSetlistModal';
import ChordModal from '@/components/ChordModal';
import { transposeChordPro } from '@/lib/chords';
import { Heart, Trash2, Edit, ListPlus, Type, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2, Gauge, Square, MoreHorizontal } from 'lucide-react';
import { getCurrentUser } from '@/app/actions/auth';
import { useTitle } from '@/lib/TitleContext';
import { useAudioCleanup } from '@/hooks/useAudioCleanup';
import toast from 'react-hot-toast';

// Opciones de tamaño de fuente
const FONT_SIZES = ['small', 'medium', 'large', 'xlarge'] as const;
type FontSize = typeof FONT_SIZES[number];

const FONT_SIZE_CLASSES: Record<FontSize, string> = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
};

const FONT_SIZE_LABELS: Record<FontSize, string> = {
    small: 'S',
    medium: 'M',
    large: 'L',
    xlarge: 'XL',
};

export default function SongDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setTitle, setShowBack, setOnBack, setHeaderRight } = useTitle();
    const [song, setSong] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [transpose, setTranspose] = useState(0);
    const [fontSizeIndex, setFontSizeIndex] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: number; role: string } | null>(null);

    // Estado del modal de acordes
    const [selectedChord, setSelectedChord] = useState<any>(null);
    const [selectedChordName, setSelectedChordName] = useState<string>('');
    const [isChordModalOpen, setIsChordModalOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [userSetlists, setUserSetlists] = useState<any[]>([]);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSongMenu, setShowSongMenu] = useState(false);
    const [isEditingChordPositions, setIsEditingChordPositions] = useState(false);
    const [chordOffsets, setChordOffsets] = useState<Record<string, number>>({});
    const [dragStart, setDragStart] = useState<{ key: string; clientX: number; offset: number } | null>(null);
    const [savingChordPositions, setSavingChordPositions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    useAudioCleanup(audioRef);

    const fontSize = FONT_SIZES[fontSizeIndex];
    const fontSizeClass = FONT_SIZE_CLASSES[fontSize];

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [songData, user] = await Promise.all([
                getSongById(Number(id)),
                getCurrentUser()
            ]);
            setSong(songData);
            try {
                setChordOffsets(songData?.chordPositions ? JSON.parse(songData.chordPositions) : {});
            } catch {
                setChordOffsets({});
            }
            setIsAuthenticated(!!user);
            setCurrentUser(user ? { id: user.id, role: user.role } : null);
            setLoading(false);
        };
        loadData();
    }, [id]);

    useEffect(() => {
        if (isAuthenticated) {
            const loadSetlists = async () => {
                const lists = await getUserSetlists();
                setUserSetlists(lists);
            };
            loadSetlists();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (song) {
            setTitle(song.title);
            setShowBack(true);
            setOnBack(() => router.push('/canciones'));
        }
        return () => {
            setTitle('Tu Cancionero');
            setShowBack(false);
            setHeaderRight(null);
        };
    }, [song, setTitle, setShowBack, setOnBack, setHeaderRight, router]);

    const handleHeaderPlayer = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlayerOpen) {
            audio.pause();
            audio.currentTime = 0;
            setCurrentTime(0);
            setIsPlayerOpen(false);
            return;
        }

        setIsPlayerOpen(true);
        void audio.play();
    };

    const handleBarPlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) void audio.play();
        else audio.pause();
    };

    useEffect(() => {
        if (song && song.audioUrl) {
            setHeaderRight(
                <button
                    onClick={handleHeaderPlayer}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center justify-center"
                    aria-label={isPlayerOpen ? 'Detener reproducción' : 'Reproducir'}
                >
                    {isPlayerOpen ? <Square className="w-5 h-5" /> : <Play className="w-6 h-6" />}
                </button>
            );
        } else {
            setHeaderRight(null);
        }
    }, [song, isPlayerOpen, setHeaderRight]);

    const makeVisible = useCallback(() => {
        setIsVisible(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (!isHovering) {
                setIsVisible(false);
            }
        }, 10000);
    }, [isHovering]);

    const handleMouseEnter = () => {
        setIsHovering(true);
        setIsVisible(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 10000);
    };

    useEffect(() => {
        makeVisible();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [makeVisible]);

    const handleToggleFavorite = async () => {
        try {
            await toggleFavorite(Number(id));
            setIsFavorite(!isFavorite);
            toast.success(isFavorite ? 'Eliminada de favoritos' : 'Añadida a favoritos');
        } catch {
            toast.error('No se pudo actualizar favoritos');
        }
        makeVisible();
    };

    const handleDelete = async () => {
        if (confirm('¿Estás seguro de eliminar esta canción?')) {
            try {
                await deleteSong(Number(id));
                toast.success('Canción eliminada');
                router.push('/canciones');
            } catch {
                toast.error('No se pudo eliminar la canción');
            }
        }
    };

    const handleAddToList = () => {
        setShowAddModal(true);
        makeVisible();
    };

    const handleTranspose = (delta: number) => {
        setTranspose(t => t + delta);
        makeVisible();
    };

    const handleFontSizeCycle = () => {
        setFontSizeIndex((prev) => (prev + 1) % FONT_SIZES.length);
        makeVisible();
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const togglePlaybackRate = () => {
        const rate = playbackRate === 1 ? 0.5 : 1;
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (e) {
                console.error('Fullscreen error:', e);
            }
        } else {
            await document.exitFullscreen();
        }
        makeVisible();
    };

    useEffect(() => {
        const onFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const handleChordClick = async (fullChord: string) => {
        const baseChord = fullChord.split('/')[0];
        setSelectedChordName(baseChord);
        setSelectedChord(null); // Clear previous
        setIsChordModalOpen(true);
        try {
            const chordData = await getChordByNameExact(baseChord);
            setSelectedChord(chordData);
        } catch (error) {
            console.error('Error fetching chord:', error);
        }
    };

    const saveChordPositionChanges = async () => {
        setSavingChordPositions(true);
        try {
            await updateChordPositions(Number(id), JSON.stringify(chordOffsets));
            setIsEditingChordPositions(false);
            toast.success('Posiciones de notas guardadas para todos');
        } catch {
            toast.error('No se pudieron guardar las posiciones');
        } finally {
            setSavingChordPositions(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!song) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-500">
                Canción no encontrada
            </div>
        );
    }

    const transposedContent = transpose !== 0 ? transposeChordPro(song.content, transpose) : song.content;
    const controlsOpacity = (isVisible || isHovering) ? 'opacity-100' : 'opacity-40';
    const canManageSong = !!currentUser && (currentUser.role === 'admin' || currentUser.id === song.userId);

    return (
        <div ref={containerRef} className="bg-gray-50 dark:bg-gray-900">

            {song.audioUrl && (
                <audio
                    ref={audioRef}
                    src={song.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                />
            )}

            {song.audioUrl && isPlayerOpen && (
                <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                        <span className="text-xs text-gray-500 font-mono w-10 text-right">
                            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                        </span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                        />
                        <span className="text-xs text-gray-500 font-mono w-10">
                            {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBarPlayPause}
                            className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                            title={isPlaying ? 'Pausar' : 'Reproducir'}
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={togglePlaybackRate}
                            className={`p-2 rounded-md transition ${playbackRate === 0.5 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            aria-label={playbackRate === 1 ? 'Cambiar velocidad a 0.5' : 'Cambiar velocidad a 1'}
                            title={playbackRate === 1 ? 'Velocidad 0.5' : 'Velocidad 1'}
                        >
                            <Gauge className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {isEditingChordPositions && (
                <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/50">
                    <span className="font-medium text-blue-800 dark:text-blue-200">Arrastra las notas con el cursor de mano y guarda los cambios.</span>
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditingChordPositions(false)} disabled={savingChordPositions} className="rounded-lg px-3 py-1.5 text-gray-700 hover:bg-blue-100 dark:text-gray-200">Cancelar</button>
                        <button onClick={saveChordPositionChanges} disabled={savingChordPositions} className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50">{savingChordPositions ? 'Guardando...' : 'Guardar posiciones'}</button>
                    </div>
                </div>
            )}
            <div className="min-h-screen overflow-x-auto p-4 sm:p-8">
                <div className={`mx-auto min-w-max max-w-none whitespace-pre ${fontSizeClass} text-gray-800 dark:text-gray-200 leading-relaxed pb-32`}>
                    {transposedContent.split('\n').map((line: string, i: number) => {
                        const parts = line.split(/(\[[^\]]+\])/g);
                        return (
                            <div key={i} className="leading-relaxed">
                                {parts.map((part: string, j: number) => {
                                    if (part.startsWith('[') && part.endsWith(']')) {
                                        const fullChord = part.slice(1, -1);
                                        const chordKey = `${i}-${j}`;
                                        return (
                                            <button
                                                key={j}
                                                onClick={() => !isEditingChordPositions && handleChordClick(fullChord)}
                                                onPointerDown={(event) => {
                                                    if (!isEditingChordPositions) return;
                                                    event.currentTarget.setPointerCapture(event.pointerId);
                                                    setDragStart({ key: chordKey, clientX: event.clientX, offset: chordOffsets[chordKey] || 0 });
                                                }}
                                                onPointerMove={(event) => {
                                                    if (!dragStart || dragStart.key !== chordKey) return;
                                                    setChordOffsets(current => ({ ...current, [chordKey]: Math.round(dragStart.offset + event.clientX - dragStart.clientX) }));
                                                }}
                                                onPointerUp={() => setDragStart(null)}
                                                className={`inline-block text-left text-blue-600 dark:text-blue-400 font-bold focus:outline-none ${isEditingChordPositions ? 'cursor-grab active:cursor-grabbing rounded bg-blue-100/70 px-0.5 dark:bg-blue-900/40' : 'cursor-pointer hover:underline'}`}
                                                style={{ transform: `translateX(${chordOffsets[chordKey] || 0}px)` }}
                                            >
                                                {fullChord}
                                            </button>
                                        );
                                    }
                                    return <span key={j}>{part}</span>;
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controles flotantes a la derecha */}
            <div
                className={`fixed right-3 sm:right-6 bottom-20 sm:bottom-8 flex flex-col items-center gap-2 transition-all duration-300 ${controlsOpacity} z-50`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    onClick={toggleFullscreen}
                    className="flex flex-col items-center gap-0.5 group"
                    aria-label="Pantalla completa"
                >
                    <div className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </div>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">
                        {isFullscreen ? 'Salir' : 'Pantalla'}
                    </span>
                </button>

                <button
                    onClick={handleToggleFavorite}
                    className="flex flex-col items-center gap-0.5 group"
                    aria-label="Favorito"
                >
                    <div className={`p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm transition ${isFavorite ? 'text-red-500' : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
                        }`}>
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
                    </div>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">
                        {isFavorite ? 'Favorita' : 'Me gusta'}
                    </span>
                </button>

                {isAuthenticated && (
                    <button
                        onClick={handleAddToList}
                        className="flex flex-col items-center gap-0.5 group"
                        aria-label="Agregar a lista"
                    >
                        <div className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-green-500 transition">
                            <ListPlus className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] text-gray-500 dark:text-gray-400">Lista</span>
                    </button>
                )}

                <div className="flex flex-col items-center gap-0.5">
                    <button
                        onClick={() => handleTranspose(-1)}
                        className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-gray-700 dark:text-gray-300 min-w-[16px] text-center">
                        {transpose === 0 ? '0' : `${transpose > 0 ? '+' : ''}${transpose}`}
                    </span>
                    <button
                        onClick={() => handleTranspose(1)}
                        className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] text-gray-400">Tono</span>
                </div>

                <button
                    onClick={handleFontSizeCycle}
                    className="flex flex-col items-center gap-0.5 group"
                >
                    <div className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition">
                        <Type className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">
                        {FONT_SIZE_LABELS[fontSize]}
                    </span>
                </button>

                <div className="relative flex flex-col items-center gap-0.5">
                    <button
                        onClick={() => setShowSongMenu(prev => !prev)}
                        className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition"
                        aria-label="Más acciones"
                        aria-expanded={showSongMenu}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">Más</span>

                    {showSongMenu && (
                        <div className="absolute right-10 bottom-0 w-52 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
                            <button
                                onClick={() => {
                                    setShowSongMenu(false);
                                    setIsEditingChordPositions(true);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Editar posición de notas
                            </button>
                            {canManageSong && <>
                            <button
                                onClick={() => {
                                    setShowSongMenu(false);
                                    router.push(`/canciones/${song.id}/editar`);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Edit className="w-4 h-4" /> Editar canción
                            </button>
                            <button
                                onClick={() => {
                                    setShowSongMenu(false);
                                    handleDelete();
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 className="w-4 h-4" /> Eliminar canción
                            </button>
                            </>}
                        </div>
                    )}
                </div>
            </div>

            <AddToSetlistModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                songId={Number(id)}
                songTitle={song.title}
                existingSetlists={userSetlists}
                currentTransposition={transpose}
                currentFontSize={fontSize}
                onSuccess={() => {
                    setShowAddModal(false);
                }}
            />

            {/* Modal para Acordes */}
            <ChordModal
                chord={selectedChord}
                chordName={selectedChordName}
                isOpen={isChordModalOpen}
                onClose={() => setIsChordModalOpen(false)}
                allowToggle={true}
                initialView="guitar"
            />
        </div>
    );
}
