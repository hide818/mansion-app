import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiManagerTonePolisherPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="manager_tone_polisher"
        title="AI 上司向け文体整形"
        description="ラフな共有文を、上司報告向けの見やすい文章に整えます。"
        inputLabel="整えたいラフ文"
        placeholder="例）今は業者から回答待ちで、理事長にもまだ言ってないけど金額次第で理事会かなと思っています。"
        buttonText="上司向けに整える"
        resultTitle="上司向け整形文"
        tips={[
          '社内報告の見た目を整えます。',
          '結論先出しの文に寄せやすいです。',
          'チャット文を報告文へ変える用途に向いています。',
        ]}
      />
    </div>
  )
}