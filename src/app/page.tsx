'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Users,
  Calculator,
  Gift,
  Menu,
  X,
} from 'lucide-react';
import { useAffiliateLang } from '@/context/LanguageContext';
import { affiliateApi } from '@/utils/affiliateApi';

export default function AffiliateLandingPage() {
  const { lang, setLang, t } = useAffiliateLang();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [config, setConfig] = useState({
    defaultCommissionRate: 30,
    commissionDurationMonths: 6,
    minimumWithdrawalAmount: 100,
    extraTrialDaysForReferredMerchant: 10,
    allowAffiliateRegistration: true,
    maxAffiliates: 500,
    currentAffiliateCount: 0,
  });
  const [calcPaidAmount, setCalcPaidAmount] = useState<number>(499);
  const [calcMerchants, setCalcMerchants] = useState<number>(10);

  useEffect(() => {
    affiliateApi
      .get('/public-config')
      .then((res) => {
        if (res.data?.data) {
          setConfig((prev) => ({ ...prev, ...res.data.data }));
        }
      })
      .catch(() => {});
  }, []);

  const rate = config.defaultCommissionRate || 30;
  const duration = config.commissionDurationMonths || 6;
  const perPaymentCommission =
    Math.round((calcPaidAmount * (rate / 100) + Number.EPSILON) * 100) / 100;
  const sixMonthTotal =
    Math.round((perPaymentCommission * duration * calcMerchants + Number.EPSILON) * 100) / 100;

  const merchantPortalBaseUrl = 'https://merchant.masheco.com';
  const mainLandingUrl = 'https://www.masheco.com';

  const affiliateServiceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'MASH ECO Affiliate Partner Program',
    serviceType: 'E-Commerce SaaS Affiliate Program',
    url: 'https://affiliate.masheco.com',
    provider: {
      '@type': 'Organization',
      name: 'MASH ECO',
      url: 'https://www.masheco.com',
      logo: 'https://affiliate.masheco.com/masheco-logo.png',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Bangladesh',
    },
    description: `Earn ${rate}% recurring commission for ${duration} months on every referred merchant subscription payment at MASH ECO. Minimum withdrawal ৳${config.minimumWithdrawalAmount || 100} via bKash, Nagad, Rocket, and Bank.`,
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(affiliateServiceJsonLd) }}
      />
      {/* Navbar — Identical Design to Merchant Landing Navbar */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/masheco-logo.png"
                alt="MASH ECO"
                className="w-9 h-9 sm:w-13 sm:h-13 object-contain"
              />
              <span className="text-2xl sm:text-3xl font-righteous text-black tracking-tight">
                MASH ECO
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#how-it-works"
                className="relative py-1 text-sm font-medium text-gray-600 hover:text-slate-900 transition-colors"
              >
                {lang === 'bn' ? 'কীভাবে কাজ করে' : 'How It Works'}
              </a>
              <a
                href="#commission"
                className="relative py-1 text-sm font-medium text-gray-600 hover:text-slate-900 transition-colors"
              >
                {lang === 'bn' ? 'কমিশন হিসাব' : 'Commission Structure'}
              </a>
              <a
                href="#benefits"
                className="relative py-1 text-sm font-medium text-gray-600 hover:text-slate-900 transition-colors"
              >
                {lang === 'bn' ? 'সুবিধাসমূহ' : 'Benefits'}
              </a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {/* Language Switcher */}
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    lang === 'en' ? 'bg-[#0284c7] text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    lang === 'bn' ? 'bg-[#0284c7] text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  বাংলা
                </button>
              </div>

              <Link
                href="/login"
                prefetch={false}
                className="text-sm font-medium text-gray-700 hover:text-[#0284c7] transition-colors"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                prefetch={false}
                className="btn-primary py-2 px-5 shadow-lg shadow-[#0284c7]/20 hover:shadow-[#0284c7]/40 text-sm"
              >
                {t.nav.register}
              </Link>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    lang === 'en' ? 'bg-[#0284c7] text-white' : 'text-gray-600'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    lang === 'bn' ? 'bg-[#0284c7] text-white' : 'text-gray-600'
                  }`}
                >
                  বাংলা
                </button>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-[#0284c7] focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-4 shadow-xl">
            <div className="flex flex-col space-y-2">
              <a
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                {lang === 'bn' ? 'কীভাবে কাজ করে' : 'How It Works'}
              </a>
              <a
                href="#commission"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                {lang === 'bn' ? 'কমিশন হিসাব' : 'Commission Structure'}
              </a>
              <a
                href="#benefits"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                {lang === 'bn' ? 'সুবিধাসমূহ' : 'Benefits'}
              </a>
            </div>
            <div className="pt-4 border-t border-gray-100 flex flex-col space-y-4">
              <Link
                href="/login"
                prefetch={false}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-gray-700 hover:text-[#0284c7]"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                prefetch={false}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full btn-primary py-3 px-5 text-center"
              >
                {t.nav.register}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section — Clean Merchant Landing Style with Rich Subtle Background */}
      <section className="relative pt-28 sm:pt-32 md:pt-36 pb-14 sm:pb-20 overflow-hidden bg-gradient-to-b from-[#e0f2fe]/70 via-[#f0f9ff] to-white border-b border-sky-100/80">
        {/* Subtle Architectural Grid & Ambient Glows */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(2, 132, 199, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(2, 132, 199, 0.08) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="absolute -top-24 right-1/4 w-[480px] h-[480px] bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[420px] h-[420px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto bg-white/75 backdrop-blur-md border border-sky-200/70 rounded-3xl px-5 py-8 sm:px-12 sm:py-14 shadow-xl shadow-sky-900/5">
            <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-4 sm:mb-5 leading-[1.4] sm:leading-[1.32]">
              <span className="inline-block py-2 text-transparent bg-clip-text bg-gradient-to-r from-[#122846] via-[#0284c7] to-[#0ea5e9]">
                {t.landing.heroTitle}
              </span>
            </h1>

            <p className="mt-3 max-w-2xl mx-auto text-base sm:text-xl text-gray-600 mb-8 leading-relaxed">
              {t.landing.heroSub}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                prefetch={false}
                className="w-full sm:w-auto btn-primary py-3 px-6 sm:py-4 sm:px-8 text-sm sm:text-lg group"
              >
                {t.landing.ctaJoin}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                prefetch={false}
                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-lg font-medium text-gray-700 bg-white border border-gray-200 rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors shadow-2xs"
              >
                {t.landing.ctaLogin}
              </Link>
            </div>
          </div>

          {/* Clean Light Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-10 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#122846]">{rate}%</p>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                {lang === 'bn' ? 'রেকারিং কমিশন হার' : 'Recurring Commission'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0284c7]">
                {duration} {lang === 'bn' ? 'মাস' : 'Months'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                {lang === 'bn' ? 'কমিশনের মেয়াদ' : 'Commission Duration'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#122846]">
                ৳{config.minimumWithdrawalAmount || 100}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                {lang === 'bn' ? 'ন্যূনতম উইথড্রয়াল' : 'Minimum Withdrawal'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0284c7]">
                +{config.extraTrialDaysForReferredMerchant || 10} {lang === 'bn' ? 'দিন' : 'Days'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                {lang === 'bn' ? 'মার্চেন্ট বোনাস ট্রায়াল' : 'Merchant Bonus Trial'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) — Matching Merchant FeaturesSection */}
      <section id="how-it-works" className="py-12 sm:py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-base font-semibold text-[#0284c7] tracking-wide uppercase">
              {lang === 'bn' ? 'প্রক্রিয়া' : 'How It Works'}
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
              {t.landing.howItWorksTitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Users,
                title: t.landing.step1Title,
                desc: t.landing.step1Desc,
              },
              {
                icon: Gift,
                title: t.landing.step2Title,
                desc: t.landing.step2Desc,
              },
              {
                icon: TrendingUp,
                title: t.landing.step3Title,
                desc: t.landing.step3Desc,
              },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[#0284c7]/10 text-[#0284c7] mb-5">
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Calculation Examples & Interactive Calculator */}
      <section id="commission" className="py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-base font-semibold text-[#0284c7] tracking-wide uppercase">
              {lang === 'bn' ? 'কমিশন স্ট্রাকচার' : 'Commission Structure'}
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {t.landing.calcTitle}
            </p>
            <p className="text-sm sm:text-base text-gray-500">{t.landing.calcSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">
                {t.landing.example1Label}
              </span>
              <p className="text-lg font-bold text-gray-900 mt-2">{t.landing.example1Math}</p>
              <p className="text-xs text-gray-500 mt-2">
                {lang === 'bn'
                  ? '৬ মাসে মোট সম্ভাব্য কমিশন (১ জন মার্চেন্ট থেকে): ৳১৪৯.৭০ × ৬ = ৳৮৯৮.২০'
                  : '6-Month recurring total from 1 merchant: ৳149.70 × 6 = ৳898.20'}
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#122846]">
                {t.landing.example2Label}
              </span>
              <p className="text-lg font-bold text-gray-900 mt-2">{t.landing.example2Math}</p>
              <p className="text-xs text-gray-500 mt-2">
                {lang === 'bn'
                  ? 'কমিশন সর্বদা মার্চেন্টের প্রকৃত পরিশোধিত টাকার (Actual Paid Amount) ওপর হিসাব করা হয়।'
                  : 'Commissions are always calculated on the actual amount paid by the merchant.'}
              </p>
            </div>
          </div>

          {/* Interactive Calculator */}
          <div className="p-6 sm:p-8 bg-gray-50/70 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-[#0284c7]" />
              <h3 className="font-bold text-gray-900">
                {lang === 'bn' ? 'আপনার সম্ভাব্য আয় হিসাব করুন' : 'Earnings Calculator'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  {lang === 'bn'
                    ? 'মার্চেন্টের মাসিক পেমেন্ট (৳)'
                    : 'Merchant Monthly Payment (৳)'}
                </label>
                <input
                  type="number"
                  min={100}
                  value={calcPaidAmount}
                  onChange={(e) => setCalcPaidAmount(Math.max(0, Number(e.target.value)))}
                  className="input-field font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  {lang === 'bn' ? 'রেফারকৃত সক্রিয় মার্চেন্ট সংখ্যা' : 'Referred Active Merchants'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={calcMerchants}
                  onChange={(e) => setCalcMerchants(Math.max(1, Number(e.target.value)))}
                  className="input-field font-bold text-sm"
                />
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-[#122846] via-[#0369a1] to-[#0284c7] text-white text-center">
                <p className="text-xs text-sky-100">
                  {lang === 'bn'
                    ? `${duration} মাসে সম্ভাব্য মোট কমিশন (${rate}%)`
                    : `Estimated ${duration}-Month Earnings (${rate}%)`}
                </p>
                <p className="text-2xl font-extrabold mt-1">৳{sixMonthTotal.toLocaleString()}</p>
                <p className="text-[11px] text-sky-100 mt-0.5">
                  ৳{perPaymentCommission} / {lang === 'bn' ? 'মার্চেন্ট প্রতি পেমেন্ট' : 'per payment'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-12 sm:py-16 bg-gray-50/50 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-8">
            {t.landing.benefitsTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {[t.landing.benefit1, t.landing.benefit2, t.landing.benefit3, t.landing.benefit4].map(
              (b, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-[#0284c7]/10 text-[#0284c7]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-gray-800">{b}</span>
                </div>
              )
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 text-center space-y-5 shadow-sm">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {t.landing.heroTitle}
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register" className="btn-primary py-3 px-8 text-sm sm:text-base">
                {t.landing.ctaJoin}
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 rounded-[var(--radius-md)] border border-gray-200 text-gray-700 font-semibold text-sm sm:text-base hover:bg-gray-50 transition-colors"
              >
                {t.landing.ctaLogin}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — Full Multi-Column Structure with Main Landing & Merchant Landing Links */}
      <footer
        className="bg-gray-900 pt-10 pb-6 sm:pt-16 sm:pb-8 border-t border-gray-800 mt-auto"
        aria-labelledby="footer-heading"
      >
        <h2 id="footer-heading" className="sr-only">
          Footer
        </h2>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8 mb-8 sm:mb-12">
            {/* Brand Column */}
            <div className="space-y-4 sm:space-y-6 xl:col-span-1">
              <div className="flex items-center gap-2.5">
                <img
                  src="/masheco-logo.png"
                  alt="MASH ECO"
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                />
                <span className="text-2xl sm:text-3xl font-righteous text-white tracking-tight">
                  MASH ECO
                </span>
              </div>
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                {lang === 'bn'
                  ? 'সব আকারের ব্যবসার জন্য ই-কমার্সকে সহজ, সাশ্রয়ী এবং শক্তিশালী করার প্ল্যাটফর্ম।'
                  : 'Making e-commerce simple, accessible, and powerful for businesses of all sizes.'}
              </p>
            </div>

            {/* Links Grid */}
            <div className="mt-8 sm:mt-10 grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 xl:mt-0 xl:col-span-2">
              {/* Column 1: Platform & Main Landing */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-300 tracking-wider uppercase">
                  {lang === 'bn' ? 'প্ল্যাটফর্ম' : 'Platform'}
                </h3>
                <ul role="list" className="mt-2.5 sm:mt-3.5 space-y-2 sm:space-y-2.5">
                  <li>
                    <a
                      href={mainLandingUrl}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'মেইন ওয়েবসাইট' : 'Main Website'}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`${mainLandingUrl}/landing/about-us`}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us'}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`${mainLandingUrl}/landing/blog`}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'ব্লগ' : 'Blog'}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`${mainLandingUrl}/landing/contact`}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'যোগাযোগ' : 'Contact'}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 2: Merchant & Affiliate Links */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-300 tracking-wider uppercase">
                  {lang === 'bn' ? 'মার্চেন্ট ও পার্টনার' : 'Merchant & Partner'}
                </h3>
                <ul role="list" className="mt-2.5 sm:mt-3.5 space-y-2 sm:space-y-2.5">
                  <li>
                    <a
                      href={`${merchantPortalBaseUrl}/register`}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'মার্চেন্ট রেজিস্টার' : 'Become a Merchant'}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`${merchantPortalBaseUrl}/login`}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'মার্চেন্ট লগইন' : 'Merchant Login'}
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/register"
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {t.nav.register}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {t.nav.login}
                    </Link>
                  </li>
                  <li>
                    <a
                      href={`${mainLandingUrl}/landing/documentation`}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'ডকুমেন্টেশন' : 'Documentation'}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 3: Legal */}
              <div className="col-span-2 md:col-span-1">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-300 tracking-wider uppercase">
                  {lang === 'bn' ? 'লিগ্যাল' : 'Legal'}
                </h3>
                <ul role="list" className="mt-2.5 sm:mt-3.5 space-y-2 sm:space-y-2.5">
                  <li>
                    <a
                      href={`${mainLandingUrl}/landing/privacy-policy`}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'প্রাইভেসি পলিসি' : 'Privacy Policy'}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`${mainLandingUrl}/landing/terms-of-service`}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'টার্মস অব সার্ভিস' : 'Terms of Service'}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`${mainLandingUrl}/landing/cookie-policy`}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'কুকি পলিসি' : 'Cookie Policy'}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`${mainLandingUrl}/landing/account-deletion`}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'অ্যাকাউন্ট ডিলিশন' : 'Account Deletion'}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} MASH ECO. All rights reserved.
            </p>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-400">
              <span className="font-medium">
                A product of <span className="text-white">Mash Tech</span>
              </span>
              <span className="hidden sm:inline-block text-gray-600">•</span>
              <span>Made with ❤️ for merchants &amp; partners</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
