export interface Parcel {
  id: string;
  ranchoId: string;
  zoneId: string;
  ranchoName: string;
  zoneName: string;
  name: string;
  cadastralCode: string;
  location: string;
  municipality: string;
  state: 'San Luis Potosí';
  areaHa: number;
  variety: string;
  cycle: 'Plantilla' | 'Soca 1' | 'Soca 2' | 'Resoca 1' | string;
  irrigationType: 'Riego de Auxilio' | 'Temporal Tecnificado' | 'Gravedad / Canal' | 'Goteo / Pivote' | string;
  plantingDate: string;
  estimatedHarvestDate: string;
  expectedYieldTonHa: number;
  center: [number, number]; // [lat, lng]
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  polygon: [number, number][]; // coordinates [lat, lng]
  avgMetrics: {
    ndvi: number;
    gndvi: number;
    ndwi: number;
    s2rep: number;
    brix: number;
    waterStressStatus: 'optimal' | 'moderate' | 'critical';
  };
}

export interface RanchoZone {
  id: string;
  ranchoId: string;
  name: string;
  code: string;
  targetParcelCount: number;
  polygon?: [number, number][];
  bounds?: [[number, number], [number, number]];
  areaHa?: number;
  parcels: Parcel[];
}

export interface Rancho {
  id: string;
  name: string;
  municipality: string;
  state: 'San Luis Potosí';
  description?: string;
  center: [number, number];
  totalAreaHa: number;
  zones: RanchoZone[];
  createdAt: string;
}

export interface RanchoWizardDraft {
  id: string;
  currentStep: number; // 1: Rancho Info, 2: Zonas count & names, 3: Dibujo de Zonas, 4: Parcelas por zona, 5: Dibujo de Parcelas
  ranchoName: string;
  municipality: string;
  centerLat: number;
  centerLng: number;
  zoneCount: number;
  zonesConfig: {
    id: string;
    name: string;
    code: string;
    parcelCount: number;
    polygon?: [number, number][];
    areaHa?: number;
  }[];
  activeZoneIndex: number;
  activeParcelIndex?: number;
  mappedParcels: Parcel[];
  lastSavedAt: string;
}

export interface SentinelScene {
  id: string;
  date: string;
  platform: 'Sentinel-2A' | 'Sentinel-2B';
  tile: '14QPM' | '14QPN';
  cloudCoverPct: number;
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  orbitNumber: number;
  processingLevel: 'Level-2A (Bottom of Atmosphere SR)';
  collection: 'COPERNICUS/S2_SR_HARMONIZED';
  datatakeId?: string;
  copernicusUrl?: string;
}

export interface SpectralBands {
  B2: number; // Blue (490 nm)
  B3: number; // Green (560 nm)
  B4: number; // Red (665 nm)
  B5: number; // Red Edge 1 (705 nm)
  B6: number; // Red Edge 2 (740 nm)
  B7: number; // Red Edge 3 (783 nm)
  B8: number; // NIR (842 nm)
  B11: number; // SWIR-1 (1610 nm)
}

export interface CalculatedIndices {
  ndvi: number; // (B8 - B4) / (B8 + B4)
  gndvi: number; // (B8 - B3) / (B8 + B3)
  ndwi: number; // (B8 - B11) / (B8 + B11)
  s2rep: number; // 705 + 35 * (((B7 + B4)/2 - B5) / (B6 - B5))
  brix: number; // NDVI * 22
}

export interface PixelDiagnostic {
  id: string;
  lat: number;
  lng: number;
  utmCoord: string;
  parcelId: string;
  parcelName: string;
  ranchoName: string;
  zoneName: string;
  date: string;
  sceneId: string;
  bands: SpectralBands;
  indices: CalculatedIndices;
  status: {
    vigorLevel: 'Bajo' | 'Moderado' | 'Alto' | 'Excepcional';
    vigorColor: string;
    chlorophyllLevel: 'Deficiente' | 'Normal' | 'Óptimo';
    waterStress: 'Crítico (Marchitez)' | 'Estrés Moderado' | 'Óptimo (Turgente)';
    waterStressKey: 'critical' | 'moderate' | 'optimal';
    ripenessState: 'Crecimiento Vegetativo' | 'Inicio Maduración' | 'Madurez Óptima para Zafra' | 'Sobre-maduración';
    sugarEstimateQuality: 'Bajo (<13 °Bx)' | 'Aceptable (13-16 °Bx)' | 'Alto (16-19 °Bx)' | 'Excepcional (>19 °Bx)';
  };
  recommendation: {
    irrigation: string;
    nutrition: string;
    harvest: string;
    actionSummary: string;
  };
}

export type ActiveLayer = 'rgb' | 'cir' | 'ndvi' | 'gndvi' | 'ndwi' | 's2rep' | 'brix';

export interface LayerMetadata {
  id: ActiveLayer;
  category: 'Capa 1: Óptica' | 'Capa 2: Diagnóstico' | 'Capa 3: Predictivo';
  name: string;
  shortName: string;
  formula: string;
  range: string;
  unit: string;
  description: string;
  optimalRule: string;
}
