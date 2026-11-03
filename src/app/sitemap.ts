import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://affiliate.masheco.com';

  return [
    {
      url: `${base}/`,
      changeFrequency: 'daily',
      priority: 1.0,
      lastModified: new Date(),
    },
    {
      url: `${base}/register`,
      changeFrequency: 'weekly',
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${base}/login`,
      changeFrequency: 'weekly',
      priority: 0.85,
      lastModified: new Date(),
    },
  ];
}

