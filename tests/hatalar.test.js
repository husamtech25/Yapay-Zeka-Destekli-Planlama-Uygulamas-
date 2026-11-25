// Kontrolde bulunan hataların testleri: ders programı tablosu, istatistikler, karşılama özeti, dönem ortalaması.
const test = require("node:test");
const assert = require("node:assert/strict");
const { uygulamaYukle, hepsiniKapat } = require("./yardimci");

test.afterEach(hepsiniKapat);

const ders = (id, gun, bas, bit, ad = id) => ({ id, ad, kod: "", hoca: "", sinif: "", gun, renk: "blue", bas, bit, notlar: "" });
// "3 / span 10" → [3, 10]
const satirlar = el => el.style.gridRow.split("/").map(s => +s.replace("span", "").trim());

test("ders programı tablosu: dersler dakikası dakikasına yerleşir, ardışık dersler üst üste binmez", () => {
  const { js, belge } = uygulamaYukle();
  js(`S.dersler = ${JSON.stringify([ders("a", "1", "09:00", "09:50"), ders("b", "1", "09:50", "10:40"), ders("c", "1", "13:30", "14:15")])};
      goView("ders"); ciz();`);
  const el = id => belge.querySelector(`#haftalikGrid .hg-ders[data-id="${id}"]`);
  const [aBas, aBoy] = satirlar(el("a"));
  const [bBas] = satirlar(el("b"));
  const [cBas, cBoy] = satirlar(el("c"));
  // Tablo 08:00'de başlar, her satır 5 dk; 1. satır başlık
  const satir = saat => 2 + (saat - 8 * 60) / 5;
  assert.equal(aBas, satir(9 * 60));
  assert.equal(aBoy, 10, "09:00–09:50 = 10 satır");
  assert.equal(bBas, satir(9 * 60 + 50), "09:50 dersi 09:00'a yuvarlanmamalı");
  assert.ok(bBas >= aBas + aBoy, "Ardışık dersler üst üste binmemeli");
  assert.equal(cBas, satir(13 * 60 + 30), "13:30 dersi 13:00'te başlamamalı");
  assert.equal(cBoy, 9, "13:30–14:15 = 45 dk = 9 satır");
  assert.match(el("c").textContent, /13:30–14:15/, "Blokta saat yazmalı");
});

test("ders programı tablosu: aynı saatte çakışan dersler yan yana şeritlere ayrılır", () => {
  const { js, belge } = uygulamaYukle();
  js(`S.dersler = ${JSON.stringify([ders("x", "2", "10:00", "11:00"), ders("y", "2", "10:30", "11:30"), ders("z", "2", "12:00", "13:00")])};
      goView("ders"); ciz();`);
  const stil = id => belge.querySelector(`#haftalikGrid .hg-ders[data-id="${id}"]`).style;
  assert.equal(stil("x").getPropertyValue("--serit-sayi"), "2");
  assert.deepEqual([stil("x").getPropertyValue("--serit"), stil("y").getPropertyValue("--serit")], ["0", "1"]);
  assert.equal(stil("z").getPropertyValue("--serit-sayi"), "1", "Çakışmayan ders tam genişlikte");
});

test("ders programı istatistikleri: farklı ders sayısı ve haftalık süre", () => {
  const { js, belge } = uygulamaYukle();
  js(`S.dersler = ${JSON.stringify([ders("a", "1", "09:00", "10:30", "Matematik"), ders("b", "3", "09:00", "10:30", "matematik "), ders("c", "2", "13:00", "14:00", "Fizik")])};
      goView("ders"); ciz();`);
  const st = id => belge.getElementById(id).textContent;
  assert.equal(st("statDersSayi"), "2", "Haftada iki kez olan Matematik bir ders sayılır");
  assert.equal(st("statDersHafta"), "4 sa", "1,5 + 1,5 + 1 saat");
  assert.notEqual(st("statDersSayi"), st("statDersHafta"));
});

