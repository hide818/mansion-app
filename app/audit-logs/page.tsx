import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserRole } from '@/lib/getUserRole'
import { canManageUsers } from '@/lib/permissions'

type AuditLogRow = {
  id: string
  action: string
  target_type: string | null
  target_id: string | null
  detail: string | null
  created_at: string
  user_id: string | null
  company_id: string
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function AuditLogsPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = await getUserCompanyId()
  const myRole = await getUserRole()

  if (!companyId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          所属会社が設定されていません。
        </div>
      </div>
    )
  }

  if (!canManageUsers(myRole)) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          この画面は管理者のみ利用できます。
        </div>
      </div>
    )
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, target_type, target_id, detail, created_at, user_id, company_id')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('audit logs page error:', error)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          監査ログの取得に失敗しました。audit_logs テーブルを確認してください。
        </div>
      </div>
    )
  }

  const logs = (data ?? []) as AuditLogRow[]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">監査ログ</h1>
        <p className="mt-2 text-sm text-gray-600">
          管理系操作の履歴を新しい順で表示しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">表示件数</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{logs.length}</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">会社ID</div>
          <div className="mt-2 break-all text-sm text-gray-900">{companyId}</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">対象</div>
          <div className="mt-2 text-sm text-gray-900">権限変更 / 招待リンク発行</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="text-sm font-semibold text-gray-800">最新の監査ログ</div>
        </div>

        {logs.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            監査ログはまだありません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">日時</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                  <th className="px-4 py-3 font-medium">対象種別</th>
                  <th className="px-4 py-3 font-medium">対象ID</th>
                  <th className="px-4 py-3 font-medium">詳細</th>
                  <th className="px-4 py-3 font-medium">実行ユーザー</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-700">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{item.action}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.target_type || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.target_id || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.detail || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.user_id || '-'}
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