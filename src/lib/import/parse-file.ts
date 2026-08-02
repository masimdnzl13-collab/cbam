import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
}

const SHEET_NAME_MAP: Record<string, string> = {
  "yakıt tüketimi": "yakit",
  "yakit tuketimi": "yakit",
  elektrik: "elektrik",
  hammadde: "hammadde",
  "üretim miktarı": "uretim",
  "uretim miktari": "uretim",
};

function normSheetName(name: string): string {
  return name.trim().toLocaleLowerCase("tr-TR").replace(/ı/g, "i");
}

export async function parseExcelFile(file: File): Promise<Partial<Record<"yakit" | "elektrik" | "hammadde" | "uretim", ParsedSheet>>> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const result: Partial<Record<"yakit" | "elektrik" | "hammadde" | "uretim", ParsedSheet>> = {};

  for (const sheetName of wb.SheetNames) {
    const key = SHEET_NAME_MAP[normSheetName(sheetName)];
    if (!key) continue;
    const sheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
    if (json.length === 0) continue;
    const headers = Object.keys(json[0]);
    // Şablondaki "Örn:" ile başlayan gösterim satırını atla
    const rows = json.filter((r) => !String(Object.values(r)[0] ?? "").toLocaleLowerCase("tr-TR").startsWith("örn"));
    result[key as keyof typeof result] = { headers, rows };
  }
  return result;
}

export function parseCsvFile(file: File): Promise<ParsedSheet> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        resolve({ headers, rows: results.data });
      },
      error: (err: Error) => reject(err),
    });
  });
}
