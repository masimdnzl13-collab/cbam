import Link from "next/link";
import { Flame } from "lucide-react";

export const metadata = {
  title: "KVKK Aydınlatma Metni — KarbonRota",
};

export default function KvkkPage() {
  return (
    <main className="min-h-screen bg-base">
      <header className="border-b border-base-border">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
          <Flame className="h-5 w-5 text-accent" />
          <Link href="/" className="font-heading text-base font-semibold tracking-wide">
            KarbonRota
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-ink-muted space-y-4">
        <h1 className="font-heading text-2xl font-semibold text-ink mb-4">
          6698 Sayılı KVKK Kapsamında Aydınlatma Metni
        </h1>
        <p>
          KarbonRota (&quot;Platform&quot;), Vian tarafından işletilmektedir. Bu metin, 6698 sayılı
          Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca veri sorumlusu sıfatıyla
          işlediğimiz kişisel verilere ilişkin sizi bilgilendirmek amacıyla hazırlanmıştır.
        </p>
        <h2 className="font-heading text-lg font-semibold text-ink pt-2">Toplanan veriler</h2>
        <p>
          Bekleme listesi kaydı, ücretsiz hesaplayıcı kullanımı ve hesap oluşturma sırasında
          ad-soyad, e-posta adresi, firma unvanı, sektör bilgisi ve ihracat verileri gibi bilgiler
          toplanabilir.
        </p>
        <h2 className="font-heading text-lg font-semibold text-ink pt-2">İşleme amaçları</h2>
        <p>
          Toplanan veriler; hizmetin sunulması, SKDM/CBAM mevzuatına ilişkin bilgilendirme
          yapılması, ürün geliştirme ve yasal yükümlülüklerin yerine getirilmesi amacıyla
          işlenir.
        </p>
        <h2 className="font-heading text-lg font-semibold text-ink pt-2">Haklarınız</h2>
        <p>
          KVKK&apos;nın 11. maddesi kapsamında kişisel verilerinizin işlenip işlenmediğini öğrenme,
          işlenmişse buna ilişkin bilgi talep etme, düzeltilmesini veya silinmesini isteme
          haklarına sahipsiniz. Taleplerinizi{" "}
          <a href="mailto:merhaba@karbonrota.com" className="text-steel">
            merhaba@karbonrota.com
          </a>{" "}
          adresine iletebilirsiniz.
        </p>
      </div>
    </main>
  );
}
