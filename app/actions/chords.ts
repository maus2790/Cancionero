'use server';

import { db } from '@/db';
import { chords } from '@/db/schema';
import { eq, and, like, asc, or, count } from 'drizzle-orm';
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
    const imageFolder = (formData.get('imageFolder') as string) || 'chords';
    const isPianoImage = imageFolder === 'piano';

    const now = Math.floor(Date.now() / 1000);

    // Verificar si ya existe un acorde con ese nombre
    const existingChords = await db
        .select()
        .from(chords)
        .where(and(
            eq(chords.name, name),
            or(eq(chords.userId, user.id), eq(chords.isPredefined, true))
        ));

    if (existingChords.length > 0) {
        throw new Error('Ya existe un acorde con ese nombre. Por favor, edítalo desde el banco de acordes.');
    }

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

    // Si hay imagen, la subimos al campo correcto
    if (imageFile && imageFile.size > 0) {
        const extension = imageFile.name.split('.').pop() || 'png';
        const key = `${imageFolder}/${newChord.id}-${Date.now()}.${extension}`;
        const uploadedUrl = await uploadImage(imageFile, key);
        const updateField = isPianoImage
            ? { pianoImageUrl: uploadedUrl, updatedAt: now }
            : { imageUrl: uploadedUrl, updatedAt: now };
        await db.update(chords).set(updateField).where(eq(chords.id, newChord.id));
        if (isPianoImage) newChord.pianoImageUrl = uploadedUrl;
        else newChord.imageUrl = uploadedUrl;
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
    const imageFolder = (formData.get('imageFolder') as string) || 'chords';
    const isPianoImage = imageFolder === 'piano';

    const updateData: any = {};
    if (name) updateData.name = name;
    if (root) updateData.root = root;
    if (type) updateData.type = type;
    if (guitarPositions !== undefined) updateData.guitarPositions = guitarPositions || null;
    if (pianoPositions !== undefined) updateData.pianoPositions = pianoPositions || null;

    const publicUrl = process.env.R2_PUBLIC_URL!;
    const extractKey = (url: string) =>
        url.startsWith(publicUrl) ? url.slice(publicUrl.length + 1) : url.split('/').slice(-2).join('/');

    // Manejar imagen de guitarra
    if (!isPianoImage) {
        if (removeImage) {
            if (chord.imageUrl) await deleteImage(extractKey(chord.imageUrl));
            updateData.imageUrl = null;
        } else if (imageFile && imageFile.size > 0) {
            if (chord.imageUrl) await deleteImage(extractKey(chord.imageUrl));
            const ext = imageFile.name.split('.').pop() || 'png';
            const key = `chords/${id}-${Date.now()}.${ext}`;
            updateData.imageUrl = await uploadImage(imageFile, key);
        }
    }

    // Manejar imagen de piano
    if (isPianoImage) {
        if (removeImage) {
            if (chord.pianoImageUrl) await deleteImage(extractKey(chord.pianoImageUrl));
            updateData.pianoImageUrl = null;
        } else if (imageFile && imageFile.size > 0) {
            if (chord.pianoImageUrl) await deleteImage(extractKey(chord.pianoImageUrl));
            const ext = imageFile.name.split('.').pop() || 'png';
            const key = `piano/${id}-${Date.now()}.${ext}`;
            updateData.pianoImageUrl = await uploadImage(imageFile, key);
        }
    }

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

    // Eliminar ambas imágenes si existen
    const publicUrl = process.env.R2_PUBLIC_URL!;
    const extractKey = (url: string) =>
        url.startsWith(publicUrl) ? url.slice(publicUrl.length + 1) : url.split('/').slice(-2).join('/');

    if (chord.imageUrl) await deleteImage(extractKey(chord.imageUrl));
    if (chord.pianoImageUrl) await deleteImage(extractKey(chord.pianoImageUrl));

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

// Buscar acorde exacto por nombre
export async function getChordByNameExact(name: string) {
    const user = await getCurrentUser();
    const userId = user?.id;

    let conditions: any[] = [eq(chords.name, name)];
    if (userId) {
        conditions.push(or(eq(chords.userId, userId), eq(chords.isPredefined, true)));
    } else {
        conditions.push(eq(chords.isPredefined, true));
    }

    const result = await db
        .select()
        .from(chords)
        .where(and(...conditions))
        .orderBy(asc(chords.name))
        .limit(1);
    
    return result[0] || null;
}

// ============================================================
// CONTAR ACORDES (para el dashboard)
// ============================================================
export async function getChordsCount() {
    const user = await getCurrentUser();
    const userId = user?.id;

    if (userId) {
        const [result] = await db
            .select({ count: count() })
            .from(chords)
            .where(or(eq(chords.isPredefined, true), eq(chords.userId, userId)));
        return result?.count ?? 0;
    } else {
        const [result] = await db
            .select({ count: count() })
            .from(chords)
            .where(eq(chords.isPredefined, true));
        return result?.count ?? 0;
    }
}
