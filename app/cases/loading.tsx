export default function CasesLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-20 rounded bg-slate-200" />
        <div className="mt-2 h-8 w-32 rounded bg-slate-200" />
      </div>
      <div className="flex gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-20 rounded-md bg-slate-200" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-64 rounded bg-slate-200" />
                <div className="flex gap-2">
                  <div className="h-4 w-20 rounded-full bg-slate-100" />
                  <div className="h-4 w-24 rounded-full bg-slate-100" />
                </div>
              </div>
              <div className="h-8 w-20 rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
