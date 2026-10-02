import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tier Match - Multiplayer Party Game',
  description: 'Zgaduj rankingi znajomych w czasie rzeczywistym! Imprezowa gra online.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark">
      <body className="antialiased min-h-screen flex flex-col justify-between">
        <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏆</span>
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
                TIER MATCH
              </span>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">
              Multiplayer MVP
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6">
          {children}
        </main>

        <footer className="border-t border-slate-900/80 py-4 text-center text-xs text-slate-600">
          Tier Match • Zaprojektowane dla rozgrywki imprezowej w czasie rzeczywistym
        </footer>
      </body>
    </html>
  );
}
