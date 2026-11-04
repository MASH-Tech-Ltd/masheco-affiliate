'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAffiliateLang } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import CustomSelect from '@/components/CustomSelect';
import { affiliateApi } from '@/utils/affiliateApi';
import { affiliateCache } from '@/utils/affiliateCache';

let globalTicketsCache: any[] = affiliateCache.support?.tickets || [];

export default function AffiliateSupportPage() {
  const router = useRouter();
  const { lang } = useAffiliateLang();
  const { socket } = useSocket();

  const [tickets, setTickets] = useState<any[]>(globalTicketsCache);
  const [loading, setLoading] = useState(globalTicketsCache.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'General',
    priority: 'MEDIUM',
    message: '',
  });

  const fetchTickets = useCallback(async (isManual = false) => {
    try {
      if (globalTicketsCache.length === 0) {
        setLoading(true);
      } else if (isManual) {
        setIsRefreshing(true);
      }
      const res = await affiliateApi.get('/support');
      const list = res.data?.data || [];
      globalTicketsCache = list;
      affiliateCache.support = {
        tickets: list,
        selectedTicket: affiliateCache.support?.selectedTicket || list[0] || null,
      };
      setTickets(list);
    } catch (err: any) {
      if (globalTicketsCache.length === 0) {
        toast.error(err.response?.data?.message || 'Failed to load support tickets');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();

    if (!socket) return;

    const handleRefresh = () => {
      fetchTickets();
    };

    socket.on('refresh_tickets', handleRefresh);

    return () => {
      socket.off('refresh_tickets', handleRefresh);
    };
  }, [socket, fetchTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast.error(
        lang === 'bn'
          ? 'বিষয় এবং বিস্তারিত বার্তা পূরণ করুন'
          : 'Please enter both subject and message'
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await affiliateApi.post('/support', newTicket);
      const created = res.data?.data;
      toast.success(
        lang === 'bn'
          ? 'সাপোর্ট টিকেট সফলভাবে তৈরি হয়েছে!'
          : 'Support ticket submitted successfully!'
      );
      setIsModalOpen(false);
      setNewTicket({
        subject: '',
        category: 'General',
        priority: 'MEDIUM',
        message: '',
      });

      if (created) {
        setTickets((prev) => [created, ...prev]);
        globalTicketsCache = [created, ...globalTicketsCache];
        router.push(`/dashboard/support/${created._id}`);
      } else {
        await fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            {lang === 'bn' ? 'ওপেন' : 'OPEN'}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            {lang === 'bn' ? 'প্রসেসিং' : 'IN PROGRESS'}
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            {lang === 'bn' ? 'সমাধানকৃত' : 'RESOLVED'}
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <CheckCircle2 className="w-3 h-3" />
            {lang === 'bn' ? 'বন্ধ' : 'CLOSED'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const filteredTickets = tickets.filter((tItem) => {
    const matchesStatus = statusFilter === 'ALL' || tItem.status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      tItem.subject?.toLowerCase().includes(search.toLowerCase()) ||
      tItem.ticketId?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openCount = tickets.filter((tItem) => tItem.status === 'OPEN').length;
  const inProgressCount = tickets.filter((tItem) => tItem.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(
    (tItem) => tItem.status === 'RESOLVED' || tItem.status === 'CLOSED'
  ).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Action Banner */}
      <div className="bg-gradient-to-r from-[#122846] via-[#16345b] to-[#0284c7] rounded-2xl p-5 sm:p-7 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sky-200 text-xs font-semibold">
            <LifeBuoy className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span>
              {lang === 'bn' ? '২৪/৭ পার্টনার সহায়তা কেন্দ্র' : 'Dedicated Partner Helpdesk'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white mt-1">
            {lang === 'bn'
              ? 'যেকোনো প্রয়োজনে সরাসরি সাপোর্ট টিমের সাথে কথা বলুন'
              : 'Need Help with Referrals, Commissions, or Payouts?'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200/90 max-w-2xl leading-relaxed">
            {lang === 'bn'
              ? 'অ্যাকাউন্ট অনুমোদন, রেফারেল ট্র্যাকিং বা উইথড্রয়াল সংক্রান্ত যেকোনো প্রশ্নে আমাদের সাপোর্ট টিমের সাথে লাইভ চ্যাট করুন।'
              : 'Open a support ticket below and chat directly with the MASH ECO Super Admin team in real time.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-sky-50 text-[#122846] font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition shrink-0 whitespace-nowrap cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#0284c7] shrink-0" />
          <span>{lang === 'bn' ? 'নতুন সাপোর্ট টিকেট খুলুন' : 'Open Support Ticket'}</span>
        </button>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-sky-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 truncate">
              {lang === 'bn' ? 'মোট টিকেট' : 'Total Tickets'}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{tickets.length}</p>
        </div>

        <div className="relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 truncate">
              {lang === 'bn' ? 'ওপেন টিকেট' : 'Open Tickets'}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{openCount}</p>
        </div>

        <div className="relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 truncate">
              {lang === 'bn' ? 'চলমান (In Progress)' : 'In Progress'}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{inProgressCount}</p>
        </div>

        <div className="relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 truncate">
              {lang === 'bn' ? 'সমাধানকৃত' : 'Resolved / Closed'}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{resolvedCount}</p>
        </div>
      </div>

      {/* Ticket List Section - Matching Merchant Dashboard UX */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900">
              {lang === 'bn' ? 'আপনার সকল সাপোর্ট টিকেট' : 'Your Support Tickets'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {filteredTickets.length}
            </span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'bn' ? 'টিকেট আইডি বা বিষয় খুঁজুন...' : 'Search ticket ID or subject...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
              />
            </div>

            <CustomSelect
              size="sm"
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-36"
              options={[
                { value: 'ALL', label: lang === 'bn' ? 'সব স্ট্যাটাস' : 'All Status' },
                { value: 'OPEN', label: 'Open' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
            />

            <button
              type="button"
              onClick={() => fetchTickets(true)}
              title="Refresh Tickets"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin text-[#0284c7]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tickets List */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-[#0284c7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              {lang === 'bn' ? 'টিকেট লোড হচ্ছে...' : 'Loading support tickets...'}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 sm:p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                <LifeBuoy className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                {lang === 'bn' ? 'কোনো সাপোর্ট টিকেট নেই' : 'No support tickets found'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5">
                {lang === 'bn'
                  ? 'আপনার কোনো সমস্যা বা প্রশ্ন থাকলে নির্দ্বিধায় একটি নতুন টিকেট তৈরি করুন।'
                  : "If you have questions or need assistance, don't hesitate to open a new support ticket."}
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'bn' ? 'টিকেট খুলুন' : 'Open Ticket'}</span>
              </button>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => router.push(`/dashboard/support/${ticket._id}`)}
                className="p-4 sm:p-5 hover:bg-sky-50/50 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    {getStatusBadge(ticket.status)}
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{ticket.ticketId}
                    </span>
                    {ticket.category && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {ticket.category}
                      </span>
                    )}
                    {ticket.priority && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          ticket.priority === 'URGENT'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : ticket.priority === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors truncate">
                    {ticket.subject}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>
                      {lang === 'bn' ? 'তৈরি:' : 'Created:'}{' '}
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                      {ticket.messages?.length || 1}{' '}
                      {lang === 'bn' ? 'মেসেজ' : 'messages'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-slate-400 group-hover:text-[#0284c7] transition-colors shrink-0">
                  <span className="text-xs sm:text-sm font-semibold mr-2 hidden sm:block">
                    {lang === 'bn' ? 'বিস্তারিত ও চ্যাট' : 'View Details'}
                  </span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Ticket Modal - Matching Merchant Dashboard & Affiliate Styling */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center font-bold">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {lang === 'bn' ? 'নতুন সাপোর্ট টিকেট খুলুন' : 'Open Support Ticket'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {lang === 'bn' ? 'বিষয় (Subject) *' : 'Subject *'}
                </label>
                <input
                  type="text"
                  required
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                  placeholder={
                    lang === 'bn'
                      ? 'সমস্যার একটি সংক্ষিপ্ত শিরোনাম লিখুন'
                      : 'Brief description of the issue'
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lang === 'bn' ? 'ক্যাটাগরি *' : 'Category *'}
                  </label>
                  <CustomSelect
                    value={newTicket.category}
                    onChange={(val) => setNewTicket({ ...newTicket, category: val })}
                    options={[
                      { value: 'General', label: lang === 'bn' ? 'সাধারণ (General)' : 'General' },
                      { value: 'Referral Tracking', label: lang === 'bn' ? 'রেফারেল ট্র্যাকিং' : 'Referral Tracking' },
                      { value: 'Commission', label: lang === 'bn' ? 'কমিশন সংক্রান্ত' : 'Commission' },
                      { value: 'Payout / Withdrawal', label: lang === 'bn' ? 'উইথড্রয়াল / পেমেন্ট' : 'Payout / Withdrawal' },
                      { value: 'Technical', label: lang === 'bn' ? 'টেকনিক্যাল সমস্যা' : 'Technical' },
                      { value: 'Other', label: lang === 'bn' ? 'অন্যান্য' : 'Other' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lang === 'bn' ? 'অগ্রাধিকার (Priority)' : 'Priority'}
                  </label>
                  <CustomSelect
                    value={newTicket.priority}
                    onChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                    options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HIGH', label: 'High' },
                      { value: 'URGENT', label: 'Urgent' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'bn' ? 'বার্তা (Message) *' : 'Message *'}
                  </label>
                  <span
                    className={`text-xs ${
                      newTicket.message.length >= 1000
                        ? 'text-red-500 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {newTicket.message.length} / 1000
                  </span>
                </div>
                <textarea
                  required
                  maxLength={1000}
                  rows={4}
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                  placeholder={
                    lang === 'bn'
                      ? 'আপনার সমস্যা বা প্রশ্ন বিস্তারিতভাবে লিখুন (সর্বোচ্চ ১০০০ অক্ষর)...'
                      : 'Describe your issue in detail (max 1000 characters)...'
                  }
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs sm:text-sm font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  {submitting
                    ? lang === 'bn'
                      ? 'পাঠানো হচ্ছে...'
                      : 'Submitting...'
                    : lang === 'bn'
                    ? 'টিকেট তৈরি করুন'
                    : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
