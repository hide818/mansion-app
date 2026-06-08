import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Kura — 担当者が辞めても止まらない管理会社へ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#070E1C',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* 上部：ロゴ + バッジ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* ロゴ（seal バリアント インライン） */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '14px' }}>
              <circle cx="24" cy="24" r="22" stroke="#1A3A5C" strokeWidth="1.5" />
              <circle cx="24" cy="24" r="19.5" fill="#0A1E3C" />
              <circle cx="24" cy="24" r="19.5" stroke="#1E3D5C" strokeWidth="0.75" />
              <circle cx="24" cy="3.5" r="1.8" fill="#D97706" />
              <circle cx="44.5" cy="24" r="1.8" fill="#D97706" />
              <circle cx="24" cy="44.5" r="1.8" fill="#D97706" />
              <circle cx="3.5" cy="24" r="1.8" fill="#D97706" />
              <circle cx="38.8" cy="9.2" r="1" fill="#D97706" opacity="0.35" />
              <circle cx="38.8" cy="38.8" r="1" fill="#D97706" opacity="0.35" />
              <circle cx="9.2" cy="38.8" r="1" fill="#D97706" opacity="0.35" />
              <circle cx="9.2" cy="9.2" r="1" fill="#D97706" opacity="0.35" />
              <line x1="16.5" y1="13" x2="16.5" y2="35" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="16.5" y1="23.5" x2="33" y2="13" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="16.5" y1="23.5" x2="33" y2="35" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="16.5" cy="23.5" r="2.5" fill="#D97706" />
            </svg>
            <span style={{ color: 'white', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Kura</span>
          </div>

          {/* バッジ */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid rgba(59,130,246,0.35)',
            background: 'rgba(59,130,246,0.1)',
            borderRadius: '100px',
            padding: '10px 22px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#60A5FA', marginRight: '10px' }} />
            <span style={{ color: '#93C5FD', fontSize: '17px', fontWeight: 600 }}>分譲マンション管理会社専用 AI</span>
          </div>
        </div>

        {/* 中央：メインコピー */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* ゴールドアクセントライン */}
          <div style={{ display: 'flex', width: '56px', height: '4px', background: '#D97706', borderRadius: '2px', marginBottom: '28px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
            <span style={{ color: 'white', fontSize: '68px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1px' }}>担当者が辞めても、</span>
            <span style={{ color: 'white', fontSize: '68px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1px' }}>業務は止まらない。</span>
          </div>

          <div style={{ display: 'flex' }}>
            <span style={{ color: 'rgba(148,163,184,1)', fontSize: '22px', lineHeight: 1.6 }}>
              総会議事録が 2時間 → 50分に。案件管理・AI議事録・引き継ぎ書自動生成で属人化を解消。
            </span>
          </div>
        </div>

        {/* 下部：フィーチャーバッジ + URL */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(['AI議事録', '引き継ぎ書自動生成', '案件タスク管理'] as const).map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  color: 'rgba(203,213,225,1)',
                  fontSize: '17px',
                  fontWeight: 500,
                }}
              >
                <span>{label}</span>
              </div>
            ))}
          </div>

          <span style={{ color: 'rgba(71,85,105,1)', fontSize: '16px' }}>kura-management.com</span>
        </div>

        {/* 装飾：右上に半透明の大きなロゴ */}
        <div style={{
          display: 'flex',
          position: 'absolute',
          right: '-40px',
          top: '-40px',
          opacity: 0.04,
        }}>
          <svg width="480" height="480" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="19.5" fill="white" />
            <line x1="16.5" y1="13" x2="16.5" y2="35" stroke="#070E1C" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="16.5" y1="23.5" x2="33" y2="13" stroke="#070E1C" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="16.5" y1="23.5" x2="33" y2="35" stroke="#070E1C" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  )
}
