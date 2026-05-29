import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiSimpleDetailedSwitchPage({
  params,
}: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="simple_detailed_switch"
        title="AI 簡潔モード / 詳細モード切替"
        description="同じ内容を、短く共有する版と、しっかり説明する版の両方で出します。"
        inputLabel="短文版と詳細版で出したい内容"
        placeholder="例）上司には3行で、理事会にはしっかり説明したいです。同じ案件内容を2パターンで出したいです。"
        buttonText="2パターンで出す"
        resultTitle="簡潔版 / 詳細版"
        tips={[
          '社内共有と理事会説明を一気に作れます。',
          '短い版と詳しい版を並べて使えます。',
          'かなり実務で刺さる文書生成機能です。',
        ]}
      />
    </div>
  )
}