'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getSongById, saveSong } from '@/app/actions/songs';
import { ArrowLeft, Clipboard, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STYLE_OPTIONS = ['', 'Gozo', 'Adoración', 'Contemporánea', 'Alabanza', 'Balada', 'Ritmo', 'Tradicional', 'Otros'];

const EXAMPLE_CONTENT = `Intro: [Gmaj7]-[A9]-[Bm7]-[A9]

[D]                         [D/C#]
A quién iré en necesidad
[Bm]                        [A9/F#]
A quién iré en busca de paz
[G]                                [D]    [A9]
Y quién podrá mi vida saciar de verdaaaa-ad
[D]                              [D/C#]
Quién mas tendrá de mi compasión
[Bm]                     [A9/F#]
Y entenderá mi corazón
[G]                                [D]     [A9]
Quién cambiará mi eternidad sino Tú Jesús

CORO:
[D]               [A9/F#]      [G]
Cristo a donde más podría ir
[D]               [A9/F#]             [G]   [D/F#]
Cristo que otro lugar puede exsistir
[Em]                             [A9/F#]
Sólo tu tiene palabras de Amor
[G]                              [A9]
Camino al Padre y verdad eres Tú
[D]                [A9/F#]     [G]
Cristo adonde más podría ir

PUENTE:
[A9]-[Ab9/A#]-[Bm7]-[A9]-[G]-[A9]-[Ab9/A#]-[Bm7]-[A9]...[D]`;

export default function EditSongPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [song, setSong] = useState<any>(null);
    const [content, setContent] = useState('');
    const [pasted, setPasted] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const loadSong = async () => {
            const data = await getSongById(Number(id));
            if (!data) {
                router.push('/canciones');
                return;
            }
            setSong(data);
            setContent(data.content || '');
            setLoading(false);
        };
        loadSong();
    }, [id]);

    async function handleSubmit(formData: FormData) {
        setSaving(true);
        setError('');
        formData.append('id', String(id));
        const result = await saveSong(formData);
        if (result?.error) {
            setError(result.error);
            setSaving(false);
        } else {
            router.push('/canciones');
        }
    }

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setContent(text);
                setPasted(true);
                setTimeout(() => setPasted(false), 3000);
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(text.length, text.length);
                }
            }
        } catch (err) {
            alert('No se pudo acceder al portapapeles. Asegúrate de permitir el permiso.');
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    if (!song) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24 sm:pb-8">
            <div className="flex items-center gap-4 mb-6">
                <Link href={`/canciones/${id}`} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Editar Canción</h2>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            <form action={handleSubmit} className="space-y-5 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Título *
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            defaultValue={song.title}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Artista
                        </label>
                        <input
                            type="text"
                            name="artist"
                            defaultValue={song.artist || ''}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tonalidad
                        </label>
                        <select
                            name="key"
                            defaultValue={song.key || ''}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Seleccionar</option>
                            {NOTES.map(note => (
                                <option key={note} value={note}>{note}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estilo
                        </label>
                        <select
                            name="style"
                            defaultValue={song.style || ''}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            {STYLE_OPTIONS.map(style => (
                                <option key={style} value={style}>{style || 'Sin estilo'}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contenido (formato ChordPro) *
                        </label>
                        <button
                            type="button"
                            onClick={handlePasteFromClipboard}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                        >
                            {pasted ? (
                                <>
                                    <ClipboardCheck className="w-4 h-4" />
                                    Pegado ✓
                                </>
                            ) : (
                                <>
                                    <Clipboard className="w-4 h-4" />
                                    Pegar desde portapapeles
                                </>
                            )}
                        </button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        name="content"
                        required
                        rows={15}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder={EXAMPLE_CONTENT}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="isPublic"
                        value="true"
                        defaultChecked={song.isPublic}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Canción pública (visible para todos)
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                    {saving ? 'Guardando...' : 'Actualizar Canción'}
                </button>
            </form>
        </div>
    );
}