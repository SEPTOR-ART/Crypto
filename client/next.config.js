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
            value: "default-src 'self'; connect-src 'self' https://crypto-r29t.onrender.com wss://crypto-r29t.onrender.com https://va.tawk.to https://embed.tawk.to wss://*.tawk.to https://raw.githack.com https://raw.githubusercontent.com https://cdn.jsdelivr.net https://vitals.vercel-insights.com https://api.binance.com https://api.exchange.coinbase.com https://api.kraken.com; script-src 'self' 'unsafe-inline' https://embed.tawk.to https://cdn.jsdelivr.net blob:; script-src-elem 'self' 'unsafe-inline' https://embed.tawk.to https://cdn.jsdelivr.net blob:; child-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://embed.tawk.to; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://embed.tawk.to; font-src 'self' https://fonts.gstatic.com https://embed.tawk.to data:; img-src 'self' data: https://embed.tawk.to https://raw.githack.com https://raw.githubusercontent.com https://cdn.jsdelivr.net; worker-src 'self' blob:; frame-src https://embed.tawk.to; frame-ancestors 'self';",
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
