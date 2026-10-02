export type Severity = 'Alta' | 'Media' | 'Baja';

export interface MetricCardData {
  label: string;
  value: string;
  delta: string;
  icon: string;
}

export interface AlertItem {
  zone: string;
  severity: Severity;
  text: string;
  eta: string;
}

export interface RecommendationItem {
  title: string;
  detail: string;
}

export interface FieldZone {
  id: string;
  row: number;
  col: number;
  risk: 'low' | 'medium' | 'high';
}
