import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/client";
import { AnomalyExplanationSchema, type AnomalyExplanationDraft } from "@/lib/ai/schemas";
import type { EmissionCalculation } from "@/lib/types";

type CalcDeltaFields = Pick<
  EmissionCalculation,
  "directEmissionsTco2" | "indirectEmissionsTco2" | "specificEmbeddedEmissions" | "outputQuantityTon"
>;

export async function draftAnomalyExplanation(params: {
  productName: string;
  processName: string;
  current: CalcDeltaFields;
  previous: CalcDeltaFields;
}): Promise<AnomalyExplanationDraft> {
  const client = getClaudeClient();
  const { productName, processName, current, previous } = params;

  const seeDelta = previous.specificEmbeddedEmissions > 0
    ? ((current.specificEmbeddedEmissions - previous.specificEmbeddedEmissions) / previous.specificEmbeddedEmissions) * 100
    : 0;
  const outputDelta = previous.outputQuantityTon > 0
    ? ((current.outputQuantityTon - previous.outputQuantityTon) / previous.outputQuantityTon) * 100
    : 0;
  const electricityDelta = previous.indirectEmissionsTco2 > 0
    ? ((current.indirectEmissionsTco2 - previous.indirectEmissionsTco2) / previous.indirectEmissionsTco2) * 100
    : 0;
  const directDelta = previous.directEmissionsTco2 > 0
    ? ((current.directEmissionsTco2 - previous.directEmissionsTco2) / previous.directEmissionsTco2) * 100
    : 0;

  const prompt = `${processName} prosesinde üretilen "${productName}" ürünü için önceki dönem ile
şimdiki dönem arasındaki değişimi insan diliyle açıkla.

Ton başına gömülü emisyon (SEE) değişimi: %${seeDelta.toFixed(1)}
Üretim miktarı değişimi: %${outputDelta.toFixed(1)}
Dolaylı (elektrik) emisyon değişimi: %${electricityDelta.toFixed(1)}
Doğrudan emisyon değişimi: %${directDelta.toFixed(1)}
Önceki dönem SEE: ${previous.specificEmbeddedEmissions.toFixed(3)} tCO2e/ton
Şimdiki dönem SEE: ${current.specificEmbeddedEmissions.toFixed(3)} tCO2e/ton

Bu sayılar arasındaki ilişkiyi kullanarak nedensel, anlaşılır bir açıklama yaz — örneğin "elektrik
tüketimi %X arttı çünkü üretim %Y arttı, birim yoğunluk aslında düştü" gibi. Kullanıcı bu taslağı
düzenleyip onaylayacak, bu yüzden düz ve doğrudan yaz, abartılı ifadelerden kaçın.`;

  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(AnomalyExplanationSchema),
    },
    messages: [{ role: "user", content: prompt }],
  });

  if (!response.parsed_output) {
    throw new Error("Anomali açıklaması oluşturulamadı");
  }
  return response.parsed_output;
}
