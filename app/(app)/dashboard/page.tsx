// app/(protected)/dashboard/page.tsx
'use client';

import { getCurrentUser } from '@/app/actions/auth';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const u = await getCurrentUser();
            setUser(u);
        };
        loadUser();
    }, []);

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Bienvenido, {user?.name || 'Usuario'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Canciones</h3>
                    <p className="text-gray-500 dark:text-gray-400">Explora el cancionero</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Acordes</h3>
                    <p className="text-gray-500 dark:text-gray-400">Aprende nuevos acordes</p>
                </div>
            </div>
        </div>
    );
}