import SidebarClient from './SidebarClient'
import type { NavGroup } from './SidebarClient'

export default function Sidebar() {
  const menuGroups: NavGroup[] = [
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
      label: '引き継ぎ',
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
      label: '理事会',
      summary: '準備から議事録・宿題まで',
      featured: true,
      children: [
        {
          label: 'AI議事録を作成',
          href: '/ai-minutes',
          description: '音声から議事録を自動生成',
        },
        {
          label: '保存済み議事録',
          href: '/ai-minutes/records',
          description: '作成した議事録を確認・編集・出力',
        },
        {
          label: '理事会対象案件',
          href: '/board-cases',
          description: '理事会に上げる案件を確認・準備',
        },
      ],
    },
    {
      label: '物件・案件・タスク',
      summary: '日常業務の管理',
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
      label: '管理者',
      summary: '朝の全体確認・リスク管理',
      children: [
        {
          label: '危険案件ダッシュボード',
          href: '/manager',
          description: '担当者別の期限切れ・停滞・クレームを一覧確認',
        },
        {
          label: 'ユーザー管理',
          href: '/users',
          description: 'ユーザーと権限管理',
        },
      ],
    },
  ]

  return <SidebarClient menuGroups={menuGroups} />
}
