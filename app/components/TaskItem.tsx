"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

type Task = {
  id: string
  title: string | null
  status: string | null
}

type TaskItemProps = {
  task: Task | null
}

export default function TaskItem({ task }: TaskItemProps) {

  const [status, setStatus] = useState(task?.status || "")

  const nextStatus = async () => {

    if (!task) return

    let newStatus = "未着手"

    if (status === "未着手") newStatus = "進行中"
    else if (status === "進行中") newStatus = "完了"
    else newStatus = "未着手"

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id)

    if (!error) {
      setStatus(newStatus)
    }

  }

  const deleteTask = async () => {

    if (!task) return

    const ok = confirm("タスクを削除しますか？")

    if (!ok) return

    await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id)

    location.reload()

  }

  if (!task) return null

  return (

    <div className="border p-3 rounded flex justify-between items-center">

      <div>

        <div className="font-medium">
          {task.title}
        </div>

        <div className="text-sm text-gray-500">
          {status}
        </div>

      </div>

      <div className="flex gap-2">

        <button
          onClick={nextStatus}
          className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
        >
          進捗変更
        </button>

        <button
          onClick={deleteTask}
          className="px-2 py-1 text-sm bg-red-500 text-white rounded"
        >
          削除
        </button>

      </div>

    </div>

  )
}
