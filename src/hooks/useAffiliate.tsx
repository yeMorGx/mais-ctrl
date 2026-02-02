import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const REF_COOKIE_NAME = "maisctrl_ref";
const REF_STORAGE_KEY = "maisctrl_ref";
const REF_EXPIRY_DAYS = 30;

interface Affiliate {
  id: string;
  user_id: string;
  code: string;
  pix_key: string | null;
  status: string;
  created_at: string;
}

interface AffiliateStats {
  is_affiliate: boolean;
  total_referrals?: number;
  approved_referrals?: number;
  pending_commissions_cents?: number;
  available_commissions_cents?: number;
  total_paid_cents?: number;
  total_earned_cents?: number;
}

interface Commission {
  id: string;
  stripe_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  available_at: string;
  created_at: string;
}

interface Referral {
  id: string;
  referred_user_id: string;
  status: string;
  signup_at: string | null;
  approved_at: string | null;
  created_at: string;
}

interface PayoutRequest {
  id: string;
  amount_cents: number;
  pix_key: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export const useAffiliate = () => {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Save ref code from URL
  const saveRefCode = useCallback((code: string) => {
    // Check if ref already exists (first-touch)
    const existingRef = localStorage.getItem(REF_STORAGE_KEY);
    if (existingRef) {
      return false;
    }

    // Save to localStorage
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + REF_EXPIRY_DAYS);
    
    const refData = {
      code: code.toUpperCase(),
      expiry: expiryDate.toISOString(),
    };
    
    localStorage.setItem(REF_STORAGE_KEY, JSON.stringify(refData));

    // Also set cookie
    document.cookie = `${REF_COOKIE_NAME}=${code.toUpperCase()}; expires=${expiryDate.toUTCString()}; path=/`;
    
    return true;
  }, []);

  // Get saved ref code
  const getRefCode = useCallback((): string | null => {
    try {
      const stored = localStorage.getItem(REF_STORAGE_KEY);
      if (stored) {
        const refData = JSON.parse(stored);
        if (new Date(refData.expiry) > new Date()) {
          return refData.code;
        }
        // Expired, clean up
        localStorage.removeItem(REF_STORAGE_KEY);
      }
    } catch {
      // Fallback to cookie
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === REF_COOKIE_NAME) {
          return value;
        }
      }
    }
    return null;
  }, []);

  // Clear ref code after successful tracking
  const clearRefCode = useCallback(() => {
    localStorage.removeItem(REF_STORAGE_KEY);
    document.cookie = `${REF_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }, []);

  // Fetch affiliate data
  const fetchAffiliateData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke("affiliate-actions", {
        body: { action: "get_affiliate" },
      });

      if (fetchError) throw fetchError;

      if (data.affiliate) {
        setAffiliate(data.affiliate);
        setStats(data.stats);
      } else {
        setAffiliate(null);
        setStats(null);
      }
    } catch (err) {
      console.error("Error fetching affiliate data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch affiliate data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch commissions
  const fetchCommissions = useCallback(async () => {
    if (!user || !affiliate) return;

    try {
      const { data, error: fetchError } = await supabase.functions.invoke("affiliate-actions", {
        body: { action: "get_commissions" },
      });

      if (fetchError) throw fetchError;
      setCommissions(data.commissions || []);
    } catch (err) {
      console.error("Error fetching commissions:", err);
    }
  }, [user, affiliate]);

  // Fetch referrals
  const fetchReferrals = useCallback(async () => {
    if (!user || !affiliate) return;

    try {
      const { data, error: fetchError } = await supabase.functions.invoke("affiliate-actions", {
        body: { action: "get_referrals" },
      });

      if (fetchError) throw fetchError;
      setReferrals(data.referrals || []);
    } catch (err) {
      console.error("Error fetching referrals:", err);
    }
  }, [user, affiliate]);

  // Fetch payouts
  const fetchPayouts = useCallback(async () => {
    if (!user || !affiliate) return;

    try {
      const { data, error: fetchError } = await supabase.functions.invoke("affiliate-actions", {
        body: { action: "get_payouts" },
      });

      if (fetchError) throw fetchError;
      setPayouts(data.payouts || []);
    } catch (err) {
      console.error("Error fetching payouts:", err);
    }
  }, [user, affiliate]);

  // Become an affiliate
  const becomeAffiliate = useCallback(async (pixKey?: string) => {
    if (!user) throw new Error("Not authenticated");

    const { data, error: createError } = await supabase.functions.invoke("affiliate-actions", {
      body: { action: "become_affiliate", pix_key: pixKey },
    });

    if (createError) throw createError;
    if (data.error) throw new Error(data.error);

    setAffiliate(data.affiliate);
    await fetchAffiliateData();
    
    return data.affiliate;
  }, [user, fetchAffiliateData]);

  // Track referral on signup
  const trackReferral = useCallback(async () => {
    if (!user) return false;

    const refCode = getRefCode();
    if (!refCode) return false;

    try {
      const { data, error: trackError } = await supabase.functions.invoke("affiliate-actions", {
        body: { action: "track_referral", ref_code: refCode },
      });

      if (trackError) throw trackError;

      if (data.success) {
        clearRefCode();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Error tracking referral:", err);
      return false;
    }
  }, [user, getRefCode, clearRefCode]);

  // Request payout
  const requestPayout = useCallback(async (pixKey: string) => {
    if (!user || !affiliate) throw new Error("Not authenticated");

    const { data, error: payoutError } = await supabase.functions.invoke("affiliate-actions", {
      body: { action: "request_payout", pix_key: pixKey },
    });

    if (payoutError) throw payoutError;
    if (data.error) throw new Error(data.error);

    await fetchAffiliateData();
    await fetchPayouts();

    return data.payout;
  }, [user, affiliate, fetchAffiliateData, fetchPayouts]);

  // Update PIX key
  const updatePixKey = useCallback(async (pixKey: string) => {
    if (!user) throw new Error("Not authenticated");

    const { data, error: updateError } = await supabase.functions.invoke("affiliate-actions", {
      body: { action: "update_pix_key", pix_key: pixKey },
    });

    if (updateError) throw updateError;
    if (data.error) throw new Error(data.error);

    await fetchAffiliateData();
  }, [user, fetchAffiliateData]);

  // Initial fetch
  useEffect(() => {
    fetchAffiliateData();
  }, [fetchAffiliateData]);

  // Fetch details when affiliate is loaded
  useEffect(() => {
    if (affiliate) {
      fetchCommissions();
      fetchReferrals();
      fetchPayouts();
    }
  }, [affiliate, fetchCommissions, fetchReferrals, fetchPayouts]);

  // Check for ref code in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    
    if (refCode) {
      saveRefCode(refCode);
      // Clean URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  }, [saveRefCode]);

  // Track referral when user signs up
  useEffect(() => {
    if (user) {
      trackReferral();
    }
  }, [user, trackReferral]);

  return {
    affiliate,
    stats,
    commissions,
    referrals,
    payouts,
    loading,
    error,
    becomeAffiliate,
    requestPayout,
    updatePixKey,
    getRefCode,
    saveRefCode,
    fetchAffiliateData,
    fetchCommissions,
    fetchReferrals,
    fetchPayouts,
  };
};
