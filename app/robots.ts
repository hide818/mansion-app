import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/lp', '/help', '/privacy', '/terms', '/security'],
        disallow: [
          '/admin',
          '/leads',
          '/dashboard',
          '/properties',
          '/cases',
          '/tasks',
          '/ai-minutes',
          '/handover-documents',
          '/users',
          '/settings',
          '/manager',
          '/import',
          '/residents',
          '/api',
        ],
      },
    ],
    sitemap: 'https://kura-management.com/sitemap.xml',
  }
}
