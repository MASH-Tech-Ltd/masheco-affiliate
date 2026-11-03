'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  ShieldAlert,
  Copy,
  Check,
  ArrowUpRight,
  Percent,
  Clock,
  LifeBuoy,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAffiliateLang } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import { affiliateApi } from '@/utils/affiliateApi';
import {
  affiliateCache,
  clearAffiliateCache,
  prefetchAffiliateDashboardData,
} from '@/utils/affiliateCache';

export default function AffiliateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useAffiliateLang();
  const { socket } = useSocket();

  const [user, setUser] = useState<any>(() => affiliateCache.me?.user || null);
  const [affiliate, setAffiliate] = useState<any>(() => affiliateCache.me?.affiliate || null);
  const [programConfig, setProgramConfig] = useState<any>(
    () => affiliateCache.me?.programConfig || null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(() => !affiliateCache.me);
  const [copiedSidebarCode, setCopiedSidebarCode] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const res = await affiliateApi.get('/me');
      if (res.data?.data) {
        affiliateCache.me = {
          user: res.data.data.user,
          affiliate: res.data.data.affiliate,
          programConfig: res.data.data.programConfig,
        };
        setUser(res.data.data.user);
        setAffiliate(res.data.data.affiliate);
        setProgramConfig(res.data.data.programConfig);
        if (typeof window !== 'undefined' && res.data.data.user) {
          localStorage.setItem('affiliate_user', JSON.stringify(res.data.data.user));
        }
        prefetchAffiliateDashboardData();
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        clearAffiliateCache();
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Listen for profile updates from Settings page so navbar avatar & name update immediately
  useEffect(() => {
    const handleProfileUpdated = () => {
      fetchMe();
    };
    window.addEventListener('affiliate:profile-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('affiliate:profile-updated', handleProfileUpdated);
    };
  }, [fetchMe]);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      fetchMe();
    };
    socket.on('affiliate:balance:updated', handleRefresh);
    socket.on('affiliate:status:changed', (payload: any) => {
      handleRefresh();
      if (payload?.status === 'suspended') {
        toast.error('Your affiliate account has been suspended');
      } else if (payload?.status === 'active') {
        toast.success('Your affiliate account is now active!');
      }
    });
    socket.on('affiliate:commission:created', (payload: any) => {
      handleRefresh();
      toast.success(
        lang === 'bn'
          ? `নতুন কমিশন অর্জিত হয়েছে: ৳${payload?.commissionAmount || 0}!`
          : `New commission earned: ৳${payload?.commissionAmount || 0}!`
      );
    });
    socket.on('affiliate:withdrawal:updated', (payload: any) => {
      handleRefresh();
      toast.success(`Withdrawal request status: ${payload?.status || 'updated'}`);
    });

    return () => {
      socket.off('affiliate:balance:updated', handleRefresh);
      socket.off('affiliate:status:changed');
      socket.off('affiliate:commission:created');
      socket.off('affiliate:withdrawal:updated');
    };
  }, [socket, lang, fetchMe]);

  const handleLogout = async () => {
    try {
      await affiliateApi.post('/logout');
    } catch {
      // ignore
    }
    clearAffiliateCache();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('affiliate_user');
      sessionStorage.removeItem('affiliate_user');
    }
    router.replace('/login');
  };

  const handleCopySidebarCode = () => {
    if (!affiliate?.affiliateCode) return;
    navigator.clipboard.writeText(affiliate.affiliateCode);
    setCopiedSidebarCode(true);
    toast.success(t.overview.copied);
    setTimeout(() => setCopiedSidebarCode(false), 2000);
  };

  const navSections = [
    {
      title: lang === 'bn' ? 'প্রধান মেনু' : 'MAIN MENU',
      items: [
        { href: '/dashboard', label: t.nav.overview, icon: LayoutDashboard },
        { href: '/dashboard/referrals', label: t.nav.referrals, icon: Users },
      ],
    },
    {
      title: lang === 'bn' ? 'আয় ও পেআউট' : 'FINANCE & PAYOUTS',
      items: [
        { href: '/dashboard/commissions', label: t.nav.commissions, icon: DollarSign },
        { href: '/dashboard/withdrawals', label: t.nav.withdrawals, icon: Wallet },
      ],
    },
    {
      title: lang === 'bn' ? 'সাপোর্ট ও অ্যাকাউন্ট' : 'SUPPORT & ACCOUNT',
      items: [
        { href: '/dashboard/support', label: t.nav.support, icon: LifeBuoy },
        { href: '/dashboard/settings', label: t.nav.settings, icon: Settings },
      ],
    },
  ];

  const getHeaderMeta = () => {
    if (pathname.startsWith('/dashboard/referrals')) {
      return { title: t.referrals.title, subtitle: t.referrals.subtitle };
    }
    if (pathname.startsWith('/dashboard/commissions')) {
      return { title: t.commissions.title, subtitle: t.commissions.subtitle };
    }
    if (pathname.startsWith('/dashboard/withdrawals')) {
      return { title: t.withdrawals.title, subtitle: t.withdrawals.subtitle };
    }
    if (pathname.startsWith('/dashboard/support')) {
      return { title: t.support.title, subtitle: t.support.subtitle };
    }
    if (pathname.startsWith('/dashboard/settings')) {
      return { title: t.settings.title, subtitle: t.settings.subtitle };
    }
    return { title: t.overview.title, subtitle: t.overview.subtitle };
  };

  const headerMeta = getHeaderMeta();
  const avatarUrl = user?.avatar?.secure_url || user?.avatarUrl || '';
  const userInitial = (user?.name || user?.email || 'P').charAt(0).toUpperCase();
  const availableBalance = Number(affiliate?.availableBalance || 0);
  const pendingBalance = Number(affiliate?.pendingBalance || 0);
  const commissionRate = Number(programConfig?.commissionRate ?? 30);
  const commissionMonths = Number(programConfig?.commissionDurationMonths ?? 6);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0284c7] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            {lang === 'bn' ? 'ড্যাশবোর্ড লোড হচ্ছে...' : 'Loading partner dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Dark Navy Sidebar (Matches Merchant Dashboard #122846) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] shrink-0 border-r border-[#122846] bg-[#122846] flex flex-col h-full overflow-hidden transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <Link href="/dashboard" className="flex flex-col justify-center cursor-pointer group">
            <div className="flex items-center gap-2">
              <img
                src="/masheco-logo.png"
                alt="MASH ECO"
                className="w-8 h-8 object-contain"
              />
              <span className="text-2xl font-righteous text-white tracking-tight leading-none mt-0.5">
                MASH ECO
              </span>
            </div>
            <span className="text-[8px] font-bold text-slate-400 tracking-[0.25em] uppercase pl-10 -mt-0.5 leading-none">
              AFFILIATE HUB
            </span>
          </Link>

          <button
            type="button"
            className="lg:hidden p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
                {section.title}
              </div>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white font-medium shadow-sm'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-[18px] h-[18px] ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.href === '/dashboard/withdrawals' && availableBalance > 0 && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/20'
                          }`}
                        >
                          ৳{availableBalance.toLocaleString()}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Affiliate Partner Status & Quick Wallet Card */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-[#122846] space-y-3">
          {/* Mobile / XS Language Toggle inside Sidebar */}
          <div className="flex sm:hidden items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>{lang === 'bn' ? 'ভাষা' : 'Language'}</span>
            </div>
            <div className="flex items-center bg-[#0d1d35] p-0.5 rounded-full border border-white/10">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#0284c7] text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-[#0284c7] text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>

          <div className="border border-white/10 rounded-xl p-3.5 bg-white/5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center text-sky-400">
                  <Percent className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-white">
                  {commissionRate}% {lang === 'bn' ? 'রেকারিং' : 'Recurring'}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  affiliate?.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : affiliate?.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    affiliate?.status === 'active'
                      ? 'bg-emerald-400'
                      : affiliate?.status === 'pending'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                />
                {affiliate?.status || 'active'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
              {lang === 'bn'
                ? `রেফারকৃত মার্চেন্টের প্রথম ${commissionMonths} মাসের প্রতিটি পেমেন্টে ${commissionRate}% কমিশন।`
                : `Earn ${commissionRate}% on every referred merchant payment for ${commissionMonths} months.`}
            </p>

            {/* Quick Copy Referral Code inside Sidebar */}
            <div className="flex items-center justify-between gap-2 bg-[#0d1d35] border border-white/10 rounded-lg px-2.5 py-1.5 mb-2.5">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  {lang === 'bn' ? 'রেফারেল কোড' : 'Referral Code'}
                </p>
                <p className="text-xs font-mono font-bold text-sky-300 truncate">
                  {affiliate?.affiliateCode || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopySidebarCode}
                title="Copy Referral Code"
                className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
              >
                {copiedSidebarCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <Link
              href="/dashboard/withdrawals"
              className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'উইথড্রয়াল ও ওয়ালেট' : 'Wallet & Withdrawals'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Corner Header Bar */}
        <header className="h-14 sm:h-16 flex items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 border-b border-gray-200/80 shrink-0 bg-white z-20">
          {/* Left: Mobile Menu Toggle + Page Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-base lg:text-lg font-bold text-slate-900 truncate leading-tight">
                {headerMeta.title}
              </h1>
              <p className="hidden md:block text-xs text-slate-500 truncate">
                {headerMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Right Corner Navbar: Balance Pill + Language + User Profile & Avatar + Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Available Balance Pill (Clickable -> Withdrawals) */}
            <Link
              href="/dashboard/withdrawals"
              title={
                lang === 'bn'
                  ? 'উত্তোলনযোগ্য ব্যালেন্স (উইথড্র করতে ক্লিক করুন)'
                  : 'Available Balance (Click to withdraw)'
              }
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/90 shadow-2xs transition-all group cursor-pointer shrink-0"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-950 tracking-tight whitespace-nowrap">
                ৳{availableBalance.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {pendingBalance > 0 && (
                <span
                  title={lang === 'bn' ? 'পেন্ডিং কমিশন' : 'Pending Commission'}
                  className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-800 border border-amber-200 text-[10px] font-bold whitespace-nowrap"
                >
                  <Clock className="w-2.5 h-2.5" />
                  +৳{pendingBalance.toLocaleString('en-BD')}
                </span>
              )}
            </Link>

            {/* Language Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-full border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#0284c7] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-[#0284c7] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                বাংলা
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* User Profile Card & Profile Picture / Avatar (Clickable -> Settings) */}
            <Link
              href="/dashboard/settings"
              title={lang === 'bn' ? 'প্রোফাইল এবং সেটিংস' : 'Profile & Account Settings'}
              className="flex items-center gap-2 py-1 px-1 sm:px-2 rounded-xl hover:bg-slate-100/80 transition-colors group cursor-pointer shrink-0"
            >
              <div className="text-right hidden md:block leading-tight">
                <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#0284c7] transition-colors truncate max-w-[140px]">
                  {user?.name || 'Affiliate Partner'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
                  {user?.email || affiliate?.affiliateCode || 'Partner'}
                </div>
              </div>

              <div className="relative shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#122846] to-[#0284c7] text-white flex items-center justify-center font-bold text-xs sm:text-sm overflow-hidden border-2 border-sky-200 shadow-xs group-hover:border-[#0284c7] transition-all">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.name || 'Partner Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white ${
                    affiliate?.status === 'active'
                      ? 'bg-emerald-500'
                      : affiliate?.status === 'pending'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
              </div>
            </Link>

            {/* Sign Out Icon Button */}
            <button
              type="button"
              onClick={handleLogout}
              title={t.nav.logout}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        {/* Status Notice Banner (Flat Warning Bar) */}
        {affiliate?.status === 'pending' && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-3 sm:px-8 py-2 z-10 flex items-center justify-between gap-2 text-[11px] sm:text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
              <p className="font-semibold leading-snug">{t.overview.statusBannerPending}</p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
              {lang === 'bn' ? 'অনুমোদনের অপেক্ষায়' : 'Pending Review'}
            </span>
          </div>
        )}

        {affiliate?.status === 'suspended' && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-900 px-3 sm:px-8 py-2 z-10 flex items-center justify-between gap-2 text-[11px] sm:text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
              <p className="font-semibold leading-snug">
                {t.overview.statusBannerSuspended}
                {affiliate?.suspensionReason ? ` — ${affiliate.suspensionReason}` : ''}
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
              {lang === 'bn' ? 'স্থগিত' : 'Suspended'}
            </span>
          </div>
        )}

        {/* Full-Width Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-3 sm:p-6 lg:p-8">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
