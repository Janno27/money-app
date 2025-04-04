/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // typedRoutes a été retiré car incompatible avec Turbopack
    // Configuration pour les packages externes
    serverComponentsExternalPackages: ['@supabase/auth-helpers-nextjs']
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
  },
  // Désactiver l'export statique pour certaines pages
  output: 'standalone'
}

module.exports = nextConfig 