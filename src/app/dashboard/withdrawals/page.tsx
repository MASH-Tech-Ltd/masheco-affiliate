'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { affiliateApi } from '@/utils/affiliateApi';
import { affiliateCache } from '@/utils/affiliateCache';
import { useLanguage } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import CustomSelect from '@/components/CustomSelect';
import toast from 'react-hot-toast';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  Smartphone,
  ShieldCheck,
  Filter,
} from 'lucide-react';

interface SavedPaymentMethod {
  id: string;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Bank';
  accountType: string;
  accountNumber: string;
  accountName: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  isDefault?: boolean;
}

export default function AffiliateWithdrawalsPage() {
  const { t, lang } = useLanguage();
  const { socket } = useSocket();

  const initialDefaultMethod = (() => {
    const methods: SavedPaymentMethod[] =
      affiliateCache.withdrawals?.savedMethods ||
      affiliateCache.me?.affiliate?.paymentMethods ||
      [];
    return methods.find((m) => m.isDefault) || methods[0] || null;
  })();

  const [loading, setLoading] = useState(() => !affiliateCache.withdrawals);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [summary, setSummary] = useState(
    () =>
      affiliateCache.withdrawals?.summary || {
        availableBalance: Number(affiliateCache.me?.affiliate?.availableBalance || 0),
        pendingWithdrawalAmount: 0,
        totalWithdrawn: 0,
        minimumWithdrawalAmount: 100,
        maximumWithdrawalAmount: 50000,
        withdrawalsEnabled: true,
        supportedMethods: ['bKash', 'Nagad', 'Rocket', 'Bank'] as string[],
      }
  );

  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>(
    () =>
      affiliateCache.withdrawals?.savedMethods ||
      affiliateCache.me?.affiliate?.paymentMethods ||
      []
  );
  const [withdrawals, setWithdrawals] = useState<any[]>(
    () => affiliateCache.withdrawals?.withdrawals || []
  );
  const [meta, setMeta] = useState(
    () => affiliateCache.withdrawals?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 }
  );

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  // Form state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank'>(
    () => initialDefaultMethod?.method || 'bKash'
  );
  const [accountType, setAccountType] = useState(
    () => initialDefaultMethod?.accountType || 'Personal'
  );
  const [accountNumber, setAccountNumber] = useState(
    () => initialDefaultMethod?.accountNumber || ''
  );
  const [accountName, setAccountName] = useState(() => initialDefaultMethod?.accountName || '');
  const [bankName, setBankName] = useState(() => initialDefaultMethod?.bankName || '');
  const [branchName, setBranchName] = useState(() => initialDefaultMethod?.branchName || '');
  const [routingNumber, setRoutingNumber] = useState(
    () => initialDefaultMethod?.routingNumber || ''
  );

  const fetchWithdrawalsData = useCallback(
    async (page = meta.page, isManual = false) => {
      try {
        if (!affiliateCache.withdrawals) {
          setLoading(true);
        } else if (isManual) {
          setIsRefreshing(true);
        }
        const [wdRes, pmRes] = await Promise.all([
          affiliateApi.get('/withdrawals', {
            params: {
              page,
              limit: 10,
              status: statusFilter,
              paymentMethod: methodFilter,
            },
          }),
          affiliateApi.get('/payment-methods').catch(() => ({ data: { data: [] } })),
        ]);

        const wdPayload = wdRes.data?.data;
        const methods: SavedPaymentMethod[] = pmRes.data?.data || [];
        if (wdPayload) {
          const nextWithdrawals = wdPayload.data || [];
          const nextSummary = wdPayload.summary || summary;
          const nextMeta = wdPayload.meta || meta;
          setWithdrawals(nextWithdrawals);
          if (wdPayload.summary) setSummary(wdPayload.summary);
          if (wdPayload.meta) setMeta(wdPayload.meta);

          if (page === 1 && statusFilter === 'all' && methodFilter === 'all') {
            affiliateCache.withdrawals = {
              withdrawals: nextWithdrawals,
              summary: nextSummary,
              savedMethods: methods,
              meta: nextMeta,
            };
          }
        }

        setSavedMethods(methods);

        const defaultMethod = methods.find((m) => m.isDefault) || methods[0];
        if (defaultMethod && !accountNumber) {
          setPaymentMethod(defaultMethod.method);
          setAccountType(defaultMethod.accountType || 'Personal');
          setAccountNumber(defaultMethod.accountNumber || '');
          setAccountName(defaultMethod.accountName || '');
          setBankName(defaultMethod.bankName || '');
          setBranchName(defaultMethod.branchName || '');
          setRoutingNumber(defaultMethod.routingNumber || '');
        }
      } catch (err: any) {
        if (!affiliateCache.withdrawals) {
          toast.error(err.response?.data?.message || 'Failed to load withdrawal history');
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [meta.page, statusFilter, methodFilter, accountNumber]
  );

  useEffect(() => {
    fetchWithdrawalsData(1);
  }, [statusFilter, methodFilter]);

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchWithdrawalsData(meta.page);
    };

    socket.on('affiliate:withdrawal:requested', handleRefresh);
    socket.on('affiliate:withdrawal:updated', handleRefresh);
    socket.on('affiliate:balance:updated', handleRefresh);

    return () => {
      socket.off('affiliate:withdrawal:requested', handleRefresh);
      socket.off('affiliate:withdrawal:updated', handleRefresh);
      socket.off('affiliate:balance:updated', handleRefresh);
    };
  }, [socket, fetchWithdrawalsData, meta.page]);

  const handleSelectSavedMethod = (pm: SavedPaymentMethod) => {
    setPaymentMethod(pm.method);
    setAccountType(pm.accountType || 'Personal');
    setAccountNumber(pm.accountNumber);
    setAccountName(pm.accountName);
    setBankName(pm.bankName || '');
    setBranchName(pm.branchName || '');
    setRoutingNumber(pm.routingNumber || '');
    toast.success(
      lang === 'bn'
        ? `${pm.method} (${pm.accountNumber}) নির্বাচন করা হয়েছে`
        : `Selected saved ${pm.method} (${pm.accountNumber})`
    );
  };

  const handleMethodChange = (nextMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Bank') => {
    setPaymentMethod(nextMethod);
    if (nextMethod === 'Bank' && (accountType === 'Personal' || accountType === 'Agent')) {
      setAccountType('Savings');
    } else if (nextMethod !== 'Bank' && (accountType === 'Savings' || accountType === 'Current')) {
      setAccountType('Personal');
    }
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);

    if (!summary.withdrawalsEnabled) {
      toast.error(
        lang === 'bn'
          ? 'অ্যাডমিন সাময়িকভাবে উইথড্রয়াল রিকোয়েস্ট বন্ধ রেখেছেন।'
          : 'Withdrawals are temporarily paused by the administrator.'
      );
      return;
    }

    if (!numericAmount || numericAmount < summary.minimumWithdrawalAmount) {
      toast.error(
        lang === 'bn'
          ? `ন্যূনতম উত্তোলনের পরিমাণ ৳${summary.minimumWithdrawalAmount}`
          : `Minimum withdrawal amount is ৳${summary.minimumWithdrawalAmount}`
      );
      return;
    }

    if (numericAmount > summary.availableBalance) {
      toast.error(
        lang === 'bn'
          ? 'আপনার পর্যাপ্ত উত্তোলনযোগ্য ব্যালেন্স নেই'
          : 'Insufficient available balance'
      );
      return;
    }

    if (!accountNumber.trim() || !accountName.trim()) {
      toast.error(
        lang === 'bn'
          ? 'অ্যাকাউন্ট নম্বর এবং নাম প্রদান করুন'
          : 'Please provide account number and account holder name'
      );
      return;
    }

    if (paymentMethod === 'Bank' && (!bankName.trim() || !branchName.trim())) {
      toast.error(
        lang === 'bn'
          ? 'ব্যাংকের নাম এবং ব্রাঞ্চের নাম আবশ্যক'
          : 'Bank name and branch name are required for Bank transfers'
      );
      return;
    }

    try {
      setSubmitting(true);
      await affiliateApi.post('/withdrawals', {
        amount: numericAmount,
        paymentMethod,
        paymentDetails: {
          accountType,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          bankName: paymentMethod === 'Bank' ? bankName.trim() : undefined,
          branchName: paymentMethod === 'Bank' ? branchName.trim() : undefined,
          routingNumber: paymentMethod === 'Bank' ? routingNumber.trim() : undefined,
        },
      });

      toast.success(
        lang === 'bn'
          ? 'উইথড্রয়াল রিকোয়েস্ট সফলভাবে জমা দেওয়া হয়েছে!'
          : 'Withdrawal request submitted successfully!'
      );
      setAmount('');
      fetchWithdrawalsData(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'সম্পন্ন (Paid)' : 'Completed'}
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            {lang === 'bn' ? 'প্রসেসিং' : 'Processing'}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'বাতিল (Refunded)' : 'Rejected'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'পেন্ডিং' : 'Pending'}
          </span>
        );
    }
  };

  const methodOptions = (summary.supportedMethods || ['bKash', 'Nagad', 'Rocket', 'Bank']).map(
    (m: string) => ({
      value: m,
      label: m,
      subLabel:
        m === 'Bank'
          ? lang === 'bn'
            ? 'ব্যাংক ট্রান্সফার (BEFTN/NPSB)'
            : 'Bank Transfer (BEFTN/NPSB)'
          : lang === 'bn'
          ? 'মোবাইল ফিন্যান্সিয়াল সার্ভিস'
          : 'Mobile Financial Service',
      icon:
        m === 'Bank' ? (
          <Building2 className="w-4 h-4 text-indigo-600" />
        ) : (
          <Smartphone className="w-4 h-4 text-[#0284c7]" />
        ),
    })
  );

  const accountTypeOptions =
    paymentMethod === 'Bank'
      ? [
          {
            value: 'Savings',
            label: lang === 'bn' ? 'Savings (সঞ্চয়ী হিসাব)' : 'Savings Account',
          },
          {
            value: 'Current',
            label: lang === 'bn' ? 'Current (চলতি হিসাব)' : 'Current Account',
          },
        ]
      : [
          {
            value: 'Personal',
            label: lang === 'bn' ? 'Personal (পার্সোনাল)' : 'Personal',
          },
          {
            value: 'Agent',
            label: lang === 'bn' ? 'Agent (এজেন্ট)' : 'Agent',
          },
        ];

  const statusFilterOptions = [
    { value: 'all', label: lang === 'bn' ? 'সব স্ট্যাটাস' : 'All Statuses' },
    { value: 'pending', label: lang === 'bn' ? 'পেন্ডিং' : 'Pending' },
    { value: 'processing', label: lang === 'bn' ? 'প্রসেসিং' : 'Processing' },
    { value: 'completed', label: lang === 'bn' ? 'সম্পন্ন' : 'Completed' },
    { value: 'rejected', label: lang === 'bn' ? 'বাতিল' : 'Rejected' },
  ];

  const methodFilterOptions = [
    { value: 'all', label: lang === 'bn' ? 'সব মাধ্যম' : 'All Methods' },
    { value: 'bKash', label: 'bKash' },
    { value: 'Nagad', label: 'Nagad' },
    { value: 'Rocket', label: 'Rocket' },
    { value: 'Bank', label: 'Bank' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-gradient-to-br from-[#122846] via-[#16345b] to-[#0284c7] rounded-2xl p-3.5 sm:p-5 text-white shadow-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-200 truncate">
              {t.withdrawals.availableBalance}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold mt-2 sm:mt-3 truncate">
            ৳{Number(summary.availableBalance || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] sm:text-xs text-sky-100 mt-1 truncate">
            {lang === 'bn' ? 'তাৎক্ষণিক উত্তোলনের জন্য প্রস্তুত' : 'Ready for immediate withdrawal'}
          </p>
        </div>

        <div className="relative bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
              {t.withdrawals.pendingWithdrawal}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-2 sm:mt-3 truncate">
            ৳{Number(summary.pendingWithdrawalAmount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 truncate">
            {lang === 'bn' ? 'প্রসেসিংয়ের জন্য সংরক্ষিত' : 'Reserved for pending requests'}
          </p>
        </div>

        <div className="relative bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-600" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
              {t.withdrawals.totalWithdrawn}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-2 sm:mt-3 truncate">
            ৳{Number(summary.totalWithdrawn || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 truncate">
            {lang === 'bn' ? 'সফলভাবে পরিশোধিত মোট অর্থ' : 'Lifetime completed payouts'}
          </p>
        </div>

        <div className="relative bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
              {t.withdrawals.minWithdrawal}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-2 sm:mt-3 truncate">
            ৳{Number(summary.minimumWithdrawalAmount || 100).toLocaleString('en-BD')}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 truncate">
            {lang === 'bn'
              ? `মাধ্যম: ${(summary.supportedMethods || []).join(', ')}`
              : `Supported: ${(summary.supportedMethods || []).join(', ')}`}
          </p>
        </div>
      </div>

      {/* Main Grid: Withdrawal Request Form + History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <span>{t.withdrawals.requestTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'bn'
              ? `ন্যূনতম ৳${summary.minimumWithdrawalAmount} ব্যালেন্স থাকলেই উত্তোলন রিকোয়েস্ট পাঠাতে পারবেন।`
              : `Submit a payout request once your available balance reaches ৳${summary.minimumWithdrawalAmount}.`}
          </p>

          {!summary.withdrawalsEnabled && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {lang === 'bn'
                  ? 'অ্যাডমিন সাময়িকভাবে উইথড্রয়াল রিকোয়েস্ট বন্ধ রেখেছেন।'
                  : 'Withdrawals are temporarily paused by the administrator.'}
              </span>
            </div>
          )}

          {/* Quick-Fill Saved Payment Methods */}
          {savedMethods.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                {lang === 'bn'
                  ? 'সেভ করা পেমেন্ট মাধ্যম থেকে বাছাই করুন:'
                  : 'Quick-Fill from Saved Methods:'}
              </label>
              <div className="flex flex-wrap gap-2">
                {savedMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => handleSelectSavedMethod(pm)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                      paymentMethod === pm.method && accountNumber === pm.accountNumber
                        ? 'bg-sky-50 border-[#0284c7] text-[#0284c7]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pm.method === 'Bank' ? (
                      <Building2 className="w-3.5 h-3.5" />
                    ) : (
                      <Smartphone className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {pm.method} ({pm.accountNumber})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitWithdrawal} className="mt-5 space-y-4">
            {/* Amount Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t.withdrawals.amountLabel} *
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(String(summary.availableBalance))}
                  className="text-xs font-bold text-[#0284c7] hover:text-[#0369a1] cursor-pointer"
                >
                  {lang === 'bn' ? 'সম্পূর্ণ ব্যালেন্স দিন' : 'Withdraw Max'} (৳
                  {summary.availableBalance})
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min={summary.minimumWithdrawalAmount}
                max={summary.availableBalance || summary.maximumWithdrawalAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ৳${summary.minimumWithdrawalAmount}`}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
              />
            </div>

            {/* Interactive Payment Method Pills + Custom Dropdowns */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.withdrawals.methodLabel} *
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {(['bKash', 'Nagad', 'Rocket', 'Bank'] as const).map((m) => {
                  const active = paymentMethod === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMethodChange(m)}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        active
                          ? 'bg-[#122846] border-[#122846] text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m === 'Bank' ? (
                        <Building2 className="w-3.5 h-3.5" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5" />
                      )}
                      <span>{m}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {t.withdrawals.methodLabel}
                  </label>
                  <CustomSelect
                    value={paymentMethod}
                    onChange={(val) => handleMethodChange(val as any)}
                    options={methodOptions}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {t.withdrawals.accountTypeLabel}
                  </label>
                  <CustomSelect
                    value={accountType}
                    onChange={(val) => setAccountType(val)}
                    options={accountTypeOptions}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.withdrawals.accountNumberLabel} *
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={paymentMethod === 'Bank' ? 'Bank Account Number' : '01XXXXXXXXX'}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.withdrawals.accountNameLabel} *
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Account Holder Full Name"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
              />
            </div>

            {paymentMethod === 'Bank' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t.withdrawals.bankNameLabel} *
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. City Bank / BRAC Bank"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t.withdrawals.branchNameLabel} *
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Branch Name"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#122846] via-[#0369a1] to-[#0284c7] hover:brightness-110 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-[#0284c7]/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? lang === 'bn'
                    ? 'জমা হচ্ছে...'
                    : 'Submitting...'
                  : t.withdrawals.submitRequest}
              </span>
            </button>
          </form>
        </div>

        {/* Right: Withdrawal History Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">{t.withdrawals.historyTitle}</h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <CustomSelect
                size="sm"
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusFilterOptions}
                className="w-36"
              />
              <CustomSelect
                size="sm"
                value={methodFilter}
                onChange={setMethodFilter}
                options={methodFilterOptions}
                className="w-32"
              />
              <button
                type="button"
                onClick={() => fetchWithdrawalsData(meta.page, true)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'তারিখ' : 'Requested Date'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="py-3.5 px-4">
                    {lang === 'bn' ? 'মাধ্যম ও অ্যাকাউন্ট' : 'Method & Account'}
                  </th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3.5 px-4">
                    {lang === 'bn' ? 'রেফারেন্স / নোট' : 'Reference / Note'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading withdrawal records...'}
                    </td>
                  </tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {lang === 'bn'
                            ? 'এখনো কোনো উইথড্রয়াল রিকোয়েস্ট পাওয়া যায়নি।'
                            : 'No withdrawal requests found yet.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((wd) => (
                    <tr key={wd._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="font-semibold text-slate-800">
                          {new Date(wd.requestedAt || wd.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(wd.requestedAt || wd.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          ৳{Number(wd.amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {wd.paymentMethod}{' '}
                          <span className="text-slate-400 font-normal">
                            ({wd.paymentDetails?.accountType || 'Personal'})
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-600">
                          {wd.paymentDetails?.accountNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {wd.paymentDetails?.accountName}
                          {wd.paymentMethod === 'Bank' && wd.paymentDetails?.bankName
                            ? ` • ${wd.paymentDetails.bankName}`
                            : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(wd.status)}</td>

                      <td className="py-3.5 px-4 text-xs">
                        {wd.transactionReference && (
                          <div className="font-mono text-emerald-700 font-semibold">
                            TrxID: {wd.transactionReference}
                          </div>
                        )}
                        {wd.rejectionReason && (
                          <div className="text-rose-600 font-medium">{wd.rejectionReason}</div>
                        )}
                        {wd.adminNote && <div className="text-slate-500">{wd.adminNote}</div>}
                        {!wd.transactionReference && !wd.rejectionReason && !wd.adminNote && (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> ({meta.total}{' '}
                records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchWithdrawalsData(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchWithdrawalsData(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
