// Ana sayfadaki haftalık ders programı kartının (miniDersGridCiz) ve yardımcılarının testleri.
const test = require("node:test");
const assert = require("node:assert/strict");
const { uygulamaYukle, hepsiniKapat } = require("./yardimci");

test.afterEach(hepsiniKapat);

const ders = (o = {}) => ({ id: "d" + Math.random().toString(36).slice(2, 8), ad: "Ders", kod: "", hoca: "", sinif: "",
  gun: "1", renk: "blue", bas: "09:00", bit: "10:00", notlar: "", ...o });
// Dersleri S'ye koyup kartı yeniden çizer
function kur(js, dersler) {
  js(`S.dersler = ${JSON.stringify(dersler)}; miniDersGridCiz();`);
}

test("ders süresi metni ve süre hesabı", () => {
  const { js } = uygulamaYukle();
  assert.equal(js(`dersSureMetni(45)`), "45 dk");
  assert.equal(js(`dersSureMetni(60)`), "1 sa");
  assert.equal(js(`dersSureMetni(110)`), "1 sa 50 dk");
  assert.equal(js(`dersSureMetni(0)`), "0 dk");
  assert.equal(js(`dersSuresi({ bas: "09:00", bit: "10:50" })`), 110);
  assert.equal(js(`dersSuresi({ bas: "11:00", bit: "10:00" })`), 0, "Bitiş başlangıçtan önceyse süre 0");
});

test("sıradaki ders: derste, gün içinde sonraki, ertesi gün, bir hafta sonra, hiç yok", () => {
  const { js } = uygulamaYukle();
  // 23 Kasım 2026 Pazartesi
  const dersler = JSON.stringify([
    ders({ id: "m", ad: "Mat", gun: "1", bas: "09:00", bit: "10:50" }),
    ders({ id: "f", ad: "Fiz", gun: "1", bas: "13:30", bit: "15:20" }),
    ders({ id: "k", ad: "Kim", gun: "2", bas: "10:15", bit: "11:00" })
  ]);
  const sira = saat => JSON.parse(js(`JSON.stringify((s => s && { id: s.ders.id, ileri: s.ileri, devam: s.devam })(siradakiDers(${dersler}, new Date(2026, 10, ${saat}))))`));
  assert.deepEqual(sira("23, 10, 0"), { id: "m", ileri: 0, devam: true }, "10:00'da Matematik devam ediyor");
  assert.deepEqual(sira("23, 8, 0"), { id: "m", ileri: 0, devam: false });
  assert.deepEqual(sira("23, 10, 50"), { id: "f", ileri: 0, devam: false }, "Biten ders sıradaki sayılmaz");
  assert.deepEqual(sira("23, 16, 0"), { id: "k", ileri: 1, devam: false }, "Gün bitince ertesi güne geçer");
  assert.deepEqual(sira("22, 12, 0"), { id: "m", ileri: 1, devam: false }, "Pazar günü Pazartesi'nin ilk dersi");
  assert.deepEqual(sira("24, 12, 0"), { id: "m", ileri: 6, devam: false }, "Salı öğleden sonra: gelecek Pazartesi");
  const tekDers = JSON.stringify([ders({ id: "t", gun: "1", bas: "09:00", bit: "10:00" })]);
  assert.equal(js(`siradakiDers(${tekDers}, new Date(2026, 10, 23, 12, 0)).ileri`), 7, "Haftada tek ders: gelecek haftaya bakılır");
  assert.equal(js(`siradakiDers([], new Date())`), null);
});

test("ders yoksa kart boş tablo yerine 'İlk dersini ekle' gösterir", () => {
  const { js, belge } = uygulamaYukle();
  kur(js, []);
  const el = belge.getElementById("miniDersGrid");
  assert.ok(el.classList.contains("mdg-bos"));
  assert.ok(el.querySelector('[data-open="dlgDers"]'), "Ders ekleme düğmesi yok");
  assert.equal(el.querySelector(".mdg-hafta"), null);
});

