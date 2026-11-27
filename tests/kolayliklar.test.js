// Kolaylıklar: ders/toplantı hatırlatıcı, görev adından tarih, klavye kısayolları.
const test = require("node:test");
const assert = require("node:assert/strict");
const { uygulamaYukle, hepsiniKapat } = require("./yardimci");

test.afterEach(hepsiniKapat);

// Sabit "bugün": 25 Kasım 2026 Çarşamba
const BUGUN = "new Date(2026, 10, 25, 12, 0)";
const ayikla = (js, metin) => JSON.parse(js(`JSON.stringify(dogalTarihAyikla(${JSON.stringify(metin)}, ${BUGUN}))`));

test("görev adından tarih: göreli ifadeler", () => {
  const { js } = uygulamaYukle();
  assert.deepEqual(ayikla(js, "Rapor yaz yarın"), { metin: "Rapor yaz", son: "2026-11-26" });
  assert.deepEqual(ayikla(js, "Yarın market alışverişi"), { metin: "market alışverişi", son: "2026-11-26" });
  assert.deepEqual(ayikla(js, "Fatura öde bugün"), { metin: "Fatura öde", son: "2026-11-25" });
  assert.deepEqual(ayikla(js, "Kitabı iade et yarına"), { metin: "Kitabı iade et", son: "2026-11-26" });
  assert.deepEqual(ayikla(js, "Proje teslimi 3 gün sonra"), { metin: "Proje teslimi", son: "2026-11-28" });
  assert.deepEqual(ayikla(js, "Sunum 2 hafta sonra"), { metin: "Sunum", son: "2026-12-09" });
  assert.deepEqual(ayikla(js, "Toplantı notları haftaya"), { metin: "Toplantı notları", son: "2026-12-02" });
});

test("görev adından tarih: gün adları (bugün dahil sonraki ilk gün, 'haftaya' bir sonraki hafta)", () => {
  const { js } = uygulamaYukle();
  assert.equal(ayikla(js, "Ödev cuma").son, "2026-11-27");
  assert.equal(ayikla(js, "Ödev cumaya").son, "2026-11-27");
  assert.equal(ayikla(js, "Spor çarşamba").son, "2026-11-25", "Bugün Çarşamba: bugün");
  assert.equal(ayikla(js, "Spor salı").son, "2026-12-01", "Salı geçti: gelecek Salı");
  assert.equal(ayikla(js, "Kurs cumartesi günü").son, "2026-11-28", "'cuma' ile karışmamalı");
  assert.equal(ayikla(js, "Sınav haftaya pazartesi").son, "2026-11-30");
  assert.equal(ayikla(js, "Sınav haftaya cuma").son, "2026-12-04");
});

test("görev adından tarih: gün.ay ve '5 Aralık' biçimi; geçmişse gelecek yıl", () => {
  const { js } = uygulamaYukle();
  assert.deepEqual(ayikla(js, "Doktor randevusu 5 Aralık"), { metin: "Doktor randevusu", son: "2026-12-05" });
  assert.equal(ayikla(js, "Vergi 30.11").son, "2026-11-30");
  assert.equal(ayikla(js, "Kayıt yenile 10/01").son, "2027-01-10", "Geçmiş tarih gelecek yıla");
  assert.equal(ayikla(js, "Kutlama 29 şubat"), null, "2027'de 29 Şubat yok, 2026 da geçmiş: tarih sayılmaz");
});

test("görev adından tarih: tarih yoksa ya da ad sadece tarihse dokunulmaz", () => {
  const { js } = uygulamaYukle();
  assert.equal(ayikla(js, "Matematik çalış"), null);
  assert.equal(ayikla(js, "Cuma"), null, "Sadece gün adı: ad olarak kalır");
  assert.equal(ayikla(js, "Yarın"), null);
  assert.equal(ayikla(js, "Raporu pazartesi sabah gönder"), null, "Ortadaki kelime değil, sadece baş/son");
  assert.equal(ayikla(js, "Pazartesi raporu gönder").son, "2026-11-30", "Başta gün adı tarih olur");
  assert.equal(ayikla(js, "Cumhuriyet bayramı"), null, "'cuma' öneki değil, tam kelime");
  assert.equal(ayikla(js, "40 gün sonra"), null, "Sadece tarih ifadesi");
});

test("görev formu: adındaki tarih son tarih olur; seçilen tarih varsa ona dokunulmaz", () => {
  const { js, belge, w, gunEkle } = uygulamaYukle();
  js(`S.tasks = []; goView("tasks"); ciz();`);
  const f = belge.querySelector('#v-tasks form[data-form="task-quick"]');
  const gonder = (t, son = "") => {
    f.querySelector("[name=t]").value = t;
    f.querySelector("[name=son]").value = son;
    f.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  };
  gonder("Rapor yaz yarın");
  gonder("Rapor yaz yarın", gunEkle(5));
  const g = JSON.parse(js(`JSON.stringify(S.tasks.map(t => [t.t, t.son]))`));
  assert.deepEqual(g[0], ["Rapor yaz", gunEkle(1)]);
  assert.deepEqual(g[1], ["Rapor yaz yarın", gunEkle(5)], "Elle seçilen tarih önceliklidir, ad değişmez");
});

