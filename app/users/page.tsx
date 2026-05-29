import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserRole, type AppRole } from '@/lib/getUserRole'
import { canManageUsers } from '@/lib/permissions'
import RoleSelect from '@/app/users/RoleSelect'
import InviteUserSection from '@/app/users/InviteUserSection'

type UserRow = {
  id: string
  display_name: string | null
  company_id: string | null
  role: AppRole | null
}

type CompanyRow = {
  id: string
  name: string
}

function roleLabel(role: AppRole | null) {
  if (role === 'admin') return '管理者'
  if (role === 'general') return '一般'
  if (role === 'viewer') return '閲覧のみ'
  return '未設定'
}

export default async function UsersPage() {
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
          所属会社が設定されていません。profiles.company_id を確認してください。
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

  const [{ data: users, error: usersError }, { data: company, error: companyError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, company_id, role')
        .eq('company_id', companyId)
        .order('id', { ascending: true }),
      supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .maybeSingle(),
    ])

  if (usersError) {
    console.error('users page profiles error:', usersError)

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ユーザー一覧の取得に失敗しました。profiles テーブルの取得条件または RLS 設定を確認してください。
        </div>
      </div>
    )
  }

  if (companyError) {
    console.error('users page company error:', companyError)
  }

  const safeUsers = (users ?? []) as UserRow[]
  const safeCompany = (company ?? null) as CompanyRow | null

  const adminCount = safeUsers.filter((item) => item.role === 'admin').length
  const generalCount = safeUsers.filter((item) => item.role === 'general').length
  const viewerCount = safeUsers.filter((item) => item.role === 'viewer').length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ユーザー一覧</h1>
        <p className="mt-2 text-sm text-gray-600">
          同じ会社に所属しているユーザーだけを表示しています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">会社名</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">
            {safeCompany?.name ?? '不明'}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">所属ユーザー数</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {safeUsers.length}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">管理者</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{adminCount}</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">一般 / 閲覧のみ</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {generalCount + viewerCount}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <InviteUserSection />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="text-sm font-semibold text-gray-800">所属ユーザー</div>
        </div>

        {safeUsers.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            この会社に所属するユーザーはまだいません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">表示名</th>
                  <th className="px-4 py-3 font-medium">ユーザーID</th>
                  <th className="px-4 py-3 font-medium">会社ID</th>
                  <th className="px-4 py-3 font-medium">現在の権限</th>
                  <th className="px-4 py-3 font-medium">権限変更</th>
                </tr>
              </thead>
              <tbody>
                {safeUsers.map((item) => {
                  const role = item.role === 'admin' || item.role === 'general' || item.role === 'viewer'
                    ? item.role
                    : 'viewer'

                  return (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-900">
                        {item.display_name || '未設定'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.id}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.company_id || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{roleLabel(role)}</td>
                      <td className="px-4 py-3">
                        <RoleSelect
                          userId={item.id}
                          currentRole={role}
                          disabled={item.id === user.id}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}