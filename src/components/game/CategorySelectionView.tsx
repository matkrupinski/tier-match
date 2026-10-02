'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Category } from '../../types/game';

interface CategorySelectionViewProps {
  categoryOptions: Category[];
  isCreator: boolean;
  creatorName: string;
  timeRemaining: number;
  onSelectCategory: (categoryId: string) => void;
}

export const CategorySelectionView: React.FC<CategorySelectionViewProps> = ({
  categoryOptions,
  isCreator,
  creatorName,
  timeRemaining,
  onSelectCategory,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 sm:p-8 bg-slate-950/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl text-center">
      {/* Pasek Statusu i Zegara */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          {isCreator ? '👑 Twój Wybór' : '⏳ Oczekiwanie na Twórcę'}
        </div>
        <div className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 font-mono text-sm font-bold text-amber-400">
          <span className="animate-pulse">⏳</span>
          <span>{timeRemaining}s</span>
        </div>
      </div>

      {/* Nagłówek Kontekstowy */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          {isCreator ? (
            <>
              Wybierz temat dla{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400">
                Twojej Tier Listy
              </span>
            </>
          ) : (
            <>
              <span className="text-indigo-400">{creatorName}</span> wybiera kategorię...
            </>
          )}
        </h2>
        <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
          {isCreator
            ? 'Wybierz kategorię, która najbardziej Ci odpowiada. Pozostali gracze będą musieli odgadnąć Twój ranking od S do D!'
            : 'Twórca przegląda propozycje tematów. Przygotuj się do oceniania i zgadywania!'}
        </p>
      </div>

      {/* Widok dla Twórcy (Karty wyboru) */}
      {isCreator ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {categoryOptions.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/60 rounded-2xl flex flex-col justify-between text-left shadow-xl transition-all group"
            >
              <div>
                <div className="text-3xl mb-3">
                  {category.icon || '🎭'}
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors mb-2 leading-snug">
                  {category.name}
                </h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {category.description}
                </p>

                {/* Przykładowe elementy w tej kategorii */}
                <div className="pt-3 border-t border-slate-800/80 mb-5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    W zestawie m.in.:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {category.items.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className="text-[11px] px-2 py-0.5 bg-slate-800/70 text-slate-300 rounded-md font-medium"
                      >
                        {item.icon} {item.name.split(' ')[0]}...
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectCategory(category.id)}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Wybierz tę kategorię</span>
                <span>→</span>
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Widok dla Zgadujących (Animowane karty oczekiwania) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {[1, 2, 3].map((num) => (
            <motion.div
              key={num}
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, delay: num * 0.4 }}
              className="p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center min-h-[220px]"
            >
              <span className="text-4xl mb-3 animate-bounce">❓</span>
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                Kategoria #{num}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
