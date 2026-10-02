import React, { useState } from 'react';
import { Rancho, RanchoZone, Parcel } from '../types';
import {
  Building2,
  Layers,
  MapPin,
  Sprout,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Droplets,
  Calendar,
  Sparkles,
  PenTool,
  UploadCloud,
  AlertTriangle
} from 'lucide-react';

interface NavigationSidebarProps {
  ranchos: Rancho[];
  selectedRancho: Rancho | null;
  onSelectRancho: (rancho: Rancho) => void;
  selectedParcel: Parcel | null;
  onSelectParcel: (parcel: Parcel) => void;
  onOpenWizard: () => void;
  onStartDrawParcel: () => void;
  onImportGeoJSON: () => void;
  onDeleteRancho: (ranchoId: string) => void;
  onDeleteZone: (ranchoId: string, zoneId: string) => void;
  onDeleteParcel: (parcelId: string) => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  ranchos,
  selectedRancho,
  onSelectRancho,
  selectedParcel,
  onSelectParcel,
  onOpenWizard,
  onStartDrawParcel,
  onImportGeoJSON,
  onDeleteRancho,
  onDeleteZone,
  onDeleteParcel,
}) => {
  // Collapsed state for zones
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});

  const toggleZone = (zoneId: string) => {
    setExpandedZones((prev) => ({
      ...prev,
      [zoneId]: !prev[zoneId],
    }));
  };

  const totalParcelsCount = selectedRancho?.zones?.reduce(
    (acc, z) => acc + z.parcels.length,
    0
  ) || 0;

  if (!selectedRancho) {
    return (
      <aside className="w-80 md:w-96 flex flex-col h-full bg-slate-900/95 border-r border-slate-800 backdrop-blur-sm z-20 shrink-0 text-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Predios y Ranchos</span>
        </div>

        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-center space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sin predios registrados. Registra tu rancho y delimita tus parcelas reales para consultar a Google Earth Engine.
          </p>
          <button
            onClick={onOpenWizard}
            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Rancho</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 md:w-96 flex flex-col h-full bg-slate-900/95 border-r border-slate-800 backdrop-blur-sm z-20 shrink-0 text-slate-200">
      {/* Rancho Selection Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rancho Activo</span>
          </span>
          <button
            onClick={onOpenWizard}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
            title="Crear nuevo rancho con asistente guiado"
          >
            <Plus className="w-3 h-3" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Rancho Dropdown & Actions */}
        <div className="flex items-center gap-2">
          <select
            value={selectedRancho.id}
            onChange={(e) => {
              const r = ranchos.find((item) => item.id === e.target.value);
              if (r) onSelectRancho(r);
            }}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
          >
            {ranchos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.municipality})
              </option>
            ))}
          </select>

          {ranchos.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`¿Estás seguro de eliminar el rancho "${selectedRancho.name}" y todas sus zonas y parcelas?`)) {
                  onDeleteRancho(selectedRancho.id);
                }
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
              title="Eliminar rancho actual"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons for Adding Real Parcels */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={onStartDrawParcel}
            className="px-2.5 py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
            title="Hacer clic en el mapa satelital para trazar el polígono real de tu parcela"
          >
            <PenTool className="w-3 h-3" />
            <span>Dibujar en Mapa</span>
          </button>

          <button
            onClick={onImportGeoJSON}
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            title="Importar polígono GeoJSON o coordenadas GPS reales"
          >
            <UploadCloud className="w-3 h-3" />
            <span>Cargar Polígono</span>
          </button>
        </div>

        {/* Rancho Details Snapshot */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{selectedRancho.zones.length} Zonas · {totalParcelsCount} Parcelas</span>
          <span className="text-emerald-400 font-bold">{selectedRancho.totalAreaHa} ha</span>
        </div>
      </div>

      {/* Hierarchical Zones & Parcels Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <span>Zonas y Parcelas Reales</span>
        </div>

        {selectedRancho.zones.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs space-y-2">
            <p>Este rancho no tiene parcelas delimitadas aún.</p>
            <button
              onClick={onStartDrawParcel}
              className="text-emerald-400 hover:underline text-xs font-semibold"
            >
              + Dibujar primera parcela en el mapa
            </button>
          </div>
        ) : (
          selectedRancho.zones.map((zone) => {
            const isExpanded = expandedZones[zone.id] ?? true;

            return (
              <div
                key={zone.id}
                className="bg-slate-950/70 rounded-lg border border-slate-800/80 overflow-hidden"
              >
                {/* Zone Bar */}
                <div
                  className="px-3 py-2 bg-slate-900/90 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors"
                  onClick={() => toggleZone(zone.id)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className="text-xs font-bold text-white tracking-tight">
                      {zone.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {zone.parcels.length} parcelas
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar la zona "${zone.name}" y sus parcelas?`)) {
                          onDeleteZone(selectedRancho.id, zone.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Eliminar zona"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Parcels List */}
                {isExpanded && (
                  <div className="p-2 space-y-1.5">
                    {zone.parcels.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic p-2 text-center">
                        Sin parcelas en esta zona.
                      </div>
                    ) : (
                      zone.parcels.map((parcel) => {
                        const isSelected = selectedParcel ? selectedParcel.id === parcel.id : false;

                        return (
                          <div
                            key={parcel.id}
                            onClick={() => onSelectParcel(parcel)}
                            className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-slate-800/90 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                                : 'bg-slate-900/50 border-slate-800/70 hover:border-slate-700 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div>
                                <div className="text-xs font-semibold text-white">
                                  {parcel.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span className="text-emerald-400">{parcel.cadastralCode}</span>
                                  <span>·</span>
                                  <span>{parcel.areaHa} ha</span>
                                  <span>·</span>
                                  <span>{parcel.variety}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {isSelected && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 shrink-0" />
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`¿Eliminar la parcela "${parcel.name}"?`)) {
                                      onDeleteParcel(parcel.id);
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                  title="Eliminar parcela"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Real GEE Metrics Bar */}
                            <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-mono bg-slate-950/70 p-1 rounded border border-slate-800/60">
                              <div className="text-center">
                                <span className="text-slate-400 block text-[9px]">NDVI</span>
                                <span className="font-bold text-emerald-400">
                                  {parcel.avgMetrics?.ndvi !== undefined ? parcel.avgMetrics.ndvi.toFixed(2) : '--'}
                                </span>
                              </div>
                              <div className="text-center border-x border-slate-800/60">
                                <span className="text-slate-400 block text-[9px]">NDWI</span>
                                <span className={`font-bold ${
                                  (parcel.avgMetrics?.ndwi || 0) < 0.1
                                    ? 'text-rose-400'
                                    : (parcel.avgMetrics?.ndwi || 0) < 0.3
                                    ? 'text-amber-400'
                                    : 'text-sky-400'
                                }`}>
                                  {parcel.avgMetrics?.ndwi !== undefined ? parcel.avgMetrics.ndwi.toFixed(2) : '--'}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="text-slate-400 block text-[9px]">°Brix</span>
                                <span className="font-bold text-amber-300">
                                  {parcel.avgMetrics?.brix !== undefined ? parcel.avgMetrics.brix.toFixed(1) + '°' : '--'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Selected Parcel Executive Snapshot */}
      {selectedParcel && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Parcela Seleccionada
            </span>
            <span className="font-mono text-emerald-400 text-[11px]">
              {selectedParcel.zoneName}
            </span>
          </div>

          <div className="space-y-1 text-slate-300 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Predio:</span>
              <span className="font-semibold text-white">{selectedParcel.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Superficie Real:</span>
              <span className="font-mono text-emerald-400 font-semibold">{selectedParcel.areaHa} ha</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Variedad:</span>
              <span className="text-slate-200">{selectedParcel.variety} ({selectedParcel.cycle})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Régimen Hídrico:</span>
              <span className="text-slate-200">{selectedParcel.irrigationType}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
