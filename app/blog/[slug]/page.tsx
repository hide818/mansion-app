import { notFound } from 'next/navigation'
import Link from 'next/link'
import { posts } from '../posts/index'
import { ArticleRikaikaigi } from '../posts/rikaikaigi-gijiroku-kakikata'
import { ArticleSogai } from '../posts/sogai-gijiroku-sakusei'
import { ArticleZokuninuka } from '../posts/zokuninuka-kaisho'
import { ArticleHikitsugisho } from '../posts/hikitsugisho-template'
import { ArticleKanriDx } from '../posts/kanri-kaisha-dx-guide'
import { ArticleKanriKaishaSaaS } from '../posts/kanri-kaisha-saas-hikaku'
import { ArticleRijiKaiAI } from '../posts/riji-kai-ai-gijiroku'
import { ArticleNinmuHikitsugi } from '../posts/kanri-kaisha-ninmu-hikitsugi'
import { ArticleAnkenKanri } from '../posts/anken-kanri-excel-datsu'
import { ArticleSogaiJunbi } from '../posts/sogai-junbi-checklist'
import { ArticleHitorideKanri } from '../posts/kanri-kaisha-hitoride-kanri'
import { ArticleKanriHiTaino } from '../posts/kanri-hi-taino-taiou'
import { ArticleChokiShuzen } from '../posts/choki-shuzen-keikaku-minaoshi'
import { ArticleFrontShigoto } from '../posts/front-tantousha-shigoto'
import { ArticleKanriReplace } from '../posts/kanri-kaisha-replace'
import { ArticleJuminClaim } from '../posts/jumin-claim-taiou'
import { ArticleFrontGetsujigyo } from '../posts/front-getsujigyo'
import { ArticleSokaiGiketsu } from '../posts/sokai-giketsu'
import { ArticleDaikiShuzen } from '../posts/daiki-shuzen-susume-kata'
import { ArticleKanriErabikata } from '../posts/kanri-kaisha-erabi-kata'
import { ArticleRijiYakuwari } from '../posts/riji-yakuwari'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

const ARTICLES: Record<string, React.FC> = {
  'rikaikaigi-gijiroku-kakikata': ArticleRikaikaigi,
  'sogai-gijiroku-sakusei': ArticleSogai,
  'zokuninuka-kaisho': ArticleZokuninuka,
  'hikitsugisho-template': ArticleHikitsugisho,
  'kanri-kaisha-dx-guide': ArticleKanriDx,
  'kanri-kaisha-saas-hikaku': ArticleKanriKaishaSaaS,
  'riji-kai-ai-gijiroku': ArticleRijiKaiAI,
  'kanri-kaisha-ninmu-hikitsugi': ArticleNinmuHikitsugi,
  'anken-kanri-excel-datsu': ArticleAnkenKanri,
  'sogai-junbi-checklist': ArticleSogaiJunbi,
  'kanri-kaisha-hitoride-kanri': ArticleHitorideKanri,
  'kanri-hi-taino-taiou': ArticleKanriHiTaino,
  'choki-shuzen-keikaku-minaoshi': ArticleChokiShuzen,
  'front-tantousha-shigoto': ArticleFrontShigoto,
  'kanri-kaisha-replace': ArticleKanriReplace,
  'jumin-claim-taiou': ArticleJuminClaim,
  'front-getsujigyo': ArticleFrontGetsujigyo,
  'sokai-giketsu': ArticleSokaiGiketsu,
  'daiki-shuzen-susume-kata': ArticleDaikiShuzen,
  'kanri-kaisha-erabi-kata': ArticleKanriErabikata,
  'riji-yakuwari': ArticleRijiYakuwari,
}

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) return {}
  return {
    title: `${post.title} | Kuraブログ`,
    description: post.description,
    keywords: post.keywords.join(','),
    alternates: { canonical: `https://kura-management.com/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://kura-management.com/blog/${slug}`,
      siteName: 'Kura',
      locale: 'ja_JP',
      type: 'article',
      publishedTime: post.publishedAt,
    },
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  '議事録': 'bg-blue-50 text-blue-700',
  '業務効率化': 'bg-emerald-50 text-emerald-700',
  'DX・IT化': 'bg-violet-50 text-violet-700',
  '総会・理事会': 'bg-amber-50 text-amber-700',
  '管理費・会計': 'bg-red-50 text-red-700',
  '修繕工事': 'bg-orange-50 text-orange-700',
  '管理会社': 'bg-sky-50 text-sky-700',
  '住民対応': 'bg-pink-50 text-pink-700',
  '管理組合': 'bg-teal-50 text-teal-700',
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) notFound()

  const Article = ARTICLES[slug]
  if (!Article) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'Kura',
      url: 'https://kura-management.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://kura-management.com/blog/${slug}`,
    },
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/lp" className="text-lg font-extrabold text-slate-900 tracking-tight">
            Kura
          </Link>
          <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-900">
            ← ブログ一覧
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? 'bg-slate-100 text-slate-600'}`}>
              {post.category}
            </span>
            <time className="text-xs text-slate-400">{post.publishedAt}</time>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 leading-snug sm:text-3xl">
            {post.title}
          </h1>
          <p className="mt-4 text-slate-500 leading-relaxed">{post.description}</p>
        </div>

        <div className="prose prose-slate max-w-none">
          <Article />
        </div>

        <div className="mt-16 rounded-2xl bg-blue-600 p-8 text-white text-center">
          <p className="mb-2 text-sm font-semibold opacity-75">Kura — 管理会社専用AI</p>
          <h2 className="mb-3 text-xl font-extrabold">この記事で紹介した業務を自動化する</h2>
          <p className="mb-6 text-sm opacity-80">AI議事録・案件管理・引き継ぎ書自動生成を1つにまとめたSaaS。月額¥50,000〜。</p>
          <Link
            href="/signup"
            style={{ color: '#1d4ed8', backgroundColor: '#ffffff' }}
            className="inline-block rounded-xl px-8 py-3 text-sm font-bold hover:bg-blue-50"
          >
            14日間無料で試してみる →
          </Link>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-8">
          <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-900">
            ← 記事一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  )
}
