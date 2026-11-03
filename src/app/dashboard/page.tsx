'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  DollarSign,
  Wallet,
  CheckCircle2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
  Link2,
  MousePointerClick,
  Percent,
  CalendarClock,
  Store,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAffiliateLang } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import { affiliateApi } from '@/utils/affiliateApi';
import { affiliateCache } from '@/utils/affiliateCache';

export default function AffiliateOverviewPage() {
  const { lang, t } = useAffiliateLang();
  const { socket } = useSocket();
  const [data, setData] = useState<any>(() => affiliateCache.overview || null);
  const [refPage, setRefPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [loading, setLoading] = useState(() => !affiliateCache.overview);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const fetchOverview = useCallback(async (rPage = 1, tPage = 1, isManual = false) => {
    try {
      if (!affiliateCache.overview) {
        setLoading(true);
      } else if (isManual) {
        setIsRefreshing(true);
      }
      const res = await affiliateApi.get('/overview', {
        params: { refPage: rPage, refLimit: 5, txPage: tPage, txLimit: 5 },
      });
      if (res.data?.data) {
        if (rPage === 1 && tPage === 1) {
          affiliateCache.overview = res.data.data;
        }
        setData(res.data.data);
      }
    } catch {
      if (!affiliateCache.overview) {
        toast.error('Failed to load overview metrics');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview(refPage, txPage);
  }, [fetchOverview, refPage, txPage]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchOverview(refPage, txPage);
    socket.on('affiliate:referral:created', refresh);
    socket.on('affiliate:commission:created', refresh);
    socket.on('affiliate:balance:updated', refresh);
    socket.on('affiliate:withdrawal:updated', refresh);
    return () => {
      socket.off('affiliate:referral:created', refresh);
      socket.off('affiliate:commission:created', refresh);
      socket.off('affiliate:balance:updated', refresh);
      socket.off('affiliate:withdrawal:updated', refresh);
    };
  }, [socket, fetchOverview, refPage, txPage]);

  const handleCopy = (text: string, type: 'link' | 'code') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(t.overview.copied);
    setTimeout(() => setCopied(null), 2000);
  };

  const summary = data?.summary || {};
  const aff = data?.affiliate || {};
  const referrals = data?.recentReferrals?.data || [];
  const refMeta = data?.recentReferrals?.meta || { page: 1, totalPages: 1, total: 0 };
  const transactions = data?.recentTransactions?.data || [];
  const txMeta = data?.recentTransactions?.meta || { page: 1, totalPages: 1, total: 0 };

  const referralCode = aff.affiliateCode || '';
  const referralLink =
    aff.referralLink ||
    (referralCode ? `https://merchant.masheco.com/register?ref=${referralCode}` : '');

  const statCards = [
    {
      label: t.overview.totalReferrals,
      value: summary.totalReferrals || 0,
      subLabel:
        lang === 'bn'
          ? `মোট লিংক ক্লিক: ${summary.totalClicks || 0}`
          : `Total Link Clicks: ${summary.totalClicks || 0}`,
      icon: Users,
      iconBg: 'bg-blue-50 text-[#0284c7] border-blue-100',
      accentBar: 'from-blue-500 to-sky-500',
    },
    {
      label: t.overview.activeReferrals,
      value: summary.activeReferrals || 0,
      subLabel:
        lang === 'bn'
          ? `পেইড সাবস্ক্রাইবার: ${summary.subscribedReferrals || 0}`
          : `Paid Subscribers: ${summary.subscribedReferrals || 0}`,
      icon: UserCheck,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accentBar: 'from-indigo-500 to-blue-600',
    },
    {
      label: t.overview.totalEarnings,
      value: `৳${Number(summary.totalEarnings || 0).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      subLabel:
        lang === 'bn'
          ? `পেন্ডিং কমিশন: ৳${Number(summary.pendingBalance || 0).toLocaleString()}`
          : `Pending Commission: ৳${Number(summary.pendingBalance || 0).toLocaleString()}`,
      icon: DollarSign,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accentBar: 'from-emerald-500 to-teal-500',
    },
    {
      label: t.overview.availableBalance,
      value: `৳${Number(summary.availableBalance || 0).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      subLabel:
        lang === 'bn'
          ? 'তাৎক্ষণিক উত্তোলনের জন্য প্রস্তুত'
          : 'Ready for payout request',
      icon: Wallet,
      iconBg: 'bg-sky-50 text-[#0284c7] border-sky-100',
      accentBar: 'from-[#0284c7] to-blue-600',
    },
    {
      label: t.overview.totalWithdrawn,
      value: `৳${Number(summary.totalWithdrawn || 0).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      subLabel:
        lang === 'bn'
          ? `রিজার্ভড প্রসেসিং: ৳${Number(summary.reservedBalance || 0).toLocaleString()}`
          : `Reserved in Queue: ৳${Number(summary.reservedBalance || 0).toLocaleString()}`,
      icon: CheckCircle2,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accentBar: 'from-purple-500 to-indigo-500',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Hero Banner: Referral Link & Code Sharing Hub */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#122846] via-[#163156] to-[#0284c7] text-white p-4 sm:p-6 lg:p-7 shadow-md border border-[#1e3a5f]">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
          {/* Left Info */}
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sky-200 text-[10px] sm:text-xs font-semibold">
              <Percent className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-300 shrink-0" />
              <span>
                {lang === 'bn'
                  ? `${aff.commissionRate || 30}% রেকারিং কমিশন • ${aff.commissionDurationMonths || 6} মাস মেয়াদ`
                  : `${aff.commissionRate || 30}% Recurring Commission • ${aff.commissionDurationMonths || 6} Months Window`}
              </span>
            </div>

            <h2 className="text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-snug">
              {lang === 'bn'
                ? 'মার্চেন্ট রেফার করুন এবং ৩০% রেকারিং কমিশন আয় করুন'
                : 'Refer Merchants & Earn 30% Recurring Commission'}
            </h2>
            <p className="text-[11px] sm:text-xs lg:text-sm text-slate-200/90 leading-relaxed">
              {lang === 'bn'
                ? 'নিচের রেফারেল লিংক বা কোডটি মার্চেন্টদের সাথে শেয়ার করুন। তারা রেজিস্টার করে সাবস্ক্রিপশন পেমেন্ট করলেই আপনি স্বয়ংক্রিয়ভাবে কমিশন পাবেন।'
                : 'Share your unique referral link or partner code below. Every qualifying subscription payment during their first 6 months credits 30% directly to your wallet.'}
            </p>
          </div>

          {/* Right Referral Link & Code Controls */}
          <div className="flex flex-col gap-2.5 sm:gap-3 w-full xl:max-w-lg shrink-0">
            {/* Referral Link Box */}
            <div className="bg-slate-950/35 backdrop-blur-xs border border-white/15 rounded-xl p-2.5 sm:p-2 sm:pl-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  <Link2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{t.referrals.yourReferralLink}</span>
                </div>
                <p className="text-[11px] sm:text-xs font-mono text-white truncate mt-0.5 select-all">
                  {referralLink || 'Loading...'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(referralLink, 'link')}
                className="w-full sm:w-auto px-3.5 py-2 sm:py-2.5 rounded-lg bg-white hover:bg-sky-50 text-[#122846] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
              >
                {copied === 'link' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{t.overview.copyLink}</span>
              </button>
            </div>

            {/* Code + Refresh Row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 bg-slate-950/35 backdrop-blur-xs border border-white/15 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-300 block truncate">
                    {t.referrals.yourReferralCode}
                  </span>
                  <span className="font-mono font-extrabold text-xs sm:text-sm text-sky-300 tracking-wide whitespace-nowrap block truncate">
                    {referralCode || '—'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(referralCode, 'code')}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copied === 'code' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{t.overview.copyCode}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => fetchOverview(refPage, txPage, true)}
                title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh Data'}
                className="p-3 sm:p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`relative bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden group ${
              i === 4 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <div
              className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${card.accentBar}`}
            />
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                  {card.label}
                </p>
                <p className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1 sm:mt-2 tracking-tight truncate">
                  {card.value}
                </p>
              </div>
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border ${card.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
              >
                <card.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
              <span className="truncate">{card.subLabel}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 2 Side-by-Side Tables: Recent Referrals & Recent Financial Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Referrals Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0284c7] flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{t.overview.recentReferrals}</h2>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'আপনার রেফারেলে যুক্ত সর্বশেষ মার্চেন্ট স্টোর'
                    : 'Latest merchant stores attributed to your code'}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/referrals"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0284c7] hover:text-[#0369a1] transition cursor-pointer"
            >
              <span>{lang === 'bn' ? 'সব দেখুন' : 'View All'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">{t.referrals.storeName}</th>
                  <th className="py-3 px-4">{t.referrals.subStatus}</th>
                  <th className="py-3 px-5 text-right">{t.referrals.commissionEarned}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {t.overview.noReferrals}
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs">
                          {lang === 'bn'
                            ? 'উপরের রেফারেল লিংক কপি করে মার্চেন্টদের সাথে শেয়ার করুন।'
                            : 'Share your referral link above to start attributing merchants.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  referrals.map((r: any) => (
                    <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900">{r.referredStoreName}</p>
                        <p className="text-[11px] text-slate-400">{r.referredEmail}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                            r.subscriptionStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.subscriptionStatus === 'trial'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-emerald-700">
                        ৳{Number(r.totalCommissionEarned || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page <strong>{refMeta.page}</strong> of <strong>{refMeta.totalPages}</strong>
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={refMeta.page <= 1}
                onClick={() => setRefPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={refMeta.page >= refMeta.totalPages}
                onClick={() => setRefPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Financial Ledger Transactions Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {t.overview.recentTransactions}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'কমিশন ক্রেডিট এবং উইথড্রয়াল লেজার হিস্ট্রি'
                    : 'Real-time commission credits and payout ledger'}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/commissions"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0284c7] hover:text-[#0369a1] transition cursor-pointer"
            >
              <span>{lang === 'bn' ? 'সব দেখুন' : 'View All'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">{t.commissions.date}</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <CalendarClock className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {t.overview.noTransactions}
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs">
                          {lang === 'bn'
                            ? 'রেফারকৃত মার্চেন্ট সাবস্ক্রিপশন কিনলে এখানে রেকর্ড দেখা যাবে।'
                            : 'Commission credits and withdrawals will appear here automatically.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">{tx.description}</td>
                      <td
                        className={`py-3.5 px-5 text-right font-extrabold whitespace-nowrap ${
                          tx.direction === 'credit' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {tx.direction === 'credit' ? '+' : '-'}৳
                        {Number(tx.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page <strong>{txMeta.page}</strong> of <strong>{txMeta.totalPages}</strong>
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={txMeta.page <= 1}
                onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={txMeta.page >= txMeta.totalPages}
                onClick={() => setTxPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
