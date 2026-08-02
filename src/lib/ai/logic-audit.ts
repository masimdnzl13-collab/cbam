import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/client";
import { LogicAuditResultSchema, type LogicAuditResult } from "@/lib/ai/schemas";
import type { ActivityData, ProductionRouteType, Sector } from "@/lib/types";

export async function auditPeriodConsistency(params: {
  sector: Sector;
  productionRouteType: ProductionRouteType;
  activityData: Pick<ActivityData, "fuels" | "electricity" | "inputMaterials" | "outputQuantityTon">;
}): Promise<LogicAuditResult> {
  const client = getClaudeClient();
  const { sector, productionRouteType, activityData } = params;

  const electricityMwh = (activityData.electricity?.totalConsumptionKwh ?? 0) / 1000;
  const energyIntensity = activityData.outputQuantityTon > 0 ? electricityMwh / activityData.outputQuantityTon : 0;
  const totalInputMass = activityData.inputMaterials.reduce((sum, m) => sum + m.quantity, 0);
  const massBalanceRatio = activityData.outputQuantityTon > 0 ? totalInputMass / activityData.outputQuantityTon : 0;

  const prompt = `Bir Türk sanayi tesisinin dönem bazlı faaliyet verisini tutarlılık açısından incele.
Bu, dönem kilitlenmeden önce çalışan bir ön kontrol taramasıdır.

Sektör: ${sector}
Üretim rotası: ${productionRouteType}
Üretim çıktısı: ${activityData.outputQuantityTon} ton
Elektrik tüketimi: ${electricityMwh.toFixed(1)} MWh (kaynak: ${activityData.electricity?.sourceType ?? "girilmedi"})
Ton başına elektrik yoğunluğu: ${energyIntensity.toFixed(3)} MWh/ton
Girdi hammaddeleri: ${activityData.inputMaterials.map((m) => `${m.materialName}: ${m.quantity} ${m.unit}`).join(", ") || "girilmedi"}
Girdi/çıktı kütle oranı: ${massBalanceRatio.toFixed(2)}
Yakıt karması: ${activityData.fuels.map((f) => `${f.fuelType}: ${f.quantity} ${f.unit}`).join(", ") || "girilmedi"}

Kontrol et:
1. Üretim miktarı ile enerji tüketimi oranı bu sektör/rota için makul mü, yoksa imkânsız derecede
   düşük/yüksek mi (ör. bir ton çelik için gerçekçi olmayan az elektrik)?
2. Girdi hammadde ile çıktı ürün kütle dengesi mantıklı mı?
3. Beyan edilen yakıt karması, seçilen üretim rotasıyla çelişiyor mu (ör. EAF rotasında yüksek fırın
   tipik yakıtlarının baskın olması gibi)?

Her bulguyu ayrı bir madde olarak, düz Türkçe ve neden şüpheli olduğunu açıklayarak raporla.
Hiçbir sorun yoksa boş bir findings dizisi döndür ve bunu genel değerlendirmede belirt.`;

  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 1536,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(LogicAuditResultSchema),
    },
    messages: [{ role: "user", content: prompt }],
  });

  if (!response.parsed_output) {
    throw new Error("Mantık denetimi yapılamadı");
  }
  return response.parsed_output;
}
