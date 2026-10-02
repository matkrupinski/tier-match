'use client';

import React from 'react';
import { Player } from '../../types/game';

interface PlayerStatusListProps {
  players: Player[];
  creatorId: string;
  currentUserId: string;
}

export const PlayerStatusList: React.FC<PlayerStatusListProps> = ({
  players,
  creatorId,
  currentUserId,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-4 flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-none">
      {players.map((player) => {
        const isCreator = player.id === creatorId;
        const isMe = player.id === currentUserId;

        return (
          <div
            key={player.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap transition-all ${
              isCreator
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : player.hasSubmitted
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
              <img
                src={player.avatarUrl}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>

            <span className="font-semibold">{player.name}</span>
            {isMe && <span className="text-[10px] text-indigo-400">(Ty)</span>}

            {isCreator && (
              <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1 rounded font-bold">
                Twórca
              </span>
            )}

            {!isCreator && player.hasSubmitted && (
              <span className="text-emerald-400 font-bold">✓</span>
            )}
            {!isCreator && !player.hasSubmitted && (
              <span className="text-slate-500 text-[10px]">Układa...</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
