import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

// Cliente para conectar a Turso
const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Exportamos db para hacer consultas
export const db = drizzle(client);