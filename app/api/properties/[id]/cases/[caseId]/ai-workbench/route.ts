import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODE_CONFIG = {
  pdf_estimate_analysis: {
    title: 'PDF見積解析',
    instruction: `
見積本文の貼り付けがある場合はそれを最優先で読み、次に案件情報と添付資料名を参考にしてください。
出力ルール：
【見積の要点】
【金額・範囲の読み取り】
【不足情報・確認したい点】
【理事会や上司へ説明する時の注意】
の順で出してください。
推測しすぎず、読み取れない部分は「要確認」と明記してください。
    `.trim(),
  },
  warranty_compare: {
    title: '保証内容比較',
    instruction: `
保証年数、保証対象、免責、注意点を比較しやすい形で出してください。
出力ルール：
【保証内容の比較】
【長い保証に見えても注意が必要な点】
【管理組合に説明するときの言い方】
【追加で確認すべき事項】
の順で出してください。
    `.trim(),
  },
  work_scope_compare: {
    title: '工事項目比較',
    instruction: `
工事項目、含む作業、含まない作業、曖昧な記載、抜けの可能性を比べてください。
出力ルール：
【工事項目の比較】
【各見積で差が大きい点】
【抜け漏れの可能性】
【発注前に確認すべき質問】
の順で出してください。
    `.trim(),
  },
  estimate_comparison_table: {
    title: '見積比較表生成',
    instruction: `
複数見積の比較表を、コピーしやすいテキスト形式で作成してください。
出力ルール：
【比較表】
項目名：内容
の並びで比較し、
最後に
【ひとことで違い】
【どの見積が向いていそうか】
を出してください。
    `.trim(),
  },
  estimate_comment_generator: {
    title: '見積比較コメント生成',
    instruction: `
上司・理事会・管理組合へ出しやすい、落ち着いた比較コメントを作ってください。
出力ルール：
【比較コメント案】
【採用候補にするならその理由】
【見送り候補にするならその理由】
【説明時の注意点】
の順で出してください。
    `.trim(),
  },
  board_proposal_draft: {
    title: '議案書ドラフト生成',
    instruction: `
理事会へ提出する議案書のたたき台を作ってください。
出力ルール：
【議案タイトル】
【背景】
【現状】
【提案内容】
【承認いただきたい事項】
【補足・注意点】
の順で出してください。
    `.trim(),
  },
  handover_report_draft: {
    title: '引き継ぎ報告書生成',
    instruction: `
担当変更や休暇前の引き継ぎ報告書を作ってください。
出力ルール：
【現在の状況】
【ここまでにやったこと】
【未完了タスク】
【注意点】
【次にやること】
【引き継ぎ相手へのひとこと】
の順で出してください。
    `.trim(),
  },
  document_polisher: {
    title: 'AI文書整形',
    instruction: `
ユーザーが貼った文書を、意味を変えずに、丁寧で実務向きの日本語へ整形してください。
出力ルール：
【整形後の本文】
をまず出し、その下に
【補足】
として、伝わりにくかった箇所や曖昧だった箇所があれば短く添えてください。
    `.trim(),
  },
  monthly_case_report: {
    title: 'AI月次報告生成',
    instruction: `
この案件単位の月次共有文を作ってください。
出力ルール：
【今月の状況】
【実施したこと】
【未解決事項】
【来月の予定】
【共有しておくべき注意点】
の順で出してください。
    `.trim(),
  },
  case_complaint_brief: {
    title: 'AIクレーム要約',
    instruction: `
クレーム性のある案件について、共有用の短い要約を作ってください。
出力ルール：
【クレームの概要】
【現在の対応状況】
【相手に配慮すべき点】
【再発防止の観点】
【社内共有用ひとこと】
の順で出してください。
    `.trim(),
  },
  task_priority_suggester: {
    title: 'タスク優先度自動提案',
    instruction: `
未完了タスクを優先順で整理し、先に触るべき理由を出してください。
出力ルール：
【最優先で触るタスク】
【優先度 中のタスク】
【後回しでよいタスク】
【優先順にした理由】
【今すぐ確認したいこと】
の順で出してください。
    `.trim(),
  },
  today_focus_extractor: {
    title: '今日やること自動抽出',
    instruction: `
この案件で今日やるべきことを抽出してください。
出力ルール：
【今日やること】
【今日やらなくてよいこと】
【最初に連絡したい相手】
【今日の動き方】
の順で出してください。
    `.trim(),
  },
  log_auto_tagging: {
    title: 'ログ自動タグ付け',
    instruction: `
最近のログを、電話、メール、現地、理事会、業者対応、社内共有などのタグで整理してください。
出力ルール：
【ログのタグ付け結果】
で番号付き一覧を出し、
最後に
【タグの偏りから見えること】
を出してください。
    `.trim(),
  },
  history_structuring: {
    title: '対応履歴の構造化',
    instruction: `
ログやタスクの流れを、誰が見ても追いやすい構造に整理してください。
出力ルール：
【発端】
【ここまでの経過】
【今の論点】
【決まっていること】
【未解決事項】
【次の一手】
の順で出してください。
    `.trim(),
  },
  case_story_builder: {
    title: '案件履歴のストーリー化',
    instruction: `
案件の流れを、途中参加の担当でも分かるストーリーとしてまとめてください。
出力ルール：
【案件の流れ】
【途中で重要だった転機】
【今どこまで来ているか】
【引き継ぎ相手がまず読むべき点】
の順で出してください。
    `.trim(),
  },
  complaint_recurrence_alert: {
    title: 'クレーム再発警告',
    instruction: `
この案件と同物件のクレーム履歴から、再発リスクを見立ててください。
出力ルール：
【再発リスクの判定】
【再発しそうな理由】
【再発を防ぐための先回り対応】
【共有しておくべき注意点】
の順で出してください。
    `.trim(),
  },
  similar_complaint_brief: {
    title: '過去類似クレーム表示',
    instruction: `
同物件のクレーム履歴から、似た傾向や似た論点を拾って共有向けに整理してください。
出力ルール：
【似たクレームの候補】
【共通点】
【今回特に注意したい違い】
【参考にできそうな対応】
の順で出してください。
    `.trim(),
  },
  board_submission_alert: {
    title: '理事会提出推奨アラート',
    instruction: `
この案件を理事会へ上げるべきかどうか、判断補助をしてください。
出力ルール：
【理事会へ上げるべきか】
【そう判断する理由】
【上げるなら何を論点にするか】
【まだ上げなくてよい場合の次アクション】
の順で出してください。
    `.trim(),
  },
  stale_update_alert: {
    title: '長期未更新案件アラート',
    instruction: `
最近の活動日時から見て、この案件が止まり気味かどうかを判定してください。
出力ルール：
【停滞リスクの判定】
【そう見える根拠】
【今やるべき1手】
【放置すると起きそうなこと】
の順で出してください。
    `.trim(),
  },
  priority_judgement: {
    title: '優先度自動判定',
    instruction: `
案件全体の優先度を、高・中・低で判定してください。
出力ルール：
【案件優先度の判定】
【その理由】
【急ぎで見るべき材料】
【今週中にやること】
の順で出してください。
    `.trim(),
  },
  vendor_evaluation_brief: {
    title: '業者評価メモ',
    instruction: `
この案件で関わっている業者の対応品質を、実務向けに短く整理してください。
出力ルール：
【対応の良かった点】
【気になった点】
【次回依頼時の注意】
【社内メモとして残したいこと】
の順で出してください。
感情的にならず、実務的に書いてください。
    `.trim(),
  },
  estimate_history_analysis: {
    title: '見積履歴分析',
    instruction: `
この案件の見積資料やログの流れから、見積判断のポイントを整理してください。
出力ルール：
【見積履歴から見える流れ】
【比較で見るべき点】
【金額以外で気にすべき点】
【次に確認したいこと】
の順で出してください。
    `.trim(),
  },
  success_pattern_extractor: {
    title: '成功対応パターン抽出',
    instruction: `
この案件の流れから、うまく進んだ対応パターンを抜き出してください。
出力ルール：
【うまくいった対応】
【なぜうまくいったか】
【他案件でも再利用できそうな型】
【社内共有用ひとこと】
の順で出してください。
    `.trim(),
  },
  knowledge_capture_note: {
    title: 'ナレッジ蓄積メモ',
    instruction: `
この案件から再利用できる知見を、ナレッジとして残せる形で整理してください。
出力ルール：
【案件から残すべき知見】
【再利用しやすい形にするとこうなる】
【似た案件で使える場面】
【保存タイトル案】
の順で出してください。
    `.trim(),
  },
  caution_message_builder: {
    title: '注意メッセージ生成',
    instruction: `
この案件で共有しておくべき注意事項を、短く分かりやすく整理してください。
出力ルール：
【注意メッセージ案】
【なぜ今注意が必要か】
【共有先ごとの言い方の差】
の順で出してください。
    `.trim(),
  },
  recommended_action_builder: {
    title: 'おすすめアクション生成',
    instruction: `
この案件で次に取るべき動きをおすすめ順で整理してください。
出力ルール：
【おすすめアクション】
【その順番にした理由】
【まず連絡すべき相手】
【今日中にやるならここまで】
の順で出してください。
    `.trim(),
  },
  update_notice_draft: {
    title: '更新通知文生成',
    instruction: `
進捗更新の通知文を、社内外どちらにも使いやすい形で作ってください。
出力ルール：
【通知文案】
【件名案】
【相手に合わせて柔らかくする場合】
【短め版】
の順で出してください。
    `.trim(),
  },
  deadline_notice_draft: {
    title: '期限通知文生成',
    instruction: `
期限が近い時の案内文や催促文を、角が立ちにくい形で作ってください。
出力ルール：
【通知文案】
【件名案】
【やわらかめの言い方】
【少し強めに伝える言い方】
の順で出してください。
    `.trim(),
  },
  assignee_notice_draft: {
    title: '担当者通知文生成',
    instruction: `
担当変更や担当依頼の通知文を、分かりやすく整理してください。
出力ルール：
【通知文案】
【件名案】
【相手が社内の場合の言い方】
【相手が社外の場合の言い方】
の順で出してください。
    `.trim(),
  },
  general_notification_draft: {
    title: '通知文ひな形生成',
    instruction: `
この案件の状況に合う汎用通知文を作ってください。
出力ルール：
【通知文案】
【件名案】
【短め版】
【状況別に言い換えるなら】
の順で出してください。
    `.trim(),
  },
} as const

