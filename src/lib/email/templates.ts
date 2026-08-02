function wrapper(bodyHtml: string): string {
  return `
  <div style="background:#16181d;padding:32px;font-family:'IBM Plex Sans',Arial,sans-serif;color:#e8eaed;">
    <div style="max-width:520px;margin:0 auto;background:#1f232b;border:1px solid #333a46;border-radius:6px;padding:28px;">
      <p style="color:#ff6b35;font-weight:600;font-size:16px;margin:0 0 20px;">KarbonRota</p>
      ${bodyHtml}
      <p style="color:#6b7280;font-size:11px;margin-top:28px;">KarbonRota &middot; Vian</p>
    </div>
  </div>`;
}

export function supplierInviteEmail(params: {
  organizationName: string;
  supplierName: string;
  precursorName: string;
  portalUrl: string;
}): { subject: string; html: string } {
  const { organizationName, supplierName, precursorName, portalUrl } = params;
  return {
    subject: `${organizationName} sizden kısa bir karbon verisi bilgisi istiyor`,
    html: wrapper(`
      <h1 style="font-size:18px;color:#e8eaed;">Merhaba ${supplierName || ""},</h1>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        <strong style="color:#e8eaed;">${organizationName}</strong>, AB'nin Sınırda Karbon Düzenleme
        Mekanizması (SKDM/CBAM) kapsamında size sattığınız <strong style="color:#e8eaed;">${precursorName}</strong>
        için gömülü emisyon bilgisine ihtiyaç duyuyor.
      </p>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        Aşağıdaki bağlantı üzerinden, kayıt olmadan, yaklaşık 5 dakikada bu bilgiyi paylaşabilirsiniz.
        Veriyi paylaşamıyorsanız da bunu belirtebilirsiniz — sorun değil.
      </p>
      <p style="margin-top:20px;"><a href="${portalUrl}" style="background:#ff6b35;color:#16181d;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;">Bilgiyi Paylaş</a></p>
    `),
  };
}

export function supplierReminderEmail(params: {
  organizationName: string;
  supplierName: string;
  precursorName: string;
  portalUrl: string;
  daysAgo: number;
}): { subject: string; html: string } {
  const { organizationName, supplierName, precursorName, portalUrl, daysAgo } = params;
  return {
    subject: `Hatırlatma: ${organizationName} için karbon verisi bekleniyor`,
    html: wrapper(`
      <h1 style="font-size:18px;color:#e8eaed;">Nazik bir hatırlatma</h1>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        Merhaba ${supplierName || ""}, ${daysAgo} gün önce <strong style="color:#e8eaed;">${organizationName}</strong>
        sizden <strong style="color:#e8eaed;">${precursorName}</strong> için gömülü emisyon bilgisi istemişti.
        Hâlâ vaktiniz olmadıysa, aşağıdaki bağlantı hâlâ açık — birkaç dakikanızı alacaktır.
      </p>
      <p style="margin-top:20px;"><a href="${portalUrl}" style="background:#ff6b35;color:#16181d;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;">Bilgiyi Paylaş</a></p>
    `),
  };
}

export function welcomeEmail1(): { subject: string; html: string } {
  return {
    subject: "KarbonRota'ya hoş geldin — ilk adım: tesisini kur",
    html: wrapper(`
      <h1 style="font-size:18px;color:#e8eaed;">Hoş geldin!</h1>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        KarbonRota'da CBAM/SKDM hazırlığına başlamak için ilk adım tesisini tanımlamak.
        Tesis adı, şehir ve üretim rotanı gir — proses detaylarını sonra tamamlayabilirsin.
      </p>
      <p style="margin-top:20px;"><a href="https://karbonrota.com/dashboard/tesisler" style="background:#ff6b35;color:#16181d;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;">Tesisini Kur</a></p>
    `),
  };
}

export function welcomeEmail2(): { subject: string; html: string } {
  return {
    subject: "İkinci adım: ilk dönem faaliyet verini gir",
    html: wrapper(`
      <h1 style="font-size:18px;color:#e8eaed;">Sıra veri girişinde</h1>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        Yakıt, elektrik ve girdi malzemesi verilerini gir — hesaplama motoru bu veriden
        ürün başına gömülü emisyonunu (SEE) çıkaracak.
      </p>
      <p style="margin-top:20px;"><a href="https://karbonrota.com/dashboard/faaliyet-verisi" style="background:#ff6b35;color:#16181d;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;">Faaliyet Verisi Gir</a></p>
    `),
  };
}

