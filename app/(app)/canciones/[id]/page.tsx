'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSongById, toggleFavorite, deleteSong } from '@/app/actions/songs';
import { getChordByNameExact } from '@/app/actions/chords';
import { getUserSetlists } from '@/app/actions/setlists';
import { AddToSetlistModal } from '@/components/AddToSetlistModal';
import ChordModal from '@/components/ChordModal';
import { transposeChordPro } from '@/lib/chords';
import { Heart, Trash2, Edit, ListPlus, Type, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2 } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser } from '@/app/actions/auth';
import { useTitle } from '@/lib/TitleContext';

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
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
            setIsAuthenticated(!!user);
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
            setTitle('Cancionero');
            setShowBack(false);
            setHeaderRight(null);
        };
    }, [song, setTitle, setShowBack, setOnBack, setHeaderRight, router]);

    useEffect(() => {
        if (song && song.audioUrl) {
            setHeaderRight(
                <button
                    onClick={() => {
                        if (audioRef.current) {
                            if (audioRef.current.paused) {
                                audioRef.current.play();
                            } else {
                                audioRef.current.pause();
                            }
                        }
                    }}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center justify-center"
                    aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
            );
        } else {
            setHeaderRight(null);
        }
    }, [song, isPlaying, setHeaderRight]);

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
        await toggleFavorite(Number(id));
        setIsFavorite(!isFavorite);
        makeVisible();
    };

    const handleDelete = async () => {
        if (confirm('¿Estás seguro de eliminar esta canción?')) {
            await deleteSong(Number(id));
            router.push('/canciones');
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

    const handleRateChange = (rate: number) => {
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

            {song.audioUrl && isPlaying && (
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
                        <span className="text-xs text-gray-500 font-medium">Velocidad:</span>
                        {[0.5, 1, 1.5, 2].map(rate => (
                            <button
                                key={rate}
                                onClick={() => handleRateChange(rate)}
                                className={`px-2 py-1 text-xs rounded-md font-semibold transition ${playbackRate === rate ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            >
                                {rate}x
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
                <div className={`max-w-3xl w-full whitespace-pre-wrap ${fontSizeClass} text-gray-800 dark:text-gray-200 leading-relaxed pb-32`}>
                    {transposedContent.split('\n').map((line: string, i: number) => {
                        const parts = line.split(/(\[[^\]]+\])/g);
                        return (
                            <div key={i} className="leading-relaxed">
                                {parts.map((part: string, j: number) => {
                                    if (part.startsWith('[') && part.endsWith(']')) {
                                        const fullChord = part.slice(1, -1);
                                        return (
                                            <button
                                                key={j}
                                                onClick={() => handleChordClick(fullChord)}
                                                className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer focus:outline-none"
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

                <Link
                    href={`/canciones/${song.id}/editar`}
                    className="flex flex-col items-center gap-0.5 group"
                >
                    <div className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition">
                        <Edit className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">Editar</span>
                </Link>

                <button
                    onClick={handleDelete}
                    className="flex flex-col items-center gap-0.5 group"
                >
                    <div className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">Eliminar</span>
                </button>
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