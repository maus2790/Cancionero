'use client';

import { useTheme } from '@/lib/ThemeProvider';

export default function HomePage() {
    const { theme } = useTheme();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-300">
                    Bienvenido al Cancionero Cristiano. Aquí encontrarás todas las canciones, acordes y setlists.
                </p>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Tema actual: {theme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                    </p>
                </div>
            </div>
        </div>
    );
}