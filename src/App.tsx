const features = [
  'Monitoreo satelital por hectárea',
  'Diagnóstico fisiológico de la caña',
  'Alertas de estrés hídrico y nutricional',
  'Recomendaciones agronómicas con IA',
  'Mapas interactivos y reportes operativos',
];

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <header className="mb-12 flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Agro AI-Asist</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
              Monitoreo satelital inteligente
            </h1>
          </div>
          <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            Huasteca Potosina
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Superficie monitoreada', value: '18,420 ha' },
            { label: 'Índice vegetativo', value: '0.84' },
            { label: 'Alertas activas', value: '12' },
            { label: 'Eficiencia estimada', value: '92%' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-emerald-950/20">
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="mt-4 text-3xl font-bold text-white">{metric.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-2xl font-bold">Plataforma de inteligencia agroespacial</h2>
            <p className="mt-4 max-w-2xl text-slate-300">
              Sistema integral para detectar estrés fisiológico, priorizar zonas con mayor riesgo,
              y apoyar decisiones operativas para ingenios y productores de caña de azúcar.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 text-slate-200">
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">AI Insights</p>
            <h3 className="mt-4 text-2xl font-bold">Riesgo moderado en zonas del norte</h3>
            <ul className="mt-6 space-y-3 text-slate-200">
              <li>• Baja humedad relativa en 4 polígonos</li>
              <li>• Mayor estrés en parcelas con baja cobertura</li>
              <li>• Recomendación: revisión agronómica en 48h</li>
            </ul>
          </aside>
        </section>
      </div>
    </main>
  );
}
