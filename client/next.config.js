/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; connect-src 'self' https://crypto-r29t.onrender.com wss://crypto-r29t.onrender.com https://va.tawk.to https://embed.tawk.to https://raw.githack.com; script-src 'self' 'unsafe-inline' https://embed.tawk.to blob:; child-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://embed.tawk.to https://raw.githack.com; worker-src 'self' blob:; frame-src https://embed.tawk.to; frame-ancestors 'self';",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
