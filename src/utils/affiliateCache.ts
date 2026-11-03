import { affiliateApi } from './affiliateApi';

export interface AffiliateDashboardCache {
  me: {
    user: any;
    affiliate: any;
    programConfig: any;
  } | null;
  overview: any | null;
  referrals: {
    referrals: any[];
    stats: any;
    meta: { page: number; limit: number; total: number; totalPages: number };
    profile: any;
  } | null;
  commissions: {
    commissions: any[];
    summary: any;
    meta: { page: number; limit: number; total: number; totalPages: number };
  } | null;
  withdrawals: {
    summary: any;
    savedMethods: any[];
    withdrawals: any[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  } | null;
  support: {
    tickets: any[];
    selectedTicket: any | null;
  } | null;
  prefetched: boolean;
}

export const affiliateCache: AffiliateDashboardCache = {
  me: null,
  overview: null,
  referrals: null,
  commissions: null,
  withdrawals: null,
  support: null,
  prefetched: false,
};

export function clearAffiliateCache() {
  affiliateCache.me = null;
  affiliateCache.overview = null;
  affiliateCache.referrals = null;
  affiliateCache.commissions = null;
  affiliateCache.withdrawals = null;
  affiliateCache.support = null;
  affiliateCache.prefetched = false;
}

/**
 * Silently warms up all dashboard tab caches in the background after initial login/mount
 * so switching between Overview, Referrals, Commissions, Withdrawals, Support, and Settings
 * renders instantaneously with zero loading spinners.
 */
export function prefetchAffiliateDashboardData() {
  if (affiliateCache.prefetched) return;
  affiliateCache.prefetched = true;

  // 1. Overview
  if (!affiliateCache.overview) {
    affiliateApi
      .get('/overview', { params: { refPage: 1, refLimit: 5, txPage: 1, txLimit: 5 } })
      .then((res) => {
        if (res.data?.data && !affiliateCache.overview) {
          affiliateCache.overview = res.data.data;
        }
      })
      .catch(() => {});
  }

  // 2. Referrals
  if (!affiliateCache.referrals) {
    affiliateApi
      .get('/referrals', {
        params: { page: 1, limit: 10, status: 'all', eligibilityStatus: 'all', sortBy: 'newest' },
      })
      .then((res) => {
        if (res.data?.data && !affiliateCache.referrals) {
          affiliateCache.referrals = {
            referrals: res.data.data.data || [],
            stats: res.data.data.stats || {},
            meta: res.data.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
            profile: affiliateCache.me?.affiliate || null,
          };
        }
      })
      .catch(() => {});
  }

  // 3. Commissions
  if (!affiliateCache.commissions) {
    affiliateApi
      .get('/commissions', {
        params: { page: 1, limit: 10, status: 'all', sortBy: 'newest' },
      })
      .then((res) => {
        if (res.data?.data && !affiliateCache.commissions) {
          affiliateCache.commissions = {
            commissions: res.data.data.data || [],
            summary: res.data.data.summary || {},
            meta: res.data.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
          };
        }
      })
      .catch(() => {});
  }

  // 4. Withdrawals & Payment Methods
  if (!affiliateCache.withdrawals) {
    Promise.all([
      affiliateApi.get('/withdrawals', {
        params: { page: 1, limit: 10, status: 'all', paymentMethod: 'all' },
      }),
      affiliateApi.get('/payment-methods').catch(() => ({ data: { data: [] } })),
    ])
      .then(([wdRes, pmRes]) => {
        const wdPayload = wdRes.data?.data;
        if (wdPayload && !affiliateCache.withdrawals) {
          affiliateCache.withdrawals = {
            withdrawals: wdPayload.data || [],
            summary: wdPayload.summary || {
              availableBalance: 0,
              pendingWithdrawalAmount: 0,
              totalWithdrawn: 0,
              minimumWithdrawalAmount: 100,
              maximumWithdrawalAmount: 50000,
              withdrawalsEnabled: true,
              supportedMethods: ['bKash', 'Nagad', 'Rocket', 'Bank'],
            },
            savedMethods: pmRes.data?.data || [],
            meta: wdPayload.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
          };
        }
      })
      .catch(() => {});
  }

  // 5. Support Tickets
  if (!affiliateCache.support) {
    affiliateApi
      .get('/support')
      .then((res) => {
        const list = res.data?.data || [];
        if (!affiliateCache.support) {
          affiliateCache.support = {
            tickets: list,
            selectedTicket: list[0] || null,
          };
        }
      })
      .catch(() => {});
  }
}

