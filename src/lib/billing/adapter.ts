// Sağlayıcı-bağımsız faturalama arayüzü. Yeni bir ödeme sağlayıcısına
// (Paddle, LemonSqueezy, ...) geçmek için yalnızca bu arayüzü uygulayan yeni
// bir dosya yazıp src/lib/billing/index.ts içindeki tek satırı değiştirmek
// yeterlidir — başka hiçbir dosyaya dokunulmaz.

import type { BillingInterval, SubscriptionPlan } from "@/lib/types";

export interface CheckoutParams {
  organizationId: string;
  organizationName: string;
  customerEmail: string;
  planId: Exclude<SubscriptionPlan, "deneme">;
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  redirectUrl: string;
}

export type BillingWebhookEvent =
  | { type: "subscription.created"; organizationId: string; planId: Exclude<SubscriptionPlan, "deneme">; interval: BillingInterval; providerSubscriptionId: string }
  | { type: "subscription.canceled"; organizationId: string; providerSubscriptionId: string }
  | { type: "payment.succeeded"; organizationId: string; providerSubscriptionId: string }
  | { type: "payment.failed"; organizationId: string; providerSubscriptionId: string };

export interface BillingProvider {
  readonly name: string;
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult>;
  verifyWebhookSignature(rawBody: string, headers: Headers): boolean;
  parseWebhookEvent(rawBody: string): BillingWebhookEvent | null;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
}
