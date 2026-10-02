import React from 'react';
import { SentinelScene } from '../types';
import { ProximitySearchResult, findNearestSentinelScene } from '../data/sentinelScenes';
import { Calendar, CloudSun, Satellite, CheckCircle, Clock, ChevronRight } from 'lucide-react';

interface TemporalSearchProps {
  selectedDate?: string;
  targetDate?: string;
  onSelectDate?: (date: string) => void;
  onDateChange?: (date: string) => void;
  searchResult?: ProximitySearchResult;
  activeScene?: SentinelScene;
  currentScene?: SentinelScene;
  onSelectScene?: (scene: SentinelScene) => void;
}

export const TemporalSearch: React.FC<TemporalSearchProps> = ({
  selectedDate,
  targetDate,
  onSelectDate,
  onDateChange,
  searchResult,
  activeScene,
  currentScene,
  onSelectScene,
}) => {
  const effectiveDate = targetDate || selectedDate || '2024-03-31';
  const effectiveResult = searchResult || findNearestSentinelScene(effectiveDate);
  const effectiveScene = currentScene || activeScene || effectiveResult.closestScene;

  const handleDateChange = (date: string) => {
    if (onDateChange) onDateChange(date);
    else if (onSelectDate) onSelectDate(date);

    if (onSelectScene) {
      const res = findNearestSentinelScene(date);
      onSelectScene(res.closestScene);
    }
  };

  const quickPresets = [
    { label: 'Zafra 2026 (Pico)', date: '2026-03-21' },
    { label: 'Cosecha Feb 2026', date: '2026-02-14' },
    { label: 'Maduración 2025', date: '2025-11-26' },
    { label: 'Temporal Lluvias', date: '2025-08-18' },
    { label: 'Estiaje Crítico 2024', date: '2024-05-25' },
  ];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-lg p-3 shadow-xl backdrop-blur-md text-slate-200 w-full max-w-sm">
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Buscador Temporal Inteligente
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400">2024 - 2026</span>
      </div>

      {/* Date Picker Input */}
      <div className="space-y-2">
        <label className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
          <span>Seleccionar Fecha Objetivo</span>
          <span className="text-[10px] text-slate-400">Algoritmo de Proximidad S2</span>
        </label>
        <div className="relative">
          <input
            type="date"
            min="2024-01-01"
            max="2026-12-31"
            value={effectiveDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Quick Seasonal Presets */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            Hitos Fenológicos y Zafra:
          </div>
          <div className="flex flex-wrap gap-1">
            {quickPresets.map((preset) => (
              <button
                key={preset.date}
                onClick={() => handleDateChange(preset.date)}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                  effectiveDate === preset.date
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Proximity Result Banner */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 bg-slate-950/70 p-2.5 rounded border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 font-medium text-emerald-300">
            <Satellite className="w-3.5 h-3.5 text-emerald-400" />
            <span>Escena Activa: {effectiveScene.platform}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {effectiveResult.deltaDays === 0
              ? 'Pase Exacto'
              : `Pase Cercano (±${effectiveResult.deltaDays}d)`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-2 bg-slate-900/60 p-1.5 rounded">
          <div>
            <span className="text-[10px] text-slate-400 font-sans block">Fecha Adquisición:</span>
            <span className="text-white font-semibold">{effectiveScene.date}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-sans block">Nubosidad GEE:</span>
            <span className="text-emerald-400 font-semibold">{effectiveScene.cloudCoverPct}% (&lt;25%)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-sans block">Tile MGRS / Órbita:</span>
            <span className="text-slate-300">{effectiveScene.tile} · R{effectiveScene.orbitNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-sans block">Elevación Solar:</span>
            <span className="text-slate-300">{effectiveScene.sunElevationDeg}°</span>
          </div>
        </div>

        {/* Scene Identifier */}
        <div className="mt-2 text-[9px] font-mono text-slate-400 truncate" title={effectiveScene.id}>
          GEE ID: {effectiveScene.id}
        </div>
      </div>
    </div>
  );
};
