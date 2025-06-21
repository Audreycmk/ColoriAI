/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Vercel to rebuild from latest commit with ESLint fixes
  experimental: {
    // Enable experimental features if needed
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https' ,
        hostname: 'www.gravatar.com',
      }
    ],
  },
}

module.exports = nextConfig