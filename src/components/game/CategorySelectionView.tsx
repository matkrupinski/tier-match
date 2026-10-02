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
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl text-center">
      {/* Pasek Statusu i Zegara */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          {isCreator ? '👑 Twój Wybór Tematu' : '⏳ Oczekiwanie na Twórcę'}
        </div>
        <div className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 font-mono text-sm font-bold text-amber-400">
          <span className="animate-pulse">{timeRemaining <= 0 ? '♾️' : '⏳'}</span>
          <span>{timeRemaining <= 0 ? 'Bez limitu' : `${timeRemaining}s`}</span>
        </div>
      </div>

      {/* Nagłówek Kontekstowy */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
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
        <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
          {isCreator
            ? 'Kliknij kategorię, która najbardziej Ci odpowiada. Pozostali gracze będą musieli odgadnąć Twój ranking od S do D!'
            : 'Twórca przegląda propozycje tematów. Przygotuj się do oceniania i zgadywania!'}
        </p>
      </div>

      {/* Widok dla Twórcy (Karty wyboru z pełnymi tekstami) */}
      {isCreator ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-4">
          {categoryOptions.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -3 }}
              className="p-5 sm:p-6 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/60 rounded-2xl flex flex-col justify-between text-left shadow-xl transition-all group"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{category.icon || '🎭'}</span>
                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-indigo-300 transition-colors leading-snug break-words">
                    {category.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {category.description}
                </p>

                {/* Pełna lista elementów w danej kategorii bez ucinania */}
                <div className="pt-3 border-t border-slate-800/80 mb-5">
                  <span className="text-[11px] uppercase font-bold text-slate-500 block mb-2">
                    Wszystkie elementy ({category.items.length}):
                  </span>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-none">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className="text-xs p-2 bg-slate-950/80 text-slate-200 rounded-lg border border-slate-800/80 flex items-start gap-2 leading-snug"
                      >
                        <span className="text-base shrink-0 leading-none">{item.icon || '📌'}</span>
                        <span className="font-medium break-words leading-tight">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectCategory(category.id)}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
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
