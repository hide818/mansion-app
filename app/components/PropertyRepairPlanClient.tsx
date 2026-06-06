'use client'

import { useEffect, useState } from 'react'
import FileAttachment from './FileAttachment'

type Props = {
  propertyId: string
  initialFilePath: string | null
  initialFileName: string | null
}

export default function PropertyRepairPlanClient({ propertyId, initialFilePath, initialFileName }: Props) {
  const [companyId, setCompanyId] = useState('')
  const [filePath, setFilePath] = useState(initialFilePath)
  const [fileName, setFileName] = useState(initialFileName)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => setCompanyId(d.companyId ?? '')).catch(() => {})
  }, [])

  async function save(path: string | null, name: string | null) {
    await fetch(`/api/properties/${propertyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repair_plan_file_path: path, repair_plan_file_name: name }),
    })
    setFilePath(path)
    setFileName(name)
  }

  if (!companyId) return null

  return (
    <FileAttachment
      companyId={companyId}
      folder={`properties/${propertyId}/repair-plan`}
      filePath={filePath}
      fileName={fileName}
      onSaved={(path, name) => save(path, name)}
      onDeleted={() => save(null, null)}
    />
  )
}
