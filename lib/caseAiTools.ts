import OpenAI from 'openai'
import {
  formatDate,
  formatDateTime,
  getCaseSupportDataOrNull,
} from '@/lib/caseSupportData'

type OpenAIResponseContent = {
  text?: string
}

type OpenAIResponseItem = {
  content?: OpenAIResponseContent[]
}

type OpenAIResponseShape = {
  output_text?: string
  output?: OpenAIResponseItem[]
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY_MISSING')
  }

  return new OpenAI({ apiKey })
}

function extractOutputText(response: OpenAIResponseShape) {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim()
  }

  const texts: string[] = []

  for (const item of response?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string' && content.text.trim()) {
        texts.push(content.text.trim())
      }
    }
  }

  return texts.join('\n').trim()
}

function buildCaseSourceText(
  data: NonNullable<Awaited<ReturnType<typeof getCaseSupportDataOrNull>>>
) {
  const incompleteTasks = data.tasks.filter((task) => task.status !== '完了')

  const tasksText =
    data.tasks.length === 0
      ? 'タスクなし'
      : data.tasks
          .slice(0, 20)
          .map((task, index) => {
            return `${index + 1}. タイトル: ${task.title || '未設定'} / 状態: ${task.status || '未設定'} / 優先度: ${task.priority || '未設定'} / 期限: ${formatDate(task.due_date)}`
          })
          .join('\n')

  const logsText =
    data.logs.length === 0
      ? 'ログなし'
      : data.logs
          .slice(0, 15)
          .map((log, index) => {
            const message = (log.message || '').replace(/\s+/g, ' ').trim()
            return `${index + 1}. ${formatDateTime(log.created_at)} / ${log.type || '未設定'} / ${message || '内容未入力'}`
          })
          .join('\n')

  const caseFilesText =
    data.caseFiles.length === 0
      ? '添付資料なし'
      : data.caseFiles
          .slice(0, 15)
          .map((file, index) => {
            return `${index + 1}. ファイル名: ${file.file_name || '未設定'} / 種別: ${file.category || '未設定'} / 備考: ${file.note || '未設定'} / 登録日: ${formatDateTime(file.created_at)}`
          })
          .join('\n')

  const relatedCasesText =
    data.relatedCases.length === 0
      ? '比較用の他案件なし'
      : data.relatedCases
          .slice(0, 10)
          .map((item, index) => {
            return `${index + 1}. 案件名: ${item.title || '未設定'} / 状態: ${item.status || '未設定'} / 担当: ${item.assignee || '未設定'} / 理事会: ${item.board_status || '未設定'} / 登録日: ${formatDateTime(item.created_at)}`
          })
          .join('\n')

  return `【案件データ】
物件名: ${data.property.name || '未設定'}
住所: ${data.property.address || '未設定'}
案件名: ${data.caseItem.title || '未設定'}
案件ステータス: ${data.caseItem.status || '未設定'}
担当者: ${data.caseItem.assignee || '未設定'}
案件作成日: ${formatDateTime(data.caseItem.created_at)}
理事会ステータス: ${data.caseItem.board_status || '未設定'}
理事会上程予定: ${data.caseItem.board_scheduled_for || '未設定'}
議案タイトル: ${data.caseItem.board_agenda_title || '未設定'}
決定状況: ${data.caseItem.board_decision_status || '未設定'}
決定日: ${formatDate(data.caseItem.board_decision_date)}
決定メモ: ${data.caseItem.board_decision_note || '未設定'}
次アクション: ${data.caseItem.board_next_action || '未設定'}

【未完了タスク件数】
${incompleteTasks.length} 件

【タスク一覧】
${tasksText}

【ログ一覧】
${logsText}

【添付資料一覧】
${caseFilesText}

【比較用の他案件】
${relatedCasesText}`
}

export async function generateCaseAiText(params: {
  propertyId: string
  caseId: string
  toolTitle: string
  instruction: string
}) {
  const data = await getCaseSupportDataOrNull(params.propertyId, params.caseId)

  if (!data) {
    throw new Error('NOT_FOUND')
  }

  const client = getOpenAIClient()
  const sourceText = buildCaseSourceText(data)

  const response = await client.responses.create({
    model: 'gpt-5.4-mini',
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text:
              'あなたはマンション管理会社向けSaaSの実務補助AIです。日本語で、現場でそのまま使える文章だけを出してください。抽象論は禁止。見出しを適度に使い、読みやすく整理してください。',
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `【機能名】
${params.toolTitle}

【出力指示】
${params.instruction}

【参照データ】
${sourceText}`,
          },
        ],
      },
    ],
  })

  const text = extractOutputText(response as OpenAIResponseShape)

  if (!text) {
    throw new Error('EMPTY_AI_RESPONSE')
  }

  return text
}
