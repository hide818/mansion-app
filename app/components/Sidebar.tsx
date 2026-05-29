import SidebarClient from './SidebarClient'
import type { NavGroup } from './SidebarClient'

export default function Sidebar() {
  const menuGroups: NavGroup[] = [
    {
      label: 'ホーム',
      href: '/dashboard',
      summary: '今日やることと全体状況',
      children: [
        {
          label: 'ダッシュボード',
          href: '/dashboard',
          description: '今日やるべきタスクを確認',
        },
        {
          label: '今日やること',
          href: '/today-tasks',
          description: '期限ベースでタスクを整理',
        },
      ],
    },
    {
      label: '案件・タスク管理',
      summary: '業務の軸となる管理機能',
      children: [
        {
          label: '物件一覧',
          href: '/properties',
          description: '物件ごとの案件・タスク管理',
        },
        {
          label: '案件一覧',
          href: '/cases',
          description: '案件を一覧で確認',
        },
        {
          label: 'タスク一覧',
          href: '/tasks',
          description: 'タスクを一覧で確認',
        },
      ],
    },
    {
      label: 'AI事務アシスタント',
      summary: '事務処理を自動化',
      children: [
        {
          label: '議事録AI',
          href: '/ai-minutes',
          description: '音声から議事録を作成',
        },
        {
          label: '見積比較・議案作成',
          href: '/properties',
          description: '案件から見積比較・議案作成へ',
        },
      ],
    },
    {
      label: '引き継ぎDX',
      summary: '担当変更でも事故らない',
      children: [
        {
          label: '引き継ぎ一覧',
          href: '/handover-documents',
          description: '保存済みの引き継ぎ書を確認',
        },
        {
          label: '引き継ぎ書を作成',
          href: '/handover-documents/new',
          description: '物件を選んで新規作成',
        },
      ],
    },
    {
      label: '管理',
      summary: '管理者向け機能',
      children: [
        {
          label: 'ユーザー管理',
          href: '/users',
          description: 'ユーザーと権限管理',
        },
        {
          label: '監査ログ',
          href: '/audit-logs',
          description: '操作履歴の確認',
        },
      ],
    },
  ]

  return <SidebarClient menuGroups={menuGroups} />
}