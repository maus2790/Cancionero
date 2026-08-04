'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleLogin, handleGuestLogin, handleGoogleLogin } from '@/app/actions/auth';
import { Eye, EyeOff, Mail, Lock, LogIn, Users } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const result = await handleLogin(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    const handleGuest = async () => {
        setLoading(true);
        await handleGuestLogin();
        router.push('/dashboard');
    };

    const handleGoogle = async () => {
        setLoading(true);
        await handleGoogleLogin();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bienvenido</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Inicia sesión en tu cuenta</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                    <LogIn className="w-5 h-5" />
                                    Iniciar Sesión
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                o continúa con
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleGoogle}
                            disabled={loading}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>

                        <button
                            onClick={handleGuest}
                            disabled={loading}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Users className="w-5 h-5" />
                            Entrar como Invitado
                        </button>
                    </div>

                    <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                        ¿No tienes cuenta?{' '}
                        <a href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                            Regístrate aquí
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}