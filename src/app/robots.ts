import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/register', '/login'],
        disallow: ['/dashboard/', '/dashboard', '/api/'],
      },
    ],
    sitemap: 'https://affiliate.masheco.com/sitemap.xml',
  };
}

