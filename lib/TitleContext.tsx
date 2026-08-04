'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type TitleContextType = {
    title: string;
    setTitle: (title: string) => void;
    showBack: boolean;
    setShowBack: (show: boolean) => void;
    onBack: () => void;
    setOnBack: (callback: () => void) => void;
};

const TitleContext = createContext<TitleContextType | undefined>(undefined);

export function TitleProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState('Cancionero');
    const [showBack, setShowBack] = useState(false);
    const [onBack, setOnBack] = useState<() => void>(() => { });

    return (
        <TitleContext.Provider
            value={{ title, setTitle, showBack, setShowBack, onBack, setOnBack }}
        >
            {children}
        </TitleContext.Provider>
    );
}

export function useTitle() {
    const context = useContext(TitleContext);
    if (!context) {
        throw new Error('useTitle must be used within TitleProvider');
    }
    return context;
}