type Variant = 'gate' | 'seal' | 'negative' | 'bold'

type Props = {
  size?: number
  variant?: Variant
}

/**
 * gate     — 蔵の門。建物のシルエットがKを内包する。「記録の守護者」
 * seal     — 判子印。円の中にK。日本的な権威・格式。
 * negative — 反転の蔵。Kの腕の空白に屋根が宿る。「隠されたもの」
 * bold     — 斜体重厚K。力強く前傾。動き・変革・テック。
 */
export default function KuraLogo({ size = 40, variant = 'gate' }: Props) {
  const uid = `k-${variant}-${size}`

  // ─── 蔵の門 ──────────────────────────────────────────────────
  if (variant === 'gate') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 暗い背景 */}
        <rect width="48" height="48" rx="10" fill="#060D1A" />

        {/* 建物本体（左柱・右柱・床） */}
        {/* 左柱 = K のステム */}
        <rect x="5" y="18" width="11" height="26" rx="2" fill="#C8D4E8" />
        {/* 右柱 */}
        <rect x="32" y="18" width="11" height="26" rx="2" fill="#2A4060" />
        {/* 床（基礎） */}
        <rect x="3" y="43" width="42" height="3" rx="1.5" fill="#1A2D44" />

        {/* 屋根ライン（蔵の切妻屋根）外枠 */}
        <path d="M3 18 L24 5 L45 18" stroke="#D97706" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
        {/* 屋根ライン 内側（瓦の重なり） */}
        <path d="M6 19.5 L24 7.5 L42 19.5" stroke="#D97706" strokeWidth="1"
          strokeOpacity="0.4" strokeLinejoin="round" strokeLinecap="round" />

        {/* K の上アーム（左柱から右柱へ、上に向かう） */}
        <line x1="16" y1="31" x2="36" y2="18" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
        {/* K の下アーム（左柱から右柱へ、下に向かう） */}
        <line x1="16" y1="31" x2="36" y2="44" stroke="white" strokeWidth="4.5" strokeLinecap="round" />

        {/* 関節点（金のアクセント） */}
        <circle cx="16" cy="31" r="3" fill="#D97706" />
        {/* 関節を発光させるハロー */}
        <circle cx="16" cy="31" r="5.5" fill="#D97706" opacity="0.15" />
      </svg>
    )
  }

  // ─── 判子印 ──────────────────────────────────────────────────
  if (variant === 'seal') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 外リング */}
        <circle cx="24" cy="24" r="22" stroke="#1A3A5C" strokeWidth="1.5" />
        {/* 内円（塗り） */}
        <circle cx="24" cy="24" r="19.5" fill="#0A1E3C" />
        {/* 内リング（細い装飾） */}
        <circle cx="24" cy="24" r="19.5" stroke="#1E3D5C" strokeWidth="0.75" />

        {/* 羅針盤の金ドット（N/E/S/W） */}
        <circle cx="24" cy="3.5" r="1.8" fill="#D97706" />
        <circle cx="44.5" cy="24" r="1.8" fill="#D97706" />
        <circle cx="24" cy="44.5" r="1.8" fill="#D97706" />
        <circle cx="3.5" cy="24" r="1.8" fill="#D97706" />
        {/* 対角線の薄いドット */}
        <circle cx="38.8" cy="9.2" r="1" fill="#D97706" opacity="0.35" />
        <circle cx="38.8" cy="38.8" r="1" fill="#D97706" opacity="0.35" />
        <circle cx="9.2" cy="38.8" r="1" fill="#D97706" opacity="0.35" />
        <circle cx="9.2" cy="9.2" r="1" fill="#D97706" opacity="0.35" />

        {/* K の縦バー */}
        <line x1="16.5" y1="13" x2="16.5" y2="35" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        {/* K の上アーム（関節を黄金比で上寄りに） */}
        <line x1="16.5" y1="23.5" x2="33" y2="13" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        {/* K の下アーム */}
        <line x1="16.5" y1="23.5" x2="33" y2="35" stroke="white" strokeWidth="3.5" strokeLinecap="round" />

        {/* 関節の金ドット */}
        <circle cx="16.5" cy="23.5" r="2.5" fill="#D97706" />
      </svg>
    )
  }

  // ─── 反転の蔵（Kの空間に屋根） ───────────────────────────────
  if (variant === 'negative') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-stemgrad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>

        {/* 背景 */}
        <rect width="48" height="48" rx="10" fill="#060D1A" />

        {/* K — 縦バー（グラデーション） */}
        <line x1="12" y1="7" x2="12" y2="41" stroke={`url(#${uid}-stemgrad)`}
          strokeWidth="5" strokeLinecap="round" />

        {/* K — 上アーム */}
        <line x1="12" y1="24" x2="38" y2="7" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
        {/* K — 下アーム */}
        <line x1="12" y1="24" x2="38" y2="41" stroke="white" strokeWidth="4.5" strokeLinecap="round" />

        {/*
          ── ここがキモ ──
          K の腕の「空間（負のスペース）」に蔵の屋根が宿る。
          腕の開口部（三角領域）の中央あたりに小さな金の切妻屋根。
          三角領域の重心: ((12+38+38)/3, (24+7+41)/3) = (29.3, 24)
          屋根の山: (25, 18)  裾: (20, 26) と (30, 26) あたり
        */}
        <path d="M19 27 L25.5 18 L32 27" fill="none"
          stroke="#D97706" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {/* 屋根の内側ライン（奥行き） */}
        <path d="M20.5 26 L25.5 19.5 L30.5 26" fill="none"
          stroke="#D97706" strokeWidth="1" strokeOpacity="0.45" strokeLinejoin="round" />

        {/* 関節（白い光点） */}
        <circle cx="12" cy="24" r="3" fill="white" />
        <circle cx="12" cy="24" r="5.5" fill="white" opacity="0.1" />
      </svg>
    )
  }

  // ─── 斜体重厚K ────────────────────────────────────────────────
  // variant === 'bold'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* グロウフィルター */}
        <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Kの青白グラデーション */}
        <linearGradient id={`${uid}-kg`} x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="45%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        {/* 背景グラデーション */}
        <radialGradient id={`${uid}-bg`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#0F2347" />
          <stop offset="100%" stopColor="#04080F" />
        </radialGradient>
      </defs>

      {/* 背景 */}
      <rect width="48" height="48" rx="10" fill={`url(#${uid}-bg)`} />

      {/* K本体（右に5度傾いた太いK） — transform で skew */}
      <g transform="skewX(-6)" filter={`url(#${uid}-glow)`}>
        {/* 縦バー */}
        <line x1="14" y1="7" x2="14" y2="41" stroke={`url(#${uid}-kg)`}
          strokeWidth="6.5" strokeLinecap="round" />
        {/* 上アーム */}
        <line x1="14" y1="24" x2="38" y2="7" stroke={`url(#${uid}-kg)`}
          strokeWidth="5.5" strokeLinecap="round" />
        {/* 下アーム */}
        <line x1="14" y1="24" x2="38" y2="41" stroke={`url(#${uid}-kg)`}
          strokeWidth="5.5" strokeLinecap="round" />
      </g>

      {/* 上アームの先端（鮮やかな青の光点） */}
      <circle cx="37" cy="8" r="3.5" fill="#93C5FD" opacity="0.9" />
      <circle cx="37" cy="8" r="6" fill="#3B82F6" opacity="0.25" />

      {/* 関節の白い光点 */}
      <circle cx="14" cy="24" r="3" fill="white" opacity="0.95"
        filter={`url(#${uid}-glow)`} />
    </svg>
  )
}
