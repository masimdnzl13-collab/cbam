import { createIyzicoProvider } from "@/lib/billing/providers/iyzico";
import type { BillingProvider } from "@/lib/billing/adapter";

// Sağlayıcı değişimi TEK bu satırdan yapılır (ör. Paddle veya LemonSqueezy'e geçiş).
export const billingProvider: BillingProvider = createIyzicoProvider();
