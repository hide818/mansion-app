'use client'

import { useFormStatus } from 'react-dom'

type Props = {
  label?: string
  loadingLabel?: string
  className?: string
  variant?: 'primary' | 'danger'
}

export default function SubmitButton({
  label = '保存する',
  loadingLabel = '保存中...',
  className,
  variant = 'primary',
}: Props) {
  const { pending } = useFormStatus()

  const base = 'inline-flex min-w-[80px] items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-50'
  const colors =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-blue-600 hover:bg-blue-700'

  return (
    <button type="submit" disabled={pending} className={className ?? `${base} ${colors}`}>
      {pending ? loadingLabel : label}
    </button>
  )
}
