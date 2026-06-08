'use client'

import { useState } from 'react'

type Props = {
  currentPlan: string
  hasStripeSubscription: boolean
}

const PLANS = [
  {
    key: 'starter',
    label: 'スタータープラン',
    price: '¥29,800/月',
    users: '5名まで',
    buildings: '50棟まで',
  },
  {
    key: 'standard',
    label: 'スタンダードプラン',
    price: '¥59,800/月',
    users: '20名まで',
    buildings: '200棟まで',
  },
]

export default function UpgradeSection({ currentPlan, hasStripeSubscription }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade(plan: string) {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) {
        const msg = await res.text()
        setError(msg)
        return
      }
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setError('通信エラーが発生しました。')
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) {
        const msg = await res.text()
        setError(msg)
        return
      }
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setError('通信エラーが発生しました。')
    } finally {
      setLoading(null)
    }
  }

  if (currentPlan === 'enterprise') return null

  return (
    <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-indigo-900">プランをアップグレード</div>
          <div className="text-xs text-indigo-600 mt-0.5">ユーザー数・棟数の上限を拡大できます</div>
        </div>
        {hasStripeSubscription && (
          <button
            onClick={handlePortal}
            disabled={loading === 'portal'}
            className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
          >
            {loading === 'portal' ? '移動中...' : '請求・プラン管理'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key
          return (
            <div
              key={plan.key}
              className={`rounded-xl border bg-white p-4 ${
                isCurrent ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">{plan.label}</div>
                  <div className="mt-0.5 text-lg font-bold text-indigo-700">{plan.price}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {plan.users} / {plan.buildings}
                  </div>
                </div>
                {isCurrent ? (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    現在
                  </span>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={loading === plan.key}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading === plan.key ? '移動中...' : '選択'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 text-xs text-indigo-500">
        エンタープライズ（無制限）は
        <a href="mailto:support@kura-saas.com" className="underline hover:text-indigo-700">
          お問い合わせ
        </a>
        ください。
      </div>
    </div>
  )
}
