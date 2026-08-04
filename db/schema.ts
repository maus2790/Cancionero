import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ===== Tabla de usuarios (igual que en el PDF, pero añadimos campos para preferencias) =====
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    password: text('password'),        // puede ser null para usuarios Google
    name: text('name').notNull(),
    provider: text('provider'),        // 'google' o null
    providerId: text('provider_id'),
    // preferencias del usuario (por si queremos guardar tonalidad favorita, etc.)
    preferences: text('preferences'),  // JSON string
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// ===== Tabla de canciones =====
export const songs = sqliteTable('songs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    artist: text('artist'),
    key: text('key'),
    style: text('style'), // NUEVO: estilo de la canción (Gozo, Adoración, etc.)
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
    userId: integer('user_id').references(() => users.id),
    isPublic: integer('is_public', { mode: 'boolean' }).default(true),
});

// ===== Tabla de setlists (listas de canciones) =====
export const setlists = sqliteTable('setlists', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    userId: integer('user_id').references(() => users.id).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// ===== Relación muchos a muchos entre setlists y canciones =====
export const setlistSongs = sqliteTable('setlist_songs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    setlistId: integer('setlist_id').references(() => setlists.id).notNull(),
    songId: integer('song_id').references(() => songs.id).notNull(),
    order: integer('order').default(0),
    transposition: integer('transposition').default(0),   // semitonos (+/-)
    fontSize: text('font_size').default('medium'),        // 'small' | 'medium' | 'large' | 'xlarge'
});

// ===== Favoritos (usuario -> canción) =====
export const favorites = sqliteTable('favorites', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    songId: integer('song_id').references(() => songs.id).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});