export default function TasksLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-20 rounded bg-slate-200" />
        <div className="mt-2 h-8 w-40 rounded bg-slate-200" />
      </div>
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-5 w-5 rounded bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-56 rounded bg-slate-200" />
                <div className="flex gap-2">
                  <div className="h-3 w-16 rounded-full bg-slate-100" />
                  <div className="h-3 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
