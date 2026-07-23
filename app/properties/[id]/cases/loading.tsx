export default function CasesListLoading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="mt-2 h-8 w-40 rounded bg-slate-200" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-5 w-56 rounded bg-slate-200" />
            <div className="mt-2 flex gap-2">
              <div className="h-4 w-16 rounded-full bg-slate-100" />
              <div className="h-4 w-20 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