test("karşılama özeti: sınav ve ödev teslimi günü 'plan yok' demez", () => {
  const { js, belge, gunEkle } = uygulamaYukle();
  const ozet = () => belge.getElementById("welcomeSummary").textContent.replace(/\s+/g, " ").trim();
  js(`S.dersler = []; S.tasks = []; S.events = {}; S.sinavlar = []; S.odevler = []; ozetCiz();`);
  assert.match(ozet(), /plan yok/);
  js(`S.sinavlar = [{ id: "s", ad: "Final", tur: "Final", tarih: todayKey, saat: "", yer: "", notlar: "" }];
      S.odevler = [{ id: "o", ad: "Rapor", ders: "", tarih: todayKey, aciklama: "", done: false },
                   { id: "o2", ad: "Bitti", ders: "", tarih: todayKey, aciklama: "", done: true }]; ozetCiz();`);
  assert.doesNotMatch(ozet(), /plan yok/);
  assert.match(ozet(), /1 sınav/);
  assert.match(ozet(), /1 ödev teslimi/, "Tamamlanan ödev sayılmaz");
});

test("karşılama özeti: bugünkü/geciken görevler ayrı, yoksa bekleyen görev sayısı", () => {
  const { js, belge, gunEkle } = uygulamaYukle();
  const ozet = () => belge.getElementById("welcomeSummary").textContent.replace(/\s+/g, " ").trim();
  js(`S.sinavlar = []; S.odevler = []; S.dersler = []; S.events = {};
      S.tasks = [{ id: "a", t: "Bugün", done: false, p: "mid", son: todayKey }, { id: "b", t: "Gecikmiş", done: false, p: "mid", son: "${gunEkle(-2)}" },
                 { id: "c", t: "İleri", done: false, p: "mid", son: "${gunEkle(5)}" }, { id: "d", t: "Tarihsiz", done: false, p: "mid" }]; ozetCiz();`);
  assert.match(ozet(), /2 görev bugün/);
  js(`S.tasks = S.tasks.filter(t => t.id === "c" || t.id === "d"); ozetCiz();`);
  assert.match(ozet(), /2 bekleyen görev/);
});

