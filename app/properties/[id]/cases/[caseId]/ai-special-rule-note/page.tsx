import CaseAiWorkbenchClient from '@/app/components/CaseAiWorkbenchClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

export default async function AiSpecialRuleNotePage({ params }: PageProps) {
  const { id, caseId } = await params

  return (
    <div className="p-6">
      <CaseAiWorkbenchClient
        propertyId={id}
        caseId={caseId}
        mode="special_rule_note"
        title="AI 特殊ルール管理"
        description="この物件特有の暗黙ルール、運用上の注意、普通の物件と違う点を整理します。"
        inputLabel="特殊ルールとして残したいこと"
        placeholder="例）夜間工事の扱い、理事会資料の出し方、役員連絡の順番など独自ルールがあります。"
        buttonText="特殊ルールを整理する"
        resultTitle="特殊ルール管理メモ"
        tips={[
          '新人がハマりやすい独自ルール向けです。',
          '暗黙知を見える化する本命です。',
          '引き継ぎ漏れ防止に強いです。',
        ]}
      />
    </div>
  )
}