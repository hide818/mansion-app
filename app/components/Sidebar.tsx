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
      label: '議事録',
      summary: '作成・保存・確認をまとめて',
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
          description: '理事会に上げる案件を確認',
        },
        {
          label: '議事録担当者設定',
          href: '/settings/minutes-staff',
          description: '議事録作成画面で選択する担当者を管理',
        },
      ],
    },
    {
      label: '物件管理',
      summary: '物件を起点に全業務へ',
      children: [
        {
          label: '物件一覧',
          href: '/properties',
          description: '物件ごとの案件・タスク管理',
        },
        {
          label: '物件カルテ',
          href: '/property-cards',
          description: '全物件の重要情報を横断確認',
        },
      ],
    },
    {
      label: '案件管理',
      summary: '案件の進捗と優先度を管理',
      children: [
        {
          label: '案件一覧',
          href: '/cases',
          description: '案件を一覧で確認',
        },
        {
          label: '案件リスク判定',
          href: '/analytics/case-risk',
          description: '停滞・期限切れ・担当未設定を一覧確認',
        },
        {
          label: '見積比較表AI',
          href: '/estimate-comparison',
          description: '複数業者の見積をテキストで比較・分析',
        },
        {
          label: '見積比較表履歴',
          href: '/estimate-comparison/history',
          description: '保存した見積比較表を確認・再編集',
        },
      ],
    },
    {
      label: 'タスク管理',
      summary: '締め切りと作業を整理',
      children: [
        {
          label: 'タスク一覧',
          href: '/tasks',
          description: 'タスクを一覧で確認',
        },
      ],
    },
    {
      label: '引き継ぎ・文書',
      summary: '担当変更でも事故らない',
      children: [
        {
          label: '引き継ぎ書を作成',
          href: '/handover-documents/new',
          description: '物件を選んで新規作成',
        },
        {
          label: '引き継ぎ一覧',
          href: '/handover-documents',
          description: '保存済みの引き継ぎ書を確認',
        },
      ],
    },
    {
      label: '管理者',
      summary: '管理者向け機能',
      children: [
        {
          label: '管理者ダッシュボード',
          href: '/manager',
          description: '日次確認・リスク・分析の入口',
        },
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
