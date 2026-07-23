export default function CaseDetailLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-20 rounded bg-slate-200" />
        <div className="mt-2 h-8 w-72 rounded bg-slate-200" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-16 rounded-full bg-slate-100" />
          <div className="h-6 w-20 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-24 rounded bg-slate-200 mb-5" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 rounded bg-slate-200 mb-2" />
              <div className="h-12 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
