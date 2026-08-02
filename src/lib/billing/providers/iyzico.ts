import crypto from "crypto";
import type { BillingProvider, BillingWebhookEvent, CheckoutParams, CheckoutResult } from "@/lib/billing/adapter";
import { PLAN_CONFIG } from "@/lib/billing/plans-config";

const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";
const IYZICO_API_KEY = process.env.IYZICO_API_KEY || "";
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";

// iyzico IYZWSv2 imzalama şeması: HMAC-SHA256(secretKey, randomKey + uriPath + requestBody)
function buildAuthHeader(uriPath: string, body: string): string {
  const randomKey = `${Date.now()}${crypto.randomBytes(8).toString("hex")}`;
  const dataToSign = randomKey + uriPath + body;
  const signature = crypto.createHmac("sha256", IYZICO_SECRET_KEY).update(dataToSign).digest("hex");
  const authorizationParams = `apiKey:${IYZICO_API_KEY}&randomKey:${randomKey}&signature:${signature}`;
  const base64Params = Buffer.from(authorizationParams).toString("base64");
  return `IYZWSv2 ${base64Params}`;
}

interface IyzicoSubscriptionInitializeResponse {
  status: string;
  data?: { checkoutFormContent?: string; paymentPageUrl?: string; token?: string };
  errorMessage?: string;
}

export function createIyzicoProvider(): BillingProvider {
  return {
    name: "iyzico",

    async createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
      const plan = PLAN_CONFIG[params.planId];
      const price = params.interval === "yearly" ? plan.yearlyPriceEur : plan.monthlyPriceEur;
      if (price == null) {
        throw new Error("Bu plan için kendiliğinden ödeme akışı yok — satış ekibiyle iletişime geçilmeli.");
      }

      const uriPath = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
      const requestBody = {
        locale: "tr",
        conversationId: `${params.organizationId}-${Date.now()}`,
        price: price.toFixed(2),
        paidPrice: price.toFixed(2),
        currency: "EUR",
        basketId: `karbonrota-${params.planId}-${params.interval}`,
        paymentGroup: "SUBSCRIPTION",
        callbackUrl: params.successUrl,
        buyer: {
          id: params.organizationId,
          name: params.organizationName,
          email: params.customerEmail,
        },
        basketItems: [
          {
            id: `${params.planId}-${params.interval}`,
            name: `KarbonRota ${plan.label} (${params.interval === "yearly" ? "Yıllık" : "Aylık"})`,
            category1: "SaaS",
            itemType: "VIRTUAL",
            price: price.toFixed(2),
          },
        ],
      };
      const body = JSON.stringify(requestBody);

      const res = await fetch(`${IYZICO_BASE_URL}${uriPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: buildAuthHeader(uriPath, body),
          "x-iyzi-rnd": crypto.randomBytes(8).toString("hex"),
        },
        body,
      });

      const data = (await res.json()) as IyzicoSubscriptionInitializeResponse;
      if (data.status !== "success" || !data.data?.paymentPageUrl) {
        throw new Error(data.errorMessage || "iyzico ödeme oturumu başlatılamadı");
      }
      return { redirectUrl: data.data.paymentPageUrl };
    },

    verifyWebhookSignature(rawBody: string, headers: Headers): boolean {
      const signature = headers.get("x-iyz-signature-v3") || headers.get("x-iyz-signature");
      if (!signature || !IYZICO_SECRET_KEY) return false;
      const expected = crypto.createHmac("sha256", IYZICO_SECRET_KEY).update(rawBody).digest("hex");
      try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      } catch {
        return false;
      }
    },

    parseWebhookEvent(rawBody: string): BillingWebhookEvent | null {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return null;
      }

      const organizationId = String(payload.conversationId ?? "").split("-")[0];
      const providerSubscriptionId = String(payload.subscriptionReferenceCode ?? payload.paymentId ?? "");
      const status = String(payload.status ?? payload.eventType ?? "");

      if (!organizationId) return null;

      if (status.includes("SUBSCRIPTION_CREATED") || status === "success") {
        const [, planId, interval] = String(payload.basketId ?? "").split("-");
        return {
          type: "subscription.created",
          organizationId,
          planId: (planId as CheckoutParams["planId"]) ?? "baslangic",
          interval: (interval as CheckoutParams["interval"]) ?? "monthly",
          providerSubscriptionId,
        };
      }
      if (status.includes("SUBSCRIPTION_CANCELED")) {
        return { type: "subscription.canceled", organizationId, providerSubscriptionId };
      }
      if (status.includes("PAYMENT_FAILED") || status === "failure") {
        return { type: "payment.failed", organizationId, providerSubscriptionId };
      }
      if (status.includes("PAYMENT_SUCCESS")) {
        return { type: "payment.succeeded", organizationId, providerSubscriptionId };
      }
      return null;
    },

    async cancelSubscription(providerSubscriptionId: string): Promise<void> {
      const uriPath = `/v2/subscription/subscriptions/${providerSubscriptionId}/cancel`;
      await fetch(`${IYZICO_BASE_URL}${uriPath}`, {
        method: "POST",
        headers: { Authorization: buildAuthHeader(uriPath, "") },
      });
    },
  };
}
