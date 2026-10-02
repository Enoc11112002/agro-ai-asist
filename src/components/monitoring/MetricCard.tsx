import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
}

export function MetricCard({ label, value, delta, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-emerald-950/10">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-5 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-emerald-300">{delta} vs. semana anterior</p>
    </div>
  );
}
