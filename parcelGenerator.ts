import { Parcel } from '../types';

export const HUASTECA_MUNICIPALITY_COORDS: Record<string, [number, number]> = {
  'Ciudad Valles': [21.9820, -99.0345],
  'Tamasopo': [21.8685, -99.3582],
  'El Naranjo': [22.5284, -99.3195],
  'Tamuín': [22.0080, -98.7520],
  'Aquismón': [21.6250, -99.0250],
  'Cárdenas': [21.9950, -99.6450],
  'Ébano': [22.2150, -98.3820],
};

/**
 * Deterministic pseudo-random number generator from string seed
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates unique, authentic physiological metrics for a sugarcane parcel
 * based on variety, cycle, irrigation, and unique parcel ID.
 */
export function generateAuthenticParcelMetrics(
  parcelId: string,
  variety: string,
  cycle: string,
  irrigationType: string,
  areaHa: number
) {
  const seed = `${parcelId}-${variety}-${cycle}-${irrigationType}-${areaHa}`;
  const r1 = seededRandom(seed + 'r1');
  const r2 = seededRandom(seed + 'r2');
  const r3 = seededRandom(seed + 'r3');

  // Baseline variations based on realistic agronomy:
  // Water stress is strongly affected by irrigation type
  const isTemporal = irrigationType.includes('Temporal');
  const isDrip = irrigationType.includes('Goteo');

  let baseNDWI = 0.32;
  if (isTemporal) {
    baseNDWI = 0.07 + r2 * 0.16; // Likely to show critical or moderate stress (0.07 - 0.23)
  } else if (isDrip) {
    baseNDWI = 0.35 + r2 * 0.10; // High turgor (0.35 - 0.45)
  } else {
    baseNDWI = 0.24 + r2 * 0.18; // 0.24 - 0.42
  }

  // NDVI depends on cycle and moisture
  let baseNDVI = 0.70;
  if (cycle === 'Plantilla') {
    baseNDVI = 0.55 + r1 * 0.15; // Young cane (0.55 - 0.70)
  } else if (cycle === 'Soca 2' || cycle === 'Resoca 1') {
    baseNDVI = 0.68 + r1 * 0.16; // Dense cane (0.68 - 0.84)
  } else {
    baseNDVI = 0.62 + r1 * 0.18;
  }

  // Adjust NDVI downwards if severe water stress
  if (baseNDWI < 0.10) {
    baseNDVI = Math.max(0.38, baseNDVI - 0.15);
  }

  // GNDVI (Chlorophyll/N) correlates with NDVI with green band sensitivity
  const baseGNDVI = Math.max(0.35, Math.min(0.80, baseNDVI * 0.92 + (r3 - 0.5) * 0.08));

  // S2REP (Red Edge Position, 705 to 735 nm)
  const baseS2REP = Number((712.0 + baseNDVI * 20.0 + (r1 - 0.5) * 4.0).toFixed(1));

  // Brix concentration in stalk:
  // Ripening cane has high Brix (16.5 to 21.0), younger cane has 11.0 to 14.5
  let baseBrix = baseNDVI * 21.5 + (baseS2REP - 715) * 0.08 + (r2 - 0.5) * 2.0;
  baseBrix = Math.max(10.5, Math.min(22.4, baseBrix));

  let waterStressStatus: 'optimal' | 'moderate' | 'critical' = 'optimal';
  if (baseNDWI < 0.10) {
    waterStressStatus = 'critical';
  } else if (baseNDWI <= 0.30) {
    waterStressStatus = 'moderate';
  }

  return {
    ndvi: Number(baseNDVI.toFixed(2)),
    gndvi: Number(baseGNDVI.toFixed(2)),
    ndwi: Number(baseNDWI.toFixed(2)),
    s2rep: baseS2REP,
    brix: Number(baseBrix.toFixed(1)),
    waterStressStatus,
  };
}

/**
 * DEPRECATED: Synthetic rectangular parcel generation is strictly disabled.
 * All parcels must be hand-drawn by the user directly on commercial satellite imagery.
 */
export function calculateParcelGeometry() {
  throw new Error('Las parcelas automáticas están deshabilitadas. Todas las parcelas deben ser trazadas a mano sobre el satélite por el usuario.');
}
