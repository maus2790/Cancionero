'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Music, Guitar, List, Heart } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/canciones', label: 'Canciones', icon: Music },
    { href: '/acordes', label: 'Acordes', icon: Guitar },
    { href: '/setlists', label: 'Setlists', icon: List },
    { href: '/favoritos', label: 'Favoritos', icon: Heart },
];

// 🔹 Definir props
interface SidebarProps {
    isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={`
        fixed left-0 top-16 bottom-0 
        bg-white dark:bg-gray-800 
        border-r border-gray-200 dark:border-gray-700 
        overflow-y-auto transition-all duration-300
        ${isOpen ? 'w-64' : 'w-0'}
      `}
        >
            <nav className={`p-4 space-y-1 ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
                {navItems.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${pathname === href
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className={isOpen ? 'inline' : 'hidden'}>{label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
}