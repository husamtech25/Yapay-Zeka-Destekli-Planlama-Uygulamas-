# AYVEX — Planlama Uygulaması

Öğrenciler ve çalışanlar için web tabanlı bir planlama uygulaması: görevler, takvim, ders programı, sınavlar, projeler, sprint panosu, toplantılar, kariyer takibi ve Pomodoro sayacı tek ekranda.

> **Not:** "Yapay Zeka Destekli" ifadesi, bu uygulamanın yapay zeka yardımıyla **geliştirildiğini** anlatır. Uygulamanın içinde bir yapay zeka özelliği veya yapay zeka servisine bağlantı yoktur.

## Özellikler

- **İki mod:** Öğrenci (akademik, ders programı, kariyer) ve İş (projeler, sprint planı, toplantılar)
- **Görevler:** öncelik, proje bağlantısı, Kanban görünümü, silinen kaydı "Geri al"
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
| `firestore.rules` | Firestore güvenlik kuralları |

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
