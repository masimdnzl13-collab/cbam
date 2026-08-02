import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/client";
import { DocumentCheckResultSchema, type DocumentCheckResult } from "@/lib/ai/schemas";

export async function checkDocumentReliability(params: {
  base64: string;
  mediaType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  expectedDocTypeDescription: string;
  expectedPeriodYear: number;
  expectedAmount?: number;
  expectedUnit?: string;
}): Promise<DocumentCheckResult> {
  const client = getClaudeClient();

  const contentBlock =
    params.mediaType === "application/pdf"
      ? ({
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: params.base64 },
        })
      : ({
          type: "image" as const,
          source: { type: "base64" as const, media_type: params.mediaType, data: params.base64 },
        });

  const prompt = `Bu belge şu bağlamda sisteme yüklendi: "${params.expectedDocTypeDescription}".
Raporlama dönemi: ${params.expectedPeriodYear}.
${params.expectedAmount != null ? `Sistemde kayıtlı beklenen miktar: ${params.expectedAmount} ${params.expectedUnit ?? ""}.` : "Beklenen miktar bilgisi girilmedi."}

Belgeyi incele ve şunları kontrol et:
1. Belge türü, beklenen türle uyuşuyor mu (ör. elektrik faturası denip irsaliye yüklenmiş olabilir mi)?
2. Belgedeki tarih aralığı, raporlama dönemine (${params.expectedPeriodYear}) düşüyor mu?
3. Belgedeki miktar, beklenen miktarla tutarlı mı (varsa)?
4. Birimler doğru mu (ör. MWh yazması gerekirken kWh yazıyor olabilir)?

Bulgularını Türkçe, teknik olmayan bir dille özetle. Emin olamadığın durumlarda "sari" durumunu kullan,
ciddi bir uyuşmazlık varsa "kirmizi", her şey tutarlıysa "yesil" kullan.`;

  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    output_config: {
      effort: "low",
      format: zodOutputFormat(DocumentCheckResultSchema),
    },
    messages: [{ role: "user", content: [contentBlock, { type: "text", text: prompt }] }],
  });

  if (!response.parsed_output) {
    throw new Error("Belge kontrolü yapılamadı");
  }
  return response.parsed_output;
}
