import BoardMinutesRecordsClient from '@/app/components/BoardMinutesRecordsClient'

type BoardMinutesRecordsPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function BoardMinutesRecordsPage({
  params,
}: BoardMinutesRecordsPageProps) {
  const { id, caseId } = await params

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <BoardMinutesRecordsClient propertyId={id} caseId={caseId} />
    </main>
  )
}