export function welcomeEmail3(): { subject: string; html: string } {
  return {
    subject: "Üçüncü adım: ilk veri paketini üret",
    html: wrapper(`
      <h1 style="font-size:18px;color:#e8eaed;">İlk paketini oluştur</h1>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        Hesaplamaların hazır olduğunda, AB müşterine gönderilecek veri paketini birkaç
        tıkla derleyebilir, PDF/Excel indirebilir ve paylaşım linki oluşturabilirsin.
      </p>
      <p style="margin-top:20px;"><a href="https://karbonrota.com/dashboard/paketler" style="background:#ff6b35;color:#16181d;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;">Paket Oluştur</a></p>
    `),
  };
}

export function activityDataReminderEmail(periodYear: number): { subject: string; html: string } {
  return {
    subject: `${periodYear} dönemi faaliyet verisi eksik`,
    html: wrapper(`
      <h1 style="font-size:18px;color:#e8eaed;">Dönem sonu yaklaşıyor</h1>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        ${periodYear} dönemi için bazı tesis/proses kombinasyonlarında faaliyet verisi eksik.
        Hesaplama ve paket üretimi için verinin tamamlanması gerekiyor.
      </p>
      <p style="margin-top:20px;"><a href="https://karbonrota.com/dashboard/faaliyet-verisi" style="background:#ff6b35;color:#16181d;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;">Veriyi Tamamla</a></p>
    `),
  };
}

export function importerRequestDeadlineEmail(customerName: string, daysLeft: number): { subject: string; html: string } {
  return {
    subject: `${customerName} talebinin termini ${daysLeft} gün kaldı`,
    html: wrapper(`
      <h1 style="font-size:18px;color:#e8eaed;">Termin yaklaşıyor</h1>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        <strong style="color:#e8eaed;">${customerName}</strong> firmasından gelen veri talebinin
        termini <strong style="color:#f2b134;">${daysLeft} gün</strong> sonra doluyor.
      </p>
      <p style="margin-top:20px;"><a href="https://karbonrota.com/dashboard" style="background:#ff6b35;color:#16181d;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;">Panele Git</a></p>
    `),
  };
}

export function regulatoryCountdownEmail(eventLabel: string, daysLeft: number): { subject: string; html: string } {
  return {
    subject: `${daysLeft} gün: ${eventLabel}`,
    html: wrapper(`
      <h1 style="font-size:18px;color:#e8eaed;">Kritik tarih yaklaşıyor</h1>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        <strong style="color:#e8eaed;">${eventLabel}</strong> tarihine <strong style="color:#ff6b35;">${daysLeft} gün</strong> kaldı.
      </p>
    `),
  };
}

export function weeklySummaryEmail(params: {
  organizationName: string;
  completenessPercent: number;
  completenessDelta: number;
  openActionsCount: number;
}): { subject: string; html: string } {
  const { organizationName, completenessPercent, completenessDelta, openActionsCount } = params;
  const deltaText = completenessDelta === 0 ? "değişmedi" : completenessDelta > 0 ? `+${completenessDelta} arttı` : `${completenessDelta} azaldı`;
  return {
    subject: `Haftalık özet — veri tamlığın %${completenessPercent}`,
    html: wrapper(`
      <h1 style="font-size:18px;color:#e8eaed;">${organizationName} haftalık özet</h1>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        Genel veri tamlığın şu anda <strong style="color:#e8eaed;">%${completenessPercent}</strong>
        (geçen haftaya göre ${deltaText}). Açık aksiyon sayısı: <strong style="color:#e8eaed;">${openActionsCount}</strong>.
      </p>
      <p style="margin-top:20px;"><a href="https://karbonrota.com/dashboard" style="background:#ff6b35;color:#16181d;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;">Panele Git</a></p>
    `),
  };
}

export function trialEndingEmail(): { subject: string; html: string } {
  return {
    subject: "Deneme süren sona erdi",
    html: wrapper(`
      <h1 style="font-size:18px;color:#e8eaed;">Deneme süren doldu</h1>
      <p style="color:#9aa3b2;font-size:14px;line-height:1.6;">
        14 günlük ücretsiz deneme süren sona erdi. Profesyonel özelliklere devam etmek için
        bir plan seçmen gerekiyor.
      </p>
      <p style="margin-top:20px;"><a href="https://karbonrota.com/dashboard/faturalama" style="background:#ff6b35;color:#16181d;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;">Plan Seç</a></p>
    `),
  };
}
