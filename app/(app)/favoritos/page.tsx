'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFavoriteSongs, toggleFavorite } from '@/app/actions/songs';
import { useTitle } from '@/lib/TitleContext';
import { Heart } from 'lucide-react';
import { AddToSetlistModal } from '@/components/AddToSetlistModal';
import { getUserSetlists } from '@/app/actions/setlists';
import { getCurrentUser } from '@/app/actions/auth';
import { SongCard } from '@/components/SongCard';
import { useAudioCleanup } from '@/hooks/useAudioCleanup';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const router = useRouter();
  const { setTitle, setShowBack } = useTitle();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userSetlists, setUserSetlists] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [selectedSongTitle, setSelectedSongTitle] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  useAudioCleanup(audioRef);

  useEffect(() => {
    setTitle('Canciones Favoritas');
    setShowBack(false);
    loadData();
  }, [setTitle, setShowBack]);

  const loadData = async () => {
    setLoading(true);
    // Verificar autenticación
    const user = await getCurrentUser();
    setIsAuthenticated(!!user);

    if (user) {
      const [favs, lists] = await Promise.all([
        getFavoriteSongs(),
        getUserSetlists().catch(() => [])
      ]);
      setFavorites(favs);
      setUserSetlists(lists);
    }
    setLoading(false);
  };

  const handleRemoveFavorite = async (songId: number) => {
    try {
      await toggleFavorite(songId);
      const updated = await getFavoriteSongs();
      setFavorites(updated);
      toast.success('Eliminada de favoritos');
    } catch {
      toast.error('No se pudo actualizar favoritos');
    }
  };

  const handleAddToList = (songId: number, songTitle: string) => {
    setSelectedSongId(songId);
    setSelectedSongTitle(songTitle);
    setShowAddModal(true);
  };

  const handlePlayPause = (song: any) => {
    if (!song.audioUrl) return;
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

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Inicia sesión</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Debes iniciar sesión para ver tus canciones favoritas.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Ir a login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Sin favoritos</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          No tienes canciones favoritas aún.
        </p>
        <button
          onClick={() => router.push('/canciones')}
          className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Explorar canciones
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Favoritos ({favorites.length})
        </h2>
      </div>

      <div className="grid gap-3">
        {favorites.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            playingId={playingId}
            onPlayPause={handlePlayPause}
            isFavorite={true}
            onToggleFavorite={handleRemoveFavorite}
            onAddToList={handleAddToList}
          />
        ))}
      </div>

      {/* Modal para agregar a setlist */}
      {selectedSongId && (
        <AddToSetlistModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          songId={selectedSongId}
          songTitle={selectedSongTitle}
          existingSetlists={userSetlists}
          currentTransposition={0}
          currentFontSize="medium"
          onSuccess={() => {
            setShowAddModal(false);
            // Recargar favoritos para actualizar si cambió algo
            loadData();
          }}
        />
      )}
    </div>
  );
}
