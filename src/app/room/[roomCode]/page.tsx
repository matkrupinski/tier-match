'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameSocket } from '../../../hooks/useGameSocket';
import { LobbyView } from '../../../components/game/LobbyView';
import { TierBoard } from '../../../components/game/TierBoard';
import { RevealBoard } from '../../../components/game/RevealBoard';
import { ScoreboardView } from '../../../components/game/ScoreboardView';
import { TimerBar } from '../../../components/game/TimerBar';
import { PlayerStatusList } from '../../../components/game/PlayerStatusList';
import { TierPlacement, PHASE_DURATIONS } from '../../../types/game';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = String(params.roomCode || '').toUpperCase();

  const {
    isConnected,
    playerId,
    gameState,
    error,
    joinRoom,
    startGame,
    updateDraft,
    submitCreator,
    submitGuesser,
    nextRound,
  } = useGameSocket();

  // Lokalny stan ułożenia kafelków w bieżącej rundzie
  const [localPlacement, setLocalPlacement] = useState<TierPlacement>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  });

  // Reset lokalnego placementu przy zmianie rundy
  useEffect(() => {
    if (gameState?.phase === 'CREATING') {
      setLocalPlacement({
        S: [],
        A: [],
        B: [],
        C: [],
        D: [],
      });
    }
  }, [gameState?.currentRound, gameState?.phase]);

  // Synchronizacja, jeśli serwer zwrócił już zapisany placement gracza
  useEffect(() => {
    if (gameState?.myPlacement) {
      setLocalPlacement(gameState.myPlacement);
    }
  }, [gameState?.myPlacement]);

  // Próba automatycznego dołączenia, jeśli gracz odświeżył stronę a ma nick w sessionStorage
  useEffect(() => {
    if (isConnected && !gameState && roomCode) {
      const storedName = sessionStorage.getItem('tier_match_player_name') || `Gracz_${Math.floor(Math.random() * 900 + 100)}`;
      joinRoom(roomCode, storedName).catch(() => {
        // Jeśli pokój nie istnieje, przekieruj do strony głównej
        router.push('/');
      });
    }
  }, [isConnected, gameState, roomCode, joinRoom, router]);

  // Obsługa zmiany ułożenia w TierBoard
  const handlePlacementChange = (newPlacement: TierPlacement) => {
    setLocalPlacement(newPlacement);
    // Wyślij szkic do serwera (auto-save)
    updateDraft(newPlacement);
  };

  // Zatwierdzenie
  const handleSubmit = () => {
    if (!gameState) return;
    if (gameState.isCurrentUserCreator) {
      submitCreator(localPlacement);
    } else {
      submitGuesser(localPlacement);
    }
  };

  if (!isConnected || !gameState) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">
          Łączenie z pokojem gier <strong className="text-white">{roomCode}</strong>...
        </p>
      </div>
    );
  }

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const isHost = !!currentPlayer?.isHost;
  const creatorPlayer = gameState.players.find((p) => p.id === gameState.creatorId);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Pasek Błędów */}
      {error && (
        <div className="w-full max-w-4xl mb-4 p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-bold text-center">
          ⚠️ {error}
        </div>
      )}

      {/* Licznik czasu i statusy graczy (aktywne podczas gry) */}
      {gameState.phase !== 'LOBBY' && gameState.phase !== 'SCOREBOARD' && (
        <div className="w-full max-w-4xl">
          <TimerBar
            timeRemaining={gameState.timeRemaining}
            totalTime={PHASE_DURATIONS[gameState.phase] || 45}
          />
          <PlayerStatusList
            players={gameState.players}
            creatorId={gameState.creatorId}
            currentUserId={playerId || ''}
          />
        </div>
      )}

      {/* 1. FAZA LOBBY */}
      {gameState.phase === 'LOBBY' && (
        <LobbyView
          roomCode={gameState.roomCode}
          players={gameState.players}
          currentUserId={playerId || ''}
          isHost={isHost}
          onStartGame={startGame}
        />
      )}

      {/* 2. FAZA CREATING & GUESSING */}
      {(gameState.phase === 'CREATING' || gameState.phase === 'GUESSING') && gameState.currentCategory && (
        <>
          {/* Widok dla Twórcy w fazie tworzenia */}
          {gameState.isCurrentUserCreator && gameState.phase === 'CREATING' && (
            <TierBoard
              mode="creator"
              category={gameState.currentCategory}
              placement={localPlacement}
              onPlacementChange={handlePlacementChange}
              onSubmit={handleSubmit}
              isSubmitted={gameState.mySubmitted}
              timeRemaining={gameState.timeRemaining}
            />
          )}

          {/* Twórca w fazie gdy zgadują inni */}
          {gameState.isCurrentUserCreator && gameState.phase === 'GUESSING' && (
            <div className="w-full max-w-3xl p-8 bg-slate-950/90 border border-slate-800 rounded-3xl text-center">
              <div className="text-4xl mb-3">🤫</div>
              <h3 className="text-2xl font-black text-white mb-2">
                Twój ranking został zablokowany!
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                Pozostali gracze gorączkowo próbują odgadnąć Twój gust. Przygotuj się na odsłonięcie prawdy!
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full text-indigo-400 font-mono text-sm">
                <span>Czas zgadywania:</span>
                <span className="font-bold text-amber-400">{gameState.timeRemaining}s</span>
              </div>
            </div>
          )}

          {/* Widok dla Zgadującego */}
          {!gameState.isCurrentUserCreator && (
            <TierBoard
              mode="guesser"
              category={gameState.currentCategory}
              placement={localPlacement}
              onPlacementChange={handlePlacementChange}
              onSubmit={handleSubmit}
              isSubmitted={gameState.mySubmitted}
              creatorName={creatorPlayer?.name || 'Twórca'}
              timeRemaining={gameState.timeRemaining}
            />
          )}
        </>
      )}

      {/* 3. FAZA REVEAL */}
      {gameState.phase === 'REVEAL' && gameState.currentCategory && gameState.revealedCreatorPlacement && (
        <RevealBoard
          category={gameState.currentCategory}
          creatorPlacement={gameState.revealedCreatorPlacement}
          creatorName={creatorPlayer?.name || 'Twórca'}
          roundResults={gameState.roundResults || []}
          currentUserId={playerId || ''}
          players={gameState.players}
        />
      )}

      {/* 4. FAZA SCOREBOARD */}
      {gameState.phase === 'SCOREBOARD' && (
        <ScoreboardView
          players={gameState.players}
          currentRound={gameState.currentRound}
          maxRounds={gameState.maxRounds}
          isHost={isHost}
          onNextRound={nextRound}
        />
      )}
    </div>
  );
}
