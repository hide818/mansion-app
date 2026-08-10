'use client'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function sendGAEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params ?? {})
}

// 定義済みイベント名
export const GA_EVENTS = {
  LP_VIEW: 'lp_view',
  DEMO_VIDEO_CLICK: 'demo_video_click',
  FREE_DIAGNOSIS_START: 'free_diagnosis_start',
  FREE_DIAGNOSIS_COMPLETE: 'free_diagnosis_complete',
  FREE_DIAGNOSIS_TO_AI_MINUTES: 'free_diagnosis_to_ai_minutes_click',
  FREE_DIAGNOSIS_TO_TRIAL: 'free_diagnosis_to_trial_click',
  FREE_MINUTES_SIGNUP: 'free_minutes_signup',
  FREE_MINUTES_FIRST_USE: 'free_minutes_first_use',
  FREE_MINUTES_SECOND_USE: 'free_minutes_second_use',
  FREE_MINUTES_SURVEY_SUBMIT: 'free_minutes_survey_submit',
  FREE_MINUTES_THIRD_USE: 'free_minutes_third_use',
  FREE_MINUTES_KURA_CTA_CLICK: 'free_minutes_kura_cta_click',
  TRIAL_START: 'trial_start',
} as const