test("kart: günler, sıralama, ayrıntılar ve haftalık toplam", () => {
  const { js, belge, hatalar } = uygulamaYukle();
  kur(js, [
    ders({ id: "b", ad: "Fizik", gun: "1", bas: "13:30", bit: "15:20", sinif: "Lab-2", hoca: "Prof. T.", notlar: "Rapor" }),
    ders({ id: "a", ad: "Matematik", gun: "1", bas: "09:00", bit: "10:50" }),
    ders({ id: "c", ad: "Kimya", gun: "3", bas: "10:15", bit: "11:00" })
  ]);
  const el = belge.getElementById("miniDersGrid");
  const gunler = [...el.querySelectorAll(".mdg-gun")];
  assert.equal(gunler.length, 5, "Hafta sonu dersi yoksa sadece hafta içi görünür");
  assert.equal(el.querySelector(".mdg-hafta").style.getPropertyValue("--gun-sayi"), "5");
  const pzt = gunler[0];
  assert.match(pzt.querySelector(".mdg-head").textContent, /Pzt/);
  assert.match(pzt.querySelector(".mdg-head small").textContent, /3 sa 40 dk/, "Günün toplam süresi");
  assert.deepEqual([...pzt.querySelectorAll(".mdg-ad")].map(x => x.textContent.trim().replace(/\s*📝$/, "")), ["Matematik", "Fizik"], "Saat sırası");
  const fizik = pzt.querySelector('[data-id="b"]');
  assert.match(fizik.querySelector(".mdg-saat").textContent, /13:30–15:20/);
  assert.match(fizik.querySelector(".mdg-yer").textContent, /Lab-2 · Prof\. T\./);
  assert.ok(fizik.querySelector(".mdg-not"), "Notu olan derste 📝 işareti");
  assert.match(fizik.title, /Not: Rapor/);
  assert.equal(gunler[1].querySelector(".mdg-gun-bos").textContent, "Ders yok");
  assert.match(el.querySelector(".mdg-alt").textContent, /3 ders · 4 sa 25 dk/);
  assert.ok(el.querySelector(".mdg-sira"), "Şu an / sıradaki şeridi");
  assert.deepEqual(hatalar, []);
});

test("kart: hafta sonu dersi varsa o gün eklenir, tarih numaraları haftayla uyumlu", () => {
  const { js, belge } = uygulamaYukle();
  kur(js, [ders({ gun: "0", ad: "Pazar Kursu" }), ders({ gun: "1" })]);
  const basliklar = [...belge.querySelectorAll("#miniDersGrid .mdg-head")].map(h => h.textContent);
  assert.equal(basliklar.length, 6, "Pazar eklenir, Cumartesi eklenmez");
  assert.match(basliklar[5], /Paz/);
  const gunNo = [...belge.querySelectorAll("#miniDersGrid .mdg-head b")].map(b => +b.textContent);
  const pzt = js(`(() => { const d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getDate(); })()`);
  assert.equal(gunNo[0], pzt, "İlk sütun bu haftanın Pazartesisi");
  const pazar = js(`(() => { const d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7 + 6); return d.getDate(); })()`);
  assert.equal(gunNo[5], pazar, "Pazar sütunu haftanın son günü");
});

test("kart: arama hoca ve sınıfta da eşleşir, özet tüm dersleri sayar", () => {
  const { js, belge } = uygulamaYukle();
  kur(js, [ders({ id: "x", ad: "Algoritma", hoca: "Dr. Can" }), ders({ id: "y", ad: "Tarih", sinif: "B-3" })]);
  js(`q = aramaNorm("can"); miniDersGridCiz();`);
  const ids = () => [...belge.querySelectorAll("#miniDersGrid .mdg-ders")].map(d => d.dataset.id);
  assert.deepEqual(ids(), ["x"]);
  js(`q = aramaNorm("b-3"); miniDersGridCiz();`);
  assert.deepEqual(ids(), ["y"]);
  assert.match(belge.querySelector("#miniDersGrid .mdg-alt").textContent, /2 ders/);
  js(`q = ""; miniDersGridCiz();`);
  assert.equal(ids().length, 2);
});

