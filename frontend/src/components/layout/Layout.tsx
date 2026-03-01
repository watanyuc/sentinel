import type { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main className="px-4 py-6 space-y-6">
        {children}
      </main>
    </div>
  );
};
