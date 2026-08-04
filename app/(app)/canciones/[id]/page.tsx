'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSongById, toggleFavorite, deleteSong } from '@/app/actions/songs';
import { getUserSetlists } from '@/app/actions/setlists';
import { AddToSetlistModal } from '@/components/AddToSetlistModal';
import { transposeChordPro } from '@/lib/chords';
import { Heart, Trash2, Edit, ListPlus, Type, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const { setTitle, setShowBack, setOnBack } = useTitle();
    const [song, setSong] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [transpose, setTranspose] = useState(0);
    const [fontSizeIndex, setFontSizeIndex] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [userSetlists, setUserSetlists] = useState<any[]>([]);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
            setOnBack(() => () => router.push('/canciones'));
        }
        return () => {
            setTitle('Cancionero');
            setShowBack(false);
        };
    }, [song, setTitle, setShowBack, setOnBack, router]);

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
        <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth">
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
                <div className={`max-w-3xl w-full whitespace-pre-wrap ${fontSizeClass} text-gray-800 dark:text-gray-200 leading-relaxed`}>
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
                className={`fixed right-3 sm:right-6 bottom-20 sm:bottom-8 flex flex-col items-center gap-3 transition-all duration-300 ${controlsOpacity}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    onClick={handleToggleFavorite}
                    className="flex flex-col items-center gap-0.5 group"
                    aria-label="Favorito"
                >
                    <div className={`p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm transition ${isFavorite ? 'text-red-500' : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
                        }`}>
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {isFavorite ? 'Favorita' : 'Me gusta'}
                    </span>
                </button>

                {isAuthenticated && (
                    <button
                        onClick={handleAddToList}
                        className="flex flex-col items-center gap-0.5 group"
                        aria-label="Agregar a lista"
                    >
                        <div className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-green-500 transition">
                            <ListPlus className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Lista</span>
                    </button>
                )}

                <div className="flex flex-col items-center gap-0.5">
                    <button
                        onClick={() => handleTranspose(-1)}
                        className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300 min-w-[16px] text-center">
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
                    <div className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition">
                        <Type className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {FONT_SIZE_LABELS[fontSize]}
                    </span>
                </button>

                <Link
                    href={`/canciones/${song.id}/editar`}
                    className="flex flex-col items-center gap-0.5 group"
                >
                    <div className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition">
                        <Edit className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Editar</span>
                </Link>

                <button
                    onClick={handleDelete}
                    className="flex flex-col items-center gap-0.5 group"
                >
                    <div className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-red-500 transition">
                        <Trash2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Eliminar</span>
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
        </div>
    );
}