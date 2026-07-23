import Link from 'next/link'
import KuraLogo from '@/app/components/KuraLogo'

export const metadata = {
  title: '使い方ガイド | Kura',
  description: 'Kuraの使い方ガイド。物件登録・AI議事録・案件管理・引き継ぎ書・データインポートの操作方法を解説します。',
}

const SECTIONS = [
  {
    id: 'start',
    title: 'はじめてガイド',
    subtitle: 'Kuraを使い始めるまでの全体の流れ',
    color: 'border-blue-200 bg-blue-50',
    numColor: 'bg-blue-600',
    steps: [
      {
        step: '1',
        title: 'アカウントにログイン',
        body: '設定完了メールに記載のURLからサインアップし、メールアドレスとパスワードを設定してください。ログイン後はダッシュボードが表示されます。',
      },
      {
        step: '2',
        title: '物件を登録する',
        body: '左メニューの「案件・タスク」→「物件一覧」から物件を追加します。物件名・住所・戸数を入力するだけで登録完了です。既存のExcelデータがある場合は「管理者」→「CSVインポート」機能を使うと一括登録できます（後述）。',
      },
      {
        step: '3',
        title: 'スタッフを招待する（管理者のみ）',
        body: '左メニューの「管理者」→「ユーザー管理」からスタッフのメールアドレスを入力して招待できます。招待されたスタッフはメールのリンクからアカウントを作成します。',
      },
      {
        step: '4',
        title: 'タスクを登録して使い始める',
        body: '物件を選択→案件を作成→タスクを追加、という流れで業務を登録します。担当者・期限を設定すると、毎朝8時にアラートメールが届きます。',
      },
    ],
  },
  {
    id: 'property',
    title: '物件の登録方法',
    subtitle: 'CSVインポートで物件を一括登録します',
    color: 'border-emerald-200 bg-emerald-50',
    numColor: 'bg-emerald-600',
    steps: [
      {
        step: '1',
        title: '左メニュー「管理者」→「CSVインポート」→「物件」タブ',
        body: 'テンプレートCSVをダウンロードし、Excelで物件名・住所・戸数を入力してアップロードします。物件登録はCSVインポートで行います。',
        note: 'CSVはExcelで「CSV UTF-8（コンマ区切り）」形式で保存してください。',
      },
      {
        step: '確認',
        title: '物件一覧で登録内容を確認',
        body: '左メニュー「案件・タスク」→「物件一覧」で登録した物件が一覧表示されます。物件名をクリックすると詳細・案件・居住者情報が確認できます。',
      },
    ],
  },
  {
    id: 'import',
    title: '居住者・点検データの読み込み方',
    subtitle: 'ExcelのデータをCSV形式でKuraに取り込む方法',
    color: 'border-purple-200 bg-purple-50',
    numColor: 'bg-purple-600',
    steps: [
      {
        step: '1',
        title: 'テンプレートをダウンロード',
        body: '左メニュー「管理者」→「CSVインポート」を開き、「居住者」または「法定点検」タブを選択します。「テンプレートをダウンロード」ボタンを押してExcelファイルを取得してください。',
      },
      {
        step: '2',
        title: 'Excelにデータを入力',
        body: 'ダウンロードしたCSVをExcelで開き、1行目（ヘッダー行）はそのままにして、2行目以降に実際のデータを入力します。物件名は正確に（登録済みの物件名と完全一致）入力してください。',
        note: '居住者インポートは先に物件の登録を完了させてから行ってください。',
      },
      {
        step: '3',
        title: 'CSV形式で保存',
        body: 'Excelの「名前を付けて保存」→「CSV UTF-8（コンマ区切り）」を選択して保存します。※通常の「CSV」ではなく「UTF-8」を選ぶことが重要です。',
      },
      {
        step: '4',
        title: 'アップロードして完了',
        body: 'Kuraのインポート画面でCSVファイルを選択し「インポート実行」を押します。成功件数とエラーが表示されます。エラーがある行は内容を確認して修正し、再度インポートしてください。',
      },
    ],
  },
  {
    id: 'minutes',
    title: 'AI議事録の使い方',
    subtitle: '総会・理事会の音声を録音してアップロードするだけ',
    color: 'border-orange-200 bg-orange-50',
    numColor: 'bg-orange-600',
    steps: [
      {
        step: '1',
        title: '会議を録音する',
        body: 'スマートフォンの録音アプリやICレコーダーで会議を録音します。対応フォーマット：MP3・M4A・WAV・OGG。録音時間に制限はありません（長時間は自動で分割処理します）。',
        note: '雑音が少ないほど精度が上がります。できるだけ話者に近い場所で録音してください。',
      },
      {
        step: '2',
        title: 'AI議事録を開く',
        body: 'ダッシュボードの「AI議事録を作成」ボタン、または左メニューの「AI議事録」→「AI議事録を作成」をクリックします。',
      },
      {
        step: '3',
        title: '物件・会議情報を入力',
        body: '対象物件・会議種別（定期総会・臨時総会・理事会など）・開催日を入力します。自社フォーマットを登録している場合はここで選択します。',
      },
      {
        step: '4',
        title: '音声ファイルをアップロード',
        body: '録音ファイルを選択してアップロードします。AIが自動で文字起こし・議事録生成・タスク抽出を行います。処理時間は音声の長さによりますが、1時間の音声で約5〜10分程度です。',
      },
      {
        step: '5',
        title: '内容を確認・修正して印刷',
        body: '生成された議事録を確認し、必要に応じて修正します。「印刷」ボタンで印刷・保存できます。抽出された宿題は「タスクとして追加」または「案件追加」ボタンで案件・タスクに登録できます。',
      },
    ],
  },
  {
    id: 'cases',
    title: '案件・タスク管理の使い方',
    subtitle: '全物件の業務をチームで一元管理する',
    color: 'border-slate-200 bg-slate-50',
    numColor: 'bg-slate-700',
    steps: [
      {
        step: '案件とは',
        title: '物件で発生したひとまとまりの業務',
        body: '例：「○○マンション エレベーター修繕対応」「△△レジデンス 滞納管理費督促」など。1つの案件に複数のタスク（やること）をぶら下げます。',
      },
      {
        step: '1',
        title: '案件を作成する',
        body: '物件を選択→「案件を追加」ボタンから案件を作成します。件名・種別・担当者・優先度を設定してください。',
      },
      {
        step: '2',
        title: 'タスクを追加する',
        body: '案件を開いて「タスクを追加」します。タスクには担当者・期限を必ず設定してください。期限が設定されたタスクは毎朝8時にアラートメールが届きます。',
      },
      {
        step: '3',
        title: '進捗を更新する',
        body: 'タスクのステータスを「未着手→進行中→完了」と更新します。完了にしたタスクはアラート対象から外れます。',
      },
      {
        step: '確認',
        title: '全案件を一覧で把握',
        body: '左メニュー「案件・タスク」→「案件一覧」から全物件の案件を横断的に確認できます。期限切れ・停滞中の案件は赤・黄色でハイライトされます。',
      },
    ],
  },
  {
    id: 'handover',
    title: 'AI引き継ぎ書の使い方',
    subtitle: '担当者交代時の情報断絶をゼロにする',
    color: 'border-teal-200 bg-teal-50',
    numColor: 'bg-teal-600',
    steps: [
      {
        step: '1',
        title: 'AI引き継ぎ書を開く',
        body: 'ダッシュボードの「AI引き継ぎ書を作成」ボタン、または左メニューの「AI引き継ぎ書」→「AI引き継ぎ書を作成」をクリックします。',
      },
      {
        step: '2',
        title: '対象物件を選ぶ',
        body: '引き継ぎ書を作成したい物件を選択します。その物件に登録されている案件・タスク・居住者情報・特記事項をAIが自動で収集します。',
      },
      {
        step: '3',
        title: '内容を確認・修正して保存',
        body: '物件を選択すると、案件・タスク・クレーム履歴など基本情報が自動入力されます。内容を確認・加筆して「保存する」ボタンで保存してください。',
      },
      {
        step: '4',
        title: '印刷して新担当者と共有',
        body: '保存した引き継ぎ書は「引き継ぎ書一覧」から開き、印刷ページから印刷・保存できます。新担当者と共有してください。',
        note: '引き継ぎ書は保存しておくことができます。過去の引き継ぎ書も履歴として残ります。',
      },
    ],
  },
  {
    id: 'users',
    title: 'ユーザーの追加方法',
    subtitle: '管理者のみ操作できます',
    color: 'border-rose-200 bg-rose-50',
    numColor: 'bg-rose-600',
    steps: [
      {
        step: '1',
        title: '管理者メニューを開く',
        body: '左メニューの「管理者」→「ユーザー管理」を開きます。現在登録されているスタッフの一覧が表示されます。',
      },
      {
        step: '2',
        title: '招待リンクを発行する',
        body: '「招待リンクを発行」ボタンを押し、メールアドレス（任意）と付与する権限（管理者・一般・閲覧のみ）を選択します。発行された招待リンクをコピーして、スタッフへ直接お送りください。',
        note: '権限について：「一般」はデータの作成・編集が可能。「閲覧のみ」は読み取り専用です。',
      },
      {
        step: '3',
        title: 'スタッフがアカウントを作成',
        body: 'スタッフは受け取った招待リンクからサインアップします。パスワードを設定するだけで、御社のデータにアクセスできるようになります。',
      },
      {
        step: '4',
        title: 'タスクを担当者に割り当てる',
        body: 'スタッフがアカウントを作成すると、タスクの「担当者」として選択できるようになります。担当者が設定されたタスクは期限のアラートメールが届くようになります。',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ヘッダー */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KuraLogo size={32} variant="seal" />
            <div>
              <span className="text-lg font-extrabold text-slate-900">Kura</span>
              <span className="ml-2 text-sm text-slate-400">使い方ガイド</span>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← ダッシュボードへ</Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">

        {/* 目次 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">目次</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* よくある質問ショートカット */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">お困りのことがあれば</p>
          <p className="text-sm text-blue-600">
            このガイドで解決しない場合は <a href="mailto:noreply@kura-management.com" className="underline font-semibold">サポートへメール</a> でご連絡ください。3営業日以内にご返信します。
          </p>
        </div>

        {/* 各セクション */}
        {SECTIONS.map(section => (
          <div key={section.id} id={section.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden scroll-mt-6">

            {/* セクションヘッダー */}
            <div className={`border-b px-6 py-5 ${section.color}`}>
              <h2 className="text-xl font-extrabold text-slate-900">{section.title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{section.subtitle}</p>
            </div>

            {/* ステップ */}
            <div className="divide-y divide-slate-100">
              {section.steps.map((item, i) => (
                <div key={i} className="flex gap-5 px-6 py-5">
                  <div className="shrink-0 pt-0.5">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${section.numColor}`}>
                      {item.step}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 mb-1">{item.title}</p>
                    <p className="text-sm text-slate-500 leading-7">{item.body}</p>
                    {item.note && (
                      <div className="mt-2.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                        <p className="text-xs text-amber-700"><span className="font-bold">注意：</span>{item.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        ))}

        {/* FAQ */}
        <div id="faq" className="rounded-2xl border border-slate-200 bg-white overflow-hidden scroll-mt-6">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
            <h2 className="text-xl font-extrabold text-slate-900">よくあるご質問</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              {
                q: 'スタッフが増えた場合、追加費用はかかりますか？',
                a: 'トライアル期間中（3ヶ月）は無料です。有料プランのユーザー数上限はプランによって異なります。スタンダードプランは10名まで、プロプランは無制限です。',
              },
              {
                q: '音声ファイルのサイズに制限はありますか？',
                a: '1ファイルあたり最大500MBまでです。長時間の録音は自動で分割処理しますので、3時間を超える会議でも問題なく処理できます。',
              },
              {
                q: 'スマートフォンからも使えますか？',
                a: 'はい。スマートフォン・タブレットのブラウザからアクセスできます。また、毎朝8時に期限切れ・今日期限のタスクがメールで届きますので、外出先でも確認できます。',
              },
              {
                q: 'データのバックアップはどうなっていますか？',
                a: 'データはISO27001認定のクラウド基盤（Supabase）に保存されており、自動バックアップが行われています。お客様側での別途バックアップ作業は不要です。',
              },
              {
                q: 'CSVインポートで失敗した場合はどうすればよいですか？',
                a: 'インポート結果画面にエラーの詳細が表示されます。多くの場合、物件名の不一致やExcelの保存形式（UTF-8指定忘れ）が原因です。エラー内容を確認して修正してから再度インポートしてください。',
              },
              {
                q: 'パスワードを忘れた場合は？',
                a: 'ログイン画面の「パスワードを忘れた方」からリセットメールを送ることができます。登録メールアドレスにリセット用リンクが届きます。',
              },
            ].map((item, i) => (
              <div key={i} className="px-6 py-5">
                <p className="font-bold text-slate-800 mb-1.5">Q. {item.q}</p>
                <p className="text-sm text-slate-500 leading-7">A. {item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* フッター */}
        <div className="text-center py-6">
          <p className="text-xs text-slate-400">
            解決しない場合は <a href="mailto:noreply@kura-management.com" className="text-blue-500 hover:underline">サポートへご連絡</a> ください。
          </p>
          <p className="text-xs text-slate-300 mt-1">© 2024 Kura. All rights reserved.</p>
        </div>

      </div>
    </div>
  )
}
