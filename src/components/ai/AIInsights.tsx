import { Bot } from 'lucide-react';
import type { RecommendationItem } from '@/types/agro';

interface AIInsightsProps {
  items: RecommendationItem[];
}

export function AIInsights({ items }: AIInsightsProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Recomendaciones IA</h3>
        <Bot className="h-5 w-5 text-emerald-300" />
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item, index) => (
          <div key={item.title} className="flex gap-3 rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-200">
              {index + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
