'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================
function generateSessionId() {
    return Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}

// ============================================================
// REGISTRO CON EMAIL
// ============================================================
export async function handleRegister(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!email || !password || !name) {
        return { error: 'Todos los campos son requeridos' };
    }

    // Verificar si el email ya existe
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
        return { error: 'El email ya está registrado' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.insert(users).values({
        email,
        password: hashedPassword,
        name,
        provider: 'email',
    });

    redirect('/login');
}

// ============================================================
// LOGIN CON EMAIL
// ============================================================
export async function handleLogin(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Todos los campos son requeridos' };
    }

    const user = await db.select().from(users).where(eq(users.email, email));
    if (user.length === 0) {
        return { error: 'Credenciales inválidas' };
    }

    // Si el usuario es de Google o invitado, no tiene contraseña
    if (user[0].provider === 'google' || user[0].provider === 'guest') {
        return { error: 'Esta cuenta usa otro método de inicio de sesión' };
    }

    const isValid = await bcrypt.compare(password, user[0].password || '');
    if (!isValid) {
        return { error: 'Credenciales inválidas' };
    }

    // Crear sesión
    await createSession(user[0]);
    redirect('/dashboard');
}

// ============================================================
// LOGIN COMO INVITADO
// ============================================================
export async function handleGuestLogin() {
    // Buscar o crear un usuario invitado
    let guestUser = await db.select().from(users).where(eq(users.email, 'guest@invitado.com'));

    if (guestUser.length === 0) {
        // Crear usuario invitado
        await db.insert(users).values({
            email: 'guest@invitado.com',
            name: 'Invitado',
            password: null,
            provider: 'guest',
            providerId: null,
            preferences: null,
        });
        guestUser = await db.select().from(users).where(eq(users.email, 'guest@invitado.com'));
    }

    await createSession(guestUser[0]);
    redirect('/dashboard');
}

// ============================================================
// CREAR SESIÓN (cookies)
// ============================================================
async function createSession(user: any) {
    const cookieStore = await cookies();
    const sessionId = generateSessionId();

    cookieStore.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
    });

    cookieStore.set('user_id', user.id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });

    cookieStore.set('user_name', user.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });
}

// ============================================================
// OBTENER USUARIO ACTUAL (¡ÚNICA DEFINICIÓN!)
// ============================================================
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userName = cookieStore.get('user_name')?.value;

    if (!userId) return null;

    const user = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    if (user.length === 0) return null;

    return {
        id: user[0].id,
        email: user[0].email,
        name: userName || user[0].name,
        provider: user[0].provider || 'email',
    };
}

// ============================================================
// CERRAR SESIÓN
// ============================================================
export async function handleLogout() {
    const cookieStore = await cookies();
    cookieStore.set('session_id', '', { maxAge: 0, path: '/' });
    cookieStore.set('user_id', '', { maxAge: 0, path: '/' });
    cookieStore.set('user_name', '', { maxAge: 0, path: '/' });
    redirect('/login');
}

// ============================================================
// LOGIN CON GOOGLE (redirige al endpoint)
// ============================================================
export async function handleGoogleLogin() {
    redirect('/api/auth/google');
}