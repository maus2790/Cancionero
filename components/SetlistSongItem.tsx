'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SongWithConfig } from '@/types/index';
import { ChevronUp, ChevronDown, Trash2, Settings } from 'lucide-react';
import { updateSongInSetlist } from '@/app/actions/setlists';
import { ConfigControls } from './ConfigControls';

interface SetlistSongItemProps {
    song: SongWithConfig;
    index: number;
    total: number;
    allIds: number[];
    onReorder: (newOrder: number[]) => void;
    onRemove: (id: number) => void;
    onUpdate: () => void;
}

export function SetlistSongItem({
    song,
    index,
    total,
    allIds,
    onReorder,
    onRemove,
    onUpdate,
}: SetlistSongItemProps) {
    const [showConfig, setShowConfig] = useState(false);
    const [transposition, setTransposition] = useState(song.transposition || 0);
    const [fontSize, setFontSize] = useState(song.fontSize || 'medium');
    const [updating, setUpdating] = useState(false);

    const handleMoveUp = () => {
        if (index === 0) return;
        const newOrder = [...allIds];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        onReorder(newOrder);
    };

    const handleMoveDown = () => {
        if (index === total - 1) return;
        const newOrder = [...allIds];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        onReorder(newOrder);
    };

    const handleSaveConfig = async () => {
        setUpdating(true);
        try {
            await updateSongInSetlist(song.id, { transposition, fontSize });
            onUpdate();
            setShowConfig(false);
        } catch (error) {
            console.error('Error actualizando configuración:', error);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-4">
                {/* Botones de reordenamiento */}
                <div className="flex flex-col gap-0.5">
                    <button
                        onClick={handleMoveUp}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition disabled:opacity-30"
                    >
                        <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                        onClick={handleMoveDown}
                        disabled={index === total - 1}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition disabled:opacity-30"
                    >
                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Información de la canción */}
                <div className="flex-1 min-w-0">
                    <Link
                        href={`/canciones/${song.songId}`}
                        className="font-medium text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                        {song.title}
                    </Link>
                    {song.artist && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{song.artist}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs">
                        {song.transposition !== 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                Tono: {song.transposition > 0 ? `+${song.transposition}` : song.transposition}
                            </span>
                        )}
                        {song.fontSize && song.fontSize !== 'medium' && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                                {song.fontSize}
                            </span>
                        )}
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        aria-label="Configurar canción"
                    >
                        <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                        onClick={() => onRemove(song.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition"
                        aria-label="Eliminar de lista"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                </div>
            </div>

            {/* Panel de configuración expandible */}
            {showConfig && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <ConfigControls
                        transposition={transposition}
                        fontSize={fontSize as any}
                        onTranspositionChange={setTransposition}
                        onFontSizeChange={setFontSize}
                        label="Configuración para esta canción"
                    />
                    <div className="flex justify-end gap-3 mt-3">
                        <button
                            onClick={() => setShowConfig(false)}
                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveConfig}
                            disabled={updating}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                            {updating ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}