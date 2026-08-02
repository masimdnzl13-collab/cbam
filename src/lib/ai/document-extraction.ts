import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/client";
import { DocumentExtractionSchema, type DocumentExtraction } from "@/lib/ai/schemas";

const PROMPT = `Bu bir Türk sanayi tesisinin faaliyet verisi belgesidir (elektrik faturası,
yakıt irsaliyesi, tedarikçi beyanı veya karbon ödeme belgesi olabilir).
Belgeden şu bilgileri çıkar: belge türü, dönem başlangıç/bitiş tarihi, ana miktar
ve birimi (kWh, MWh, ton, kg, m3, litre vb.), tedarikçi/fatura kesen firma adı.
Emin olmadığın alanları null bırak ve confidence alanını buna göre düşük işaretle.
Bu bir Türkiye belgesi olduğu için tarih formatları GG.AA.YYYY olabilir — ISO
(YYYY-MM-DD) formatına çevir.`;

export async function extractDocumentData(params: {
  base64: string;
  mediaType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
}): Promise<DocumentExtraction> {
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

  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    output_config: {
      effort: "low",
      format: zodOutputFormat(DocumentExtractionSchema),
    },
    messages: [
      {
        role: "user",
        content: [contentBlock, { type: "text", text: PROMPT }],
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Belge verisi çıkarılamadı");
  }
  return response.parsed_output;
}
