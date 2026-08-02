// Sektöre göre hazır üretim prosesi şablonları. Kullanıcılar karbon muhasebesi
// uzmanı olmadığı için her şablon, sistem sınırını düz Türkçe açıklayan bir
// metinle gelir. Kullanıcı şablonu temel alıp adını/sınır açıklamasını
// düzenleyebilir (bkz. src/lib/types.ts ProductionProcess.templateKey).

import type { Sector } from "@/lib/types";

export interface ProcessTemplate {
  key: string;
  name: string;
  systemBoundaryDescription: string;
  isFinishingProcess: boolean;
  processEmissionFactorKey?: string;
}

export const PROCESS_TEMPLATES: Record<Sector, ProcessTemplate[]> = {
  demir_celik: [
    {
      key: "eaf",
      name: "Elektrik Ark Ocağı (EAF)",
      systemBoundaryDescription:
        "Hurda ve/veya doğrudan indirgenmiş demirin elektrik ark ocağında eritilmesi. " +
        "Sınıra dahil olanlar: elektrik tüketimi, karbon elektrotlar, kireç/kireçtaşı gibi " +
        "flux malzemeleri, ocakta kullanılan yardımcı yakıtlar (doğalgaz, oksijen enjeksiyonu " +
        "için kömür tozu). Haddeleme ve yüzey işlemleri bu prosesin dışındadır.",
      isFinishingProcess: false,
    },
    {
      key: "bf_bof",
      name: "Yüksek Fırın - Bazik Oksijen Konvertörü (BF-BOF)",
      systemBoundaryDescription:
        "Demir cevheri ve kokun yüksek fırında indirgenmesi ve elde edilen sıvı demirin " +
        "bazik oksijen konvertöründe çeliğe dönüştürülmesi. Sınıra dahil olanlar: kok/kömür " +
        "tüketimi, sinter/pelet üretimi, fırın gazı geri kazanımı, oksijen üretimi için elektrik. " +
        "Haddeleme ve son işlem hatları bu prosesin dışındadır.",
      isFinishingProcess: false,
    },
    {
      key: "haddehane",
      name: "Haddehane (bitirme)",
      systemBoundaryDescription:
        "Sıcak/soğuk haddeleme ile şekillendirme. Bu bir bitirme (finishing) prosesi olarak " +
        "kabul edilir ve CBAM gömülü emisyon hesabına dahil edilmez; yalnızca bilgi amaçlı " +
        "kaydedilebilir.",
      isFinishingProcess: true,
    },
  ],
  aluminyum: [
    {
      key: "aluminyum_birincil",
      name: "Birincil Elektroliz (Hall-Héroult)",
      systemBoundaryDescription:
        "Alüminanın elektroliz yoluyla metalik alüminyuma indirgenmesi. Sınıra dahil olanlar: " +
        "elektroliz için yüksek miktarda elektrik tüketimi, anot tüketimi (PFC emisyonları dahil), " +
        "anot pişirme fırını yakıt tüketimi. Döküm sonrası şekillendirme bu prosesin dışındadır.",
      isFinishingProcess: false,
    },
    {
      key: "aluminyum_ikincil",
      name: "İkincil Ergitme (Hurda Bazlı)",
      systemBoundaryDescription:
        "Alüminyum hurdasının ergitme fırınlarında yeniden işlenmesi. Sınıra dahil olanlar: " +
        "ergitme fırını yakıt/elektrik tüketimi, flux ve tuz kullanımı. Birincil elektrolize göre " +
        "belirgin şekilde daha düşük emisyon yoğunluğuna sahiptir.",
      isFinishingProcess: false,
    },
    {
      key: "aluminyum_bitirme",
      name: "Ekstrüzyon / Haddeleme (bitirme)",
      systemBoundaryDescription:
        "Külçenin profil, levha veya folyoya şekillendirilmesi. Bu bir bitirme prosesidir ve " +
        "CBAM gömülü emisyon hesabına dahil edilmez.",
      isFinishingProcess: true,
    },
  ],
  cimento: [
    {
      key: "cimento_entegre",
      name: "Klinker Üretimi (Entegre Tesis)",
      systemBoundaryDescription:
        "Kireçtaşının döner fırında pişirilerek klinkere dönüştürülmesi. Sınıra dahil olanlar: " +
        "kalsinasyon proses emisyonu (kireçtaşındaki karbonun serbestleşmesi), fırın yakıt " +
        "tüketimi (kömür, petrokok, alternatif yakıtlar), elektrik tüketimi. Bu, çimento " +
        "üretiminde emisyonun en yoğun olduğu adımdır.",
      isFinishingProcess: false,
      processEmissionFactorKey: "cimento_klinker_kalsinasyon",
    },
    {
      key: "cimento_ogutme",
      name: "Öğütme ve Karıştırma",
      systemBoundaryDescription:
        "Klinkerin alçıtaşı ve katkı malzemeleriyle öğütülerek çimentoya dönüştürülmesi. " +
        "Sınıra dahil olanlar: öğütme için elektrik tüketimi. Klinker üretiminden gelen " +
        "gömülü emisyon, öncü ürün olarak bu prosese aktarılır.",
      isFinishingProcess: false,
    },
  ],
  gubre: [
    {
      key: "gubre_amonyak",
      name: "Amonyak Üretimi",
      systemBoundaryDescription:
        "Doğalgazın buhar reformasyonu yoluyla hidrojen üretimi ve azotla sentezlenerek " +
        "amonyağa dönüştürülmesi. Sınıra dahil olanlar: hammadde ve yakıt olarak doğalgaz " +
        "tüketimi, proses buharı için elektrik. CBAM kapsamında en yüksek emisyon yoğunluğuna " +
        "sahip gübre prosesidir.",
      isFinishingProcess: false,
      processEmissionFactorKey: "gubre_amonyak_reforming",
    },
    {
      key: "gubre_nitrik_asit",
      name: "Nitrik Asit Üretimi",
      systemBoundaryDescription:
        "Amonyağın katalitik oksidasyonu ile nitrik asit üretimi. Sınıra dahil olanlar: " +
        "proses kaynaklı N2O emisyonu (güçlü bir sera gazı, CO2 eşdeğerine çevrilir), " +
        "elektrik ve yardımcı yakıt tüketimi.",
      isFinishingProcess: false,
      processEmissionFactorKey: "gubre_nitrik_asit_n2o",
    },
    {
      key: "gubre_ure",
      name: "Üre Üretimi",
      systemBoundaryDescription:
        "Amonyak ve karbondioksitin reaksiyonuyla üre sentezi. Sınıra dahil olanlar: " +
        "amonyak öncü ürün emisyonu, proses buharı ve elektrik tüketimi.",
      isFinishingProcess: false,
    },
  ],
  hidrojen: [
    {
      key: "hidrojen_smr",
      name: "Buhar Reformasyonu (SMR)",
      systemBoundaryDescription:
        "Doğalgazın buharla reforme edilerek hidrojene dönüştürülmesi. Sınıra dahil olanlar: " +
        "hammadde ve yakıt olarak doğalgaz tüketimi, proses buharı için elektrik.",
      isFinishingProcess: false,
    },
    {
      key: "hidrojen_elektroliz",
      name: "Elektroliz",
      systemBoundaryDescription:
        "Suyun elektroliz yoluyla hidrojen ve oksijene ayrıştırılması. Sınıra dahil olanlar: " +
        "elektroliz için elektrik tüketimi (kaynağına göre dolaylı emisyon büyük ölçüde değişir).",
      isFinishingProcess: false,
    },
  ],
};

