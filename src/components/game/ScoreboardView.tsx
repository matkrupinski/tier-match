'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '../../types/game';

interface ScoreboardViewProps {
  players: Player[];
  currentRound: number;
  maxRounds: number;
  isHost: boolean;
  onNextRound: () => void;
}

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({
  players,
  currentRound,
  maxRounds,
  isHost,
  onNextRound,
}) => {
  // Sortowanie graczy według punktów malejąco
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const isGameOver = currentRound >= maxRounds;

  return (
    <div className="w-full max-w-3xl mx-auto p-6 sm:p-8 bg-slate-950/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl text-center">
      {/* Nagłówek */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/40 text-indigo-400 mb-2 inline-block">
          {isGameOver ? '🏁 Koniec Gry!' : `📊 Tabela Wyników • Runda ${currentRound} z ${maxRounds}`}
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
          {isGameOver ? 'Podsumowanie Rozgrywki' : 'Klasyfikacja Generalna'}
        </h2>
      </motion.div>

      {/* Podium dla Top 3 */}
      {sortedPlayers.length >= 2 && (
        <div className="flex justify-center items-end gap-3 sm:gap-6 mb-8 pt-6">
          {/* Miejsce 2 */}
          {sortedPlayers[1] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center w-24 sm:w-28"
            >
              <div className="relative mb-2">
                <img
                  src={sortedPlayers[1].avatarUrl}
                  alt={sortedPlayers[1].name}
                  className="w-14 h-14 rounded-full border-2 border-slate-400 bg-slate-800"
                />
                <span className="absolute -top-2 -right-1 text-xl">🥈</span>
              </div>
              <div className="text-xs font-bold text-slate-300 truncate w-full text-center">
                {sortedPlayers[1].name}
              </div>
              <div className="text-sm font-black text-slate-400 font-mono">
                {sortedPlayers[1].score} pkt
              </div>
              <div className="w-full h-16 bg-gradient-to-t from-slate-800 to-slate-700/60 rounded-t-xl mt-2 flex items-center justify-center font-black text-slate-500">
                #2
              </div>
            </motion.div>
          )}

          {/* Miejsce 1 (Zwycięzca) */}
          {sortedPlayers[0] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center w-28 sm:w-32"
            >
              <div className="relative mb-2">
                <img
                  src={sortedPlayers[0].avatarUrl}
                  alt={sortedPlayers[0].name}
                  className="w-16 h-16 rounded-full border-2 border-amber-400 bg-slate-800 ring-4 ring-amber-400/20 shadow-lg shadow-amber-500/20"
                />
                <span className="absolute -top-3 -right-1 text-2xl animate-bounce">👑</span>
              </div>
              <div className="text-sm font-extrabold text-amber-300 truncate w-full text-center">
                {sortedPlayers[0].name}
              </div>
              <div className="text-base font-black text-amber-400 font-mono">
                {sortedPlayers[0].score} pkt
              </div>
              <div className="w-full h-24 bg-gradient-to-t from-amber-500/30 to-amber-500/60 border-t border-amber-400/50 rounded-t-xl mt-2 flex items-center justify-center font-black text-amber-200 text-lg">
                #1
              </div>
            </motion.div>
          )}

          {/* Miejsce 3 */}
          {sortedPlayers[2] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center w-24 sm:w-28"
            >
              <div className="relative mb-2">
                <img
                  src={sortedPlayers[2].avatarUrl}
                  alt={sortedPlayers[2].name}
                  className="w-12 h-12 rounded-full border-2 border-amber-700 bg-slate-800"
                />
                <span className="absolute -top-2 -right-1 text-xl">🥉</span>
              </div>
              <div className="text-xs font-bold text-slate-300 truncate w-full text-center">
                {sortedPlayers[2].name}
              </div>
              <div className="text-sm font-black text-amber-600 font-mono">
                {sortedPlayers[2].score} pkt
              </div>
              <div className="w-full h-12 bg-gradient-to-t from-amber-900/40 to-amber-800/40 rounded-t-xl mt-2 flex items-center justify-center font-black text-amber-700">
                #3
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Lista wszystkich graczy */}
      <div className="space-y-2 mb-8 text-left">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-slate-500 w-6 text-center">
                #{index + 1}
              </span>
              <img
                src={player.avatarUrl}
                alt={player.name}
                className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800"
              />
              <span className="font-bold text-white text-sm">{player.name}</span>
              {player.roundScore !== undefined && player.roundScore > 0 && (
                <span className="text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md font-semibold">
                  +{player.roundScore} w tej rundzie
                </span>
              )}
            </div>

            <span className="font-mono font-black text-lg text-indigo-400">
              {player.score} pkt
            </span>
          </motion.div>
        ))}
      </div>

      {/* Przyciski nawigacyjne */}
      {isHost ? (
        <button
          onClick={onNextRound}
          className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 active:scale-95 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-500/25 transition-all"
        >
          {isGameOver ? 'Rozpocznij Nowy Mecz' : 'Przejdź do Następnej Rundy →'}
        </button>
      ) : (
        <div className="text-sm text-slate-500 animate-pulse">
          Oczekiwanie na przejście do kolejnej rundy przez Gospodarza...
        </div>
      )}
    </div>
  );
};
