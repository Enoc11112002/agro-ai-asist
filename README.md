# Agro AI-Asist

Sistema integral de inteligencia agroespacial para monitoreo fisiológico y operacional de caña de azúcar en la Huasteca Potosina.

## Características

- Mapa satelital interactivo con capas geoespaciales
- Diagnóstico de vigor vegetal y estrés hídrico
- Recomendaciones agronómicas asistidas por IA
- Panel operativo para ingenios y productores
- Integración con Gemini para interpretación de datos agrarios

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Leaflet
- Google Gemini AI
- Express

## Requisitos

- Node.js 20+
- npm
- Una clave de API de Gemini

## Instalación

```bash
npm install
cp .env.example .env.local
# agrega tu GEMINI_API_KEY
npm run dev
```

## Variables de entorno

```env
GEMINI_API_KEY=tu_clave
VITE_GEMINI_API_KEY=tu_clave
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Estructura del proyecto

```text
src/
  components/
  pages/
  services/
  types/
  hooks/
  utils/
  styles/
public/
server/
```
