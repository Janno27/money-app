/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // typedRoutes a été retiré car incompatible avec Turbopack
  },
  images: {
    domains: ['ouiwpkxvjxcfbypmurap.supabase.co', 'i.ibb.co']
  },
  eslint: {
    // Désactiver les vérifications ESLint pendant la construction
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Désactiver les vérifications TypeScript pendant la construction
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig 