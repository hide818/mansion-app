import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import KuraLogo from '@/app/components/KuraLogo'

export const metadata = { title: 'Kura Admin' }

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [
    { count: totalUsers },
    { count: totalProperties },
    { count: totalCases },
    { data: leads },
    { data: companies },
  ] = await Promise.all([
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service.from('properties').select('*', { count: 'exact', head: true }),
    service.from('cases').select('*', { count: 'exact', head: true }),
    service.from('leads').select('id, status, name, company, created_at').order('created_at', { ascending: false }).limit(5),
    service.from('profiles').select('company_id, role').eq('role', 'admin'),
  ])

  const leadCounts = {
    new: leads?.filter(l => l.status === 'new').length ?? 0,
    contacted: leads?.filter(l => l.status === 'contacted').length ?? 0,
    demo_scheduled: leads?.filter(l => l.status === 'demo_scheduled').length ?? 0,
    converted: leads?.filter(l => l.status === 'converted').length ?? 0,
  }

  const stats = [
    { label: '契約中の会社', value: companies?.length ?? 0, color: 'text-blue-600', href: '/admin/companies' },
    { label: '総ユーザー数', value: totalUsers ?? 0, color: 'text-purple-600', href: null },
    { label: '総物件数', value: totalProperties ?? 0, color: 'text-emerald-600', href: null },
    { label: '総案件数', value: totalCases ?? 0, color: 'text-orange-600', href: null },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="border-b border-slate-200 bg-[#070E1C] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <KuraLogo size={28} variant="seal" />
            <div>
              <span className="text-base font-extrabold text-white">Kura Admin</span>
              <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">Super Admin</span>
            </div>
          </div>
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">← アプリに戻る</Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">

        {/* ナビ */}
        <div className="flex gap-2 flex-wrap">
          {[
            { href: '/admin', label: '概要', active: true },
            { href: '/admin/companies', label: '会社一覧' },
            { href: '/leads', label: '見込み顧客' },
          ].map(n => (
            <Link key={n.href} href={n.href}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${n.active ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {n.label}
            </Link>
          ))}
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className={`rounded-2xl border border-slate-200 bg-white p-5 ${s.href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
              {s.href ? (
                <Link href={s.href} className="block">
                  <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.label}</p>
                </Link>
              ) : (
                <>
                  <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.label}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 見込み顧客サマリー */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">見込み顧客</h2>
            <Link href="/leads" className="text-xs text-blue-600 hover:underline">すべて見る →</Link>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: '新規', value: leadCounts.new, color: 'bg-blue-50 text-blue-700' },
              { label: '連絡済み', value: leadCounts.contacted, color: 'bg-yellow-50 text-yellow-700' },
              { label: 'デモ予定', value: leadCounts.demo_scheduled, color: 'bg-purple-50 text-purple-700' },
              { label: '成約', value: leadCounts.converted, color: 'bg-green-50 text-green-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {leads && leads.length > 0 && (
            <div className="divide-y divide-slate-100">
              {leads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{lead.name}</p>
                    <p className="text-xs text-slate-400">{lead.company ?? '—'}</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(lead.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* クイックリンク */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { href: '/admin/companies', label: '会社一覧', desc: '契約中テナントの利用状況を確認', color: 'border-blue-100 bg-blue-50 text-blue-700' },
            { href: '/leads', label: '見込み顧客リスト', desc: 'ステータス管理・社内メモ記録', color: 'border-purple-100 bg-purple-50 text-purple-700' },
            { href: '/import', label: 'CSVインポート', desc: 'データ一括移行（管理者専用）', color: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${l.color}`}>
              <p className="font-bold text-sm">{l.label}</p>
              <p className="text-xs mt-1 opacity-70">{l.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
