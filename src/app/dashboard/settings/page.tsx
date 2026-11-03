'use client';

import React, { useEffect, useState, useRef } from 'react';
import { affiliateApi } from '@/utils/affiliateApi';
import { useLanguage } from '@/context/LanguageContext';
import CustomSelect from '@/components/CustomSelect';
import toast from 'react-hot-toast';
import {
  User,
  Lock,
  CreditCard,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Smartphone,
  Camera,
  Upload,
  X,
  Link2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface PaymentMethodItem {
  id: string;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Bank';
  accountType: string;
  accountNumber: string;
  accountName: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  isDefault: boolean;
}

export default function AffiliateSettingsPage() {
  const { t, lang } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'payment'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [referralLink, setReferralLink] = useState('');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Saved Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await affiliateApi.get('/me');
        const payload = res.data?.data;
        if (payload?.user) {
          setName(payload.user.name || '');
          setEmail(payload.user.email || '');
          setPhone(payload.user.phone || '');
          setAddress(payload.user.address || '');
          setAvatarUrl(payload.user.avatar?.secure_url || payload.user.avatarUrl || '');
        }
        if (payload?.affiliate) {
          setAffiliateCode(payload.affiliate.affiliateCode || '');
          setReferralLink(payload.affiliate.referralLink || '');
          setPaymentMethods(payload.affiliate.paymentMethods || []);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load account settings');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(
        lang === 'bn'
          ? 'অনুগ্রহ করে একটি বৈধ ছবির ফাইল নির্বাচন করুন (JPG, PNG, WEBP)'
          : 'Please select a valid image file (JPG, PNG, WEBP)'
      );
      e.target.value = '';
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      toast.error(
        lang === 'bn'
          ? 'ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে!'
          : 'Image size must not exceed 2MB!'
      );
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await affiliateApi.patch('/settings', {
        action: 'update_profile',
        name,
        phone,
        address,
        avatarUrl,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('affiliate:profile-updated'));
      }
      toast.success(
        lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' : 'Profile information updated!'
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(
        lang === 'bn'
          ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'
          : 'New password must be at least 6 characters'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(
        lang === 'bn'
          ? 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মেলেনি'
          : 'New password and confirm password do not match'
      );
      return;
    }

    try {
      setSaving(true);
      await affiliateApi.patch('/settings', {
        action: 'change_password',
        oldPassword,
        newPassword,
        confirmPassword,
      });
      toast.success(
        lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' : 'Password changed successfully!'
      );
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaymentMethod = () => {
    setPaymentMethods((prev) => [
      ...prev,
      {
        id: `pm_${Date.now()}`,
        method: 'bKash',
        accountType: 'Personal',
        accountNumber: '',
        accountName: name || '',
        bankName: '',
        branchName: '',
        routingNumber: '',
        isDefault: prev.length === 0,
      },
    ]);
  };

  const handleUpdateMethodField = (index: number, field: keyof PaymentMethodItem, value: any) => {
    setPaymentMethods((prev) =>
      prev.map((item, idx) => {
        if (field === 'isDefault' && value === true) {
          return { ...item, isDefault: idx === index };
        }
        if (idx === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleRemovePaymentMethod = (index: number) => {
    setPaymentMethods((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSavePaymentMethods = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const pm of paymentMethods) {
      if (!pm.accountNumber.trim() || !pm.accountName.trim()) {
        toast.error(
          lang === 'bn'
            ? 'সব পেমেন্ট মাধ্যমের অ্যাকাউন্ট নম্বর ও নাম পূরণ করুন'
            : 'Please fill in account number and holder name for all payout methods'
        );
        return;
      }
    }

    try {
      setSaving(true);
      const res = await affiliateApi.put('/payment-methods', {
        paymentMethods,
      });
      if (res.data?.data) {
        setPaymentMethods(res.data.data);
      }
      toast.success(
        lang === 'bn'
          ? 'পেমেন্ট মাধ্যমসমূহ সফলভাবে সেভ করা হয়েছে!'
          : 'Saved payout methods updated!'
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save payment methods');
    } finally {
      setSaving(false);
    }
  };

  const copyReferralCode = () => {
    if (!affiliateCode) return;
    navigator.clipboard.writeText(affiliateCode);
    setCopiedCode(true);
    toast.success(t.overview.copied);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success(t.overview.copied);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const userInitial = (name || email || 'P').charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2.5 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          {t.settings.profileTab}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === 'security'
              ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Lock className="w-4 h-4" />
          {t.settings.securityTab}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payment')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === 'payment'
              ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          {t.settings.paymentTab}
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading account settings...'}
        </div>
      ) : (
        <>
          {/* Tab 1: Profile Information + Profile Picture */}
          {activeTab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Profile Photo Card (4 cols) */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 flex flex-col items-center text-center justify-center">
                <div className="w-full flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#122846] to-[#0284c7] text-white flex items-center justify-center text-3xl font-extrabold overflow-hidden border-4 border-sky-100 shadow-md">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={name || 'Profile'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title={lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Profile Photo'}
                      className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center border-2 border-white shadow-sm transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />

                  <h3 className="text-base font-bold text-slate-900 mt-4">
                    {name || 'Affiliate Partner'}
                  </h3>
                  <p className="text-xs text-slate-500">{email}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Photo'}</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'মুছুন' : 'Remove'}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3">
                    {lang === 'bn'
                      ? 'JPG, PNG বা WEBP ফরম্যাট (সর্বোচ্চ ২ MB)। আপলোডের পর নিচে Save বাটনে ক্লিক করুন।'
                      : 'JPG, PNG, or WEBP format (Max 2MB). Click Save Profile Changes after uploading.'}
                  </p>
                </div>
              </div>

              {/* Right Column: Personal & Referral Details (8 cols) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'bn' ? 'ব্যক্তিগত ও অ্যাকাউন্ট তথ্য' : 'Personal & Partner Information'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'bn'
                      ? 'আপনার নাম, ফোন নম্বর এবং প্রোফাইল ছবি আপডেট করুন।'
                      : 'Update your partner contact details and view your referral credentials.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.auth.fullName} *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.auth.email} ({lang === 'bn' ? 'পরিবর্তনযোগ্য নয়' : 'Read-Only'})
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.auth.phone} *
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.referrals.yourReferralCode}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={affiliateCode}
                        disabled
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-[#0284c7] text-sm"
                      />
                      <button
                        type="button"
                        onClick={copyReferralCode}
                        className="px-3.5 py-2.5 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-sky-100 transition cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {lang === 'bn' ? 'ঠিকানা (ঐচ্ছিক)' : 'Address (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, Area, Country"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                  />
                </div>

                {referralLink && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                        <Link2 className="w-3.5 h-3.5 text-[#0284c7]" />
                        <span>{t.referrals.yourReferralLink}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-800 break-all">
                        {referralLink}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={copyReferralLink}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 shrink-0 cursor-pointer"
                    >
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{t.overview.copyLink}</span>
                    </button>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : t.settings.saveProfile}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 2: Change Password */}
          {activeTab === 'security' && (
            <form
              onSubmit={handleChangePassword}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4 max-w-xl"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t.settings.securityTab}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'bn'
                    ? 'আপনার অ্যাকাউন্টের পাসওয়ার্ড নিরাপদ রাখুন।'
                    : 'Update your account password to keep your partner earnings secure.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'} *
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'New Password (Min 6 chars)'} *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.auth.confirmPassword} *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  {saving ? 'Updating...' : t.settings.updatePassword}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Saved Payout Methods */}
          {activeTab === 'payment' && (
            <form
              onSubmit={handleSavePaymentMethods}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t.settings.paymentTab}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'bn'
                      ? 'দ্রুত উইথড্রয়ালের জন্য আপনার বিকাশ, নগদ, রকেট বা ব্যাংক অ্যাকাউন্ট সেভ করে রাখুন।'
                      : 'Save your preferred bKash, Nagad, Rocket, or Bank accounts for 1-click withdrawal requests.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-sky-100 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'bn' ? 'নতুন মাধ্যম যোগ করুন' : 'Add Payout Account'}
                </button>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                  {lang === 'bn'
                    ? 'কোনো পেমেন্ট মাধ্যম সেভ করা নেই। উপরে "নতুন মাধ্যম যোগ করুন" বাটনে ক্লিক করুন।'
                    : 'No payout methods saved yet. Click "Add Payout Account" above to add one.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((pm, idx) => (
                    <div
                      key={pm.id || idx}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {pm.method === 'Bank' ? (
                            <Building2 className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Smartphone className="w-4 h-4 text-[#0284c7]" />
                          )}
                          <span className="text-xs font-bold text-slate-800">
                            {pm.method} Account #{idx + 1}
                          </span>
                          {pm.isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {!pm.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleUpdateMethodField(idx, 'isDefault', true)}
                              className="text-xs font-semibold text-[#0284c7] hover:underline cursor-pointer"
                            >
                              {lang === 'bn' ? 'ডিফল্ট করুন' : 'Set as Default'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePaymentMethod(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Method
                          </label>
                          <CustomSelect
                            size="sm"
                            value={pm.method}
                            onChange={(val) => handleUpdateMethodField(idx, 'method', val)}
                            options={[
                              { value: 'bKash', label: 'bKash' },
                              { value: 'Nagad', label: 'Nagad' },
                              { value: 'Rocket', label: 'Rocket' },
                              { value: 'Bank', label: 'Bank' },
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Account Type
                          </label>
                          <CustomSelect
                            size="sm"
                            value={pm.accountType}
                            onChange={(val) => handleUpdateMethodField(idx, 'accountType', val)}
                            options={[
                              { value: 'Personal', label: 'Personal' },
                              { value: 'Agent', label: 'Agent' },
                              { value: 'Savings', label: 'Savings' },
                              { value: 'Current', label: 'Current' },
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Account / Mobile Number *
                          </label>
                          <input
                            type="text"
                            value={pm.accountNumber}
                            onChange={(e) =>
                              handleUpdateMethodField(idx, 'accountNumber', e.target.value)
                            }
                            placeholder="01XXXXXXXXX"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Account Holder Name *
                          </label>
                          <input
                            type="text"
                            value={pm.accountName}
                            onChange={(e) =>
                              handleUpdateMethodField(idx, 'accountName', e.target.value)
                            }
                            placeholder="Full Name"
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      </div>

                      {pm.method === 'Bank' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Bank Name *
                            </label>
                            <input
                              type="text"
                              value={pm.bankName || ''}
                              onChange={(e) =>
                                handleUpdateMethodField(idx, 'bankName', e.target.value)
                              }
                              placeholder="Bank Name"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Branch Name *
                            </label>
                            <input
                              type="text"
                              value={pm.branchName || ''}
                              onChange={(e) =>
                                handleUpdateMethodField(idx, 'branchName', e.target.value)
                              }
                              placeholder="Branch Name"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : t.settings.savePaymentMethods}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
