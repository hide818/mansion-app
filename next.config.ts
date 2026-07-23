import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'ffmpeg-static'],
  experimental: {
    proxyClientMaxBodySize: 50 * 1024 * 1024,
  },
}

export default nextConfig