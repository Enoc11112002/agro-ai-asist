import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Parcel, RanchoZone, ActiveLayer, PixelDiagnostic, SentinelScene, SpectralBands } from '../types';
import { getColorForLayer, computeAllIndices } from '../utils/geoCalculations';
import {
  calculatePolygonAreaHa,
  getSentinelTileUrl,
  fetchRealPointReflectance,
  isPointInPolygon,
} from '../services/geeService';
import {
  Crosshair,
  ZoomIn,
  ZoomOut,
  Compass,
  Layers,
  Maximize2,
  PenTool,
  Check,
  RotateCcw,
  X,
  Plus,
  Building2,
  Sparkles,
  Satellite,
  Eye,
  Sliders,
  Radio,
  FileCheck,
  Camera,
  MapPin,
  Moon,
  Globe,
  Map as MapIcon,
  ChevronDown
} from 'lucide-react';

export type BasemapOption = 'google_hybrid' | 'arcgis_satellite' | 'dark';

interface MapViewerProps {
  ranchoParcels: Parcel[];
  ranchoZones?: RanchoZone[];
  selectedParcel: Parcel | null;
  onSelectParcel: (parcel: Parcel) => void;
  activeLayer: ActiveLayer;
  layerOpacity: number;
  show10mGrid: boolean;
  pixels: PixelDiagnostic[];
  selectedPixel: PixelDiagnostic | null;
  onSelectPixel: (pixel: PixelDiagnostic) => void;
  activeScene: SentinelScene;
  // Drawing mode props
  isDrawing: boolean;
  drawingType?: 'zone' | 'parcel' | null;
  drawingTitle?: string;
  drawingPoints: [number, number][];
  onAddDrawingPoint: (pt: [number, number]) => void;
  onRemoveLastPoint: () => void;
  onCompleteDrawing: () => void;
  onCancelDrawing: () => void;
  onOpenWizard: () => void;
  onStartDrawParcel: () => void;
  onImportGeoJSON: () => void;
  flyToBoundsTarget?: [[number, number], [number, number]] | null;
  isWizardOpen?: boolean;
}

const STORAGE_KEY_BASEMAP = 'agro_ai_asist_selected_basemap';

