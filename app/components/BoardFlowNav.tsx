import Link from 'next/link'

type Step = 'prep' | 'minutes' | 'records'

type Props = {
  currentStep: Step
  propertyId: string
  caseId: string
}

const STEPS: { key: Step; label: string; short: string }[] = [
  { key: 'prep',    label: '① AI準備',          short: 'AI準備' },
  { key: 'minutes', label: '② 議事録作成',       short: '議事録' },
  { key: 'records', label: '③ 保存議事録・宿題確認', short: '宿題確認' },
]

function stepHref(step: Step, propertyId: string, caseId: string): string {
  const base = `/properties/${propertyId}/cases/${caseId}`
  if (step === 'prep')    return `${base}/board-pack`
  if (step === 'minutes') return `${base}/ai-board-minutes-pro`
  return `${base}/board-minutes-records`
}

export default function BoardFlowNav({ currentStep, propertyId, caseId }: Props) {
  return (
    <nav className="mb-6 flex items-center gap-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      {STEPS.map((step, i) => {
        const isCurrent = step.key === currentStep
        const href = stepHref(step.key, propertyId, caseId)

        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <span className="shrink-0 text-slate-300 select-none px-1">›</span>
            )}
            {isCurrent ? (
              <span className="whitespace-nowrap px-4 py-3 text-sm font-bold text-emerald-600">
                {step.label}
              </span>
            ) : (
              <Link
                href={href}
                className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                {step.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
