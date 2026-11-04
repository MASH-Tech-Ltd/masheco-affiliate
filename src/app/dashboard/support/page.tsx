'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  X,
  Search,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAffiliateLang } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import CustomSelect from '@/components/CustomSelect';
import { affiliateApi } from '@/utils/affiliateApi';
import { affiliateCache } from '@/utils/affiliateCache';

export default function AffiliateSupportPage() {
  const { lang } = useAffiliateLang();
  const { socket } = useSocket();

  const [tickets, setTickets] = useState<any[]>(() => affiliateCache.support?.tickets || []);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(
    () => affiliateCache.support?.selectedTicket || affiliateCache.support?.tickets?.[0] || null
  );
  const [loading, setLoading] = useState(() => !affiliateCache.support);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
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

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingClearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const selectedTicketRef = useRef<any>(selectedTicket);

  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  const fetchTickets = useCallback(async (isManual = false) => {
    try {
      if (!affiliateCache.support) {
        setLoading(true);
      } else if (isManual) {
        setIsRefreshing(true);
      }
      const res = await affiliateApi.get('/support');
      const list = res.data?.data || [];
      setTickets(list);
      setSelectedTicket((prev: any) => {
        const nextSelected = !prev
          ? list[0] || null
          : list.find((item: any) => item._id === prev._id) || prev;
        affiliateCache.support = {
          tickets: list,
          selectedTicket: nextSelected,
        };
        return nextSelected;
      });
    } catch (err: any) {
      if (!affiliateCache.support) {
        toast.error(err.response?.data?.message || 'Failed to load support tickets');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchTicketDetail = useCallback(async (ticketId: string, showLoading = true) => {
    try {
      if (showLoading) setLoadingDetail(true);
      const res = await affiliateApi.get(`/support/${ticketId}`);
      if (res.data?.data) {
        const detail = res.data.data;
        setSelectedTicket(detail);
        setTickets((prev) =>
          prev.map((t) => (t._id === ticketId ? { ...t, ...detail } : t))
        );
      }
    } catch {
      toast.error('Failed to load ticket conversation');
    } finally {
      if (showLoading) setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!socket || !selectedTicket?.ticketId) return;
    const currentTicketId = selectedTicket.ticketId;
    const currentMongoId = selectedTicket._id;

    const joinRooms = () => {
      socket.emit('join_ticket', currentTicketId);
      if (currentMongoId) {
        socket.emit('join_ticket', currentMongoId);
      }
    };

    joinRooms();
    socket.on('connect', joinRooms);

    const handleNewMessage = (msg: any) => {
      // Clear typing indicator since the new message has arrived
      setIsOtherTyping(false);
      setTypingUser('');
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);

      // Verify message is for this ticket
      const isForTicket =
        !msg.ticketId ||
        msg.ticketId === currentTicketId ||
        msg.ticketId === `#${currentTicketId}` ||
        msg.ticketMongoId === currentMongoId ||
        msg.ticketId === currentMongoId;

      if (!isForTicket) return;

      setSelectedTicket((prev: any) => {
        if (!prev) return prev;
        const exists = (prev.messages || []).some(
          (m: any) =>
            (m._id && msg._id && m._id === msg._id) ||
            (m.message === msg.message &&
              m.senderType === msg.senderType &&
              Math.abs(new Date(m.createdAt || 0).getTime() - new Date(msg.createdAt || 0).getTime()) < 3000)
        );
        if (exists) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), msg],
          updatedAt: msg.createdAt || new Date().toISOString(),
        };
      });

      // Update sidebar ticket list in memory without full-page refetch or flicker
      setTickets((prevList) =>
        prevList.map((t) =>
          t.ticketId === currentTicketId ||
          t._id === currentMongoId ||
          t.ticketId === msg.ticketId ||
          t._id === msg.ticketMongoId
            ? {
                ...t,
                messages: (t.messages || []).some((m: any) => m._id === msg._id)
                  ? t.messages
                  : [...(t.messages || []), msg],
                updatedAt: msg.createdAt || new Date().toISOString(),
              }
            : t
        )
      );
    };

    const handleStatusChanged = (status: string) => {
      setSelectedTicket((prev: any) => (prev ? { ...prev, status } : prev));
      setTickets((prevList) =>
        prevList.map((t) =>
          t.ticketId === currentTicketId || t._id === currentMongoId ? { ...t, status } : t
        )
      );
    };

    const handleTypingStart = (data: any) => {
      if (data?.ticketId === currentTicketId || data?.ticketId === currentMongoId) {
        setIsOtherTyping(true);
        setTypingUser(data.senderName || 'MASH ECO Support Team');
        if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
        typingClearTimerRef.current = setTimeout(() => {
          setIsOtherTyping(false);
          setTypingUser('');
        }, 3500);
      }
    };

    const handleTypingEnd = (data: any) => {
      if (data?.ticketId === currentTicketId || data?.ticketId === currentMongoId) {
        setIsOtherTyping(false);
        setTypingUser('');
        if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('status_changed', handleStatusChanged);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_end', handleTypingEnd);

    return () => {
      socket.emit('leave_ticket', currentTicketId);
      if (currentMongoId) {
        socket.emit('leave_ticket', currentMongoId);
      }
      socket.off('connect', joinRooms);
      socket.off('new_message', handleNewMessage);
      socket.off('status_changed', handleStatusChanged);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_end', handleTypingEnd);
      setIsOtherTyping(false);
      setTypingUser('');
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
    };
  }, [socket, selectedTicket?.ticketId, selectedTicket?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages, isOtherTyping]);

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
      await fetchTickets();
      if (created?._id) {
        fetchTicketDetail(created._id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket?._id || !replyText.trim() || sendingReply) return;

    if (socket && selectedTicket?.ticketId) {
      socket.emit('typing_end', { ticketId: selectedTicket.ticketId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      setSendingReply(true);
      const res = await affiliateApi.post(`/support/${selectedTicket._id}`, {
        message: replyText.trim(),
      });
      if (res.data?.data) {
        const updated = res.data.data;
        setSelectedTicket(updated);
        setTickets((prevList) =>
          prevList.map((t) => (t._id === updated._id ? { ...t, ...updated } : t))
        );
      }
      setReplyText('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    if (socket && selectedTicket?.ticketId) {
      socket.emit('typing_start', {
        ticketId: selectedTicket.ticketId,
        senderName: 'Affiliate Partner',
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_end', { ticketId: selectedTicket.ticketId });
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (socket && selectedTicket?.ticketId) {
        socket.emit('typing_end', { ticketId: selectedTicket.ticketId });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
      handleSendReply(e);
    }
  };

  const handleSelectTicket = (item: any) => {
    if (selectedTicket?._id === item._id) return;
    setSelectedTicket(item);
    if (!item.messages || item.messages.length <= 1) {
      fetchTicketDetail(item._id, false);
    }
  };

  const handleToggleStatus = async (nextStatus: 'RESOLVED' | 'OPEN') => {
    if (!selectedTicket?._id) return;
    try {
      const res = await affiliateApi.patch(`/support/${selectedTicket._id}`, {
        status: nextStatus,
      });
      if (res.data?.data) {
        setSelectedTicket((prev: any) => ({ ...prev, status: nextStatus }));
        setTickets((prevList) =>
          prevList.map((t) => (t._id === selectedTicket._id ? { ...t, status: nextStatus } : t))
        );
      }
      toast.success(
        lang === 'bn'
          ? `টিকেট স্ট্যাটাস ${nextStatus}-এ আপডেট হয়েছে`
          : `Ticket marked as ${nextStatus}`
      );
    } catch {
      toast.error('Failed to update ticket status');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            {lang === 'bn' ? 'ওপেন' : 'OPEN'}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            {lang === 'bn' ? 'প্রসেসিং' : 'IN PROGRESS'}
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            {lang === 'bn' ? 'সমাধানকৃত' : 'RESOLVED'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Action Banner */}
      <div className="bg-gradient-to-r from-[#122846] via-[#16345b] to-[#0284c7] rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sky-200 text-[10px] sm:text-xs font-semibold">
            <LifeBuoy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-300 shrink-0" />
            <span>
              {lang === 'bn' ? '২৪/৭ পার্টনার সহায়তা কেন্দ্র' : 'Dedicated Partner Helpdesk'}
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-extrabold text-white mt-1 leading-snug">
            {lang === 'bn'
              ? 'যেকোনো প্রয়োজনে সাপোর্ট টিকেট খুলুন'
              : 'Need Help with Referrals, Commissions, or Payouts?'}
          </h2>
          <p className="text-[11px] sm:text-sm text-slate-200/90 leading-relaxed">
            {lang === 'bn'
              ? 'অ্যাকাউন্ট অনুমোদন, রেফারেল ট্র্যাকিং বা উইথড্রয়াল সংক্রান্ত যেকোনো প্রশ্নে আমাদের সাপোর্ট টিমের সাথে সরাসরি কথা বলুন।'
              : 'Open a support ticket below and chat directly with the MASH ECO Super Admin team in real time.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-sky-50 text-[#122846] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition shrink-0 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#0284c7] shrink-0" />
          <span>{lang === 'bn' ? 'নতুন সাপোর্ট টিকেট খুলুন' : 'Open Support Ticket'}</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="relative bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-sky-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              {lang === 'bn' ? 'মোট টিকেট' : 'Total Tickets'}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center shrink-0">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1.5 sm:mt-2">{tickets.length}</p>
        </div>

        <div className="relative bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              {lang === 'bn' ? 'ওপেন টিকেট' : 'Open Tickets'}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1.5 sm:mt-2">{openCount}</p>
        </div>

        <div className="relative bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              {lang === 'bn' ? 'চলমান (In Progress)' : 'In Progress'}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1.5 sm:mt-2">{inProgressCount}</p>
        </div>

        <div className="relative bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              {lang === 'bn' ? 'সমাধানকৃত' : 'Resolved / Closed'}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1.5 sm:mt-2">{resolvedCount}</p>
        </div>
      </div>

      {/* Main Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ticket List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col min-h-[540px]">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'bn' ? 'আপনার সাপোর্ট টিকেটসমূহ' : 'Your Support Tickets'}
              </h3>
              <button
                type="button"
                onClick={() => fetchTickets(true)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={lang === 'bn' ? 'টিকেট খুঁজুন...' : 'Search ticket ID or subject...'}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <CustomSelect
                size="sm"
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-36"
                options={[
                  { value: 'ALL', label: lang === 'bn' ? 'সব' : 'All Tickets' },
                  { value: 'OPEN', label: 'Open' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'RESOLVED', label: 'Resolved' },
                  { value: 'CLOSED', label: 'Closed' },
                ]}
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading tickets...'}
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700 mt-1">
                  {lang === 'bn' ? 'কোনো সাপোর্ট টিকেট নেই' : 'No support tickets found'}
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                  {lang === 'bn'
                    ? 'নতুন সাপোর্ট রিকোয়েস্ট পাঠাতে উপরের বাটনে ক্লিক করুন।'
                    : 'Click "Open Support Ticket" above whenever you need assistance.'}
                </p>
              </div>
            ) : (
              filteredTickets.map((item) => {
                const isSelected = selectedTicket?._id === item._id;
                return (
                  <div
                    key={item._id}
                    onClick={() => handleSelectTicket(item)}
                    className={`p-4 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-sky-50/70 border-l-4 border-l-[#0284c7]'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(item.status)}
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          #{item.ticketId}
                        </span>
                        {item.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.subject}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{item.messages?.length || 1} messages</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#0284c7]' : 'text-slate-300'
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Ticket Conversation Thread (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col min-h-[540px]">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? 'কোনো টিকেট নির্বাচন করা হয়নি' : 'Select a Ticket to View Conversation'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {lang === 'bn'
                  ? 'বাম পাশের তালিকা থেকে একটি টিকেট নির্বাচন করুন অথবা নতুন সাপোর্ট টিকেট খুলুন।'
                  : 'Choose a support ticket from the list on the left or open a new support request to start chatting with our team.'}
              </p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-[#0284c7]">
                      #{selectedTicket.ticketId}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                    <span className="text-[11px] font-semibold text-slate-400">
                      Priority: {selectedTicket.priority || 'MEDIUM'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {selectedTicket.subject}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' ? (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus('RESOLVED')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition cursor-pointer"
                    >
                      {lang === 'bn' ? 'সমাধান হয়েছে মার্ক করুন' : 'Mark Resolved'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus('OPEN')}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 text-xs font-bold transition cursor-pointer"
                    >
                      {lang === 'bn' ? 'পুনরায় চালু করুন' : 'Reopen Ticket'}
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F8FAFC] max-h-[380px]">
                {loadingDetail ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Loading conversation...
                  </div>
                ) : (
                  (selectedTicket.messages || []).map((msg: any, idx: number) => {
                    const isAdmin = msg.senderType === 'ADMIN';
                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl p-4 shadow-2xs ${
                            isAdmin
                              ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                              : 'bg-[#0284c7] text-white rounded-tr-xs shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                isAdmin ? 'text-[#0284c7]' : 'text-sky-100'
                              }`}
                            >
                              {isAdmin ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  MASH ECO Support Team
                                </>
                              ) : (
                                <>
                                  <User className="w-3.5 h-3.5" />
                                  You (Affiliate Partner)
                                </>
                              )}
                            </span>
                            <span
                              className={`text-[10px] ${
                                isAdmin ? 'text-slate-400' : 'text-sky-100/80'
                              }`}
                            >
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleString([], {
                                    month: 'short',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {isOtherTyping && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 italic px-3.5 py-2 bg-white rounded-xl w-fit border border-slate-200/90 shadow-2xs animate-pulse">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-[#0284c7] rounded-full animate-bounce" />
                    </div>
                    <span className="font-semibold text-slate-700">
                      {typingUser === 'Admin' ? 'MASH ECO Support Team' : (typingUser || 'MASH ECO Support Team')}{' '}
                    </span>
                    <span className="text-slate-500">
                      {lang === 'bn' ? 'টাইপ করছেন...' : 'is typing...'}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Box */}
              <form
                onSubmit={handleSendReply}
                className="p-4 bg-white border-t border-slate-100 flex items-end gap-3"
              >
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={handleReplyChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    lang === 'bn'
                      ? 'আপনার উত্তর লিখুন... (পাঠাতে Enter চাপুন)'
                      : 'Write a reply to MASH ECO Support... (Press Enter to send)'
                  }
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] resize-none"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingReply ? 'Sending...' : lang === 'bn' ? 'পাঠান' : 'Send'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Create Support Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0284c7] flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'bn' ? 'নতুন সাপোর্ট টিকেট খুলুন' : 'Open Partner Support Ticket'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'bn' ? 'বিষয় (Subject) *' : 'Subject *'}
                </label>
                <input
                  type="text"
                  required
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: অ্যাকাউন্ট অনুমোদন বা উইথড্রয়াল সংক্রান্ত'
                      : 'e.g. Account Approval / Withdrawal Inquiry'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <CustomSelect
                    value={newTicket.category}
                    onChange={(val) => setNewTicket({ ...newTicket, category: val })}
                    options={[
                      { value: 'Account Approval', label: 'Account Approval' },
                      { value: 'Withdrawal / Payout', label: 'Withdrawal / Payout' },
                      { value: 'Commission Calculation', label: 'Commission Calculation' },
                      { value: 'Referral Attribution', label: 'Referral Attribution' },
                      { value: 'Technical Issue', label: 'Technical Issue' },
                      { value: 'General', label: 'General Inquiry' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {lang === 'bn' ? 'গুরুত্ব (Priority)' : 'Priority'}
                  </label>
                  <CustomSelect
                    value={newTicket.priority}
                    onChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                    options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HIGH', label: 'High' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    {lang === 'bn' ? 'বিস্তারিত বার্তা *' : 'Detailed Message *'}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {newTicket.message.length} / 1500
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  maxLength={1500}
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder={
                    lang === 'bn'
                      ? 'আপনার সমস্যা বা প্রশ্নের বিস্তারিত বর্ণনা দিন...'
                      : 'Describe your question or issue in detail...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Submitting...'
                      : lang === 'bn'
                      ? 'টিকেট জমা দিন'
                      : 'Submit Ticket'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
