'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameSocket } from '../hooks/useGameSocket';

export default function HomePage() {
  const router = useRouter();
  const { createRoom, joinRoom, error, clearError } = useGameSocket();

  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setLocalError('Wprowadź swój pseudonim.');
      return;
    }

    try {
      setIsCreating(true);
      setLocalError(null);
      const code = await createRoom(playerName.trim());
      // Zapisujemy nick w sessionStorage na wypadek odświeżenia
      sessionStorage.setItem('tier_match_player_name', playerName.trim());
      router.push(`/room?code=${code}`);
    } catch (err: any) {
      setLocalError(err.message || 'Nie udało się stworzyć pokoju.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setLocalError('Wprowadź swój pseudonim.');
      return;
    }
    if (!roomCode.trim()) {
      setLocalError('Wprowadź kod pokoju.');
      return;
    }

    try {
      setIsJoining(true);
      setLocalError(null);
      const normalizedCode = roomCode.trim().toUpperCase();
      await joinRoom(normalizedCode, playerName.trim());
      sessionStorage.setItem('tier_match_player_name', playerName.trim());
      router.push(`/room?code=${normalizedCode}`);
    } catch (err: any) {
      setLocalError(err.message || 'Nie udało się dołączyć do pokoju.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-3">
          Multiplayer Party Game
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3">
          Jak dobrze znasz gust swoich znajomych?
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
          Jeden gracz układa sekretną Tier Listę od S do D. Pozostali próbują ją odgadnąć w czasie rzeczywistym!
        </p>
      </motion.div>

      {/* Karta formularza */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
      >
        {(error || localError) && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center justify-between">
            <span>⚠️ {error || localError}</span>
            <button
              onClick={() => {
                clearError();
                setLocalError(null);
              }}
              className="text-slate-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Pole Pseudonimu */}
        <div className="mb-6">
          <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">
            Twój Pseudonim
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="np. MistrzRankingów"
            maxLength={18}
            className="w-full px-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stwórz Nowy Pokój */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-base font-black text-white mb-1">Załóż Pokój</div>
              <p className="text-xs text-slate-400 mb-4">
                Będziesz gospodarzem (Hostem) i poprowadzisz rozgrywkę.
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isCreating ? 'Tworzenie...' : 'Stwórz Pokój 👑'}
            </button>
          </div>

          {/* Dołącz do Pokoju */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-base font-black text-white mb-1">Dołącz Kodem</div>
              <p className="text-xs text-slate-400 mb-2">
                Wpisz 5-znakowy kod otrzymany od znajomego.
              </p>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="np. TIER4"
                maxLength={6}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono uppercase font-bold text-center tracking-widest placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isJoining ? 'Dołączanie...' : 'Dołącz do Gry 🚀'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
