const steps = [
  "Evaluating roster construction...",
  "Calculating spacing and chemistry...",
  "Simulating the 82-game season...",
  "Running the playoff bracket...",
];

export const SimulationScreen = () => (
  <section className="glass-panel mx-auto max-w-3xl rounded-[34px] p-8 text-center shadow-card lg:p-12">
    <div className="mx-auto h-24 w-24 animate-float rounded-full border border-sky-300/25 bg-sky-300/10" />
    <p className="mt-8 text-xs uppercase tracking-[0.28em] text-sky-200/70">Season Simulation</p>
    <h1 className="mt-3 font-display text-4xl text-white lg:text-5xl">Running your franchise timeline</h1>
    <p className="mt-4 text-lg leading-8 text-slate-300">
      The engine is weighing star power, lineup fit, depth, and playoff volatility before the final results screen.
    </p>

    <div className="mt-10 space-y-4 text-left">
      {steps.map((step, index) => (
        <div key={step} className="animate-slideUp rounded-2xl border border-white/10 bg-white/5 p-4" style={{ animationDelay: `${index * 160}ms` }}>
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 animate-pulseLine rounded-full bg-sky-300" />
            <span className="text-sm font-medium text-slate-100">{step}</span>
          </div>
        </div>
      ))}
    </div>
  </section>
);
