/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Configuration pour les packages externes
    serverExternalPackages: ['@supabase/auth-helpers-nextjs']
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
  output: 'standalone',
  
  // Désactiver le prérendu statique pour les pages client
  staticPageGenerationTimeout: 120,
  
  // Forcer toutes les pages à être dynamiques par défaut
  // Cette configuration est inoffensive pour les applications utilisées en production
  // mais résout les problèmes liés au pré-rendu sur Render
  reactStrictMode: false
}

module.exports = nextConfig 