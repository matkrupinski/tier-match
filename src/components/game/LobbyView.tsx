'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Player, AnswerTimeLimit } from '../../types/game';

interface LobbyViewProps {
  roomCode: string;
  players: Player[];
  currentUserId: string;
  isHost: boolean;
  answerTimeLimit?: AnswerTimeLimit;
  onSetTimeLimit?: (timeLimit: AnswerTimeLimit) => void;
  onStartGame: () => void;
  onUpdateName?: (newName: string) => Promise<boolean>;
}

const TIME_LIMIT_OPTIONS: { value: AnswerTimeLimit; label: string; icon: string; description: string }[] = [
  {
    value: 60,
    label: '1 minuta',
    icon: '⚡',
    description: 'Szybka runda (60s) – dynamiczna zabawa',
  },
  {
    value: 120,
    label: '2 minuty',
    icon: '⏳',
    description: 'Więcej czasu (120s) na przemyślenie i dyskusję',
  },
  {
    value: 0,
    label: 'Czas nieograniczony',
    icon: '♾️',
    description: 'Bez presji zegara – runda trwa, aż gracze zatwierdzą',
  },
];

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomCode,
  players,
  currentUserId,
  isHost,
  answerTimeLimit = 60,
  onSetTimeLimit,
  onStartGame,
  onUpdateName,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim() || editedName.trim().length < 2) {
      setNameError('Minimum 2 znaki');
      return;
    }
    if (!onUpdateName) return;

    try {
      setIsSavingName(true);
      setNameError(null);
      await onUpdateName(editedName.trim());
      setIsEditingName(false);
    } catch (err: any) {
      setNameError(err.message || 'Błąd zmiany nicku');
    } finally {
      setIsSavingName(false);
    }
  };

  const canStart = players.length >= 2;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 sm:p-10 bg-slate-950/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl">
      {/* Kod Pokoju */}
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-widest font-black text-slate-500 mb-2 block">
          Kod Twojego Pokoju
        </span>
        <div className="inline-flex items-center gap-3 p-2 pl-6 bg-slate-900 border-2 border-indigo-500/40 rounded-2xl shadow-lg">
          <span className="font-mono text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 tracking-wider">
            {roomCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            {copied ? 'Skopiowano! ✓' : 'Kopiuj'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Udostępnij ten kod znajomym, aby dołączyli do gry ze swoich telefonów lub komputerów.
        </p>
      </div>

      {/* Siatka Graczy w Lobby */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm uppercase tracking-wider font-extrabold text-slate-300 flex items-center gap-2">
            <span>👥 Gracze w pokoju:</span>
            <span className="bg-slate-800 px-2.5 py-0.5 rounded-full text-indigo-400 font-mono text-xs">
              {players.length} / 8
            </span>
          </h3>
          {!canStart && (
            <span className="text-xs text-amber-400/80 font-medium">
              Wymaganych min. 2 graczy do startu
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {players.map((player) => {
            const isMe = player.id === currentUserId;

            return (
              <motion.div
                key={player.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 relative transition-all ${
                  isMe
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {player.isHost && (
                  <span
                    className="absolute top-2 right-2 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold"
                    title="Gospodarz pokoju"
                  >
                    👑 HOST
                  </span>
                )}

                <div className="w-16 h-16 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-700 mt-1">
                  <img
                    src={player.avatarUrl}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="w-full">
                  {isMe && isEditingName ? (
                    <form onSubmit={handleSaveName} className="w-full flex flex-col items-center gap-1 mt-1">
                      <div className="flex items-center gap-1 w-full">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          maxLength={15}
                          autoFocus
                          placeholder="Nowy nick"
                          className="w-full px-2 py-1 text-xs bg-slate-950 border border-indigo-500 rounded-lg text-white outline-none text-center"
                        />
                        <button
                          type="submit"
                          disabled={isSavingName}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingName(false);
                            setNameError(null);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      {nameError && (
                        <span className="text-[10px] text-rose-400 font-semibold">{nameError}</span>
                      )}
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="font-bold text-sm text-white truncate max-w-[120px]">{player.name}</div>
                        {isMe && onUpdateName && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditedName(player.name);
                              setIsEditingName(true);
                              setNameError(null);
                            }}
                            className="text-slate-400 hover:text-indigo-300 text-xs cursor-pointer p-0.5"
                            title="Zmień swój pseudonim"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                      {isMe && <div className="text-[11px] text-indigo-400 font-medium">(Ty)</div>}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Wybór Czasu na Odpowiedzi (1 min, 2 min, Czas nieograniczony) */}
      <div className="p-5 sm:p-6 bg-slate-900/60 border border-slate-800 rounded-2xl mb-8 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>⏱️</span> Czas na odpowiedzi w rundzie:
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {isHost
                ? 'Określ, ile czasu gracze mają na ułożenie i odgadnięcie tier listy.'
                : 'Ustawienie wybrane przez gospodarza pokoju (Host):'}
            </p>
          </div>
          {!isHost && (
            <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
              👑 Wybiera Gospodarz
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TIME_LIMIT_OPTIONS.map((opt) => {
            const isSelected = answerTimeLimit === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                disabled={!isHost}
                onClick={() => isHost && onSetTimeLimit?.(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-950/90 to-purple-950/60 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-70'
                } ${isHost ? 'cursor-pointer hover:opacity-100 active:scale-95' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl leading-none">{opt.icon}</span>
                  {isSelected && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500 text-white shadow-sm">
                      Aktywne
                    </span>
                  )}
                </div>
                <div className="font-black text-sm sm:text-base text-white">{opt.label}</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">{opt.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Skrót Zasad Rozgrywki */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl mb-8 text-left">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <span>📜</span> Zasady i Punktacja Tier Match:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
            <div className="font-bold text-emerald-400 mb-1">🎯 Trafienie w dziesiątkę</div>
            <p className="text-slate-300">
              Ten sam poziom co Twórca = <strong className="text-emerald-300">+3 punkty</strong>
            </p>
          </div>
          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl">
            <div className="font-bold text-amber-400 mb-1">🤏 Bliskie pudło</div>
            <p className="text-slate-300">
              Pomyłka o 1 poziom (np. S vs A) = <strong className="text-amber-300">+1 punkt</strong>
            </p>
          </div>
          <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <div className="font-bold text-slate-400 mb-1">💨 Pomyłka o 2+ poziomy</div>
            <p className="text-slate-400">
              Rozbieżność o 2 lub więcej = <strong className="text-slate-300">0 punktów</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Przycisk Startu dla Hosta */}
      <div className="text-center">
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`px-10 py-4 rounded-2xl font-black text-lg tracking-wide shadow-2xl transition-all ${
              canStart
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white active:scale-95 shadow-emerald-500/30 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {canStart ? '🚀 Rozpocznij Grę!' : 'Czekaj na drugiego gracza...'}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            <span>Oczekiwanie na rozpoczęcie gry przez gospodarza pokoju...</span>
          </div>
        )}
      </div>
    </div>
  );
};
