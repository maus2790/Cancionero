// components/layout/Header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Menu,
    Sun,
    Moon,
    LogOut,
    Settings,
    ArrowLeft,
    Shield,
    User,
    Guitar,
    Music,
    List,
    Heart,
    Home,
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';
import { useRouter, usePathname } from 'next/navigation';
import { handleLogout, getCurrentUser } from '@/app/actions/auth';
import { useTitle } from '@/lib/TitleContext';

export function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const { title, showBack, onBack, headerRight } = useTitle();

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [userName, setUserName] = useState('Usuario');
    const [isAdmin, setIsAdmin] = useState(false);

    // ✅ NUEVO
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadUser = async () => {
            const user = await getCurrentUser();

            if (user) {
                setUserName(user.name);
                setIsAdmin(user.role === 'admin');

                // ✅ NUEVO
                setAvatarUrl(user.avatarUrl || null);
            }
        };

        loadUser();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );
    }, []);

    const handleLogoutClick = async () => {
        await handleLogout();
        router.push('/login');
    };

    const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

    const initials = userName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const HeaderIcon = pathname.startsWith('/canciones')
        ? Music
        : pathname.startsWith('/acordes')
            ? Guitar
            : pathname.startsWith('/setlists')
                ? List
                : pathname.startsWith('/favoritos')
                    ? Heart
                    : pathname.startsWith('/perfil')
                        ? User
                        : pathname.startsWith('/admin')
                            ? Shield
                            : Home;

    return (
        <header className="bg-sky-50 dark:bg-slate-900 border-b border-sky-100 dark:border-slate-700 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    {showBack ? (
                        <button
                            onClick={onBack}
                            className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition"
                            aria-label="Volver"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    ) : pathname.startsWith('/admin') ? (
                        <button
                            className="block md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition"
                            onClick={onToggleSidebar}
                            aria-label="Toggle sidebar"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    ) : null}

                    <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-sm">
                            <HeaderIcon className="w-4 h-4" />
                        </div>
                        <h1 className="text-xl font-bold text-blue-700 dark:text-sky-300 truncate max-w-[130px] sm:max-w-xs">
                            {title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {headerRight && (
                        <div className="flex items-center">
                            {headerRight}
                        </div>
                    )}

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-5 h-5 text-yellow-400" />
                        ) : (
                            <Moon className="w-5 h-5 text-gray-600" />
                        )}
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={toggleUserMenu}
                            className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none"
                        >
                            {/* ✅ AVATAR ACTUALIZADO */}
                            <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                                {avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={avatarUrl}
                                        alt={userName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    initials || 'U'
                                )}
                            </div>
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{userName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Usuario</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        router.push('/perfil');
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    <User className="w-4 h-4" /> Perfil
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            router.push('/admin');
                                        }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    >
                                        <Shield className="w-4 h-4" /> Panel de Admin
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        toggleTheme();
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    {theme === 'dark' ? (
                                        <>
                                            <Sun className="w-4 h-4" /> Modo claro
                                        </>
                                    ) : (
                                        <>
                                            <Moon className="w-4 h-4" /> Modo oscuro
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        handleLogoutClick();
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition border-t border-gray-200 dark:border-gray-700"
                                >
                                    <LogOut className="w-4 h-4" /> Cerrar sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
