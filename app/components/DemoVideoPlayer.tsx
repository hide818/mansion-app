'use client'

import { useState } from 'react'

export default function DemoVideoPlayer({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false)
  const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.12)] relative bg-black"
      style={{ paddingBottom: '56.25%' }}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <button
          onClick={() => setPlaying(true)}
          aria-label="動画を再生する"
          className="absolute inset-0 w-full h-full group"
        >
          {/* サムネイル */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt="Kuraデモ動画サムネイル"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
          />
          {/* 暗幕 */}
          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
          {/* 再生ボタン */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg group-hover:scale-105 transition-transform">
              <svg className="h-7 w-7 text-[#1C2B38] translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}
