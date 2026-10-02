import React from 'react';
import { ActiveLayer } from '../types';
import { LAYER_DEFINITIONS } from '../data/layerMetadata';
import { Eye, Layers, Grid, Sliders, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LayerControlPanelProps {
  activeLayer: ActiveLayer;
  onSelectLayer?: (layer: ActiveLayer) => void;
  onLayerChange?: (layer: ActiveLayer) => void;
  layerOpacity: number;
  onChangeOpacity?: (opacity: number) => void;
  onOpacityChange?: (opacity: number) => void;
  show10mGrid?: boolean;
  showGrid?: boolean;
  onToggleGrid: (show?: boolean) => void;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  activeLayer,
  onSelectLayer,
  onLayerChange,
  layerOpacity,
  onChangeOpacity,
  onOpacityChange,
  show10mGrid,
  showGrid,
  onToggleGrid,
}) => {
  const handleSelect = (layer: ActiveLayer) => {
    if (onLayerChange) onLayerChange(layer);
    else if (onSelectLayer) onSelectLayer(layer);
  };

  const handleOpacity = (val: number) => {
    if (onOpacityChange) onOpacityChange(val);
    else if (onChangeOpacity) onChangeOpacity(val);
  };

  const isGridActive = show10mGrid ?? showGrid ?? true;
  const currentLayerMeta = LAYER_DEFINITIONS[activeLayer];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-lg p-3 shadow-xl backdrop-blur-md text-slate-200 w-full max-w-sm">
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Control de Capas Fisiológicas
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Sentinel-2 SR 10m</span>
      </div>

      {/* Grouped Layer Buttons */}
      <div className="space-y-2.5">
        {/* Capa 1: Óptica & Falso Color */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Capa 1: Óptica y Composición</span>
            <span className="text-[10px] text-slate-400">Radiometría</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleSelect('rgb')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded transition-all text-left flex items-center justify-between ${
                activeLayer === 'rgb'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>Color Real (RGB)</span>
              <span className="text-[10px] font-mono opacity-80">B4-B3-B2</span>
            </button>
            <button
              onClick={() => handleSelect('cir')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded transition-all text-left flex items-center justify-between ${
                activeLayer === 'cir'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>Falso Color NIR</span>
              <span className="text-[10px] font-mono opacity-80">B8-B4-B3</span>
            </button>
          </div>
        </div>

        {/* Capa 2: Diagnóstico Intra-parcelario */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Capa 2: Diagnóstico Intra-parcelario</span>
            <span className="text-[10px] text-emerald-400">Píxel a Píxel (10m)</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleSelect('ndvi')}
              className={`px-2 py-1.5 text-xs font-medium rounded transition-all text-center ${
                activeLayer === 'ndvi'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Vigor (NDVI)
            </button>
            <button
              onClick={() => handleSelect('ndwi')}
              className={`px-2 py-1.5 text-xs font-medium rounded transition-all text-center ${
                activeLayer === 'ndwi'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Humedad (NDWI)
            </button>
            <button
              onClick={() => handleSelect('gndvi')}
              className={`px-2 py-1.5 text-xs font-medium rounded transition-all text-center ${
                activeLayer === 'gndvi'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Clorofila/N
            </button>
          </div>
        </div>

        {/* Capa 3: Predictivo Sacarosa */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Capa 3: Predictivo de Calidad Zafra</span>
            <span className="text-[10px] text-amber-400">Maduración</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleSelect('s2rep')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded transition-all text-left flex items-center justify-between ${
                activeLayer === 's2rep'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>Borde Rojo (S2REP)</span>
              <span className="text-[10px] font-mono opacity-80">705-735nm</span>
            </button>
            <button
              onClick={() => handleSelect('brix')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded transition-all text-left flex items-center justify-between ${
                activeLayer === 'brix'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>°Brix Estimados</span>
              <span className="text-[10px] font-mono opacity-80">Sacarosa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Layer Adjustments: Opacity & Grid */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 text-[11px] shrink-0">Opacidad:</span>
          <input
            type="range"
            min="20"
            max="100"
            value={layerOpacity}
            onChange={(e) => handleOpacity(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="font-mono text-[11px] text-slate-300 w-8 text-right shrink-0">
            {layerOpacity}%
          </span>
        </div>

        <button
          onClick={() => onToggleGrid(!isGridActive)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border transition-colors shrink-0 ${
            isGridActive
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
          title="Alternar cuadrícula de píxeles Sentinel-2 (10x10 metros)"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Malla 10m</span>
        </button>
      </div>

      {/* Scientific Legend & Formula */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 bg-slate-950/60 p-2 rounded border border-slate-800">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <div className="text-xs font-semibold text-white">{currentLayerMeta.name}</div>
            <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
              {currentLayerMeta.formula}
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
            {currentLayerMeta.unit}
          </span>
        </div>

        {/* Color Gradient Bars */}
        {activeLayer === 'rgb' && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded bg-gradient-to-r from-stone-900 via-amber-900/60 via-green-800 to-green-600 border border-slate-700/60" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Sombra / Agua</span>
              <span>Suelo / Callejón</span>
              <span>Cañaveral Verde</span>
            </div>
          </div>
        )}

        {activeLayer === 'cir' && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded bg-gradient-to-r from-cyan-900 via-stone-400 via-pink-600 to-red-600 border border-slate-700/60" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Agua / Paja Seca</span>
              <span>Suelo Franco</span>
              <span>Alto Vigor Foliar</span>
            </div>
          </div>
        )}

        {activeLayer === 'ndvi' && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded bg-gradient-to-r from-[#8c510a] via-[#e6f598] via-[#66c2a5] via-[#238443] to-[#00441b] border border-slate-700/60" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0.10 (Bajo / Suelo)</span>
              <span>0.50 (Medio)</span>
              <span>0.85 (Excepcional)</span>
            </div>
          </div>
        )}

        {activeLayer === 'gndvi' && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded bg-gradient-to-r from-[#fed976] via-[#addd8e] via-[#41ab5d] to-[#005a32] border border-slate-700/60" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0.20 (Clorosis)</span>
              <span>0.55 (Normal)</span>
              <span>0.80 (Óptimo N)</span>
            </div>
          </div>
        )}

        {activeLayer === 'ndwi' && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded bg-gradient-to-r from-[#dc2626] via-[#ea580c] via-[#facc15] via-[#38bdf8] to-[#0284c7] border border-slate-700/60" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span className="text-rose-400">&lt; 0.10 (Crítico)</span>
              <span className="text-amber-400">0.20 (Estrés)</span>
              <span className="text-sky-400">&gt; 0.30 (Óptimo)</span>
            </div>
          </div>
        )}

        {activeLayer === 's2rep' && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded bg-gradient-to-r from-[#f43f5e] via-[#fb923c] via-[#facc15] via-[#4ade80] to-[#10b981] border border-slate-700/60" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>705 nm (Inicio)</span>
              <span>720 nm (Inflexión)</span>
              <span>735 nm (Maduro)</span>
            </div>
          </div>
        )}

        {activeLayer === 'brix' && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded bg-gradient-to-r from-[#f87171] via-[#fbbf24] via-[#a3e635] via-[#10b981] to-[#047857] border border-slate-700/60" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span className="text-rose-400">&lt; 13 °Bx</span>
              <span className="text-amber-400">15-16 °Bx</span>
              <span className="text-emerald-400">&gt; 18.5 °Bx (Listo)</span>
            </div>
          </div>
        )}

        <div className="mt-2 text-[10px] text-slate-400 leading-relaxed">
          {currentLayerMeta.description}
        </div>
      </div>
    </div>
  );
};
