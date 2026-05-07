type MobileLoadingStateProps = {
  sections?: number;
};

export function MobileLoadingState({
  sections = 3,
}: MobileLoadingStateProps) {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      <div className="h-32 rounded-[30px] bg-white/70" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-[24px] bg-white/70" />
        <div className="h-28 rounded-[24px] bg-white/70" />
      </div>
      {Array.from({ length: sections }).map((_, index) => (
        <div key={index} className="rounded-[28px] bg-white/70 p-5">
          <div className="h-4 w-28 rounded bg-slate-200/70" />
          <div className="mt-3 h-3 w-full rounded bg-slate-200/60" />
          <div className="mt-2 h-3 w-3/4 rounded bg-slate-200/60" />
          <div className="mt-4 space-y-3">
            <div className="h-14 rounded-[20px] bg-slate-200/60" />
            <div className="h-14 rounded-[20px] bg-slate-200/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
