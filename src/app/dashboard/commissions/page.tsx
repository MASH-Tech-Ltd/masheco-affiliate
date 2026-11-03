'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Clock,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAffiliateLang } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import CustomSelect from '@/components/CustomSelect';
import { affiliateApi } from '@/utils/affiliateApi';
import { affiliateCache } from '@/utils/affiliateCache';

export default function AffiliateCommissionsPage() {
  const { lang, t } = useAffiliateLang();
  const { socket } = useSocket();
  const [commissions, setCommissions] = useState<any[]>(
    () => affiliateCache.commissions?.commissions || []
  );
  const [summary, setSummary] = useState<any>(() => affiliateCache.commissions?.summary || {});
  const [meta, setMeta] = useState(
    () => affiliateCache.commissions?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 }
  );

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(() => !affiliateCache.commissions);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCommissions = useCallback(
    async (page = 1, isManual = false) => {
      try {
        if (!affiliateCache.commissions) {
          setLoading(true);
        } else if (isManual) {
          setIsRefreshing(true);
        }
        const res = await affiliateApi.get('/commissions', {
          params: {
            page,
            limit: 10,
            search: search || undefined,
            status,
            sortBy,
          },
        });
        if (res.data?.data) {
          const nextCommissions = res.data.data.data || [];
          const nextSummary = res.data.data.summary || {};
          const nextMeta = res.data.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };
          setCommissions(nextCommissions);
          setSummary(nextSummary);
          setMeta(nextMeta);
          if (page === 1 && !search && status === 'all' && sortBy === 'newest') {
            affiliateCache.commissions = {
              commissions: nextCommissions,
              summary: nextSummary,
              meta: nextMeta,
            };
          }
        }
      } catch {
        if (!affiliateCache.commissions) {
          toast.error('Failed to load commission history');
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [search, status, sortBy]
  );

  useEffect(() => {
    fetchCommissions(1);
  }, [fetchCommissions]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchCommissions(meta.page);
    socket.on('affiliate:commission:created', refresh);
    socket.on('affiliate:commission:approved', refresh);
    socket.on('affiliate:commission:reversed', refresh);
    return () => {
      socket.off('affiliate:commission:created', refresh);
      socket.off('affiliate:commission:approved', refresh);
      socket.off('affiliate:commission:reversed', refresh);
    };
  }, [socket, fetchCommissions, meta.page]);

  const summaryCards = [
    { label: t.commissions.totalEarned, value: summary.totalCommissionEarned || 0, icon: DollarSign },
    { label: t.commissions.thisMonth, value: summary.thisMonthCommission || 0, icon: TrendingUp },
    { label: t.commissions.pendingCommission, value: summary.pendingCommission || 0, icon: Clock },
    { label: t.commissions.availableBalance, value: summary.availableCommissionBalance || 0, icon: Wallet },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 4 Commission Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {summaryCards.map((c, idx) => (
          <div key={idx} className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                {c.label}
              </p>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0284c7]/10 text-[#0284c7] flex items-center justify-center shrink-0">
                <c.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1.5 sm:mt-2 truncate">
              ৳{Number(c.value || 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Paginated Commission History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                lang === 'bn'
                  ? 'স্টোর বা সাবস্ক্রিপশন দিয়ে খুঁজুন...'
                  : 'Search by store or subscription...'
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
              className="w-36"
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'available', label: 'Available' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'paid', label: 'Paid' },
                { value: 'reversed', label: 'Reversed' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'expired', label: 'Expired' },
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
                { value: 'amount_desc', label: 'Highest Commission' },
              ]}
            />

            <button
              type="button"
              onClick={() => fetchCommissions(meta.page, true)}
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
                <th className="py-3.5 px-4">{t.commissions.date}</th>
                <th className="py-3.5 px-4">{t.commissions.merchant}</th>
                <th className="py-3.5 px-4">{t.commissions.paymentDesc}</th>
                <th className="py-3.5 px-4">{t.commissions.actualPaid}</th>
                <th className="py-3.5 px-4">{t.commissions.rate}</th>
                <th className="py-3.5 px-4">{t.commissions.commissionAmt}</th>
                <th className="py-3.5 px-4">{t.commissions.window}</th>
                <th className="py-3.5 px-4">{t.commissions.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading commissions...
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {lang === 'bn' ? 'কোনো কমিশন রেকর্ড পাওয়া যায়নি' : 'No commission records found'}
                  </td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.referredStoreName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.paymentDescription}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      ৳{Number(c.actualAmountPaid || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#0284c7]">{c.commissionRate}%</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                      ৳{Number(c.commissionAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {c.eligibilityPeriodStart && c.eligibilityPeriodEnd ? (
                        <span className="inline-flex items-center gap-1">
                          {new Date(c.eligibilityPeriodStart).toLocaleDateString()}
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          {new Date(c.eligibilityPeriodEnd).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          c.status === 'available' || c.status === 'approved' || c.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {c.status}
                      </span>
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
              onClick={() => fetchCommissions(meta.page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchCommissions(meta.page + 1)}
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

