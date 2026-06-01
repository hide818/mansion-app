'use client'

import { useState } from 'react'

type ComparisonRow = {
  item: string
  values: { vendorName: string; value: string }[]
  note?: string
}

type VendorSummary = {
  vendorName: string
  totalAmount: string
  strengths: string[]
  concerns: string[]
}

export type EstimateComparisonResultData = {
  overview: string
  comparisonRows: ComparisonRow[]
  vendorSummaries: VendorSummary[]
  cheapestVendor?: string
  priceDifferenceSummary: string
  missingItems: string[]
  questionsToVendors: string[]
  boardComment: string
  agendaDraft: string
}

type Props = {
  result: EstimateComparisonResultData
  appliedSections: string[]
}

function buildTableCopyText(result: EstimateComparisonResultData, vendorCols: string[]): string {
  const header = ['比較項目', ...vendorCols, '備考'].join('\t')
  const rows = result.comparisonRows.map((row) => {
    const cells = vendorCols.map((name) => {
      const found = row.values.find((v) => v.vendorName === name)
      return found?.value ?? '見積書上では確認できません'
    })
    return [row.item, ...cells, row.note ?? ''].join('\t')
  })
  return [header, ...rows].join('\n')
}

export default function EstimateComparisonResultSections({ result, appliedSections }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const vendorCols = (() => {
    const fromRows = [
      ...new Set(
        result.comparisonRows
          .flatMap((row) => row.values.map((v) => v.vendorName))
          .filter(Boolean)
      ),
    ]
    if (fromRows.length > 0) return fromRows
    return result.vendorSummaries.map((vs) => vs.vendorName)
  })()

  const has = (s: string) => appliedSections.includes(s)

  async function copyText(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="space-y-5">

      {/* 01. 総評（常に表示） */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">01</div>
        <h2 className="mt-2 text-xl font-bold text-slate-900">総評</h2>
        <p className="mt-4 text-sm leading-7 text-slate-700">{result.overview}</p>
      </section>

      {/* 02. 比較表 */}
      {has('comparisonTable') && result.comparisonRows.length > 0 && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">02</div>
              <h2 className="mt-2 text-xl font-bold text-slate-900">比較表</h2>
              <p className="mt-1 text-xs text-slate-500">基準見積を軸に各社の内容を比較しています</p>
            </div>
            <button
              type="button"
              onClick={() => copyText(buildTableCopyText(result, vendorCols), 'table')}
              className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              {copiedId === 'table' ? 'コピーしました' : '比較表をコピー'}
            </button>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 text-left text-xs font-bold text-slate-500 whitespace-nowrap">
                    比較項目
                  </th>
                  {vendorCols.map((name) => (
                    <th
                      key={name}
                      className={`px-4 py-3 text-left text-xs font-bold whitespace-nowrap ${
                        name === '基準見積' ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {name}
                    </th>
                  ))}
                  <th className="pl-4 py-3 text-left text-xs font-bold text-slate-500 whitespace-nowrap">
                    備考
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.comparisonRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 text-sm font-semibold text-slate-700 whitespace-nowrap align-top">
                      {row.item}
                    </td>
                    {vendorCols.map((name) => {
                      const found = row.values.find((v) => v.vendorName === name)
                      const val = found?.value ?? '見積書上では確認できません'
                      return (
                        <td
                          key={name}
                          className={`px-4 py-3 text-sm leading-6 align-top ${
                            name === '基準見積'
                              ? 'bg-emerald-50 text-slate-700'
                              : val === '項目なし'
                              ? 'text-rose-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {val}
                        </td>
                      )
                    })}
                    <td className="pl-4 py-3 text-xs leading-6 text-slate-500 align-top">
                      {row.note ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 03. 各社の特徴 */}
      {has('vendorSummaries') && result.vendorSummaries.length > 0 && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">03</div>
          <h2 className="mt-2 text-xl font-bold text-slate-900">各社の特徴</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {result.vendorSummaries.map((vs) => (
              <div
                key={vs.vendorName}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="text-base font-bold text-slate-900">{vs.vendorName}</div>
                <div className="mt-2 text-sm font-semibold text-slate-600">
                  見積総額：{vs.totalAmount}
                </div>
                {vs.strengths.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-bold text-emerald-700">基準見積との比較・特長</div>
                    <ul className="mt-1 space-y-1">
                      {vs.strengths.map((s, i) => (
                        <li key={i} className="text-sm leading-6 text-slate-700">・{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {vs.concerns.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-bold text-amber-700">基準見積との差異・懸念点</div>
                    <ul className="mt-1 space-y-1">
                      {vs.concerns.map((c, i) => (
                        <li key={i} className="text-sm leading-6 text-slate-700">・{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 04. 金額差・注意点 */}
      {has('priceDifference') && result.priceDifferenceSummary && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">04</div>
          <h2 className="mt-2 text-xl font-bold text-slate-900">金額差・注意点</h2>
          {result.cheapestVendor && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5">
              <span className="text-xs font-semibold text-amber-700">最安値</span>
              <span className="text-sm font-bold text-amber-900">{result.cheapestVendor}</span>
              <span className="text-xs text-amber-700">※ 金額のみの判断は禁物です</span>
            </div>
          )}
          <p className="mt-4 text-sm leading-7 text-slate-700">{result.priceDifferenceSummary}</p>
        </section>
      )}

      {/* 05. 不足している項目 */}
      {has('missingItems') && result.missingItems.length > 0 && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">05</div>
          <h2 className="mt-2 text-xl font-bold text-slate-900">不足している項目</h2>
          <ul className="mt-4 space-y-2">
            {result.missingItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                <span className="mt-0.5 shrink-0 text-rose-500">▲</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 06. 業者へ確認すべき質問 */}
      {has('questionsToVendors') && result.questionsToVendors.length > 0 && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">06</div>
          <h2 className="mt-2 text-xl font-bold text-slate-900">業者へ確認すべき質問</h2>
          <ul className="mt-4 space-y-2">
            {result.questionsToVendors.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                <span className="mt-0.5 shrink-0 font-bold text-sky-600">Q{i + 1}</span>
                {q}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 07. 理事会向けコメント */}
      {has('boardComment') && result.boardComment && (
        <section className="rounded-[28px] border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-emerald-600">07</div>
              <h2 className="mt-2 text-xl font-bold text-slate-900">理事会向けコメント</h2>
              <p className="mt-1 text-xs text-slate-500">資料にそのまま貼り付けて使えます</p>
            </div>
            <button
              type="button"
              onClick={() => copyText(result.boardComment, 'board')}
              className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              {copiedId === 'board' ? 'コピーしました' : '理事会コメントをコピー'}
            </button>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
              {result.boardComment}
            </p>
          </div>
        </section>
      )}

      {/* 08. 総会議案文 */}
      {has('agendaDraft') && result.agendaDraft && (
        <section className="rounded-[28px] border border-violet-100 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-violet-600">08</div>
              <h2 className="mt-2 text-xl font-bold text-slate-900">総会議案文</h2>
              <p className="mt-1 text-xs text-slate-500">総会議案書の説明文として使えます</p>
            </div>
            <button
              type="button"
              onClick={() => copyText(result.agendaDraft, 'agenda')}
              className="shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              {copiedId === 'agenda' ? 'コピーしました' : '総会議案文をコピー'}
            </button>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
              {result.agendaDraft}
            </p>
          </div>
        </section>
      )}

    </div>
  )
}
