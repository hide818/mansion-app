'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function StatusSelect({
  propertyId,
  caseId,
  currentStatus,
}: {
  propertyId: string
  caseId: string
  currentStatus: string
}) {
  const router = useRouter()

  const handleChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newStatus = e.target.value

    const { error: updateError } = await supabase
      .from('cases')
      .update({ status: newStatus })
      .eq('id', caseId)
      .eq('property_id', propertyId)

    if (updateError) {
      alert('ステータス更新エラー')
      console.error(updateError)
      return
    }

    const { error: logError } = await supabase
      .from('logs')
      .insert([
        {
          case_id: caseId,
          message: `ステータスを「${newStatus}」に変更しました`,
          type: 'status',
        },
      ])

    if (logError) {
      alert('ログ追加エラー')
      console.error(logError)
      return
    }

    router.refresh()
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      className="border rounded-lg px-3 py-2 bg-white"
    >
      <option value="進行中">進行中</option>
      <option value="完了">完了</option>
      <option value="保留">保留</option>
    </select>
  )
}