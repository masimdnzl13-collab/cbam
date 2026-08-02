import * as XLSX from "xlsx";
import { FUEL_FACTORS } from "@/lib/config/emission-factors";

// P8 revizyonu: Excel içe aktarma için indirilebilir, Türkçe başlıklı şablonlar.

export function generateActivityDataTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const fuelSheet = XLSX.utils.aoa_to_sheet([
    ["Proses Adı", "Yakıt Türü", "Miktar", "Birim", "Veri Kalitesi"],
    [
      "Örn: Elektrik Ark Ocağı",
      Object.values(FUEL_FACTORS)[0].label,
      "1250",
      Object.values(FUEL_FACTORS)[0].unit,
      "Ölçülmüş",
    ],
  ]);
  XLSX.utils.book_append_sheet(wb, fuelSheet, "Yakıt Tüketimi");

  const electricitySheet = XLSX.utils.aoa_to_sheet([
    ["Proses Adı", "Toplam Tüketim", "Birim (kWh veya MWh)", "Kaynak Tipi", "Veri Kalitesi"],
    ["Örn: Elektrik Ark Ocağı", "45000", "kWh", "Şebeke", "Ölçülmüş"],
  ]);
  XLSX.utils.book_append_sheet(wb, electricitySheet, "Elektrik");

  const materialSheet = XLSX.utils.aoa_to_sheet([
    ["Proses Adı", "Malzeme Adı", "Miktar", "Birim", "Veri Kalitesi"],
    ["Örn: Klinker Üretimi", "Kireçtaşı", "800", "ton", "Ölçülmüş"],
  ]);
  XLSX.utils.book_append_sheet(wb, materialSheet, "Hammadde");

  const outputSheet = XLSX.utils.aoa_to_sheet([
    ["Proses Adı", "Üretim Miktarı", "Birim (ton veya kg)"],
    ["Örn: Elektrik Ark Ocağı", "1000", "ton"],
  ]);
  XLSX.utils.book_append_sheet(wb, outputSheet, "Üretim Miktarı");

  return wb;
}
