'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Copy,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  UserCheck,
  Store,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAffiliateLang } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import CustomSelect from '@/components/CustomSelect';
import { affiliateApi } from '@/utils/affiliateApi';
import { affiliateCache } from '@/utils/affiliateCache';

export default function AffiliateReferralsPage() {
  const { lang, t } = useAffiliateLang();
  const { socket } = useSocket();
  const [referrals, setReferrals] = useState<any[]>(() => affiliateCache.referrals?.referrals || []);
  const [stats, setStats] = useState<any>(() => affiliateCache.referrals?.stats || {});
  const [meta, setMeta] = useState(
    () => affiliateCache.referrals?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 }
  );
  const [profile, setProfile] = useState<any>(
    () => affiliateCache.referrals?.profile || affiliateCache.me?.affiliate || null
  );

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [eligibilityStatus, setEligibilityStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(() => !affiliateCache.referrals);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const fetchReferrals = useCallback(
    async (page = 1, isManual = false) => {
      try {
        if (!affiliateCache.referrals) {
          setLoading(true);
        } else if (isManual) {
          setIsRefreshing(true);
        }
        const res = await affiliateApi.get('/referrals', {
          params: {
            page,
            limit: 10,
            search: search || undefined,
            status,
            eligibilityStatus,
            sortBy,
          },
        });
        if (res.data?.data) {
          const nextReferrals = res.data.data.data || [];
          const nextStats = res.data.data.stats || {};
          const nextMeta = res.data.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };
          setReferrals(nextReferrals);
          setStats(nextStats);
          setMeta(nextMeta);
          if (
            page === 1 &&
            !search &&
            status === 'all' &&
            eligibilityStatus === 'all' &&
            sortBy === 'newest'
          ) {
            affiliateCache.referrals = {
              referrals: nextReferrals,
              stats: nextStats,
              meta: nextMeta,
              profile: affiliateCache.referrals?.profile || affiliateCache.me?.affiliate || null,
            };
          }
        }
      } catch {
        if (!affiliateCache.referrals) {
          toast.error('Failed to load referred merchants');
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [search, status, eligibilityStatus, sortBy]
  );

  useEffect(() => {
    if (affiliateCache.me?.affiliate) {
      setProfile(affiliateCache.me.affiliate);
    }
    affiliateApi
      .get('/me')
      .then((res) => {
        if (res.data?.data?.affiliate) {
          setProfile(res.data.data.affiliate);
          if (affiliateCache.referrals) {
            affiliateCache.referrals.profile = res.data.data.affiliate;
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchReferrals(1);
  }, [fetchReferrals]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchReferrals(meta.page);
    socket.on('affiliate:referral:created', refresh);
    socket.on('affiliate:referral:subscribed', refresh);
    return () => {
      socket.off('affiliate:referral:created', refresh);
      socket.off('affiliate:referral:subscribed', refresh);
    };
  }, [socket, fetchReferrals, meta.page]);

  const handleCopy = (val: string, type: 'link' | 'code') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    toast.success(t.overview.copied);
    setTimeout(() => setCopied(null), 2000);
  };

  const statCards = [
    { label: t.referrals.totalReferred, value: stats.totalReferredMerchants || 0, icon: Users },
    { label: t.referrals.activeReferred, value: stats.activeReferredMerchants || 0, icon: UserCheck },
    { label: t.referrals.subscribedMerchants, value: stats.subscribedMerchants || 0, icon: Store },
    { label: t.referrals.activeWindows, value: stats.activeCommissionPeriods || 0, icon: Clock },
    { label: t.referrals.expiredWindows, value: stats.expiredCommissionPeriods || 0, icon: AlertCircle },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Section 1: Referral Link & Code Box */}
      <div className="bg-gradient-to-r from-[#122846] to-[#0284c7] rounded-2xl p-4 sm:p-6 text-white shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 items-center">
          <div className="lg:col-span-2 space-y-1.5 min-w-0">
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-200 block truncate">
              {t.referrals.yourReferralLink}
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/10 border border-white/20 rounded-xl p-2">
              <span
                style={{ color: '#ffffff' }}
                className="w-full text-white font-mono font-semibold text-[11px] sm:text-sm px-2 truncate select-all"
              >
                {profile?.referralLink || ''}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(profile?.referralLink, 'link')}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-white text-[#122846] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
              >
                {copied === 'link' ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{t.overview.copyLink}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-200 block truncate">
              {t.referrals.yourReferralCode}
            </label>
            <div className="flex items-center justify-between gap-2 bg-white/10 border border-white/20 rounded-xl p-2">
              <span className="font-mono font-extrabold text-xs sm:text-sm px-2 whitespace-nowrap truncate">
                {profile?.affiliateCode || '—'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(profile?.affiliateCode, 'code')}
                className="px-3 py-2 rounded-lg bg-sky-400 text-slate-950 font-bold text-[11px] sm:text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied === 'code' ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{t.overview.copyCode}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: 5 Referral Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {statCards.map((c, idx) => (
          <div
            key={idx}
            className={`bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs ${
              idx === 4 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                {c.label}
              </p>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0284c7]/10 text-[#0284c7] flex items-center justify-center shrink-0">
                <c.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1.5 sm:mt-2">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Section 3: Paginated Referrals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                lang === 'bn'
                  ? 'স্টোরের নাম বা ইমেইল দিয়ে খুঁজুন...'
                  : 'Search by store name or email...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              size="sm"
              value={status}
              onChange={setStatus}
              className="w-40"
              options={[
                { value: 'all', label: lang === 'bn' ? 'সব সাবস্ক্রিপশন' : 'All Subscriptions' },
                { value: 'trial', label: 'Free Trial' },
                { value: 'active', label: 'Active Paid' },
                { value: 'expired', label: 'Expired' },
              ]}
            />

            <CustomSelect
              size="sm"
              value={eligibilityStatus}
              onChange={setEligibilityStatus}
              className="w-48"
              options={[
                { value: 'all', label: lang === 'bn' ? 'সব কমিশন মেয়াদ' : 'All Commission Windows' },
                { value: 'pending_first_payment', label: 'Awaiting 1st Payment' },
                { value: 'active', label: 'Active 6-Month Window' },
                { value: 'expired', label: 'Window Expired' },
              ]}
            />

            <CustomSelect
              size="sm"
              value={sortBy}
              onChange={setSortBy}
              className="w-40"
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'commission_desc', label: 'Highest Commission' },
              ]}
            />

            <button
              type="button"
              onClick={() => fetchReferrals(meta.page, true)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">{t.referrals.storeName}</th>
                <th className="py-3.5 px-4">{t.referrals.registeredDate}</th>
                <th className="py-3.5 px-4">{t.referrals.subStatus}</th>
                <th className="py-3.5 px-4">{t.referrals.eligibilityWindow}</th>
                <th className="py-3.5 px-4">{t.referrals.totalPaid}</th>
                <th className="py-3.5 px-4">{t.referrals.commissionEarned}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading referrals...
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {lang === 'bn' ? 'কোনো রেফারকৃত মার্চেন্ট পাওয়া যায়নি' : 'No referred merchants found'}
                  </td>
                </tr>
              ) : (
                referrals.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{r.referredStoreName}</p>
                      <p className="text-[11px] text-slate-400">{r.referredEmail}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(r.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          r.subscriptionStatus === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {r.currentPlanName || r.subscriptionStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {r.eligibilityStartDate && r.eligibilityEndDate ? (
                        <div>
                          <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                            {new Date(r.eligibilityStartDate).toLocaleDateString()}
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            {new Date(r.eligibilityEndDate).toLocaleDateString()}
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Rate: {r.commissionSnapshot?.commissionRate || 30}% (
                            {r.commissionSnapshot?.durationMonths || 6}m)
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">
                          {lang === 'bn'
                            ? 'প্রথম পেইড প্ল্যানে ৬ মাস শুরু হবে'
                            : '6-month window starts on 1st paid plan'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      ৳{Number(r.totalPaidAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                      ৳{Number(r.totalCommissionEarned || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </span>
          <div className="flex gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchReferrals(meta.page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchReferrals(meta.page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

