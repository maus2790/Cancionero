'use client';

import { useState } from 'react';
import { TitleProvider } from '@/lib/TitleContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Ocultar sidebar en páginas específicas si quieres
  const hideSidebar = false;
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <TitleProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <div className="flex">
          {!isMobile && !hideSidebar && <Sidebar isOpen={true} />}
          {isMobile && isMobileSidebarOpen && isAdminRoute && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 z-40" 
                onClick={() => setIsMobileSidebarOpen(false)} 
              />
              <div className="z-50">
                <Sidebar isOpen={true} />
              </div>
            </>
          )}
          <main className={`flex-1 ${!isMobile ? 'ml-64' : ''}`}>
            {children}
          </main>
        </div>
        {isMobile && <BottomNav />}
      </div>
    </TitleProvider>
  );
}