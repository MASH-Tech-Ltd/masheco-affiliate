import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register as an Affiliate Partner – Earn 30% Recurring Commission',
  description:
    'Create your free MASH ECO Affiliate Partner account in seconds. Get your unique referral link and earn 30% recurring commission for 6 months on every referred merchant.',
  alternates: {
    canonical: 'https://affiliate.masheco.com/register',
  },
  openGraph: {
    title: 'Register as a MASH ECO Affiliate Partner',
    description:
      'Sign up for free and earn 30% recurring commission for 6 months on every referred e-commerce merchant in Bangladesh.',
    url: 'https://affiliate.masheco.com/register',
    siteName: 'MASH ECO Affiliate Partner Program',
    type: 'website',
  },
};

export default function AffiliateRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