test("dönem ortalaması: not hesaplayıcıyı kullanır, yazarken güncellenir; yoksa ders notlarına bakar", () => {
  const { js, belge } = uygulamaYukle();
  const ort = () => [belge.getElementById("acOrtalama").textContent, belge.getElementById("acOrtalamaSub").textContent];
  js(`S.courses = []; S.notHesap = []; goView("ac"); ciz();`);
  assert.deepEqual(ort(), ["—", "Henüz not girilmedi"]);
  js(`S.courses = [{ id: "c1", n: "Mat", g: 80 }, { id: "c2", n: "Fiz", g: 70 }]; ciz();`);
  assert.equal(ort()[0], "75.0");
  assert.match(ort()[1], /100'lük · 2 ders/);
  // Hesaplayıcıda kredili ve finali girilmiş ders varsa o kullanılır (4'lük)
  js(`S.vizeOrani = 40; S.notHesap = [{ id: "n1", ad: "Mat", kredi: 4, vize: 90, final: 95 }, { id: "n2", ad: "Fiz", kredi: 2, vize: 40, final: "" }]; ciz();`);
  assert.equal(ort()[0], "4.00");
  assert.match(ort()[1], /4'lük · 1 ders, 4 kredi/);
  // Hesaplayıcıda yazarken (ciz çağrılmadan) üstteki ortalama da değişir
  js(`S.notHesap[1].final = 50; nhSonucCiz();`);
  assert.notEqual(ort()[0], "4.00");
  assert.match(ort()[1], /2 ders, 6 kredi/);
});

test("sınav listesi: geçmiş sınavlar ayrı başlık altında, 'N gün önce' yazar", () => {
  const { js, belge, gunEkle } = uygulamaYukle();
  js(`S.sinavlar = [{ id: "g", ad: "Eski", tur: "Vize", tarih: "${gunEkle(-4)}", saat: "", yer: "", notlar: "" },
                    { id: "d", ad: "Dünkü", tur: "Vize", tarih: "${gunEkle(-1)}", saat: "", yer: "", notlar: "" },
                    { id: "y", ad: "Yeni", tur: "Final", tarih: "${gunEkle(3)}", saat: "", yer: "", notlar: "" }]; goView("ac"); ciz();`);
  const ogeler = [...belge.querySelectorAll("#sinavList > li")].map(li => li.className.split(" ")[0] + ":" + (li.dataset.id || li.textContent.trim()));
  assert.deepEqual(ogeler, ["sinav-item:y", "sinav-ayrac:Geçmiş sınavlar", "sinav-item:d", "sinav-item:g"]);
  const geri = id => belge.querySelector(`#sinavList [data-id="${id}"] .sinav-geri`).textContent;
  assert.equal(geri("y"), "3 gün kaldı");
  assert.equal(geri("d"), "Dün");
  assert.equal(geri("g"), "4 gün önce");
  // Sadece geçmiş sınav varsa "Yaklaşan sınav yok" yazar, geçmişler yine erişilebilir
  js(`S.sinavlar = S.sinavlar.filter(s => s.id !== "y"); ciz();`);
  assert.match(belge.querySelector("#sinavList > li").textContent, /Yaklaşan sınav yok/);
  assert.equal(belge.querySelectorAll("#sinavList .sinav-item").length, 2);
});

test("ödev listesi: geciken ödevde kaç gün geciktiği yazar", () => {
  const { js, belge, gunEkle } = uygulamaYukle();
  js(`S.odevler = [{ id: "o1", ad: "Rapor", ders: "", tarih: "${gunEkle(-3)}", aciklama: "", done: false },
                   { id: "o2", ad: "Özet", ders: "", tarih: "${gunEkle(1)}", aciklama: "", done: false }]; goView("ac"); ciz();`);
  const geri = id => belge.querySelector(`#odevList [data-id="${id}"] .sinav-geri`).textContent;
  assert.equal(geri("o1"), "3 gün gecikti");
  assert.equal(geri("o2"), "Yarın");
});

test("ödev listesi: geciken ödev kırmızı (odev-acil), yakın sarı, uzak yeşil sınıf alır", () => {
  const { js, belge, gunEkle } = uygulamaYukle();
  js(`S.odevler = [{ id: "a", ad: "A", ders: "", tarih: "${gunEkle(-2)}", aciklama: "", done: false },
                   { id: "b", ad: "B", ders: "", tarih: "${gunEkle(5)}", aciklama: "", done: false },
                   { id: "c", ad: "C", ders: "", tarih: "${gunEkle(20)}", aciklama: "", done: false }]; goView("ac"); ciz();`);
  const sinif = id => belge.querySelector(`#odevList [data-id="${id}"]`).className;
  assert.match(sinif("a"), /odev-acil/);
  assert.match(sinif("b"), /odev-yakin/);
  assert.match(sinif("c"), /odev-uzak/);
});

// ---- Test ajanının bulguları ----

test("iş modu: adı olmayan eski sprint kaydı uygulamanın açılmasını engellemez", () => {
  const { js, belge, hatalar } = uygulamaYukle({ mod: "work" });
  js(`db.users["test"].data = { mode: "work", name: "X", events: {}, sprintGecmis: [{ biten: 3, toplam: 5 }, {}, { ad: 7, biten: "x" }] }; basla(); goView("sprint"); ciz();`);
  assert.deepEqual(JSON.parse(js(`JSON.stringify(S.sprintGecmis.map(s => [s.ad, s.biten, s.toplam]))`)),
    [["Sprint 1", 3, 5], ["Sprint 2", 0, 0], ["7", 0, 0]]);
  assert.deepEqual(hatalar, []);
});

test("iş modu: geçersiz sprint tarihleri yeni sprintle değişir, 'NaN gün' yazmaz", () => {
  const { js, belge } = uygulamaYukle({ mod: "work" });
  js(`db.users["test"].data = { mode: "work", name: "X", events: {}, sprint: { bas: "abc", bit: "xyz", ad: 5 } }; basla(); goView("sprint"); ciz();`);
  assert.ok(js(`tarihGecerli(S.sprint.bas) && tarihGecerli(S.sprint.bit)`));
  assert.equal(js(`typeof S.sprint.ad`), "string");
  assert.doesNotMatch(belge.getElementById("v-sprint").textContent, /NaN/);
  assert.doesNotMatch(belge.getElementById("v-home").textContent, /NaN/);
});

test("not hesaplayıcı: vize ağırlığı %100 iken final boşsa not vizeden gelir", () => {
  const { js } = uygulamaYukle();
  assert.equal(js(`S.vizeOrani = 100; JSON.stringify([nhDersNotu({ vize: "80", final: "" }), nhDersNotu({ vize: 80, final: 0 }), nhDersNotu({ vize: "", final: "" })])`), "[80,80,null]");
  assert.equal(js(`S.vizeOrani = 0; nhDersNotu({ vize: 30, final: 70 })`), 70, "Vize %0 iken sadece final");
});

test("görev: bozuk tamamlanma zamanı 'Invalid Date' göstermez, seriyi bozmaz", () => {
  const { js, belge } = uygulamaYukle();
  js(`db.users["test"].data = { mode: "student", name: "X", events: {}, tasks: [{ id: "t1", t: "a", son: "2026-11-20", zaman: "garbage", bitis: {}, done: true }] }; basla(); goView("tasks"); ciz();`);
  assert.doesNotMatch(belge.body.textContent, /Invalid Date/);
  assert.equal(js(`JSON.stringify([...aktifGunler()])`), "[]");
  assert.equal(js(`seriHesapla().enUzun`), 0);
});

test("tarih kontrolü: takvimde olmayan günler kabul edilmez", () => {
  const { js } = uygulamaYukle();
  assert.equal(js(`JSON.stringify(["2026-02-29", "2028-02-29", "2026-13-45", "2026-04-31", "2026-11-25", "abc"].map(tarihGecerli))`),
    "[false,true,false,false,true,false]");
  const v = js(`JSON.stringify(veriOnar({ mode: "student", name: "X", events: { "2026-13-45": [{ id: "e1", t: "x" }], "2026-11-25": [{ id: "e2", t: "y" }] },
    sinavlar: [{ id: "s1", ad: "A", tarih: "2026-02-30" }, { id: "s2", ad: "B", tarih: "2026-03-01" }] }, "student", "X"))`);
  const o = JSON.parse(v);
  assert.deepEqual(Object.keys(o.events), ["2026-11-25"]);
  assert.deepEqual(o.sinavlar.map(s => s.id), ["s2"]);
});

test("veri onarma: Pomodoro ayarları ve istatistikleri, hedef haftası", () => {
  const { js } = uygulamaYukle();
  const o = JSON.parse(js(`JSON.stringify(veriOnar({ mode: "student", name: "X", events: {},
    pomo: { focus: "abc", short: -5, long: 500, cycle: 3, sound: "<x>", auto: "on", stats: { "2026-11-24": { sayi: "x", dk: 50 }, "bozuk": { sayi: 1 }, "2026-11-23": null } },
    hedefler: [{ id: "h1", baslik: "a", hedef: 3, mevcut: 2, hafta: "garbage" }] }, "student", "X"))`));
  assert.deepEqual([o.pomo.focus, o.pomo.short, o.pomo.long, o.pomo.cycle, o.pomo.sound, o.pomo.auto], [25, 1, 120, 3, "on", "on"]);
  assert.deepEqual(o.pomo.stats, { "2026-11-24": { sayi: 0, dk: 50 } });
  assert.equal(o.hedefler[0].hafta, "");
  // Çizimde bu haftaya atanır, ilerleme korunur
  js(`S = veriOnar(${JSON.stringify({ mode: "student", name: "X", events: {}, hedefler: [{ id: "h1", baslik: "a", hedef: 3, mevcut: 2, hafta: "garbage" }] })}, "student", "X"); hedeflerCiz();`);
  assert.equal(js(`S.hedefler[0].mevcut`), 2);
  assert.equal(js(`S.hedefler[0].hafta === haftaBasiKey()`), true);
});
