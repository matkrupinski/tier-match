'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, Player } from '../../types/game';

interface CategorySelectionViewProps {
  categoryOptions: Category[];
  isCreator: boolean;
  creatorName: string;
  timeRemaining: number;
  players?: Player[];
  onSelectCategory: (categoryId: string) => void;
}

export const CategorySelectionView: React.FC<CategorySelectionViewProps> = ({
  categoryOptions,
  isCreator,
  creatorName,
  timeRemaining,
  players = [],
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Wyodrębnienie nazw zgadujących
  const guesserNames = useMemo(() => {
    return players
      .filter((p) => p.name.toLowerCase() !== creatorName.toLowerCase())
      .map((p) => p.name);
  }, [players, creatorName]);

  // Filtrowanie kategorii po nazwie, opisie i elementach
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoryOptions;
    const q = searchQuery.toLowerCase();
    return categoryOptions.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.items.some((item) => item.name.toLowerCase().includes(q))
    );
  }, [categoryOptions, searchQuery]);

  // Losowy wybór kategorii
  const handleRandomSelect = () => {
    const list = filteredCategories.length > 0 ? filteredCategories : categoryOptions;
    if (list.length === 0) return;
    const randomCat = list[Math.floor(Math.random() * list.length)];
    onSelectCategory(randomCat.id);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl text-center">
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

      {/* SEKCJA 1: Wyjaśnienie ról w nadchodzącej rundzie */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/30 text-left shadow-xl"
      >
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
            <span>📢</span> Role przed rozpoczęciem rundy:
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Zasada gry: 1 Twórca układa, pozostali zgadują
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Rola Twórcy */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isCreator
                ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/30'
                : 'bg-slate-950/60 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <span className="font-extrabold text-sm text-amber-400">Twórca Listy:</span>
                <span className="font-black text-white text-sm bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  {creatorName}
                </span>
              </div>
              {isCreator && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  TO TY!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Wybiera kategorię i <strong>układa swoją sekretną Tier Listę</strong> od poziomu S do D według własnego gustu.
            </p>
          </div>

          {/* Rola Zgadujących */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              !isCreator
                ? 'bg-indigo-500/10 border-indigo-500/60 ring-2 ring-indigo-500/30'
                : 'bg-slate-950/60 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span className="font-extrabold text-sm text-indigo-400">Zgadujący:</span>
                <span className="font-black text-white text-sm bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 truncate max-w-[150px] sm:max-w-[200px]">
                  {guesserNames.length > 0 ? guesserNames.join(', ') : 'Pozostali gracze'}
                </span>
              </div>
              {!isCreator && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                  TWOJA ROLA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Próbują <strong>odgadnąć, jak {creatorName} oceni poszczególne elementy</strong>. Trafienie w ten sam poziom daje +3 punkty!
            </p>
          </div>
        </div>
      </motion.div>

      {/* SEKCJA 2: Nagłówek wyboru kategorii */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          {isCreator ? (
            <>
              Wybierz temat z listy{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400">
                Wszystkich Kategorii
              </span>
            </>
          ) : (
            <>
              <span className="text-indigo-400">{creatorName}</span> przegląda listę kategorii...
            </>
          )}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
          {isCreator
            ? `Dostępne jest ${categoryOptions.length} unikalnych tematów. Wybierz swój ulubiony lub wylosuj!`
            : `Twórca wybiera jedną z ${categoryOptions.length} dostępnych kategorii. Przygotuj się do odgadywania jego gustu!`}
        </p>
      </div>

      {/* Pasek Wyszukiwania i Losowania (Widoczny dla Twórcy) */}
      {isCreator && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-72 text-left">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj kategorii..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-400 font-medium">
              Widoczne: <strong className="text-white">{filteredCategories.length}</strong> z {categoryOptions.length}
            </span>
            <button
              type="button"
              onClick={handleRandomSelect}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>🎲</span>
              <span>Losowa kategoria</span>
            </button>
          </div>
        </div>
      )}

      {/* Widok dla Twórcy: Pełna lista wszystkich kategorii w siatce */}
      {isCreator ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-4 text-left">
          {filteredCategories.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.4) }}
              whileHover={{ scale: 1.015, y: -2 }}
              className="p-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/60 rounded-2xl flex flex-col justify-between shadow-xl transition-all group"
            >
              <div>
                <div className="flex items-start gap-3 mb-2.5">
                  <span className="text-3xl shrink-0 leading-none">{category.icon || '🎭'}</span>
                  <div>
                    <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors leading-snug break-words">
                      {category.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Lista elementów kategorii */}
                <div className="pt-3 border-t border-slate-800/80 mb-4">
                  <div className="flex items-center justify-between text-[11px] uppercase font-bold text-slate-500 mb-2">
                    <span>Elementy do rankingu:</span>
                    <span className="text-slate-400 font-mono">{category.items.length} szt.</span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-none">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className="text-xs p-1.5 sm:p-2 bg-slate-950/80 text-slate-200 rounded-lg border border-slate-800/70 flex items-start gap-2 leading-tight"
                      >
                        <span className="text-sm shrink-0 leading-none">{item.icon || '📌'}</span>
                        <span className="font-medium break-words leading-tight flex-1">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>Wybierz tę kategorię</span>
                <span>→</span>
              </button>
            </motion.div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              <span className="text-3xl block mb-2">🔍</span>
              Nie znaleziono kategorii pasującej do „{searchQuery}”.
            </div>
          )}
        </div>
      ) : (
        /* Widok dla Zgadujących: Karty oczekiwania na wybór Twórcy */
        <div className="space-y-4 mb-4">
          <div className="p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center min-h-[220px]">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-5xl mb-4 block"
            >
              🎲
            </motion.span>
            <h4 className="text-lg font-bold text-white mb-2">
              Twórca przegląda {categoryOptions.length} dostępnych kategorii
            </h4>
            <p className="text-xs text-slate-400 max-w-md">
              Zaraz po wybraniu tematu runda się rozpocznie – najpierw {creatorName} ułoży swój ranking, a potem Ty spróbujesz go odgadnąć!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left opacity-60">
            {categoryOptions.slice(0, 8).map((cat) => (
              <div
                key={cat.id}
                className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center gap-2"
              >
                <span className="text-xl">{cat.icon || '📌'}</span>
                <span className="text-xs font-bold text-slate-300 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
