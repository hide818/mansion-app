import { createSupabaseServerClient } from '@/lib/supabaseServer'

export type UserProfile = {
  id: string
  company_id: string | null
  role: 'admin' | 'general' | 'viewer' | null
  can_view_all_data: boolean
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, company_id, role, can_view_all_data')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) return null

  const role = profile.role
  return {
    id: profile.id,
    company_id: profile.company_id ?? null,
    role: role === 'admin' || role === 'general' || role === 'viewer' ? role : null,
    can_view_all_data: profile.can_view_all_data ?? false,
  }
}
