'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserSetlists, deleteSetlist, updateSetlist } from '@/app/actions/setlists';
import Link from 'next/link';
import { Edit, Trash2, Plus, Music, X } from 'lucide-react';
import { useTitle } from '@/lib/TitleContext';

export default function SetlistsPage() {
  const router = useRouter();
  const { setTitle, setShowBack } = useTitle();
  const [setlists, setSetlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingList, setEditingList] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadSetlists = async () => {
    const data = await getUserSetlists();
    setSetlists(data);
    setLoading(false);
  };

  useEffect(() => {
    setTitle('Mis Setlists');
    setShowBack(false);
    loadSetlists();
  }, [setTitle, setShowBack]);

  const handleEdit = (list: any) => {
    setEditingList(list);
    setEditName(list.name);
    setEditDescription(list.description || '');
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingList) return;
    await updateSetlist(editingList.id, { name: editName, description: editDescription });
    setShowModal(false);
    await loadSetlists();
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta lista?')) {
      await deleteSetlist(id);
      await loadSetlists();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:pb-6">

      {setlists.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No tienes listas aún. Crea una nueva.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {setlists.map((list) => (
            <div
              key={list.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition cursor-pointer group relative"
            >
              <div
                onClick={() => router.push(`/setlists/${list.id}`)}
                className="block p-4"
              >
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{list.name}</h3>
                {list.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {list.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">{list.songCount || 0} canciones</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(list);
                  }}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition opacity-0 group-hover:opacity-100"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleDelete(list.id);
                  }}
                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón flotante para nueva lista */}
      <button
        onClick={() => router.push('/setlists/nueva')}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal de edición */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Editar lista</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}