import { NextResponse } from 'next/server'
import { getUserProfile } from '@/lib/getUserProfile'

export async function GET() {
  const profile = await getUserProfile()
  if (!profile?.company_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    companyId: profile.company_id,
    userId: profile.id,
    role: profile.role,
    can_view_all_data: profile.can_view_all_data,
    isAdmin: profile.role === 'admin' || profile.can_view_all_data === true,
  })
}
