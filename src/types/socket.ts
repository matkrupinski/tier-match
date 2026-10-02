/**
 * Tier Match - Protokół zdarzeń WebSocket (Socket.io)
 */

import { ClientGameState, TierPlacement, PlayerRoundResult, RoomPhase, TierLevel } from './game';

export interface CreateRoomPayload {
  playerName: string;
  avatarUrl?: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  avatarUrl?: string;
}

export interface SubmitPlacementPayload {
  placement: TierPlacement;
}

export interface UpdateDraftPayload {
  placement: TierPlacement;
}

export interface RevealStepPayload {
  stepIndex: number;
  tier: TierLevel;
  itemIds: string[];
}

/**
 * Zdarzenia wysyłane przez Klienta do Serwera
 */
export interface ClientToServerEvents {
  // Zarządzanie pokojem
  'room:create': (payload: CreateRoomPayload, callback?: (response: { success: boolean; roomCode?: string; error?: string }) => void) => void;
  'room:join': (payload: JoinRoomPayload, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'room:leave': () => void;

  // Przebieg rozgrywki
  'game:start': () => void;
  'creator:select_category': (payload: { categoryId: string }) => void;
  'placement:draft': (payload: UpdateDraftPayload) => void;
  'creator:submit': (payload: SubmitPlacementPayload) => void;
  'guesser:submit': (payload: SubmitPlacementPayload) => void;
  'game:next_round': () => void;
  'game:restart': () => void;
}

/**
 * Zdarzenia wysyłane przez Serwer do Klienta
 */
export interface ServerToClientEvents {
  // Pełna synchronizacja stanu dopasowana do uprawnień gracza
  'sync:state': (state: ClientGameState) => void;

  // Informacja zwrotna po dołączeniu
  'room:joined': (data: { playerId: string; roomCode: string }) => void;

  // Licznik czasu
  'timer:tick': (secondsRemaining: number) => void;

  // Zmiana fazy pokoju
  'phase:changed': (data: { phase: RoomPhase; timeLimit: number }) => void;

  // Status gracza (np. że oddał swój typ)
  'player:status_updated': (data: { playerId: string; hasSubmitted: boolean }) => void;

  // Start animacji odsłaniania
  'reveal:started': (data: {
    revealedCreatorPlacement: TierPlacement;
    results: PlayerRoundResult[];
  }) => void;

  // Krokowa animacja odsłaniania kolejnych tierów (D -> C -> B -> A -> S)
  'reveal:step': (data: RevealStepPayload) => void;

  // Błędy
  'game:error': (data: { message: string; code?: string }) => void;
}

/**
 * Dane sesji powiązane z gniazdem Socket.io
 */
export interface SocketData {
  playerId: string;
  roomCode?: string;
}
