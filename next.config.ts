import type { NextConfig } from "next";
import path from "path";

const cleanEnv = (val?: string) => (val ? val.split('#')[0].trim() : '');

const rawBackendUrl =
  cleanEnv(process.env.BACKEND_INTERNAL_URL) ||
  cleanEnv(process.env.API_URL) ||
  'http://localhost:8000';

const backendUrl = rawBackendUrl
  .replace(/\/api(\/v\d+)?\/?$/, '')
  .replace(/\/$/, '');

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
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
