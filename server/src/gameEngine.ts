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
 * Pełna pula bogatych kategorii i elementów do gry imprezowej
 */
export const CATEGORY_POOL: Category[] = [
  {
    id: 'movie_snacks',
    name: 'Przekąski do filmu / serialu',
    description: 'Co jest absolutnym królem chrupania podczas wieczornego seansu?',
    icon: '🍿',
    items: [
      { id: 'ms_1', name: 'Świeży maślany popcorn', icon: '🍿' },
      { id: 'ms_2', name: 'Chrupiące nachosy z ciepłym serem', icon: '🧀' },
      { id: 'ms_3', name: 'Klasyczne chipsy paprykowe', icon: '🥔' },
      { id: 'ms_4', name: 'Żelki', icon: '🍬' },
      { id: 'ms_5', name: 'Orzeszki w pikantnej panierce', icon: '🥜' },
      { id: 'ms_6', name: 'Czekoladowe draże / M&M\'s', icon: '🍫' },
    ],
  },
  {
    id: 'free_evening',
    name: 'Sposoby na idealny wolny wieczór',
    description: 'Jak najlepiej zregenerować siły po ciężkim tygodniu?',
    icon: '🛋️',
    items: [
      { id: 'fe_1', name: 'Kocyk + binge-watching serialu', icon: '📺' },
      { id: 'fe_2', name: 'Impreza w głośnym klubie', icon: '🪩' },
      { id: 'fe_3', name: 'Spokojny wieczór z grami planszowymi i znajomymi', icon: '🎲' },
      { id: 'fe_4', name: 'Gotowanie pysznej kolacji w domu', icon: '🍳' },
      { id: 'fe_5', name: 'Sesja grania na konsoli / PC do 3:00 w nocy', icon: '🎮' },
      { id: 'fe_6', name: 'Długi spacer i kolacja na mieście', icon: '🚶' },
    ],
  },
  {
    id: 'childhood_flavors',
    name: 'Kultowe smaki polskiego dzieciństwa',
    description: 'Największe nostalgiczne hity ze sklepiku szkolnego',
    icon: '🍭',
    items: [
      { id: 'cf_1', name: 'Lody Kaktus', icon: '🌵' },
      { id: 'cf_2', name: 'Chrupki Maczugi', icon: '🥖' },
      { id: 'cf_3', name: 'Oranżada w proszku jedzona palcem', icon: '⚡' },
      { id: 'cf_4', name: 'Guma Turbo', icon: '🏎️' },
      { id: 'cf_5', name: 'Ciepłe lody', icon: '🍦' },
      { id: 'cf_6', name: 'Lizaki Chupa Chups', icon: '🍭' },
    ],
  },
  {
    id: 'hot_day_drinks',
    name: 'Napoje na upalny dzień',
    description: 'Co daje największe orzeźwienie, gdy z nieba leje się żar?',
    icon: '🧊',
    items: [
      { id: 'hd_1', name: 'Lodowata woda z cytryną i miętą', icon: '💧' },
      { id: 'hd_2', name: 'Klasyczna Coca-Cola z lodem', icon: '🥤' },
      { id: 'hd_3', name: 'Domowa lemoniada', icon: '🍋' },
      { id: 'hd_4', name: 'Schłodzona mrożona herbata (Ice Tea)', icon: '🧋' },
      { id: 'hd_5', name: 'Świeżo wyciskany sok pomarańczowy', icon: '🍊' },
      { id: 'hd_6', name: 'Gazowany energetyk', icon: '⚡' },
    ],
  },
  {
    id: 'awkward_situations',
    name: 'Niezręczne sytuacje towarzyskie',
    description: 'Który z tych momentów sprawia, że chcesz zapaść się pod ziemię?',
    icon: '🫣',
    items: [
      { id: 'as_1', name: 'Odmachanie obcej osobie, która machała do kogoś za tobą', icon: '👋' },
      { id: 'as_2', name: 'Odpowiedzenie kelnerowi „Nawzajem!”, gdy życzył „Smacznego!”', icon: '🍽️' },
      { id: 'as_3', name: 'Zapomnienie imienia osoby, z którą rozmawiasz już od 15 minut', icon: '🧠' },
      { id: 'as_4', name: 'Wysłanie screenshota rozmowy do osoby, o której w nim piszesz', icon: '📱' },
      { id: 'as_5', name: 'Próba pchnięcia przeszklonych drzwi z wielkim napisem „CIĄGNĄĆ”', icon: '🚪' },
      { id: 'as_6', name: 'Śmianie się z żartu, którego w ogóle nie usłyszałeś', icon: '😅' },
    ],
  },
  {
    id: 'excuses_cancel_plans',
    name: 'Wymówki, żeby nie wyjść z domu i odwołać plany',
    description: 'Najpopularniejsze wykręty przed wyjściem ze znajomymi',
    icon: '🛏️',
    items: [
      { id: 'ex_1', name: '„Coś mnie chyba łamie w kościach, wolę poleżeć”', icon: '🤒' },
      { id: 'ex_2', name: '„Zasypali mnie niespodziewaną pracą / projektami”', icon: '💼' },
      { id: 'ex_3', name: '„Padła mi bateria w telefonie i dopiero teraz widzę”', icon: '🪫' },
      { id: 'ex_4', name: '„Już założyłem dres i leżę pod kołdrą, nie ma szans”', icon: '🛏️' },
      { id: 'ex_5', name: '„Muszę posiedzieć z kotem/psem, bo tęskni”', icon: '🐶' },
      { id: 'ex_6', name: 'Szczere i brutalne: „Po prostu mi się dziś strasznie nie chce”', icon: '🛋️' },
    ],
  },
  {
    id: 'party_archetypes',
    name: 'Archetypy ludzi na domówce',
    description: 'Kogo absolutnie nigdy nie zabraknie na żadnej szanującej się imprezie?',
    icon: '🥳',
    items: [
      { id: 'pa_1', name: 'Samozwańczy DJ (zmienia piosenkę na YouTube co 40 sekund)', icon: '🎧' },
      { id: 'pa_2', name: 'Kuchenny filozof (o 2:30 nad ranem rozkłada sens wszechświata na części pierwsze)', icon: '☕' },
      { id: 'pa_3', name: 'Mistrz ewakuacji (znika po angielsku bez pożegnania)', icon: '💨' },
      { id: 'pa_4', name: 'Nadgorliwy czyściciel (zbiera puste kubki i wyciera blat już o 21:30)', icon: '🧹' },
      { id: 'pa_5', name: 'Człowiek-anegdota (przerywa każdą historię, mówiąc „a ja to kiedyś…”)', icon: '🗣️' },
      { id: 'pa_6', name: 'Śpioch w przedpokoju (zaśnie w kurtce na stercie butów)', icon: '💤' },
    ],
  },
  {
    id: 'train_sins',
    name: 'Grzechy pasażerów w pociągu / zbiorkomie',
    description: 'Które z tych zachowań współpasażerów zasługuje na natychmiastowy mandat karny?',
    icon: '🚆',
    items: [
      { id: 'ts_1', name: 'Oglądanie rolek na TikToku na pełnym głośniku bez słuchawek', icon: '🔊' },
      { id: 'ts_2', name: 'Głośna rozmowa telefoniczna na głośnomówiącym o intymnych sprawach', icon: '📢' },
      { id: 'ts_3', name: 'Jedzenie kanapki z jajkiem i cebulą lub kebaba w upalnym wagonie', icon: '🥪' },
      { id: 'ts_4', name: 'Stawianie torebki lub plecaka na wolnym siedzeniu obok w zatłoczonym pojeździe', icon: '🎒' },
      { id: 'ts_5', name: 'Ściąganie butów w pociągu dalekobieżnym', icon: '🧦' },
      { id: 'ts_6', name: 'Wpychanie się do środka zanim ludzie zdążą wysiąść', icon: '🚪' },
    ],
  },
  {
    id: 'superpowers',
    name: 'Supermoce i niezwykłe zdolności',
    description: 'Którą z tych supermocy najbardziej chciałbyś posiadać na co dzień?',
    icon: '⚡',
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
    icon: '🥂',
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
    id: 'daily_annoyances',
    name: 'Drobne codzienne irytacje',
    description: 'Które z tych nieszczęść zasługuje na miano absolutnego koszmaru?',
    icon: '🧱',
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
    icon: '🧅',
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
    answerTimeLimit: room.answerTimeLimit ?? 60,
    creatorId: room.creatorId,
    isCurrentUserCreator: isCreator,
    categoryOptions: room.categoryOptions || [],
    currentCategory: room.currentCategory,
    timeRemaining: room.timeRemaining,
    myPlacement,
    mySubmitted,
    revealedCreatorPlacement,
    roundResults: isRevealOrScoreboard ? room.roundResults : null,
    revealReadyPlayerIds: room.revealReadyPlayerIds || [],
  };
}

export function getAllCategories(): Category[] {
  return [...CATEGORY_POOL];
}
