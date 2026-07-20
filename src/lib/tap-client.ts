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
export async function openTapCheckout(_priceId: string, _userId: string, _email: string, _currency: string = "USD"): Promise<void> {
  const isAr = document.documentElement.lang === "ar";
  toast.error(
    isAr
      ? "عمليات الاشتراك والدفع متوقفة مؤقتاً في الوقت الحالي. يرجى التواصل معنا للمزيد من التفاصيل."
      : "Subscriptions and payments are temporarily paused. Please contact support for assistance.",
    { duration: 5000 }
  );
  throw new Error("Payments are temporarily paused.");
}
