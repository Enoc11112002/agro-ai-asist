import { AlertTriangle } from 'lucide-react';
import type { AlertItem } from '@/types/agro';

interface AlertListProps {
  items: AlertItem[];
}

export function AlertList({ items }: AlertListProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Alertas</h3>
        <AlertTriangle className="h-5 w-5 text-amber-300" />
      </div>

      <div className="mt-5 space-y-4">
        {items.map((alert) => (
          <div key={alert.zone} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{alert.zone}</span>
              <span
                className={[
                  'rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em]',
                  alert.severity === 'Alta'
                    ? 'bg-rose-500/15 text-rose-200'
                    : alert.severity === 'Media'
                      ? 'bg-amber-500/15 text-amber-200'
                      : 'bg-emerald-500/15 text-emerald-200',
                ].join(' ')}
              >
                {alert.severity}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{alert.text}</p>
            <p className="mt-3 text-xs text-slate-400">Tiempo estimado: {alert.eta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
