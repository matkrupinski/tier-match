/**
 * Tier Match - Silnik gry, algorytm punktacji i baza kategorii
 */

import {
  Category,
  ClientGameState,
  ItemScoreDetail,
  PlayerRoundResult,
  ServerRoom,
  TierLevel,
  TierPlacement,
  TIER_CONFIG,
} from '../../src/types/game';

/**
 * Przykładowe bogate kategorie i elementy do gry imprezowej
 */
export const CATEGORY_POOL: Category[] = [
  {
    id: 'superpowers',
    name: 'Supermoce i niezwykłe zdolności',
    description: 'Którą z tych supermocy najbardziej chciałbyś posiadać na co dzień?',
    items: [
      { id: 'sp_1', name: 'Teleportacja w dowolne miejsce na Ziemi', icon: '⚡' },
      { id: 'sp_2', name: 'Niewidzialność na zawołanie', icon: '👻' },
      { id: 'sp_3', name: 'Zatrzymywanie czasu na 30 sekund', icon: '⏱️' },
      { id: 'sp_4', name: 'Czytanie w myślach innych ludzi', icon: '🧠' },
      { id: 'sp_5', name: 'Latanie z prędkością 120 km/h', icon: '🦅' },
      { id: 'sp_6', name: 'Wieczna młodość i nieśmiertelność', icon: '✨' },
      { id: 'sp_7', name: 'Płynna znajomość każdego języka na świecie', icon: '🗣️' },
      { id: 'sp_8', name: 'Zero zmęczenia (brak potrzeby snu i 100% energii)', icon: '🔋' },
    ],
  },
  {
    id: 'polish_traditions',
    name: 'Kultowe polskie tradycje imprezowe',
    description: 'Bez których z tych zjawisk prawdziwa polska domówka lub wesele nie mają prawa bytu?',
    items: [
      { id: 'pt_1', name: 'Sałatka jarzynowa w misce wielkości wanny', icon: '🥗' },
      { id: 'pt_2', name: 'Kultowe pytanie: „Ze mną się nie napijesz?”', icon: '🥂' },
      { id: 'pt_3', name: 'Wujek pytający: „A kawalera / pannę już masz?”', icon: '🥸' },
      { id: 'pt_4', name: 'Odpalenie polskiego disco polo o 2:00 w nocy', icon: '🪗' },
      { id: 'pt_5', name: 'Pakowanie gościom ciasta w pudełko po lodach', icon: '🍰' },
      { id: 'pt_6', name: 'Rola kierowcy: największe poświęcenie imprezy', icon: '🚗' },
      { id: 'pt_7', name: 'Śpiewanie „Sto lat” minimum 5 razy w ciągu nocy', icon: '🎤' },
      { id: 'pt_8', name: 'Schabowy i zimne nóżki prosto z lodówki o 4:00 rano', icon: '🥩' },
    ],
  },
  {
    id: 'party_drinks',
    name: 'Napoje i trunki na domówkę',
    description: 'Co bezwzględnie musi znaleźć się w lodówce przed przyjściem gości?',
    items: [
      { id: 'item_1', name: 'Zimna Cola z lodem i cytryną', icon: '🥤' },
      { id: 'item_2', name: 'Rzemieślnicze IPA', icon: '🍺' },
      { id: 'item_3', name: 'Woda gazowana z limonką', icon: '💧' },
      { id: 'item_4', name: 'Ciepłe tanie piwo z puszki', icon: '🥫' },
      { id: 'item_5', name: 'Sok pomarańczowy 100%', icon: '🍊' },
      { id: 'item_6', name: 'Energetyk o smaku mango', icon: '⚡' },
      { id: 'item_7', name: 'Wytrawne czerwone wino', icon: '🍷' },
      { id: 'item_8', name: 'Herbata z miodem i imbirem', icon: '🫖' },
    ],
  },
  {
    id: 'daily_annoyances',
    name: 'Drobne codzienne irytacje',
    description: 'Które z tych nieszczęść zasługuje na miano absolutnego koszmaru?',
    items: [
      { id: 'item_17', name: 'Nadepnięcie na klocek LEGO bosą stopą', icon: '🧱' },
      { id: 'item_18', name: 'Bateria w telefonie 1% poza domem', icon: '🪫' },
      { id: 'item_19', name: 'Mokra skarpetka w łazience', icon: '🧦' },
      { id: 'item_20', name: 'Ktoś zostawiający 3 sekundy na mikrofalówce', icon: '⏲️' },
      { id: 'item_21', name: 'Kabel od słuchawek zaczepiający o klamkę', icon: '🎧' },
      { id: 'item_22', name: 'Autokorekta zamieniająca ważne słowo', icon: '📱' },
      { id: 'item_23', name: 'Zimna pizza rano (czekaj, to akurat jest S!)', icon: '🍕' },
      { id: 'item_24', name: 'Spoilery serialu w tytule na TikToku', icon: '🚫' },
    ],
  },
  {
    id: 'pop_culture_heroes',
    name: 'Ikony popkultury na bezludnej wyspie',
    description: 'Kogo najbardziej chciałbyś mieć u swego boku?',
    items: [
      { id: 'item_25', name: 'Shrek', icon: '🧅' },
      { id: 'item_26', name: 'Batman (bez gadżetów i pieniędzy)', icon: '🦇' },
      { id: 'item_27', name: 'Gandalf Szary', icon: '🧙‍♂️' },
      { id: 'item_28', name: 'Gordon Ramsay', icon: '🍳' },
      { id: 'item_29', name: 'Yoda', icon: '🪐' },
      { id: 'item_30', name: 'Spider-Man', icon: '🕷️' },
      { id: 'item_31', name: 'Tony Stark', icon: '🤖' },
      { id: 'item_32', name: 'Bear Grylls', icon: '🦗' },
    ],
  },
];