export const FINISHING_PROCESS_WARNING =
  "Bu bir bitirme (finishing) prosesi olarak işaretlendi. Boyama, kaplama, kesme gibi " +
  "bitirme işlemleri CBAM gömülü emisyon hesabına dahil edilmez. Yine de kayıt amacıyla " +
  "eklemeye devam edebilirsiniz.";

// Tesis düzeyinde kaba üretim rotası sınıflandırması (bitirme prosesleri hariç).
export const PRODUCTION_ROUTE_LABELS: Record<string, string> = {
  eaf: "Elektrik Ark Ocağı (EAF)",
  bf_bof: "Yüksek Fırın - Bazik Oksijen Konvertörü",
  aluminyum_birincil: "Birincil Elektroliz",
  aluminyum_ikincil: "İkincil Ergitme (Hurda Bazlı)",
  cimento_entegre: "Klinker Üretimi (Entegre Tesis)",
  cimento_ogutme: "Öğütme ve Karıştırma",
  gubre_amonyak: "Amonyak Üretimi",
  gubre_nitrik_asit: "Nitrik Asit Üretimi",
  gubre_ure: "Üre Üretimi",
  hidrojen_smr: "Buhar Reformasyonu (SMR)",
  hidrojen_elektroliz: "Elektroliz",
  diger: "Diğer / henüz belirtilmedi",
};

export const ROUTE_TYPES_BY_SECTOR: Record<Sector, string[]> = {
  demir_celik: ["eaf", "bf_bof"],
  aluminyum: ["aluminyum_birincil", "aluminyum_ikincil"],
  cimento: ["cimento_entegre", "cimento_ogutme"],
  gubre: ["gubre_amonyak", "gubre_nitrik_asit", "gubre_ure"],
  hidrojen: ["hidrojen_smr", "hidrojen_elektroliz"],
};
