import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type ReportDetailPageProps = {
  params: Promise<{
    id: string
    reportId: string
  }>
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
  const { id, reportId } = await params
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (propertyError || !property) {
    notFound()
  }

  const { data: report, error: reportError } = await supabase
    .from('daily_reports')
    .select('id, title, body, report_mode, report_date, created_at')
    .eq('id', reportId)
    .eq('property_id', id)
    .eq('company_id', companyId)
    .single()

  if (reportError || !report) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">保存済み日報詳細</p>
            <h1 className="text-3xl font-bold text-slate-900">{report.title}</h1>
            <p className="mt-2 text-sm text-slate-600">物件名: {property.name}</p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/properties/${id}/daily-report`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
            >
              日報一覧へ戻る
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span>
              モード：
              {report.report_mode === 'short' ? '短め版' : 'しっかり版'}
            </span>
            <span>対象日：{report.report_date ?? '-'}</span>
            <span>保存日時：{formatDateTime(report.created_at)}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-sm leading-7 text-slate-100">
            {report.body}
          </pre>
        </div>
      </div>
    </div>
  )
}