'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSetlistById, updateSongInSetlist } from '@/app/actions/setlists';
import { transposeChordPro } from '@/lib/chords';
import { useTitle } from '@/lib/TitleContext';
import { Type, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

const FONT_SIZES = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
};

const FONT_SIZE_LABELS = {
    small: 'S',
    medium: 'M',
    large: 'L',
    xlarge: 'XL',
};

export default function SetlistDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setTitle, setShowBack, setOnBack } = useTitle();
    const [setlist, setSetlist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef<number | null>(null);

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

    const handleTranspose = async (delta: number) => {
        if (!setlist) return;
        const currentSong = setlist.songs[currentSongIndex];
        const newTranspose = currentSong.transposition + delta;
        
        const updatedSongs = [...setlist.songs];
        updatedSongs[currentSongIndex].transposition = newTranspose;
        setSetlist({ ...setlist, songs: updatedSongs });
        makeVisible();

        try {
            await updateSongInSetlist(currentSong.id, { transposition: newTranspose });
        } catch (e) {
            console.error("Error transposing", e);
        }
    };

    const handleFontSizeCycle = async () => {
        if (!setlist) return;
        const currentSong = setlist.songs[currentSongIndex];
        const fontSizesArray = Object.keys(FONT_SIZES);
        const currentIndex = fontSizesArray.indexOf(currentSong.fontSize);
        const newFontSize = fontSizesArray[(currentIndex + 1) % fontSizesArray.length];

        const updatedSongs = [...setlist.songs];
        updatedSongs[currentSongIndex].fontSize = newFontSize;
        setSetlist({ ...setlist, songs: updatedSongs });
        makeVisible();

        try {
            await updateSongInSetlist(currentSong.id, { fontSize: newFontSize });
        } catch (e) {
            console.error("Error font size", e);
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

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || !setlist) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentSongIndex < setlist.songs.length - 1) {
                // Swipe izquierda → siguiente canción
                setCurrentSongIndex(i => i + 1);
            } else if (diff < 0 && currentSongIndex > 0) {
                // Swipe derecha → canción anterior
                setCurrentSongIndex(i => i - 1);
            }
        }
        touchStartX.current = null;
    };

    // Cargar la lista
    useEffect(() => {
        const loadSetlist = async () => {
            try {
                const data = await getSetlistById(Number(id));
                setSetlist(data);
                if (data.songs.length > 0) {
                    setCurrentSongIndex(0);
                    // Actualizar header con el título de la primera canción
                    setTitle(data.songs[0].song.title);
                } else {
                    setTitle('Lista vacía');
                }
                setLoading(false);
            } catch (err) {
                setError('No se pudo cargar la lista');
                setLoading(false);
            }
        };
        loadSetlist();
    }, [id, setTitle]);

    // Configurar el header para mostrar flecha de retroceso y el título dinámico
    useEffect(() => {
        setShowBack(true);
        setOnBack(() => router.push('/setlists'));
        return () => {
            setShowBack(false);
            setTitle('Cancionero');
        };
    }, [setShowBack, setOnBack, router, setTitle]);

    // Actualizar título cuando cambia la canción
    useEffect(() => {
        if (setlist && setlist.songs.length > 0 && setlist.songs[currentSongIndex]) {
            setTitle(setlist.songs[currentSongIndex].song.title);
        }
    }, [currentSongIndex, setlist, setTitle]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !setlist) {
        return (
            <div className="text-center py-12 text-red-500">{error || 'Lista no encontrada'}</div>
        );
    }

    const songs = setlist.songs;
    if (songs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 dark:text-gray-400">
                <p className="text-lg">Esta lista está vacía</p>
                <p className="text-sm">Agrega canciones desde la página de cada canción</p>
                <button
                    onClick={() => router.push('/canciones')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Ir a canciones
                </button>
            </div>
        );
    }

    const currentSong = songs[currentSongIndex];
    const transposedContent =
        currentSong.transposition !== 0
            ? transposeChordPro(currentSong.song.content, currentSong.transposition)
            : currentSong.song.content;
    const fontSizeClass =
        FONT_SIZES[currentSong.fontSize as keyof typeof FONT_SIZES] || 'text-base';

    return (
        <div className={`transition-all overflow-y-auto scroll-smooth ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900' : 'min-h-screen flex flex-col'}`}>
            {/* Barra de números (fija debajo del header) */}
            <div className="sticky top-0 z-40 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-2 overflow-x-auto">
                <div className="flex gap-1 justify-center min-w-max">
                    {songs.map((item: any, index: number) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentSongIndex(index)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition ${index === currentSongIndex
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido de la canción con soporte swipe */}
            <div
                className="flex-1 overflow-y-auto p-4 pb-20"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className={`max-w-4xl mx-auto whitespace-pre-wrap ${fontSizeClass}`}>
                    {transposedContent.split('\n').map((line: string, i: number) => {
                        const parts = line.split(/(\[[^\]]+\])/g);
                        return (
                            <div key={i} className="leading-relaxed">
                                {parts.map((part: string, j: number) => {
                                    if (part.startsWith('[') && part.endsWith(']')) {
                                        return (
                                            <span key={j} className="text-blue-600 dark:text-blue-400 font-bold">
                                                {part.slice(1, -1)}
                                            </span>
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
                className={`fixed right-3 sm:right-6 bottom-20 sm:bottom-8 flex flex-col items-center gap-3 transition-all duration-300 ${(isVisible || isHovering) ? 'opacity-100' : 'opacity-40'} z-50`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    onClick={toggleFullscreen}
                    className="flex flex-col items-center gap-0.5 group"
                    aria-label="Pantalla completa"
                >
                    <div className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition">
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {isFullscreen ? 'Salir' : 'Pantalla'}
                    </span>
                </button>

                <div className="flex flex-col items-center gap-0.5">
                    <button
                        onClick={() => handleTranspose(-1)}
                        className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-gray-700 dark:text-gray-300 min-w-[16px] text-center">
                        {currentSong.transposition === 0 ? '0' : `${currentSong.transposition > 0 ? '+' : ''}${currentSong.transposition}`}
                    </span>
                    <button
                        onClick={() => handleTranspose(1)}
                        className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="text-[9px] text-gray-400">Tono</span>
                </div>

                <button
                    onClick={handleFontSizeCycle}
                    className="flex flex-col items-center gap-0.5 group"
                >
                    <div className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition">
                        <Type className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {FONT_SIZE_LABELS[currentSong.fontSize as keyof typeof FONT_SIZE_LABELS] || 'M'}
                    </span>
                </button>
            </div>
        </div>
    );
}