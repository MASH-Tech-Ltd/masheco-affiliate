'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAffiliateLang } from '@/context/LanguageContext';

export default function AffiliateForgotPage() {
  const router = useRouter();
  const { lang, setLang } = useAffiliateLang();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please provide a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/affiliate/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const beErrors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            beErrors[err.field] = err.message;
          });
          setFieldErrors(beErrors);
          throw new Error('Please fix the errors below.');
        }
        throw new Error(data.message || 'Failed to send OTP');
      }

      toast.success(
        lang === 'bn' ? 'আপনার ইমেইলে OTP পাঠানো হয়েছে' : 'OTP sent successfully to your email'
      );
      setResetToken(data.data?.resetToken || data.resetToken);
      setStep(2);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!otp.trim()) errors.otp = 'OTP is required';
    if (!password) {
      errors.password = 'Password is required';
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@#%^&*?\-+=\!])/.test(password) ||
      password.length < 8
    ) {
      errors.password =
        'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/affiliate/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, otp, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const beErrors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            beErrors[err.field] = err.message;
          });
          setFieldErrors(beErrors);
          throw new Error('Please fix the errors below.');
        }
        throw new Error(data.message || 'Failed to reset password');
      }

      toast.success(
        lang === 'bn'
          ? 'পাসওয়ার্ড সফলভাবে রিসেট হয়েছে। লগইন পেজে নিয়ে যাওয়া হচ্ছে...'
          : 'Password reset successfully. Redirecting to login...'
      );
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Panel - Premium Brand Hero (Identical to Merchant Forgot Password) */}
      <div className="relative hidden lg:flex flex-1 flex-col justify-center items-end p-16 xl:p-24 overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
            alt="Secure access"
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
              ? 'আপনার পার্টনার অ্যাকাউন্টের নিরাপদ অ্যাক্সেস।'
              : 'Secure access to your partner account.'}
          </h1>
          <p className="text-lg text-gray-300 mb-12 leading-relaxed max-w-md">
            {lang === 'bn'
              ? 'পাসওয়ার্ড ভুলে গেলে চিন্তার কিছু নেই। আমরা ইমেইল ওটিপি (OTP)-এর মাধ্যমে আপনার অ্যাকাউন্ট নিরাপদে পুনরুদ্ধার করতে সাহায্য করব।'
              : "Don't worry if you've lost your password. We'll help you securely recover your Affiliate Partner account via OTP."}
          </p>

          <div className="flex flex-col gap-4 text-gray-300">
            <div className="flex items-center gap-3">
              <div className="bg-[hsl(var(--accent-primary))]/20 p-1.5 rounded-full">
                <Lock className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
              </div>
              <span className="text-sm font-medium">Enterprise-grade security</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-[hsl(var(--accent-primary))]/20 p-1.5 rounded-full">
                <Zap className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
              </div>
              <span className="text-sm font-medium">Instant OTP recovery process</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center lg:items-start p-6 sm:p-12 lg:p-16 xl:p-24 relative overflow-y-auto">
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
              {step === 1
                ? lang === 'bn'
                  ? 'পাসওয়ার্ড ভুলে গেছেন?'
                  : 'Forgot Password?'
                : lang === 'bn'
                ? 'নতুন পাসওয়ার্ড সেট করুন'
                : 'Reset Password'}
            </h2>
            <p className="text-gray-500 text-sm">
              {step === 1
                ? lang === 'bn'
                  ? 'ওটিপি (OTP) পেতে আপনার নিবন্ধিত ইমেইল অ্যাড্রেস দিন।'
                  : 'Enter your email below to receive an OTP.'
                : lang === 'bn'
                ? 'আপনার ইমেইলে পাঠানো ৬ সংখ্যার OTP এবং নতুন পাসওয়ার্ড দিন।'
                : 'Enter the OTP and your new password to restore access.'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRequestOTP} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  {lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
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

              <button
                type="submit"
                className="mt-2 w-full bg-[hsl(var(--accent-primary))] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-[hsl(var(--accent-primary))]/25 hover:shadow-[hsl(var(--accent-primary))]/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{lang === 'bn' ? 'ওটিপি পাঠানো হচ্ছে...' : 'Sending OTP...'}</span>
                  </div>
                ) : lang === 'bn' ? (
                  'ওটিপি পাঠান (Send OTP)'
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-5" autoComplete="off">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="otp_code" className="text-sm font-semibold text-gray-700">
                  One-Time Password (OTP)
                </label>
                <input
                  type="text"
                  id="otp_code"
                  autoComplete="one-time-code"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    fieldErrors.otp ? 'border-red-400 bg-red-50/30' : 'border-gray-200 bg-white'
                  } text-gray-900 text-center text-lg tracking-[0.5em] font-bold focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-[hsl(var(--accent-primary))] transition-all outline-none placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal`}
                  placeholder="••••••"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                {fieldErrors.otp && (
                  <span className="text-xs text-red-500 font-medium text-center">
                    {fieldErrors.otp}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.password
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-gray-200 bg-white'
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
                {fieldErrors.password && (
                  <span className="text-xs text-red-500 font-medium">{fieldErrors.password}</span>
                )}
              </div>

              <button
                type="submit"
                className="mt-2 w-full bg-[hsl(var(--accent-primary))] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-[hsl(var(--accent-primary))]/25 hover:shadow-[hsl(var(--accent-primary))]/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                disabled={loading || isSuccess}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{lang === 'bn' ? 'রিসেট হচ্ছে...' : 'Resetting...'}</span>
                  </div>
                ) : lang === 'bn' ? (
                  'পাসওয়ার্ড রিসেট করুন'
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              {lang === 'bn' ? 'পাসওয়ার্ড মনে পড়েছে?' : 'Remembered your password?'}{' '}
              <Link
                href="/login"
                className="text-[hsl(var(--accent-primary))] font-semibold hover:underline"
              >
                {lang === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Login'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
