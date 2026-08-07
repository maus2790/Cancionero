'use client';

import { useEffect } from 'react';

export function PwaServiceWorker() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((error) => {
                console.error('No se pudo registrar el modo offline:', error);
            });
        }
    }, []);

    return null;
}
