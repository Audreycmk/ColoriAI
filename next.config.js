/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Vercel to rebuild from latest commit with Link import fix
  experimental: {
    // Enable experimental features if needed
    serverActions: {
      allowedOrigins: ['didactic-space-train-pjprqpjg594rf696w-3000.app.github.dev'],
    },
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