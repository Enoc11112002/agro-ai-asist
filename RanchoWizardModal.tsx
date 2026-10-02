import React, { useState, useEffect } from 'react';
import { Rancho, RanchoZone, Parcel, RanchoWizardDraft } from '../types';
import {
  saveWizardDraft,
  getSavedWizardDraft,
  clearWizardDraft,
} from '../data/ranchos';
import { HUASTECA_MUNICIPALITY_COORDS } from '../utils/parcelGenerator';
import { calculatePolygonAreaHa, getPolygonBoundsAndCenter } from '../services/geeService';
import {
  X,
  Building2,
  Layers,
  MapPin,
  Save,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Plus,
  RotateCcw,
  Sparkles,
  AlertCircle,
  PenTool,
  Check,
  Sprout,
  Droplets,
  Calendar
} from 'lucide-react';

interface ZoneSetupItem {
  id: string;
  name: string;
  code: string;
  parcelCount: number;
  polygon?: [number, number][];
  bounds?: [[number, number], [number, number]];
  areaHa?: number;
}

interface RanchoWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteRancho: (newRancho: Rancho) => void;
  // Map drawing bridge
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  drawingPoints: [number, number][];
  setDrawingPoints: React.Dispatch<React.SetStateAction<[number, number][]>>;
  drawingType: 'zone' | 'parcel' | null;
  setDrawingType: (type: 'zone' | 'parcel' | null) => void;
  drawingTitle: string;
  setDrawingTitle: (title: string) => void;
  onFlyToBounds?: (bounds: [[number, number], [number, number]]) => void;
  onUpdateDraftZones?: (zones: RanchoZone[]) => void;
  onUpdateDraftParcels?: (parcels: Parcel[]) => void;
}

