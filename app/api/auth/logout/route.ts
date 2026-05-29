import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('logout error:', error)
      return new NextResponse('ログアウトに失敗しました。', { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('logout route error:', error)
    return new NextResponse('ログアウト中にエラーが発生しました。', { status: 500 })
  }
}