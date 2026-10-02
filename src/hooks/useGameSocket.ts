'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientGameState, TierPlacement, AnswerTimeLimit } from '../types/game';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../types/socket';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

// Globalny singleton socketu - nie rozłącza się podczas przejść między stronami
let globalSocket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let globalPlayerId: string | null = null;
let globalGameState: ClientGameState | null = null;

const stateListeners = new Set<(state: ClientGameState | null) => void>();
const connectionListeners = new Set<(connected: boolean) => void>();
const playerIdListeners = new Set<(id: string | null) => void>();
const errorListeners = new Set<(err: string | null) => void>();

function initGlobalSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (typeof window === 'undefined') {
    return {} as any;
  }

  if (!globalSocket) {
    globalSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
    });

    globalSocket.on('connect', () => {
      console.log('[Socket.io Client] Połączono:', globalSocket?.id);
      connectionListeners.forEach((fn) => fn(true));
      errorListeners.forEach((fn) => fn(null));
    });

    globalSocket.on('disconnect', () => {
      console.log('[Socket.io Client] Rozłączono');
      connectionListeners.forEach((fn) => fn(false));
    });

    globalSocket.on('room:joined', ({ playerId }) => {
      globalPlayerId = playerId;
      playerIdListeners.forEach((fn) => fn(playerId));
    });

    globalSocket.on('sync:state', (updatedState) => {
      globalGameState = updatedState;
      stateListeners.forEach((fn) => fn(updatedState));
    });

    globalSocket.on('timer:tick', (secondsRemaining) => {
      if (globalGameState) {
        globalGameState = { ...globalGameState, timeRemaining: secondsRemaining };
        stateListeners.forEach((fn) => fn(globalGameState));
      }
    });

    globalSocket.on('game:error', ({ message }) => {
      errorListeners.forEach((fn) => fn(message));
    });
  }

  return globalSocket;
}

export function useGameSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(globalSocket?.connected || false);
  const [playerId, setPlayerId] = useState<string | null>(globalPlayerId);
  const [gameState, setGameState] = useState<ClientGameState | null>(globalGameState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = initGlobalSocket();

    setIsConnected(socket.connected);
    setPlayerId(globalPlayerId);
    setGameState(globalGameState);

    connectionListeners.add(setIsConnected);
    playerIdListeners.add(setPlayerId);
    stateListeners.add(setGameState);
    errorListeners.add(setError);

    return () => {
      connectionListeners.delete(setIsConnected);
      playerIdListeners.delete(setPlayerId);
      stateListeners.delete(setGameState);
      errorListeners.delete(setError);
      // UWAGA: Nie wywołujemy socket.disconnect() tutaj, aby zachować sesję podczas nawigacji
    };
  }, []);

  // 1. Tworzenie pokoju
  const createRoom = useCallback((playerName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const socket = initGlobalSocket();
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit('room:create', { playerName }, (response) => {
        if (response.success && response.roomCode) {
          resolve(response.roomCode);
        } else {
          reject(new Error(response.error || 'Nie udało się utworzyć pokoju.'));
        }
      });
    });
  }, []);

  // 2. Dołączanie do pokoju
  const joinRoom = useCallback((roomCode: string, playerName: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const socket = initGlobalSocket();
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit('room:join', { roomCode, playerName }, (response) => {
        if (response.success) {
          resolve(true);
        } else {
          reject(new Error(response.error || 'Nie udało się dołączyć do pokoju.'));
        }
      });
    });
  }, []);

  // 2b. Zmiana limitu czasu na odpowiedzi przez Hosta
  const setTimeLimit = useCallback((timeLimit: AnswerTimeLimit) => {
    globalSocket?.emit('room:set_time_limit', { timeLimit });
  }, []);

  // 3. Start gry
  const startGame = useCallback(() => {
    globalSocket?.emit('game:start');
  }, []);

  // Wymuszenie zakończenia etapu przez Hosta
  const forceAdvance = useCallback(() => {
    (globalSocket as any)?.emit('game:force_advance');
  }, []);

  // 3b. Wybór kategorii przez Twórcę
  const selectCategory = useCallback((categoryId: string) => {
    globalSocket?.emit('creator:select_category', { categoryId });
  }, []);

  // 4. Zapis szkicu (Draft)
  const updateDraft = useCallback((placement: TierPlacement) => {
    globalSocket?.emit('placement:draft', { placement });
  }, []);

  // 5. Zatwierdzenie przez Twórcę
  const submitCreator = useCallback((placement: TierPlacement) => {
    globalSocket?.emit('creator:submit', { placement });
  }, []);

  // 6. Zatwierdzenie przez Zgadującego
  const submitGuesser = useCallback((placement: TierPlacement) => {
    globalSocket?.emit('guesser:submit', { placement });
  }, []);

  // 7. Następna runda
  const nextRound = useCallback(() => {
    globalSocket?.emit('game:next_round');
  }, []);

  return {
    socket: globalSocket,
    isConnected,
    playerId,
    gameState,
    error,
    createRoom,
    joinRoom,
    setTimeLimit,
    startGame,
    forceAdvance,
    selectCategory,
    updateDraft,
    submitCreator,
    submitGuesser,
    nextRound,
    clearError: () => setError(null),
  };
}