export const RanchoWizardModal: React.FC<RanchoWizardModalProps> = ({
  isOpen,
  onClose,
  onCompleteRancho,
  isDrawing,
  setIsDrawing,
  drawingPoints,
  setDrawingPoints,
  drawingType,
  setDrawingType,
  drawingTitle,
  setDrawingTitle,
  onFlyToBounds,
  onUpdateDraftZones,
  onUpdateDraftParcels,
}) => {
  // Steps:
  // 1: Rancho Info (Nombre y Municipio)
  // 2: Separar secciones (Elegir 1 a 10 zonas)
  // 3: Dibujar CADA UNA de las zonas en el mapa
  // 4: Número de parcelas por zona
  // 5: Dibujar CADA UNA de las parcelas a mano y capturar datos
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [existingDraft, setExistingDraft] = useState<RanchoWizardDraft | null>(null);

  // Step 1: Rancho Data
  const [ranchoName, setRanchoName] = useState('');
  const [municipality, setMunicipality] = useState('Ciudad Valles');
  const [centerLat, setCenterLat] = useState(21.982);
  const [centerLng, setCenterLng] = useState(-99.035);

  // Step 2: Zones Count & Config (1 to 10)
  const [zoneCount, setZoneCount] = useState<number>(4);
  const [zonesList, setZonesList] = useState<ZoneSetupItem[]>([]);

  // Step 3: Zone Drawing Pointer
  const [drawingZoneIdx, setDrawingZoneIdx] = useState<number>(0);

  // Step 5: Parcel Drawing State & Form
  const [currentDrawingZoneIdx, setCurrentDrawingZoneIdx] = useState<number>(0);
  const [currentDrawingParcelIdx, setCurrentDrawingParcelIdx] = useState<number>(0);
  const [mappedParcels, setMappedParcels] = useState<Parcel[]>([]);

  // Parcel form fields during Step 5 drawing
  const [currentParcelName, setCurrentParcelName] = useState('');
  const [currentVariety, setCurrentVariety] = useState('CP 72-2086');
  const [currentCycle, setCurrentCycle] = useState('Plantilla');
  const [currentIrrigation, setCurrentIrrigation] = useState('Riego de Auxilio');

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Check for saved draft when opening
  useEffect(() => {
    if (isOpen) {
      const draft = getSavedWizardDraft();
      if (draft) {
        setExistingDraft(draft);
      } else {
        initDefaultZones(4);
      }
    }
  }, [isOpen]);

  const initDefaultZones = (count: number) => {
    const zones: ZoneSetupItem[] = Array.from({ length: count }, (_, i) => ({
      id: `zone-${Date.now()}-${i + 1}`,
      name: `Zona ${i + 1}`,
      code: `Z-${i + 1}`,
      parcelCount: 3,
    }));
    setZonesList(zones);
  };

  const handleResumeDraft = () => {
    if (!existingDraft) return;
    setRanchoName(existingDraft.ranchoName);
    setMunicipality(existingDraft.municipality);
    setCenterLat(existingDraft.centerLat);
    setCenterLng(existingDraft.centerLng);
    setZoneCount(existingDraft.zoneCount);
    setZonesList(existingDraft.zonesConfig);
    setDrawingZoneIdx(existingDraft.activeZoneIndex || 0);
    setCurrentDrawingZoneIdx(existingDraft.activeZoneIndex || 0);
    setCurrentDrawingParcelIdx(existingDraft.activeParcelIndex || 0);
    setMappedParcels(existingDraft.mappedParcels || []);

    setCurrentStep(existingDraft.currentStep);
    setExistingDraft(null);

    // If resumed in drawing step, set up drawing mode
    if (existingDraft.currentStep === 3) {
      setupDrawingZone(existingDraft.activeZoneIndex || 0);
    } else if (existingDraft.currentStep === 5) {
      setupDrawingParcel(existingDraft.activeZoneIndex || 0, existingDraft.activeParcelIndex || 0);
    }
  };

  const handleDiscardDraft = () => {
    clearWizardDraft();
    setExistingDraft(null);
    setRanchoName('');
    setCurrentStep(1);
    initDefaultZones(4);
    setMappedParcels([]);
    setIsDrawing(false);
    setDrawingPoints([]);
  };

  const handleSaveProgress = () => {
    const draft: RanchoWizardDraft = {
      id: `draft-${Date.now()}`,
      currentStep,
      ranchoName,
      municipality,
      centerLat,
      centerLng,
      zoneCount,
      zonesConfig: zonesList,
      activeZoneIndex: currentStep === 3 ? drawingZoneIdx : currentDrawingZoneIdx,
      activeParcelIndex: currentDrawingParcelIdx,
      mappedParcels,
      lastSavedAt: new Date().toLocaleString('es-MX'),
    };

    saveWizardDraft(draft);
    setSaveFeedback('Progreso guardado correctamente. Puedes cerrar y continuar después.');
    setTimeout(() => {
      setSaveFeedback(null);
      setIsDrawing(false);
      onClose();
    }, 1200);
  };

  // Change municipality in Step 1
  const handleMunicipalityChange = (muni: string) => {
    setMunicipality(muni);
    const coords = HUASTECA_MUNICIPALITY_COORDS[muni];
    if (coords) {
      setCenterLat(coords[0]);
      setCenterLng(coords[1]);
      if (onFlyToBounds) {
        onFlyToBounds([
          [coords[0] - 0.04, coords[1] - 0.04],
          [coords[0] + 0.04, coords[1] + 0.04],
        ]);
      }
    }
  };

  // Handle changing zone count (1 to 10)
  const handleZoneCountChange = (count: number) => {
    const clamped = Math.max(1, Math.min(10, count));
    setZoneCount(clamped);

    setZonesList((prev) => {
      const newList = [...prev];
      if (clamped > prev.length) {
        for (let i = prev.length; i < clamped; i++) {
          newList.push({
            id: `zone-${Date.now()}-${i + 1}`,
            name: `Zona ${i + 1}`,
            code: `Z-${i + 1}`,
            parcelCount: 3,
          });
        }
      } else {
        newList.length = clamped;
      }
      return newList;
    });
  };

  // Enter Step 3: Start drawing zones one by one
  const handleStartDrawingZones = () => {
    if (!ranchoName.trim()) {
      alert('Por favor ingresa el nombre del rancho.');
      return;
    }
    setCurrentStep(3);
    setDrawingZoneIdx(0);
    setupDrawingZone(0);
  };

  const setupDrawingZone = (zIdx: number) => {
    const targetZone = zonesList[zIdx];
    if (!targetZone) return;

    setIsDrawing(true);
    setDrawingType('zone');
    setDrawingPoints(targetZone.polygon || []);
    setDrawingTitle(`Delimitando Zona ${zIdx + 1} de ${zoneCount}: ${targetZone.name}`);
  };

  // Save polygon for current zone and advance to next zone (or step 4)
  const handleSaveCurrentZonePolygon = () => {
    if (drawingPoints.length < 3) {
      alert('Debes marcar al menos 3 vértices en el mapa satelital para formar el polígono de la zona.');
      return;
    }

    const areaHa = calculatePolygonAreaHa(drawingPoints);
    const { bounds } = getPolygonBoundsAndCenter(drawingPoints);

    const updatedZones = [...zonesList];
    updatedZones[drawingZoneIdx] = {
      ...updatedZones[drawingZoneIdx],
      polygon: drawingPoints,
      bounds,
      areaHa,
    };
    setZonesList(updatedZones);

    // Sync draft zones with map viewer so they stay visible
    if (onUpdateDraftZones) {
      onUpdateDraftZones(
        updatedZones.map((z) => ({
          id: z.id,
          ranchoId: 'DRAFT',
          name: z.name,
          code: z.code,
          targetParcelCount: z.parcelCount,
          polygon: z.polygon,
          bounds: z.bounds,
          areaHa: z.areaHa,
          parcels: [],
        }))
      );
    }

    setDrawingPoints([]);

    // Advance to next zone or to Step 4
    if (drawingZoneIdx + 1 < zoneCount) {
      const nextIdx = drawingZoneIdx + 1;
      setDrawingZoneIdx(nextIdx);
      setupDrawingZone(nextIdx);
    } else {
      // Finished all zones!
      setIsDrawing(false);
      setCurrentStep(4);
    }
  };

  // Apply parcel count to all zones in Step 4
  const handleApplyParcelsCountToAll = (count: number) => {
    setZonesList((prev) => prev.map((z) => ({ ...z, parcelCount: count })));
  };

  // Enter Step 5: Start drawing parcels
  const handleStartDrawingParcels = () => {
    setCurrentStep(5);
    setCurrentDrawingZoneIdx(0);
    setCurrentDrawingParcelIdx(0);
    setupDrawingParcel(0, 0);
  };

  const setupDrawingParcel = (zIdx: number, pIdx: number) => {
    const targetZone = zonesList[zIdx];
    if (!targetZone) return;

    setIsDrawing(true);
    setDrawingType('parcel');
    setDrawingPoints([]);
    setDrawingTitle(`Trazando Parcela ${pIdx + 1} de ${targetZone.parcelCount} en ${targetZone.name}`);
    setCurrentParcelName(`Parcela ${String(pIdx + 1).padStart(2, '0')} - ${targetZone.name}`);

    // Fly map to that zone's boundary so the user can easily see where to draw
    if (targetZone.bounds && onFlyToBounds) {
      onFlyToBounds(targetZone.bounds);
    }
  };

  // Save current parcel in Step 5 and advance to next parcel
  const handleSaveCurrentParcel = () => {
    if (drawingPoints.length < 3) {
      alert('Debes hacer clic en el mapa satelital para trazar al menos 3 vértices de la parcela.');
      return;
    }

    const targetZone = zonesList[currentDrawingZoneIdx];
    if (!targetZone) return;

    const areaHa = calculatePolygonAreaHa(drawingPoints);
    const { bounds, center } = getPolygonBoundsAndCenter(drawingPoints);

    const pName = currentParcelName.trim() || `Parcela ${currentDrawingParcelIdx + 1}`;
    const pId = `par-${Date.now()}-${currentDrawingZoneIdx}-${currentDrawingParcelIdx + 1}`;

    const newParcel: Parcel = {
      id: pId,
      ranchoId: 'DRAFT',
      zoneId: targetZone.id,
      ranchoName,
      zoneName: targetZone.name,
      name: pName,
      cadastralCode: `${targetZone.code}-P${String(currentDrawingParcelIdx + 1).padStart(2, '0')}`,
      location: `${targetZone.name}, ${municipality}`,
      municipality,
      state: 'San Luis Potosí',
      areaHa,
      variety: currentVariety,
      cycle: currentCycle,
      irrigationType: currentIrrigation,
      plantingDate: '2024-01-15',
      estimatedHarvestDate: '2026-03-30',
      expectedYieldTonHa: 105,
      center,
      bounds,
      polygon: drawingPoints,
      avgMetrics: {
        ndvi: 0.66,
        gndvi: 0.56,
        ndwi: 0.26,
        s2rep: 721.0,
        brix: 16.2,
        waterStressStatus: 'optimal',
      },
    };

    const updatedParcels = [...mappedParcels, newParcel];
    setMappedParcels(updatedParcels);

    if (onUpdateDraftParcels) {
      onUpdateDraftParcels(updatedParcels);
    }

    setDrawingPoints([]);

    // Check if more parcels in this zone
    if (currentDrawingParcelIdx + 1 < targetZone.parcelCount) {
      const nextPIdx = currentDrawingParcelIdx + 1;
      setCurrentDrawingParcelIdx(nextPIdx);
      setupDrawingParcel(currentDrawingZoneIdx, nextPIdx);
    } else if (currentDrawingZoneIdx + 1 < zonesList.length) {
      // Move to next zone
      const nextZIdx = currentDrawingZoneIdx + 1;
      setCurrentDrawingZoneIdx(nextZIdx);
      setCurrentDrawingParcelIdx(0);
      setupDrawingParcel(nextZIdx, 0);
    } else {
      // Completed all parcels!
      handleFinalSubmit(updatedParcels);
    }
  };

  // Final Assembly & Submit
  const handleFinalSubmit = (parcelsToSave: Parcel[] = mappedParcels) => {
    if (parcelsToSave.length === 0) {
      alert('Debes delimitar al menos 1 parcela real en el mapa satelital.');
      return;
    }

    const ranchoId = `RANCHO-${Date.now()}`;
    let totalHa = 0;

    // Group parcels by zone
    const completedZones: RanchoZone[] = zonesList.map((z) => {
      const zoneParcels = parcelsToSave
        .filter((p) => p.zoneId === z.id)
        .map((p) => ({
          ...p,
          ranchoId,
          ranchoName,
        }));

      const zoneArea = z.areaHa || zoneParcels.reduce((acc, p) => acc + p.areaHa, 0);
      totalHa += zoneArea;

      return {
        id: z.id,
        ranchoId,
        name: z.name,
        code: z.code,
        targetParcelCount: zoneParcels.length,
        polygon: z.polygon,
        bounds: z.bounds,
        areaHa: Number(zoneArea.toFixed(2)),
        parcels: zoneParcels,
      };
    });

    const newRancho: Rancho = {
      id: ranchoId,
      name: ranchoName || 'Nuevo Rancho Cañero',
      municipality,
      state: 'San Luis Potosí',
      description: `Rancho cañero con ${completedZones.length} zonas y ${parcelsToSave.length} parcelas reales delimitadas en satélite.`,
      center: parcelsToSave[0]?.center || [centerLat, centerLng],
      totalAreaHa: Number(totalHa.toFixed(2)),
      zones: completedZones,
      createdAt: new Date().toISOString().split('T')[0],
    };

    clearWizardDraft();
    setIsDrawing(false);
    setDrawingPoints([]);
    onCompleteRancho(newRancho);
    onClose();
  };

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // RENDER DOCKED GIS DRAWING BAR DURING STEP 3 (ZONES)
  // -------------------------------------------------------------
  if (currentStep === 3) {
    const currentZone = zonesList[drawingZoneIdx];
    const liveArea = drawingPoints.length >= 3 ? calculatePolygonAreaHa(drawingPoints) : 0;

    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-fade-in select-none">
        <div className="bg-slate-900/98 border border-amber-500/80 rounded-2xl shadow-2xl p-4 backdrop-blur-xl text-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <div>
                <span className="font-bold text-white text-xs block">
                  Paso 3 de 5: Delimitando Zona {drawingZoneIdx + 1} de {zoneCount}
                </span>
                <span className="text-amber-300 font-semibold text-sm">
                  {currentZone?.name || `Zona ${drawingZoneIdx + 1}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-center font-mono">
                <span className="text-[10px] text-slate-400 block font-sans">Superficie</span>
                <span className="text-amber-400 font-bold text-xs">{liveArea} ha</span>
              </div>
              <button
                onClick={handleSaveProgress}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                title="Guardar borrador y continuar después"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Borrador</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-snug">
            Haz clic directamente sobre el <strong>satélite de alta resolución</strong> para trazar los linderos de esta zona ({drawingPoints.length} vértices marcados).
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <button
              onClick={() => {
                if (drawingZoneIdx > 0) {
                  setDrawingZoneIdx(drawingZoneIdx - 1);
                  setupDrawingZone(drawingZoneIdx - 1);
                } else {
                  setIsDrawing(false);
                  setCurrentStep(2);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <div className="flex items-center gap-2">
              {drawingPoints.length > 0 && (
                <button
                  onClick={() => setDrawingPoints((prev) => prev.slice(0, -1))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Deshacer punto</span>
                </button>
              )}

              <button
                onClick={handleSaveCurrentZonePolygon}
                disabled={drawingPoints.length < 3}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {drawingZoneIdx + 1 < zoneCount ? `Guardar y Trazar Zona ${drawingZoneIdx + 2}` : 'Finalizar Zonas e Ir a Parcelas'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER DOCKED GIS DRAWING CARD DURING STEP 5 (PARCELS)
  // -------------------------------------------------------------
  if (currentStep === 5) {
    const targetZone = zonesList[currentDrawingZoneIdx];
    const liveArea = drawingPoints.length >= 3 ? calculatePolygonAreaHa(drawingPoints) : 0;
    const totalParcelsExpected = zonesList.reduce((acc, z) => acc + z.parcelCount, 0);

    return (
      <div className="fixed top-16 right-4 z-50 w-full max-w-sm animate-fade-in select-none">
        <div className="bg-slate-900/98 border border-emerald-500/80 rounded-2xl shadow-2xl p-4 backdrop-blur-xl text-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="font-bold text-white text-xs block">
                  Paso 5: Delimitando Parcela Real a Mano
                </span>
                <span className="text-emerald-400 font-semibold text-xs">
                  {targetZone?.name} · Parcela {currentDrawingParcelIdx + 1} de {targetZone?.parcelCount}
                </span>
              </div>
            </div>

            <button
              onClick={handleSaveProgress}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              title="Guardar borrador y salir"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Traza los vértices reales de la parcela haciendo clics sobre el satélite HD.
          </p>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
            <span className="text-xs text-slate-400 font-sans">Superficie Medida:</span>
            <span className="text-emerald-400 font-bold text-sm">{liveArea} ha</span>
          </div>

          {/* Parcel Info Form */}
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-0.5">Nombre de la Parcela *</label>
              <input
                type="text"
                value={currentParcelName}
                onChange={(e) => setCurrentParcelName(e.target.value)}
                placeholder="Ej. Tablón 14 - San Rafael"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 text-[11px] mb-0.5">Variedad de Caña:</label>
                <select
                  value={currentVariety}
                  onChange={(e) => setCurrentVariety(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                >
                  <option value="CP 72-2086">CP 72-2086</option>
                  <option value="Mex 69-290">Mex 69-290</option>
                  <option value="ATEMEX 96-40">ATEMEX 96-40</option>
                  <option value="ITV 92-1424">ITV 92-1424</option>
                  <option value="Mex 79-431">Mex 79-431</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-0.5">Ciclo:</label>
                <select
                  value={currentCycle}
                  onChange={(e) => setCurrentCycle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                >
                  <option value="Plantilla">Plantilla</option>
                  <option value="Soca 1">Soca 1</option>
                  <option value="Soca 2">Soca 2</option>
                  <option value="Resoca 1">Resoca 1</option>
                  <option value="Resoca 2">Resoca 2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-0.5">Régimen de Riego:</label>
              <select
                value={currentIrrigation}
                onChange={(e) => setCurrentIrrigation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
              >
                <option value="Riego de Auxilio">Riego de Auxilio</option>
                <option value="Gravedad / Canal">Gravedad / Canal</option>
                <option value="Temporal Tecnificado">Temporal Tecnificado</option>
                <option value="Goteo / Pivote">Goteo / Pivote</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
            {drawingPoints.length > 0 && (
              <>
                <button
                  onClick={() => setDrawingPoints((prev) => prev.slice(0, -1))}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                  title="Deshacer último punto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Deshacer</span>
                </button>
                <button
                  onClick={() => setDrawingPoints([])}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1"
                  title="Limpiar trazo actual"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              </>
            )}

            <button
              onClick={handleSaveCurrentParcel}
              disabled={drawingPoints.length < 3}
              className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar Parcela ({liveArea} ha)</span>
            </button>
          </div>

          {/* Mapped Parcels in this rancho */}
          {mappedParcels.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Parcelas delimitadas a mano:</span>
                <span className="font-mono text-emerald-400 font-bold">{mappedParcels.length} listas</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {mappedParcels.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded text-[11px] text-slate-300 border border-slate-800"
                  >
                    <span className="truncate max-w-[170px]">{p.name} ({p.variety})</span>
                    <span className="font-mono text-emerald-400">{p.areaHa} ha</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleFinalSubmit()}
                className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-colors mt-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar y Guardar Rancho ({mappedParcels.length} parcelas)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REGULAR DIALOG MODAL FOR STEP 1, STEP 2, AND STEP 4
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-sm">
                Configuración de Rancho, Zonas y Parcelas
              </h3>
              <p className="text-[11px] text-slate-400">
                Paso a paso con delimitación manual en satélite (Cero datos ficticios)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Draft Resume Banner */}
        {existingDraft && (
          <div className="bg-amber-950/40 border-b border-amber-600/40 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Tienes un borrador de <strong>{existingDraft.ranchoName || 'Rancho'}</strong> guardado el {existingDraft.lastSavedAt}.
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleResumeDraft}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors"
              >
                Reanudar
              </button>
              <button
                onClick={handleDiscardDraft}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {/* Stepper Progress Bar */}
        <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[11px]">1</span>
            <span>Rancho</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[11px]">2</span>
            <span>Secciones (1-10)</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[11px]">3</span>
            <span>Trazar Zonas</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center gap-1.5 ${currentStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[11px]">4</span>
            <span>Parcelas</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center gap-1.5 ${currentStep >= 5 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[11px]">5</span>
            <span>Trazar a Mano</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* STEP 1: Rancho Info */}
          {currentStep === 1 && (
            <div className="space-y-4 py-2 max-w-md mx-auto">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  1. Nombre del Rancho y Municipio
                </h4>
                <p className="text-slate-400 text-xs">
                  Ingresa el nombre del rancho para ubicarlo en la región cañera de San Luis Potosí.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Nombre del Rancho *
                  </label>
                  <input
                    type="text"
                    value={ranchoName}
                    onChange={(e) => setRanchoName(e.target.value)}
                    placeholder="Ej. Rancho San José de las Huertas"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Municipio en la Huasteca Potosina
                  </label>
                  <select
                    value={municipality}
                    onChange={(e) => handleMunicipalityChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium"
                  >
                    <option value="Ciudad Valles">Ciudad Valles</option>
                    <option value="Tamasopo">Tamasopo</option>
                    <option value="El Naranjo">El Naranjo</option>
                    <option value="Tamuín">Tamuín</option>
                    <option value="Aquismón">Aquismón</option>
                    <option value="Cárdenas">Cárdenas</option>
                    <option value="Ébano">Ébano</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Choose 1 to 10 Zones */}
          {currentStep === 2 && (
            <div className="space-y-4 py-2 max-w-md mx-auto">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  2. Separar Secciones / Zonas del Rancho
                </h4>
                <p className="text-slate-400 text-xs">
                  Selecciona en cuántas zonas o secciones está dividido el rancho (elige de 1 a 10 zonas):
                </p>
              </div>

              {/* Number buttons 1 to 10 */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Número de Zonas (1 a 10):
                </span>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleZoneCountChange(num)}
                      className={`h-9 rounded-lg font-bold text-xs transition-all ${
                        zoneCount === num
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone names list */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Identificación de cada una de las {zoneCount} zonas:
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {zonesList.map((z, idx) => (
                    <div
                      key={z.id}
                      className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800"
                    >
                      <span className="w-6 h-6 rounded bg-slate-800 text-emerald-400 font-mono flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={z.name}
                        onChange={(e) => {
                          const updated = [...zonesList];
                          updated[idx].name = e.target.value;
                          setZonesList(updated);
                        }}
                        placeholder={`Zona ${idx + 1}`}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
                      />
                      <input
                        type="text"
                        value={z.code}
                        onChange={(e) => {
                          const updated = [...zonesList];
                          updated[idx].code = e.target.value;
                          setZonesList(updated);
                        }}
                        placeholder="Código"
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs uppercase"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Number of Parcels per Zone */}
          {currentStep === 4 && (
            <div className="space-y-4 py-2 max-w-md mx-auto">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  4. Número de Parcelas por Zona
                </h4>
                <p className="text-slate-400 text-xs">
                  Tus {zonesList.length} zonas ya están delimitadas en el mapa. Ahora indica cuántas parcelas vas a trazar a mano dentro de cada zona:
                </p>
              </div>

              {/* Bulk selector shortcut */}
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Asignar a todas:</span>
                <div className="flex items-center gap-1">
                  {[2, 3, 5, 8, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => handleApplyParcelsCountToAll(cnt)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-mono"
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone by zone parcel count */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {zonesList.map((z, idx) => (
                  <div
                    key={z.id}
                    className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800"
                  >
                    <div>
                      <span className="text-white font-medium block">{z.name}</span>
                      <span className="text-[11px] text-amber-400 font-mono">
                        {z.areaHa ? `${z.areaHa} ha delimitadas` : 'Polígono trazado'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">Parcelas:</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={z.parcelCount}
                        onChange={(e) => {
                          const updated = [...zonesList];
                          updated[idx].parcelCount = Math.max(1, parseInt(e.target.value) || 1);
                          setZonesList(updated);
                        }}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveProgress}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            >
              Guardar Borrador
            </button>

            {currentStep === 1 && (
              <button
                onClick={() => {
                  if (!ranchoName.trim()) {
                    alert('Por favor escribe el nombre del rancho.');
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1"
              >
                <span>Siguiente: Secciones (1-10)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={handleStartDrawingZones}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Siguiente: Dibujar Zonas en el Mapa</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={handleStartDrawingParcels}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Siguiente: Dibujar Parcelas a Mano</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
