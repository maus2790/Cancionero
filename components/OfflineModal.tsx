'use client';

import { useState } from 'react';
import { Download, WifiOff, X, CheckCircle, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { useOfflineMode } from '@/lib/hooks/useOfflineMode';
import { getAllSongsForOffline, getAllSetlistsForOffline, getAllFavoritesForOffline } from '@/app/actions/offline';
import { getAllChords } from '@/app/actions/chords';
import { 
    saveSongsOffline, 
    saveChordsOffline, 
    saveSetlistsOffline, 
    saveFavoritesOffline,
    clearAllOfflineData 
} from '@/lib/offline-db';
import toast from 'react-hot-toast';

export function OfflineModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { config, updateConfig, reload, isSectionOffline } = useOfflineMode();
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, text: '' });
    
    // Opciones locales del modal antes de guardar
    const [selectedSections, setSelectedSections] = useState({
        songs: isSectionOffline('songs'),
        chords: isSectionOffline('chords'),
        setlists: isSectionOffline('setlists'),
        favorites: isSectionOffline('favorites'),
    });

    if (!isOpen) return null;

    const hasData = config.isEnabled && config.lastSyncAt;

    const handleToggle = (section: keyof typeof selectedSections) => {
        setSelectedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleDownload = async () => {
        const sectionsToDownload = Object.entries(selectedSections)
            .filter(([_, isSelected]) => isSelected)
            .map(([key]) => key);

        if (sectionsToDownload.length === 0) {
            toast.error('Selecciona al menos una sección');
            return;
        }

        setDownloading(true);
        try {
            let step = 0;
            const totalSteps = sectionsToDownload.length;
            
            let songCount = 0;
            let chordCount = 0;
            let setlistCount = 0;
            let favoriteCount = 0;

            if (selectedSections.songs) {
                step++;
                setProgress({ current: step, total: totalSteps, text: 'Descargando canciones...' });
                const songs = await getAllSongsForOffline();
                await saveSongsOffline(songs);
                songCount = songs.length;
            } else {
                // TODO: Maybe clear offline songs if unchecked? Or keep them?
                // For now, if unchecked, we don't fetch.
            }

            if (selectedSections.chords) {
                step++;
                setProgress({ current: step, total: totalSteps, text: 'Descargando acordes...' });
                const chords = await getAllChords();
                await saveChordsOffline(chords);
                chordCount = chords.length;
            }

            if (selectedSections.setlists) {
                step++;
                setProgress({ current: step, total: totalSteps, text: 'Descargando repertorios...' });
                const setlists = await getAllSetlistsForOffline();
                await saveSetlistsOffline(setlists);
                setlistCount = setlists.length;
            }

            if (selectedSections.favorites) {
                step++;
                setProgress({ current: step, total: totalSteps, text: 'Descargando favoritos...' });
                const favorites = await getAllFavoritesForOffline();
                await saveFavoritesOffline(favorites);
                favoriteCount = favorites.length;
            }

            setProgress({ current: totalSteps, total: totalSteps, text: '¡Descarga completada!' });
            
            await updateConfig({
                isEnabled: true,
                sections: sectionsToDownload,
                lastSyncAt: Date.now(),
                songCount: selectedSections.songs ? songCount : config.songCount,
                chordCount: selectedSections.chords ? chordCount : config.chordCount,
                setlistCount: selectedSections.setlists ? setlistCount : config.setlistCount,
                favoriteCount: selectedSections.favorites ? favoriteCount : config.favoriteCount,
            });

            toast.success('Datos guardados para uso sin conexión');
            setTimeout(() => {
                setDownloading(false);
                onClose();
            }, 1000);
            
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error en la descarga');
            setDownloading(false);
        }
    };

    const handleClear = async () => {
        if (confirm('¿Estás seguro de que quieres eliminar los datos descargados? (Esto deshabilitará el modo offline)')) {
            await clearAllOfflineData();
            await reload();
            toast.success('Modo offline desactivado y datos eliminados');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="app-card w-full max-w-md rounded-2xl p-6 shadow-2xl">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${hasData ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                            <WifiOff className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-app">Modo Offline</h2>
                    </div>
                    {!downloading && (
                        <button onClick={onClose} className="p-2 text-app-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {downloading ? (
                    <div className="py-8 flex flex-col items-center">
                        <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                        <h3 className="font-semibold text-app mb-2">Descargando datos...</h3>
                        <p className="text-sm text-app-muted mb-6">{progress.text}</p>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-xs font-medium text-app-muted">{progress.current} de {progress.total} pasos</p>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-app-muted mb-6">
                            Descarga el contenido a tu dispositivo para acceder a tus canciones, acordes y setlists incluso cuando no tengas conexión a internet (los audios no se descargan).
                        </p>

                        <div className="space-y-3 mb-8">
                            <label className="flex items-center justify-between p-4 border rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-app">Canciones</span>
                                    {hasData && config.sections.includes('songs') && <span className="text-xs text-app-muted">{config.songCount} guardadas</span>}
                                </div>
                                <input type="checkbox" className="w-5 h-5 accent-cyan-600" checked={selectedSections.songs} onChange={() => handleToggle('songs')} />
                            </label>
                            
                            <label className="flex items-center justify-between p-4 border rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-app">Acordes</span>
                                    {hasData && config.sections.includes('chords') && <span className="text-xs text-app-muted">{config.chordCount} guardados</span>}
                                </div>
                                <input type="checkbox" className="w-5 h-5 accent-cyan-600" checked={selectedSections.chords} onChange={() => handleToggle('chords')} />
                            </label>

                            <label className="flex items-center justify-between p-4 border rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-app">Repertorios</span>
                                    {hasData && config.sections.includes('setlists') && <span className="text-xs text-app-muted">{config.setlistCount} guardados</span>}
                                </div>
                                <input type="checkbox" className="w-5 h-5 accent-cyan-600" checked={selectedSections.setlists} onChange={() => handleToggle('setlists')} />
                            </label>

                            <label className="flex items-center justify-between p-4 border rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-app">Favoritos</span>
                                    {hasData && config.sections.includes('favorites') && <span className="text-xs text-app-muted">{config.favoriteCount} guardados</span>}
                                </div>
                                <input type="checkbox" className="w-5 h-5 accent-cyan-600" checked={selectedSections.favorites} onChange={() => handleToggle('favorites')} />
                            </label>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleDownload}
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-cyan-500/30 transition flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                {hasData ? 'Actualizar datos' : 'Cargar para offline'}
                            </button>
                            
                            {hasData && (
                                <button 
                                    onClick={handleClear}
                                    className="w-full py-3 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Salir del modo offline (Limpiar datos)
                                </button>
                            )}
                        </div>
                        
                        {hasData && (
                            <p className="text-center text-xs text-app-muted mt-4">
                                Última actualización: {new Date(config.lastSyncAt!).toLocaleString()}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
