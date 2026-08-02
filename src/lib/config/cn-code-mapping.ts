// GTİP/CN kod ön eki -> CBAM emtia kategorisi eşlemesi.
// Mevzuat (AB) 2023/956 Ek I'de tanımlanan CN kodlarının bu ürün için temsili
// bir alt kümesidir; tam liste 8 haneye kadar iner ve periyodik güncellenir.
// Bu tablo TEK güncelleme noktasıdır — mevzuat değiştiğinde yalnızca burası düzenlenir.

import type { CbamGoodsCategory, Sector } from "@/lib/types";

export interface CnCodeMappingEntry {
  prefix: string; // 4 haneli GTİP ön eki
  description: string;
  category: CbamGoodsCategory;
  sector: Sector;
  inScope: true;
}

export const CN_CODE_MAPPINGS: CnCodeMappingEntry[] = [
  // Demir-çelik (Ek I, 72-73. fasıllar temsili alt kümesi)
  { prefix: "7206", description: "Demir ve alaşımsız çelik - külçe/ham şekiller", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7208", description: "Sıcak haddelenmiş yassı ürünler", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7209", description: "Soğuk haddelenmiş yassı ürünler", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7210", description: "Kaplanmış yassı ürünler", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7213", description: "Sıcak haddelenmiş filmaşin", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7214", description: "Diğer demir/çelik çubuklar", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7216", description: "Profiller", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7217", description: "Demir/çelik tel", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7219", description: "Paslanmaz çelik yassı ürünler", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7225", description: "Diğer alaşımlı çelik yassı ürünler", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7304", description: "Demir/çelik dikişsiz boru", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7305", description: "Diğer demir/çelik boru (>406,4mm)", category: "demir_celik", sector: "demir_celik", inScope: true },
  { prefix: "7306", description: "Diğer demir/çelik boru ve profil", category: "demir_celik", sector: "demir_celik", inScope: true },

  // Alüminyum (Ek I, 76. fasıl temsili alt kümesi)
  { prefix: "7601", description: "İşlenmemiş alüminyum", category: "aluminyum", sector: "aluminyum", inScope: true },
  { prefix: "7603", description: "Alüminyum toz ve pul", category: "aluminyum", sector: "aluminyum", inScope: true },
  { prefix: "7604", description: "Alüminyum çubuk ve profil", category: "aluminyum", sector: "aluminyum", inScope: true },
  { prefix: "7605", description: "Alüminyum tel", category: "aluminyum", sector: "aluminyum", inScope: true },
  { prefix: "7606", description: "Alüminyum levha ve şerit", category: "aluminyum", sector: "aluminyum", inScope: true },
  { prefix: "7607", description: "Alüminyum folyo", category: "aluminyum", sector: "aluminyum", inScope: true },
  { prefix: "7608", description: "Alüminyum boru", category: "aluminyum", sector: "aluminyum", inScope: true },
  { prefix: "7609", description: "Alüminyum boru bağlantı parçaları", category: "aluminyum", sector: "aluminyum", inScope: true },

  // Çimento (Ek I, 2523)
  { prefix: "2523", description: "Çimento (klinker dahil)", category: "cimento", sector: "cimento", inScope: true },

  // Gübre (Ek I, temsili alt küme)
  { prefix: "2808", description: "Nitrik asit; sülfonitrik asitler", category: "gubre", sector: "gubre", inScope: true },
  { prefix: "2814", description: "Amonyak (susuz veya sulu çözelti)", category: "gubre", sector: "gubre", inScope: true },
  { prefix: "3102", description: "Azotlu mineral/kimyasal gübreler", category: "gubre", sector: "gubre", inScope: true },
  { prefix: "3105", description: "Karma gübreler (azot/fosfor/potasyum)", category: "gubre", sector: "gubre", inScope: true },

  // Hidrojen
  { prefix: "2804", description: "Hidrojen", category: "hidrojen", sector: "hidrojen", inScope: true },
];

export interface CnLookupResult {
  matched: boolean;
  entry?: CnCodeMappingEntry;
}

export function lookupCnCode(code: string): CnLookupResult {
  const clean = code.replace(/\s|\./g, "");
  const prefix4 = clean.slice(0, 4);
  const entry = CN_CODE_MAPPINGS.find((m) => m.prefix === prefix4);
  return { matched: !!entry, entry };
}

export const OUT_OF_SCOPE_CATEGORY: CbamGoodsCategory = "kapsam_disi";
