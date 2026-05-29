import { createSupabaseServerClient } from '@/lib/supabaseServer'

export type AppRole = 'admin' | 'general' | 'viewer'

export async function getUserRole(): Promise<AppRole | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('getUserRole profile error:', profileError)
    return null
  }

  const role = profile?.role

  if (role === 'admin' || role === 'general' || role === 'viewer') {
    return role
  }

  return null
}