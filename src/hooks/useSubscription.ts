import { useState, useEffect, useCallback } from "react";
import {
  getUserPlan,
  canUserGenerate,
  type UserPlan,
  type PlanKey,
} from "@/lib/subscription";
import { useAuth } from "@/components/AuthProvider";

interface UseSubscriptionReturn {
  /** The full plan details */
  plan: UserPlan | null;
  /** Shortcut: the plan display name */
  planName: string;
  /** Shortcut: which plan key this is */
  planKey: PlanKey;
  /** How many generations the plan allows */
  generationLimit: number;
  /** Whether the user has an active paid subscription */
  isSubscribed: boolean;
  /** Whether data is still loading */
  loading: boolean;
  /** Generation usage info */
  usage: { used: number; limit: number; canGenerate: boolean } | null;
  /** Refresh the subscription data */
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    canGenerate: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      const [planData, usageData] = await Promise.all([
        getUserPlan(),
        canUserGenerate(),
      ]);
      setPlan(planData);
      setUsage({
        used: usageData.used,
        limit: usageData.limit,
        canGenerate: usageData.canGenerate,
      });
    } catch (err) {
      console.error("Error loading subscription:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    plan,
    planName: plan?.planName || "Free",
    planKey: plan?.planKey || "free",
    generationLimit: plan?.generationLimit || 5,
    isSubscribed: plan?.isActive || false,
    loading,
    usage,
    refresh,
  };
}
