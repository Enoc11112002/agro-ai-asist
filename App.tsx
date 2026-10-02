import React, { useState, useMemo, useEffect } from 'react';
import { Rancho, RanchoZone, Parcel, ActiveLayer, PixelDiagnostic, SentinelScene } from './types';
import { getSavedRanchos, saveRanchos } from './data/ranchos';
import { findNearestSentinelScene } from './data/sentinelScenes';
import {
  queryGEESentinelScene,
  extractGEEParcelPixels,
  calculatePolygonAreaHa,
  getPolygonBoundsAndCenter
} from './services/geeService';
import { NavigationSidebar } from './components/NavigationSidebar';
import { LayerControlPanel } from './components/LayerControlPanel';
import { TemporalSearch } from './components/TemporalSearch';
import { MapViewer } from './components/MapViewer';
import { PixelInspectorModal } from './components/PixelInspectorModal';
import { GEEIntegrationModal } from './components/GEEIntegrationModal';
import { GEEVerificationModal } from './components/GEEVerificationModal';
import { ParcelSummaryModal } from './components/ParcelSummaryModal';
import { RanchoWizardModal } from './components/RanchoWizardModal';
import { GEEImportModal } from './components/GEEImportModal';
import {
  Layers,
  Calendar,
  Database,
  FileCheck,
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  Building2,
  Plus,
  PenTool,
  Upload,
  Satellite,
  HelpCircle,
  Eye,
  Camera
} from 'lucide-react';

