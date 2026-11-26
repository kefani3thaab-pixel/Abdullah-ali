// Phase 1.1 placeholder. It only checks that the theme, colors and fonts work.
// Real screens arrive in later phases.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
          Personal Edition
        </p>

        <h1 className="mt-2 font-display text-[40px] leading-[44px] font-bold text-text">
          Hybrid Athlete
        </h1>

        <p lang="ar" dir="rtl" className="mt-1 text-start text-lg font-semibold text-text-muted">
          الرياضي الهجين
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Stat label="Strength" color="bg-strength" />
          <Stat label="Running" color="bg-running" />
          <Stat label="Recovery" color="bg-recovery" />
        </div>

        <button
          type="button"
          className="mt-6 h-12 w-full rounded-md bg-accent font-semibold text-accent-ink transition-opacity active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Start training
        </button>

        <p className="mt-4 text-center text-xs text-text-muted">
          Foundation build · nothing is connected yet
        </p>
      </div>
    </main>
  );
}

function Stat({ label, color }: { label: string; color: string }) {
  return (
    <div className="rounded-md bg-surface-2 p-3">
      <span className={`block h-1 w-6 rounded-full ${color}`} />
      <span className="mt-2 block text-xs text-text-muted">{label}</span>
      <span className="tabular block font-display text-xl font-bold text-text">—</span>
    </div>
  );
}