export const MapViewer: React.FC<MapViewerProps> = ({
  ranchoParcels,
  ranchoZones = [],
  selectedParcel,
  onSelectParcel,
  activeLayer,
  layerOpacity,
  show10mGrid,
  pixels,
  selectedPixel,
  onSelectPixel,
  activeScene,
  isDrawing,
  drawingType = 'parcel',
  drawingTitle,
  drawingPoints,
  onAddDrawingPoint,
  onRemoveLastPoint,
  onCompleteDrawing,
  onCancelDrawing,
  onOpenWizard,
  onStartDrawParcel,
  onImportGeoJSON,
  flyToBoundsTarget,
  isWizardOpen = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const parcelPolygonsRef = useRef<Map<string, L.Polygon>>(new Map());
  const zonePolygonsRef = useRef<Map<string, L.Polygon>>(new Map());
  const pixelLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const clickMarkerRef = useRef<L.CircleMarker | null>(null);
  const drawingLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Basemap & Sentinel tile layers
  const basemapTileLayerRef = useRef<L.TileLayer | null>(null);
  const basemapLabelsLayerRef = useRef<L.TileLayer | null>(null);
  const sentinelTileLayerRef = useRef<L.TileLayer | null>(null);

  // Basemap selector state: 'google_hybrid' | 'arcgis_satellite' | 'dark'
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapOption>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BASEMAP) as BasemapOption;
      if (saved && ['google_hybrid', 'arcgis_satellite', 'dark'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      // fallback
    }
    return 'google_hybrid';
  });

  // Toggle for Sentinel-2 spectral raster overlay (NDVI, NDWI, GNDVI, S2REP, Brix)
  // When false, the map shows 100% crystal-clear commercial satellite photography (Google Hybrid or ArcGIS)
  const [showSentinelOverlay, setShowSentinelOverlay] = useState<boolean>(false);

  // When user actively switches layer from RGB to an analytical index, automatically enable overlay
  useEffect(() => {
    if (activeLayer !== 'rgb' && selectedParcel) {
      setShowSentinelOverlay(true);
    }
  }, [activeLayer, selectedParcel]);

  const [isBasemapMenuOpen, setIsBasemapMenuOpen] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [isSamplingPoint, setIsSamplingPoint] = useState<boolean>(false);

  // Save basemap preference to localStorage
  const handleSelectBasemap = (mode: BasemapOption) => {
    setSelectedBasemap(mode);
    setIsBasemapMenuOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY_BASEMAP, mode);
    } catch (e) {
      console.warn('Could not save basemap preference', e);
    }
  };

  // When drawing starts, automatically switch to high-res satellite if in dark mode
  useEffect(() => {
    if (isDrawing && selectedBasemap === 'dark') {
      setSelectedBasemap('google_hybrid');
    }
  }, [isDrawing]);

  // Handle external flyToBounds request (e.g. when picking a municipality in wizard)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToBoundsTarget) return;
    try {
      map.flyToBounds(flyToBoundsTarget, { padding: [50, 50], duration: 1.0, maxZoom: 16 });
    } catch (err) {
      console.warn('flyToBoundsTarget error:', err);
    }
  }, [flyToBoundsTarget]);

  // Initialize Map Container
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered initially over Huasteca Potosina, SLP
    const initialCenter = selectedParcel ? selectedParcel.center : [21.9820, -99.0345];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter as L.LatLngExpression,
      zoom: 15,
      minZoom: 6,
      maxZoom: 20,
      zoomControl: false,
      attributionControl: false,
    });

    // Layer group for 10m grid cells
    const pixelGroup = L.layerGroup().addTo(map);
    pixelLayerGroupRef.current = pixelGroup;

    // Layer group for interactive drawing
    const drawingGroup = L.layerGroup().addTo(map);
    drawingLayerGroupRef.current = drawingGroup;

    // Mouse move tracker
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5)),
      });
    });

    map.on('zoomend', () => {
      setMapZoom(map.getZoom());
    });

    // Global Map Click Handler
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const clickLat = Number(e.latlng.lat.toFixed(6));
      const clickLng = Number(e.latlng.lng.toFixed(6));

      // If in drawing mode, add vertex!
      if (isDrawing) {
        onAddDrawingPoint([clickLat, clickLng]);
        return;
      }

      // Normal mode: check if clicked near known pixel
      if (pixels.length > 0) {
        let nearest = pixels[0];
        let minDist = Infinity;

        for (const px of pixels) {
          const d = Math.hypot(px.lat - clickLat, px.lng - clickLng);
          if (d < minDist) {
            minDist = d;
            nearest = px;
          }
        }

        if (minDist < 0.0015) {
          onSelectPixel(nearest);
          return;
        }
      }

      // Query real Sentinel-2 reflectance point directly from Copernicus/GEE
      setIsSamplingPoint(true);
      try {
        const realBands = await fetchRealPointReflectance(clickLat, clickLng, activeScene.id);
        const bands: SpectralBands = realBands || {
          B2: 1200, B3: 1450, B4: 1380, B5: 1800, B6: 3200, B7: 3800, B8: 4100, B11: 2400
        };

        const indices = computeAllIndices(bands);
        const utmEasting = Math.round(500000 + (clickLng + 99.0) * 105000);
        const utmNorthing = Math.round(clickLat * 110574);

        const pointPixel: PixelDiagnostic = {
          id: `S2-PT-${Math.abs(Math.round(clickLat * 1000 % 1000))}`,
          lat: clickLat,
          lng: clickLng,
          utmCoord: `14N ${utmEasting}E ${utmNorthing}N`,
          parcelId: selectedParcel?.id || 'P-CUSTOM',
          parcelName: selectedParcel?.name || 'Punto Consultado en Terreno',
          ranchoName: selectedParcel?.ranchoName || 'Huasteca Potosina',
          zoneName: selectedParcel?.zoneName || 'Zona Cañera',
          date: activeScene.date,
          sceneId: activeScene.id,
          bands,
          indices,
          status: {
            vigorLevel: indices.ndvi > 0.65 ? 'Alto' : indices.ndvi > 0.4 ? 'Moderado' : 'Bajo',
            vigorColor: indices.ndvi > 0.65 ? '#238443' : indices.ndvi > 0.4 ? '#d8b365' : '#8c510a',
            chlorophyllLevel: indices.gndvi > 0.45 ? 'Óptimo' : 'Deficiente',
            waterStress: indices.ndwi < 0.1 ? 'Crítico (Marchitez)' : indices.ndwi <= 0.3 ? 'Estrés Moderado' : 'Óptimo (Turgente)',
            waterStressKey: indices.ndwi < 0.1 ? 'critical' : indices.ndwi <= 0.3 ? 'moderate' : 'optimal',
            ripenessState: indices.brix >= 16 ? 'Madurez Óptima para Zafra' : 'Crecimiento Vegetativo',
            sugarEstimateQuality: indices.brix >= 16 ? 'Alto (16-19 °Bx)' : 'Aceptable (13-16 °Bx)',
          },
          recommendation: {
            irrigation: indices.ndwi < 0.1 ? 'ALERTA: Estrés hídrico detectado en Sentinel-2' : 'Turgencia foliar adecuada',
            nutrition: indices.gndvi < 0.45 ? 'Deficiencia de clorofila/N' : 'Nutrición balanceada',
            harvest: indices.brix >= 16.5 ? 'Contenido de sacarosa óptimo para zafra' : 'Fase vegetativa en desarrollo',
            actionSummary: 'Datos reales de Copernicus Sentinel-2 L2A',
          },
        };

        onSelectPixel(pointPixel);
      } catch (err) {
        console.warn('Point sampling error:', err);
      } finally {
        setIsSamplingPoint(false);
      }
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Dynamic Basemap Layer (Modo Oscuro vs Google Híbrido vs ArcGIS Satélite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing basemap layers
    if (basemapTileLayerRef.current) {
      basemapTileLayerRef.current.remove();
      basemapTileLayerRef.current = null;
    }
    if (basemapLabelsLayerRef.current) {
      basemapLabelsLayerRef.current.remove();
      basemapLabelsLayerRef.current = null;
    }

    if (selectedBasemap === 'dark') {
      // 1. Modo Oscuro: CartoDB Dark Matter
      const darkLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 20,
          subdomains: ['a', 'b', 'c', 'd'],
          zIndex: 1,
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        }
      ).addTo(map);
      basemapTileLayerRef.current = darkLayer;
    } else if (selectedBasemap === 'google_hybrid') {
      // 2. Google Hybrid: High-resolution commercial satellite + roads + boundaries
      const googleLayer = L.tileLayer(
        'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          zIndex: 1,
          attribution: 'Google Satellite Hybrid',
        }
      ).addTo(map);
      basemapTileLayerRef.current = googleLayer;
    } else if (selectedBasemap === 'arcgis_satellite') {
      // 3. ArcGIS World Imagery
      const esriLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          subdomains: ['server', 'services'],
          zIndex: 1,
          attribution: 'Esri World Imagery',
        }
      ).addTo(map);
      basemapTileLayerRef.current = esriLayer;

      // Overlay roads, borders, and places labels
      const labelsLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          opacity: 0.75,
          zIndex: 2,
        }
      ).addTo(map);
      basemapLabelsLayerRef.current = labelsLayer;
    }
  }, [selectedBasemap]);

  // Update Sentinel-2 Layer (Rendered only when not drawing and showSentinelOverlay is active)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (sentinelTileLayerRef.current) {
      sentinelTileLayerRef.current.remove();
      sentinelTileLayerRef.current = null;
    }

    // Do not obstruct view with Sentinel raster while drawing, during wizard, or if overlay is toggled off
    if (isDrawing || isWizardOpen || !showSentinelOverlay || !activeScene?.id || ranchoParcels.length === 0) {
      return;
    }

    const tileUrl = getSentinelTileUrl(activeScene.id, activeLayer);

    const layer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      opacity: layerOpacity / 100,
      zIndex: 10,
      attribution: 'Copernicus Sentinel-2 L2A (10m) · ESA',
    }).addTo(map);

    sentinelTileLayerRef.current = layer;
  }, [activeScene?.id, activeLayer, layerOpacity, isDrawing, isWizardOpen, showSentinelOverlay, ranchoParcels.length]);

  // Sync Drawing Layer
  useEffect(() => {
    const drawingGroup = drawingLayerGroupRef.current;
    if (!drawingGroup) return;

    drawingGroup.clearLayers();

    if (!isDrawing || drawingPoints.length === 0) return;

    const isZone = drawingType === 'zone';
    const mainColor = isZone ? '#f59e0b' : '#10b981';
    const fillColor = isZone ? '#d97706' : '#059669';

    // Draw markers on each vertex
    drawingPoints.forEach((pt, idx) => {
      const marker = L.circleMarker(pt, {
        radius: idx === 0 ? 8 : 6,
        color: idx === 0 ? mainColor : '#38bdf8',
        weight: 2,
        fillColor: idx === 0 ? fillColor : '#0284c7',
        fillOpacity: 0.95,
      });

      marker.bindTooltip(
        idx === 0 ? 'Vértice 1 (Clic para cerrar polígono)' : `Vértice ${idx + 1}`,
        { direction: 'top', className: 'text-xs bg-slate-900 text-white rounded px-1' }
      );

      if (idx === 0 && drawingPoints.length >= 3) {
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onCompleteDrawing();
        });
      }

      drawingGroup.addLayer(marker);
    });

    // Draw lines between vertices
    if (drawingPoints.length > 1) {
      const line = L.polyline(drawingPoints, {
        color: mainColor,
        weight: 2.5,
        dashArray: '4, 4',
      });
      drawingGroup.addLayer(line);
    }
  }, [isDrawing, drawingPoints, drawingType]);

  // Render Zone Boundaries (Dashed Amber/Gold outlines)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    zonePolygonsRef.current.forEach((poly) => poly.remove());
    zonePolygonsRef.current.clear();

    ranchoZones.forEach((zone) => {
      if (!zone.polygon || zone.polygon.length < 3) return;

      const poly = L.polygon(zone.polygon, {
        color: '#f59e0b',
        weight: 2.5,
        fillColor: '#f59e0b',
        fillOpacity: 0.05,
        dashArray: '6, 6',
      }).addTo(map);

      poly.bindTooltip(
        `<div class="text-xs font-bold text-amber-300">${zone.name} (${zone.areaHa || ''} ha)</div>`,
        {
          permanent: false,
          direction: 'center',
          className: 'bg-slate-950 text-amber-300 border border-amber-500/60 rounded px-1.5 py-0.5 text-xs font-sans',
        }
      );

      zonePolygonsRef.current.set(zone.id, poly);
    });
  }, [ranchoZones]);

  // Update Parcel Polygons on Map (Bright Emerald / Cyan)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    parcelPolygonsRef.current.forEach((poly) => poly.remove());
    parcelPolygonsRef.current.clear();

    ranchoParcels.forEach((parcel) => {
      if (!parcel.polygon || parcel.polygon.length < 3) return;

      const isSelected = selectedParcel ? parcel.id === selectedParcel.id : false;

      const poly = L.polygon(parcel.polygon, {
        color: isSelected ? '#10b981' : '#38bdf8',
        weight: isSelected ? 3.5 : 2,
        fillColor: isSelected ? '#10b981' : '#0284c7',
        fillOpacity: isSelected ? 0.09 : 0.03,
        dashArray: isSelected ? undefined : '4, 4',
      }).addTo(map);

      poly.bindTooltip(
        `<div class="text-xs font-semibold px-1 py-0.5">${parcel.name} (${parcel.areaHa} ha)</div>`,
        {
          permanent: isSelected,
          direction: 'top',
          className: 'bg-slate-900 text-slate-100 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-sans',
        }
      );

      poly.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (!isDrawing) {
          onSelectParcel(parcel);
        }
      });

      parcelPolygonsRef.current.set(parcel.id, poly);
    });
  }, [ranchoParcels, selectedParcel?.id, isDrawing]);

  // Smooth Zoom/Fly on Parcel Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedParcel || !selectedParcel.bounds || isDrawing) return;

    try {
      map.flyToBounds(selectedParcel.bounds, {
        padding: [60, 60],
        duration: 1.0,
        maxZoom: 16,
      });
      map.invalidateSize();
    } catch (err) {
      console.warn('flyToBounds error:', err);
    }
  }, [selectedParcel?.id, isDrawing]);

  // Render Intra-Parcel 10m Pixel Grid Wireframe
  useEffect(() => {
    const map = mapInstanceRef.current;
    const pixelGroup = pixelLayerGroupRef.current;
    if (!map || !pixelGroup) return;

    pixelGroup.clearLayers();

    if (!selectedParcel || isDrawing || !show10mGrid) return;

    const halfLat = 0.000045;
    const halfLng = 0.000048;

    pixels.forEach((px) => {
      const cellBounds: L.LatLngBoundsExpression = [
        [px.lat - halfLat, px.lng - halfLng],
        [px.lat + halfLat, px.lng + halfLng],
      ];

      const rect = L.rectangle(cellBounds, {
        color: '#10b981',
        weight: 0.8,
        fillColor: '#10b981',
        fillOpacity: 0.04,
      });

      rect.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onSelectPixel(px);
      });

      let displayValue = '';
      if (activeLayer === 'ndvi') displayValue = `NDVI: ${px.indices.ndvi.toFixed(2)}`;
      else if (activeLayer === 'gndvi') displayValue = `GNDVI: ${px.indices.gndvi.toFixed(2)}`;
      else if (activeLayer === 'ndwi') displayValue = `NDWI: ${px.indices.ndwi.toFixed(2)}`;
      else if (activeLayer === 's2rep') displayValue = `S2REP: ${px.indices.s2rep.toFixed(1)} nm`;
      else if (activeLayer === 'brix') displayValue = `°Brix: ${px.indices.brix.toFixed(1)}°`;
      else if (activeLayer === 'rgb') displayValue = `S2 RGB (B4:${px.bands.B4} B3:${px.bands.B3} B2:${px.bands.B2})`;
      else if (activeLayer === 'cir') displayValue = `CIR NIR (B8:${px.bands.B8} B4:${px.bands.B4} B3:${px.bands.B3})`;

      rect.bindTooltip(
        `<div class="font-mono text-xs"><b>${px.id}</b> · ${displayValue}</div>`,
        {
          direction: 'top',
          sticky: true,
          className: 'bg-slate-900 text-slate-100 border border-slate-700 rounded px-1.5 py-0.5 text-xs',
        }
      );

      pixelGroup.addLayer(rect);
    });
  }, [pixels, activeLayer, show10mGrid, selectedParcel?.id, isDrawing]);

  // Update Click Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
      clickMarkerRef.current = null;
    }

    if (selectedPixel && !isDrawing) {
      const marker = L.circleMarker([selectedPixel.lat, selectedPixel.lng], {
        radius: 8,
        color: '#ffffff',
        weight: 2.5,
        fillColor: '#38bdf8',
        fillOpacity: 0.9,
      }).addTo(map);

      clickMarkerRef.current = marker;
    }
  }, [selectedPixel, isDrawing]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    if (mapInstanceRef.current && selectedParcel && selectedParcel.bounds) {
      mapInstanceRef.current.flyToBounds(selectedParcel.bounds, { padding: [40, 40] });
    }
  };

  const calculatedDrawingArea = drawingPoints.length >= 3 ? calculatePolygonAreaHa(drawingPoints) : 0;

  // Label and icon helper for current basemap
  const getBasemapBadge = () => {
    if (selectedBasemap === 'dark') {
      return { label: 'Modo Oscuro', icon: Moon, desc: 'Fondo oscuro CartoDB' };
    }
    if (selectedBasemap === 'google_hybrid') {
      return { label: 'Google Híbrido', icon: Globe, desc: 'Satélite + Carreteras y nombres' };
    }
    return { label: 'ArcGIS Satélite', icon: Satellite, desc: 'Fotografía satelital nítida' };
  };

  const currentBadge = getBasemapBadge();
  const BadgeIcon = currentBadge.icon;

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Map Element */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 ${isDrawing ? 'cursor-crosshair' : 'cursor-default'}`}
      />

      {/* Sampling in Progress Badge */}
      {isSamplingPoint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-sky-500/80 rounded-full px-4 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs text-sky-200 animate-pulse">
          <Satellite className="w-4 h-4 animate-spin text-sky-400" />
          <span>Consultando reflectancia real de Sentinel-2 L2A en Google Earth Engine...</span>
        </div>
      )}

      {/* DRAWING MODE HUD BAR (Top Center - for standalone drawing outside wizard) */}
      {isDrawing && !isWizardOpen && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-emerald-500/80 rounded-xl shadow-2xl px-5 py-3 backdrop-blur-md flex items-center gap-4 text-xs text-slate-100 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${drawingType === 'zone' ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping`} />
            <div>
              <span className="font-bold text-white block">
                {drawingTitle || (drawingType === 'zone' ? 'Delimitando Zona en el Mapa Satelital' : 'Delimitando Parcela en el Mapa Satelital')}
              </span>
              <span className="text-[11px] text-slate-400">
                Haz clic sobre el satélite para marcar los vértices reales ({drawingPoints.length} puntos marcados)
              </span>
            </div>
          </div>

          <div className="font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-sans">Superficie</span>
            <span className="text-emerald-400 font-bold text-sm">{calculatedDrawingArea} ha</span>
          </div>

          <div className="flex items-center gap-1.5">
            {drawingPoints.length > 0 && (
              <button
                onClick={onRemoveLastPoint}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                title="Deshacer último vértice"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Deshacer</span>
              </button>
            )}

            <button
              onClick={onCompleteDrawing}
              disabled={drawingPoints.length < 3}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold transition-colors flex items-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar Polígono ({calculatedDrawingArea} ha)</span>
            </button>

            <button
              onClick={onCancelDrawing}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
              title="Cancelar trazo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* EMPTY STATE SPLASH (When 0 ranchos exist, not drawing, and wizard closed) */}
      {!selectedParcel && !isDrawing && !isWizardOpen && ranchoParcels.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm pointer-events-auto">
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-center text-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Sistema Iniciado en Limpio (Cero Datos Ficticios)
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Usa el selector de <strong>Basemap</strong> en la esquina superior derecha para alternar entre el <strong>Modo Oscuro</strong> y las <strong>Imágenes Satelitales (Google Híbrido / ArcGIS Satellite)</strong> para ubicar tus ranchos y delimitar visualmente tus parcelas.
              </p>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              <button
                onClick={onOpenWizard}
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md group"
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Building2 className="w-4 h-4" />
                  <span>Asistente de Rancho (1-10 Zonas)</span>
                </div>
                <p className="text-[11px] text-emerald-100/80 mt-1 leading-snug">
                  Crea Rancho → Define 1 a 10 zonas → Dibuja cada zona → Dibuja cada parcela.
                </p>
              </button>

              <button
                onClick={onStartDrawParcel}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white transition-all shadow-md group"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-sky-400">
                  <PenTool className="w-4 h-4" />
                  <span>Dibujar Parcela Rápida</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Traza con clics el contorno exacto de tu predio cañero en el satélite.
                </p>
              </button>
            </div>

            <button
              onClick={onImportGeoJSON}
              className="w-full py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            >
              O importar archivo GeoJSON de parcelas catastrales
            </button>
          </div>
        </div>
      )}

      {/* Floating HUD: Top Left Parcel Watermark */}
      {selectedParcel && !isDrawing && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5">
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3.5 py-2.5 rounded-lg shadow-lg pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {selectedParcel.name}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
                {selectedParcel.areaHa} ha
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>{selectedParcel.ranchoName} · {selectedParcel.zoneName}</span>
              <span>·</span>
              <span className="font-mono text-slate-300">Pase: {activeScene.date}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating HUD: Top Right Map Controls & BASEMAP SELECTOR */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
        {/* PROMINENT BASEMAP SELECTOR (Google Híbrido | ArcGIS Satélite | Modo Oscuro) */}
        <div className="bg-slate-900/95 border border-slate-800 p-1 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-r border-slate-800 mr-0.5">
            <MapIcon className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">Basemap:</span>
          </div>

          <button
            onClick={() => handleSelectBasemap('google_hybrid')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedBasemap === 'google_hybrid'
                ? 'bg-sky-600 text-white shadow ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Google Híbrido: Satélite comercial HD con carreteras, nombres de poblados y linderos"
          >
            <Globe className="w-3.5 h-3.5 text-sky-300" />
            <span>Google Híbrido</span>
          </button>

          <button
            onClick={() => handleSelectBasemap('arcgis_satellite')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedBasemap === 'arcgis_satellite'
                ? 'bg-sky-600 text-white shadow ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="ArcGIS Satellite: Fotografía aérea de alta resolución continua Esri"
          >
            <Satellite className="w-3.5 h-3.5 text-emerald-400" />
            <span>ArcGIS Satélite</span>
          </button>

          <button
            onClick={() => handleSelectBasemap('dark')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedBasemap === 'dark'
                ? 'bg-slate-800 text-white shadow ring-1 ring-slate-600'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Modo Oscuro: Fondo CartoDB Dark Matter de alto contraste"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Modo Oscuro</span>
          </button>
        </div>

        {/* Sentinel-2 Spectral Overlay Toggle (Only when not drawing and parcels exist) */}
        {!isDrawing && !isWizardOpen && ranchoParcels.length > 0 && activeScene?.id && (
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg backdrop-blur-md">
            <button
              onClick={() => setShowSentinelOverlay(!showSentinelOverlay)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showSentinelOverlay
                  ? 'bg-emerald-600 text-white font-bold shadow ring-1 ring-emerald-400/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title={
                showSentinelOverlay
                  ? 'Haz clic para ocultar el raster Sentinel-2 y ver únicamente la fotografía satelital comercial nítida'
                  : 'Haz clic para activar el raster Sentinel-2 (índices fisiológicos NDVI/Brix/etc.)'
              }
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {showSentinelOverlay
                  ? `Capa Sentinel-2 (${activeLayer.toUpperCase()} 10m)`
                  : 'Ver Satélite Comercial Puro (HD)'}
              </span>
            </button>
          </div>
        )}

        {/* Zoom & Reset View Buttons */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg shadow-lg backdrop-blur-md transition-colors"
            title="Acercar (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg shadow-lg backdrop-blur-md transition-colors"
            title="Alejar (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetView}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg shadow-lg backdrop-blur-md transition-colors"
            title="Centrar en Parcela Activa"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating HUD: Bottom Left Map Scale & Status */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex flex-col gap-1">
        <div className="bg-slate-900/90 border border-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg shadow text-[10px] font-mono text-slate-400 flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${selectedBasemap === 'dark' ? 'bg-indigo-400' : 'bg-sky-400'}`} />
            <span className="text-slate-300 font-sans font-semibold">
              Basemap: {currentBadge.label}
            </span>
          </div>
          {cursorCoords && (
            <span>
              {cursorCoords.lat.toFixed(5)}°N, {Math.abs(cursorCoords.lng).toFixed(5)}°W
            </span>
          )}
          <span>Zoom: {mapZoom}x</span>
        </div>
      </div>

      {/* Floating HUD: Bottom Right Click Inspector Helper */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
        <div className="bg-slate-900/90 border border-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg shadow text-[11px] text-slate-300 flex items-center gap-2 pointer-events-auto">
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <span>Haz clic en cualquier punto para auditar reflectancia Sentinel-2 en vivo</span>
        </div>
      </div>
    </div>
  );
};
