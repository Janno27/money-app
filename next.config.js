/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // typedRoutes a été retiré car incompatible avec Turbopack
  },
  images: {
    domains: ['ouiwpkxvjxcfbypmurap.supabase.co', 'i.ibb.co']
  }
}

module.exports = nextConfig 