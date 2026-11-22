// Uygulama işlevlerinin testleri: uygulama jsdom içinde yerel bir test hesabıyla açılır.
const test = require("node:test");
const assert = require("node:assert/strict");
const { uygulamaYukle, hepsiniKapat } = require("./yardimci");

test.afterEach(hepsiniKapat);

test("uygulama hatasız açılıyor ve ana ekran çiziliyor", () => {
  const { js, belge, hatalar } = uygulamaYukle();
  assert.equal(js("typeof S"), "object");
  assert.ok(belge.getElementById("bugunStatlar").children.length >= 4, "Bugün kartındaki sayılar çizilmedi");
  assert.deepEqual(hatalar, []);
});

test("İş modunda da uygulama hatasız açılıyor", () => {
  const { js, hatalar } = uygulamaYukle({ mod: "work" });
  assert.equal(js("S.mode"), "work");
  assert.deepEqual(hatalar, []);
});

test("tekrarlayan görev tarihleri: günlük, haftalık, aylık (ayın günü korunur)", () => {
  const { js } = uygulamaYukle();
  assert.equal(js(`tekrarIleri("2026-03-10", "gunluk")`), "2026-03-11");
  assert.equal(js(`tekrarIleri("2026-12-28", "haftalik")`), "2027-01-04");
  assert.equal(js(`tekrarIleri("2026-01-31", "aylik", 31)`), "2026-02-28");
  assert.equal(js(`tekrarIleri("2026-02-28", "aylik", 31)`), "2026-03-31");
  assert.equal(js(`tekrarIleri("2024-01-31", "aylik", 31)`), "2024-02-29"); // artık yıl
});

test("tekrarlayan görev tamamlanınca sıradaki eklenir, geri alınınca silinir", () => {
  const { js, gunEkle } = uygulamaYukle();
  js(`S.tasks.push({ id: "r1", t: "Haftalık rapor", done: false, doing: false, p: "mid", son: "${gunEkle(-10)}", tekrar: "haftalik",
       alt: [{ id: "a", t: "Veri topla", done: true }] }); gorevTamamla(S.tasks.find(t => t.id === "r1"), true);`);
  const kopya = JSON.parse(js(`JSON.stringify(S.tasks.find(t => t.id === S.tasks.find(x => x.id === "r1").sonraki))`));
  assert.ok(kopya.son >= js("todayKey"), "Sıradaki tarih geçmişte olmamalı");
  assert.equal(kopya.tekrar, "haftalik");
  assert.deepEqual(kopya.alt.map(a => [a.t, a.done]), [["Veri topla", false]], "Alt görevler işaretsiz taşınmalı");
  js(`gorevTamamla(S.tasks.find(t => t.id === "r1"), false)`);
  assert.equal(js(`S.tasks.filter(t => t.t === "Haftalık rapor").length`), 1);
});

test("not hesaplayıcı: ders notu ve harf notu", () => {
  const { js } = uygulamaYukle();
  js(`S.vizeOrani = 40`);
  assert.equal(js(`nhDersNotu({ vize: 70, final: 90 })`), 82);
  assert.equal(js(`nhDersNotu({ vize: "", final: 50 })`), 30);
  assert.equal(js(`nhDersNotu({ vize: 80, final: "" })`), null, "Final yoksa not belli değil");
  const harf = n => js(`nhHarf(${n})[1]`);
  assert.equal(harf(90), "AA"); assert.equal(harf(89), "BA"); assert.equal(harf(80), "BB");
  assert.equal(harf(65), "CC"); assert.equal(harf(50), "DD"); assert.equal(harf(40), "FD"); assert.equal(harf(39), "FF");
});

test("takvim dosyası (.ics) geçerli ve satırlar 75 baytı aşmıyor", () => {
  const { js, gunEkle } = uygulamaYukle();
  js(`S.sinavlar.push({ id: "s1", ad: "Kimya; Final, bölüm 1", tur: "Final", tarih: "${gunEkle(5)}", saat: "10:00", yer: "B-201", notlar: "" });
      S.tasks.push({ id: "t1", t: "Tarihli iş", done: false, p: "mid", son: "${gunEkle(2)}" });
      S.dersler.push({ id: "d1", ad: "Matematik", kod: "MAT101", hoca: "", sinif: "A-1", gun: "1", renk: "blue", bas: "09:00", bit: "10:50", notlar: "" });
      S.tasks.push({ id: "t2", t: "${"Çok uzun görev adı ".repeat(12)}", done: false, p: "mid", son: "${gunEkle(3)}" });`);
  const { metin, sayi } = JSON.parse(js(`JSON.stringify(takvimDosyasi())`));
  assert.equal(sayi, 4);
  assert.ok(metin.startsWith("BEGIN:VCALENDAR\r\n") && metin.trimEnd().endsWith("END:VCALENDAR"));
  assert.ok(metin.includes("Kimya\\; Final\\, bölüm 1"), "Özel karakterler kaçırılmalı");
  assert.ok(/RRULE:FREQ=WEEKLY;BYDAY=MO/.test(metin), "Ders haftalık tekrarlanmalı");
  assert.ok(metin.includes("SUMMARY:📌 Tarihli iş"));
  const uzun = metin.split("\r\n").filter(s => Buffer.byteLength(s, "utf8") > 75);
  assert.deepEqual(uzun, []);
});

