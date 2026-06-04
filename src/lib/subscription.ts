import { supabase } from "./supabase";

// Polar product IDs → plan details
export const PLAN_CONFIG = {
  free: {
    id: "free",
    name: "Free",
    limit: 5,
    price: 0,
  },
  basic: {
    id: "36412367-4e41-448c-823b-8471eca5fbfd",
    name: "Basic",
    limit: 30,
    price: 9,
  },
  pro: {
    id: "a7af3302-389e-42cd-b735-6686e56ba17f",
    name: "Pro",
    limit: 100,
    price: 19,
  },
  business: {
    id: "881ab6e7-4959-45c2-8a6f-f594ed1d557f",
    name: "Business",
    limit: 300,
    price: 49,
  },
} as const;

export type PlanKey = keyof typeof PLAN_CONFIG;

export interface Subscription {
  id: string;
  user_id: string;
  polar_subscription_id: string;
  polar_customer_id: string | null;
  product_id: string;
  product_name: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  amount: number | null;
  currency: string | null;
  recurring_interval: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPlan {
  planName: string;
  planKey: PlanKey;
  generationLimit: number;
  isActive: boolean;
  subscription: Subscription | null;
}

/**
 * Get the user's active subscription from the database.
 */
export async function getUserSubscription(): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }

  return data;
}

/**
 * Determine the user's current plan based on their subscription.
 */
export async function getUserPlan(): Promise<UserPlan> {
  const subscription = await getUserSubscription();

  if (!subscription) {
    return {
      planName: "Free",
      planKey: "free",
      generationLimit: PLAN_CONFIG.free.limit,
      isActive: false,
      subscription: null,
    };
  }

  // Match product_id to our plan config
  const planEntry = Object.entries(PLAN_CONFIG).find(
    ([, config]) => config.id === subscription.product_id
  );

  const planKey = (planEntry?.[0] || "free") as PlanKey;
  const config = planEntry?.[1] || PLAN_CONFIG.free;

  return {
    planName: config.name,
    planKey,
    generationLimit: config.limit,
    isActive: ["active", "trialing"].includes(subscription.status),
    subscription,
  };
}

/**
 * Check if the user can generate (is within their plan's limit).
 */
export async function canUserGenerate(): Promise<{
  canGenerate: boolean;
  used: number;
  limit: number;
  planName: string;
  planKey: PlanKey;
}> {
  const [plan, profileResult] = await Promise.all([
    getUserPlan(),
    supabase.from("profiles").select("generation_count").single(),
  ]);

  const used = profileResult.data?.generation_count ?? 0;

  return {
    canGenerate: used < plan.generationLimit,
    used,
    limit: plan.generationLimit,
    planName: plan.planName,
    planKey: plan.planKey,
  };
}

export function getCheckoutUrl(
  productId: string,
  userEmail?: string,
  successUrl?: string
): string {
  const baseUrl = `https://buy.polar.sh/polar_cl_jU5KHrOgUQIJ2wUOAyvkUZFNzWM0gI2rKBCoR1RaqNW`;

  const params = new URLSearchParams();

  if (productId) {
    params.set("product_id", productId);
  }

  if (userEmail) {
    params.set("customer_email", userEmail);
  }

  if (successUrl) {
    params.set("success_url", successUrl);
  }

  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

/**
 * Get the plan key from a product name string.
 */
export function getPlanKeyFromName(name: string | null): PlanKey {
  if (!name) return "free";
  const lower = name.toLowerCase();
  if (lower.includes("business")) return "business";
  if (lower.includes("pro")) return "pro";
  if (lower.includes("basic")) return "basic";
  return "free";
}

/**
 * Get the next upgrade plan from the current plan.
 */
export function getNextUpgrade(currentPlan: PlanKey): PlanKey | null {
  const order: PlanKey[] = ["free", "basic", "pro", "business"];
  const idx = order.indexOf(currentPlan);
  if (idx < order.length - 1) return order[idx + 1];
  return null;
}
