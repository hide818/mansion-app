import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiCopyReadyTextPage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="copy_ready_text"
        title="AI コピペ用テキスト出力"
        description="チャット、メール、共有メモ、理事会下書きへそのまま貼りやすい文章を出します。"
        inputLabel="どこに貼る文章か"
        placeholder="例）Teams共有用です。2〜4行で、現状と次の動きだけ短く貼れる文が欲しいです。"
        buttonText="コピペ文を作る"
        resultTitle="コピペ用テキスト"
        tips={[
          'そのまま貼れる短文に向いています。',
          '社内共有の速度を上げる用途です。',
          'メールほど固くなく、でも雑すぎない文を出せます。',
        ]}
      />
    </div>
  )
}