test("seri: ardışık aktif günler sayılır, bugün boşsa dünden başlar", () => {
  const { js, gunEkle } = uygulamaYukle();
  js(`[1, 2, 3].forEach(n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12);
        S.tasks.push({ id: "b" + n, t: "Bitti " + n, done: true, p: "mid", bitis: d.toISOString() }); });`);
  let s = JSON.parse(js("JSON.stringify(seriHesapla())"));
  assert.equal(s.seri, 3); assert.equal(s.bugunAktif, false);
  js(`S.pomo.stats[todayKey] = { sayi: 1, dk: 25 }`);
  s = JSON.parse(js("JSON.stringify(seriHesapla())"));
  assert.equal(s.seri, 4); assert.equal(s.bugunAktif, true);
  assert.ok(gunEkle(0));
});

test("bugünün akışı: saatliler saat sırasıyla önce, gecikmiş görevler sonra", () => {
  const { js, gunEkle } = uygulamaYukle();
  js(`S.dersler.push({ id: "x1", ad: "Fizik", gun: String(bugunGunNo), bas: "13:00", bit: "14:00", renk: "blue" },
                     { id: "x2", ad: "Matematik", gun: String(bugunGunNo), bas: "09:00", bit: "10:00", renk: "blue" });
      S.tasks.push({ id: "g1", t: "Gecikmiş iş", done: false, p: "mid", son: "${gunEkle(-2)}" },
                   { id: "g2", t: "Yarınki iş", done: false, p: "mid", son: "${gunEkle(1)}" });`);
  const akis = JSON.parse(js(`JSON.stringify(bugunAkisi().map(o => o.baslik))`));
  assert.deepEqual(akis, ["Matematik", "Fizik", "Gecikmiş iş"]);
});

test("son tarih rozeti: gecikti / bugün / yarın / ileri tarih", () => {
  const { js, gunEkle } = uygulamaYukle();
  const rozet = son => js(`gorevSonEtiketi({ son: "${son}", done: false })`);
  assert.match(rozet(gunEkle(-1)), /gecikti/);
  assert.match(rozet(gunEkle(0)), /Son gün: bugün/);
  assert.match(rozet(gunEkle(1)), /Son gün: yarın/);
  assert.match(rozet(gunEkle(10)), /Son: /);
});

test("veri onarma: bozuk alanlar temizlenir", () => {
  const { js } = uygulamaYukle();
  const v = JSON.parse(js(`JSON.stringify(veriOnar({
    mode: "student", events: {}, tasks: [{ t: "a", son: "yanlış", tekrar: "her saniye", alt: "x", odakDk: -5 }, null],
    notHesap: [{ ad: 5, kredi: 99, vize: 150, final: "abc" }],
    yksKonu: { "tyt|Matematik|Kümeler": "bitti", "tyt|Matematik|Mantık": "uydurma" }, yksAlan: "yok"
  }, "student", "Test"))`));
  assert.equal(v.tasks.length, 1);
  assert.equal(v.tasks[0].son, ""); assert.equal(v.tasks[0].tekrar, "");
  assert.deepEqual(v.tasks[0].alt, []); assert.equal(v.tasks[0].odakDk, undefined);
  assert.deepEqual(v.notHesap[0], { ad: "5", kredi: 30, vize: 100, final: "", id: v.notHesap[0].id });
  assert.deepEqual(v.yksKonu, { "tyt|Matematik|Kümeler": "bitti" });
  assert.equal(v.yksAlan, "say");
});

test("YKS konu takibi: ilerleme ve alan filtresi", () => {
  const { js } = uygulamaYukle();
  js(`S.yksKonu = { "tyt|Matematik|Kümeler": "bitti", "tyt|Matematik|Mantık": "tekrar", "tyt|Matematik|Problemler": "calisiyor" }`);
  const i = JSON.parse(js(`JSON.stringify(ykIlerleme("tyt", "Matematik"))`));
  assert.deepEqual({ bitti: i.bitti, tekrar: i.tekrar, calisiyor: i.calisiyor }, { bitti: 1, tekrar: 1, calisiyor: 1 });
  js(`S.yksAlan = "soz"`);
  assert.deepEqual(JSON.parse(js(`JSON.stringify(ykDersler("ayt"))`)), ["Edebiyat", "Tarih", "Coğrafya", "Felsefe Grubu"]);
});

test("görev formu: boş ad eklenmez, dolu ad eklenir", () => {
  const { js, belge } = uygulamaYukle();
  const form = [...belge.querySelectorAll('form[data-form="task-quick"]')][1];
  const once = js("S.tasks.length");
  form.querySelector("[name=t]").value = "   ";
  form.dispatchEvent(new belge.defaultView.Event("submit", { cancelable: true, bubbles: true }));
  assert.equal(js("S.tasks.length"), once, "Sadece boşluktan oluşan görev eklenmemeli");
  form.querySelector("[name=t]").value = "Yeni görev ğüşıöç";
  form.querySelector("[name=son]").value = "2030-01-01";
  form.dispatchEvent(new belge.defaultView.Event("submit", { cancelable: true, bubbles: true }));
  assert.equal(js("S.tasks.length"), once + 1);
  assert.equal(js("S.tasks[S.tasks.length - 1].t"), "Yeni görev ğüşıöç");
  assert.equal(js("S.tasks[S.tasks.length - 1].son"), "2030-01-01");
});
