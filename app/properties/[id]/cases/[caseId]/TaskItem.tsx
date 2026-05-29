'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TaskItem({
  task,
}: {
  task: {
    id: string
    title: string
    status: string
    due_date?: string
    priority?: string
  }
}) {
  const router = useRouter()

  const toggleStatus = async () => {
    const newStatus = task.status === '完了' ? '未完了' : '完了'

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id)

    if (error) {
      alert('タスク更新エラー')
      console.error(error)
      return
    }

    router.refresh()
  }

  const isDone = task.status === '完了'

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未設定'

    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}年${month}月${day}日`
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case '高':
        return 'bg-red-100 text-red-700'
      case '中':
        return 'bg-yellow-100 text-yellow-700'
      case '低':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="flex items-center justify-between border rounded-xl p-4 bg-white shadow-sm">
      <div className="space-y-2">
        <p className={`${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">
            {task.status}
          </span>

          <span className="text-sm text-gray-400">
            期限：{formatDate(task.due_date)}
          </span>

          <span
            className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
              task.priority
            )}`}
          >
            優先度：{task.priority ?? '未設定'}
          </span>
        </div>
      </div>

      <button
        onClick={toggleStatus}
        className="text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
      >
        切替
      </button>
    </div>
  )
}