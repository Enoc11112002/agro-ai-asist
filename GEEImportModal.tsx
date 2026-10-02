import React, { useState } from 'react';
import { Rancho, RanchoZone, Parcel } from '../types';
import { calculatePolygonAreaHa, getPolygonBoundsAndCenter } from '../services/geeService';
import { X, Upload, FileCode, CheckCircle2, AlertCircle, Sparkles, Building2 } from 'lucide-react';

interface GEEImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRancho: (newRancho: Rancho) => void;
}

export const GEEImportModal: React.FC<GEEImportModalProps> = ({
  isOpen,
  onClose,
  onImportRancho,
}) => {
  const [ranchoName, setRanchoName] = useState('Rancho Huasteca Importado');
  const [municipality, setMunicipality] = useState('Ciudad Valles');
  const [geoJsonText, setGeoJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessGeoJSON = () => {
    setErrorMsg(null);
    try {
      if (!geoJsonText.trim()) {
        setErrorMsg('Por favor ingresa o pega el contenido GeoJSON exportado de GEE o QGIS.');
        return;
      }

      const parsed = JSON.parse(geoJsonText);
      const features = parsed.type === 'FeatureCollection'
        ? parsed.features
        : parsed.type === 'Feature'
        ? [parsed]
        : [];

      if (!features || features.length === 0) {
        setErrorMsg('El formato JSON no contiene Features válidas con geometrías de polígono.');
        return;
      }

      const ranchoId = `RANCHO-IMP-${Date.now()}`;
      const zoneId = `ZONE-IMP-1`;
      const parcels: Parcel[] = [];
      let totalHa = 0;

      features.forEach((feat: any, idx: number) => {
        const geom = feat.geometry;
        if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) return;

        // Extract outer ring coordinates [lng, lat] -> convert to Leaflet [lat, lng]
        const ring = geom.type === 'Polygon' ? geom.coordinates[0] : geom.coordinates[0][0];
        const polygon: [number, number][] = ring.map((c: [number, number]) => [c[1], c[0]]);

        const { bounds, center } = getPolygonBoundsAndCenter(polygon);
        const areaHa = calculatePolygonAreaHa(polygon);
        totalHa += areaHa;

        const pName = feat.properties?.name || feat.properties?.nombre || `Parcela ${String(idx + 1).padStart(2, '0')}`;
        const pId = `par-${ranchoId}-${idx + 1}`;

        parcels.push({
          id: pId,
          ranchoId,
          zoneId,
          ranchoName,
          zoneName: 'Zona Principal',
          name: pName,
          cadastralCode: feat.properties?.clave || `CAT-${idx + 1}`,
          location: municipality,
          municipality,
          state: 'San Luis Potosí',
          areaHa: Math.max(0.5, areaHa),
          variety: feat.properties?.variedad || 'CP 72-2086',
          cycle: 'Soca 1',
          irrigationType: 'Riego de Auxilio',
          plantingDate: '2024-01-15',
          estimatedHarvestDate: '2026-03-30',
          expectedYieldTonHa: 110,
          center,
          bounds,
          polygon,
          avgMetrics: {
            ndvi: 0.68,
            gndvi: 0.58,
            ndwi: 0.28,
            s2rep: 722.5,
            brix: 16.8,
            waterStressStatus: 'optimal',
          },
        });
      });

      if (parcels.length === 0) {
        setErrorMsg('No se detectaron polígonos geométricos válidos en el GeoJSON ingresado.');
        return;
      }

      const zone: RanchoZone = {
        id: zoneId,
        ranchoId,
        name: 'Zona Principal',
        code: 'Z-01',
        targetParcelCount: parcels.length,
        parcels,
      };

      const newRancho: Rancho = {
        id: ranchoId,
        name: ranchoName,
        municipality,
        state: 'San Luis Potosí',
        description: `Rancho importado desde GEE con ${parcels.length} parcelas reales.`,
        center: parcels[0].center,
        totalAreaHa: Number(totalHa.toFixed(2)),
        zones: [zone],
        createdAt: new Date().toISOString().split('T')[0],
      };

      onImportRancho(newRancho);
      onClose();
    } catch (err: any) {
      setErrorMsg(`Error al analizar GeoJSON: ${err.message || 'Sintaxis JSON no válida'}`);
    }
  };

  const handleLoadSample = () => {
    // Real parcel coordinates in Ciudad Valles sugarcane basin
    const sample = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Tablón El Abra 01', variedad: 'CP 72-2086' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-99.0285, 21.9810],
                [-99.0245, 21.9812],
                [-99.0243, 21.9775],
                [-99.0282, 21.9773],
                [-99.0285, 21.9810]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: { name: 'Tablón El Abra 02', variedad: 'Mex 69-290' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-99.0242, 21.9812],
                [-99.0202, 21.9814],
                [-99.0200, 21.9777],
                [-99.0240, 21.9775],
                [-99.0242, 21.9812]
              ]
            ]
          }
        }
      ]
    };
    setGeoJsonText(JSON.stringify(sample, null, 2));
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">
              Cargar Polígonos de Parcelas Reales (GeoJSON / GEE)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <p className="text-slate-400">
            Importa directamente los polígonos delimitados en <strong>Google Earth Engine (Code Editor)</strong>, QGIS o tu sistema catastral. La aplicación extraerá inmediatamente los índices Sentinel-2 en vivo.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nombre del Rancho</label>
              <input
                type="text"
                value={ranchoName}
                onChange={(e) => setRanchoName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Municipio</label>
              <select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="Ciudad Valles">Ciudad Valles</option>
                <option value="Tamasopo">Tamasopo</option>
                <option value="El Naranjo">El Naranjo</option>
                <option value="Tamuín">Tamuín</option>
                <option value="Aquismón">Aquismón</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-medium">Contenido GeoJSON *</label>
              <button
                onClick={handleLoadSample}
                className="text-emerald-400 hover:underline text-[11px]"
              >
                Cargar ejemplo de prueba
              </button>
            </div>
            <textarea
              rows={8}
              value={geoJsonText}
              onChange={(e) => setGeoJsonText(e.target.value)}
              placeholder="Pega aquí el GeoJSON FeatureCollection..."
              className="w-full bg-slate-950 font-mono text-[11px] border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            Cancelar
          </button>
          <button
            onClick={handleProcessGeoJSON}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Importar y Consultar GEE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
