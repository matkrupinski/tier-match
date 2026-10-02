/**
 * Tier Match - Definicje modeli danych gry (TypeScript)
 */

export type TierLevel = 'S' | 'A' | 'B' | 'C' | 'D';

export const TIERS: TierLevel[] = ['S', 'A', 'B', 'C', 'D'];

export const TIER_CONFIG: Record<TierLevel, { label: string; bgClass: string; borderClass: string; textClass: string; rankValue: number }> = {
  S: { label: 'S', bgClass: 'bg-rose-500/20', borderClass: 'border-rose-500', textClass: 'text-rose-400', rankValue: 4 },
  A: { label: 'A', bgClass: 'bg-orange-500/20', borderClass: 'border-orange-500', textClass: 'text-orange-400', rankValue: 3 },
  B: { label: 'B', bgClass: 'bg-amber-500/20', borderClass: 'border-amber-500', textClass: 'text-amber-400', rankValue: 2 },
  C: { label: 'C', bgClass: 'bg-emerald-500/20', borderClass: 'border-emerald-500', textClass: 'text-emerald-400', rankValue: 1 },
  D: { label: 'D', bgClass: 'bg-sky-500/20', borderClass: 'border-sky-500', textClass: 'text-sky-400', rankValue: 0 },
};

export interface TierItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  items: TierItem[];
}

/**
 * Rozmieszczenie elementów w tierach.
 * Klucz to TierLevel ('S', 'A', 'B', 'C', 'D'), a wartość to tablica ID elementów (TierItem.id).
 * Elementy nieprzypisane do żadnego poziomu znajdują się w puli 'unranked'.
 */
export type TierPlacement = Record<TierLevel, string[]>;

export interface Player {
  id: string;
  name: string;
  avatarUrl: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
  hasSubmitted: boolean;
  roundScore?: number;
}

export type RoomPhase = 'LOBBY' | 'CREATING' | 'GUESSING' | 'REVEAL' | 'SCOREBOARD';

export const PHASE_DURATIONS: Record<RoomPhase, number> = {
  LOBBY: 0,
  CREATING: 45, // 45 sekund dla Twórcy
  GUESSING: 40, // 40 sekund dla Zgadujących
  REVEAL: 15,   // 15 sekund na animowane ujawnienie
  SCOREBOARD: 0,// Czeka na kliknięcie Hosta
};

/**
 * Szczegółowa ocena dopasowania pojedynczego elementu
 */
export interface ItemScoreDetail {
  itemId: string;
  itemName: string;
  creatorTier: TierLevel | null;
  guesserTier: TierLevel | null;
  tierDifference: number; // np. 0 (dokładne), 1 (pomyłka o 1), 2+ (spudłowane)
  pointsAwarded: number; // 3, 1 lub 0
}

/**
 * Wynik rundy dla pojedynczego gracza
 */
export interface PlayerRoundResult {
  playerId: string;
  playerName: string;
  totalPointsGained: number;
  itemDetails: ItemScoreDetail[];
}

/**
 * Autorytatywny stan pokoju przechowywany w całości na serwerze (zawiera sekretne dane)
 */
export interface ServerRoom {
  code: string;
  phase: RoomPhase;
  players: Map<string, Player>;
  currentRound: number;
  maxRounds: number;
  creatorId: string;
  currentCategory: Category | null;
  timeRemaining: number;
  timerIntervalId?: NodeJS.Timeout;
  cleanupTimeout?: NodeJS.Timeout;
  
  /**
   * KRYTYCZNE DLA BEZPIECZEŃSTWA:
   * Wybór Twórcy przechowywany jest na serwerze i NIE JEST wysyłany do zgadujących
   * aż do fazy REVEAL.
   */
  secretCreatorPlacement: TierPlacement | null;
  
  /**
   * Typowania graczy zgadujących w bieżącej rundzie
   */
  guesserPlacements: Map<string, TierPlacement>;
  
  /**
   * Obliczone wyniki po zakończeniu rundy
   */
  roundResults: PlayerRoundResult[] | null;
}

/**
 * Bezpieczny stan pokoju przesyłany do konkretnego klienta (Sanitized State).
 * Zgadujący widzą tylko swoje dane oraz informacje publiczne.
 */
export interface ClientGameState {
  roomCode: string;
  phase: RoomPhase;
  players: Player[];
  currentRound: number;
  maxRounds: number;
  creatorId: string;
  isCurrentUserCreator: boolean;
  currentCategory: Category | null;
  timeRemaining: number;
  
  // Własne ułożenie bieżącego gracza (dla Twórcy lub Zgadującego)
  myPlacement: TierPlacement | null;
  mySubmitted: boolean;

  // Placement Twórcy jest dostępny TYLKO w fazie REVEAL i SCOREBOARD
  revealedCreatorPlacement: TierPlacement | null;
  
  // Wyniki rundy dostępne w fazach REVEAL i SCOREBOARD
  roundResults: PlayerRoundResult[] | null;
}
