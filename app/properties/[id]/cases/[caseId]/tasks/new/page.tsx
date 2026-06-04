import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ id: string; caseId: string }>
}

export default async function LegacyTaskNewPage({ params }: Props) {
  const { id, caseId } = await params
  redirect(`/properties/${id}/tasks/new?caseId=${caseId}`)
}
