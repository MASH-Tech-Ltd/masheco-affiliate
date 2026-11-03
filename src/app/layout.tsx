import type { Metadata } from 'next';
import { Inter, Righteous } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '@/context/LanguageContext';
import { SocketProvider } from '@/context/SocketContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const righteous = Righteous({ weight: '400', subsets: ['latin'], variable: '--font-righteous' });

export const metadata: Metadata = {
  metadataBase: new URL('https://affiliate.masheco.com'),
  applicationName: 'MASH ECO Affiliate',
  title: {
    default: 'MASH ECO Affiliate Partner Program | Earn 30% Recurring Commission',
    template: '%s | MASH ECO Affiliate',
  },
  description:
    'Join the official MASH ECO Affiliate Partner Program at affiliate.masheco.com. Refer e-commerce merchants in Bangladesh and earn 30% recurring commission for 6 months on every subscription payment with fast bKash, Nagad, Rocket & Bank payouts.',
  keywords: [
    'MASH ECO Affiliate',
    'MashEco Affiliate Program',
    'affiliate.masheco.com',
    'MASH ECO Partner Program',
    'ecommerce affiliate program Bangladesh',
    'earn recurring commission Bangladesh',
    'bKash affiliate payout',
    'refer and earn Bangladesh',
    'MASH ECO',
    'MashEco',
    'অ্যাফিলিয়েট প্রোগ্রাম বাংলাদেশ',
    'অনলাইন ইনকাম বাংলাদেশ',
  ],
  authors: [{ name: 'MASH ECO', url: 'https://www.masheco.com' }],
  creator: 'MASH ECO',
  publisher: 'MASH ECO',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/masheco-logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/masheco-logo.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    title: 'MASH ECO Affiliate Partner Program — Earn 30% Recurring Commission',
    description:
      'Refer e-commerce merchants to MASH ECO and earn 30% recurring commission for 6 months on every subscription payment. Instant payouts starting from ৳100 via bKash, Nagad, Rocket & Bank.',
    url: 'https://affiliate.masheco.com',
    siteName: 'MASH ECO Affiliate Partner Program',
    images: [
      {
        url: 'https://affiliate.masheco.com/masheco-logo.png',
        width: 1200,
        height: 630,
        alt: 'MASH ECO Affiliate Partner Program',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MASH ECO Affiliate Partner Program — Earn 30% Recurring Commission',
    description:
      'Refer merchants in Bangladesh and earn 30% recurring commission for 6 months. Join free at affiliate.masheco.com.',
    images: ['https://affiliate.masheco.com/masheco-logo.png'],
    site: '@masheco',
  },
  alternates: {
    canonical: 'https://affiliate.masheco.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${righteous.variable} h-full antialiased`}
    >
      <head>
        <meta name="application-name" content="MASH ECO Affiliate" />
        <meta name="apple-mobile-web-app-title" content="MASH ECO Affiliate" />
        <meta property="og:site_name" content="MASH ECO Affiliate Partner Program" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="192x192" href="/masheco-logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/masheco-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/masheco-logo.png" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-white">
        <Toaster position="top-right" />
        <LanguageProvider>
          <SocketProvider>{children}</SocketProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
