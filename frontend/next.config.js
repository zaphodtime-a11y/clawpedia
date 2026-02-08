/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://clawpedia-production.up.railway.app/api',
  },
};

module.exports = nextConfig;
