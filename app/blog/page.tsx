import Link from 'next/link'
import { posts } from './posts/index'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kuraブログ — マンション管理会社の業務効率化・DX情報',
  description: 'マンション管理会社向けに、議事録作成・引き継ぎ・属人化解消・DX推進に関する実践的な情報をお届けします。',
  alternates: { canonical: 'https://kura-management.com/blog' },
  openGraph: {
    title: 'Kuraブログ — マンション管理会社の業務効率化・DX情報',
    description: 'マンション管理会社向けに、議事録作成・引き継ぎ・属人化解消・DX推進に関する実践的な情報をお届けします。',
    url: 'https://kura-management.com/blog',
    siteName: 'Kura',
    locale: 'ja_JP',
    type: 'website',
  },
}


function getReadingMinutes(description: string): number {
  return Math.max(4, Math.min(10, Math.round(description.length / 18)))
}

export default function BlogPage() {
  const sorted = [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/lp" className="text-lg font-extrabold text-slate-900 tracking-tight">
            Kura
          </Link>
          <Link href="/lp" className="text-sm text-slate-500 hover:text-slate-900">
            サービスTOPへ →
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">Blog</p>
          <h1 className="text-3xl font-extrabold text-slate-900">
            マンション管理会社の<br />業務効率化・DX情報
          </h1>
          <p className="mt-4 text-slate-500">
            フロント担当者の現場で役立つ、議事録・引き継ぎ・属人化解消の実践情報をお届けします。
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((post) => {
            const minutes = getReadingMinutes(post.description)
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              >

                {/* Card content */}
                <div className="flex flex-col flex-1 p-5">
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600">
                      {post.category}
                    </span>
                    <time className="text-xs text-slate-400">{post.publishedAt}</time>
                    <span className="ml-auto text-xs text-slate-400">約{minutes}分</span>
                  </div>
                  <h2 className="mb-2 text-sm font-bold text-slate-900 group-hover:text-blue-700 leading-snug line-clamp-3">
                    {post.title}
                  </h2>
                  <p className="mt-auto pt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                  <div className="mt-3 text-xs font-semibold text-blue-600 group-hover:underline">
                    続きを読む →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-16 rounded-2xl bg-blue-600 p-8 text-white text-center">
          <p className="mb-2 text-sm font-semibold opacity-75">Kura — 管理会社専用AI</p>
          <h2 className="mb-3 text-2xl font-extrabold">記事で紹介した業務を自動化するツール</h2>
          <p className="mb-6 text-sm opacity-80">AI議事録・案件管理・引き継ぎ書自動生成を1つにまとめたSaaS</p>
          <Link
            href="/lp"
            style={{ color: '#2563eb', backgroundColor: '#ffffff' }}
            className="inline-block rounded-xl px-6 py-3 text-sm font-bold hover:bg-blue-50"
          >
            詳細を見る →
          </Link>
        </div>
      </main>
    </div>
  )
}
