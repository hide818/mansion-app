import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    proxyClientMaxBodySize: 50 * 1024 * 1024,
  },
}

export default nextConfig