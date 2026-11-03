import type { NextConfig } from "next";

const cleanEnv = (val?: string) => (val ? val.split('#')[0].trim() : '');

const rawBackendUrl =
  cleanEnv(process.env.BACKEND_INTERNAL_URL) ||
  cleanEnv(process.env.API_URL) ||
  'http://127.0.0.1:8000';

const backendUrl = rawBackendUrl
  .replace('://localhost:', '://127.0.0.1:')
  .replace(/\/api(\/v\d+)?\/?$/, '')
  .replace(/\/$/, '');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.masheco.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/socket.io',
        destination: `${backendUrl}/socket.io/`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
