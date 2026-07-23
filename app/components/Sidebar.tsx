import SidebarClient from './SidebarClient'
import type { NavGroup } from './SidebarClient'

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const allMenuGroups: NavGroup[] = [
    {
      label: 'ホーム',
      href: '/dashboard',
      summary: '今日の状況をすぐ確認',
      children: [
        {
          label: 'ダッシュボード',
          href: '/dashboard',
          description: '今日やるべきタスクと直近のアラートを確認',
        },
      ],
    },
    {
      label: '案件・タスク',
      summary: '全物件の業務を一元管理',
      featured: true,
      children: [
        {
          label: '物件一覧',
          href: '/properties',
          description: '物件ごとの案件・タスク管理',
        },
        {
          label: '案件一覧',
          href: '/cases',
          description: '全物件の案件を横断確認',
        },
        {
          label: 'タスク一覧',
          href: '/tasks',
          description: 'タスクを一覧で確認',
        },
      ],
    },
    {
      label: '法定点検',
      summary: 'エレベーター・消防・貯水槽の期限管理',
      featured: true,
      children: [
        {
          label: '点検スケジュール',
          href: '/inspections',
          description: '法律で定められた点検の期限を一元管理・アラート',
        },
      ],
    },
    {
      label: '管理費督促',
      summary: '未払い管理費・督促を月次管理',
      featured: true,
      children: [
        {
          label: '管理費・督促管理',
          href: '/payments',
          description: '管理費・修繕積立金の未払い状況管理・メール督促送信',
        },
        {
          label: 'カレンダー',
          href: '/calendar',
          description: 'タスク・法定点検・修繕の期限を月次カレンダーで確認',
        },
      ],
    },
    {
      label: '居住者・物件',
      summary: '区分所有者・賃借人・修繕を管理',
      featured: true,
      children: [
        {
          label: '居住者管理',
          href: '/residents',
          description: '区分所有者・賃借人・理事会メンバーを一元管理',
        },
        {
          label: '修繕履歴',
          href: '/repairs',
          description: '修繕の実績・施工中・計画を管理',
        },
        {
          label: '見積管理',
          href: '/estimates',
          description: '相見積もりを物件別に比較・採否管理',
        },
        {
          label: '業者管理',
          href: '/contractors',
          description: '取引業者の連絡先・カテゴリを管理',
        },
      ],
    },
    {
      label: '居住者問い合わせ',
      summary: '修繕要望・クレーム・問い合わせ対応',
      children: [
        {
          label: '問い合わせ一覧',
          href: '/resident-portal',
          description: '住民からのクレーム・修繕要望・問い合わせを管理',
        },
      ],
    },
    {
      label: 'AI議事録',
      summary: '音声から議事録を自動生成',
      featured: true,
      children: [
        {
          label: 'AI議事録を作成',
          href: '/ai-minutes',
          description: '音声をアップロードして議事録を自動生成（総会・理事会対応）',
        },
        {
          label: '保存済み議事録',
          href: '/ai-minutes/records',
          description: '作成した議事録を確認・編集・出力',
        },
        {
          label: 'フォーマット設定',
          href: '/settings/minutes-template',
          description: '自社フォーマットをAIに学習させる',
        },
      ],
    },
    {
      label: 'AI引き継ぎ書',
      summary: '担当変更でも事故らない',
      featured: true,
      children: [
        {
          label: 'AI引き継ぎ書を作成',
          href: '/handover-documents/new',
          description: '物件を選ぶだけで自動生成',
        },
        {
          label: '引き継ぎ書一覧',
          href: '/handover-documents',
          description: '保存済みの引き継ぎ書を確認・編集',
        },
      ],
    },
    {
      label: '管理者',
      summary: '全体リスクと組織管理',
      children: [
        {
          label: '危険案件ダッシュボード',
          href: '/manager',
          description: '担当者別の期限切れ・停滞・クレームを一覧確認',
        },
        {
          label: '法定点検レポート',
          href: '/inspections/report',
          description: '物件ごとの点検状況を理事会報告書としてPDF出力',
        },
        {
          label: 'CSVインポート',
          href: '/import',
          description: 'ExcelデータをKuraに一括移行（物件・居住者・点検）',
        },
{
          label: 'ユーザー管理',
          href: '/users',
          description: 'ユーザーと権限管理',
        },
      ],
    },
  ]

  const menuGroups = isAdmin
    ? allMenuGroups
    : allMenuGroups.filter((g) => g.label !== '管理者')

  return <SidebarClient menuGroups={menuGroups} />
}
