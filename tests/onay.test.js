// Uygulama içi onay penceresi (confirm() yerine) ve "Geri al" ile silme testleri.
const test = require("node:test");
const assert = require("node:assert/strict");
const { uygulamaYukle, hepsiniKapat, oku } = require("./yardimci");

test.afterEach(hepsiniKapat);

const tikla = (w, el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
const bekle = () => new Promise(r => setTimeout(r, 0));

test("kodda tarayıcının confirm() / alert() / prompt() kutuları kullanılmıyor", () => {
  // Yorum satırları hariç: bu kutular bazı ortamlarda engellenip işlemi sessizce durduruyordu
  const kod = oku("dashboard.js").split("\n").filter(s => !s.trim().startsWith("//")).join("\n");
  assert.doesNotMatch(kod, /(?<![\w.])(confirm|alert|prompt)\s*\(/);
});

test("onay penceresi: Devam → true, Vazgeç → false, Esc/kapanma → false", async () => {
  const { js, belge, w } = uygulamaYukle();
  const dlg = belge.getElementById("dlgOnay");
  let p = js(`onayIste({ baslik: "Silinsin mi?", mesaj: "Satır 1\\nSatır 2", onay: "Sil", tehlikeli: true })`);
  assert.ok(dlg.hasAttribute("open"), "Pencere açılmadı");
  assert.equal(belge.getElementById("onayBaslik").textContent, "Silinsin mi?");
  assert.equal(belge.getElementById("onayMesaj").textContent, "Satır 1\nSatır 2");
  assert.equal(belge.getElementById("onayEvet").textContent, "Sil");
  assert.equal(belge.getElementById("onayEvet").className, "btn-danger");
  tikla(w, belge.getElementById("onayEvet"));
  assert.equal(await p, true);
  assert.ok(!dlg.hasAttribute("open"), "Pencere kapanmadı");

  p = js(`onayIste({ baslik: "?" })`);
  assert.ok(belge.getElementById("onayMesaj").hidden, "Boş mesaj gizlenmeli");
  tikla(w, belge.getElementById("onayIptal"));
  assert.equal(await p, false);

  p = js(`onayIste({ baslik: "?" })`);
  dlg.close(); // Esc ile kapatma
  assert.equal(await p, false);

  // Üst üste iki soru: ilki "hayır" sayılır, ikincisi cevap bekler
  const p1 = js(`onayIste({ baslik: "1" })`);
  const p2 = js(`onayIste({ baslik: "2" })`);
  assert.equal(await p1, false);
  tikla(w, belge.getElementById("onayEvet"));
  assert.equal(await p2, true);
});

test("ders penceresinden silme: onay sormadan siler, 'Geri al' geri getirir", async () => {
  const { js, belge, w } = uygulamaYukle();
  js(`S.dersler = [{ id: "d1", ad: "Fizik", kod: "", hoca: "", sinif: "", gun: "1", renk: "blue", bas: "09:00", bit: "10:00", notlar: "" },
                   { id: "d2", ad: "Kimya", kod: "", hoca: "", sinif: "", gun: "2", renk: "teal", bas: "09:00", bit: "10:00", notlar: "" }]; ciz();`);
  tikla(w, belge.querySelector('#miniDersGrid .mdg-ders[data-id="d1"]'));
  tikla(w, belge.getElementById("silDers"));
  assert.deepEqual(JSON.parse(js(`JSON.stringify(S.dersler.map(d => d.id))`)), ["d2"]);
  assert.ok(!belge.getElementById("dlgDers").hasAttribute("open"));
  assert.match(belge.getElementById("toastMetin").textContent, /Ders silindi: Fizik/);
  assert.ok(!belge.getElementById("toastGeriAl").hidden);
  tikla(w, belge.getElementById("toastGeriAl"));
  assert.deepEqual(JSON.parse(js(`JSON.stringify(S.dersler.map(d => d.id))`)), ["d1", "d2"], "Aynı sıraya geri gelmeli");
});

test("sınav ve ödev silme de geri alınabilir", () => {
  const { js, belge, w, gunEkle } = uygulamaYukle();
  js(`S.sinavlar = [{ id: "s1", ad: "Vize", tur: "Vize", tarih: "${gunEkle(3)}", saat: "", yer: "", notlar: "" }];
      S.odevler = [{ id: "o1", ad: "Rapor", ders: "", tarih: "${gunEkle(2)}", aciklama: "", done: false }]; ciz();`);
  for (const [liste, dlg, btn, id] of [["sinavlar", "dlgSinav", "silSinav", "s1"], ["odevler", "dlgOdev", "silOdev", "o1"]]) {
    const sil = belge.getElementById(btn);
    if (!sil) continue; // pencerede sil düğmesi yoksa atla
    belge.getElementById(dlg).querySelector("[name=id]").value = id;
    tikla(w, sil);
    assert.equal(js(`S.${liste}.length`), 0, `${liste} silinmedi`);
    tikla(w, belge.getElementById("toastGeriAl"));
    assert.equal(js(`S.${liste}.length`), 1, `${liste} geri gelmedi`);
  }
});

test("tamamlanan görevleri temizle: onay penceresi sorar, Vazgeç bir şey silmez", async () => {
  const { js, belge, w } = uygulamaYukle();
  js(`S.tasks = [{ id: "a", t: "Biten", done: true, p: "mid" }, { id: "b", t: "Açık", done: false, p: "mid" }]; ciz();`);
  tikla(w, belge.getElementById("btnClearDone"));
  assert.ok(belge.getElementById("dlgOnay").hasAttribute("open"));
  assert.match(belge.getElementById("onayMesaj").textContent, /1 tamamlanmış görev/);
  tikla(w, belge.getElementById("onayIptal"));
  await bekle();
  assert.equal(js("S.tasks.length"), 2);
  tikla(w, belge.getElementById("btnClearDone"));
  tikla(w, belge.getElementById("onayEvet"));
  await bekle();
  assert.deepEqual(JSON.parse(js(`JSON.stringify(S.tasks.map(t => t.id))`)), ["b"]);
  // Hiç biten görev yokken pencere açılmaz, bilgi mesajı çıkar
  tikla(w, belge.getElementById("btnClearDone"));
  assert.ok(!belge.getElementById("dlgOnay").hasAttribute("open"));
  assert.match(belge.getElementById("toastMetin").textContent, /Silinecek tamamlanmış görev yok/);
});
