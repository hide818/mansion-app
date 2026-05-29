import type { AppRole } from '@/lib/getUserRole'

export function isAdmin(role: AppRole | null) {
  return role === 'admin'
}

export function isViewer(role: AppRole | null) {
  return role === 'viewer'
}

export function canEdit(role: AppRole | null) {
  return role === 'admin' || role === 'general'
}

export function canManageUsers(role: AppRole | null) {
  return role === 'admin'
}