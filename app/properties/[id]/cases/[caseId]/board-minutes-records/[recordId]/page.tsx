import BoardMinutesRecordEditorClient from '@/app/components/BoardMinutesRecordEditorClient'

type BoardMinutesRecordDetailPageProps = {
  params: Promise<{
    id: string
    caseId: string
    recordId: string
  }>
}

export default async function BoardMinutesRecordDetailPage({
  params,
}: BoardMinutesRecordDetailPageProps) {
  const { id, caseId, recordId } = await params

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <BoardMinutesRecordEditorClient
        propertyId={id}
        caseId={caseId}
        recordId={recordId}
      />
    </main>
  )
}