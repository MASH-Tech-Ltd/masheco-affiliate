'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAffiliateLang } from '@/context/LanguageContext';
import { affiliateApi } from '@/utils/affiliateApi';

export default function AffiliateLoginPage() {
  const router = useRouter();
  const { lang, setLang, t } = useAffiliateLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect immediately to dashboard
    try {
      const stored =
        localStorage.getItem('affiliate_user') || sessionStorage.getItem('affiliate_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && (u._id || u.id || u.role === 'affiliate_partner')) {
          router.replace('/dashboard');
          return;
        }
      }
    } catch {}

    affiliateApi
      .get('/me')
      .then((res) => {
        if (res.data?.data?.user) {
          localStorage.setItem('affiliate_user', JSON.stringify(res.data.data.user));
          router.replace('/dashboard');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email =
        lang === 'bn' ? 'সঠিক ইমেইল অ্যাড্রেস প্রদান করুন' : 'Please provide a valid email address';
    }
    if (!password) {
      errors.password = lang === 'bn' ? 'পাসওয়ার্ড আবশ্যক' : 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/affiliate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.errors && Array.isArray(data.errors)) {
          const beErrors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            if (err.field) beErrors[err.field] = err.message;
          });
          setFieldErrors(beErrors);
        }
        throw new Error(
          data?.message ||
            (lang === 'bn' ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়' : 'Invalid email or password')
        );
      }

      if (data?.data?.user) {
        localStorage.setItem('affiliate_user', JSON.stringify(data.data.user));
        sessionStorage.setItem('affiliate_user', JSON.stringify(data.data.user));
        toast.success(lang === 'bn' ? 'সফলভাবে লগইন হয়েছে!' : 'Logged in successfully!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === 'bn' ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়' : 'Invalid email or password')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Panel - Premium Brand Hero (Identical to Merchant Login) */}
      <div className="relative hidden lg:flex flex-1 flex-col justify-center items-end p-16 xl:p-24 overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
            alt="MASH ECO Affiliate Program"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent-primary))]/90 to-gray-900/90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10 w-full max-w-xl">
          <Link href="/" className="flex items-center gap-3 mb-12 hover:opacity-90 transition-opacity">
            <div className="flex items-center justify-center">
              <img
                src="/masheco-logo.png"
                alt="MASH ECO Logo"
                className="w-14 h-14 object-contain"
              />
            </div>
            <span className="text-3xl font-righteous text-white tracking-tight">MASH ECO</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white mb-6 leading-[1.15]">
            {lang === 'bn'
              ? 'রেফার করুন এবং নিয়মিত কমিশন আয় করুন।'
              : 'Refer merchants and earn recurring commissions.'}
          </h1>
          <p className="text-lg text-gray-300 mb-12 leading-relaxed max-w-md">
            {lang === 'bn'
              ? 'MASH ECO অ্যাফিলিয়েট ড্যাশবোর্ডে লগইন করে আপনার রেফারেল, ৬ মাসের ৩০% রেকারিং কমিশন এবং উইথড্রয়াল সহজেই ট্র্যাক করুন।'
              : 'Sign in to the MASH ECO Affiliate Partner platform. Track your referred stores, 30% recurring commissions, and instant payouts.'}
          </p>

          <div className="flex flex-col gap-4 text-gray-300">
            <div className="flex items-center gap-3">
              <div className="bg-[hsl(var(--accent-primary))]/20 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">
                  {lang === 'bn' ? '৩০% রেকারিং কমিশন' : '30% Recurring Commission'}
                </span>
                <span className="text-xs text-gray-400">
                  {lang === 'bn'
                    ? 'প্রতিটি রেফারকৃত মার্চেন্টের ৬ মাসের পেমেন্ট থেকে নিশ্চিত আয়।'
                    : 'Earn on every qualifying subscription payment for 6 months.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center lg:items-start p-6 sm:p-12 lg:p-16 xl:p-24 relative">
        <div className="w-full flex items-center justify-between lg:justify-end mb-8 lg:mb-0 lg:absolute lg:top-8 lg:right-12 lg:w-auto">
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <img
              src="/masheco-logo.png"
              alt="MASH ECO"
              className="w-9 h-9 sm:w-12 sm:h-12 object-contain"
            />
            <span className="text-2xl sm:text-3xl font-righteous text-gray-900 tracking-tight">
              MASH ECO
            </span>
          </Link>

          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                lang === 'en' ? 'bg-[#0284c7] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                lang === 'bn' ? 'bg-[#0284c7] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              {lang === 'bn' ? 'স্বাগতম' : 'Welcome back'}
            </h2>
            <p className="text-gray-500 text-sm">{t.auth.loginSub}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                {t.auth.email}
              </label>
              <input
                type="email"
                id="email"
                className={`w-full px-4 py-3 rounded-xl border ${
                  fieldErrors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200 bg-white'
                } text-gray-900 text-sm focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-[hsl(var(--accent-primary))] transition-all outline-none placeholder:text-gray-400`}
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {fieldErrors.email && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.email}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                {t.auth.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    fieldErrors.password ? 'border-red-400 bg-red-50/30' : 'border-gray-200 bg-white'
                  } text-gray-900 text-sm focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-[hsl(var(--accent-primary))] transition-all outline-none placeholder:text-gray-400 pr-10`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-0.5">
                <Link
                  href="/forgot"
                  className="text-xs text-[hsl(var(--accent-primary))] font-semibold hover:text-[hsl(var(--accent-primary))]/80 transition-colors"
                >
                  {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                </Link>
              </div>
              {fieldErrors.password && (
                <span className="text-xs text-red-500 font-medium">{fieldErrors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className="mt-2 w-full bg-[hsl(var(--accent-primary))] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-[hsl(var(--accent-primary))]/25 hover:shadow-[hsl(var(--accent-primary))]/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{lang === 'bn' ? 'লগইন হচ্ছে...' : 'Signing in...'}</span>
                </div>
              ) : (
                t.auth.signInBtn
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              {t.auth.dontHaveAccount}{' '}
              <Link
                href="/register"
                className="text-[hsl(var(--accent-primary))] font-semibold hover:underline"
              >
                {t.nav.register}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
