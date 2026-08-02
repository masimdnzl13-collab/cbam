import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ActivityData, AuditLogEntry, DocumentRecord, EmissionCalculation, Installation, PeriodExplanation, ProductionProcess } from "@/lib/types";
import { formatDateTR } from "@/lib/utils";

export function generateVerifierPackagePdf(params: {
  installation: Installation;
  periodYear: number;
  periodQuarter?: number | null;
  processes: ProductionProcess[];
  activityDataByProcess: Record<string, ActivityData | undefined>;
  calculationByProcess: Record<string, EmissionCalculation | undefined>;
  documents: DocumentRecord[];
  auditEntries: AuditLogEntry[];
  explanationByProcess?: Record<string, PeriodExplanation | undefined>;
}): jsPDF {
  const { installation, periodYear, periodQuarter, processes, activityDataByProcess, calculationByProcess, documents, auditEntries, explanationByProcess = {} } = params;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Doğrulayıcı Hazırlık Paketi", margin, y);
  y += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${installation.name} — Dönem: ${periodYear}${periodQuarter ? ` Ç${periodQuarter}` : " (Yıllık)"}`,
    margin,
    y
  );
  y += 14;
  doc.text(`Oluşturulma: ${new Date().toISOString().slice(0, 10)}`, margin, y);
  y += 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. Faaliyet Verileri", margin, y);
  y += 14;

  const activityRows: (string | number)[][] = [];
  for (const proc of processes) {
    const ad = activityDataByProcess[proc.id];
    if (!ad) continue;
    for (const f of ad.fuels) {
      activityRows.push([proc.name, "Yakıt", f.fuelType, `${f.quantity} ${f.unit}`, f.dataQuality]);
    }
    if (ad.electricity) {
      activityRows.push([
        proc.name,
        "Elektrik",
        ad.electricity.sourceType,
        `${ad.electricity.totalConsumptionKwh} kWh`,
        ad.electricity.dataQuality,
      ]);
    }
    for (const m of ad.inputMaterials) {
      activityRows.push([proc.name, "Girdi malzemesi", m.materialName, `${m.quantity} ${m.unit}`, m.dataQuality]);
    }
    activityRows.push([proc.name, "Üretim çıktısı", "-", `${ad.outputQuantityTon} ton`, "-"]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    head: [["Proses", "Kategori", "Detay", "Miktar", "Veri kalitesi"]],
    body: activityRows.length ? activityRows : [["-", "-", "-", "-", "-"]],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  if (y > 650) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. Hesaplama Adımları ve Kullanılan Faktörler", margin, y);
  y += 14;

  const calcRows = processes
    .map((proc) => {
      const calc = calculationByProcess[proc.id];
      if (!calc) return null;
      return [
        proc.name,
        calc.directEmissionsTco2.toFixed(2),
        calc.indirectEmissionsTco2.toFixed(2),
        calc.precursorEmissionsTco2.toFixed(2),
        calc.totalEmbeddedEmissionsTco2.toFixed(2),
        calc.specificEmbeddedEmissions.toFixed(3),
        `v${calc.version}`,
      ];
    })
    .filter((r): r is string[] => r !== null);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    head: [["Proses", "Doğrudan (tCO2e)", "Dolaylı (tCO2e)", "Öncü (tCO2e)", "Toplam (tCO2e)", "SEE (tCO2e/t)", "Sürüm"]],
    body: calcRows.length ? calcRows : [["-", "-", "-", "-", "-", "-", "-"]],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  if (y > 650) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("3. Ekli Belgeler", margin, y);
  y += 14;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    head: [["#", "Dosya adı", "Belge tipi"]],
    body: documents.length
      ? documents.map((d, i) => [String(i + 1), d.fileName, d.docType ?? d.relatedCollection])
      : [["-", "Belge eklenmedi", "-"]],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  if (y > 650) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("4. Denetim İzi", margin, y);
  y += 14;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    head: [["Tarih", "Kullanıcı", "Aksiyon", "Kayıt türü"]],
    body: auditEntries.length
      ? auditEntries.map((e) => [formatDateTR(e.createdAt), e.userEmail, e.action, e.collection])
      : [["-", "Kayıt yok", "-", "-"]],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  const explanations = Object.values(explanationByProcess).filter((e): e is PeriodExplanation => !!e?.approved);
  if (explanations.length > 0) {
    if (y > 650) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("5. Dönemler Arası Anomali Açıklamaları", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const exp of explanations) {
      const lines = doc.splitTextToSize(exp.finalSummaryTr, 515);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 10;
    }
  }

  return doc;
}
