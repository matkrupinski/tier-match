'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientGameState, TierPlacement } from '../types/game';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../types/socket';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export function useGameSocket() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicjalizacja klienta Socket.io
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.io Client] Połączono z serwerem gier:', socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io Client] Rozłączono z serwerem');
      setIsConnected(false);
    });

    socket.on('room:joined', ({ playerId }) => {
      setPlayerId(playerId);
    });

    socket.on('sync:state', (updatedState) => {
      setGameState(updatedState);
    });

    socket.on('timer:tick', (secondsRemaining) => {
      setGameState((prev) => (prev ? { ...prev, timeRemaining: secondsRemaining } : null));
    });

    socket.on('game:error', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 1. Tworzenie pokoju
  const createRoom = useCallback((playerName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Brak połączenia z serwerem.'));

      socketRef.current.emit('room:create', { playerName }, (response) => {
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
      if (!socketRef.current) return reject(new Error('Brak połączenia z serwerem.'));

      socketRef.current.emit('room:join', { roomCode, playerName }, (response) => {
        if (response.success) {
          resolve(true);
        } else {
          reject(new Error(response.error || 'Nie udało się dołączyć do pokoju.'));
        }
      });
    });
  }, []);

  // 3. Start gry
  const startGame = useCallback(() => {
    socketRef.current?.emit('game:start');
  }, []);

  // 4. Zapis szkicu (Draft)
  const updateDraft = useCallback((placement: TierPlacement) => {
    socketRef.current?.emit('placement:draft', { placement });
  }, []);

  // 5. Zatwierdzenie przez Twórcę
  const submitCreator = useCallback((placement: TierPlacement) => {
    socketRef.current?.emit('creator:submit', { placement });
  }, []);

  // 6. Zatwierdzenie przez Zgadującego
  const submitGuesser = useCallback((placement: TierPlacement) => {
    socketRef.current?.emit('guesser:submit', { placement });
  }, []);

  // 7. Następna runda
  const nextRound = useCallback(() => {
    socketRef.current?.emit('game:next_round');
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    playerId,
    gameState,
    error,
    createRoom,
    joinRoom,
    startGame,
    updateDraft,
    submitCreator,
    submitGuesser,
    nextRound,
    clearError: () => setError(null),
  };
}
