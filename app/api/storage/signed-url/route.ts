import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

const BUCKET = 'kura-files'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const path = new URL(req.url).searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

  // パスが自社のものか確認
  if (!path.startsWith(`${companyId}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ url: data.signedUrl })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const path = new URL(req.url).searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

  if (!path.startsWith(`${companyId}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
