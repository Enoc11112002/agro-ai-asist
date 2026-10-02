import { ActiveLayer, LayerMetadata } from '../types';

export const LAYER_DEFINITIONS: Record<ActiveLayer, LayerMetadata> = {
  rgb: {
    id: 'rgb',
    category: 'Capa 1: Óptica',
    name: 'Fotografía Óptica Natural (RGB)',
    shortName: 'Color Real (B4-B3-B2)',
    formula: 'R: B4 (665nm) · G: B3 (560nm) · B: B2 (490nm)',
    range: 'Reflectancia BOA [200 - 2500]',
    unit: 'Digital Reflectance DN',
    description: 'Composición de color verdadero de Sentinel-2 con estiramiento radiométrico min: 200, max: 2500. Permite identificar fallas mecánicas de siembra, caminos guardarrayas y áreas anegadas.',
    optimalRule: 'Contraste visual directo de cobertura superficial'
  },
  cir: {
    id: 'cir',
    category: 'Capa 1: Óptica',
    name: 'Falso Color Infrarrojo Cercano (CIR)',
    shortName: 'Falso Color NIR (B8-B4-B3)',
    formula: 'R: B8 (842nm) · G: B4 (665nm) · B: B3 (560nm)',
    range: 'Reflectancia BOA [500 - 4000]',
    unit: 'Digital Reflectance DN',
    description: 'Composición infrarroja estándar con estiramiento min: 500, max: 4000. La vegetación densa y fotosintéticamente activa resalta en rojos intensos y carmesí, mientras que el suelo expuesto o paja seca aparece en tonos celestes y grisáceos.',
    optimalRule: 'Mayor intensidad de rojo = mayor biomasa foliar'
  },
  ndvi: {
    id: 'ndvi',
    category: 'Capa 2: Diagnóstico',
    name: 'Índice de Vegetación de Diferencia Normalizada (NDVI)',
    shortName: 'Vigor y Biomasa (NDVI)',
    formula: 'NDVI = (B8 - B4) / (B8 + B4)',
    range: '0.10 a 0.85',
    unit: 'Adimensional [-1 a +1]',
    description: 'Diagnóstico intra-parcelario píxel a píxel a 10m. Cuantifica el vigor del dosel, cierre de calles y biomasa aérea de la caña. Valores > 0.70 corresponden a cañaverales vigorosos en fase de gran crecimiento.',
    optimalRule: 'Óptimo para caña en desarrollo: > 0.65'
  },
  gndvi: {
    id: 'gndvi',
    category: 'Capa 2: Diagnóstico',
    name: 'Índice Verde de Vegetación (GNDVI)',
    shortName: 'Clorofila y Nitrógeno (GNDVI)',
    formula: 'GNDVI = (B8 - B3) / (B8 + B3)',
    range: '0.20 a 0.80',
    unit: 'Adimensional [-1 a +1]',
    description: 'Sensible a la concentración de clorofila foliar a través de la banda verde B3 (560 nm). A diferencia del NDVI, no se satura en canopias densas de caña de azúcar, permitiendo detectar clorosis y deficiencias de nitrógeno.',
    optimalRule: 'Nutrición adecuada de Nitrógeno: > 0.60'
  },
  ndwi: {
    id: 'ndwi',
    category: 'Capa 2: Diagnóstico',
    name: 'Índice Diferencial de Agua Normalizado (NDWI)',
    shortName: 'Humedad Foliar (NDWI)',
    formula: 'NDWI = (B8 - B11) / (B8 + B11)',
    range: '-0.10 a 0.50',
    unit: 'Adimensional [-1 a +1]',
    description: 'Monitoreo de turgencia y contenido de agua en mesófilo foliar utilizando la banda de absorción de agua SWIR B11 (1610 nm). Integra semáforo automático de estrés hídrico.',
    optimalRule: 'Alerta crítica si NDWI < 0.10 | Óptimo turgente > 0.30'
  },
  s2rep: {
    id: 's2rep',
    category: 'Capa 3: Predictivo',
    name: 'Posición del Borde Rojo de Sentinel-2 (S2REP)',
    shortName: 'Borde Rojo para Sacarosa (S2REP)',
    formula: 'S2REP = 705 + 35 * (((B7 + B4)/2 - B5) / (B6 - B5))',
    range: '705.0 a 735.0',
    unit: 'Longitud de Onda [nm]',
    description: 'Localización del punto de inflexión del Red Edge (borde rojo) usando las bandas específicas de Sentinel-2 B4, B5, B6 y B7. Detecta el viraje fotosintético previo a la sacarificación y senescencia controlada de entrenudos.',
    optimalRule: 'Punto de viraje de maduración: 720.0 - 728.0 nm'
  },
  brix: {
    id: 'brix',
    category: 'Capa 3: Predictivo',
    name: 'Estimador Geoespacial de Grados Brix (°Bx)',
    shortName: 'Grados Brix Estimados (°Bx)',
    formula: '°Brix ≈ NDVI * 22 (Ajustado por S2REP)',
    range: '10.0 a 22.0',
    unit: '°Bx (Sacarosa disuelta)',
    description: 'Modelo empírico calibrado para los ingenios de la Huasteca Potosina (Plan de Ayala, Alianza Popular, San Miguel). Correlaciona la densidad foliar y desaceleración vegetativa con la concentración de sacarosa en jugo de tallo molible.',
    optimalRule: 'Caña madura lista para zafra: > 16.5 °Bx'
  }
};
