'use client';

import React, { useState, useMemo } from 'react';
import { ExerciseLog } from '@/types/db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  history: { date: string; log: ExerciseLog }[];
}

// Brand-aligned palette: accent green at full/reduced opacity, then muted tones
const SET_COLORS = [
  '#91FF00',        // accent green
  '#91FF0099',      // accent green 60%
  '#91FF0055',      // accent green 33%
  '#ffffff',        // foreground white
  '#a1a1aa',        // text-secondary
  '#888888',        // text-muted
];

export default function ProgressModal({ isOpen, onClose, exerciseName, history }: ProgressModalProps) {
  const [mode, setMode] = useState<'weight' | 'reps'>('weight');

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = useMemo(() => {
    const reversed = [...history].reverse();
    return reversed.map(entry => {
      const ts = new Date(entry.date).getTime();
      const point: Record<string, number | null> = { timestamp: ts };
      entry.log.sets.forEach((set, i) => {
        point[`Set ${i + 1}`] = mode === 'weight' ? set.weight : set.reps;
      });
      return point;
    });
  }, [history, mode]);

  const maxSets = useMemo(() => {
    let max = 0;
    history.forEach(h => {
      if (h.log.sets.length > max) max = h.log.sets.length;
    });
    return max;
  }, [history]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent block mb-1">Progress</span>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-foreground truncate">
            {exerciseName}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="ml-4 p-2 text-text-muted hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Toggle */}
      <div className="px-6 mb-4">
        <div className="flex bg-card rounded-xl border border-card-border overflow-hidden">
          <button
            onClick={() => setMode('weight')}
            className={`flex-1 py-3 text-xs font-black uppercase italic tracking-wider transition-all ${mode === 'weight' ? 'bg-accent text-accent-foreground' : 'text-text-muted'}`}
          >
            Weight (kg)
          </button>
          <button
            onClick={() => setMode('reps')}
            className={`flex-1 py-3 text-xs font-black uppercase italic tracking-wider transition-all ${mode === 'reps' ? 'bg-accent text-accent-foreground' : 'text-text-muted'}`}
          >
            Reps
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-2 pb-8 select-none" style={{ touchAction: 'none', WebkitUserSelect: 'none' }}>
        {history.length < 2 ? (
          <div className="flex items-center justify-center h-full text-text-muted font-bold italic text-sm">
            Need at least 2 sessions to show progress
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatDate}
                tick={{ fontSize: 10, fill: '#888888', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#888888', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                width={40}
                allowDecimals={false}
                domain={mode === 'weight' ? ['dataMin - 5', 'auto'] : [0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
                labelFormatter={(ts) => formatDate(Number(ts))}
                labelStyle={{ color: '#91FF00', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}
                itemStyle={{ color: '#a1a1aa' }}
                formatter={(value) => mode === 'weight' ? `${value} kg` : `${value} reps`}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', fontWeight: 800, color: '#888888' }}
              />
              {Array.from({ length: maxSets }).map((_, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={`Set ${i + 1}`}
                  stroke={SET_COLORS[i % SET_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: '#0a0a0a' }}
                  activeDot={{ r: 6, fill: SET_COLORS[i % SET_COLORS.length] }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
