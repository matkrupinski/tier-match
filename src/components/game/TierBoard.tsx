'use client';

import React, { useState } from 'react';
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
      className={`flex flex-col sm:flex-row min-h-[90px] border-2 rounded-2xl transition-all duration-200 overflow-hidden ${
        config.borderClass
      } ${isOver ? 'ring-4 ring-white/30 scale-[1.01]' : ''} bg-slate-900/60 backdrop-blur-md mb-3 shadow-lg`}
    >
      {/* Tier Label Badge */}
      <div
        className={`w-full sm:w-28 flex items-center justify-between sm:justify-center p-3 sm:p-0 font-black text-3xl tracking-wider select-none shrink-0 ${config.bgClass} ${config.textClass} border-b sm:border-b-0 sm:border-r border-slate-700/50`}
      >
        <span>{tier}</span>
        <span className="text-xs font-medium text-slate-400 sm:hidden">
          {items.length} {items.length === 1 ? 'element' : 'elementy'}
        </span>
      </div>

      {/* Droppable Content Area */}
      <div className="flex-1 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 p-3 min-h-[75px] bg-slate-950/40">
        {items.length === 0 ? (
          <div className="text-xs font-medium text-slate-500 italic select-none py-2 px-1">
            Przeciągnij elementy tutaj (lub kliknij na telefonie)...
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Droppable Pool (Unranked Bench)
function UnrankedPool({
  children,
  count,
}: {
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unranked_pool',
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-2xl p-4 transition-all duration-200 ${
        isOver
          ? 'border-indigo-400 bg-indigo-950/30'
          : 'border-slate-700 bg-slate-900/40'
      } backdrop-blur-md shadow-inner`}
    >
      <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-wider font-semibold text-slate-400">
        <span>Ławka rezerwowych (Nieprzypisane)</span>
        <span className="bg-slate-800 px-2 py-0.5 rounded-full text-indigo-300 font-mono">
          {count} do ułożenia
        </span>
      </div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 min-h-[90px] items-stretch sm:items-center justify-start">
        {count === 0 ? (
          <div className="w-full text-center text-emerald-400 text-sm font-medium py-3">
            ✨ Wszystkie elementy są ułożone w tierach!
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Draggable Item Card
function DraggableCard({
  item,
  disabled,
  onQuickMove,
}: {
  item: TierItem;
  disabled?: boolean;
  onQuickMove?: (tier: TierLevel | 'pool') => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled,
  });

  const [showQuickMenu, setShowQuickMenu] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className={`relative group w-full sm:w-auto ${isDragging ? 'opacity-30' : 'opacity-100'}`}
    >
      <div
        {...attributes}
        {...listeners}
        onClick={() => !disabled && setShowQuickMenu((prev) => !prev)}
        className={`px-3.5 py-3 bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700/80 rounded-xl shadow-md cursor-grab active:cursor-grabbing select-none flex items-center gap-2.5 transition-transform duration-150 active:scale-95 w-full sm:w-auto sm:max-w-xs md:max-w-sm ${
          disabled ? 'cursor-not-allowed opacity-80' : ''
        }`}
      >
        <span className="text-xl shrink-0 leading-none" role="img" aria-label={item.name}>
          {item.icon || '📌'}
        </span>
        <span className="text-xs sm:text-sm font-medium text-slate-200 leading-snug break-words flex-1">
          {item.name}
        </span>
        <span className="text-slate-500 text-xs ml-auto shrink-0 group-hover:text-slate-400 pl-1">
          ⋮⋮
        </span>
      </div>

      {/* Quick Move Menu (ułatwienie na telefony i szybkie kliknięcia) */}
      <AnimatePresence>
        {showQuickMenu && !disabled && onQuickMove && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            className="absolute z-30 top-full left-0 right-0 sm:right-auto mt-1.5 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl flex flex-wrap gap-1.5 items-center justify-center sm:justify-start backdrop-blur-md"
          >
            <span className="text-[10px] text-slate-400 font-bold uppercase w-full block sm:hidden text-center mb-0.5">
              Przenieś do:
            </span>
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickMove(t);
                  setShowQuickMenu(false);
                }}
                className={`w-8 h-8 rounded-lg text-xs font-black ${TIER_CONFIG[t].bgClass} ${TIER_CONFIG[t].textClass} hover:ring-2 hover:ring-white/50 border ${TIER_CONFIG[t].borderClass}`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickMove('pool');
                setShowQuickMenu(false);
              }}
              className="px-2.5 h-8 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              title="Wróć do puli"
            >
              Pula
            </button>
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
  const assignedItemIds = React.useMemo(() => {
    const ids = new Set<string>();
    TIERS.forEach((tier) => {
      placement[tier]?.forEach((id) => ids.add(id));
    });
    return ids;
  }, [placement]);

  // Elementy nieprzypisane (w puli rezerwowych)
  const unrankedItems = React.useMemo(() => {
    return category.items.filter((item) => !assignedItemIds.has(item.id));
  }, [category, assignedItemIds]);

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
    }
    // Jeśli upuszczono na 'unranked_pool', element zostaje po prostu wyjęty z tierów

    onPlacementChange(newPlacement);
  };

  // Szybkie przeniesienie za pomocą menu kafelka
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
    }

    onPlacementChange(newPlacement);
  };

  const isComplete = unrankedItems.length === 0;

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
              <span className="text-base animate-pulse">⏳</span>
              <span className="font-mono font-bold text-lg text-amber-400">
                {timeRemaining}s
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

      {/* Informacja dla Zgadujących o Twórcy */}
      {mode === 'guesser' && creatorName && (
        <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs sm:text-sm text-indigo-300 flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span>
            Twórcą w tej rundzie jest <strong>{creatorName}</strong>. Zastanów się, jakie są jego/jej preferencje!
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
                  <DraggableCard
                    key={item.id}
                    item={item}
                    disabled={readOnly || isSubmitted}
                    onQuickMove={(target) => handleQuickMove(item.id, target)}
                  />
                ))}
              </TierRow>
            );
          })}
        </div>

        {/* Ławka z nieprzypisanymi elementami */}
        <UnrankedPool count={unrankedItems.length}>
          {unrankedItems.map((item) => (
            <DraggableCard
              key={item.id}
              item={item}
              disabled={readOnly || isSubmitted}
              onQuickMove={(target) => handleQuickMove(item.id, target)}
            />
          ))}
        </UnrankedPool>

        {/* Pływający element podczas przeciągania */}
        <DragOverlay>
          {activeItem ? <DragOverlayCard item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
