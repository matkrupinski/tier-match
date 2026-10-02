'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  Category,
  TierItem,
  TierLevel,
  TierPlacement,
  TIERS,
  TIER_CONFIG,
} from '../../types/game';
import { motion, AnimatePresence } from 'framer-motion';

interface TierBoardProps {
  mode: 'creator' | 'guesser' | 'spectator';
  category: Category;
  placement: TierPlacement;
  onPlacementChange: (newPlacement: TierPlacement) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
  readOnly?: boolean;
  creatorName?: string;
  timeRemaining?: number;
}

// Droppable Tier Row
function TierRow({
  tier,
  items,
  children,
}: {
  tier: TierLevel;
  items: TierItem[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tier_${tier}`,
  });
  const config = TIER_CONFIG[tier];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col sm:flex-row min-h-[90px] border-2 rounded-2xl transition-all duration-200 ${
        config.borderClass
      } ${isOver ? 'ring-4 ring-white/30 scale-[1.01]' : ''} bg-slate-900/60 backdrop-blur-md mb-3 shadow-lg`}
    >
      {/* Tier Label Badge */}
      <div
        className={`w-full sm:w-28 flex items-center justify-between sm:justify-center p-3 sm:p-0 font-black text-3xl tracking-wider select-none shrink-0 ${config.bgClass} ${config.textClass} border-b sm:border-b-0 sm:border-r border-slate-700/50 rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl`}
      >
        <span>{tier}</span>
        <span className="text-xs font-medium text-slate-400 sm:hidden">
          {items.length} {items.length === 1 ? 'element' : 'elementy'}
        </span>
      </div>

      {/* Droppable Content Area */}
      <div className="flex-1 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 p-3 min-h-[75px] bg-slate-950/40 rounded-b-2xl sm:rounded-b-none sm:rounded-r-2xl">
        {items.length === 0 ? (
          <div className="text-xs font-medium text-slate-500 italic select-none py-2 px-1">
            Pusty poziom (użyj wyboru powyżej lub przeciągnij tutaj)...
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Komponent pojedynczego wyboru (Spotlight / Blind Ranking - po jednym elemencie)
function SingleChoiceSpotlight({
  item,
  remainingCount,
  totalCount,
  onPlace,
  onSkip,
  disabled,
}: {
  item: TierItem;
  remainingCount: number;
  totalCount: number;
  onPlace: (tier: TierLevel) => void;
  onSkip: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled,
  });

  const currentIndex = totalCount - remainingCount + 1;

  return (
    <div className="mb-6 p-4 sm:p-6 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border-2 border-indigo-500/50 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Pasek statusu kolejki */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <span>🎯</span>
            <span>Twój kolejny wybór</span>
          </span>
          <span className="text-xs font-mono font-bold text-slate-400">
            Wybór {currentIndex} z {totalCount} ({remainingCount} do ułożenia)
          </span>
        </div>

        {remainingCount > 1 && !disabled && (
          <button
            onClick={onSkip}
            className="text-xs px-3.5 py-1.5 bg-slate-800/90 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-700 hover:border-indigo-500 rounded-xl font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
            title="Przesuń ten element na koniec kolejki (wróci później)"
          >
            <span>Pomiń na później</span>
            <span>⏭️</span>
          </button>
        )}
      </div>

      {/* Aktywna Karta (Można też przeciągnąć w dół na wybrany poziom) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={`p-4 sm:p-5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left transition-all cursor-grab active:cursor-grabbing select-none ${
            isDragging ? 'opacity-40 ring-2 ring-indigo-400' : 'opacity-100'
          }`}
        >
          {/* Duża Ikona */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl sm:text-5xl shrink-0 shadow-inner">
            {item.icon || '📌'}
          </div>

          {/* Treść / Nazwa Elementu */}
          <div className="flex-1 w-full sm:w-auto">
            <h3 className="text-base sm:text-xl font-black text-white leading-snug break-words">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{item.description}</p>
            )}
            <p className="text-[11px] text-slate-500 mt-1 font-medium hidden sm:block">
              Wybierz poniższy poziom (S–D) lub przeciągnij kartę bezpośrednio do wybranego rzędu
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Przyciski Wyboru Poziomu (S, A, B, C, D) */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center sm:text-left">
          Przypisz ten wybór do poziomu:
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {TIERS.map((tier) => {
            const config = TIER_CONFIG[tier];
            return (
              <button
                key={tier}
                disabled={disabled}
                onClick={() => onPlace(tier)}
                className={`py-3 sm:py-3.5 px-1 rounded-xl font-black text-base sm:text-lg border transition-all flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 cursor-pointer ${config.bgClass} ${config.borderClass} ${config.textClass} hover:ring-2 hover:ring-white/40 hover:brightness-125`}
              >
                <span>{tier}</span>
                <span className="text-[9px] font-bold opacity-75 hidden sm:inline uppercase">
                  {tier === 'S' ? 'Top' : tier === 'D' ? 'Dno' : 'Poziom'}
                </span>
              </button>
            );
          })}
        </div>

        {remainingCount > 1 && !disabled && (
          <div className="mt-3 flex sm:hidden justify-center">
            <button
              onClick={onSkip}
              className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Pomiń na później (wróci na koniec)</span>
              <span>⏭️</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Karta umieszczona na Tier Liście z wyraźną, zawsze widoczną możliwością zmiany poziomu
function PlacedTierCard({
  item,
  currentTier,
  disabled,
  onMoveTier,
  onRecall,
}: {
  item: TierItem;
  currentTier: TierLevel;
  disabled?: boolean;
  onMoveTier: (targetTier: TierLevel) => void;
  onRecall: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className={`w-full sm:w-auto rounded-xl border bg-slate-900/90 border-slate-700/80 shadow-md transition-all ${
        isDragging ? 'opacity-30 scale-95' : 'opacity-100'
      } ${isExpanded ? 'ring-2 ring-indigo-500/60 shadow-indigo-500/10' : ''}`}
    >
      {/* Pasek kafelka z nazwą i przyciskami */}
      <div className="p-2.5 sm:p-3 flex items-center gap-2.5">
        {/* Uchwyt do przeciągania */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 px-1 py-1 select-none"
          title="Przeciągnij do innego poziomu"
        >
          ⋮⋮
        </div>

        {/* Ikona i Nazwa */}
        <span className="text-xl shrink-0 leading-none">{item.icon || '📌'}</span>
        <span className="text-xs sm:text-sm font-bold text-slate-200 leading-snug break-words flex-1">
          {item.name}
        </span>

        {/* Przyciski zmiany miejsca / cofnięcia */}
        {!disabled && (
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 border cursor-pointer ${
                isExpanded
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Zmień poziom tego elementu"
            >
              <span>Zmień poziom</span>
              <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
            </button>

            <button
              type="button"
              onClick={onRecall}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-700 hover:border-rose-500/50 flex items-center justify-center text-xs transition-all cursor-pointer font-bold gap-1"
              title="Cofnij ten element do aktywnego wyboru"
            >
              <span>↩️</span>
              <span className="hidden sm:inline text-[11px]">Wycofaj</span>
            </button>
          </div>
        )}
      </div>

      {/* Rozwijany panel zmiany poziomu (INLINE - widoczny na 100% ekranów) */}
      <AnimatePresence>
        {isExpanded && !disabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/80 rounded-b-xl overflow-hidden"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase mb-2">
              <span>Przenieś do poziomu:</span>
              <button
                type="button"
                onClick={onRecall}
                className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold normal-case text-xs cursor-pointer"
              >
                <span>↩️ Cofnij do wyboru</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {TIERS.map((t) => {
                const config = TIER_CONFIG[t];
                const isCurrent = t === currentTier;

                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      onMoveTier(t);
                      setIsExpanded(false);
                    }}
                    className={`py-2 rounded-lg text-xs font-black border transition-all flex items-center justify-center gap-1 ${
                      isCurrent
                        ? `${config.bgClass} ${config.textClass} ${config.borderClass} ring-2 ring-white/50 opacity-100 cursor-default font-extrabold`
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white active:scale-95 cursor-pointer'
                    }`}
                  >
                    <span>{t}</span>
                    {isCurrent && <span className="text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Drag Overlay Card (podczas przeciągania)
function DragOverlayCard({ item }: { item: TierItem }) {
  return (
    <div className="px-4 py-3 bg-indigo-600/95 border-2 border-indigo-300 text-white rounded-xl shadow-2xl flex items-center gap-2.5 scale-105 rotate-2 cursor-grabbing pointer-events-none max-w-sm">
      <span className="text-2xl leading-none">{item.icon || '📌'}</span>
      <span className="text-xs sm:text-sm font-bold leading-snug break-words">{item.name}</span>
    </div>
  );
}

export const TierBoard: React.FC<TierBoardProps> = ({
  mode,
  category,
  placement,
  onPlacementChange,
  onSubmit,
  isSubmitted,
  readOnly = false,
  creatorName,
  timeRemaining,
}) => {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Rozróżnia kliknięcie od przeciągania
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Mapa elementów po ID dla szybkiego dostępu
  const itemsMap = React.useMemo(() => {
    const map = new Map<string, TierItem>();
    category.items.forEach((item) => map.set(item.id, item));
    return map;
  }, [category]);

  // Wszystkie elementy obecnie przydzielone do tierów
  const assignedItemIds = useMemo(() => {
    const ids = new Set<string>();
    TIERS.forEach((tier) => {
      placement[tier]?.forEach((id) => ids.add(id));
    });
    return ids;
  }, [placement]);

  // Kolejka elementów do ułożenia po jednym (Blind Ranking)
  const [queue, setQueue] = useState<string[]>(() => category.items.map((i) => i.id));

  // Reset kolejki przy zmianie kategorii
  useEffect(() => {
    setQueue(category.items.map((i) => i.id));
  }, [category.id]);

  // Aktywne nieprzypisane elementy w kolejce
  const pendingQueue = useMemo(() => {
    return queue.filter((id) => !assignedItemIds.has(id));
  }, [queue, assignedItemIds]);

  const currentItemId = pendingQueue[0] || null;
  const currentItem = currentItemId ? itemsMap.get(currentItemId) : null;
  const isComplete = pendingQueue.length === 0;

  // Pomiń bieżący element – przenieś na koniec kolejki (wróci później)
  const handleSkip = () => {
    if (pendingQueue.length <= 1) return;
    setQueue((prevQueue) => {
      const skippedId = pendingQueue[0];
      const rest = prevQueue.filter((id) => id !== skippedId);
      return [...rest, skippedId];
    });
  };

  const activeItem = activeDragId ? itemsMap.get(activeDragId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    if (readOnly || isSubmitted) return;
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    if (readOnly || isSubmitted) return;

    const { active, over } = event;
    if (!over) return;

    const itemId = String(active.id);
    const overId = String(over.id);

    // Kopia obecnego ułożenia
    const newPlacement: TierPlacement = {
      S: [...(placement.S || [])],
      A: [...(placement.A || [])],
      B: [...(placement.B || [])],
      C: [...(placement.C || [])],
      D: [...(placement.D || [])],
    };

    // Usuwamy element ze wszystkich dotychczasowych tierów
    TIERS.forEach((tier) => {
      newPlacement[tier] = newPlacement[tier].filter((id) => id !== itemId);
    });

    if (overId.startsWith('tier_')) {
      const targetTier = overId.replace('tier_', '') as TierLevel;
      newPlacement[targetTier].push(itemId);
    } else {
      // Jeśli upuszczono na inną kartę, znajdź tier w którym się znajduje
      for (const tier of TIERS) {
        if (placement[tier]?.includes(overId)) {
          newPlacement[tier].push(itemId);
          break;
        }
      }
    }

    onPlacementChange(newPlacement);
  };

  // Szybkie przeniesienie za pomocą menu kafelka lub przycisków
  const handleQuickMove = (itemId: string, target: TierLevel | 'pool') => {
    if (readOnly || isSubmitted) return;

    const newPlacement: TierPlacement = {
      S: [...(placement.S || [])],
      A: [...(placement.A || [])],
      B: [...(placement.B || [])],
      C: [...(placement.C || [])],
      D: [...(placement.D || [])],
    };

    TIERS.forEach((tier) => {
      newPlacement[tier] = newPlacement[tier].filter((id) => id !== itemId);
    });

    if (target !== 'pool') {
      newPlacement[target].push(itemId);
    } else {
      // Przywrócenie do kolejki na początek
      setQueue((prev) => [itemId, ...prev.filter((id) => id !== itemId)]);
    }

    onPlacementChange(newPlacement);
  };

  // Przypisanie bieżącego elementu do poziomu
  const handlePlaceCurrent = (tier: TierLevel) => {
    if (!currentItem) return;
    handleQuickMove(currentItem.id, tier);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-slate-950/80 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
      {/* Banner Instrukcji i Kontekstu Roli */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            {mode === 'creator' ? '👑 Twórca Listy' : '🎯 Zgadujący'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex flex-wrap items-center gap-2">
            <span>Kategoria:</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400">
              {category.name}
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">{category.description}</p>
        </div>

        {/* Status / Licznik */}
        <div className="flex items-center gap-3">
          {timeRemaining !== undefined && (
            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2">
              <span className="text-base">{timeRemaining <= 0 ? '♾️' : '⏳'}</span>
              <span className={`font-mono font-bold text-sm sm:text-base ${timeRemaining <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {timeRemaining <= 0 ? 'Bez limitu' : `${timeRemaining}s`}
              </span>
            </div>
          )}

          {!readOnly && !isSubmitted && (
            <button
              onClick={onSubmit}
              disabled={!isComplete}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all duration-200 flex items-center gap-2 ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:brightness-110 active:scale-95 shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>{mode === 'creator' ? 'Zatwierdź Listę' : 'Zatwierdź Typy'}</span>
              <span>✓</span>
            </button>
          )}

          {isSubmitted && (
            <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-semibold text-sm rounded-xl flex items-center gap-2">
              <span>✓</span>
              <span>Zatwierdzono! Oczekiwanie...</span>
            </div>
          )}
        </div>
      </div>

      {/* Informacja o Rolach: Twórca vs Zgadujący */}
      {mode === 'creator' && (
        <div className="mb-4 p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs sm:text-sm text-amber-200 flex items-center gap-2.5">
          <span className="text-xl shrink-0">👑</span>
          <span className="leading-snug">
            <strong>Układasz swoją oficjalną Tier Listę!</strong> Rozmieść elementy według własnego gustu i preferencji od S do D. Pozostali gracze będą odgadywać Twoje wybory!
          </span>
        </div>
      )}

      {mode === 'guesser' && creatorName && (
        <div className="mb-4 p-3.5 bg-indigo-950/50 border border-indigo-500/40 rounded-xl text-xs sm:text-sm text-indigo-200 flex items-center gap-2.5">
          <span className="text-xl shrink-0">🕵️</span>
          <span className="leading-snug">
            <strong>Odgadujesz Tier Listę gracza {creatorName}!</strong> Spróbuj przewidzieć, jak <strong>{creatorName}</strong> oceni poszczególne elementy. Za każde trafienie w dziesiątkę otrzymasz +3 pkt!
          </span>
        </div>
      )}

      {/* Główny obszar Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* 1. Karta Pojedynczego Wyboru (Blind Ranking - po jednym elemencie na raz) */}
        {!readOnly && !isSubmitted && currentItem && (
          <SingleChoiceSpotlight
            item={currentItem}
            remainingCount={pendingQueue.length}
            totalCount={category.items.length}
            onPlace={handlePlaceCurrent}
            onSkip={handleSkip}
            disabled={readOnly || isSubmitted}
          />
        )}

        {/* Informacja po pomyślnym ułożeniu wszystkich elementów */}
        {!readOnly && !isSubmitted && isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 sm:p-6 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border-2 border-emerald-500/50 rounded-3xl text-center shadow-xl backdrop-blur-md"
          >
            <div className="text-3xl mb-1.5">✨</div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Wszystkie elementy zostały ułożone!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
              Przejrzyj swoją tier listę poniżej. Możesz kliknąć dowolny element, aby zmienić jego poziom lub cofnąć go do wyboru.
            </p>
            <button
              onClick={onSubmit}
              className="mt-4 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>{mode === 'creator' ? 'Zatwierdź oficjalną listę' : 'Zatwierdź swoje typy'}</span>
              <span>✓</span>
            </button>
          </motion.div>
        )}

        {/* Tiery S, A, B, C, D */}
        <div className="space-y-1 mb-6">
          {TIERS.map((tier) => {
            const tierItemIds = placement[tier] || [];
            const tierItems = tierItemIds
              .map((id) => itemsMap.get(id))
              .filter(Boolean) as TierItem[];

            return (
              <TierRow key={tier} tier={tier} items={tierItems}>
                {tierItems.map((item) => (
                  <PlacedTierCard
                    key={item.id}
                    item={item}
                    currentTier={tier}
                    disabled={readOnly || isSubmitted}
                    onMoveTier={(target) => handleQuickMove(item.id, target)}
                    onRecall={() => handleQuickMove(item.id, 'pool')}
                  />
                ))}
              </TierRow>
            );
          })}
        </div>

        {/* Pływający element podczas przeciągania */}
        <DragOverlay>
          {activeItem ? <DragOverlayCard item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
