'use server';

import { db } from '@/db';
import { chords } from '@/db/schema';
import { eq, and, like, asc, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import { uploadImage, deleteImage } from '@/lib/r2';

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

// Crear un acorde (ahora acepta FormData)
export async function createChord(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const name = formData.get('name') as string;
    const root = (formData.get('root') as string) || name.charAt(0) || 'C';
    const type = (formData.get('type') as string) || 'major';
    const guitarPositions = formData.get('guitarPositions') as string;
    const pianoPositions = formData.get('pianoPositions') as string;
    const imageFile = formData.get('image') as File | null;

    const now = Math.floor(Date.now() / 1000);

    // Primero insertamos el acorde para obtener el ID
    const [newChord] = await db
        .insert(chords)
        .values({
            name,
            root,
            type,
            guitarPositions: guitarPositions || null,
            pianoPositions: pianoPositions || null,
            userId: user.id,
            isPredefined: false,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    // Si hay imagen, la subimos y actualizamos el registro
    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
        const extension = imageFile.name.split('.').pop() || 'png';
        const key = `chords/${newChord.id}-${Date.now()}.${extension}`;
        imageUrl = await uploadImage(imageFile, key);
        // Actualizar el acorde con la URL
        await db
            .update(chords)
            .set({ imageUrl, updatedAt: now })
            .where(eq(chords.id, newChord.id));
        newChord.imageUrl = imageUrl;
    }

    revalidatePath('/acordes');
    return newChord;
}

// Actualizar acorde (ahora acepta FormData)
export async function updateChord(id: number, formData: FormData) {
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

    const name = formData.get('name') as string;
    const root = (formData.get('root') as string) || name?.charAt(0) || chord.root || 'C';
    const type = (formData.get('type') as string) || 'major';
    const guitarPositions = formData.get('guitarPositions') as string;
    const pianoPositions = formData.get('pianoPositions') as string;
    const imageFile = formData.get('image') as File | null;
    const removeImage = formData.get('removeImage') === 'true';

    const updateData: any = {};
    if (name) updateData.name = name;
    if (root) updateData.root = root;
    if (type) updateData.type = type;
    if (guitarPositions !== undefined) updateData.guitarPositions = guitarPositions || null;
    if (pianoPositions !== undefined) updateData.pianoPositions = pianoPositions || null;

    // Manejar imagen
    let newImageUrl = chord.imageUrl;
    if (removeImage) {
        // Eliminar imagen anterior si existe
        if (chord.imageUrl) {
            const key = chord.imageUrl.split('/').pop();
            if (key) await deleteImage(`chords/${key}`);
        }
        newImageUrl = null;
    } else if (imageFile && imageFile.size > 0) {
        // Eliminar imagen anterior si existe
        if (chord.imageUrl) {
            const oldKey = chord.imageUrl.split('/').pop();
            if (oldKey) await deleteImage(`chords/${oldKey}`);
        }
        const extension = imageFile.name.split('.').pop() || 'png';
        const key = `chords/${id}-${Date.now()}.${extension}`;
        newImageUrl = await uploadImage(imageFile, key);
    }

    updateData.imageUrl = newImageUrl;
    updateData.updatedAt = Math.floor(Date.now() / 1000);

    const [updated] = await db
        .update(chords)
        .set(updateData)
        .where(eq(chords.id, id))
        .returning();

    revalidatePath('/acordes');
    return updated;
}

// Eliminar acorde (también eliminar imagen asociada)
export async function deleteChord(id: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [chord] = await db
        .select()
        .from(chords)
        .where(eq(chords.id, id));

    if (!chord) throw new Error('Acorde no encontrado');
    if (chord.userId !== user.id) throw new Error('No autorizado');

    // Eliminar imagen si existe
    if (chord.imageUrl) {
        const key = chord.imageUrl.split('/').pop();
        if (key) await deleteImage(`chords/${key}`);
    }

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