test("kart: derse tıklayınca düzenleme penceresi o dersin bilgileriyle açılır", () => {
  const { js, belge, w } = uygulamaYukle();
  kur(js, [ders({ id: "z", ad: "Biyoloji", hoca: "Dr. A", bas: "11:00", bit: "12:30" })]);
  belge.querySelector('#miniDersGrid .mdg-ders[data-id="z"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  const dlg = belge.getElementById("dlgDers");
  assert.ok(dlg.hasAttribute("open"), "Pencere açılmadı");
  assert.equal(dlg.querySelector("[name=ad]").value, "Biyoloji");
  assert.equal(dlg.querySelector("[name=bas]").value, "11:00");
  assert.equal(dlg.querySelector("[name=id]").value, "z");
});

test("güvenlik: ders metinleri HTML olarak çalışmaz", () => {
  const { js, belge } = uygulamaYukle();
  const kotu = `<img src=x onerror="window.__xss=1">`;
  kur(js, [ders({ ad: kotu, kod: kotu, hoca: kotu, sinif: kotu, notlar: `"><b>x</b>` })]);
  const el = belge.getElementById("miniDersGrid");
  assert.equal(el.querySelector("img[src=x]"), null, "Metinden <img> öğesi oluştu");
  assert.equal(el.querySelector(".mdg-ders b, .mdg-sira b"), null, "Not metninden <b> öğesi oluştu");
  assert.match(el.querySelector(".mdg-ad").textContent, /<img src=x/);
});

test("güvenlik: bozuk renk değeri veri onarmada temizlenir (nitelik içine kaçışsız yazılıyor)", () => {
  const { js, belge } = uygulamaYukle();
  const v = JSON.stringify({ dersler: [ders({ id: "r", renk: `blue" onmouseover="window.__xss=1` })] });
  js(`S = veriOnar(${v}, "student", "Test"); miniDersGridCiz(); haftalikGridCiz();`);
  assert.equal(belge.querySelector("[onmouseover]"), null, "Renk alanı yeni bir HTML niteliği oluşturdu");
});

test("güvenlik: bozuk bildirim türü veri onarmada temizlenir (nitelik içine kaçışsız yazılıyor)", () => {
  const { js, belge } = uygulamaYukle();
  const v = JSON.stringify({ notifications: [{ tip: `x" onmouseover="window.__xss=1`, baslik: "a", mesaj: "b", okundu: false, zaman: Date.now() }] });
  js(`S = veriOnar(${v}, "student", "Test"); bildirimCiz();`);
  assert.equal(belge.querySelector("[onmouseover]"), null, "Bildirim türü yeni bir HTML niteliği oluşturdu");
});

test("güvenlik: hedef sayıları HTML olarak çalışmaz", () => {
  const { js, belge } = uygulamaYukle();
  const v = JSON.stringify({ hedefler: [{ id: "h1", baslik: "a", hedef: "<img src=x id=kanit1>", mevcut: "<img src=x id=kanit2>" }] });
  js(`S = veriOnar(${v}, "student", "Test"); hedeflerCiz();`);
  assert.equal(belge.querySelectorAll("#kanit1, #kanit2").length, 0);
});

test("güvenlik: beceri yüzdesi ve YKS netleri HTML olarak çalışmaz, sayıya çevrilir", () => {
  const { js, belge } = uygulamaYukle();
  const v = JSON.stringify({
    skills: [{ id: "s1", n: "Excel", p: "<img src=x id=kanit1>" }, { id: "s2", n: "Python", p: 150 }],
    yksDenemeleri: [{ id: "y1", ad: "Deneme", tarih: "2026-11-01", tyt: "<img src=x id=kanit2>", ayt: "62.5" }]
  });
  js(`S = veriOnar(${v}, "student", "Test"); ciz();`);
  assert.equal(belge.querySelectorAll("#kanit1, #kanit2").length, 0);
  assert.deepEqual(JSON.parse(js(`JSON.stringify([S.skills.map(s => s.p), S.yksDenemeleri[0].tyt, S.yksDenemeleri[0].ayt])`)), [[50, 100], 0, 62.5]);
});

test("veri onarma: geçerli renk, gün, bildirim türü ve hedef sayıları korunur", () => {
  const { js } = uygulamaYukle();
  const v = JSON.stringify({
    dersler: [ders({ id: "a", renk: "pink", gun: "0" }), ders({ id: "b", renk: "mor", gun: "9" })],
    notifications: [{ tip: "success", baslik: "a", mesaj: "b" }, { tip: "kotu", baslik: "a", mesaj: "b" }],
    hedefler: [{ id: "h1", baslik: "a", hedef: 5, mevcut: 3 }, { id: "h2", baslik: "b", hedef: 2, mevcut: 9 }]
  });
  js(`S = veriOnar(${v}, "student", "Test");`);
  const s = JSON.parse(js(`JSON.stringify({ d: S.dersler.map(d => [d.renk, d.gun]), n: S.notifications.map(n => n.tip), h: S.hedefler.map(h => [h.hedef, h.mevcut]) })`));
  assert.deepEqual(s.d, [["pink", "0"], ["blue", "1"]]);
  assert.deepEqual(s.n, ["success", "info"]);
  assert.deepEqual(s.h, [[5, 3], [2, 2]], "Mevcut, hedefi aşamaz");
});

test("paylaşılan proje: geçersiz tarih boş sayılır, geçerli tarih gösterilir", async () => {
  const { js, belge, w } = uygulamaYukle();
  const p = { ad: "Proje", bitis: "yarın", gorevler: [{ t: "Tasarım", son: "2026-12-05" }, { t: "Kod", son: "olmaz" }], toplantilar: "bozuk" };
  w.AYVEX_BULUT = { paylasimOku: async () => ({ veri: JSON.stringify(p) }) };
  await js(`paylasimSayfasiAc("abcdefghij1234567890")`);
  const metin = belge.getElementById("paylasimIcerik").textContent;
  assert.match(metin, /Teslim tarihi yok/);
  assert.match(metin, /5 Aralık 2026/);
  assert.doesNotMatch(metin, /NaN|undefined/);
});

test("güvenlik: paylaşılan proje sayfasında tarih alanları HTML olarak çalışmaz", async () => {
  const { js, belge, w } = uygulamaYukle();
  const yuk = "<img src=x id=kanit>";
  const p = { ad: "Proje", bitis: yuk, gorevler: [{ t: "g", son: yuk }], toplantilar: [{ baslik: "T", tarih: yuk }] };
  w.AYVEX_BULUT = { paylasimOku: async () => ({ veri: JSON.stringify(p) }) };
  await js(`paylasimSayfasiAc("abcdefghij1234567890")`);
  assert.equal(belge.querySelectorAll("#paylasimIcerik #kanit").length, 0, "Başkasının paylaşımı sayfaya HTML enjekte edebiliyor");
});

test("veri onarma: geçersiz saatli dersler atılır, kart hatasız çizilir", () => {
  const { js, belge, hatalar } = uygulamaYukle();
  const v = JSON.stringify({ dersler: [ders({ id: "ok" }), ders({ id: "kotu", bas: "sabah" }), ders({ id: "bos", bit: null })] });
  js(`S = veriOnar(${v}, "student", "Test"); miniDersGridCiz();`);
  assert.deepEqual(JSON.parse(js(`JSON.stringify(S.dersler.map(d => d.id))`)), ["ok"]);
  assert.equal(belge.querySelectorAll("#miniDersGrid .mdg-ders").length, 1);
  assert.deepEqual(hatalar, []);
});

test("ders formu: bitiş başlangıçtan önce olamaz; doğru form dersi ekler ve kart güncellenir", () => {
  const { js, belge, w } = uygulamaYukle();
  kur(js, []);
  const f = belge.querySelector('form[data-form="ders"]');
  const doldur = (o) => Object.entries(o).forEach(([k, v]) => { f.querySelector(`[name=${k}]`).value = v; });
  doldur({ ad: "Felsefe", gun: "2", bas: "14:00", bit: "13:00" });
  f.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  assert.equal(js("S.dersler.length"), 0, "Geçersiz saatli ders eklendi");
  doldur({ bit: "15:30", sinif: "D-1" });
  f.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  assert.equal(js("S.dersler.length"), 1);
  const kart = belge.querySelector("#miniDersGrid .mdg-ders");
  assert.ok(kart, "Kart yeni dersi göstermiyor");
  assert.match(kart.textContent, /Felsefe/);
  assert.match(kart.textContent, /14:00–15:30/);
});
