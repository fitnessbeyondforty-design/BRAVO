/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Trailing slashes are handled in middleware so legacy WordPress URLs (/slug/) redirect in ONE hop.
  skipTrailingSlashRedirect: true,
  images: {
    // Serve modern formats; AVIF first, WebP fallback. Big win over the migrated JPEGs/PNGs.
    formats: ['image/avif', 'image/webp'],
    // Trimmed from the defaults — no image is displayed larger than ~half of a 1920px viewport,
    // so dropping 2048/3840 keeps the number of generated variants (and optimizer usage) down.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [128, 256, 384],
    // Featured images are content-addressed by storage key (new content = new key), so the optimized
    // output is effectively immutable — cache it for a year to avoid re-optimizing.
    minimumCacheTTL: 31536000,
    remotePatterns: [{ protocol: 'https', hostname: 'rgqtuucwqqlpqoupdqri.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
};
export default nextConfig;
