export default function PropertyDetailLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-16 rounded bg-slate-200" />
        <div className="mt-2 h-9 w-64 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-48 rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-12 rounded bg-slate-200" />
            <div className="mt-2 h-8 w-10 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-24 rounded bg-slate-200 mb-4" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 rounded bg-slate-200 mb-2" />
              <div className="h-10 rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
