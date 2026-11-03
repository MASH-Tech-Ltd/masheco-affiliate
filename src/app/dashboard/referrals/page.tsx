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
  Eye,
  X,
  Calendar,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Percent,
  Sparkles,
  Info,
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

  // Modal state for viewing single referred merchant's month-by-month & subscription details
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  const handleOpenDetails = async (ref: any) => {
    setSelectedReferral(ref);
    try {
      setDetailsLoading(true);
      const res = await affiliateApi.get(`/referrals/${ref._id}`);
      if (res.data?.data) {
        setSelectedReferral(res.data.data);
      }
    } catch {
      // Fallback to row data already present
    } finally {
      setDetailsLoading(false);
    }
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
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-white text-[#122846] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer hover:bg-sky-50 transition"
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
                className="px-3 py-2 rounded-lg bg-sky-400 text-slate-950 font-bold text-[11px] sm:text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer hover:bg-sky-300 transition"
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
                  ? 'মার্চেন্ট, স্টোর বা ইমেইল দিয়ে খুঁজুন...'
                  : 'Search by merchant, store or email...'
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
                { value: 'pending_first_payment', label: lang === 'bn' ? '১ম পেমেন্টের অপেক্ষা' : 'Awaiting 1st Payment' },
                { value: 'active', label: lang === 'bn' ? 'সক্রিয় ৬ মাসের মেয়াদ' : 'Active 6-Month Window' },
                { value: 'expired', label: lang === 'bn' ? 'মেয়াদ উত্তীর্ণ' : 'Window Expired' },
              ]}
            />

            <CustomSelect
              size="sm"
              value={sortBy}
              onChange={setSortBy}
              className="w-40"
              options={[
                { value: 'newest', label: lang === 'bn' ? 'নতুন আগে' : 'Newest First' },
                { value: 'oldest', label: lang === 'bn' ? 'পুরনো আগে' : 'Oldest First' },
                { value: 'commission_desc', label: lang === 'bn' ? 'সর্বোচ্চ কমিশন' : 'Highest Commission' },
              ]}
            />

            <button
              type="button"
              onClick={() => fetchReferrals(meta.page, true)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">{lang === 'bn' ? 'মার্চেন্ট ও স্টোর' : 'Merchant & Store'}</th>
                <th className="py-3.5 px-4">{lang === 'bn' ? 'রেজিস্ট্রেশন' : 'Signup Date'}</th>
                <th className="py-3.5 px-4">{lang === 'bn' ? 'বর্তমান প্যাকেজ ও সাইকেল' : 'Current Plan & Period'}</th>
                <th className="py-3.5 px-4">{lang === 'bn' ? '৬ মাসের কমিশন মেয়াদ' : '6-Month Commission Window'}</th>
                <th className="py-3.5 px-4">{lang === 'bn' ? 'মোট পরিশোধ' : 'Total Paid'}</th>
                <th className="py-3.5 px-4">{lang === 'bn' ? 'অর্জিত কমিশন' : 'Commission Earned'}</th>
                <th className="py-3.5 px-4 text-center">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0284c7]" />
                    <span>{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading referrals...'}</span>
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {lang === 'bn' ? 'কোনো রেফারকৃত মার্চেন্ট পাওয়া যায়নি' : 'No referred merchants found'}
                  </td>
                </tr>
              ) : (
                referrals.map((r) => {
                  const isActiveMerchant = Boolean(r.isMerchantActive);
                  const planName = r.currentPackage?.name || r.currentPlanName || 'Standard';
                  const isTrial = r.currentPackage?.isTrial || r.subscriptionStatus === 'trial';
                  const cycle = r.currentPackage?.billingCycle;
                  const paymentsCount = Number(r.paymentsCount || r.monthlyHistory?.length || 0);

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Merchant & Store Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm">{r.referredStoreName || r.storeName}</p>
                              {/* Merchant Active / Inactive Badge */}
                              {isActiveMerchant ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>{lang === 'bn' ? 'সক্রিয় মার্চেন্ট' : 'Active Merchant'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  <span>{lang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {r.merchantName && r.merchantName !== r.referredStoreName ? `${r.merchantName} • ` : ''}
                              <span className="text-slate-400">{r.referredEmail}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Signup Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{new Date(r.registeredAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Current Package & Billing Cycle */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                isTrial
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : r.subscriptionStatus === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {planName}
                            </span>
                            {cycle && !isTrial && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 capitalize">
                                {cycle === 'monthly' ? (lang === 'bn' ? 'মাসিক' : 'Monthly') : cycle}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {paymentsCount > 0 ? (
                              <span className="text-emerald-700 font-semibold">
                                {paymentsCount} {lang === 'bn' ? 'টি পেমেন্ট সম্পন্ন' : 'Paid Payment(s)'}
                              </span>
                            ) : (
                              <span>{lang === 'bn' ? 'কোনো পেমেন্ট হয়নি' : 'No payments yet'}</span>
                            )}
                          </p>
                        </div>
                      </td>

                      {/* 6-Month Commission Window */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {r.eligibilityStartDate && r.eligibilityEndDate ? (
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-800 inline-flex items-center gap-1 text-[11px]">
                              {new Date(r.eligibilityStartDate).toLocaleDateString()}
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              {new Date(r.eligibilityEndDate).toLocaleDateString()}
                            </span>
                            <div>
                              {r.eligibilityStatus === 'active' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {r.daysRemainingInWindow || 0} {lang === 'bn' ? 'দিন বাকি (৩০% রেট)' : 'days left (30% rate)'}
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{lang === 'bn' ? 'মেয়াদ উত্তীর্ণ' : 'Window Expired'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[11px]">
                            <span className="inline-flex items-center gap-1">
                              <Info className="w-3 h-3 text-sky-500" />
                              <span>
                                {lang === 'bn'
                                  ? '১ম পেইড সাবস্ক্রিপশনে ৬ মাসের উইন্ডো চালু হবে'
                                  : '6-month window starts on 1st paid plan'}
                              </span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Total Paid by Merchant */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        ৳{Number(r.totalPaidAmount || 0).toLocaleString()}
                      </td>

                      {/* Commission Earned from this Merchant */}
                      <td className="py-3.5 px-4 font-extrabold text-emerald-700 whitespace-nowrap text-sm">
                        +৳{Number(r.totalCommissionEarned || 0).toLocaleString()}
                      </td>

                      {/* Details Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(r)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] font-bold text-xs border border-sky-200 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'বিস্তারিত' : 'Details'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {lang === 'bn'
              ? `পৃষ্ঠা ${meta.page} এর ${meta.totalPages} (মোট ${meta.total} জন মার্চেন্ট)`
              : `Page ${meta.page} of ${meta.totalPages} (${meta.total} total merchants)`}
          </span>
          <div className="flex gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchReferrals(meta.page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchReferrals(meta.page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Section 4: Single Referred Merchant Month-by-Month Details Modal       */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0284c7]/10 text-[#0284c7] flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg truncate">
                      {selectedReferral.referredStoreName || selectedReferral.storeName}
                    </h3>
                    {selectedReferral.isMerchantActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{lang === 'bn' ? 'মার্চেন্ট সক্রিয়' : 'Merchant Active'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{lang === 'bn' ? 'মার্চেন্ট নিষ্ক্রিয়' : 'Inactive'}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {lang === 'bn' ? 'রেফারেল কোড:' : 'Referral Code:'}{' '}
                    <span className="font-mono font-bold text-slate-700">
                      {selectedReferral.referralCodeUsed || profile?.affiliateCode}
                    </span>{' '}
                    • {lang === 'bn' ? 'রেজিস্ট্রেশন:' : 'Registered:'}{' '}
                    <span className="font-semibold text-slate-700">
                      {new Date(selectedReferral.registeredAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReferral(null)}
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer shrink-0 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {detailsLoading && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 text-sky-800 text-xs font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                  <span>{lang === 'bn' ? 'মার্চেন্টের সর্বশেষ তথ্য আপডেট হচ্ছে...' : 'Refreshing latest merchant details...'}</span>
                </div>
              )}

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Merchant Profile */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {lang === 'bn' ? 'মার্চেন্ট তথ্য' : 'Merchant Info'}
                  </span>
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {selectedReferral.merchantName || selectedReferral.referredStoreName}
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedReferral.referredEmail}</span>
                  </p>
                  {selectedReferral.merchantPhone && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedReferral.merchantPhone}</span>
                    </p>
                  )}
                </div>

                {/* 2. Current Package & Billing Cycle */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {lang === 'bn' ? 'বর্তমান প্যাকেজ' : 'Current Package'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-[#0284c7] text-white">
                      {selectedReferral.currentPackage?.name || selectedReferral.currentPlanName || 'Standard'}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 capitalize">
                      {selectedReferral.currentPackage?.billingCycle === 'monthly'
                        ? (lang === 'bn' ? 'মাসিক' : 'Monthly')
                        : (selectedReferral.currentPackage?.billingCycle || 'Monthly')}
                    </span>
                  </div>
                  {selectedReferral.currentPackage?.endDate && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {lang === 'bn' ? 'মেয়াদ শেষ:' : 'Expires:'}{' '}
                      <span className="font-semibold text-slate-700">
                        {new Date(selectedReferral.currentPackage.endDate).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                </div>

                {/* 3. 6-Month Window */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {lang === 'bn' ? '৬ মাসের কমিশন মেয়াদ' : '6-Month Window'}
                  </span>
                  {selectedReferral.eligibilityStartDate && selectedReferral.eligibilityEndDate ? (
                    <>
                      <p className="text-xs font-bold text-sky-800">
                        {selectedReferral.daysRemainingInWindow || 0} {lang === 'bn' ? 'দিন বাকি' : 'days left'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(selectedReferral.eligibilityStartDate).toLocaleDateString()} →{' '}
                        {new Date(selectedReferral.eligibilityEndDate).toLocaleDateString()}
                      </p>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {selectedReferral.commissionRate || 30}% {lang === 'bn' ? 'রিকারিং রেট' : 'Recurring'}
                      </span>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {lang === 'bn' ? '১ম পেইড সাবস্ক্রিপশনে চালু হবে' : 'Starts on first paid subscription'}
                    </p>
                  )}
                </div>

                {/* 4. Financial Totals */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {lang === 'bn' ? 'আর্থিক বিবরণ' : 'Financial Totals'}
                  </span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">{lang === 'bn' ? 'মার্চেন্ট দিয়েছেন:' : 'Merchant Paid:'}</span>
                    <span className="font-bold text-slate-900">
                      ৳{Number(selectedReferral.totalPaidAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">{lang === 'bn' ? 'আপনার কমিশন:' : 'Your Commission:'}</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      ৳{Number(selectedReferral.totalCommissionEarned || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6-Month Visual Recurring Timeline Tracker */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-sky-100 text-[#0284c7] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {lang === 'bn'
                        ? '৬ মাসের রিকারিং কমিশন ট্র্যাকার (প্রতিটি মাসের হিসাব)'
                        : '6-Month Recurring Commission Tracker (Month-by-Month Slot View)'}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedReferral.monthlyHistory?.length || selectedReferral.paymentsCount || 0} /{' '}
                    {selectedReferral.durationMonths || 6} {lang === 'bn' ? 'মাস সম্পন্ন' : 'Months Paid'}
                  </span>
                </div>

                {/* 6-Card Timeline Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {(selectedReferral.sixMonthSlots || []).map((slot: any, idx: number) => {
                    const isPaid = slot.status === 'paid';
                    const isUpcoming = slot.status === 'upcoming';

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border transition-all text-center flex flex-col justify-between min-h-[140px] ${
                          isPaid
                            ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                            : isUpcoming
                            ? 'bg-sky-50/40 border-sky-200 border-dashed'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            {isPaid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            )}
                            <span
                              className={`text-[11px] font-extrabold uppercase ${
                                isPaid ? 'text-emerald-800' : 'text-sky-700'
                              }`}
                            >
                              {lang === 'bn' ? `মাস ${slot.slotNumber}` : `Month ${slot.slotNumber}`}
                            </span>
                          </div>

                          <p className="text-[11px] font-bold text-slate-800 truncate">
                            {slot.monthLabel}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {slot.packageName}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 mt-2">
                          {isPaid ? (
                            <>
                              <p className="text-[10px] text-slate-500">
                                {lang === 'bn' ? 'পরিশোধ:' : 'Paid:'} ৳{slot.amountPaid}
                              </p>
                              <p className="text-xs font-extrabold text-emerald-700">
                                +৳{slot.commissionAmount}
                              </p>
                            </>
                          ) : isUpcoming ? (
                            <span className="text-[10px] font-bold text-sky-700 block bg-sky-100/70 py-1 rounded-md">
                              {lang === 'bn' ? '৩০% প্রযোজ্য' : '30% Eligible'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block py-1">
                              {lang === 'bn' ? 'অপেক্ষমান' : 'Pending'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Month-by-Month Detailed Payment & Commission History Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0284c7]" />
                  <span>
                    {lang === 'bn'
                      ? 'প্রতিটি মাসের সাবস্ক্রিপশন ও অর্জিত কমিশন হিস্ট্রি'
                      : 'Month-by-Month Subscription & Commission History'}
                  </span>
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                        <th className="py-3 px-4">{lang === 'bn' ? 'মাস / পিরিয়ড' : 'Month / Billing Period'}</th>
                        <th className="py-3 px-4">{lang === 'bn' ? 'প্যাকেজের নাম' : 'Plan Name'}</th>
                        <th className="py-3 px-4">{lang === 'bn' ? 'পেমেন্টের তারিখ' : 'Payment Date'}</th>
                        <th className="py-3 px-4">{lang === 'bn' ? 'মার্চেন্ট পরিশোধ' : 'Merchant Paid'}</th>
                        <th className="py-3 px-4">{lang === 'bn' ? 'কমিশন রেট' : 'Rate'}</th>
                        <th className="py-3 px-4">{lang === 'bn' ? 'আপনার কমিশন' : 'Commission Earned'}</th>
                        <th className="py-3 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedReferral.monthlyHistory || []).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                            {lang === 'bn'
                              ? 'এই মার্চেন্ট এখনো কোনো পেইড প্যাকেজের পেমেন্ট করেননি। পেইড প্যাকেজ কিনলে প্রতি মাসের বিবরণ এখানে দেখা যাবে।'
                              : 'No paid subscription payments recorded for this merchant yet.'}
                          </td>
                        </tr>
                      ) : (
                        (selectedReferral.monthlyHistory || []).map((m: any, idx: number) => (
                          <tr key={m._id || idx} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <p>{m.monthLabel}</p>
                              {m.periodStart && m.periodEnd && (
                                <p className="text-[10px] text-slate-400 font-normal">
                                  {new Date(m.periodStart).toLocaleDateString()} -{' '}
                                  {new Date(m.periodEnd).toLocaleDateString()}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800">{m.packageName}</span>
                              <span className="text-[10px] text-slate-500 block capitalize">
                                {m.billingCycle === 'monthly' ? (lang === 'bn' ? 'মাসিক' : 'Monthly') : m.billingCycle}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(m.paidAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              ৳{Number(m.actualAmountPaid || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-600">
                              {m.commissionRate || 30}%
                            </td>
                            <td className="py-3 px-4 font-extrabold text-emerald-700 text-sm">
                              +৳{Number(m.commissionAmount || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  m.status === 'available'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : m.status === 'withdrawn'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {m.status === 'available'
                                  ? (lang === 'bn' ? 'উত্তোলনযোগ্য' : 'Available')
                                  : m.status === 'withdrawn'
                                  ? (lang === 'bn' ? 'উত্তোলিত' : 'Withdrawn')
                                  : m.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedReferral(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
