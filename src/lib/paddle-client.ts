/**
 * Client-side Paddle.js initializer.
 * Uses a lazy singleton pattern — the Paddle script is loaded once and cached.
 * 
 * Uses VITE_ prefixed env vars (safe for browser).
 * NEVER import server-only secrets (PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET) here.
 */
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddlePromise: Promise<Paddle | undefined> | null = null;

/**
 * Lazily initialize Paddle.js (client-side). Returns a cached promise so the
 * script is only loaded once per page session.
 */
export function getPaddle(): Promise<Paddle | undefined> {
  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      environment:
        import.meta.env.VITE_PADDLE_ENV === "sandbox" ? "sandbox" : "production",
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN!,
      eventCallback: (event) => {
        // Surfaces the real reason behind Paddle's generic "Something went wrong"
        if (import.meta.env.DEV) {
          console.log("[Paddle event]", event.name, JSON.stringify(event, null, 2));
        }
      },
    });
  }
  return paddlePromise;
}

/**
 * Open Paddle checkout overlay for a subscription upgrade.
 * 
 * @param priceId - Paddle Price ID (e.g. "pri_01xxx")
 * @param userId - Your internal user ID (passed via customData for webhook linking)
 * @param email - User's email for pre-filling checkout
 */
export async function openCheckout(priceId: string, userId: string, email: string): Promise<void> {
  const paddle = await getPaddle();
  if (!paddle) throw new Error("Paddle failed to load. Please try again.");

  paddle.Checkout.open({
    items: [
      {
        priceId,
        quantity: 1,
      },
    ],
    // customData is delivered back via webhooks — use it to map payment to your user
    customData: {
      userId,
      type: "subscription_upgrade",
    },
    customer: email ? { email } : undefined,
    settings: {
      displayMode: "overlay",
      theme: "dark",
      successUrl: `${window.location.origin}/dashboard/settings?payment=success`,
    },
  });
}
