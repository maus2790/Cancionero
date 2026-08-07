'use client';

import Link from 'next/link';
import { Heart, ListPlus, Play, Pause } from 'lucide-react';

interface SongCardProps {
    song: {
        id: number;
        title: string;
        artist?: string | null;
        key?: string | null;
        style?: string | null;
        isPublic?: boolean | null;
        audioUrl?: string | null;
    };
    playingId: number | null;
    onPlayPause: (song: any) => void;
    isFavorite?: boolean;
    onToggleFavorite?: (songId: number) => void;
    onAddToList: (songId: number, songTitle: string) => void;
}

export function SongCard({ song, playingId, onPlayPause, isFavorite, onToggleFavorite, onAddToList }: SongCardProps) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition border p-4 ${!song.isPublic ? 'border-yellow-400 dark:border-yellow-600 ring-1 ring-yellow-200 dark:ring-yellow-900/50' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-start justify-between gap-3">
                <Link href={`/canciones/${song.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-800 dark:text-white truncate">
                        {song.title}
                    </h3>
                    {song.artist && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {song.artist}
                        </p>
                    )}
                    <div className="flex gap-2 mt-1 flex-wrap">
                        {song.key && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                {song.key}
                            </span>
                        )}
                        {song.style && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                                {song.style}
                            </span>
                        )}
                        {!song.isPublic && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                                Privada
                            </span>
                        )}
                    </div>
                </Link>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {song.audioUrl && (
                        <button
                            onClick={() => onPlayPause(song)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            title={playingId === song.id ? 'Pausar' : 'Reproducir'}
                        >
                            {playingId === song.id ? (
                                <Pause className="w-5 h-5 text-blue-500" />
                            ) : (
                                <Play className="w-5 h-5 text-gray-400 hover:text-blue-500 transition" />
                            )}
                        </button>
                    )}
                    {onToggleFavorite && (
                        <button
                            onClick={() => onToggleFavorite(song.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        >
                            <Heart className={`w-5 h-5 transition ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                        </button>
                    )}
                    <button
                        onClick={() => onAddToList(song.id, song.title)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Agregar a lista"
                    >
                        <ListPlus className="w-5 h-5 text-gray-400 hover:text-blue-500 transition" />
                    </button>
                </div>
            </div>
        </div>
    );
}
