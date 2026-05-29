import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function getUserCompanyId() {
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
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('getUserCompanyId profile error:', profileError)
    return null
  }

  return profile?.company_id ?? null
}