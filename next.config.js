/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'replicate.com',
      },
      {
        protocol: 'https',
        hostname: 'replicateproxy.b-cdn.net',
      },
    ],
    // Disable Next.js image optimization, use BunnyCDN's optimization instead
    unoptimized: true,
  },
}

module.exports = nextConfig
