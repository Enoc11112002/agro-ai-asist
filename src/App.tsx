import {
  AlertTriangle,
  Bell,
  Bot,
  Droplets,
  Gauge,
  Leaf,
  MapPinned,
  Search,
  TrendingUp,
} from 'lucide-react';

const stats = [
  { label: 'Superficie monitoreada', value: '18,420 ha', delta: '+5.4%', icon: MapPinned },
  { label: 'Vigor promedio', value: '0.84', delta: '+0.06', icon: Leaf },
  { label: 'Estrés hídrico', value: '12 parcelas', delta: '-2.1%', icon: Droplets },
  { label: 'Eficiencia estimada', value: '92%', delta: '+4.8%', icon: Gauge },
];

const alerts = [
  { zone: 'Norte-04', severity: 'Alta', text: 'Estrés hídrico moderado en 2 bloques', eta: '48h' },
  { zone: 'Centro-07', severity: 'Media', text: 'Riesgo de deficiencia nutricional', eta: '72h' },
  { zone: 'Sur-12', severity: 'Baja', text: 'Crecimiento estable con buena cobertura', eta: 'Sin urgencia' },
];

const recommendations = [
  'Programar revisión agronómica en bloques del norte para priorizar riego estratégico.',
  'Aplicar mantenimiento en zonas con deficiencia foliar detectada por NDVI bajo.',
  'Ajustar calendario de fertirriego para mejorar uniformidad en parcelas centro-sur.',
];

const trend = [68, 72, 70, 76, 81, 79, 88, 92];

const navItems = ['Dashboard', 'Monitoreo', 'Mapas', 'IA', 'Reportes'];

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden min-h-screen w-72 border-r border-slate-800 bg-slate-900/70 p-6 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">Agro</p>
              <h2 className="text-xl font-bold text-white">AI-Asist</h2>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map((item, index) => (
              <button
                key={item}
                className={[
                  'flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition',
                  index === 0
                    ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80',
                ].join(' ')}
              >
                <span>{item}</span>
                {index === 0 && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
              </button>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-emerald-200">
              <Bot className="h-4 w-4" />
              <span className="text-sm font-medium">IA agronómica</span>
            </div>
            <p className="mt-3 text-sm text-slate-200">
              Riesgo de riesgo medio en 4 lotes del sector norte. Es recomendable revisar el programa de riego.
            </p>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-5 backdrop-blur-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Monitoreo satelital</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                  Dashboard Agro AI
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    aria-label="Buscar"
                    placeholder="Buscar zona o lote"
                    className="w-40 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500 md:w-60"
                  />
                </div>

                <button className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-200 transition hover:bg-slate-800">
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-8 p-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map(({ label, value, delta, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-emerald-950/10">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">{label}</p>
                    <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-bold text-white">{value}</p>
                  <p className="mt-2 text-sm text-emerald-300">{delta} vs. semana anterior</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
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
                    {Array.from({ length: 96 }, (_, i) => {
                      const isActive = i % 8 === 0 || i % 13 === 0 || i % 19 === 0;
                      const isFocus = i === 32 || i === 38 || i === 40 || i === 46;

                      return (
                        <div
                          key={i}
                          className={[
                            'rounded-md border transition',
                            isFocus
                              ? 'border-emerald-300 bg-emerald-400/80 shadow-glow'
                              : isActive
                                ? 'border-amber-200/40 bg-amber-400/30'
                                : 'border-slate-700 bg-slate-800/50',
                          ].join(' ')}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Alertas</h3>
                    <AlertTriangle className="h-5 w-5 text-amber-300" />
                  </div>

                  <div className="mt-5 space-y-4">
                    {alerts.map((alert) => (
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

                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Tendencia</h3>
                    <TrendingUp className="h-5 w-5 text-emerald-300" />
                  </div>

                  <div className="mt-6 flex h-32 items-end gap-2">
                    {trend.map((value, index) => (
                      <div key={value + index} className="flex flex-1 flex-col items-center justify-end gap-2">
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-emerald-500 to-emerald-300"
                          style={{ height: `${value}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Recomendaciones IA</h3>
                  <Bot className="h-5 w-5 text-emerald-300" />
                </div>

                <div className="mt-6 space-y-4">
                  {recommendations.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-200">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                <h3 className="text-xl font-bold text-white">Resumen operativo</h3>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                    <p className="text-sm text-slate-400">Cobertura vegetal</p>
                    <p className="mt-2 text-2xl font-bold text-white">76.8%</p>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                    <p className="text-sm text-slate-400">Parcela prioritaria</p>
                    <p className="mt-2 text-2xl font-bold text-white">Bloque 14</p>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                    <p className="text-sm text-slate-400">Acción sugerida</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-200">Riego localizado + revisión foliar</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
