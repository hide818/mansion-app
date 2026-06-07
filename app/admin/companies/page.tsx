import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: '会社一覧 | Kura Admin' }

export default async function CompaniesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 会社ごとの管理者プロファイルを取得
  const { data: adminProfiles } = await service
    .from('profiles')
    .select('company_id, company_name, email, created_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  const companyIds = (adminProfiles ?? []).map(p => p.company_id).filter(Boolean)

  // 各社の統計を並列取得
  const stats = await Promise.all(
    companyIds.map(async (cid) => {
      const [
        { count: users },
        { count: properties },
        { count: cases },
        { count: tasks },
      ] = await Promise.all([
        service.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', cid),
        service.from('properties').select('*', { count: 'exact', head: true }).eq('company_id', cid),
        service.from('cases').select('*', { count: 'exact', head: true }).eq('company_id', cid),
        service.from('tasks').select('*', { count: 'exact', head: true }).eq('company_id', cid),
      ])
      const p = adminProfiles?.find(a => a.company_id === cid)
      return {
        company_id: cid,
        company_name: p?.company_name ?? '（未設定）',
        email: p?.email ?? '',
        created_at: p?.created_at ?? '',
        users: users ?? 0,
        properties: properties ?? 0,
        cases: cases ?? 0,
        tasks: tasks ?? 0,
      }
    })
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-[#070E1C] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-base font-extrabold text-white hover:text-blue-300 transition-colors">Kura Admin</Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-slate-300">会社一覧</span>
          </div>
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">← アプリに戻る</Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">会社一覧</h1>
            <p className="text-sm text-slate-500">現在 {stats.length} 社が利用中</p>
          </div>
        </div>

        {stats.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-400">
            <p className="text-sm">まだ契約中の会社がありません</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3 text-left">会社名</th>
                  <th className="px-5 py-3 text-left">管理者メール</th>
                  <th className="px-5 py-3 text-center">ユーザー</th>
                  <th className="px-5 py-3 text-center">物件</th>
                  <th className="px-5 py-3 text-center">案件</th>
                  <th className="px-5 py-3 text-center">タスク</th>
                  <th className="px-5 py-3 text-left">登録日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.map(s => (
                  <tr key={s.company_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{s.company_name}</td>
                    <td className="px-5 py-3.5 text-slate-500">{s.email}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700">{s.users}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">{s.properties}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-700">{s.cases}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{s.tasks}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(s.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
