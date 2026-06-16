/**
 * Client-side Tap Payments redirect trigger.
 * Requests a secure payment checkout session from the backend,
 * then redirects the user to Tap's secure checkout page.
 */
import { toast } from "sonner";

/**
 * Open Tap checkout redirect.
 * 
 * @param priceId - Plan ID (e.g. "basic", "pro", "business")
 * @param userId - Your internal user ID (passed to metadata for webhook linking)
 * @param email - User's email
 */
export async function openTapCheckout(priceId: string, userId: string, email: string): Promise<void> {
  const toastId = "tap-checkout-toast";
  toast.loading(
    document.documentElement.lang === "ar" 
      ? "جاري توجيهك لبوابة الدفع..." 
      : "Redirecting you to the secure checkout...", 
    { id: toastId }
  );

  try {
    const response = await fetch("/api/create-tap-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId,
        userId,
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.redirectUrl) {
      throw new Error(data.error || "Failed to initiate checkout");
    }

    toast.dismiss(toastId);
    // Redirect user to Tap's secure hosted payment page
    window.location.href = data.redirectUrl;
  } catch (err: any) {
    console.error("Tap checkout error:", err);
    toast.error(
      document.documentElement.lang === "ar"
        ? "فشل بدء عملية الدفع. يرجى المحاولة مرة أخرى."
        : `Checkout initialization failed: ${err.message || "Please try again."}`,
      { id: toastId }
    );
    throw err;
  }
}
