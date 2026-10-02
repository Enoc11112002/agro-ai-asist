interface FieldMapProps {
  cells: Array<{ id: string; risk: 'low' | 'medium' | 'high' }>;
}

export function FieldMap({ cells }: FieldMapProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Mapa operativo</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Huasteca Potosina</h2>
        </div>
        <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
          12 alertas activas
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-700 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,#0f172a,#111827_40%,#020617)] p-5">
        <div className="grid h-[320px] grid-cols-12 grid-rows-8 gap-2">
          {cells.map((cell) => (
            <div
              key={cell.id}
              className={[
                'rounded-md border transition',
                cell.risk === 'high'
                  ? 'border-rose-300 bg-rose-400/80 shadow-[0_0_20px_rgba(251,113,133,0.35)]'
                  : cell.risk === 'medium'
                    ? 'border-amber-200/40 bg-amber-400/30'
                    : 'border-slate-700 bg-slate-800/50',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
