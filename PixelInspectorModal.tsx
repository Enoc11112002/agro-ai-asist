import React from 'react';
import { PixelDiagnostic } from '../types';
import {
  X,
  Droplets,
  Activity,
  Sprout,
  Gauge,
  Compass,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Sparkles
} from 'lucide-react';

interface PixelInspectorModalProps {
  pixel: PixelDiagnostic | null;
  onClose: () => void;
}

export const PixelInspectorModal: React.FC<PixelInspectorModalProps> = ({ pixel, onClose }) => {
  if (!pixel) return null;

  const { bands, indices, status, recommendation } = pixel;

  // Prepare points for SVG Spectral Signature Curve
  // Bands wavelengths in nm: B2:490, B3:560, B4:665, B5:705, B6:740, B7:783, B8:842, B11:1610
  const bandPoints = [
    { name: 'B2', label: 'Azul (490nm)', val: bands.B2, x: 25 },
    { name: 'B3', label: 'Verde (560nm)', val: bands.B3, x: 65 },
    { name: 'B4', label: 'Rojo (665nm)', val: bands.B4, x: 105 },
    { name: 'B5', label: 'RedEdge1 (705nm)', val: bands.B5, x: 150 },
    { name: 'B6', label: 'RedEdge2 (740nm)', val: bands.B6, x: 195 },
    { name: 'B7', label: 'RedEdge3 (783nm)', val: bands.B7, x: 240 },
    { name: 'B8', label: 'NIR (842nm)', val: bands.B8, x: 290 },
    { name: 'B11', label: 'SWIR1 (1610nm)', val: bands.B11, x: 350 },
  ];

  // SVG dimensions
  const svgWidth = 375;
  const svgHeight = 110;
  const maxReflectance = 6000;

  const polylineCoords = bandPoints
    .map((p) => {
      const y = svgHeight - 15 - (p.val / maxReflectance) * (svgHeight - 30);
      return `${p.x},${Math.max(10, Math.min(svgHeight - 15, y))}`;
    })
    .join(' ');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Reporte Ejecutivo Intra-parcelario (Celda 10x10m)
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {pixel.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {pixel.parcelName} · {pixel.ranchoName} ({pixel.zoneName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Imprimir / Exportar Reporte"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Spatial & Acquisition Metadata Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">Coordenadas WGS84:</span>
              <span className="text-slate-200">{pixel.lat.toFixed(5)}°, {pixel.lng.toFixed(5)}°</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">Proyección UTM:</span>
              <span className="text-slate-200">{pixel.utmCoord}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">Fecha Adquisición:</span>
              <span className="text-emerald-400 font-semibold">{pixel.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">Sensor Satelital:</span>
              <span className="text-slate-200">Sentinel-2 SR (BOA)</span>
            </div>
          </div>

          {/* 4 Required Scientific Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Metric 1: NDVI (Vigor y Biomasa) */}
            <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Vigor y Biomasa (NDVI)
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    (B8 - B4) / (B8 + B4)
                  </div>
                </div>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  {indices.ndvi.toFixed(2)}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {status.vigorLevel} Vigor
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                Rango cañaveral: 0.10 a 0.85 · Cobertura de dosel densa y activa.
              </div>
            </div>

            {/* Metric 2: GNDVI (Clorofila y Nitrógeno) */}
            <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Clorofila y Nitrógeno (GNDVI)
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    (B8 - B3) / (B8 + B3)
                  </div>
                </div>
                <Sprout className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-emerald-300 tabular-nums">
                  {indices.gndvi.toFixed(2)}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Nivel {status.chlorophyllLevel}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                Sin saturación en dosel cerrado · Estado nutricional nitrogenado.
              </div>
            </div>

            {/* Metric 3: NDWI (Humedad Foliar) CON SEMÁFORO DE ESTRÉS */}
            <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
              status.waterStressKey === 'critical'
                ? 'bg-rose-950/30 border-rose-600/60'
                : status.waterStressKey === 'moderate'
                ? 'bg-amber-950/30 border-amber-600/60'
                : 'bg-sky-950/30 border-sky-600/60'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                    Humedad Foliar (NDWI)
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    (B8 - B11) / (B8 + B11)
                  </div>
                </div>
                <Droplets className={`w-4 h-4 ${
                  status.waterStressKey === 'critical'
                    ? 'text-rose-400'
                    : status.waterStressKey === 'moderate'
                    ? 'text-amber-400'
                    : 'text-sky-400'
                }`} />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-2xl font-bold font-mono tabular-nums ${
                  status.waterStressKey === 'critical'
                    ? 'text-rose-400'
                    : status.waterStressKey === 'moderate'
                    ? 'text-amber-300'
                    : 'text-sky-300'
                }`}>
                  {indices.ndwi.toFixed(2)}
                </span>
                {/* Traffic Light Semaphore */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-slate-900 border border-slate-700">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    status.waterStressKey === 'critical'
                      ? 'bg-rose-500 animate-pulse'
                      : status.waterStressKey === 'moderate'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`} />
                  <span>{status.waterStress}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                <span className="text-rose-400">Crítico: &lt; 0.10</span>
                <span className="text-amber-400">Moderado: 0.10 - 0.30</span>
                <span className="text-sky-400 font-semibold">Óptimo: &gt; 0.30</span>
              </div>
            </div>

            {/* Metric 4: S2REP y Grados Brix Estimados */}
            <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Borde Rojo (S2REP) y °Brix
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    S2REP [nm] · °Brix ≈ NDVI * 22
                  </div>
                </div>
                <Gauge className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
                    {indices.brix.toFixed(1)}°
                  </span>
                  <span className="text-xs text-slate-400 ml-1 font-mono">Brix</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-400 block font-semibold">
                    {indices.s2rep.toFixed(1)} nm
                  </span>
                  <span className="text-[10px] text-slate-400">Inflexión S2REP</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                Estado: <span className="text-white font-medium">{status.ripenessState}</span> · {status.sugarEstimateQuality}
              </div>
            </div>
          </div>

          {/* Spectral Reflectance Signature (Sentinel-2 BOA Curve) */}
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Firma Espectral del Píxel (Sentinel-2 BOA Reflectancia)
              </span>
              <span className="text-[10px] font-mono text-slate-400">DN BOA [0 - 10000]</span>
            </div>

            <div className="h-28 w-full relative flex items-center justify-center pt-2">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                {/* Grid guidelines */}
                <line x1="15" y1="20" x2={svgWidth - 10} y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="15" y1="50" x2={svgWidth - 10} y2="50" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="15" y1="80" x2={svgWidth - 10} y2="80" stroke="#1e293b" strokeDasharray="3 3" />

                {/* Polyline curve */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylineCoords}
                />

                {/* Data Points */}
                {bandPoints.map((p, idx) => {
                  const y = svgHeight - 15 - (p.val / maxReflectance) * (svgHeight - 30);
                  const clampedY = Math.max(10, Math.min(svgHeight - 15, y));
                  return (
                    <g key={p.name}>
                      <circle cx={p.x} cy={clampedY} r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
                      <text
                        x={p.x}
                        y={svgHeight - 2}
                        fontSize="8"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontFamily="monospace"
                      >
                        {p.name}
                      </text>
                      <text
                        x={p.x}
                        y={clampedY - 6}
                        fontSize="8"
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontFamily="monospace"
                      >
                        {p.val}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="mt-1 text-[10px] text-slate-400 text-center">
              Curva típica de cañaveral fotosintéticamente activo: absorción en B4 (rojo), escalón abrupto en Red-Edge (B5-B7) y meseta en B8 (NIR).
            </div>
          </div>

          {/* Agronomic Prescriptions & Next Actions */}
          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dictamen Agronómico y Prescripción para el Ingenio</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-300">
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  1. Riego y Balance Hídrico:
                </span>
                <p className="text-[11px] leading-relaxed">{recommendation.irrigation}</p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  2. Nutrición y Clorofila:
                </span>
                <p className="text-[11px] leading-relaxed">{recommendation.nutrition}</p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  3. Programación de Zafra:
                </span>
                <p className="text-[11px] leading-relaxed">{recommendation.harvest}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>COPERNICUS/S2_SR_HARMONIZED</span>
            <span>·</span>
            <span>Resolución Espacial: 10 metros</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Cerrar Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
