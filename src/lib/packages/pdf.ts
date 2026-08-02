import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ImporterPackage } from "@/lib/types";

const SCOPE_LABEL_EN: Record<string, string> = {
  direct_only: "Direct emissions only",
  direct_and_indirect: "Direct + indirect emissions",
};

export function generatePackagePdf(pkg: ImporterPackage): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const snapshot = pkg.dataSnapshot;
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CBAM Embedded Emissions Data Package", margin, y);
  y += 22;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Reporting period: ${pkg.periodYear}${pkg.periodQuarter ? ` Q${pkg.periodQuarter}` : " (Annual)"}`,
    margin,
    y
  );
  y += 14;
  doc.text(`Prepared for: ${pkg.buyerName} (${pkg.buyerCountry})`, margin, y);
  y += 14;
  doc.text(`Generated: ${new Date(snapshot.generatedAt).toISOString().slice(0, 10)} — Version ${pkg.version}`, margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. Producer & Installation Identification", margin, y);
  y += 16;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    head: [["Producer", "Tax ID", "Contact"]],
    body: [[snapshot.producerName, snapshot.producerTaxId ?? "-", snapshot.producerContactEmail]],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 16;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    head: [["Installation", "City", "Country", "UN/LOCODE"]],
    body: snapshot.installations.map((i) => [i.name, i.city, i.country, i.unLocode ?? "-"]),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. Products & Embedded Emissions", margin, y);
  y += 16;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    head: [[
      "Product",
      "CN Code",
      "Installation",
      "Direct (tCO2e/t)",
      "Indirect (tCO2e/t)",
      "Reporting scope",
      "Reported SEE (tCO2e/t)",
    ]],
    body: snapshot.products.map((p) => [
      p.name,
      p.cnCode,
      p.installationName,
      p.directEmissionsTco2PerTon.toFixed(3),
      p.indirectEmissionsTco2PerTon.toFixed(3),
      SCOPE_LABEL_EN[p.reportedScope] ?? p.reportedScope,
      p.reportedSpecificEmissions.toFixed(3),
    ]),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  if (y > 650) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("3. Calculation Method & Data Quality", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const methodText = snapshot.products[0]?.calculationMethod ?? "";
  const qualityText = snapshot.products[0]?.dataQualityNote ?? "";
  const methodLines = doc.splitTextToSize(methodText, 515);
  doc.text(methodLines, margin, y);
  y += methodLines.length * 12 + 8;
  const qualityLines = doc.splitTextToSize(qualityText, 515);
  doc.text(qualityLines, margin, y);
  y += qualityLines.length * 12 + 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("4. Precursor Material Emission Sources", margin, y);
  y += 16;

  const precursorRows = snapshot.products.flatMap((p) =>
    p.precursorSources.map((s) => [p.name, s.name, s.sourceType, s.specificEmissionTco2PerTon.toFixed(3)])
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    head: [["Product", "Precursor", "Source type", "Specific emission (tCO2e/t)"]],
    body: precursorRows.length ? precursorRows : [["-", "-", "-", "-"]],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  if (y > 650) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("5. Carbon Price Paid (Third Country)", margin, y);
  y += 16;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    head: [["Installation", "Scheme", "Period", "Amount paid", "Tonnes covered", "Effective price/ton"]],
    body: snapshot.carbonPrices.length
      ? snapshot.carbonPrices.map((c) => [
          c.installationName,
          c.scheme,
          c.periodLabel,
          `${c.amountPaid.toFixed(2)} ${c.currency}`,
          c.tonnesCovered.toFixed(2),
          `${c.effectivePricePerTon.toFixed(2)} ${c.currency}`,
        ])
      : [["-", "No carbon price records for this period", "-", "-", "-", "-"]],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  if (y > 650) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("6. Supporting Documents", margin, y);
  y += 16;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    head: [["File name", "Related to"]],
    body: snapshot.documents.length
      ? snapshot.documents.map((d) => [d.fileName, d.relatedTo])
      : [["-", "No documents attached"]],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  if (snapshot.approvedExplanations && snapshot.approvedExplanations.length > 0) {
    if (y > 650) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("7. Period-over-Period Notes", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const exp of snapshot.approvedExplanations) {
      doc.setFont("helvetica", "bold");
      doc.text(exp.productName, margin, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(exp.summaryTr, 515);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 10;
    }
  }

  if (pkg.watermarked) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(60);
      doc.setTextColor(255, 107, 53);
      doc.text("KARBONROTA — STARTER PLAN", 297, 420, { angle: 40, align: "center" });
      doc.restoreGraphicsState();
    }
  }

  return doc;
}