/**
 * Znajduje tier, w którym umieszczono dany przedmiot w placementcie
 */
export function findItemTier(placement: TierPlacement | null | undefined, itemId: string): TierLevel | null {
  if (!placement) return null;
  const tiers: TierLevel[] = ['S', 'A', 'B', 'C', 'D'];
  for (const tier of tiers) {
    if (placement[tier]?.includes(itemId)) {
      return tier;
    }
  }
  return null;
}

/**
 * Algorytm kalkulacji punktacji wg zasad:
 * - Dokładne dopasowanie do tego samego tieru: +3 punkty
 * - Pomyłka o 1 tier (np. A vs S): +1 punkt
 * - Pomyłka o 2 lub więcej: 0 punktów
 */
export function evaluateGuesser(
  creatorPlacement: TierPlacement,
  guesserPlacement: TierPlacement,
  category: Category
): { totalPointsGained: number; itemDetails: ItemScoreDetail[] } {
  let totalPointsGained = 0;
  const itemDetails: ItemScoreDetail[] = [];

  for (const item of category.items) {
    const creatorTier = findItemTier(creatorPlacement, item.id);
    const guesserTier = findItemTier(guesserPlacement, item.id);

    let pointsAwarded = 0;
    let tierDifference = 99;

    if (creatorTier && guesserTier) {
      const creatorRank = TIER_CONFIG[creatorTier].rankValue;
      const guesserRank = TIER_CONFIG[guesserTier].rankValue;
      tierDifference = Math.abs(creatorRank - guesserRank);

      if (tierDifference === 0) {
        pointsAwarded = 3;
      } else if (tierDifference === 1) {
        pointsAwarded = 1;
      } else {
        pointsAwarded = 0;
      }
    }

    totalPointsGained += pointsAwarded;

    itemDetails.push({
      itemId: item.id,
      itemName: item.name,
      creatorTier,
      guesserTier,
      tierDifference,
      pointsAwarded,
    });
  }

  return { totalPointsGained, itemDetails };
}

/**
 * Losuje 3 unikalne kategorie do wyboru przez Twórcę na początku rundy
 */
export function selectCategoryOptions(count = 3): Category[] {
  const shuffled = [...CATEGORY_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Losuje pojedynczą kategorię (fallback)
 */
export function selectRandomCategory(excludedIds: string[] = []): Category {
  const available = CATEGORY_POOL.filter((c) => !excludedIds.includes(c.id));
  const pool = available.length > 0 ? available : CATEGORY_POOL;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Generuje pusty szablon placementu
 */
export function createEmptyPlacement(): TierPlacement {
  return {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  };
}

/**
 * Sanityzacja stanu pokoju - OCHRONA PRZED OSZUSTWEM (Anti-Cheat).
 * Zgadujący gracz NIE ma dostępu do `secretCreatorPlacement` ani do placementów innych zgadujących
 * aż do fazy REVEAL lub SCOREBOARD.
 */
export function sanitizeRoomState(room: ServerRoom, requestingPlayerId: string): ClientGameState {
  const isCreator = room.creatorId === requestingPlayerId;
  const isRevealOrScoreboard = room.phase === 'REVEAL' || room.phase === 'SCOREBOARD';

  // Własny placement gracza (Twórcy lub Zgadującego)
  let myPlacement: TierPlacement | null = null;
  let mySubmitted = false;

  if (isCreator) {
    myPlacement = room.secretCreatorPlacement;
    const playerObj = room.players.get(requestingPlayerId);
    mySubmitted = !!playerObj?.hasSubmitted;
  } else {
    myPlacement = room.guesserPlacements.get(requestingPlayerId) || null;
    const playerObj = room.players.get(requestingPlayerId);
    mySubmitted = !!playerObj?.hasSubmitted;
  }

  // Placement Twórcy jest ujawniany TYLKO w REVEAL lub SCOREBOARD
  const revealedCreatorPlacement = isRevealOrScoreboard ? room.secretCreatorPlacement : null;

  // Przekształcamy mapę graczy do tablicy z bezpiecznymi danymi
  const playersList = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl,
    score: p.score,
    isHost: p.isHost,
    isConnected: p.isConnected,
    hasSubmitted: p.hasSubmitted,
    roundScore: isRevealOrScoreboard ? p.roundScore : undefined,
  }));

  return {
    roomCode: room.code,
    phase: room.phase,
    players: playersList,
    currentRound: room.currentRound,
    maxRounds: room.maxRounds,
    creatorId: room.creatorId,
    isCurrentUserCreator: isCreator,
    categoryOptions: room.categoryOptions || [],
    currentCategory: room.currentCategory,
    timeRemaining: room.timeRemaining,
    myPlacement,
    mySubmitted,
    revealedCreatorPlacement,
    roundResults: isRevealOrScoreboard ? room.roundResults : null,
  };
}