type CaseAiWorkbenchMode = keyof typeof MODE_CONFIG

type RequestBody = {
  mode?: CaseAiWorkbenchMode
  sourceText?: string
}

function isValidMode(value: string): value is CaseAiWorkbenchMode {
  return value in MODE_CONFIG
}

function safeText(value: string | null | undefined) {
  return value ? value : '未設定'
}

function cutText(value: string | null | undefined, max = 240) {
  if (!value) return '未設定'
  return value.length > max ? `${value.slice(0, max)}...` : value
}

function latestDate(values: Array<string | null | undefined>) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value))

  if (timestamps.length === 0) return '活動日なし'

  return new Date(Math.max(...timestamps)).toISOString()
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { id, caseId } = await context.params
    const body = (await request.json().catch(() => null)) as RequestBody | null

    const mode = body?.mode
    const sourceText =
      typeof body?.sourceText === 'string' ? body.sourceText.trim() : ''

    if (!mode || !isValidMode(mode)) {
      return NextResponse.json({ error: 'mode が不正です。' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'ログインが必要です。' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role, display_name')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'company_id が取得できません。' },
        { status: 403 }
      )
    }

    const companyId = profile.company_id

    const { data: property } = await supabase
      .from('properties')
      .select('id, name, address')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (!property) {
      return NextResponse.json(
        { error: '物件が見つかりません。' },
        { status: 404 }
      )
    }

    const { data: caseItem } = await supabase
      .from('cases')
      .select(
        'id, title, status, assignee, board_status, board_agenda_title, board_decision_status, board_decision_date, board_decision_note, board_next_action, board_scheduled_for, created_at'
      )
      .eq('id', caseId)
      .eq('property_id', id)
      .maybeSingle()

    if (!caseItem) {
      return NextResponse.json(
        { error: '案件が見つかりません。' },
        { status: 404 }
      )
    }

    const [tasksResult, logsResult, filesResult, complaintsResult] =
      await Promise.all([
        supabase
          .from('tasks')
          .select('title, status, due_date, priority, created_at')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false })
          .limit(12),

        supabase
          .from('logs')
          .select('message, created_at, type')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false })
          .limit(15),

        supabase
          .from('case_files')
          .select('file_name, category, note, file_type, created_at')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false })
          .limit(15),

        supabase
          .from('complaints')
          .select('title, detail, status, created_at')
          .eq('property_id', id)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(8),
      ])

    const tasks = tasksResult.data ?? []
    const logs = logsResult.data ?? []
    const files = filesResult.data ?? []
    const complaints = complaintsResult.data ?? []

    const modeInfo = MODE_CONFIG[mode]

    const taskText =
      tasks.length > 0
        ? tasks
            .map((task, index) => {
              return `${index + 1}. タイトル=${safeText(task.title)} / 状態=${safeText(task.status)} / 期限=${safeText(task.due_date)} / 優先度=${safeText(task.priority)} / 作成日=${safeText(task.created_at)}`
            })
            .join('\n')
        : 'タスクなし'

    const logText =
      logs.length > 0
        ? logs
            .map((log, index) => {
              return `${index + 1}. 日時=${safeText(log.created_at)} / 種別=${safeText(log.type)} / 内容=${cutText(log.message, 220)}`
            })
            .join('\n')
        : 'ログなし'

    const fileText =
      files.length > 0
        ? files
            .map((file, index) => {
              return `${index + 1}. ファイル名=${safeText(file.file_name)} / 種別=${safeText(file.category)} / 形式=${safeText(file.file_type)} / メモ=${cutText(file.note, 120)} / 登録日=${safeText(file.created_at)}`
            })
            .join('\n')
        : '添付資料なし'

    const complaintText =
      complaints.length > 0
        ? complaints
            .map((item, index) => {
              return `${index + 1}. 件名=${safeText(item.title)} / 状態=${safeText(item.status)} / 内容=${cutText(item.detail, 160)} / 登録日=${safeText(item.created_at)}`
            })
            .join('\n')
        : 'クレーム履歴なし'

    const latestActivityAt = latestDate([
      ...tasks.map((item) => item.created_at),
      ...logs.map((item) => item.created_at),
      ...files.map((item) => item.created_at),
      ...complaints.map((item) => item.created_at),
      caseItem.created_at,
      caseItem.board_decision_date,
      caseItem.board_scheduled_for,
    ])

    const systemPrompt = `
あなたはマンション管理会社向けの実務AIです。
現場担当・上司・理事会・管理組合がそのまま使える日本語を出してください。
以下を必ず守ってください。

- 日本語のみで出力する
- 余計な英語見出しは使わない
- ふわっとした抽象論ではなく、現場でコピペできる実務文にする
- 推測しすぎない
- 情報が弱い部分は「要確認」と明記する
- 不必要に長くしすぎない
- ただし短すぎて実務で使えない文にはしない

${modeInfo.instruction}
    `.trim()

    const userPrompt = `
【機能名】
${modeInfo.title}

【本日】
${new Date().toISOString()}

【物件情報】
物件名：${safeText(property.name)}
住所：${safeText(property.address)}

【案件情報】
案件名：${safeText(caseItem.title)}
状態：${safeText(caseItem.status)}
担当者：${safeText(caseItem.assignee)}
理事会状態：${safeText(caseItem.board_status)}
議案タイトル：${safeText(caseItem.board_agenda_title)}
理事会予定日：${safeText(caseItem.board_scheduled_for)}
理事会決定状態：${safeText(caseItem.board_decision_status)}
理事会決定日：${safeText(caseItem.board_decision_date)}
理事会メモ：${cutText(caseItem.board_decision_note, 180)}
次アクション：${cutText(caseItem.board_next_action, 180)}
案件作成日：${safeText(caseItem.created_at)}
最近の活動日：${latestActivityAt}

【タスク一覧】
${taskText}

【最近のログ】
${logText}

【添付資料一覧】
${fileText}

【最近のクレーム履歴】
${complaintText}

【ユーザーが追加で貼った本文】
${sourceText || '追加本文なし'}

【指示】
この案件の文脈を踏まえて、${modeInfo.title} を作成してください。
入力本文がある場合は、それを最優先で読んでください。
入力本文がない場合は、案件情報・タスク・ログ・添付資料・クレーム履歴から読み取れる範囲で作ってください。
    `.trim()

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await client.responses.create({
      model: 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }],
        },
      ],
    })

    const text = response.output_text?.trim()

    if (!text) {
      return NextResponse.json(
        { error: 'AIから文章を取得できませんでした。' },
        { status: 500 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'サーバーエラーが発生しました。'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}