// Extract the hostname from the SUPABASE_URL safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseHostname = 'axebywfykhxnqtdyeddk.supabase.co'; // Fallback
try {
  if (supabaseUrl) {
    supabaseHostname = new URL(supabaseUrl).hostname;
  }
} catch (e) {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gzip/Brotli compress all responses
  compress: true,
  // Remove X-Powered-By header
  poweredByHeader: false,

  images: {
    // Cache optimized images for 1 hour
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  experimental: {
    // Tree-shake lucide-react — imports only the icons actually used
    // Dramatically reduces the JS bundle size
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
