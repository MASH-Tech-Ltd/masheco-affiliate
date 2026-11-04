'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Clock, CircleDot, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { affiliateApi } from '@/utils/affiliateApi';
import { useSocket } from '@/context/SocketContext';
import { useAffiliateLang } from '@/context/LanguageContext';

export default function SupportDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { lang } = useAffiliateLang();
  const { socket, isConnected } = useSocket();

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  useEffect(() => {
    if (socket && ticket?.ticketId) {
      const ticketCode = ticket.ticketId;
      const mongoId = ticket._id ? String(ticket._id) : '';

      const joinRooms = () => {
        socket.emit('join_ticket', ticketCode);
        if (mongoId) {
          socket.emit('join_ticket', mongoId);
        }
      };

      joinRooms();
      socket.on('connect', joinRooms);

      const handleNewMessage = (message: any) => {
        setIsTyping(false);
        setTypingUser('');

        setTicket((prev: any) => {
          if (!prev) return prev;
          if (prev.messages && prev.messages.some((m: any) => String(m._id) === String(message._id))) {
            return prev;
          }
          return {
            ...prev,
            messages: [...(prev.messages || []), message],
          };
        });
      };

      const handleStatusChanged = (status: any) => {
        setTicket((prev: any) => (prev ? { ...prev, status } : prev));
      };

      const handleTicketDeleted = () => {
        toast.error(lang === 'bn' ? 'এই টিকেটটি মুছে ফেলা হয়েছে' : 'This ticket was deleted');
        router.push('/dashboard/support');
      };

      const handleTypingStart = (data: any) => {
        const cleanDataId = String(data?.ticketId || '').replace(/^#/, '').trim().toUpperCase();
        const cleanCurId = String(ticketCode || '').replace(/^#/, '').trim().toUpperCase();
        const curMongo = mongoId.trim();

        if (!data?.ticketId || cleanDataId === cleanCurId || cleanDataId === curMongo) {
          setIsTyping(true);
          setTypingUser(data.senderName || 'Support Team');
        }
      };

      const handleTypingEnd = (data: any) => {
        const cleanDataId = String(data?.ticketId || '').replace(/^#/, '').trim().toUpperCase();
        const cleanCurId = String(ticketCode || '').replace(/^#/, '').trim().toUpperCase();
        const curMongo = mongoId.trim();

        if (!data?.ticketId || cleanDataId === cleanCurId || cleanDataId === curMongo) {
          setIsTyping(false);
          setTypingUser('');
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('status_changed', handleStatusChanged);
      socket.on('ticket_deleted', handleTicketDeleted);
      socket.on('typing_start', handleTypingStart);
      socket.on('typing_end', handleTypingEnd);

      return () => {
        socket.emit('leave_ticket', ticketCode);
        if (mongoId) {
          socket.emit('leave_ticket', mongoId);
        }
        socket.off('connect', joinRooms);
        socket.off('new_message', handleNewMessage);
        socket.off('status_changed', handleStatusChanged);
        socket.off('ticket_deleted', handleTicketDeleted);
        socket.off('typing_start', handleTypingStart);
        socket.off('typing_end', handleTypingEnd);
      };
    }
  }, [socket, ticket?.ticketId, ticket?._id, router, lang]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const res = await affiliateApi.get(`/support/${id}`);
      setTicket(res.data?.data);
    } catch {
      toast.error(lang === 'bn' ? 'টিকেট লোড করা সম্ভব হয়নি' : 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || sending) return;

    if (socket && ticket?.ticketId) {
      socket.emit('typing_end', { ticketId: ticket.ticketId });
      if (ticket._id) socket.emit('typing_end', { ticketId: String(ticket._id) });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    setSending(true);
    try {
      const res = await affiliateApi.post(`/support/${id}`, {
        message: replyMessage.trim(),
      });
      if (res.data?.data) {
        setTicket(res.data.data);
      }
      setReplyMessage('');
      toast.success(lang === 'bn' ? 'উত্তর পাঠানো হয়েছে' : 'Reply sent');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          (lang === 'bn' ? 'উত্তর পাঠানো ব্যর্থ হয়েছে' : 'Failed to send reply')
      );
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'IN_PROGRESS':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'RESOLVED':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'CLOSED':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-[#0284c7] border-t-transparent rounded-full animate-spin mb-3" />
        {lang === 'bn' ? 'টিকেট বিবরণী লোড হচ্ছে...' : 'Loading ticket details...'}
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {lang === 'bn' ? 'টিকেট পাওয়া যায়নি' : 'Ticket Not Found'}
        </h2>
        <button
          onClick={() => router.push('/dashboard/support')}
          className="text-[#0284c7] hover:underline font-semibold"
        >
          {lang === 'bn' ? 'সাপোর্ট সেন্টারে ফিরে যান' : 'Return to Support'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto h-[calc(100dvh-78px)] sm:h-[calc(100dvh-112px)] lg:h-[calc(100dvh-128px)] flex flex-col overflow-hidden">
      {/* Top Header matching Merchant Dashboard */}
      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 shrink-0 justify-between">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <button
            onClick={() => router.push('/dashboard/support')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 cursor-pointer shrink-0"
            title="Back to tickets list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-1 flex-wrap">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 truncate">
                {ticket.subject}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${getStatusColor(
                  ticket.status
                )}`}
              >
                <CircleDot className="w-3 h-3" />
                {ticket.status}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-slate-600">
                Ticket ID: #{ticket.ticketId}
              </span>
              <span>•</span>
              <span>
                {lang === 'bn' ? 'তৈরি:' : 'Created on'}{' '}
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Box - Constrained to screen height & scrollable internally */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200/90 flex flex-col overflow-hidden">
        {/* Messages List Area - Only this container scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-4">
          {(ticket.messages || []).map((msg: any, idx: number) => {
            const isAffiliate = msg.senderType === 'MERCHANT';
            return (
              <div
                key={msg._id || idx}
                className={`flex ${isAffiliate ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 shadow-xs break-words [overflow-wrap:anywhere] ${
                    isAffiliate
                      ? 'bg-[#0284c7] text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  <div className="text-[11px] font-medium opacity-80 mb-1.5 flex items-center gap-1.5">
                    <span className="font-bold">
                      {isAffiliate
                        ? (lang === 'bn' ? 'আপনি (পার্টনার)' : 'You (Partner)')
                        : 'Support Team'}
                    </span>
                    <span className="opacity-50">•</span>
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(
                        msg.createdAt || msg._id?.getTimestamp?.() || Date.now()
                      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed break-words [overflow-wrap:anywhere] select-text">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Real-time Sticky Typing Indicator */}
        {isTyping && (
          <div className="shrink-0 px-6 py-2 bg-sky-50/70 text-xs text-sky-800 italic border-t border-sky-100 flex items-center gap-2">
            <span className="flex gap-1">
              <span
                className="w-1.5 h-1.5 bg-[#0284c7] rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-[#0284c7] rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-[#0284c7] rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </span>
            <span>
              {typingUser || (lang === 'bn' ? 'সাপোর্ট টিম' : 'Support Team')}{' '}
              {lang === 'bn' ? 'টাইপ করছে...' : 'is typing...'}
            </span>
          </div>
        )}

        {/* Locked banner if ticket closed, otherwise Reply Form */}
        {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
          <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-200 text-center text-slate-500 text-sm flex items-center justify-center gap-2 min-h-[80px]">
            <CheckCircle className="w-5 h-5 text-slate-400" />
            <span>
              {lang === 'bn'
                ? `এই টিকেটটি ${ticket.status.toLowerCase()} করা হয়েছে। এতে আর মেসেজ পাঠানো যাবে না।`
                : `This ticket is ${ticket.status.toLowerCase()}. You cannot reply to this conversation.`}
            </span>
          </div>
        ) : (
          <div className="shrink-0 p-3 sm:p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleReply} className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={replyMessage}
                  onChange={(e) => {
                    setReplyMessage(e.target.value);
                    if (socket && ticket?.ticketId) {
                      const userStr =
                        localStorage.getItem('affiliate_user') ||
                        sessionStorage.getItem('affiliate_user');
                      let name = 'Affiliate Partner';
                      if (userStr) {
                        try {
                          const user = JSON.parse(userStr);
                          if (user.name) name = user.name;
                        } catch {}
                      }
                      socket.emit('typing_start', {
                        ticketId: ticket.ticketId,
                        senderName: name,
                      });
                      if (ticket._id) {
                        socket.emit('typing_start', {
                          ticketId: String(ticket._id),
                          senderName: name,
                        });
                      }
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => {
                        socket.emit('typing_end', { ticketId: ticket.ticketId });
                        if (ticket._id) {
                          socket.emit('typing_end', { ticketId: String(ticket._id) });
                        }
                      }, 2000);
                    }
                  }}
                  maxLength={1000}
                  placeholder={
                    lang === 'bn'
                      ? 'এখানে আপনার উত্তর লিখুন... (Enter চাপলে সেন্ড হবে)'
                      : 'Write a reply to MASH ECO Support... (Press Enter to send)'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] resize-none max-h-32 min-h-[60px]"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (socket && ticket?.ticketId) {
                        socket.emit('typing_end', { ticketId: ticket.ticketId });
                        if (ticket._id) {
                          socket.emit('typing_end', { ticketId: String(ticket._id) });
                        }
                      }
                      handleReply(e);
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={sending || !replyMessage.trim()}
                className="bg-[#0284c7] hover:bg-[#0369a1] text-white p-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 shadow-sm h-[60px] w-[60px] cursor-pointer active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
