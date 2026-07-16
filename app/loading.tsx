export default function Loading() {
  return (
    <main
      className="flex flex-1 items-center justify-center px-6 py-24"
      aria-busy="true"
    >
      <div className="w-full max-w-[420px] border-y border-fg py-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg">
          Tuning your wire
        </p>
        <p className="mt-3 font-sans text-[15px] leading-[1.6] text-meta">
          Loading your ranked engineering dispatch.
        </p>
      </div>
    </main>
  );
}
