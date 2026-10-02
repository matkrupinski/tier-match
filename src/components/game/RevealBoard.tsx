'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Category,
  ItemScoreDetail,
  Player,
  PlayerRoundResult,
  TierLevel,
  TierPlacement,
  TIERS,
  TIER_CONFIG,
} from '../../types/game';

interface RevealBoardProps {
  category: Category;
  creatorPlacement: TierPlacement;
  creatorName: string;
  roundResults: PlayerRoundResult[];
  currentUserId: string;
  players: Player[];
}

export const RevealBoard: React.FC<RevealBoardProps> = ({
  category,
  creatorPlacement,
  creatorName,
  roundResults,
  currentUserId,
  players,
}) => {
  // Wybrany gracz do wglądu (domyślnie bieżący użytkownik, lub pierwszy zgadujący jeśli to Twórca)
  const defaultSelectedId =
    roundResults.find((r) => r.playerId === currentUserId)?.playerId ||
    roundResults[0]?.playerId ||
    '';

  const [inspectedPlayerId, setInspectedPlayerId] = useState<string>(defaultSelectedId);

  // Mapa elementów
  const itemsMap = React.useMemo(() => {
    const map = new Map(category.items.map((i) => [i.id, i]));
    return map;
  }, [category]);

  const activeResult = roundResults.find((r) => r.playerId === inspectedPlayerId);

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 bg-slate-950/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl">
      {/* Nagłówek Fazy REVEAL */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/40 text-amber-400 mb-3"
        >
          ✨ Odsłonięcie Wyników Rundy ✨
        </motion.div>
        <h2 className="text-2xl sm:text-4xl font-black text-white">
          Oficjalna Tier Lista gracza{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400">
            {creatorName}
          </span>
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          Kategoria: <strong className="text-slate-200">{category.name}</strong>
        </p>
      </div>

      {/* Przełącznik graczy (kogo typy przeglądamy) */}
      {roundResults.length > 1 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-6">
          <span className="text-xs uppercase font-bold text-slate-500 mr-2">Typowania gracza:</span>
          {roundResults.map((r) => {
            const isMe = r.playerId === currentUserId;
            const isSelected = r.playerId === inspectedPlayerId;
            return (
              <button
                key={r.playerId}
                onClick={() => setInspectedPlayerId(r.playerId)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{r.playerName}</span>
                {isMe && <span className="text-[10px] bg-indigo-950/80 px-1 rounded">TY</span>}
                <span className="text-amber-400 font-mono">+{r.totalPointsGained} pkt</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Podgląd oficjalnej listy Twórcy wraz z weryfikacją trafień */}
      <div className="space-y-4 mb-8">
        {TIERS.map((tier, tierIndex) => {
          const itemIds = creatorPlacement[tier] || [];
          const tierConfig = TIER_CONFIG[tier];

          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: tierIndex * 0.15, duration: 0.4 }}
              className={`flex flex-col sm:flex-row border-2 rounded-2xl overflow-hidden ${tierConfig.borderClass} bg-slate-900/60 shadow-lg`}
            >
              {/* Kolumna Tieru */}
              <div
                className={`w-full sm:w-28 flex items-center justify-center p-3 sm:p-0 font-black text-3xl tracking-wider ${tierConfig.bgClass} ${tierConfig.textClass} shrink-0`}
              >
                {tier}
              </div>

              {/* Elementy w danym Tierze z porównaniem */}
              <div className="flex-1 flex flex-wrap items-center gap-3 p-3.5 bg-slate-950/40">
                {itemIds.length === 0 ? (
                  <span className="text-xs text-slate-600 italic py-2">Pusty poziom</span>
                ) : (
                  itemIds.map((itemId, itemIndex) => {
                    const item = itemsMap.get(itemId);
                    const detail = activeResult?.itemDetails.find((d) => d.itemId === itemId);

                    if (!item) return null;

                    const points = detail?.pointsAwarded ?? 0;
                    const guesserTier = detail?.guesserTier;

                    return (
                      <motion.div
                        key={itemId}
                        initial={{ opacity: 0, scale: 0.8, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          delay: tierIndex * 0.15 + itemIndex * 0.1,
                          type: 'spring',
                          stiffness: 260,
                          damping: 20,
                        }}
                        className={`p-3 rounded-xl border flex flex-col gap-1.5 shadow-md min-w-[210px] max-w-[280px] ${
                          points === 3
                            ? 'bg-emerald-950/40 border-emerald-500/80 ring-2 ring-emerald-500/30'
                            : points === 1
                            ? 'bg-amber-950/30 border-amber-500/70'
                            : 'bg-slate-900 border-slate-800 opacity-70'
                        }`}
                      >
                        {/* Nazwa i ikona elementu */}
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon || '📌'}</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-200 leading-snug line-clamp-2">
                            {item.name}
                          </span>
                        </div>

                        {/* Wskaźnik trafienia */}
                        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-800 text-xs">
                          <div className="text-slate-400">
                            Typ:{' '}
                            <span
                              className={`font-black px-1.5 py-0.5 rounded text-xs ${
                                guesserTier ? TIER_CONFIG[guesserTier].textClass : 'text-slate-500'
                              } bg-slate-950`}
                            >
                              {guesserTier || 'Brak'}
                            </span>
                          </div>

                          {points === 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] shadow-sm animate-bounce">
                              +3 PKT 🎯
                            </span>
                          )}
                          {points === 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] border border-amber-500/40">
                              +1 PKT 🤏
                            </span>
                          )}
                          {points === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 font-medium text-[11px]">
                              0 PKT 💨
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Podsumowanie punktacji w rundzie dla wszystkich */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <span>🏆</span> Wyniki tej rundy:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {roundResults.map((result) => {
            const player = players.find((p) => p.id === result.playerId);
            const isMe = result.playerId === currentUserId;

            return (
              <motion.div
                key={result.playerId}
                whileHover={{ scale: 1.02 }}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isMe
                    ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <img
                      src={player?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${result.playerName}`}
                      alt={result.playerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      {result.playerName}
                      {isMe && <span className="text-[10px] text-indigo-400 font-mono">(Ty)</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Suma ogólna: <strong className="text-slate-200">{player?.score || 0} pkt</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    +{result.totalPointsGained}
                  </span>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">punktów</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
