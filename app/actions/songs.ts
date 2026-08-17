'use server';

import crypto from 'crypto';
import { db } from '@/db';
import { songs, favorites, setlistSongs } from '@/db/schema';
import { eq, and, or, like, asc, desc, count, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import { uploadFile, generateAudioKey, deleteFile, getSignedUploadUrl } from '@/lib/r2';
import { canCreateContent, canManageContent } from '@/lib/permissions';

// ============================================================
// OBTENER CANCIONES CON FILTROS
// ============================================================
export async function getSongs(
    search?: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
        artist?: string;
        key?: string;
        style?: string;
        mine?: boolean;
    }
) {
    const offset = (page - 1) * limit;
    const conditions = [];

    const user = await getCurrentUser();
    if (filters?.mine) {
        if (!user) return { items: [], total: 0, totalPages: 0, page, limit };
        conditions.push(eq(songs.userId, user.id));
    } else if (user) {
        conditions.push(or(eq(songs.isPublic, true), eq(songs.userId, user.id)));
    } else {
        conditions.push(eq(songs.isPublic, true));
    }

    if (search) {
        conditions.push(like(songs.title, `%${search}%`));
    }

    if (filters?.artist) {
        conditions.push(eq(songs.artist, filters.artist));
    }

    if (filters?.key) {
        conditions.push(eq(songs.key, filters.key));
    }

    if (filters?.style) {
        conditions.push(eq(songs.style, filters.style));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Contar total
    const totalResult = await db
        .select({ count: count() })
        .from(songs)
        .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Obtener canciones ordenadas alfabéticamente por título
    const items = await db
        .select()
        .from(songs)
        .where(whereClause)
        .orderBy(asc(songs.title))
        .limit(limit)
        .offset(offset);

    // Obtener favoritos del usuario actual (si está autenticado)
    let favoriteIds = new Set<number>();
    try {
        if (user) {
            const userFavs = await db
                .select({ songId: favorites.songId })
                .from(favorites)
                .where(eq(favorites.userId, user.id));
            favoriteIds = new Set(userFavs.map(f => f.songId));
        }
    } catch {}

    return {
        items: items.map(song => ({ ...song, isFavorite: favoriteIds.has(song.id) })),
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
    };
}

export async function hasUserSongs() {
    const user = await getCurrentUser();
    if (!user || user.provider === 'guest') return false;

    const result = await db
        .select({ count: count() })
        .from(songs)
        .where(eq(songs.userId, user.id));

    return (result[0]?.count || 0) > 0;
}


// ============================================================
// OBTENER UNA CANCIÓN POR ID
// ============================================================
export async function getSongById(id: number) {
    const result = await db.select().from(songs).where(eq(songs.id, id));
    const song = result[0];
    if (!song) return null;
    if (!song.isPublic) {
        const user = await getCurrentUser();
        if (!user || (user.role !== 'admin' && song.userId !== user.id)) return null;
    }
    return song;
}

// ============================================================
// OBTENER LISTA DE ARTISTAS ÚNICOS
// ============================================================
export async function getArtists() {
    const result = await db
        .select({ artist: songs.artist })
        .from(songs)
        .where(eq(songs.isPublic, true))
        .groupBy(songs.artist)
        .orderBy(asc(songs.artist));

    return result.map(r => r.artist).filter(Boolean);
}

// ============================================================
// OBTENER LISTA DE ESTILOS ÚNICOS
// ============================================================
export async function getStyles() {
    const result = await db
        .select({ style: songs.style })
        .from(songs)
        .where(eq(songs.isPublic, true))
        .groupBy(songs.style)
        .orderBy(asc(songs.style));

    return result.map(r => r.style).filter(Boolean);
}

// ============================================================
// OBTENER CANCIONES POR LETRA INICIAL
// ============================================================
export async function getSongsByLetter(letter: string) {
    const result = await db
        .select()
        .from(songs)
        .where(
            and(
                eq(songs.isPublic, true),
                like(songs.title, `${letter}%`)
            )
        )
        .orderBy(asc(songs.title));

    return result;
}

// ============================================================
// GUARDAR CANCIÓN (CREAR O EDITAR)
// ============================================================
export async function saveSong(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');
    if (!canCreateContent(user)) throw new Error('No tienes permisos para crear o modificar canciones');

    const id = formData.get('id') ? Number(formData.get('id')) : undefined;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const keyNote = formData.get('key') as string;
    const key = keyNote ? `${keyNote}${formData.get('keyMode') === 'minor' ? 'm' : ''}` : '';
    const style = formData.get('style') as string;
    const content = formData.get('content') as string;
    // El catálogo nuevo es compartido; las canciones recién creadas siempre son públicas.
    const isPublic = id ? formData.get('isPublic') === 'true' : true;
    const audioUrl = formData.get('audioUrl') as string | null;
    const removeAudio = formData.get('removeAudio') === 'true';
    const videoUrl = formData.get('videoUrl') as string | null;

    if (!title || !content) {
        return { error: 'Título y contenido son obligatorios' };
    }

    let insertedId = id;

    if (id) {
        // Obtenemos la canción actual para borrar el audio viejo si es necesario
        const existingResult = await db.select({ audioUrl: songs.audioUrl, userId: songs.userId, isPublic: songs.isPublic }).from(songs).where(eq(songs.id, id));
        const existingSong = existingResult[0];
        if (!existingSong || !canManageContent(user, existingSong.userId, existingSong.isPublic ?? false)) {
            throw new Error('No autorizado');
        }
        const existingAudioUrl = existingSong.audioUrl;

        let finalAudioUrl: string | null | undefined = undefined;

        if (removeAudio || audioUrl) {
            if (existingAudioUrl && existingAudioUrl !== audioUrl) {
                try {
                    // Extraer key de la URL, asumiendo formato url/music/archivo.mp3
                    const parts = existingAudioUrl.split('/');
                    const key = parts.slice(-2).join('/');
                    if (key.startsWith('music/')) {
                        await deleteFile(key);
                    }
                } catch (e) {
                    console.error("Error al eliminar audio antiguo", e);
                }
            }
            if (removeAudio) {
                finalAudioUrl = null;
            }
        }
        
        if (audioUrl) {
            finalAudioUrl = audioUrl;
        }

        await db
            .update(songs)
            .set({
                title,
                artist: artist || null,
                key: key || null,
                style: style || null,
                content,
                isPublic,
                videoUrl: videoUrl || null,
                ...(finalAudioUrl !== undefined ? { audioUrl: finalAudioUrl } : {}),
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(songs.id, id));
    } else {
        const result = await db.insert(songs).values({
            title,
            artist: artist || null,
            key: key || null,
            style: style || null,
            content,
            isPublic,
            videoUrl: videoUrl || null,
            userId: user.id,
        }).returning({ id: songs.id });
        insertedId = result[0].id;
    }

    // Subir nuevo audio si existe (Logica antigua eliminada)
    if (audioUrl && !id && insertedId) {
        // En caso de creación nueva, agregamos la URL generada en el paso previo
        await db.update(songs).set({ audioUrl }).where(eq(songs.id, insertedId));
    }

    revalidatePath('/canciones');
    return { success: true, action: id ? 'updated' : 'created', id: insertedId };
}

// ============================================================
// OBTENER URL FIRMADA PARA SUBIDA DIRECTA
// ============================================================
export async function getDirectUploadUrl(prefix: string, extension: string, contentType: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');
    if (!canCreateContent(user)) throw new Error('No autorizado');
    
    const hash = crypto.randomBytes(16).toString('hex');
    const key = `${prefix}/${Date.now()}-${hash}.${extension}`;
    
    const uploadUrl = await getSignedUploadUrl(key, contentType);
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;
    const publicUrl = `${R2_PUBLIC_URL}/${key}`;
    
    return { uploadUrl, publicUrl };
}

// ============================================================
// ELIMINAR CANCIÓN
// ============================================================
export async function deleteSong(id: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const song = await getSongById(id);
    if (!song || !canManageContent(user, song.userId, song.isPublic ?? false)) throw new Error('No autorizado');

    if (song.audioUrl) {
        try {
            const parts = song.audioUrl.split('/');
            const key = parts.slice(-2).join('/');
            if (key.startsWith('music/')) {
                await deleteFile(key);
            }
        } catch (e) {
            console.error("Error al eliminar audio antiguo", e);
        }
    }

    // Eliminar las relaciones de clave foránea antes de eliminar la canción
    await db.delete(setlistSongs).where(eq(setlistSongs.songId, id));
    await db.delete(favorites).where(eq(favorites.songId, id));
    
    await db.delete(songs).where(eq(songs.id, id));
    revalidatePath('/canciones');
    return { success: true };
}

// Las posiciones se comparten: cualquier usuario autenticado puede ajustar
// la lectura de acordes de una canción para todos los demás.
export async function updateChordPositions(songId: number, positions: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    try {
        const parsed = JSON.parse(positions);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Formato inválido');
    } catch {
        throw new Error('Posiciones inválidas');
    }

    await db.update(songs)
        .set({ chordPositions: positions, updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(songs.id, songId));
    revalidatePath(`/canciones/${songId}`);
}

// ============================================================
// FAVORITOS
// ============================================================
export async function toggleFavorite(songId: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const existing = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, user.id), eq(favorites.songId, songId)));

    if (existing.length > 0) {
        await db.delete(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.songId, songId)));
    } else {
        await db.insert(favorites).values({ userId: user.id, songId });
    }
    revalidatePath('/canciones');
    revalidatePath(`/canciones/${songId}`);
}

