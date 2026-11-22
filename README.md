# AYVEX — Planlama Uygulaması

Öğrenciler ve çalışanlar için web tabanlı bir planlama uygulaması: görevler, takvim, ders programı, sınavlar, projeler, sprint panosu, toplantılar, kariyer takibi ve Pomodoro sayacı tek ekranda.

> **Not:** "Yapay Zeka Destekli" ifadesi, bu uygulamanın yapay zeka yardımıyla **geliştirildiğini** anlatır. Uygulamanın içinde bir yapay zeka özelliği veya yapay zeka servisine bağlantı yoktur.

## Özellikler

- **İki mod:** Öğrenci (akademik, ders programı, kariyer) ve İş (projeler, sprint planı, toplantılar)
- **Görevler:** öncelik, isteğe bağlı son tarih (geciken ve yaklaşan görevler renkli gösterilir, bildirim gelir), tekrarlama (her gün / hafta / ay; tamamlanınca bir sonraki otomatik eklenir), proje bağlantısı, Kanban görünümü, silinen kaydı "Geri al"
- **Ana sayfa:** bu haftanın özeti (tamamlanan görevler, odak süresi, en verimli gün) ve sıradaki sınava geri sayım
- **Not ortalaması hesaplayıcı** (Akademik): kredi, vize, final ve vize ağırlığına göre ders notu, harf notu ve 4'lük ortalama
- **Takvime aktar:** sınav, ödev, toplantı, etkinlik, ders programı ve son tarihli görevler `.ics` dosyası olarak (Google / Outlook / Apple Takvim)
- **Proje paylaşımı:** bir projenin salt okunur özetini bağlantıyla paylaşma (İş modu, bulut hesabı gerekir)
- **Görünüm:** açık / koyu / sistem teması (Ayarlar > Görünüm)
- **Uygulama olarak kurulum ve çevrimdışı açılma:** telefonda ve masaüstünde ana ekrana eklenebilir (`manifest.webmanifest`); `sw.js` uygulama dosyalarını önbelleğe alır
- **Cihaz bildirimleri:** Ayarlar > Bildirimler'den açılır; uygulama açıkken ya da arka planda çalışırken bildirim gösterir (sunucu olmadığı için uygulama tamamen kapalıyken bildirim gelmez)
- **Takvim, sınav ve ödev takibi**, bildirimler
- **Giriş:** Google hesabı veya e-posta + şifre (e-posta doğrulaması zorunlu)
- **Bulut senkronizasyonu:** veriler Firebase Firestore'da saklanır, cihazlar arasında eşitlenir; çevrimdışıyken tarayıcıda (localStorage) tutulur

## Dosyalar

| Dosya | Görevi |
|---|---|
| `index.html` | Sayfa yapısı, giriş ekranı ve tüm görünümler |
| `dashboard.js` | Uygulamanın tüm mantığı (veri, çizim, formlar) |
| `dashboard.css` | Stiller |
| `bulut.js` | Firebase Auth + Firestore köprüsü |
| `firestore.rules` | Firestore güvenlik kuralları (kullanıcı verisi + paylaşım bağlantıları); her değişiklikte Firebase konsoluna yeniden yapıştırılmalı |
| `sw.js` | Service worker: çevrimdışı açılma ve bildirime tıklayınca uygulamayı açma |
| `manifest.webmanifest` | Uygulama olarak kurulum bilgileri ve simgeler |

Derleme adımı veya `npm` bağımlılığı yoktur; Firebase kütüphaneleri doğrudan CDN'den yüklenir.

## Yerelde çalıştırma

`bulut.js` bir ES modülü olduğu için dosyayı çift tıklayarak (`file://`) açmak yerine küçük bir yerel sunucu kullanın. Proje klasöründe şunlardan biri yeterli:

```bash
# Python yüklüyse
python -m http.server 8000

# Node.js yüklüyse
npx serve .
```

Ardından tarayıcıda `http://localhost:8000` adresini açın.

## Firebase ayarları

1. [Firebase konsolunda](https://console.firebase.google.com) bir proje oluşturun ve bir **Web uygulaması** ekleyin.
2. Verilen yapılandırmayı `bulut.js` içindeki `firebaseConfig` nesnesine yazın. Bu değerler gizli değildir; her Firebase web uygulamasında istemci kodunda bulunur. Güvenliği `firestore.rules` sağlar.
3. **Authentication** bölümünde **Google** ve **E-posta/Şifre** giriş yöntemlerini açın.
4. **Authentication > Settings > Authorized domains** listesine uygulamayı yayınladığınız alan adını ve yerel test için `localhost` adresini ekleyin.
5. **Firestore Database** oluşturun, `firestore.rules` dosyasının içeriğini **Rules** sekmesine yapıştırıp yayınlayın.

## Test hesabı

Gerçek hesabınızı kullanmak yerine test için ayrı bir e-posta adresiyle kayıt olun. E-posta/şifre hesaplarında doğrulama e-postasındaki bağlantıya tıklamadan veriler buluta kaydedilmez.

## Sürüm / önbellek

`index.html` içindeki `dashboard.css`, `dashboard.js` ve `bulut.js` bağlantılarının sonundaki `?v=...` değeri, her değişiklikte artırılmalıdır; böylece tarayıcılar eski dosyayı önbellekten kullanmaz.
