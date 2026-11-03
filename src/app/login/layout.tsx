import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Partner Login – Access Your Earnings & Referral Dashboard',
  description:
    'Log in to your MASH ECO Affiliate Partner Dashboard to track merchant referrals, 30% recurring commissions, and request payouts via bKash, Nagad, Rocket, or Bank.',
  alternates: {
    canonical: 'https://affiliate.masheco.com/login',
  },
  openGraph: {
    title: 'MASH ECO Affiliate Partner Login',
    description:
      'Access your MASH ECO Affiliate Partner Dashboard to manage referrals, commissions, and payouts.',
    url: 'https://affiliate.masheco.com/login',
    siteName: 'MASH ECO Affiliate Partner Program',
    type: 'website',
  },
};

export default function AffiliateLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

