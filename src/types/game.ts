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
  icon?: string;
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

export type RoomPhase = 'LOBBY' | 'CATEGORY_SELECTION' | 'CREATING' | 'GUESSING' | 'REVEAL' | 'SCOREBOARD';

/**
 * Czas na odpowiedzi w rundzie (w sekundach):
 * 60 = 1 minuta, 120 = 2 minuty, 0 = czas nieograniczony
 */
export type AnswerTimeLimit = 60 | 120 | 0;

export const PHASE_DURATIONS: Record<RoomPhase, number> = {
  LOBBY: 0,
  CATEGORY_SELECTION: 45, // Czas na wybór kategorii (z możliwością wyboru wszystkich 12)
  CREATING: 60, // Domyślnie 60 sekund (lub wg wyboru Hosta: 60, 120, 0)
  GUESSING: 60, // Domyślnie 60 sekund (lub wg wyboru Hosta: 60, 120, 0)
  REVEAL: 0,   // Pomijane przez wszystkich graczy po kliknięciu "Dalej" (brak limitu czasu)
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
  answerTimeLimit: AnswerTimeLimit;
  creatorId: string;
  categoryOptions: Category[];
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
   * Gracze, którzy kliknęli "Dalej" w podsumowaniu rundy (REVEAL)
   */
  revealReadyPlayerIds: string[];

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
  answerTimeLimit: AnswerTimeLimit;
  creatorId: string;
  isCurrentUserCreator: boolean;
  categoryOptions: Category[];
  currentCategory: Category | null;
  timeRemaining: number;
  
  // Własne ułożenie bieżącego gracza (dla Twórcy lub Zgadującego)
  myPlacement: TierPlacement | null;
  mySubmitted: boolean;

  // Placement Twórcy jest dostępny TYLKO w fazie REVEAL i SCOREBOARD
  revealedCreatorPlacement: TierPlacement | null;
  
  // Wyniki rundy dostępne w fazach REVEAL i SCOREBOARD
  roundResults: PlayerRoundResult[] | null;

  // ID graczy, którzy kliknęli "Dalej" w fazie REVEAL
  revealReadyPlayerIds: string[];
}
