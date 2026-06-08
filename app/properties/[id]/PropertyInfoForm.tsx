'use client'

import { useState, useTransition } from 'react'

type PropertyInfo = {
  built_year: number | null
  structure: string | null
  total_units: number | null
  total_floors: number | null
  association_name: string | null
  president_name: string | null
  president_phone: string | null
  president_email: string | null
  board_frequency: string | null
  general_meeting_month: number | null
  management_fee: number | null
  repair_reserve: number | null
  reserve_balance: number | null
  repair_plan_year: number | null
  contract_start: string | null
  contract_renewal: string | null
  cleaning_company: string | null
  elevator_company: string | null
  insurance_company: string | null
}

type Props = {
  propertyId: string
  initial: PropertyInfo
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500'

export default function PropertyInfoForm({ propertyId, initial }: Props) {
  const [form, setForm] = useState<PropertyInfo>(initial)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function set(key: keyof PropertyInfo, value: string) {
    setForm((prev) => ({ ...prev, [key]: value === '' ? null : value }))
  }

  function setNum(key: keyof PropertyInfo, value: string) {
    setForm((prev) => ({ ...prev, [key]: value === '' ? null : Number(value) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    startTransition(async () => {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setMessage(res.ok ? '保存しました。' : '保存に失敗しました。')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* 建物基本 */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">建物基本情報</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="竣工年">
            <input type="number" value={form.built_year ?? ''} onChange={(e) => setNum('built_year', e.target.value)} placeholder="例: 1998" className={inputClass} />
          </Field>
          <Field label="築年数（自動）">
            <input type="text" readOnly value={form.built_year ? `${new Date().getFullYear() - form.built_year}年` : '—'} className={`${inputClass} bg-gray-50 text-gray-500`} />
          </Field>
          <Field label="構造">
            <select value={form.structure ?? ''} onChange={(e) => set('structure', e.target.value)} className={inputClass}>
              <option value="">未設定</option>
              <option value="RC造">RC造</option>
              <option value="SRC造">SRC造</option>
              <option value="S造">S造</option>
              <option value="木造">木造</option>
            </select>
          </Field>
          <Field label="総戸数">
            <input type="number" value={form.total_units ?? ''} onChange={(e) => setNum('total_units', e.target.value)} placeholder="例: 48" className={inputClass} />
          </Field>
          <Field label="総階数">
            <input type="number" value={form.total_floors ?? ''} onChange={(e) => setNum('total_floors', e.target.value)} placeholder="例: 10" className={inputClass} />
          </Field>
        </div>
      </div>

      {/* 管理組合 */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">管理組合</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="管理組合名">
            <input type="text" value={form.association_name ?? ''} onChange={(e) => set('association_name', e.target.value)} placeholder="例: ○○マンション管理組合" className={inputClass} />
          </Field>
          <Field label="理事長氏名">
            <input type="text" value={form.president_name ?? ''} onChange={(e) => set('president_name', e.target.value)} placeholder="例: 山田 太郎" className={inputClass} />
          </Field>
          <Field label="理事長電話">
            <input type="tel" value={form.president_phone ?? ''} onChange={(e) => set('president_phone', e.target.value)} placeholder="例: 090-0000-0000" className={inputClass} />
          </Field>
          <Field label="理事長メール">
            <input type="email" value={form.president_email ?? ''} onChange={(e) => set('president_email', e.target.value)} placeholder="例: yamada@example.com" className={inputClass} />
          </Field>
          <Field label="理事会開催頻度">
            <select value={form.board_frequency ?? ''} onChange={(e) => set('board_frequency', e.target.value)} className={inputClass}>
              <option value="">未設定</option>
              <option value="毎月">毎月</option>
              <option value="隔月">隔月</option>
              <option value="年4回">年4回</option>
              <option value="年3回">年3回</option>
              <option value="年2回">年2回</option>
              <option value="年1回">年1回</option>
            </select>
          </Field>
          <Field label="総会開催月">
            <select value={form.general_meeting_month ?? ''} onChange={(e) => setNum('general_meeting_month', e.target.value)} className={inputClass}>
              <option value="">未設定</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* 財務 */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">財務</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="管理費（月額/戸・円）">
            <input type="number" value={form.management_fee ?? ''} onChange={(e) => setNum('management_fee', e.target.value)} placeholder="例: 15000" className={inputClass} />
          </Field>
          <Field label="修繕積立金（月額/戸・円）">
            <input type="number" value={form.repair_reserve ?? ''} onChange={(e) => setNum('repair_reserve', e.target.value)} placeholder="例: 8000" className={inputClass} />
          </Field>
          <Field label="修繕積立金残高（円）">
            <input type="number" value={form.reserve_balance ?? ''} onChange={(e) => setNum('reserve_balance', e.target.value)} placeholder="例: 12000000" className={inputClass} />
          </Field>
          <Field label="長期修繕計画 次回改定年">
            <input type="number" value={form.repair_plan_year ?? ''} onChange={(e) => setNum('repair_plan_year', e.target.value)} placeholder="例: 2027" className={inputClass} />
          </Field>
        </div>
      </div>

      {/* 契約 */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">管理委託契約</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="契約開始日">
            <input type="date" value={form.contract_start ?? ''} onChange={(e) => set('contract_start', e.target.value)} className={inputClass} />
          </Field>
          <Field label="契約更新日">
            <input type="date" value={form.contract_renewal ?? ''} onChange={(e) => set('contract_renewal', e.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>

      {/* 主要業者 */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">主要業者</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="清掃業者">
            <input type="text" value={form.cleaning_company ?? ''} onChange={(e) => set('cleaning_company', e.target.value)} placeholder="例: ○○クリーニング" className={inputClass} />
          </Field>
          <Field label="EV保守業者">
            <input type="text" value={form.elevator_company ?? ''} onChange={(e) => set('elevator_company', e.target.value)} placeholder="例: ○○エレベーター" className={inputClass} />
          </Field>
          <Field label="損害保険会社">
            <input type="text" value={form.insurance_company ?? ''} onChange={(e) => set('insurance_company', e.target.value)} placeholder="例: ○○損保" className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={isPending} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '保存中...' : '物件情報を保存'}
        </button>
        {message && <p className="text-sm font-medium text-gray-700">{message}</p>}
      </div>
    </form>
  )
}
