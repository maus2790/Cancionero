'use server';

import { db } from '@/db';
import { setlists, setlistSongs, songs } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

export async function getUserSetlists() {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const result = await db
        .select({
            id: setlists.id,
            name: setlists.name,
            description: setlists.description,
            createdAt: setlists.createdAt,
            songCount: db.$count(setlistSongs, eq(setlistSongs.setlistId, setlists.id)),
        })
        .from(setlists)
        .where(eq(setlists.userId, user.id))
        .orderBy(desc(setlists.createdAt));

    return result;
}

export async function getSetlistById(id: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [setlist] = await db
        .select()
        .from(setlists)
        .where(and(eq(setlists.id, id), eq(setlists.userId, user.id)));

    if (!setlist) throw new Error('Lista no encontrada');

    const songsInSetlist = await db
        .select({
            id: setlistSongs.id,
            songId: setlistSongs.songId,
            order: setlistSongs.order,
            transposition: setlistSongs.transposition,
            fontSize: setlistSongs.fontSize,
            song: songs,
        })
        .from(setlistSongs)
        .innerJoin(songs, eq(setlistSongs.songId, songs.id))
        .where(eq(setlistSongs.setlistId, id))
        .orderBy(asc(setlistSongs.order));

    return {
        ...setlist,
        songs: songsInSetlist,
    };
}

export async function createSetlist(data: { name: string; description?: string }) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [newSetlist] = await db
        .insert(setlists)
        .values({
            name: data.name,
            description: data.description || null,
            userId: user.id,
        })
        .returning();

    revalidatePath('/setlists');
    return newSetlist;
}

export async function updateSetlist(id: number, data: { name?: string; description?: string }) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const [updated] = await db
        .update(setlists)
        .set(updateData)
        .where(and(eq(setlists.id, id), eq(setlists.userId, user.id)))
        .returning();

    if (!updated) throw new Error('Lista no encontrada');
    revalidatePath('/setlists');
    revalidatePath(`/setlists/${id}`);
    return updated;
}

export async function deleteSetlist(id: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    await db.delete(setlistSongs).where(eq(setlistSongs.setlistId, id));

    const [deleted] = await db
        .delete(setlists)
        .where(and(eq(setlists.id, id), eq(setlists.userId, user.id)))
        .returning();

    if (!deleted) throw new Error('Lista no encontrada');
    revalidatePath('/setlists');
    return deleted;
}

export async function addSongToSetlist(data: {
    setlistId: number;
    songId: number;
    transposition?: number;
    fontSize?: string;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [setlist] = await db
        .select()
        .from(setlists)
        .where(and(eq(setlists.id, data.setlistId), eq(setlists.userId, user.id)));

    if (!setlist) throw new Error('Lista no encontrada');

    const [existing] = await db
        .select()
        .from(setlistSongs)
        .where(
            and(
                eq(setlistSongs.setlistId, data.setlistId),
                eq(setlistSongs.songId, data.songId)
            )
        );

    if (existing) throw new Error('La canción ya está en esta lista');

    const [last] = await db
        .select({ order: setlistSongs.order })
        .from(setlistSongs)
        .where(eq(setlistSongs.setlistId, data.setlistId))
        .orderBy(desc(setlistSongs.order))
        .limit(1);

    const nextOrder = (last?.order ?? -1) + 1;

    const [newEntry] = await db
        .insert(setlistSongs)
        .values({
            setlistId: data.setlistId,
            songId: data.songId,
            order: nextOrder,
            transposition: data.transposition ?? 0,
            fontSize: data.fontSize ?? 'medium',
        })
        .returning();

    revalidatePath(`/setlists/${data.setlistId}`);
    revalidatePath('/setlists');
    return newEntry;
}

export async function updateSongInSetlist(
    setlistSongId: number,
    data: { transposition?: number; fontSize?: string }
) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [entry] = await db
        .select({ setlistId: setlistSongs.setlistId })
        .from(setlistSongs)
        .where(eq(setlistSongs.id, setlistSongId));

    if (!entry) throw new Error('Entrada no encontrada');

    const [setlist] = await db
        .select()
        .from(setlists)
        .where(and(eq(setlists.id, entry.setlistId), eq(setlists.userId, user.id)));

    if (!setlist) throw new Error('No autorizado');

    const updateData: any = {};
    if (data.transposition !== undefined) updateData.transposition = data.transposition;
    if (data.fontSize !== undefined) updateData.fontSize = data.fontSize;

    const [updated] = await db
        .update(setlistSongs)
        .set(updateData)
        .where(eq(setlistSongs.id, setlistSongId))
        .returning();

    revalidatePath(`/setlists/${entry.setlistId}`);
    return updated;
}

export async function reorderSetlistSongs(setlistId: number, orderedIds: number[]) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [setlist] = await db
        .select()
        .from(setlists)
        .where(and(eq(setlists.id, setlistId), eq(setlists.userId, user.id)));

    if (!setlist) throw new Error('No autorizado');

    await db.transaction(async (tx) => {
        for (let i = 0; i < orderedIds.length; i++) {
            await tx
                .update(setlistSongs)
                .set({ order: i })
                .where(eq(setlistSongs.id, orderedIds[i]));
        }
    });

    revalidatePath(`/setlists/${setlistId}`);
}

export async function removeSongFromSetlist(setlistSongId: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [entry] = await db
        .select({ setlistId: setlistSongs.setlistId })
        .from(setlistSongs)
        .where(eq(setlistSongs.id, setlistSongId));

    if (!entry) throw new Error('Entrada no encontrada');

    const [setlist] = await db
        .select()
        .from(setlists)
        .where(and(eq(setlists.id, entry.setlistId), eq(setlists.userId, user.id)));

    if (!setlist) throw new Error('No autorizado');

    await db.delete(setlistSongs).where(eq(setlistSongs.id, setlistSongId));

    revalidatePath(`/setlists/${entry.setlistId}`);
    revalidatePath('/setlists');
}