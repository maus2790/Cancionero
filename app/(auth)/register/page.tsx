'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleRegister } from '@/app/actions/auth';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Guitar } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);

        const result = await handleRegister(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/login');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-blue-500/15 ring-1 ring-sky-100 dark:ring-slate-700 p-6 md:p-8 transition-colors duration-300">
            {/* Logo para móvil (visible solo en pantallas pequeñas) */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                <Guitar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold text-gray-800 dark:text-white">Tu Cancionero</span>
            </div>

            {/* Encabezado */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Crear Cuenta</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Regístrate para comenzar</p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                        Nombre completo
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            placeholder="Juan Pérez"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            placeholder="usuario@email.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                        Contraseña
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            placeholder="********"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    ) : (
                        <>
                            <UserPlus className="w-5 h-5" />
                            Registrarse
                        </>
                    )}
                </button>
            </form>

            <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                ¿Ya tienes cuenta?{' '}
                <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                    Inicia sesión aquí
                </a>
            </p>
        </div>
    );
}
