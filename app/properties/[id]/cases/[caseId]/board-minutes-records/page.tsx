import BoardMinutesRecordsClient from '@/app/components/BoardMinutesRecordsClient'
import BoardFlowNav from '@/app/components/BoardFlowNav'

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
      <BoardFlowNav currentStep="records" propertyId={id} caseId={caseId} />
      <BoardMinutesRecordsClient propertyId={id} caseId={caseId} />
    </main>
  )
}