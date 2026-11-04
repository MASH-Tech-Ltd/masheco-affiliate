'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  Users,
  DollarSign,
  Wallet,
  LifeBuoy,
  Gift,
  Clock,
  ArrowRight,
  Filter,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAffiliateLang } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import { affiliateApi } from '@/utils/affiliateApi';

interface INotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedEntityId?: string;
  createdAt: string;
}

export default function AffiliateNotificationsPage() {
  const { lang, t } = useAffiliateLang();
  const { socket } = useSocket();
  const router = useRouter();

  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else if (notifications.length === 0) setLoading(true);

      const res = await affiliateApi.get('/notifications', {
        params: { limit: 50 },
      });

      const raw = res.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.notifications)
          ? raw.notifications
          : [];

      setNotifications(list);
    } catch {
      if (notifications.length === 0) {
        toast.error(lang === 'bn' ? 'বিজ্ঞপ্তি লোড করা যায়নি' : 'Failed to load notifications');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [lang, notifications.length]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time socket listener for new notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: INotificationItem) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === notif._id);
        if (exists) return prev;
        return [notif, ...prev];
      });

      toast(notif.title || (lang === 'bn' ? 'নতুন নোটিফিকেশন এসেছে!' : 'New notification received!'), {
        icon: '🔔',
      });
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, lang]);

  const markAsRead = async (id: string) => {
    try {
      await affiliateApi.patch(`/notifications/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('affiliate:notificationRead', { detail: id }));
      }
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await affiliateApi.patch('/notifications');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('affiliate:notificationsAllRead'));
      }
      toast.success(
        lang === 'bn'
          ? 'সকল বিজ্ঞপ্তি পড়া হয়েছে মার্ক করা হয়েছে!'
          : 'All notifications marked as read!'
      );
    } catch {
      toast.error(
        lang === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed to mark all as read'
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (item: INotificationItem) => {
    if (!item.read) {
      markAsRead(item._id);
    }

    const tUpper = (item.type || '').toUpperCase();
    if (tUpper.includes('REFERRAL')) {
      router.push('/dashboard/referrals');
    } else if (tUpper.includes('COMMISSION')) {
      router.push('/dashboard/commissions');
    } else if (tUpper.includes('WITHDRAWAL')) {
      router.push('/dashboard/withdrawals');
    } else if (tUpper.includes('TICKET') || tUpper.includes('SUPPORT')) {
      router.push('/dashboard/support');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredList = notifications.filter((item) => {
    if (filterType === 'unread') return !item.read;
    if (filterType === 'referrals') return item.type.toUpperCase().includes('REFERRAL');
    if (filterType === 'commissions') return item.type.toUpperCase().includes('COMMISSION');
    if (filterType === 'withdrawals') return item.type.toUpperCase().includes('WITHDRAWAL');
    if (filterType === 'support') return item.type.toUpperCase().includes('TICKET') || item.type.toUpperCase().includes('SUPPORT');
    return true;
  });

  const getIconConfig = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('REFERRAL')) {
      return {
        icon: Users,
        bg: 'bg-sky-50 text-[#0284c7] border-sky-200',
        badge: lang === 'bn' ? 'রেফারেল' : 'Referral',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      };
    }
    if (t.includes('COMMISSION')) {
      return {
        icon: DollarSign,
        bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        badge: lang === 'bn' ? 'কমিশন' : 'Commission',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (t.includes('WITHDRAWAL')) {
      return {
        icon: Wallet,
        bg: 'bg-purple-50 text-purple-600 border-purple-200',
        badge: lang === 'bn' ? 'উইথড্রয়াল' : 'Withdrawal',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    }
    if (t.includes('TICKET') || t.includes('SUPPORT')) {
      return {
        icon: LifeBuoy,
        bg: 'bg-amber-50 text-amber-600 border-amber-200',
        badge: lang === 'bn' ? 'সাপোর্ট' : 'Support',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    return {
      icon: Bell,
      bg: 'bg-blue-50 text-blue-600 border-blue-200',
      badge: lang === 'bn' ? 'অ্যালার্ট' : 'Alert',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
    if (diffMinutes < 60) return lang === 'bn' ? `${diffMinutes} মিনিট আগে` : `${diffMinutes}m ago`;
    if (diffHours < 24) return lang === 'bn' ? `${diffHours} ঘণ্টা আগে` : `${diffHours}h ago`;
    if (diffDays === 1) return lang === 'bn' ? 'গতকাল' : 'Yesterday';
    if (diffDays < 7) return lang === 'bn' ? `${diffDays} দিন আগে` : `${diffDays}d ago`;

    return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {t.notifications?.title || (lang === 'bn' ? 'পার্টনার নোটিফিকেশন' : 'Partner Notifications')}
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-bold">
                {unreadCount} {lang === 'bn' ? 'অপঠিত' : 'Unread'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.notifications?.subtitle ||
              (lang === 'bn'
                ? 'রেফারেল, কমিশন এবং উইথড্রয়াল সংক্রান্ত সকল আপডেট ও অ্যালার্ট।'
                : 'Real-time alerts for referrals, commissions, and payouts.')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {markingAll
                  ? lang === 'bn'
                    ? 'আপডেট হচ্ছে...'
                    : 'Updating...'
                  : t.notifications?.markAllRead ||
                    (lang === 'bn' ? 'সবগুলো পড়া হয়েছে মার্ক করুন' : 'Mark All as Read')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchNotifications(true)}
            title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh'}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {[
          { key: 'all', label: lang === 'bn' ? 'সব' : 'All', count: notifications.length },
          { key: 'unread', label: lang === 'bn' ? 'অপঠিত' : 'Unread', count: unreadCount },
          { key: 'referrals', label: lang === 'bn' ? 'রেফারেল' : 'Referrals' },
          { key: 'commissions', label: lang === 'bn' ? 'কমিশন' : 'Commissions' },
          { key: 'withdrawals', label: lang === 'bn' ? 'উইথড্রয়াল' : 'Withdrawals' },
          { key: 'support', label: lang === 'bn' ? 'সাপোর্ট' : 'Support' },
        ].map((tab) => {
          const isActive = filterType === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterType(tab.key)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#0284c7] text-white shadow-2xs'
                  : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-3 border-[#0284c7] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">
              {lang === 'bn' ? 'বিজ্ঞপ্তি লোড হচ্ছে...' : 'Loading notifications...'}
            </span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 sm:py-20 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center mb-3">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              {t.notifications?.noNotifications ||
                (lang === 'bn' ? 'এখনও কোনো নোটিফিকেশন নেই' : 'No notifications yet')}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {t.notifications?.noNotificationsSub ||
                (lang === 'bn'
                  ? 'নতুন মার্চেন্ট সাইন আপ করলে, কমিশন যোগ হলে বা উইথড্রয়াল আপডেট হলে এখানে দেখতে পাবেন।'
                  : 'You will see alerts here when new merchants register, commissions arrive, or payout updates occur.')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const cfg = getIconConfig(item.type);
              const IconComp = cfg.icon;

              return (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all cursor-pointer hover:bg-slate-50/70 group ${
                    !item.read ? 'bg-sky-50/25' : ''
                  }`}
                >
                  {/* Icon Avatar */}
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${cfg.bg}`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.badgeColor}`}
                        >
                          {cfg.badge}
                        </span>
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            !item.read ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {item.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                        {!item.read && (
                          <span
                            title="Unread"
                            className="w-2 h-2 rounded-full bg-[#0284c7] shrink-0"
                          />
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed break-words">
                      {item.message}
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0284c7] transition-colors shrink-0 self-center hidden sm:block" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

