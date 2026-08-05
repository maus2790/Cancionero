'use server';

import { db } from '@/db';
import { chords } from '@/db/schema';
import { eq, and, like, asc, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

// Obtener todos los acordes (predefinidos + del usuario) - permite duplicados
export async function getAllChords() {
    const user = await getCurrentUser();
    const userId = user?.id;

    if (!userId) {
        return await db
            .select()
            .from(chords)
            .where(eq(chords.isPredefined, true))
            .orderBy(asc(chords.name));
    }

    const userChords = await db
        .select()
        .from(chords)
        .where(eq(chords.userId, userId))
        .orderBy(asc(chords.name));

    const predefinedChords = await db
        .select()
        .from(chords)
        .where(eq(chords.isPredefined, true))
        .orderBy(asc(chords.name));

    // Combinar sin eliminar duplicados (permitir varias posiciones)
    return [...predefinedChords, ...userChords].sort((a, b) => a.name.localeCompare(b.name));
}

// Obtener acorde por ID
export async function getChordById(id: number) {
    const [chord] = await db
        .select()
        .from(chords)
        .where(eq(chords.id, id));
    return chord || null;
}

// Crear un acorde (sin restricción de nombre único)
export async function createChord(data: {
    name: string;
    root?: string;
    type?: string;
    guitarPositions?: string;
    pianoPositions?: string;
    isPredefined?: boolean;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    // Asegurar valores no vacíos
    const root = (data.root && data.root.trim()) || data.name.charAt(0) || 'C';
    const type = (data.type && data.type.trim()) || 'major';
    const now = Math.floor(Date.now() / 1000); // timestamp en segundos

    const [newChord] = await db
        .insert(chords)
        .values({
            name: data.name,
            root: root,
            type: type,
            guitarPositions: data.guitarPositions || null,
            pianoPositions: data.pianoPositions || null,
            userId: user.id,
            isPredefined: data.isPredefined || false,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    revalidatePath('/acordes');
    return newChord;
}

// Actualizar acorde
export async function updateChord(id: number, data: {
    name?: string;
    root?: string;
    type?: string;
    guitarPositions?: string;
    pianoPositions?: string;
    isPredefined?: boolean;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [chord] = await db
        .select()
        .from(chords)
        .where(eq(chords.id, id));

    if (!chord) throw new Error('Acorde no encontrado');
    if (chord.userId !== user.id && !chord.isPredefined) {
        throw new Error('No autorizado');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.root !== undefined) {
        updateData.root = (data.root && data.root.trim()) || data.name?.charAt(0) || chord.root || 'C';
    }
    if (data.type !== undefined) {
        updateData.type = (data.type && data.type.trim()) || 'major';
    }
    if (data.guitarPositions !== undefined) updateData.guitarPositions = data.guitarPositions;
    if (data.pianoPositions !== undefined) updateData.pianoPositions = data.pianoPositions;
    if (data.isPredefined !== undefined) updateData.isPredefined = data.isPredefined;
    updateData.updatedAt = Math.floor(Date.now() / 1000);

    const [updated] = await db
        .update(chords)
        .set(updateData)
        .where(eq(chords.id, id))
        .returning();

    revalidatePath('/acordes');
    return updated;
}

// Eliminar acorde
export async function deleteChord(id: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [chord] = await db
        .select()
        .from(chords)
        .where(eq(chords.id, id));

    if (!chord) throw new Error('Acorde no encontrado');
    if (chord.userId !== user.id) throw new Error('No autorizado');

    await db.delete(chords).where(eq(chords.id, id));
    revalidatePath('/acordes');
}

// Buscar acordes por nombre
export async function searchChords(query: string) {
    const user = await getCurrentUser();
    const userId = user?.id;

    let conditions: any[] = [like(chords.name, `%${query}%`)];
    if (userId) {
        conditions.push(or(eq(chords.userId, userId), eq(chords.isPredefined, true)));
    } else {
        conditions.push(eq(chords.isPredefined, true));
    }

    return await db
        .select()
        .from(chords)
        .where(and(...conditions))
        .orderBy(asc(chords.name))
        .limit(20);
}