import * as XLSX from "xlsx";
import type { ImporterPackage } from "@/lib/types";

export function generatePackageExcel(pkg: ImporterPackage): XLSX.WorkBook {
  const snapshot = pkg.dataSnapshot;
  const wb = XLSX.utils.book_new();

  const overviewSheet = XLSX.utils.aoa_to_sheet([
    ["CBAM Embedded Emissions Data Package"],
    [],
    ["Producer", snapshot.producerName],
    ["Tax ID", snapshot.producerTaxId ?? ""],
    ["Contact", snapshot.producerContactEmail],
    ["Prepared for", `${pkg.buyerName} (${pkg.buyerCountry})`],
    ["Reporting period", `${pkg.periodYear}${pkg.periodQuarter ? ` Q${pkg.periodQuarter}` : " (Annual)"}`],
    ["Version", pkg.version],
    ["Generated", new Date(snapshot.generatedAt).toISOString()],
    ...(pkg.watermarked ? [["Note", "Generated on KarbonRota Starter plan — upgrade to remove this note."]] : []),
  ]);
  XLSX.utils.book_append_sheet(wb, overviewSheet, "Overview");

  const installSheet = XLSX.utils.json_to_sheet(
    snapshot.installations.map((i) => ({
      Name: i.name,
      City: i.city,
      Country: i.country,
      "UN/LOCODE": i.unLocode ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, installSheet, "Installations");

  const productSheet = XLSX.utils.json_to_sheet(
    snapshot.products.map((p) => ({
      Product: p.name,
      "CN Code": p.cnCode,
      "CBAM Goods Category": p.cbamGoodsCategory,
      Installation: p.installationName,
      "Direct emissions (tCO2e/t)": Number(p.directEmissionsTco2PerTon.toFixed(4)),
      "Indirect emissions (tCO2e/t)": Number(p.indirectEmissionsTco2PerTon.toFixed(4)),
      "Reporting scope": p.reportedScope,
      "Reported SEE (tCO2e/t)": Number(p.reportedSpecificEmissions.toFixed(4)),
      "Calculation method": p.calculationMethod,
      "Data quality": p.dataQualityNote,
    }))
  );
  XLSX.utils.book_append_sheet(wb, productSheet, "Products");

  const precursorRows = snapshot.products.flatMap((p) =>
    p.precursorSources.map((s) => ({
      Product: p.name,
      Precursor: s.name,
      "Source type": s.sourceType,
      "Specific emission (tCO2e/t)": Number(s.specificEmissionTco2PerTon.toFixed(4)),
    }))
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(precursorRows.length ? precursorRows : [{ Product: "-", Precursor: "-" }]),
    "Precursors"
  );

  const carbonRows = snapshot.carbonPrices.map((c) => ({
    Installation: c.installationName,
    Scheme: c.scheme,
    Period: c.periodLabel,
    "Amount paid": c.amountPaid,
    Currency: c.currency,
    "Tonnes covered": c.tonnesCovered,
    "Effective price/ton": Number(c.effectivePricePerTon.toFixed(2)),
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(carbonRows.length ? carbonRows : [{ Installation: "-", Scheme: "No carbon price records" }]),
    "Carbon Price Paid"
  );

  const docRows = snapshot.documents.map((d) => ({ "File name": d.fileName, "Related to": d.relatedTo }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(docRows.length ? docRows : [{ "File name": "-", "Related to": "No documents" }]),
    "Documents"
  );

  if (snapshot.approvedExplanations && snapshot.approvedExplanations.length > 0) {
    const expRows = snapshot.approvedExplanations.map((e) => ({ Product: e.productName, Note: e.summaryTr }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expRows), "Period-over-Period Notes");
  }

  return wb;
}
