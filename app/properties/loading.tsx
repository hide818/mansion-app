export default function PropertiesLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between">
          <div>
            <div className="h-4 w-16 rounded bg-slate-200" />
            <div className="mt-2 h-8 w-32 rounded bg-slate-200" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-slate-200" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-32 rounded bg-slate-100" />
            <div className="mt-4 flex gap-2">
              <div className="h-6 w-16 rounded-full bg-slate-100" />
              <div className="h-6 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
