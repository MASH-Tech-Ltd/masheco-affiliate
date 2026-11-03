'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAffiliateLang } from '@/context/LanguageContext';
import { affiliateApi } from '@/utils/affiliateApi';

export default function AffiliateRegisterPage() {
  const router = useRouter();
  const { lang, setLang, t } = useAffiliateLang();
  const [config, setConfig] = useState<any>({
    programEnabled: true,
    allowAffiliateRegistration: true,
    maxAffiliates: 500,
    currentAffiliateCount: 0,
    defaultCommissionRate: 30,
    commissionDurationMonths: 6,
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Real-time password validation checklist (same as Merchant Register)
  const passwordCriteria = [
    {
      id: 'length',
      label: '8-16 characters in length',
      valid: form.password.length >= 8 && form.password.length <= 16,
    },
    {
      id: 'lowercase',
      label: 'lower case letter',
      valid: /[a-z]/.test(form.password),
    },
    {
      id: 'uppercase',
      label: 'upper case letter',
      valid: /[A-Z]/.test(form.password),
    },
    {
      id: 'numeric',
      label: 'numeric character',
      valid: /[0-9]/.test(form.password),
    },
    {
      id: 'special',
      label: 'special character: $ @ # % ^ & * ? - + =',
      valid: /[$@#%^&*?\-+=\!]/.test(form.password),
    },
  ];

  useEffect(() => {
    affiliateApi
      .get('/public-config')
      .then((res) => {
        if (res.data?.data) setConfig(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoadingConfig(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please provide a valid email address';
    }
    if (!form.phone.trim() || form.phone.trim().length < 8) {
      errors.phone = 'Please provide a valid mobile number';
    }
    if (!form.password || form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword =
        lang === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না' : 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
            (lang === 'bn' ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' : 'Failed to register affiliate account')
        );
      }

      if (data?.data?.user) {
        localStorage.setItem('affiliate_user', JSON.stringify(data.data.user));
        sessionStorage.setItem('affiliate_user', JSON.stringify(data.data.user));
        toast.success(
          lang === 'bn'
            ? 'অ্যাফিলিয়েট পার্টনার অ্যাকাউন্ট তৈরি হয়েছে!'
            : 'Affiliate Partner account created!'
        );
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === 'bn' ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' : 'Failed to register affiliate account')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Panel - Premium Brand Hero (Identical to Merchant Register) */}
      <div className="relative hidden lg:flex flex-1 flex-col justify-center items-end p-16 xl:p-24 overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
            alt="MASH ECO Affiliate Success"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
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
              ? 'আজই MASH ECO অ্যাফিলিয়েট পার্টনার হিসেবে যাত্রা শুরু করুন।'
              : 'Start earning with MASH ECO today.'}
          </h1>
          <p className="text-lg text-gray-300 mb-12 leading-relaxed max-w-md">
            {lang === 'bn'
              ? 'ফ্রি অ্যাকাউন্ট তৈরি করে আপনার ইউনিক রেফারেল লিংক নিন এবং প্রতিটি রেফারকৃত মার্চেন্ট থেকে ৬ মাস পর্যন্ত ৩০% রেকারিং কমিশন আয় করুন।'
              : 'Create your free Affiliate Partner account in seconds and earn 30% recurring commission for 6 months on every referred merchant.'}
          </p>

          <div className="flex flex-col gap-4 text-gray-300">
            <div className="flex items-center gap-3">
              <div className="bg-[hsl(var(--accent-primary))]/20 p-1.5 rounded-full">
                <Check className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
              </div>
              <span className="text-sm font-medium">
                {lang === 'bn'
                  ? 'প্রতিটি মার্চেন্ট থেকে ৬ মাস ৩০% রেকারিং কমিশন'
                  : '30% recurring commission for 6 months per merchant'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-[hsl(var(--accent-primary))]/20 p-1.5 rounded-full">
                <Check className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
              </div>
              <span className="text-sm font-medium">
                {lang === 'bn'
                  ? 'মাত্র ৳১০০ হলেই বিকাশ, নগদ, রকেট বা ব্যাংকে উত্তোলন'
                  : 'Fast payouts starting from ৳100 via bKash, Nagad, Rocket & Bank'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-[hsl(var(--accent-primary))]/20 p-1.5 rounded-full">
                <Check className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
              </div>
              <span className="text-sm font-medium">
                {lang === 'bn'
                  ? 'রেফারকৃত মার্চেন্টদের জন্য অতিরিক্ত বোনাস ফ্রি ট্রায়াল'
                  : 'Extra bonus free trial days for every merchant you refer'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex flex-col justify-center items-center lg:items-start p-4 xs:p-6 sm:p-12 lg:p-16 xl:p-24 relative overflow-y-auto">
        <div className="w-full flex items-center justify-between lg:justify-end mb-6 lg:mb-0 lg:absolute lg:top-8 lg:right-12 lg:w-auto">
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
          <div className="mb-6 xs:mb-8 text-left">
            <h2 className="text-2xl xs:text-3xl font-extrabold text-gray-900 mb-1.5 xs:mb-2 tracking-tight">
              {t.auth.registerTitle}
            </h2>
            <p className="text-gray-500 text-xs xs:text-sm">{t.auth.registerSub}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loadingConfig && !config.allowAffiliateRegistration ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="font-bold text-amber-900 text-sm">{t.auth.registrationClosedTitle}</h3>
              <p className="text-xs text-amber-800 leading-relaxed">{t.auth.registrationFullMsg}</p>
              <Link
                href="/login"
                className="inline-block px-5 py-2.5 rounded-xl bg-[hsl(var(--accent-primary))] text-white text-xs font-bold"
              >
                {t.nav.login}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  {t.auth.fullName}
                </label>
                <input
                  type="text"
                  id="name"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    fieldErrors.name ? 'border-red-400 bg-red-50/30' : 'border-gray-200 bg-white'
                  } text-gray-900 text-sm focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-[hsl(var(--accent-primary))] transition-all outline-none placeholder:text-gray-400`}
                  placeholder="e.g. Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                {fieldErrors.name && (
                  <span className="text-xs text-red-500 font-medium">{fieldErrors.name}</span>
                )}
              </div>

              {/* Email */}
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
                  placeholder="e.g. partner@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                {fieldErrors.email && (
                  <span className="text-xs text-red-500 font-medium">{fieldErrors.email}</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  {t.auth.phone}
                </label>
                <input
                  type="tel"
                  id="phone"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    fieldErrors.phone ? 'border-red-400 bg-red-50/30' : 'border-gray-200 bg-white'
                  } text-gray-900 text-sm focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-[hsl(var(--accent-primary))] transition-all outline-none placeholder:text-gray-400`}
                  placeholder="017XXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
                {fieldErrors.phone && (
                  <span className="text-xs text-red-500 font-medium">{fieldErrors.phone}</span>
                )}
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    {t.auth.password}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className={`w-full px-4 py-3 pr-10 rounded-xl border ${
                        fieldErrors.password
                          ? 'border-red-400 bg-red-50/30'
                          : 'border-gray-200 bg-white'
                      } text-gray-900 text-sm focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-[hsl(var(--accent-primary))] transition-all outline-none placeholder:text-gray-400`}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    {t.auth.confirmPassword}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      className={`w-full px-4 py-3 pr-10 rounded-xl border ${
                        fieldErrors.confirmPassword
                          ? 'border-red-400 bg-red-50/30'
                          : 'border-gray-200 bg-white'
                      } text-gray-900 text-sm focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-[hsl(var(--accent-primary))] transition-all outline-none placeholder:text-gray-400`}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {(fieldErrors.password || fieldErrors.confirmPassword) && (
                <span className="text-xs text-red-500 font-medium">
                  {fieldErrors.password || fieldErrors.confirmPassword}
                </span>
              )}

              {/* Password Strength Checklist (Same as Merchant Register) */}
              <div className="p-3 rounded-xl bg-[#f4f7fe] border border-blue-100/60 flex flex-col gap-1.5">
                {passwordCriteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="flex items-center gap-2 text-xs select-none transition-colors"
                  >
                    <Check
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200 ${
                        criterion.valid
                          ? 'text-blue-600 stroke-[2.5]'
                          : 'text-slate-300 stroke-[1.75]'
                      }`}
                    />
                    <span
                      className={`transition-colors duration-200 ${
                        criterion.valid ? 'font-semibold text-slate-900' : 'font-normal text-slate-400'
                      }`}
                    >
                      {criterion.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full bg-[hsl(var(--accent-primary))] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-[hsl(var(--accent-primary))]/25 hover:shadow-[hsl(var(--accent-primary))]/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{lang === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...'}</span>
                  </div>
                ) : (
                  t.auth.createAccountBtn
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              {t.auth.alreadyHaveAccount}{' '}
              <Link
                href="/login"
                className="text-[hsl(var(--accent-primary))] font-semibold hover:underline"
              >
                {t.nav.login}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