export default function App() {
  // Ranchos & Parcels State (System starts CLEAN with zero fake parcels)
  const [ranchos, setRanchos] = useState<Rancho[]>(() => getSavedRanchos());
  const [selectedRanchoId, setSelectedRanchoId] = useState<string>(() => ranchos[0]?.id || '');

  const selectedRancho = useMemo(() => {
    return ranchos.find((r) => r.id === selectedRanchoId) || ranchos[0] || null;
  }, [ranchos, selectedRanchoId]);

  // Extract all parcels in the active rancho
  const activeRanchoParcels = useMemo(() => {
    if (!selectedRancho) return [];
    const list: Parcel[] = [];
    selectedRancho.zones.forEach((z) => {
      z.parcels.forEach((p) => list.push(p));
    });
    return list;
  }, [selectedRancho]);

  // Selected Parcel State
  const [selectedParcelId, setSelectedParcelId] = useState<string>(() => {
    return activeRanchoParcels[0]?.id || '';
  });

  const selectedParcel = useMemo(() => {
    const found = activeRanchoParcels.find((p) => p.id === selectedParcelId);
    return found || activeRanchoParcels[0] || null;
  }, [activeRanchoParcels, selectedParcelId]);

  // Layer States
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('rgb');
  const [layerOpacity, setLayerOpacity] = useState<number>(85);
  const [show10mGrid, setShow10mGrid] = useState<boolean>(true);

  // Temporal search state
  const [targetDate, setTargetDate] = useState<string>('2024-03-31');
  const [activeScene, setActiveScene] = useState<SentinelScene>(() => {
    const res = findNearestSentinelScene(targetDate);
    return res.closestScene;
  });

  // Dynamic 10x10m Pixel Diagnostics from GEE
  const [pixels, setPixels] = useState<PixelDiagnostic[]>([]);
  const [isLoadingGEE, setIsLoadingGEE] = useState<boolean>(false);

  // Interactive Drawing State
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawingType, setDrawingType] = useState<'zone' | 'parcel' | null>(null);
  const [drawingTitle, setDrawingTitle] = useState<string>('');
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [flyToBoundsTarget, setFlyToBoundsTarget] = useState<[[number, number], [number, number]] | null>(null);

  // Draft zones & parcels for live map visualization while wizard is running
  const [draftZones, setDraftZones] = useState<RanchoZone[]>([]);
  const [draftParcels, setDraftParcels] = useState<Parcel[]>([]);

  // Modals & Panels UI
  const [selectedPixel, setSelectedPixel] = useState<PixelDiagnostic | null>(null);
  const [isGEEModalOpen, setIsGEEModalOpen] = useState<boolean>(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeFloatingTab, setActiveFloatingTab] = useState<'layers' | 'temporal' | null>(null);

  // Query real Sentinel-2 scene and pixels when selectedParcel or targetDate changes
  useEffect(() => {
    if (!selectedParcel || isWizardOpen) {
      if (!isWizardOpen) setPixels([]);
      return;
    }

    let isMounted = true;
    setIsLoadingGEE(true);

    const queryData = async () => {
      try {
        const scene = await queryGEESentinelScene(selectedParcel.bounds, targetDate);
        if (!isMounted) return;
        setActiveScene(scene);

        const result = await extractGEEParcelPixels(selectedParcel, scene);
        if (!isMounted) return;

        setPixels(result.pixels);

        setRanchos((prev) =>
          prev.map((r) => {
            if (r.id !== selectedParcel.ranchoId) return r;
            return {
              ...r,
              zones: r.zones.map((z) => {
                if (z.id !== selectedParcel.zoneId) return z;
                return {
                  ...z,
                  parcels: z.parcels.map((p) => {
                    if (p.id !== selectedParcel.id) return p;
                    return {
                      ...p,
                      avgMetrics: result.avgMetrics,
                    };
                  }),
                };
              }),
            };
          })
        );
      } catch (err) {
        console.error('Error querying GEE Sentinel-2 data:', err);
      } finally {
        if (isMounted) setIsLoadingGEE(false);
      }
    };

    queryData();

    return () => {
      isMounted = false;
    };
  }, [selectedParcel?.id, targetDate, isWizardOpen]);

  // Persist ranchos to localStorage
  useEffect(() => {
    saveRanchos(ranchos);
  }, [ranchos]);

  // Handlers for Rancho and Parcel selection & management
  const handleSelectRancho = (rancho: Rancho) => {
    setSelectedRanchoId(rancho.id);
    const firstP = rancho.zones[0]?.parcels[0];
    if (firstP) {
      setSelectedParcelId(firstP.id);
    }
    setSelectedPixel(null);
  };

  const handleSelectParcel = (parcel: Parcel) => {
    setSelectedParcelId(parcel.id);
    setSelectedPixel(null);
  };

  const handleCompleteNewRancho = (newRancho: Rancho) => {
    setRanchos((prev) => {
      const updated = [newRancho, ...prev];
      saveRanchos(updated);
      return updated;
    });
    setSelectedRanchoId(newRancho.id);
    const firstP = newRancho.zones[0]?.parcels[0];
    if (firstP) {
      setSelectedParcelId(firstP.id);
      setFlyToBoundsTarget(firstP.bounds);
    }
    setDraftZones([]);
    setDraftParcels([]);
    setIsDrawing(false);
    setSelectedPixel(null);
  };

  const handleDeleteRancho = (ranchoId: string) => {
    setRanchos((prev) => {
      const remaining = prev.filter((r) => r.id !== ranchoId);
      if (remaining.length > 0) {
        setSelectedRanchoId(remaining[0].id);
        const firstP = remaining[0].zones[0]?.parcels[0];
        if (firstP) setSelectedParcelId(firstP.id);
      } else {
        setSelectedRanchoId('');
        setSelectedParcelId('');
      }
      return remaining;
    });
  };

  const handleDeleteZone = (ranchoId: string, zoneId: string) => {
    setRanchos((prev) =>
      prev.map((r) => {
        if (r.id !== ranchoId) return r;
        const updatedZones = r.zones.filter((z) => z.id !== zoneId);
        return {
          ...r,
          zones: updatedZones,
        };
      })
    );
  };

  const handleDeleteParcel = (parcelId: string) => {
    setRanchos((prev) =>
      prev.map((r) => {
        const updatedZones = r.zones.map((z) => ({
          ...z,
          parcels: z.parcels.filter((p) => p.id !== parcelId),
        }));
        return {
          ...r,
          zones: updatedZones,
        };
      })
    );
  };

  // Standalone Drawing Handlers
  const handleStartDrawParcel = () => {
    setIsDrawing(true);
    setDrawingType('parcel');
    setDrawingTitle('Trazando Parcela Rápida en el Satélite HD');
    setDrawingPoints([]);
  };

  const handleAddDrawingPoint = (pt: [number, number]) => {
    setDrawingPoints((prev) => [...prev, pt]);
  };

  const handleRemoveLastPoint = () => {
    setDrawingPoints((prev) => prev.slice(0, -1));
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setDrawingType(null);
    setDrawingTitle('');
    setDrawingPoints([]);
  };

  const handleCompleteDrawing = () => {
    if (drawingPoints.length < 3) return;

    const areaHa = calculatePolygonAreaHa(drawingPoints);
    const { bounds, center } = getPolygonBoundsAndCenter(drawingPoints);

    const parcelName = prompt('Ingresa el nombre para esta parcela:', `Tablón ${Date.now().toString().slice(-4)}`);
    if (!parcelName) return;

    let targetRancho = selectedRancho;
    let targetZone = selectedRancho?.zones[0];

    if (!targetRancho) {
      const ranchoId = `RANCHO-${Date.now()}`;
      const zoneId = `ZONE-${Date.now()}-1`;

      const newParcel: Parcel = {
        id: `par-${Date.now()}`,
        ranchoId,
        zoneId,
        ranchoName: 'Rancho Cañero Huasteca',
        zoneName: 'Zona Principal',
        name: parcelName,
        cadastralCode: `SLP-${Math.round(center[0] * 100)}-${Math.round(Math.abs(center[1]) * 100)}`,
        location: 'Huasteca Potosina, SLP',
        municipality: 'Ciudad Valles',
        state: 'San Luis Potosí',
        areaHa,
        variety: 'CP 72-2086',
        cycle: 'Soca 1',
        irrigationType: 'Riego de Auxilio',
        plantingDate: '2024-01-15',
        estimatedHarvestDate: '2026-03-30',
        expectedYieldTonHa: 105,
        center,
        bounds,
        polygon: drawingPoints,
        avgMetrics: {
          ndvi: 0.65,
          gndvi: 0.55,
          ndwi: 0.25,
          s2rep: 720.0,
          brix: 16.0,
          waterStressStatus: 'optimal',
        },
      };

      const newZone: RanchoZone = {
        id: zoneId,
        ranchoId,
        name: 'Zona Principal',
        code: 'Z-01',
        targetParcelCount: 1,
        parcels: [newParcel],
      };

      const newRancho: Rancho = {
        id: ranchoId,
        name: 'Rancho Cañero Huasteca',
        municipality: 'Ciudad Valles',
        state: 'San Luis Potosí',
        description: 'Rancho delimitado interactivamente con datos de Sentinel-2 L2A',
        center,
        totalAreaHa: areaHa,
        zones: [newZone],
        createdAt: new Date().toISOString().split('T')[0],
      };

      handleCompleteNewRancho(newRancho);
    } else {
      if (!targetZone) {
        targetZone = {
          id: `ZONE-${Date.now()}-1`,
          ranchoId: targetRancho.id,
          name: 'Zona 1',
          code: 'Z-01',
          targetParcelCount: 1,
          parcels: [],
        };
      }

      const pId = `par-${Date.now()}`;
      const newParcel: Parcel = {
        id: pId,
        ranchoId: targetRancho.id,
        zoneId: targetZone.id,
        ranchoName: targetRancho.name,
        zoneName: targetZone.name,
        name: parcelName,
        cadastralCode: `${targetZone.code}-P${targetZone.parcels.length + 1}`,
        location: `${targetRancho.name}, ${targetRancho.municipality}`,
        municipality: targetRancho.municipality,
        state: 'San Luis Potosí',
        areaHa,
        variety: 'CP 72-2086',
        cycle: 'Plantilla',
        irrigationType: 'Riego de Auxilio',
        plantingDate: '2024-01-15',
        estimatedHarvestDate: '2026-03-30',
        expectedYieldTonHa: 100,
        center,
        bounds,
        polygon: drawingPoints,
        avgMetrics: {
          ndvi: 0.65,
          gndvi: 0.55,
          ndwi: 0.25,
          s2rep: 720.0,
          brix: 16.0,
          waterStressStatus: 'optimal',
        },
      };

      setRanchos((prev) =>
        prev.map((r) => {
          if (r.id !== targetRancho!.id) return r;
          const updatedZones = r.zones.map((z) => {
            if (z.id !== targetZone!.id) return z;
            return {
              ...z,
              parcels: [...z.parcels, newParcel],
            };
          });
          return {
            ...r,
            zones: updatedZones,
            totalAreaHa: Number((r.totalAreaHa + areaHa).toFixed(2)),
          };
        })
      );

      setSelectedParcelId(pId);
    }

    setIsDrawing(false);
    setDrawingType(null);
    setDrawingTitle('');
    setDrawingPoints([]);
  };

  // Close modals on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPixel(null);
        setIsGEEModalOpen(false);
        setIsVerificationModalOpen(false);
        setIsSummaryModalOpen(false);
        setIsImportModalOpen(false);
        if (isDrawing && !isWizardOpen) handleCancelDrawing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, isWizardOpen]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 
        TOP BAR CONTRACT:
        Zone 1: Single text wordmark
        Zone 2: 4-6 clean single-line text navigation links / actions (NO upper layer tabs as requested)
        Zone 3: 1-2 primary actions
      */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isSidebarOpen ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span>Agro AI-Asist</span>
            <span className="text-xs font-normal text-emerald-400 font-mono hidden sm:inline">
              · Huasteca Potosina
            </span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-300">
          <button
            onClick={() => {
              setIsDrawing(false);
              setDrawingPoints([]);
              setIsWizardOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Rancho (Rancho → 1 a 10 Zonas → Parcelas)</span>
          </button>

          <button
            onClick={handleStartDrawParcel}
            className="flex items-center gap-1.5 text-slate-300 hover:text-sky-400 transition-colors whitespace-nowrap"
          >
            <PenTool className="w-3.5 h-3.5 text-sky-400" />
            <span>Dibujar Parcela Rápida</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Importar GeoJSON</span>
          </button>

          <button
            onClick={() => setIsVerificationModalOpen(true)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>¿Cómo Verificar Datos GEE?</span>
          </button>

          {selectedParcel && (
            <button
              onClick={() => setIsSummaryModalOpen(true)}
              className="text-slate-300 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ficha del Predio</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {isLoadingGEE && (
            <div className="flex items-center gap-1.5 text-xs text-sky-300 font-mono bg-sky-950/60 border border-sky-800/60 px-2.5 py-1 rounded-md">
              <Satellite className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span className="hidden sm:inline">Consultando GEE...</span>
            </div>
          )}

          <button
            onClick={() => setIsVerificationModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Auditoría científica y verificación de autenticidad satelital"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verificar GEE</span>
          </button>

          <button
            onClick={() => setIsGEEModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Conectar GEE</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation Sidebar (Rancho -> Zonas -> Parcelas) */}
        {isSidebarOpen && (
          <NavigationSidebar
            ranchos={ranchos}
            selectedRancho={selectedRancho}
            onSelectRancho={handleSelectRancho}
            selectedParcel={selectedParcel}
            onSelectParcel={handleSelectParcel}
            onOpenWizard={() => {
              setIsDrawing(false);
              setDrawingPoints([]);
              setIsWizardOpen(true);
            }}
            onStartDrawParcel={handleStartDrawParcel}
            onImportGeoJSON={() => setIsImportModalOpen(true)}
            onDeleteRancho={handleDeleteRancho}
            onDeleteZone={handleDeleteZone}
            onDeleteParcel={handleDeleteParcel}
          />
        )}

        {/* Central Map Canvas & GIS Layer Stack */}
        <main className="flex-1 relative h-full w-full bg-slate-950 overflow-hidden">
          <MapViewer
            ranchoParcels={isWizardOpen && draftParcels.length > 0 ? draftParcels : activeRanchoParcels}
            ranchoZones={isWizardOpen && draftZones.length > 0 ? draftZones : (selectedRancho?.zones || [])}
            selectedParcel={selectedParcel}
            onSelectParcel={handleSelectParcel}
            activeLayer={activeLayer}
            layerOpacity={layerOpacity}
            show10mGrid={show10mGrid}
            pixels={pixels}
            selectedPixel={selectedPixel}
            onSelectPixel={setSelectedPixel}
            activeScene={activeScene}
            isDrawing={isDrawing}
            drawingType={drawingType}
            drawingTitle={drawingTitle}
            drawingPoints={drawingPoints}
            onAddDrawingPoint={handleAddDrawingPoint}
            onRemoveLastPoint={handleRemoveLastPoint}
            onCompleteDrawing={handleCompleteDrawing}
            onCancelDrawing={handleCancelDrawing}
            onOpenWizard={() => {
              setIsDrawing(false);
              setDrawingPoints([]);
              setIsWizardOpen(true);
            }}
            onStartDrawParcel={handleStartDrawParcel}
            onImportGeoJSON={() => setIsImportModalOpen(true)}
            flyToBoundsTarget={flyToBoundsTarget}
            isWizardOpen={isWizardOpen}
          />

          {/* Floating Widget: Single Layer & Temporal Controller (Next to the date) */}
          <div className="absolute top-4 left-4 sm:left-auto sm:right-96 z-20 flex flex-col gap-2 max-w-sm">
            <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1.5">
              <button
                onClick={() => setActiveFloatingTab(activeFloatingTab === 'layers' ? null : 'layers')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFloatingTab === 'layers'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Capas Satelitales ({activeLayer.toUpperCase()})</span>
              </button>

              <button
                onClick={() => setActiveFloatingTab(activeFloatingTab === 'temporal' ? null : 'temporal')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFloatingTab === 'temporal'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{activeScene.date}</span>
              </button>
            </div>

            {/* Floating Drawer 1: Layer Selector & Scientific Ramp */}
            {activeFloatingTab === 'layers' && (
              <div className="bg-slate-900/98 border border-slate-800 rounded-2xl shadow-2xl p-4 backdrop-blur-xl animate-fade-in w-80 sm:w-96 text-xs max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Selector de Capas Sentinel-2</span>
                  </span>
                  <button
                    onClick={() => setActiveFloatingTab(null)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <LayerControlPanel
                  activeLayer={activeLayer}
                  onLayerChange={setActiveLayer}
                  layerOpacity={layerOpacity}
                  onOpacityChange={setLayerOpacity}
                  showGrid={show10mGrid}
                  onToggleGrid={() => setShow10mGrid(!show10mGrid)}
                />
              </div>
            )}

            {/* Floating Drawer 2: Temporal Proximity Search */}
            {activeFloatingTab === 'temporal' && (
              <div className="bg-slate-900/98 border border-slate-800 rounded-2xl shadow-2xl p-4 backdrop-blur-xl animate-fade-in w-80 sm:w-96 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Buscador Temporal de Pases</span>
                  </span>
                  <button
                    onClick={() => setActiveFloatingTab(null)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <TemporalSearch
                  targetDate={targetDate}
                  onDateChange={setTargetDate}
                  currentScene={activeScene}
                  onSelectScene={setActiveScene}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Interactive Agronomic Report Modal on Pixel Click */}
      {selectedPixel && (
        <PixelInspectorModal
          pixel={selectedPixel}
          onClose={() => setSelectedPixel(null)}
        />
      )}

      {/* Guided Rancho -> 1-10 Zonas -> Parcelas Wizard */}
      <RanchoWizardModal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setIsDrawing(false);
          setDrawingType(null);
          setDrawingTitle('');
          setDrawingPoints([]);
        }}
        onCompleteRancho={handleCompleteNewRancho}
        isDrawing={isDrawing}
        setIsDrawing={setIsDrawing}
        drawingPoints={drawingPoints}
        setDrawingPoints={setDrawingPoints}
        drawingType={drawingType}
        setDrawingType={setDrawingType}
        drawingTitle={drawingTitle}
        setDrawingTitle={setDrawingTitle}
        onFlyToBounds={(bounds) => setFlyToBoundsTarget(bounds)}
        onUpdateDraftZones={setDraftZones}
        onUpdateDraftParcels={setDraftParcels}
      />

      {/* GeoJSON Import Modal */}
      <GEEImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportRancho={handleCompleteNewRancho}
      />

      {/* GEE Authenticity & Real-Time Verification Modal */}
      <GEEVerificationModal
        isOpen={isVerificationModalOpen}
        activeParcel={selectedParcel}
        activeScene={activeScene}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* GEE Code Connector & Export Hub */}
      <GEEIntegrationModal
        isOpen={isGEEModalOpen}
        activeParcel={selectedParcel}
        parcels={activeRanchoParcels}
        onClose={() => setIsGEEModalOpen(false)}
      />

      {/* Executive Parcel Summary Card */}
      {selectedParcel && (
        <ParcelSummaryModal
          isOpen={isSummaryModalOpen}
          parcel={selectedParcel}
          pixels={pixels}
          scene={activeScene}
          onClose={() => setIsSummaryModalOpen(false)}
        />
      )}
    </div>
  );
}
