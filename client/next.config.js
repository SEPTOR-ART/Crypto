/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // Enable static exports
  trailingSlash: true,
  // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
  // skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;