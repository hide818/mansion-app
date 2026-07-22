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
import { ArticleMansionManagementDx } from '../posts/mansion-management-company-dx'
import { ArticleMansionCaseManagement } from '../posts/mansion-case-management'
import { ArticleMansionManagementCentralization } from '../posts/mansion-management-centralization'
import { TableOfContents } from '../components/TableOfContents'
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
  'mansion-management-company-dx': ArticleMansionManagementDx,
  'mansion-case-management': ArticleMansionCaseManagement,
  'mansion-management-centralization': ArticleMansionManagementCentralization,
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

const CATEGORY_STYLES: Record<string, { bg: string }> = {
  '議事録':    { bg: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)' },
  '業務効率化': { bg: 'linear-gradient(135deg, #34d399 0%, #059669 100%)' },
  'DX・IT化':  { bg: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' },
  '総会・理事会': { bg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' },
  '管理費・会計': { bg: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)' },
  '修繕工事':  { bg: 'linear-gradient(135deg, #fb923c 0%, #c2410c 100%)' },
  '管理会社':  { bg: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' },
  '住民対応':  { bg: 'linear-gradient(135deg, #f472b6 0%, #be185d 100%)' },
  '管理組合':  { bg: 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)' },
}

const DEFAULT_STYLE = { bg: 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)' }

function getReadingMinutes(description: string): number {
  return Math.max(4, Math.min(10, Math.round(description.length / 18)))
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) notFound()

  const Article = ARTICLES[slug]
  if (!Article) notFound()

  const categoryStyle = CATEGORY_STYLES[post.category] ?? DEFAULT_STYLE
  const minutes = getReadingMinutes(post.description)

  const sameCategoryPosts = posts.filter(p => p.category === post.category && p.slug !== slug)
  const otherPosts = posts.filter(p => p.category !== post.category && p.slug !== slug)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const relatedPosts = [...sameCategoryPosts, ...otherPosts].slice(0, 3)

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

      {/* Cover image */}
      <div
        className="h-36 w-full"
        style={{ background: categoryStyle.bg }}
      />

      <main className="mx-auto max-w-3xl px-6 pt-10 pb-16">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? 'bg-slate-100 text-slate-600'}`}>
              {post.category}
            </span>
            <time className="text-xs text-slate-400">{post.publishedAt}</time>
            <span className="text-xs text-slate-400">約{minutes}分で読めます</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 leading-snug sm:text-3xl">
            {post.title}
          </h1>
          <p className="mt-4 text-slate-500 leading-relaxed">{post.description}</p>
        </div>

        <TableOfContents />

        <div className="prose prose-slate prose-lg max-w-none blog-prose">
          <Article />
        </div>

        <div className="mt-16 rounded-2xl bg-blue-600 p-8 text-white text-center">
          <p className="mb-2 text-sm font-semibold opacity-75">Kura — 管理会社専用AI</p>
          <h2 className="mb-3 text-xl font-extrabold">この記事で紹介した業務を自動化する</h2>
          <p className="mb-6 text-sm opacity-80">AI議事録・案件管理・引き継ぎ書自動生成を1つにまとめたSaaS。月額¥50,000〜。</p>
          <Link
            href={`/signup?utm_source=blog&utm_medium=article&utm_campaign=${slug}&utm_content=bottom_cta`}
            style={{ color: '#1d4ed8', backgroundColor: '#ffffff' }}
            className="inline-block rounded-xl px-8 py-3 text-sm font-bold hover:bg-blue-50"
          >
            14日間無料で試してみる →
          </Link>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-5 text-base font-bold text-slate-800">関連記事</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedPosts.map((related) => {
                const relStyle = CATEGORY_STYLES[related.category] ?? DEFAULT_STYLE
                return (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="h-20" style={{ background: relStyle.bg }} />
                    <div className="flex flex-col flex-1 p-4">
                      <span className={`mb-2 inline-block self-start rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[related.category] ?? 'bg-slate-100 text-slate-600'}`}>
                        {related.category}
                      </span>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 leading-snug line-clamp-3">
                        {related.title}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-10 border-t border-slate-100 pt-8">
          <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-900">
            ← 記事一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  )
}
