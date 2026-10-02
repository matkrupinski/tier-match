'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
}

export const TimerBar: React.FC<TimerBarProps> = ({ timeRemaining, totalTime }) => {
  const percentage = Math.max(0, Math.min(100, (timeRemaining / (totalTime || 1)) * 100));
  const isUrgent = timeRemaining <= 10 && timeRemaining > 0;

  return (
    <div className="w-full max-w-4xl mx-auto mb-4">
      <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-1.5 px-1">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-rose-500 animate-ping' : 'bg-indigo-400'}`} />
          Czas do końca etapu:
        </span>
        <span className={`text-sm ${isUrgent ? 'text-rose-400 animate-pulse font-black' : 'text-slate-300'}`}>
          {timeRemaining}s
        </span>
      </div>

      <div className="w-full h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
        <motion.div
          className={`h-full rounded-full transition-all duration-300 ${
            isUrgent
              ? 'bg-gradient-to-r from-rose-500 to-red-600'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
