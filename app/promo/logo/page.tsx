import KuraLogo from '@/app/components/KuraLogo'
import Link from 'next/link'

const VARIANTS = [
  {
    id: 'gate' as const,
    name: '蔵の門',
    tag: '案A',
    concept: '守護・格式・伝統',
    description:
      '切妻屋根（金）＋二本の柱（蔵の建物）がKを内包する。左柱がKのステム、腕が柱の間に渡る。ひと目で「蔵（くら）」と読める。50代の理事・決裁者に刺さる重厚感。稟議書・名刺・封筒で格が出る。',
    who: '大手・中堅管理会社の法人向け営業シーン',
    recommended: false,
  },
  {
    id: 'seal' as const,
    name: '判子印',
    tag: '案B',
    concept: '権威・信頼・日本的格式',
    description:
      '二重円の中にKが刻まれた判子（ハンコ）型。N/E/S/Wに金のドット（羅針盤・コンパスのモチーフ）。日本企業が「信頼できるベンダー」と判断する非言語シグナル。円はどんな背景にも置ける最強のコンテナ。',
    who: '稟議・会議資料・名刺で印象を残したい場合',
    recommended: true,
  },
  {
    id: 'negative' as const,
    name: '反転の蔵',
    tag: '案C',
    concept: '発見・深み・語れるロゴ',
    description:
      '大きなKの「腕の空間（負のスペース）」に、ひっそりと蔵の屋根が宿っている。気づいた人だけに伝わる仕掛け。「このロゴどういう意味？」と話が広がる。SNS・LPのファーストビューで差別化。',
    who: 'SNS・デジタル施策・スタートアップ感を出したい場合',
    recommended: false,
  },
  {
    id: 'bold' as const,
    name: '斜体重厚K',
    tag: '案D',
    concept: '動き・テック・変革',
    description:
      'グラデーション＋光のにじみ＋わずかな傾き。「前傾」のフォルムが変化・前進を連想させる。AI・SaaS・モダンテックのビジュアル言語で語れる。上アームの先端の青い光点が視線のアンカーになる。',
    who: 'プロモ動画・LP・X投稿・デジタルネイティブ文脈',
    recommended: false,
  },
]

type ShowcaseProps = {
  id: 'gate' | 'seal' | 'negative' | 'bold'
  name: string
  tag: string
  concept: string
  description: string
  who: string
  recommended: boolean
}

function LogoShowcase({ id: variant, name, tag, concept, description, who, recommended }: ShowcaseProps) {
  return (
    <div className={`relative rounded-2xl border bg-slate-900 p-7 ${recommended ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-800'}`}>
      {recommended && (
        <div className="absolute -top-3 left-6 rounded-full bg-amber-500 px-3 py-0.5 text-[11px] font-bold text-slate-900">
          デザイン推奨
        </div>
      )}

      {/* ヘッダー */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400">{tag}</p>
          <h2 className="mt-0.5 text-lg font-bold text-white">{name}</h2>
          <p className="text-xs text-slate-400">{concept}</p>
        </div>
        <KuraLogo size={72} variant={variant} />
      </div>

      {/* 説明 */}
      <p className="mb-4 text-sm leading-relaxed text-slate-300">{description}</p>
      <p className="mb-6 rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">向き：</span>{who}
      </p>

      {/* サイズバリエーション */}
      <div className="mb-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">全サイズ確認</p>
        <div className="flex flex-wrap items-end gap-5 rounded-xl bg-slate-950/60 p-4">
          {[16, 24, 32, 48, 80].map(s => (
            <div key={s} className="flex flex-col items-center gap-1.5">
              <KuraLogo size={s} variant={variant} />
              <span className="text-[9px] tabular-nums text-slate-600">{s}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* 実際の使用場面 */}
      <div className="space-y-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">実際の画面での表示</p>

        {/* サイドバーヘッダー（ダーク） */}
        <div className="flex items-center gap-2.5 rounded-lg bg-[#0B1F3C] px-3 py-2.5">
          <KuraLogo size={24} variant={variant} />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-300/50">管理会社専用 AI</p>
            <p className="text-sm font-extrabold leading-none text-white">Kura</p>
          </div>
        </div>

        {/* ナビバー（白背景） */}
        <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <KuraLogo size={28} variant={variant} />
            <span className="text-sm font-extrabold text-slate-900">Kura</span>
          </div>
          <span className="rounded-md bg-blue-600 px-3 py-1 text-xs font-bold text-white">無料で試す</span>
        </div>

        {/* ログイン画面（ダーク・センター） */}
        <div className="flex flex-col items-center gap-1.5 rounded-lg bg-[#0a1628] py-5">
          <KuraLogo size={56} variant={variant} />
          <p className="text-lg font-extrabold text-white">Kura</p>
          <p className="text-[10px] text-blue-400/50">管理会社専用AI</p>
        </div>

        {/* ファビコン相当（16px） */}
        <div className="flex items-center gap-3 rounded-lg bg-slate-800 px-3 py-2">
          <KuraLogo size={16} variant={variant} />
          <span className="text-xs text-slate-400">ブラウザタブ（ファビコン相当）</span>
        </div>
      </div>
    </div>
  )
}

export default function LogoPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">

        {/* ヘッダー */}
        <div className="mb-12">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">Kura Brand Identity — Ver 3</p>
          <h1 className="text-3xl font-black">ロゴ案 比較</h1>
          <p className="mt-2 text-slate-400">4案を実際の使用場面と全サイズで確認してください。</p>
        </div>

        {/* 4案グリッド */}
        <div className="grid gap-6 sm:grid-cols-2">
          {VARIANTS.map(v => (
            <LogoShowcase key={v.id} {...v} />
          ))}
        </div>

        {/* 一覧比較（横並び・ダーク） */}
        <div className="mt-14">
          <h2 className="mb-4 text-lg font-bold text-slate-300">4案を横並びで比較（ダーク）</h2>
          <div className="grid grid-cols-4 gap-4">
            {VARIANTS.map(v => (
              <div key={v.id} className="flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 py-7">
                <KuraLogo size={80} variant={v.id} />
                <p className="text-xs font-bold text-slate-400">{v.tag}</p>
                <p className="text-center text-[11px] text-slate-500 px-2">{v.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 白背景比較 */}
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-bold text-slate-300">白背景（稟議書・名刺）</h2>
          <div className="grid grid-cols-4 gap-4">
            {VARIANTS.map(v => (
              <div key={v.id} className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-7">
                <KuraLogo size={72} variant={v.id} />
                <p className="text-xs font-bold text-slate-500">{v.tag}</p>
                <p className="text-center text-[11px] text-slate-400 px-2">{v.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 選択後のアクション */}
        <div className="mt-12 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
          <h2 className="mb-2 text-lg font-bold">案を選んだら教えてください</h2>
          <p className="mb-4 text-sm text-slate-400">
            「案Bにする」と伝えるだけで、以下の全箇所に一括適用します。
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-3">
            {['サイドバーヘッダー', 'モバイルトップバー', 'ログイン画面', 'サインアップ画面', 'LP（ランディングページ）', 'プロモ動画(/promo)'].map(p => (
              <div key={p} className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-amber-500" />
                {p}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/promo" className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            ← プロモ動画
          </Link>
          <Link href="/lp" className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            LP →
          </Link>
        </div>
      </div>
    </div>
  )
}