// ============================================================
// VERIFICAR FAVORITO
// ============================================================
export async function isFavorite(songId: number) {
    const user = await getCurrentUser();
    if (!user) return false;

    const existing = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, user.id), eq(favorites.songId, songId)));

    return existing.length > 0;
}

// ============================================================
// OBTENER CANCIONES FAVORITAS DEL USUARIO
// ============================================================
export async function getFavoriteSongs() {
    const user = await getCurrentUser();
    if (!user) return [];

    const result = await db
        .select({
            id: songs.id,
            title: songs.title,
            artist: songs.artist,
            key: songs.key,
            style: songs.style,
            isPublic: songs.isPublic,
            audioUrl: songs.audioUrl,
        })
        .from(favorites)
        .innerJoin(songs, eq(favorites.songId, songs.id))
        .where(eq(favorites.userId, user.id))
        .orderBy(asc(songs.title));

    return result;
}

// ============================================================
// ESTADÍSTICAS PARA EL DASHBOARD
// ============================================================
export async function getDashboardStats() {
    const user = await getCurrentUser();

    // Contar canciones públicas
    const [songsCount] = await db
        .select({ count: count() })
        .from(songs)
        .where(eq(songs.isPublic, true));

    // Contar favoritos del usuario (si está autenticado)
    let favoritesCount = 0;
    if (user) {
        const [favResult] = await db
            .select({ count: count() })
            .from(favorites)
            .where(eq(favorites.userId, user.id));
        favoritesCount = favResult?.count ?? 0;
    }

    return {
        songs: songsCount?.count ?? 0,
        favorites: favoritesCount,
    };
}

