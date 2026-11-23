# AYVEX — Geliştirici Rehberi

Bu belge, projeyi hiç bilmeyen birinin uygulamayı anlaması, çalıştırması, değiştirmesi ve yayınlaması için gereken her şeyi anlatır. Baştan sona bir kez okumak yaklaşık 20 dakika sürer; sonra başvuru kaynağı olarak kullanılabilir.

> Güncel tutun: Mimariyi, veri modelini ya da yayın sürecini değiştiren her PR bu belgeyi de güncellemeli.

---

## İçindekiler

1. [Uygulama nedir?](#1-uygulama-nedir)
2. [Hızlı başlangıç](#2-hızlı-başlangıç)
3. [Mimari genel bakış](#3-mimari-genel-bakış)
4. [Dosyalar](#4-dosyalar)
5. [Veri modeli ve veri nerede saklanır?](#5-veri-modeli-ve-veri-nerede-saklanır)
6. [Giriş ve bulut senkronizasyonu](#6-giriş-ve-bulut-senkronizasyonu)
7. [dashboard.js nasıl çalışır?](#7-dashboardjs-nasıl-çalışır)
8. [Özellik haritası: hangi kod nerede?](#8-özellik-haritası-hangi-kod-nerede)
9. [Görünüm: CSS, tema, mobil](#9-görünüm-css-tema-mobil)
10. [Service worker, kurulum, bildirimler](#10-service-worker-kurulum-bildirimler)
11. [Güvenlik ve Firestore kuralları](#11-güvenlik-ve-firestore-kuralları)
12. [Testler ve CI](#12-testler-ve-ci)
13. [Yayın süreci](#13-yayın-süreci)
14. [Tarifler: sık yapılan değişiklikler](#14-tarifler-sık-yapılan-değişiklikler)
15. [Tuzaklar: bunlara dikkat](#15-tuzaklar-bunlara-dikkat)
16. [Bilinen sınırlamalar ve olası sonraki adımlar](#16-bilinen-sınırlamalar-ve-olası-sonraki-adımlar)

---

## 1. Uygulama nedir?

**AYVEX**, öğrenciler ve çalışanlar için Türkçe bir web planlama uygulamasıdır. Telefona "uygulama" olarak da kurulabilir (PWA).

- **İki mod:** *Öğrenci* (ders programı, sınavlar, ödevler, not ortalaması, YKS, kariyer) ve *Çalışan* (projeler, sprint panosu, toplantılar, iş planı). Mod, kayıt sırasında seçilir; menüler ve bazı kartlar moda göre değişir.
- **Ortak:** Bugün ekranı, görevler (son tarih, tekrar, alt görev, Kanban), takvim, Pomodoro, haftalık hedefler, bildirimler, seri (🔥), aylık rapor, hızlı ekle (+), koyu mod.
- **Hesap:** Google ya da e-posta/şifre ile giriş (Firebase Authentication). Veriler Firebase Firestore'da saklanır ve cihazlar arasında eşitlenir.
- **İsim notu:** "Yapay Zeka Destekli" ifadesi, uygulamanın yapay zekâ yardımıyla *geliştirildiğini* anlatır. Uygulamada yapay zekâ özelliği yoktur.

| | |
|---|---|
| Canlı adres | https://ayvex-7697a.firebaseapp.com |
| Yönlendirilen eski adresler | `ayvex-7697a.web.app`, `husamtech25.github.io/Yapay-Zeka-Destekli-Planlama-Uygulamas-/` |
| Repo | https://github.com/husamtech25/Yapay-Zeka-Destekli-Planlama-Uygulamas- |
| Firebase projesi | `ayvex-7697a` (Spark / ücretsiz plan) |
| Dil | Arayüz, kod içi isimler ve yorumlar Türkçe |

---

## 2. Hızlı başlangıç

**Gerekenler:** Git, Node.js 20+ (sadece testler ve yayın için; uygulamanın kendisi derleme gerektirmez), bir tarayıcı.

```bash
git clone https://github.com/husamtech25/Yapay-Zeka-Destekli-Planlama-Uygulamas-.git
cd Yapay-Zeka-Destekli-Planlama-Uygulamas-

# Yerelde çalıştır (bulut.js bir ES modülü olduğu için file:// ile açılmaz, sunucu gerekir)
npx serve .                 # ya da: python -m http.server 8000

# Testler
npm install
npm test                    # 46 test, ~3 sn

# Firebase'e yayın (önce bir kez: npx firebase-tools login)
npx firebase-tools deploy --only hosting --project ayvex-7697a
```

**Yerelde giriş yapmadan deneme:** Yerel (cihaza özel) hesaplar kapalıdır (`YEREL_GIRIS_AKTIF = false`). Arayüzü Google hesabı kullanmadan denemek için tarayıcı konsolunda:

```js
db.users["deneme"] = { ad: "Deneme", tur: "student", data: null }; db.aktif = "deneme"; basla();
// İş modu için: S.mode = "work"; modUygula(); ciz();
// Sayfa değiştirmek için: goView("tasks")  // home, tasks, ac, cal, ders, ca, proje, sprint, toplanti
```

Bu profil sadece o tarayıcının `localStorage`'ında durur, buluta gitmez. Sayfa yenilenince oturum kapanır; komutu yeniden çalıştırmak gerekir.

---

## 3. Mimari genel bakış

Çerçeve (framework) ya da derleme adımı yoktur: düz HTML + CSS + JavaScript.

```
index.html ──► dashboard.css      (tüm stiller)
     │
     ├──► dashboard.js (klasik betik, defer)   Uygulamanın tamamı: veri, çizim, olaylar
     │         ▲  window.AYVEX (geri çağrılar)
     │         │
     └──► bulut.js (ES modülü)                 Firebase köprüsü: giriş, Firestore okuma/yazma, paylaşım
               │  window.AYVEX_BULUT (işlevler)
               ▼
          Firebase Auth + Firestore (CDN'den: www.gstatic.com/firebasejs/12.6.0)

sw.js        Service worker: çevrimdışı açılma, bildirime tıklama
manifest.webmanifest   Telefona / masaüstüne kurulum
```

**Temel döngü:** Tüm uygulama durumu tek bir nesnede, `S`'de durur. Kullanıcı bir şey değiştirince kod `S`'yi günceller, sonra:

1. `kaydet()` çağrılır: 150 ms sonra `localStorage`'a yazar, 1,5 sn sonra buluta gönderir (ikisi de debounce'lu).
2. `ciz()` çağrılır: Ekranı `S`'den baştan çizer (her bölümün `...Ciz()` işlevini çağırır).

Sanal DOM yoktur; çizim, şablon metinleriyle `innerHTML` üzerinden yapılır. Bu yüzden kullanıcıdan gelen her metin `esc()` ile kaçışlanmalıdır (bkz. [Güvenlik](#11-güvenlik-ve-firestore-kuralları)).

---

## 4. Dosyalar

| Dosya | Satır | Görevi |
|---|---|---|
| `index.html` | ~1.580 | Tüm sayfalar (`.view`), pencereler (`<dialog>`), giriş ekranı, SVG simge tanımları. `<head>`'de iki küçük satır içi betik: eski adreslerden yönlendirme ve temanın çizimden önce uygulanması. |
| `dashboard.js` | ~4.500 | Uygulamanın tüm mantığı. Bölümleri için bkz. [7](#7-dashboardjs-nasıl-çalışır) ve [8](#8-özellik-haritası-hangi-kod-nerede). |
| `dashboard.css` | ~1.850 | Stiller. Renk değişkenleri en üstte; sonradan eklenen özelliklerin stilleri dosyanın sonuna bloklar halinde eklendi. |
| `bulut.js` | ~315 | Firebase Auth + Firestore. Firestore kütüphanesi tembel yüklenir (bkz. [6](#6-giriş-ve-bulut-senkronizasyonu)). |
| `sw.js` | ~70 | Service worker. |
| `manifest.webmanifest`, `assets/` | | PWA bilgileri, simgeler (`icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon`), logo (`ayvex-logo.webp`). |
| `firestore.rules` | ~60 | Firestore güvenlik kuralları. **Repoya yazmak yetmez, konsola yayınlanmalı** (bkz. [11](#11-güvenlik-ve-firestore-kuralları)). |
| `firebase.json`, `.firebaserc` | | Firebase Hosting ayarları (hangi dosyalar yüklenir, önbellek başlıkları), proje kimliği. |
| `tests/` | | `sozdizimi.test.js` (söz dizimi + HTML), `islevler.test.js` (uygulama işlevleri), `yardimci.js` (uygulamayı jsdom'da açar). |
| `.github/workflows/` | | `testler.yml` (her PR ve main'de testler), `firebase-yayin.yml` (main'de test + Firebase'e yayın; anahtar eklenmediği için yayın adımı şu an atlanır). |
| `package.json` | | Sadece test bağımlılığı (`jsdom`). Uygulama bunu kullanmaz. |
| `logo.png` | | Eski, kullanılmayan logo ("PlanPulse"). Yayına yüklenmez; silinebilir. |

---

## 5. Veri modeli ve veri nerede saklanır?

### 5.1 Üç saklama yeri

| Yer | Anahtar | İçerik |
|---|---|---|
| `localStorage` | `planla-v3` | `db = { users: { <hesapId>: { ad, email, saglayici, tur, bulut, data: S } }, aktif: <hesapId> }`. Bulut hesaplarının kimliği `g:` ile başlar (`BULUT_ONEK`). Çevrimdışı çalışmayı ve anında açılışı sağlar. |
| Firestore | `users/{uid}` | `{ veri: <S'nin JSON metni>, ad, tur, surum: 1, guncelleme }`. `S`, alan alan değil **tek bir JSON metni** olarak saklanır (Firestore'un iç içe dizi kısıtlarına takılmamak için; sınır ~900 KB). |
| Firestore | `paylasimlar/{id}` | Salt okunur proje paylaşımları: `{ sahip, tur: "proje", baslik, veri, guncelleme }`. |
| `localStorage` (cihaza özel tercihler) | `ayvex-tema`, `ayvex-sistem-bildirim` | Tema ve cihaz bildirimi tercihi. Buluta gitmez. |

### 5.2 `S` (bir kullanıcının tüm verisi)

`yeniVeri(mod, ad)` boş bir `S` üretir. Önemli alanlar:

| Alan | Tip | Açıklama |
|---|---|---|
| `mode` | `"student"` \| `"work"` | Hesap modu. |
| `name`, `avatar` | | Görünen ad, avatar sırası. |
| `tasks` | dizi | Görevler: `{ id, t, done, doing, p: "low"\|"mid"\|"high", son: "YYYY-MM-DD", tekrar: ""\|"gunluk"\|"haftalik"\|"aylik", tekrarGun, sonraki, alt: [{id,t,done}], odakDk, pomo, proje, zaman, bitis }` |
| `events` | nesne | Takvim etkinlikleri, **güne göre**: `{ "YYYY-MM-DD": [{ id, t, time, type }] }` |
| `dersler` | dizi | Haftalık ders programı: `{ id, ad, kod, hoca, sinif, gun: "0".."6", renk, bas, bit, notlar }` |
| `sinavlar`, `odevler`, `yksDenemeleri` | dizi | Akademik kayıtlar (tarih alanı zorunlu). |
| `notHesap`, `vizeOrani` | | Not ortalaması hesaplayıcı satırları ve vize ağırlığı (%). |
| `yksKonu`, `yksAlan` | nesne, metin | YKS konu durumları: `{ "tyt\|Matematik\|Kümeler": "calisiyor"\|"bitti"\|"tekrar" }`; AYT alanı `say`/`ea`/`soz`. |
| `projeler`, `sprint`, `sprintIsleri`, `sprintGecmis`, `toplantilar`, `planItems` | | İş modu verileri. Projelerde `paylasimId` varsa proje paylaşılmıştır. |
| `hedefler`, `courses`, `deadlines`, `jobs`, `skills`, `notes`, `links`, `basvurular`, `kurslar`, `kariyerHedefler` | dizi | Diğer kartların verileri (bazıları eski sürümlerden kalma). |
| `pomo` | nesne | Pomodoro ayarları + `stats: { "YYYY-MM-DD": { sayi, dk } }` + `bind` (bağlı görev/ders). |
| `notifications` | dizi | Uygulama içi bildirimler (en fazla 50). |

### 5.3 `veriOnar()`: veriye asla güvenme

`veriOnar(v, tur, ad)` her yüklemede (yerelden, buluttan, yedekten) çalışır ve bozuk veriyi onarır: eksik dizileri oluşturur, geçersiz tarihleri ve kayıtları atar, metin alanlarını metne çevirir, kimlikleri `guvenliId()` ile kontrol eder. **Yeni bir alan eklediğinizde onu burada da doğrulayın** (bkz. [Tarif 14.1](#141-bir-kayda-yeni-alan-eklemek)). `DIZI` sabiti, dizi olması gereken üst düzey alanların listesidir.

---

## 6. Giriş ve bulut senkronizasyonu

### 6.1 Giriş yolları

- **Google:** `bulut.js > girisYap()` önce `signInWithPopup` dener. Açılır pencere engellenirse (bazı telefon tarayıcıları, kurulu uygulama) `signInWithRedirect`'e geçer. Bu yalnızca site `ayvex-7697a.firebaseapp.com`'dayken çalışır, çünkü giriş işleyicisi (`/__/auth/handler`) siteyle aynı alan adında olmalı ve Google'ın izinli dönüş adresi bu alan adıdır. `web.app` adresinin buraya yönlendirilmesinin sebebi budur.
- **E-posta/şifre:** Kayıt sonrası e-posta doğrulaması zorunludur; doğrulanmadan uygulamaya ve Firestore'a erişilemez.
- **İlk giriş:** Bulutta veri yoksa `aktarmaSec()` mod seçtirir (ya da varsa yerel hesabı aktarır).
- **Bekleme göstergesi:** `googleBekliyor(true/false)` düğmede "Giriş yapılıyor…" gösterir.

### 6.2 Senkronizasyon

- **Yazma:** `kaydet()` → `bulutKaydetPlanla()` (1,5 sn bekler) → `bulutKaydetHemen()` → `AYVEX_BULUT.kaydet()`. Değişiklik yoksa gönderilmez (`sonBulutVerisi` karşılaştırması). Sayfa kapanırken (`pagehide`) hemen gönderilir.
- **Okuma:** `dinle(uid)` Firestore'daki belgeyi canlı dinler; başka cihazdan gelen değişiklik `uzakVeriyiUygula()` ile uygulanır. **Çakışma kuralı:** Bu cihazda henüz gönderilmemiş bir değişiklik varsa uzaktan gelen yok sayılır; son yazan kazanır. Alan bazlı birleştirme yoktur.
- **Çevrimdışı:** Firestore kalıcı önbelleği (`persistentLocalCache`) yazmaları sıraya alır, bağlantı gelince gönderir.
- **Tembel yükleme:** Firestore kütüphanesi (~440 KB) ilk ekranı yavaşlatmasın diye `firestore()` ile dinamik `import()` edilir. Ama girişte bekletmesin diye: cihazda bulut hesabı açıksa ya da yönlendirmeli girişten dönülüyorsa hemen; değilse giriş ekranı çizildikten sonra tarayıcı boştayken (`veritabaniOnYukle`) ve "Google ile devam et"e basılınca indirilir.

### 6.3 İki dosya arasındaki köprü

- `dashboard.js` → `bulut.js`: `window.AYVEX_BULUT.{ girisYap, kullaniciVerisi, dinle, kaydet, bekleyenleriGonder, cikisYap, verimiSil, epostaKayit, epostaGiris, dogrulamaGonder, dogrulamaKontrol, sifreSifirla, sifreDegistir, hesabiTamamenSil, paylasimIdUret, paylasimYaz, paylasimSil, paylasimOku, mevcutKullanici }`
- `bulut.js` → `dashboard.js`: `window.AYVEX.{ authDegisti, googleGirisSonucu, googleBeklemeBitti, uzakVeriGeldi, bulutDurum }`
- `bulut.js` hazır olunca `ayvex-bulut-hazir` olayını yayar.

---

## 7. dashboard.js nasıl çalışır?

### 7.1 Açılış

Dosyanın en sonundaki `try { ... }` bloğu: giriş ekranını hazırlar; `?paylasim=` varsa salt okunur paylaşım sayfasını açar; `db.aktif` varsa `basla()` ile uygulamayı açar, yoksa giriş ekranını gösterir. `basla()` → `S`'yi yükler/onarır, `modUygula()`, `goView("home")`, `ciz()`.

### 7.2 Önemli global değişkenler ve yardımcılar

| İsim | Ne işe yarar |
|---|---|
| `S` | Aktif kullanıcının verisi. |
| `db` | `localStorage`'daki tüm hesaplar (`dbYaz()` ile yazılır). |
| `todayKey`, `now`, `bugunGunNo` | Sayfa açılışındaki gün (`YYYY-MM-DD`). Dikkat: gece yarısında güncellenmez. |
| `$("id")` | `document.getElementById`. |
| `esc(metin)` | HTML kaçışı. `innerHTML`'e giden **her** kullanıcı metninde kullanılmalı. |
| `uid()`, `guvenliId(id)` | Kimlik üretme ve doğrulama (`[A-Za-z0-9_-]`). |
| `tarihKey(Date)`, `tarihOku("YYYY-MM-DD")`, `gunFarki(k)`, `gunEtiket(k)`, `saatDk("HH:MM")` | Tarih yardımcıları (yerel saatle). |
| `bul(liste, id)` | `S[liste]` içinde kimliğe göre kayıt bulur. |
| `kaydet()`, `ciz()` | Kaydet ve yeniden çiz. |
| `goView(v)`, `modUygula()` | Sayfa değiştir; moda göre etiketleri ayarla. |
| `bilgiGoster(mesaj)`, `geriAlGoster(...)` | Alttaki kısa bildirim (toast); silmede "Geri al". Uzun mesaj daha uzun kalır. |
| `kayitSilGeriAl(liste, id)` | Kaydı siler ve "Geri al" bildirimini gösterir. Tek kayıt silmede onay yerine bunu kullanın. |
| `await onayIste({ baslik, mesaj, onay, tehlikeli })` | Uygulama içi onay penceresi (`#dlgOnay`); `true`/`false` döner. `confirm()` yerine. |
| `tarihGecerli(k)`, `dersRenk(d)` | Tarih biçimi kontrolü; ders rengini izinli listeden (`DERS_RENKLERI`) verir. |
| `alanHatasi(form, alanAdi, mesaj)` | Form hatasını alanın altında gösterir (`alert()` kullanılmaz). |
| `guvenliAc(dialog)` | `<dialog>`'u güvenle açar. |
| `bildirimEkle(tip, baslik, mesaj, ozelId)` | Uygulama içi bildirim (+ açıksa cihaz bildirimi); `ozelId` aynı bildirimi tekrarlamaz. |

### 7.3 Olay sistemi (en önemli kısım)

Olaylar tek tek düğmelere değil, `document`'a bağlanır (event delegation). HTML'deki `data-*` nitelikleri neyin olacağını söyler:

| Nitelik | Ne olur | İşleyen kod |
|---|---|---|
| `data-view="tasks"` | Sayfa değişir. | "Tıklama olayları" bölümü → `goView()` |
| `data-open="dlgX"` | `dlgX` penceresinin formu sıfırlanıp açılır. Bazı pencereler için ek hazırlık yapılır (başlık, tarih vb.). | "Tıklama olayları", `opener` dalı |
| `data-dlg="settingsDlg"` | Ayarlar/Pomodoro gibi pencereleri açar (formu sıfırlamadan). | aynı bölüm |
| `data-form="task"` (form) | Gönderilince `S`'ye kayıt eklenir. Her form tipinin bir `case`'i var. | `document.addEventListener("submit", ...)` içindeki `switch (f.dataset.form)` |
| `data-act="del"` + `data-list` + `data-id` | Silme (+ Geri al). Diğer `data-act` değerleri: `task-toggle`, `task-start`, `task-done`, `ders-edit`, `proje-edit` ... | Genel `[data-act]` tıklama işleyicisi |
| `data-rename` + `data-list` + `data-id` + `data-field` | Çift tıklayınca yerinde düzenleme. | `adDegistir()` |

**Kritik kural:** Genel `[data-act]` tıklama işleyicisi en sonda `ciz()` çağırır ve ekranı yeniden çizer. Kendi işleyicisi olan bir eylem (alt görev, not hesaplayıcı, paylaşım gibi) eklerseniz, o işleyicinin başındaki **istisna listesine** eklemeniz gerekir. Aksi halde ekran yeniden çizilir ve odak kaybolur. Listeyi bulmak için `"nh-ekle", "nh-sil"` metnini arayın.

**Düzenleme pencereleri:** Proje, plan, toplantı, başvuru, kurs, kariyer hedefi için ortak düzenleme altyapısı `DUZENLE_DLG` sabitindedir (`kayitDuzenleAc(tip, id)`, `kayitGuncelle(liste, kayit)`). Yeni bir düzenlenebilir kayıt türü eklemek için oraya bir satır eklemek çoğu zaman yeterlidir.

### 7.4 Bölümler

Dosya `// ===== BÖLÜM ADI =====` başlıklarıyla bölünmüştür. Editörde bu başlıkları arayarak gezinin. Sıra kabaca şöyledir: veri modeli ve onarım → bulut ve giriş → silme/geri al → görünüm (`goView`) → karşılama → bildirimler → Pomodoro → ders programı → akademik → kariyer → iş modu (plan, projeler, sprint, toplantılar) → görevler (tekrar, alt görevler, Kanban sürükle-bırak) → not hesaplayıcı → YKS → seri → Bugün ekranı → aylık rapor → hızlı ekle → haftalık özet → geri sayım → `ciz()` → tıklama/form olayları → tema → yedekleme → takvime aktar (.ics) → giriş/çıkış → açılış.

---

## 8. Özellik haritası: hangi kod nerede?

| Özellik | HTML | JS (bölüm / işlev) | CSS |
|---|---|---|---|
| Bugün kartı, seri, akış | `#v-home .bugun-kart` | BUGÜN EKRANI: `bugunCiz`, `bugunAkisi`; SERİ: `seriHesapla`, `aktifGunler` | `.bugun-*`, `.seri-chip` |
| Hızlı ekle (+) | `#hizliEkle`, `#dlgGorev` | HIZLI EKLE: `hizliMenuAc`; menü öğeleri `data-open` kullanır | `.hizli-*` |
| Aylık rapor | `#dlgRapor`, `#aylikRaporBtn` | AYLIK RAPOR: `aylikRaporCiz` | `.rapor-*` |
| Görev listesi | `#v-tasks` | GÖREVLER: `gorevlerCiz`, `gorevSonEtiketi` | `.task-*` |
| Tekrarlayan görev | form `select[name=tekrar]` | `gorevTamamla` → `tekrarUret`, `tekrarIleri`, `tekrarGeriAl` | |
| Alt görevler | (JS üretir) | `altGorevHtml`, `altGorevEkle` | `.alt-*` |
| Kanban + sürükle-bırak | `#kanban` | `kanbanCiz`; "Kanban sürükle-bırak" (Pointer Events, dokunmatikte `.ki-tasi` tutamacı) | `.kanban-*`, `.ki-*` |
| Pomodoro | `#pomodoroCard` | POMODORO: `pomoBaslat`, `pomoBitti`, `pomoKaydet` (bağlı göreve `odakDk` yazar) | `.pomo-*` |
| Ders programı | `#v-ders`, `#dlgDers` | DERS PROGRAMI; ana sayfadaki küçük tablo `miniDersGridCiz` | `.ders-*`, `.mdg-*` |
| Sınav / ödev / geri sayım | `#v-ac`, `#dlgSinav`, `#dlgOdev` | AKADEMİK; SINAV GERİ SAYIMI: `geriSayimCiz` | `.sinav-*`, `.gs-*` |
| Not ortalaması | `.nh-card` | NOT ORTALAMASI: `notHesapCiz`, `nhDersNotu`, `nhHarf`, `HARF_TABLOSU` | `.nh-*` |
| YKS konu takibi | `.yks-konu-card` | YKS KONU TAKİBİ: `YKS_KONULAR`, `yksKonuCiz`, `ykIlerleme` | `.yk-*` |
| Haftalık özet | `.haftalik-ozet-card` | HAFTALIK ÖZET: `haftalikOzetCiz` | `.ozet-*` |
| Projeler + paylaşım | `#v-proje`, `#dlgProje`, `#paylasimSayfa` | İŞ MODU: PROJELER; PROJE PAYLAŞIMI: `projePaylasimVerisi`, `paylasimSayfasiAc` | `.proje-*`, `.paylasim-*` |
| Sprint, toplantılar, iş planı | `#v-sprint`, `#v-toplanti` | İŞ MODU bölümleri | |
| Takvim | `#v-cal` | `ciz()` içindeki takvim kısmı, `gunListesi` | `.cal-*`, `.big-grid` |
| Takvime aktar (.ics) | Ayarlar `#takvimAktar` | TAKVİME AKTAR: `takvimDosyasi` | |
| Tema | Ayarlar `[data-tema-sec]` | TEMA: `temaUygula`; ayrıca `<head>`'deki satır içi betik | `:root[data-tema="koyu"]` blokları |
| Cihaz bildirimleri | Ayarlar `#sistemBildirimBtn` | SİSTEM BİLDİRİMLERİ: `sistemBildirimiGoster` | |
| Yedekle / geri yükle | Ayarlar | YEDEKLE / GERİ YÜKLE | |
| Giriş ekranı | `#auth` | E-POSTA İLE GİRİŞ, BULUT, Giriş / çıkış | `.onboard-*`, `#auth ...` |

---

## 9. Görünüm: CSS, tema, mobil

- **Renk değişkenleri:** `dashboard.css`'in başındaki `:root` (ör. `--bg`, `--surface`, `--ink`, `--ink-2`, `--ink-3`, `--teal`, `--coral`). Bileşenlerde sabit renk yerine bunları kullanın.
- **Koyu mod:** `<html data-tema="koyu">` ile açılır. Seçim `localStorage`'da `ayvex-tema` (`sistem`/`acik`/`koyu`). Koyu renkler `:root[data-tema="koyu"]{...}` blokları içindedir. Yeni bir bileşende açık zemin + `var(--ink)` gibi bir kombinasyon koyu modda okunmaz hale gelebilir; iki temada da kontrol edin. Pastel zeminler (`--*-soft`) bilerek açık kalır ve üzerlerinde koyu yazı kullanılır.
- **Moda özel öğeler:** `class="menu-ogrenci"` sadece öğrenci modunda, `class="menu-is"` sadece iş modunda görünür (`body[data-mode]` ile).
- **İş modu renkleri:** `body[data-mode="work"]` bazı değişkenleri (ör. `--teal` → turuncu) değiştirir.
- **Mobil:** Kırılım noktaları 900 / 760 / 560 px. Mobil düzeltmeler dosyanın sonundaki "MOBİL DÜZELTMELERİ" bloğundadır: form alanları 16 px (iPhone yakınlaştırmasın diye), pencerelerde yapışkan başlık ve Kaydet çubuğu, en az ~40 px dokunma alanı.
- **Katman sırası:** `<dialog>` tarayıcının üst katmanında (top layer) açılır ve `z-index` onu geçemez. Bildirim (toast) bu yüzden `popover="manual"` ile açılır (`toastAc`/`toastKapat`).
- **`hidden` niteliği:** Bir sınıf `display:flex` gibi bir değer veriyorsa `hidden` işe yaramaz. Bu durumda `.sinif[hidden]{display:none}` kuralı ekleyin. Bu hata birkaç kez yaşandı.

---

## 10. Service worker, kurulum, bildirimler

- **`sw.js`:** "Önce ağ, yoksa önbellek" stratejisi. Kendi dosyalarımız `cache: "no-cache"` ile sunucuya sorularak alınır (yeni sürüm hemen görünsün diye). Firebase ve font dosyaları normal önbellekten gelir. Firestore/Auth API çağrıları asla önbelleğe alınmaz. Önbellek adı `ayvex-v2`; yapıyı değiştirirseniz artırın, eski önbellek silinir.
- **Kurulum:** `manifest.webmanifest` + `assets/icon-*`.
- **Cihaz bildirimleri:** Yalnızca uygulama açıkken ya da arka planda çalışırken gelir (`setInterval` ile 30 dakikada bir kontrol). Uygulama kapalıyken bildirim için bir sunucu (ör. Firebase Cloud Functions + FCM) gerekir; bu yok.
- **Bilinen:** Service worker `localhost`'ta bazı tarayıcı panellerinde kaydolmaz. Canlı sitede çalışır.

---

## 11. Güvenlik ve Firestore kuralları

- **Firestore kuralları (`firestore.rules`):** Herkes yalnızca kendi `users/{uid}` belgesini okuyup yazabilir; e-posta hesapları için doğrulama zorunludur; belge şeması ve boyutu doğrulanır. `paylasimlar/{id}` belgesini bağlantıyı (uzun, rastgele kimlik) bilen herkes okuyabilir ama listeleyemez; yalnızca sahibi yazıp silebilir.
- **Kuralları yayınlamak:** Repoyu değiştirmek yetmez. Firebase konsolu → Firestore → Rules'a yapıştırıp "Yayınla"ya basın ya da `npx firebase-tools deploy --only firestore:rules` komutunu kullanın (bunun için `firebase.json`'a `"firestore": { "rules": "firestore.rules" }` eklemek gerekir).
- **XSS:** Ekrana giden kullanıcı metinleri `esc()` ile kaçışlanır. Kayıt kimlikleri nitelik içinde kaçışsız kullanıldığı için `veriOnar` kimlikleri `guvenliId()` ile doğrular. Yeni şablonlarda da `${esc(...)}` kullanın.
- **`bulut.js`'deki `apiKey` gizli değildir:** Her Firebase web uygulamasında istemci kodunda bulunur; güvenliği kurallar sağlar.
- **İçerik Güvenlik Politikası (CSP) yok:** Google girişi Google'ın betik ve iframe'lerini kullandığı için bilinçli olarak eklenmedi. Eklenecekse giriş akışıyla birlikte dikkatle test edilmeli.

---

## 12. Testler ve CI

```bash
npm install
npm test              # node --test tests/
```

- **`tests/sozdizimi.test.js`:** Üç JS dosyasının söz dizimi (aynı isimle iki kez tanımlanan bir sabit tüm uygulamayı durdurur; bu bir kez yaşandı). `index.html`'de tekrar eden `id`, `data-open` ile açılan pencerelerin varlığı, `?v=` sürümlerinin aynı olması, manifest ve service worker dosyaları.
- **`tests/islevler.test.js`:** Uygulama jsdom içinde yerel bir test profiliyle açılır (`tests/yardimci.js > uygulamaYukle()`); Firebase yüklenmez. Örnekler: tekrar tarihleri, not/harf hesabı, `.ics` dosyası, seri, akış sıralaması, veri onarma, kimlik temizleme, görev formu.
- **Yeni test yazmak:** `const { js, belge, gunEkle } = uygulamaYukle();` ile uygulamanın global değişkenlerine `js("S.tasks.length")` gibi erişilir. Uygulama kodu `vm.runInContext` ile çalıştırılır (`eval` kullanılmaz; `eval` içindeki `let/const` tanımları dışarıdan görünmez).
- **CI:** `.github/workflows/testler.yml` her PR'da ve `main`'e her gönderimde testleri çalıştırır.

---

## 13. Yayın süreci

1. Değişikliği bir dalda yapın, PR açın, testlerin geçtiğini görün, `main`'e birleştirin.
2. **Sürüm numarası:** `dashboard.css`, `dashboard.js` ya da `bulut.js` değiştiyse `index.html`'deki üç `?v=` değerini birlikte artırın (biçim: `YYYYMMDD.sıra`, ör. `20261123.3`). Test bunu kontrol eder. Artırılmazsa bazı tarayıcılar eski dosyayı kullanır.
3. **Firebase'e yayın:** `npx firebase-tools deploy --only hosting --project ayvex-7697a`. Yaklaşık 11 dosya yüklenmeli; daha fazlaysa `firebase.json > ignore` listesini kontrol edin (`.git` bir kez yanlışlıkla yüklenmişti).
4. **Denemek için:** `npx firebase-tools hosting:channel:deploy deneme --expires 2d` geçici bir önizleme adresi verir. Önizleme alan adında Google girişi çalışmaz (izinli dönüş adresi değil); diğer her şey çalışır.
5. **GitHub Pages:** `main`'e her birleştirmede eski GitHub Pages adresi de güncellenir. Oradaki sayfa ziyaretçiyi hemen yeni adrese yönlendirir.
6. **Otomatik yayın (henüz kapalı):** `firebase-yayin.yml` hazır ama GitHub'a `FIREBASE_SERVICE_ACCOUNT_AYVEX_7697A` gizli anahtarı eklenmedi. En kolay kurulum: `npx firebase-tools init hosting:github` (anahtarı kendisi oluşturup GitHub'a ekler).

---

## 14. Tarifler: sık yapılan değişiklikler

### 14.1 Bir kayda yeni alan eklemek
Örnek: görevlere `etiket` eklemek.
1. Formu güncelleyin: `index.html` içinde `data-form="task-quick"` / `data-form="task"` formlarına `<input name="etiket">` ekleyin.
2. Kaydedin: `submit` işleyicisindeki `case "task": case "task-quick":` içinde `etiket: (v.etiket || "").trim()` ekleyin.
3. Doğrulayın: `veriOnar` içinde görev döngüsüne kontrol ekleyin (ör. `metin(t, "etiket")`).
4. Gösterin: `gorevlerCiz` şablonuna `${esc(t.etiket)}` ekleyin.
5. Gerekirse `.ics` (`takvimDosyasi`), paylaşım (`projePaylasimVerisi`) ve testleri güncelleyin.

### 14.2 Yeni bir sayfa (view) eklemek
1. `index.html` → `<main class="content">` içine `<div class="view" id="v-yeni">…</div>` ekleyin (moda özelse `menu-ogrenci`/`menu-is` sınıfını ekleyin).
2. Yan menüye (`.side-nav`) ve gerekirse alt menüye (`.mobile-nav`) `data-view="yeni"` bağlantısı ekleyin.
3. Çizim işlevini yazın ve `ciz()` içinden çağırın.

### 14.3 Yeni bir pencere (dialog) eklemek
1. `index.html` → `<dialog id="dlgYeni">` içinde `.dlg-head` (başlık + `data-dialog-close` X düğmesi) ve `<form data-form="yeni" class="dialog-form">…<div class="dialog-actions">…</div></form>` oluşturun.
2. Açmak için bir düğmeye `data-open="dlgYeni"` verin.
3. `submit` işleyicisine `case "yeni":` ekleyin; gönderimden sonra otomatik kapanması için `AUTOCLOSE` listesine `"dlgYeni"` ekleyin.

### 14.4 Kendi tıklama işleyicisi olan bir düğme eklemek
`document.addEventListener("click", e => { const b = e.target.closest('[data-act="benim-eylem"]'); ... })` yazın ve `"benim-eylem"`'i genel `[data-act]` işleyicisinin istisna listesine ekleyin (bkz. [7.3](#73-olay-sistemi-en-önemli-kısım)).

### 14.5 Kısa bir bildirim göstermek, onay istemek
`bilgiGoster("Kaydedildi.")`. Form hatası için `alanHatasi(form, "alanAdi", "Mesaj")` kullanın.

- **Tek kayıt silme:** Onay sormayın; `kayitSilGeriAl(liste, id)` ile silin, kullanıcı "Geri al" ile geri getirebilir. Yeni liste eklerseniz `SILME_ADI`'na adını yazın.
- **Geri alınamayan işlemler** (toplu silme, sıfırlama, hesap silme, yedekten geri yükleme): `if (!await onayIste({ baslik: "…silinsin mi?", mesaj: "…", onay: "Sil", tehlikeli: true })) return;`. Beklerken veri değişmiş olabilir; devam etmeden önce `S` ve `db.aktif`'in hâlâ aynı olduğunu kontrol edin.
- `alert()` / `confirm()` / `prompt()` **kullanmayın**: bazı ortamlarda (uygulama içi tarayıcılar, kurulu uygulama) engellenip hemen "hayır" döner ve işlem sessizce durur. `tests/onay.test.js` kodda bunların olmadığını kontrol eder.

### 14.6 Renk ya da stil değiştirmek
Önce `:root` değişkenlerine bakın. Değişkeni değiştirmek tüm uygulamayı etkiler; tek bir bileşen için sınıfına kural yazın. Koyu modu ve mobil genişliği (375 ve 320 px) de kontrol edin.

---

## 15. Tuzaklar: bunlara dikkat

1. **Satır sonları (CRLF):** `index.html`, `dashboard.js`, `dashboard.css` repoda **CRLF** satır sonlarıyla, `bulut.js`, `README.md` ve testler **LF** ile saklanıyor. Bazı araçlar (ör. Git Bash `sed -i`) bunu değiştirip tüm dosyayı "değişmiş" gösterir. Commit'ten önce `git diff --stat`'ın beklediğiniz kadar satır gösterdiğini kontrol edin.
2. **Türkçe karakter kodlaması:** Windows PowerShell 5.1'de `Get-Content` / `Set-Content` UTF-8 dosyaları bozabilir ("masaüstü" → "masaÃ¼stÃ¼") ve dosyanın başına BOM ekler. Dosyaları düzenleyiciyle ya da UTF-8'i doğru işleyen araçlarla değiştirin.
3. **Global isim çakışması:** `dashboard.js` tek bir klasik betik; aynı isimde iki üst düzey `const` tüm uygulamayı durdurur (`YKS_ALAN` ile yaşandı). Testler bunu yakalar, yine de yeni sabitlere özgün isimler verin.
4. **Sürüm numarası:** `?v=` değerini artırmayı unutmayın (bkz. [13](#13-yayın-süreci)).
5. **Firestore kuralları:** Repoyu değiştirmek yetmez, konsola da yayınlanmalı.
6. **`todayKey`:** Sayfa açılışında sabitlenir; uzun süre açık kalan sekmede gece yarısından sonra "bugün" eski kalır. Gerçek anın tarihi gerektiğinde `tarihKey(new Date())` kullanın.
7. **Ekranı yeniden çizmek odağı kaybettirir:** Bir giriş kutusu yazılırken `ciz()` çağırmayın; sadece ilgili kısmı güncelleyin (not hesaplayıcı ve alt görevler böyle yapar).
8. **Genel tıklama işleyicisinin istisna listesi:** Bkz. [7.3](#73-olay-sistemi-en-önemli-kısım).
9. **Yerel hesaplar kapalı:** `YEREL_GIRIS_AKTIF = false`. Açık kalmış eski yerel oturumlar açılışta kapatılır.
10. **Alan adları:** Google girişi yalnızca `ayvex-7697a.firebaseapp.com`'da yönlendirmeyle çalışır. Yeni bir alan adı eklenirse Google Cloud Console'daki OAuth istemcisinin izinli dönüş adreslerine `https://<alan>/__/auth/handler` eklenmeli ve Firebase Authentication'ın yetkili alan adlarına eklenmeli.

---

## 16. Bilinen sınırlamalar ve olası sonraki adımlar

- **Mimari:** `dashboard.js` tek bir büyük dosya (~4.500 satır). Özellik eklemek zorlaştıkça modüllere bölmek (görevler, akademik, iş modu, ayarlar) faydalı olur.
- **Senkronizasyon:** Son yazan kazanır; iki cihazda aynı anda yapılan farklı değişikliklerden biri kaybolabilir.
- **Bildirimler:** Uygulama kapalıyken bildirim yok (sunucu gerekir).
- **Otomatik yayın:** GitHub Actions ile Firebase'e otomatik yayın için anahtar eklenmedi.
- **Güvenlik başlığı:** CSP yok.
- **Henüz yapılmamış fikirler:** Çalışma grupları (birlikte düzenlenen proje panosu), İngilizce dil desteği, otomatik çalışma planı (konuları günlere dağıtma), yapay zekâ ile doğal dilde görev ekleme (ücretli API gerektirir).
- **Eski veri alanları:** `courses`, `jobs`, `skills`, `notes`, `links`, `deadlines` gibi bazı alanlar eski sürümlerden kalma; bazıları arayüzde hâlâ kullanılıyor. Silmeden önce kullanıldıkları yerleri arayın.
