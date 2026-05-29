import { notFound } from 'next/navigation'
import Link from 'next/link'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'
import { getCaseSupportDataOrNull } from '@/lib/caseSupportData'

type GoalPageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

function buildGoalText(data: NonNullable<Awaited<ReturnType<typeof getCaseSupportDataOrNull>>>) {
  const incompleteTasks = data.tasks.filter((task) => task.status !== '完了')
  const nextAction = data.caseItem.board_next_action || '次アクション未設定'

  let goal = '案件の完了条件を明文化する必要があります。'
  let doneState = '完了判定がまだ曖昧です。'
  let nextMove = nextAction

  if (data.caseItem.status === '完了') {
    goal = '必要な対応を終え、記録を残したうえで案件を安全にクローズすることです。'
    doneState = '案件は完了状態です。関係者への最終共有と記録確認が残り作業です。'
  } else if (
    data.caseItem.board_status === '上程予定' ||
    data.caseItem.board_status === '提出予定'
  ) {
    goal = '理事会に上程できる状態まで資料と論点を整理し、承認判断を受けられる状態にすることです。'
    doneState = '議案タイトル、説明文、質疑応答の整理が揃えばゴールに近づきます。'
  } else if (incompleteTasks.length > 0) {
    goal = '未完了タスクを整理し、相手待ち・社内待ち・業者待ちのどこで止まっているかを解消することです。'
    doneState = `今は未完了タスクが ${incompleteTasks.length} 件あるため、先にそこを片付ける必要があります。`
  } else {
    goal = '現状確認を済ませ、完了に進めるのか追加対応が要るのかを判断することです。'
    doneState = 'タスクは少ないですが、完了判断がまだ残っています。'
  }

  return `【案件のゴール表示】

物件名：${data.property.name || '未設定'}
案件名：${data.caseItem.title || '未設定'}
案件ステータス：${data.caseItem.status || '未設定'}

■ この案件のゴール
${goal}

■ 今どこまで来ているか
${doneState}

■ 完了と見なせる状態
・関係者への必要連絡が終わっている
・未完了タスクが整理されている
・次に誰が何をするか曖昧でない
・必要なら理事会対応まで終わっている

■ 今やるべき一手
${nextMove}`
}

export default async function GoalPage({ params }: GoalPageProps) {
  const { id, caseId } = await params
  const data = await getCaseSupportDataOrNull(id, caseId)

  if (!data) {
    notFound()
  }

  const text = buildGoalText(data)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">案件のゴール表示</h1>
          <p className="mt-1 text-sm text-gray-600">
            何をもって終わりなのかを、担当変更しても分かる形にします。
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/properties/${id}/cases/${caseId}`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            案件詳細へ戻る
          </Link>
          <CopyTextBlockButton text={text} />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <textarea
          readOnly
          value={text}
          className="min-h-[360px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>
    </div>
  )
}