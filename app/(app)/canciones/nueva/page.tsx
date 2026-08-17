'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { saveSong, getDirectUploadUrl } from '@/app/actions/songs';
import { Clipboard, ClipboardCheck, Music, X } from 'lucide-react';
import { useTitle } from '@/lib/TitleContext';
import { NOTES } from '@/lib/constants';
import toast from 'react-hot-toast';

const STYLE_OPTIONS = ['', 'Gozo', 'Adoración', 'Contemporánea', 'Alabanza', 'Balada', 'Ritmo', 'Tradicional', 'Otros'];

const EXAMPLE_CONTENT = `Intro: [Gmaj7]-[A9]-[Bm7]-[A9]

[D]                         [D/C#]
A quién iré en necesidad
[Bm]                        [A9/F#]
A quién iré en busca de paz
[G]                                [D]    [A9]
Y quién podrá mi vida saciar de verdaaaa-ad

CORO:
[D]               [A9/F#]      [G]
Cristo a donde más podría ir`;

export default function NewSongPage() {
    const router = useRouter();
    const { setTitle, setOnBack, setShowBack } = useTitle();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [content, setContent] = useState('');
    const [pasted, setPasted] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle('Nueva Canción');
        setShowBack(true);
        setOnBack(() => router.push('/canciones'));
    }, [setTitle, setOnBack, setShowBack, router]);

    // Clean up the object URL when the component unmounts
    useEffect(() => {
        return () => {
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        };
    }, [audioPreviewUrl]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (audioFile && audioFile.size > 20 * 1024 * 1024) {
            setError('El archivo de audio es demasiado grande. El límite máximo es 20 MB.');
            setLoading(false);
            return;
        }

        if (audioFile && !audioFile.type.startsWith('audio/') && !audioFile.name.toLowerCase().endsWith('.mpeg')) {
            setError('Por favor, selecciona un archivo de audio válido (no se permiten videos).');
            setLoading(false);
            return;
        }

        const formData = new FormData(e.currentTarget);
        
        try {
            if (audioFile) {
                const ext = audioFile.name.split('.').pop() || 'mp3';
                const { uploadUrl, publicUrl } = await getDirectUploadUrl('music', ext, audioFile.type);
                
                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: audioFile,
                    headers: {
                        'Content-Type': audioFile.type,
                    },
                });

                if (!uploadResponse.ok) {
                    throw new Error('Error al subir el archivo de audio directamente a la nube.');
                }

                formData.set('audioUrl', publicUrl);
            }

            const result = await saveSong(formData);
            if (result?.error) {
                setError(result.error);
                setLoading(false);
            } else {
                toast.success('Canción creada correctamente');
                router.push('/canciones');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al guardar la canción. Es posible que el archivo sea demasiado grande o haya un problema de conexión.');
            setLoading(false);
        }
    }

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        if (file) {
            setAudioFile(file);
            setAudioPreviewUrl(URL.createObjectURL(file));
        } else {
            setAudioFile(null);
            setAudioPreviewUrl(null);
        }
    };

    const handleRemoveAudio = () => {
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioFile(null);
        setAudioPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

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
        } catch {
            alert('No se pudo acceder al portapapeles. Asegúrate de permitir el permiso.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24 sm:pb-8">
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {/* Título y Artista */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Título *
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombre de la canción"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Artista
                        </label>
                        <input
                            type="text"
                            name="artist"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Artista o banda"
                        />
                    </div>
                </div>

                {/* Tonalidad y Estilo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tonalidad
                        </label>
                        <select
                            name="key"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Seleccionar</option>
                            {NOTES.map(note => (
                                <option key={note} value={note}>{note}</option>
                            ))}
                        </select>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="keyMode" value="major" defaultChecked className="text-blue-600" /> Mayor
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="keyMode" value="minor" className="text-blue-600" /> Menor
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estilo
                        </label>
                        <select
                            name="style"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            {STYLE_OPTIONS.map(style => (
                                <option key={style} value={style}>{style || 'Sin estilo'}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Audio */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Archivo de Audio (Opcional)
                    </label>

                    {audioPreviewUrl ? (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <audio src={audioPreviewUrl} controls className="flex-1 h-10" />
                            <button
                                type="button"
                                onClick={handleRemoveAudio}
                                className="shrink-0 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                title="Quitar audio"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="audio"
                            accept="audio/*,.mpeg,.mp3,.wav,.ogg,.m4a"
                            onChange={handleAudioChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                        />
                    )}
                </div>

                {/* Video */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL del Video (YouTube, etc.)
                    </label>
                    <input
                        type="url"
                        name="videoUrl"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                </div>

                {/* Contenido */}
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

                {/* Visibilidad */}
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">✓</span>
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Canción pública (visible para todos)
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? 'Guardando...' : 'Guardar Canción'}
                </button>
            </form>
        </div>
    );
}