test("görev kutusu: yazarken tarih ipucu görünür, tarih yoksa gizlenir", () => {
  const { js, belge, w } = uygulamaYukle();
  js(`goView("tasks"); ciz();`);
  const f = belge.querySelector('#v-tasks form[data-form="task-quick"]');
  const i = f.querySelector("[name=t]");
  const yaz = m => { i.value = m; i.dispatchEvent(new w.Event("input", { bubbles: true })); };
  yaz("Fatura öde yarın");
  const ip = f.nextElementSibling;
  assert.ok(ip && ip.classList.contains("dogal-ipucu") && !ip.hidden, "İpucu görünmedi");
  assert.match(ip.textContent, /"Fatura öde" · son tarih Yarın/);
  yaz("Fatura öde");
  assert.ok(ip.hidden);
});

test("hatırlatıcı: ders ve toplantıdan 10 dk önce bir kez bildirim; ayar kapalıysa yok", () => {
  const { js, w } = uygulamaYukle();
  // 25 Kasım 2026 Çarşamba (gün 3)
  js(`S.notifications = [];
      S.dersler = [{ id: "d1", ad: "Fizik", kod: "", hoca: "Dr. A", sinif: "Lab-2", gun: "3", renk: "blue", bas: "13:30", bit: "15:20", notlar: "" },
                   { id: "d2", ad: "Kimya", kod: "", hoca: "", sinif: "", gun: "4", renk: "blue", bas: "13:30", bit: "14:00", notlar: "" }];
      S.toplantilar = [{ id: "t1", baslik: "Kulüp", tarih: "2026-11-25", saat: "13:35", sure: 30 }];`);
  assert.equal(js(`yaklasanHatirlat(new Date(2026, 10, 25, 13, 10))`), 0, "20 dk kala daha erken");
  assert.equal(js(`yaklasanHatirlat(new Date(2026, 10, 25, 13, 22))`), 1, "Fizik 8 dk kala; toplantı 13 dk kala değil");
  assert.equal(js(`yaklasanHatirlat(new Date(2026, 10, 25, 13, 25))`), 2, "İkisi de pencerede");
  const n = JSON.parse(js(`JSON.stringify(S.notifications.map(n => n.baslik + " | " + n.mesaj))`));
  assert.equal(n.length, 2, "Aynı ders/toplantı için ikinci bildirim eklenmez");
  assert.ok(n.some(x => /8 dk sonra ders: Fizik \| 13:30–15:20 · Lab-2 · Dr\. A/.test(x)), n.join("\n"));
  assert.ok(n.some(x => /dk sonra toplantı: Kulüp \| 13:35 · 30 dk/.test(x)), n.join("\n"));
  js(`S.notifications = []`);
  assert.equal(js(`yaklasanHatirlat(new Date(2026, 10, 25, 13, 36))`), 0, "İkisi de başladıktan sonra yok");
  w.localStorage.setItem("ayvex-ders-hatirlat", "kapali");
  js(`S.notifications = []`);
  assert.equal(js(`yaklasanHatirlat(new Date(2026, 10, 25, 13, 25))`), 0, "Ayar kapalı");
});

test("klavye kısayolları: N yeni görev, rakam sayfa, ? liste; yazarken ve pencere açıkken çalışmaz", () => {
  const { js, belge, w } = uygulamaYukle();
  const tus = (key, hedef = belge.body, ek = {}) => hedef.dispatchEvent(new w.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...ek }));
  js(`goView("home")`);
  // Sayfa listesini jsdom'da (düzen hesabı olmadığı için) doğrudan kontrol et
  const sayfalar = JSON.parse(js(`JSON.stringify(menuSayfalari())`));
  assert.ok(sayfalar.length >= 4 && sayfalar[0] === "home", JSON.stringify(sayfalar));
  tus("2");
  assert.equal(js(`aktifView`), sayfalar[1]);
  tus("n");
  assert.ok(belge.getElementById("dlgGorev").hasAttribute("open"), "N yeni görev penceresini açmalı");
  tus("1"); // pencere açıkken çalışmaz
  assert.equal(js(`aktifView`), sayfalar[1]);
  belge.getElementById("dlgGorev").close();
  tus("1", belge.querySelector('#v-tasks [name="t"]'));
  assert.equal(js(`aktifView`), sayfalar[1], "Yazı kutusundayken çalışmaz");
  tus("1", belge.body, { ctrlKey: true });
  assert.equal(js(`aktifView`), sayfalar[1], "Ctrl ile çalışmaz");
  tus("?");
  const d = belge.getElementById("dlgKisayol");
  assert.ok(d.hasAttribute("open"));
  assert.ok(belge.querySelectorAll("#kisayolSayfalar li").length >= 4);
});
