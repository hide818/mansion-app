'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Task = {
  id: string
  title: string
  status: string
  property_id?: string | null
  due_date?: string | null
  priority?: string | null
}

type ProfileRow = {
  company_id: string | null
}

export default function TaskBoard({
  propertyId,
  initialTasks,
}: {
  propertyId: string
  initialTasks: Task[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState('すべて')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('中')
  const [loading, setLoading] = useState(false)

  const filteredTasks = useMemo(() => {
    return initialTasks.filter((task) => {
      const matchKeyword = (task.title || '')
        .toLowerCase()
        .includes(keyword.toLowerCase())

      const matchFilter =
        filter === 'すべて' ? true : task.status === filter

      return matchKeyword && matchFilter
    })
  }, [initialTasks, keyword, filter])

  const totalTasks = initialTasks.length
  const doneTasks = initialTasks.filter((task) => task.status === '完了').length
  const openTasks = initialTasks.filter((task) => task.status !== '完了').length

  const handleAdd = async () => {
    if (!title.trim()) {
      alert('タスク名を入力してください')
      return
    }

    if (!propertyId) {
      alert('物件IDが取得できませんでした')
      return
    }

    setLoading(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      alert('ログインユーザー情報の取得に失敗しました')
      console.error(userError)
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single<ProfileRow>()

    if (profileError) {
      alert('会社情報の取得に失敗しました')
      console.error(profileError)
      setLoading(false)
      return
    }

    if (!profile?.company_id) {
      alert('company_id が取得できませんでした')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          title: title.trim(),
          property_id: propertyId,
          company_id: profile.company_id,
          status: '未完了',
          due_date: dueDate || null,
          priority,
        },
      ])

    if (error) {
      alert('タスク追加エラー')
      console.error(error)
      setLoading(false)
      return
    }

    setTitle('')
    setDueDate('')
    setPriority('中')
    setLoading(false)
    router.refresh()
  }

  const handleToggle = async (task: Task) => {
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '未設定'

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return String(dateString)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}年${month}月${day}日`
  }

  const getPriorityColor = (value?: string | null) => {
    switch (value) {
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">全タスク</p>
          <p className="mt-2 text-3xl font-bold">{totalTasks}</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-red-600">未完了</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{openTasks}</p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-sm text-green-600">完了</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{doneTasks}</p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">タスク追加</h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タスク名"
          className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border bg-white p-2"
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border bg-white p-2"
          >
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
        </div>

        <button
          onClick={handleAdd}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '追加中...' : '追加'}
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">検索・絞り込み</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="タスク名で検索"
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-lg border bg-white p-2"
          >
            <option value="すべて">すべて</option>
            <option value="未完了">未完了</option>
            <option value="完了">完了</option>
            <option value="未着手">未着手</option>
            <option value="進行中">進行中</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">タスク一覧</h2>

        {filteredTasks.length === 0 && (
          <p className="text-gray-500">該当するタスクがありません</p>
        )}

        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isDone = task.status === '完了'

            return (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl border bg-gray-50 p-4"
              >
                <div className="space-y-2">
                  <p className={isDone ? 'line-through text-gray-400' : 'text-gray-900'}>
                    {task.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-gray-500">{task.status}</p>

                    <p className="text-sm text-gray-400">
                      期限：{formatDate(task.due_date)}
                    </p>

                    <span
                      className={`rounded-full px-2 py-1 text-xs ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      優先度：{task.priority ?? '未設定'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(task)}
                  className="rounded-lg bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
                >
                  切替
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}