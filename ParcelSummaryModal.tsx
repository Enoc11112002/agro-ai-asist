import React from 'react';
import { Parcel, PixelDiagnostic, SentinelScene } from '../types';
import {
  X,
  FileCheck,
  Scale,
  Calendar,
  Factory,
  Sprout,
  Droplets,
  Gauge,
  TrendingUp,
  AlertTriangle,
  Printer,
  Award
} from 'lucide-react';

interface ParcelSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: Parcel;
  pixels: PixelDiagnostic[];
  scene: SentinelScene;
}

export const ParcelSummaryModal: React.FC<ParcelSummaryModalProps> = ({
  isOpen,
  onClose,
  parcel,
  pixels,
  scene,
}) => {
  if (!isOpen) return null;

  // Calculate field statistics
  const totalPixels = pixels.length || 1;
  const criticalStressPixels = pixels.filter((p) => p.status.waterStressKey === 'critical').length;
  const moderateStressPixels = pixels.filter((p) => p.status.waterStressKey === 'moderate').length;
  const optimalStressPixels = pixels.filter((p) => p.status.waterStressKey === 'optimal').length;

  const criticalPct = Math.round((criticalStressPixels / totalPixels) * 100);
  const moderatePct = Math.round((moderateStressPixels / totalPixels) * 100);
  const optimalPct = Math.round((optimalStressPixels / totalPixels) * 100);

  const readyForZafraPixels = pixels.filter((p) => p.indices.brix >= 16.5).length;
  const zafraReadyPct = Math.round((readyForZafraPixels / totalPixels) * 100);

  const avgNDVI = (pixels.reduce((acc, p) => acc + p.indices.ndvi, 0) / totalPixels).toFixed(2);
  const avgGNDVI = (pixels.reduce((acc, p) => acc + p.indices.gndvi, 0) / totalPixels).toFixed(2);
  const avgNDWI = (pixels.reduce((acc, p) => acc + p.indices.ndwi, 0) / totalPixels).toFixed(2);
  const avgS2REP = (pixels.reduce((acc, p) => acc + p.indices.s2rep, 0) / totalPixels).toFixed(1);
  const avgBrix = (pixels.reduce((acc, p) => acc + p.indices.brix, 0) / totalPixels).toFixed(1);

  const estimatedTotalTons = Math.round(parcel.areaHa * parcel.expectedYieldTonHa);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Informe Fisiológico Integral del Predio
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {parcel.cadastralCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {parcel.name} · {parcel.ranchoName} ({parcel.zoneName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Imprimir informe"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Executive Overview Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">Superficie Total:</span>
              <span className="text-lg font-bold text-white">{parcel.areaHa} ha</span>
              <span className="text-[10px] text-slate-400 block font-sans">{totalPixels} píxeles (10m)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">Cosecha Estimada:</span>
              <span className="text-lg font-bold text-emerald-400">{estimatedTotalTons} Ton</span>
              <span className="text-[10px] text-slate-400 block font-sans">{parcel.expectedYieldTonHa} Ton/ha</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">Variedad / Ciclo:</span>
              <span className="text-sm font-bold text-slate-200">{parcel.variety}</span>
              <span className="text-[10px] text-slate-400 block font-sans">{parcel.cycle}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">Fecha de Cosecha:</span>
              <span className="text-sm font-bold text-amber-300">{parcel.estimatedHarvestDate}</span>
              <span className="text-[10px] text-slate-400 block font-sans">Ventana Zafra</span>
            </div>
          </div>

          {/* Aggregate Index Metrics */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Promedios Ponderados Intra-parcelarios (Sentinel-2 SR)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">NDVI Promedio</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{avgNDVI}</span>
                <span className="text-[10px] text-emerald-300 block">Vigor Alto</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">GNDVI (N)</span>
                <span className="text-xl font-bold font-mono text-emerald-300">{avgGNDVI}</span>
                <span className="text-[10px] text-slate-400 block">Clorofila Óptima</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">NDWI Humedad</span>
                <span className="text-xl font-bold font-mono text-sky-400">{avgNDWI}</span>
                <span className="text-[10px] text-sky-300 block">Turgencia Normal</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">S2REP Borde Rojo</span>
                <span className="text-xl font-bold font-mono text-amber-300">{avgS2REP} nm</span>
                <span className="text-[10px] text-slate-400 block">Inflexión</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block">°Brix Estimado</span>
                <span className="text-xl font-bold font-mono text-amber-400">{avgBrix}°</span>
                <span className="text-[10px] text-amber-300 block">Sacarosa en Tallo</span>
              </div>
            </div>
          </div>

          {/* Water Stress Semaphore Distribution */}
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Distribución Espacial de Humedad Foliar (Semáforo NDWI)
              </span>
              <span className="text-[11px] font-mono text-slate-400">Umbral: NDWI &lt; 0.10 Crítico</span>
            </div>

            {/* Segmented bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800">
              <div
                style={{ width: `${optimalPct}%` }}
                className="bg-sky-500 transition-all duration-500"
                title={`Óptimo: ${optimalPct}%`}
              />
              <div
                style={{ width: `${moderatePct}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`Moderado: ${moderatePct}%`}
              />
              <div
                style={{ width: `${criticalPct}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Crítico: ${criticalPct}%`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 font-mono">
              <div className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Óptimo (&gt;0.3): {optimalPct}% ({optimalStressPixels} celdas)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Moderado (0.1-0.3): {moderatePct}% ({moderateStressPixels} celdas)</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Crítico (&lt;0.1): {criticalPct}% ({criticalStressPixels} celdas)</span>
              </div>
            </div>
          </div>

          {/* Readiness for Sugar Mill Zafra */}
          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Dictamen para Programación de Cosecha ({parcel.ranchoName})</span>
              </div>
              <span className="font-mono text-xs text-amber-300 font-bold">
                {zafraReadyPct}% Predio en Madurez Zafra
              </span>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              El predio <strong className="text-white">{parcel.name}</strong> presenta una condición fisiológica
              avanzada con estabilización de sacarosa en jugo de tallo molible ({avgBrix} °Bx promedio).
              Se recomienda programar el corte mecanizado dentro del programa de zafra en la ventana
              del <strong className="text-emerald-400">{parcel.estimatedHarvestDate}</strong>,
              asegurando la suspensión del riego 15 días previos para maximizar la concentración de sacarosa y evitar atascamiento de alzadoras.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Escena: {scene.platform} · {scene.date} · GEE SR
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
