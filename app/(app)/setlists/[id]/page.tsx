'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSetlistById } from '@/app/actions/setlists';
import { transposeChordPro } from '@/lib/chords';
import { useTitle } from '@/lib/TitleContext';

// Mapeo de tamaños de fuente
const FONT_SIZES = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
};

export default function SetlistDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setTitle, setShowBack, setOnBack } = useTitle();
    const [setlist, setSetlist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [error, setError] = useState('');

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
        setOnBack(() => () => router.push('/setlists'));
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
        <div className="min-h-screen flex flex-col">
            {/* Barra de números (fija debajo del header) */}
            <div className="sticky top-16 z-40 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-2 overflow-x-auto">
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

            {/* Contenido de la canción */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
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
        </div>
    );
}