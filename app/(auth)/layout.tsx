'use client';

import { ReactNode } from 'react';
import { 
    Guitar, 
    Music, 
    List, 
    Heart, 
    Repeat, 
    Download, 
    Sparkles,
    Award,
    ChevronRight,
    Users
} from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    const features = [
        { icon: Music, text: 'Un catálogo musical siempre disponible', color: 'text-cyan-200' },
        { icon: Guitar, text: 'Diagramas de guitarra y piano integrados', color: 'text-cyan-200' },
        { icon: List, text: 'Crea y organiza tus listas', color: 'text-cyan-200' },
        { icon: Repeat, text: 'Transposición automática con un clic', color: 'text-cyan-200' },
        { icon: Heart, text: 'Guarda tus canciones favoritas', color: 'text-cyan-200' },
        { icon: Download, text: 'Funciona offline como PWA', color: 'text-cyan-200' },
    ];

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            {/* Fondo con patrón animado (solo desktop) */}
            <div className="hidden lg:block absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-950" />

            {/* Patrón de fondo con notas musicales (solo desktop) */}
            <div className="hidden lg:block absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 text-8xl text-white">♪</div>
                <div className="absolute bottom-20 right-20 text-9xl text-white rotate-12">♫</div>
                <div className="absolute top-1/3 right-10 text-7xl text-white opacity-50">♪</div>
                <div className="absolute bottom-1/3 left-10 text-8xl text-white opacity-30">♬</div>
                <div className="absolute top-20 right-1/4 text-6xl text-white opacity-20">♩</div>
            </div>

            {/* Columna izquierda (solo visible en desktop) */}
            <div className="hidden lg:flex lg:w-1/2 text-white p-12 flex-col justify-center relative z-10">
                <div className="max-w-md mx-auto w-full space-y-8">
                    {/* Logo y nombre con badge */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/25 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-white/30">
                            <Guitar className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <span className="text-3xl font-bold tracking-tight">Tu Cancionero</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Sparkles className="w-3 h-3 text-cyan-200" />
                                <span className="text-xs text-cyan-100 font-medium">Tu música, a tu manera</span>
                            </div>
                        </div>
                    </div>

                    {/* Título principal */}
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold leading-tight">
                            Tu música, <br />
                            <span className="text-cyan-200">en un solo lugar</span>
                        </h1>
                        <p className="text-cyan-50 text-lg">
                            Todas las herramientas que necesitas para organizar y disfrutar tu repertorio
                        </p>
                    </div>

                    {/* Características (tarjetas mejoradas) */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        {features.map(({ icon: Icon, text, color }, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors group"
                            >
                                <div className={`${color} flex-shrink-0 mt-0.5`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm leading-tight text-white/90 group-hover:text-white transition">
                                    {text}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Badge extra */}
                    <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-2 text-xs text-white/70">
                            <Award className="w-4 h-4 text-cyan-200" />
                            <span>1000+ canciones</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/70">
                            <Users className="w-4 h-4 text-blue-300" />
                            <span>Comunidad activa</span>
                        </div>
                    </div>

                    {/* Pie de columna */}
                    <div className="pt-6 border-t border-white/10 text-xs text-white/50">
                        © {new Date().getFullYear()} Tu Cancionero · Música a tu manera
                    </div>
                </div>
            </div>

            {/* Columna derecha: formulario */}
            <div className="flex-1 flex items-center justify-center p-4 bg-sky-50 dark:bg-slate-950 relative z-20">
                <div className="w-full max-w-md relative">
                    {/* Efecto de brillo sutil */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-400/30 dark:bg-cyan-500/15 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/30 dark:bg-blue-500/15 rounded-full blur-3xl" />
                    
                    {/* Contenido del formulario */}
                    <div className="relative">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
