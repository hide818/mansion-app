import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiManagerFlashBriefPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="manager_flash_brief"
        title="AI 上司30秒報告"
        description="上司へ30秒で伝える想定で、結論・理由・次の動きを超短文で整理します。"
        inputLabel="上司に今伝えたいこと"
        placeholder="例）理事会提出の要否と、今週の動きだけを30秒で伝えたいです。チャットに貼れる感じが理想です。"
        buttonText="30秒報告を作る"
        resultTitle="上司30秒報告"
        tips={[
          '社内チャット共有にかなり向いています。',
          '長文報告の前の入口にも使えます。',
          '結論先出しで整えやすいです。',
        ]}
      />
    </div>
  )
}