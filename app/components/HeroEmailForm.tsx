'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HeroEmailForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    router.push(`/signup?email=${encodeURIComponent(email)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex flex-col items-center gap-3">
      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="メールアドレスを入力"
          className="flex-1 rounded-full border border-[#424245] bg-[#1c1c1e] px-5 py-3.5 text-[15px] text-white placeholder:text-[#636366] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
        />
        <button
          type="submit"
          className="rounded-full bg-[#0071e3] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#0077ed] transition-colors shadow-[0_0_24px_rgba(0,113,227,0.4)] whitespace-nowrap"
        >
          14日間無料で試す →
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[12px] text-[#8e8e93]">
        <span>クレジットカード不要</span>
        <span>登録2分</span>
        <span>いつでも解約可能</span>
      </div>
    </form>
  )
}
