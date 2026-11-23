console.log("[AYVEX] v23 bulut senkronizasyonu + yedekleme");

const MODLAR = {
  student: { rol: "Öğrenci", ac: "Akademik", acSub: "Dersler  Sınavlar", caSub: "Stajlar  İşler", acBaslik: "Akademik Genel Bakış",
    tur: ["Ders", "Etkinlik", "Ödev"], isim: "Ders adı", deger: "Not (0-100)", jobs: "Önerilen Stajlar", sub: "Bugün harika bir gün olacak!" },
  work: { rol: "Çalışan", ac: "Projeler", acSub: "Projeler  Teslimler", caSub: "Hedefler  Fırsatlar", acBaslik: "Projelerim",
    tur: ["Toplantı", "Etkinlik", "Görev"], isim: "Proje adı", deger: "İlerleme (%)", jobs: "Fırsatlar & Başvurular", sub: "Bugün harika bir gün olacak!" },
};
const sinif = { Ders: "course", Toplantı: "course", Etkinlik: "event", Ödev: "hw", Görev: "hw" };
const ONCELIK = { low: "Düşük", mid: "Orta", high: "Yüksek" };
const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const GUNLER_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

const aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const gunlerKisa = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
const renkler = ["#2bb8a8","#f0b840","#7c5cf0","#ff6b5b","#2fbf7f","#1d5e72","#d97706","#e8585a"];
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const key = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const gunEtiket = k => { const [y, m, d] = k.split("-"); return `${+d} ${aylar[+m - 1]} ${y}`; };
const saatDk = s => { const [h, m] = (s || "00:00").split(":"); return (+h || 0) * 60 + (+m || 0); };
// Kayıt kimliği: sadece harf, rakam, - ve _ (HTML niteliklerine güvenle yazılabilsin)
const guvenliId = id => typeof id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(id);
// "YYYY-MM-DD" metnini YEREL gece yarısı olarak okur. (new Date("2026-01-05") UTC olarak okunur
// ve bazı saat dilimlerinde bir gün kaymaya yol açar.)
const tarihOku = s => {
  const [y, m, d] = String(s || "").split("-").map(Number);
  return (y && m && d) ? new Date(y, m - 1, d) : new Date(NaN);
};
const GUN_MS = 864e5;
// Bugünden hedef tarihe kaç gün kaldığı (negatif = geçmiş). Geçersiz tarihte NaN döner.
const gunFarki = s => {
  const b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.round((tarihOku(s) - b) / GUN_MS);
};
const tarihKey = dt => key(dt.getFullYear(), dt.getMonth(), dt.getDate());

const now = new Date();
const todayKey = key(now.getFullYear(), now.getMonth(), now.getDate());
const yarin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
const yarinKey = key(yarin.getFullYear(), yarin.getMonth(), yarin.getDate());
const bugunGunNo = now.getDay();

const AVATARLAR = [
  { ikon: "av-book",      renk: "a0" },
  { ikon: "av-star",      renk: "a1" },
  { ikon: "av-heart",     renk: "a2" },
  { ikon: "av-lightning", renk: "a3" },
  { ikon: "av-moon",      renk: "a4" },
  { ikon: "av-mountain",  renk: "a5" },
  { ikon: "av-target",    renk: "a6" },
  { ikon: "av-code",      renk: "a7" },
];
function avatarHTML(i) {
  const a = AVATARLAR[i] || AVATARLAR[0];
  return `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><use href="#${a.ikon}"/></svg>`;
}
function avatarRenkUygula(el, i) {
  if (!el) return;
  el.classList.remove("a0","a1","a2","a3","a4","a5","a6","a7");
  el.classList.add(AVATARLAR[i] ? AVATARLAR[i].renk : "a0");
}

const POMO_DEFAULTS = { focus: 25, short: 5, long: 15, cycle: 4, sound: "on", auto: "off" };

function yeniVeri(mod, name) {
  return {
    mode: mod,
    name: name || (mod === "work" ? "Kullanıcı" : "Öğrenci"),
    avatar: 0,
    events: {}, courses: [], deadlines: [], jobs: [], skills: [], tasks: [], notes: [], links: [],
    notifications: [],
    taskFilter: "all",
    dersler: [],
    hedefler: [],
    planItems: [],
    toplantilar: [],
    sinavlar: [],
    odevler: [],
    yksDenemeleri: [],
    basvurular: [],
    kurslar: [],
    kariyerHedefler: [],
    notHesap: [], // not ortalaması hesaplayıcı: { id, ad, kredi, vize, final } (notlar boş olabilir)
    vizeOrani: 40,
    // İş modu
    projeler: [],
    sprintIsleri: [],
    sprintGecmis: [],
    sprint: yeniSprint(1),
    pomo: { ...POMO_DEFAULTS, stats: {}, bind: null },
  };
}
// Bu haftanın pazartesisinden başlayan 2 haftalık varsayılan sprint
function yeniSprint(no, basTarih) {
  const bas = basTarih ? tarihOku(basTarih) : (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()));
    return d;
  })();
  const bit = new Date(bas); bit.setDate(bas.getDate() + 13);
  return { no, ad: `Sprint ${no}`, bas: tarihKey(bas), bit: tarihKey(bit), hedef: "", kapasite: 20 };
}
const DB_KEY = "planla-v3";
const DIZI = ["notHesap", "courses", "deadlines", "jobs", "skills", "tasks", "links", "notes", "notifications", "dersler", "hedefler", "planItems", "toplantilar", "sinavlar", "odevler", "yksDenemeleri", "basvurular", "kurslar", "kariyerHedefler", "projeler", "sprintIsleri", "sprintGecmis"];
const gecerli = v => v && MODLAR[v.mode] && typeof v.name === "string" && v.events && typeof v.events === "object" && DIZI.every(k => Array.isArray(v[k]));
// Eski sürümlerden kalan veride eksik alanları tamamlar. Doğrulamadan ÖNCE çalışmalı;
// aksi halde yeni eklenen bir dizi alanı yüzünden eski kullanıcının tüm verisi silinir.
function veriOnar(v, tur, ad) {
  if (!v || typeof v !== "object") return null;
  if (!MODLAR[v.mode]) v.mode = MODLAR[tur] ? tur : "student";
  if (typeof v.name !== "string" || !v.name) v.name = ad || "Öğrenci";
  if (!v.events || typeof v.events !== "object" || Array.isArray(v.events)) v.events = {};
  // Dizileri ve içlerindeki kayıtları onar: bozuk bir yedek (ör. tasks:[null] ya da tarihi
  // eksik sınav) çizimi çökertip hesabı kalıcı olarak bozuyordu.
  DIZI.forEach(k => {
    v[k] = Array.isArray(v[k]) ? v[k].filter(x => x && typeof x === "object" && !Array.isArray(x)) : [];
    if (k !== "notifications") v[k].forEach(x => { if (!guvenliId(x.id)) x.id = uid(); });
  });
  // Kayıtlar arası bağlantılar da güvenli kimlik olmalı (kimlikler HTML niteliklerine kaçışsız yazılıyor;
  // elle değiştirilmiş bir yedekteki tırnak işaretli bir kimlik sayfaya kod sızdırabilirdi)
  ["tasks", "sprintIsleri", "toplantilar"].forEach(k => v[k].forEach(x => { if (x.proje && !guvenliId(x.proje)) x.proje = ""; }));
  v.tasks.forEach(t => { if (t.sonraki != null && !guvenliId(t.sonraki)) delete t.sonraki; });
  if (v.pomo && v.pomo.bind && !guvenliId(v.pomo.bind.id)) v.pomo.bind = null;
  const tarihMi = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const saatMi = s => typeof s === "string" && /^\d{1,2}:\d{2}$/.test(s);
  const metin = (x, alan) => { if (typeof x[alan] !== "string") x[alan] = x[alan] == null ? "" : String(x[alan]); };
  ["sinavlar", "odevler", "yksDenemeleri", "toplantilar"].forEach(k => { v[k] = v[k].filter(x => tarihMi(x.tarih)); });
  v.deadlines = v.deadlines.filter(x => tarihMi(x.d));
  v.dersler = v.dersler.filter(x => saatMi(x.bas) && saatMi(x.bit));
  // Ekranda gösterilen metin alanları eksikse "undefined" yazmasın
  const METIN_ALANLARI = {
    tasks: ["t"], courses: ["n"], deadlines: ["t"], jobs: ["n"], skills: ["n"], dersler: ["ad"],
    hedefler: ["baslik"], planItems: ["baslik"], toplantilar: ["baslik"], sinavlar: ["ad"], odevler: ["ad"],
    yksDenemeleri: ["ad"], basvurular: ["sirket", "pozisyon"], kurslar: ["ad"], kariyerHedefler: ["baslik"],
    projeler: ["ad"], sprintIsleri: ["baslik"],
  };
  Object.entries(METIN_ALANLARI).forEach(([k, alanlar]) => v[k].forEach(x => alanlar.forEach(a => metin(x, a))));
  v.sinavlar.forEach(s => { if (!s.tur) s.tur = "Vize"; });
  v.projeler.forEach(p => { if (p.bitis && !tarihMi(p.bitis)) p.bitis = ""; });
  v.planItems.forEach(p => { if (!saatMi(p.saat)) p.saat = "09:00"; });
  Object.keys(v.events).forEach(gun => {
    if (!tarihMi(gun) || !Array.isArray(v.events[gun])) { delete v.events[gun]; return; }
    v.events[gun] = v.events[gun].filter(e => e && typeof e === "object");
    v.events[gun].forEach(e => {
      metin(e, "t");
      if (!saatMi(e.time)) e.time = "00:00";
      if (typeof e.type !== "string" || !e.type) e.type = "Etkinlik";
      if (!guvenliId(e.id)) e.id = uid();
    });
  });
  if (typeof v.avatar !== "number") v.avatar = 0;
  if (typeof v.vizeOrani !== "number" || !(v.vizeOrani >= 0 && v.vizeOrani <= 100)) v.vizeOrani = 40;
  // YKS konu takibi: { "sinav|ders|konu": "calisiyor" | "bitti" | "tekrar" }
  if (!v.yksKonu || typeof v.yksKonu !== "object" || Array.isArray(v.yksKonu)) v.yksKonu = {};
  Object.keys(v.yksKonu).forEach(k => { if (!["calisiyor", "bitti", "tekrar"].includes(v.yksKonu[k])) delete v.yksKonu[k]; });
  if (!["say", "ea", "soz"].includes(v.yksAlan)) v.yksAlan = "say";
  v.notHesap.forEach(n => {
    metin(n, "ad");
    n.kredi = Math.min(30, Math.max(0, +n.kredi || 0));
    ["vize", "final"].forEach(a => { n[a] = n[a] === "" || n[a] == null || isNaN(+n[a]) ? "" : Math.min(100, Math.max(0, +n[a])); });
  });
  if (!v.taskFilter) v.taskFilter = "all";
  if (!v.pomo || typeof v.pomo !== "object") v.pomo = { ...POMO_DEFAULTS, stats: {}, bind: null };
  if (!v.pomo.stats || typeof v.pomo.stats !== "object") v.pomo.stats = {};
  v.tasks.forEach(t => {
    if (typeof t.doing !== "boolean") t.doing = false;
    if (t.son && !tarihMi(t.son)) t.son = "";
    if (t.tekrar && !["gunluk", "haftalik", "aylik"].includes(t.tekrar)) t.tekrar = "";
    if (t.tekrarGun != null && !(+t.tekrarGun >= 1 && +t.tekrarGun <= 31)) delete t.tekrarGun;
    if (t.alt != null) {
      t.alt = Array.isArray(t.alt) ? t.alt.filter(a => a && typeof a === "object") : [];
      t.alt.forEach(a => { metin(a, "t"); a.done = !!a.done; if (!guvenliId(a.id)) a.id = uid(); });
    }
    if (t.odakDk != null && !(+t.odakDk >= 0)) delete t.odakDk;
  });
  if (!v.sprint || typeof v.sprint !== "object" || !v.sprint.bas || !v.sprint.bit) v.sprint = yeniSprint(1);
  return v;
}
function dbOku() {
  try {
    const v = JSON.parse(localStorage.getItem(DB_KEY));
    if (v && v.users && typeof v.users === "object") return v;
  } catch (e) {}
  return { users: {}, aktif: null };
}
let db = dbOku();
let S = null;
function dbYaz() { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {} }
let kaydetZamani;
function kaydet() {
  if (!S) return;
  clearTimeout(kaydetZamani);
  kaydetZamani = setTimeout(dbYaz, 150);
  bulutKaydetPlanla();
}
addEventListener("pagehide", () => { if (S) { dbYaz(); bulutKaydetHemen(); } });

// ================= BULUT (Google hesabı) =================
// Google ile giriş yapan hesaplar db.users içinde "g:<uid>" anahtarıyla tutulur;
// localStorage'daki kopya önbellektir, asıl kayıt Firestore'dadır (bulut.js).
// Yerel (kullanıcı adı + şifre) hesaplar: veriler tarayıcıda şifrelenmeden durduğu için
// gerçek bir koruma sağlamıyor. Güvenli bir yöntemle değiştirilene kadar kapalı.
// Kapalıyken eski yerel hesaplar silinmez: Google ile ilk girişte buluta aktarılabilir
// ya da giriş ekranından şifreyle yedekleri indirilebilir.
const YEREL_GIRIS_AKTIF = false;
const girisMesaji = t => { if ($("authMsgUst")) $("authMsgUst").textContent = t; };

const BULUT_ONEK = "g:";
const bulutHesabiMi = id => typeof id === "string" && id.startsWith(BULUT_ONEK);
const bulutUid = id => id.slice(BULUT_ONEK.length);
const bulutHazir = () => !!window.AYVEX_BULUT;
let bulutZamani = null;
let sonBulutVerisi = null;

function bulutKaydetPlanla() {
  if (!S || !bulutHesabiMi(db.aktif)) return;
  clearTimeout(bulutZamani);
  bulutZamani = setTimeout(bulutKaydetHemen, 1500);
  bulutDurumCiz();
}
function bulutKaydetHemen() {
  clearTimeout(bulutZamani);
  bulutZamani = null;
  if (!S || !bulutHesabiMi(db.aktif) || !bulutHazir()) return;
  const veri = JSON.stringify(S);
  if (veri === sonBulutVerisi) return; // değişiklik yok
  sonBulutVerisi = veri;
  const h = db.users[db.aktif];
  window.AYVEX_BULUT.kaydet(bulutUid(db.aktif), { veri, ad: S.name, tur: S.mode });
  if (h) h.guncel = Date.now();
  bulutDurumCiz();
  paylasimlariGuncelle();
}

// ================= PROJE PAYLAŞIMI (salt okunur bağlantı) =================
// Paylaşılan projenin özeti ayrı bir Firestore belgesine yazılır; hesabın geri kalanı paylaşılmaz.
const sonPaylasim = {}; // paylasimId → son yazılan JSON (değişmediyse tekrar yazma)
function projePaylasimVerisi(p) {
  const il = projeIlerleme(p);
  return JSON.stringify({
    ad: p.ad, durum: p.durum, oncelik: p.oncelik, bas: p.bas || "", bitis: p.bitis || "", ekip: p.ekip || "",
    ilerleme: il.yuzde,
    gorevler: S.tasks.filter(t => t.proje === p.id).map(t => ({ t: t.t, done: !!t.done, son: t.son || "", p: gorevOncelik(t.p) })),
    isler: S.sprintIsleri.filter(s => s.proje === p.id && !s.arsiv).map(s => ({ baslik: s.baslik, durum: s.durum, puan: s.puan })),
    toplantilar: S.toplantilar.filter(t => t.proje === p.id).map(t => ({ baslik: t.baslik, tarih: t.tarih, saat: t.saat })),
  });
}
function paylasimLinki(id) { return `${location.origin}${location.pathname}?paylasim=${encodeURIComponent(id)}`; }
async function projePaylas(p) {
  const veri = projePaylasimVerisi(p);
  await window.AYVEX_BULUT.paylasimYaz(p.paylasimId, { baslik: p.ad, veri });
  sonPaylasim[p.paylasimId] = veri;
}
function paylasimlariGuncelle() {
  if (!S || !bulutHesabiMi(db.aktif) || !window.AYVEX_BULUT || !window.AYVEX_BULUT.paylasimYaz) return;
  (S.projeler || []).filter(p => p.paylasimId).forEach(p => {
    const veri = projePaylasimVerisi(p);
    if (sonPaylasim[p.paylasimId] === veri) return;
    sonPaylasim[p.paylasimId] = veri;
    window.AYVEX_BULUT.paylasimYaz(p.paylasimId, { baslik: p.ad, veri }).catch(e => console.warn("[AYVEX] paylaşım güncellenemedi:", e));
  });
}
function paylasimKutusu(p) {
  const kutu = $("paylasimKutu");
  if (!kutu) return;
  kutu.hidden = !(p && p.paylasimId);
  if (p && p.paylasimId) $("paylasimLink").value = paylasimLinki(p.paylasimId);
}
function dlgProjesi() {
  const idEl = $("dlgProje") && $("dlgProje").querySelector("[name=id]");
  return idEl && idEl.value ? bul("projeler", idEl.value) : null;
}
document.addEventListener("click", async e => {
  const t = e.target.closest && e.target.closest("#paylasProje, #paylasimKopyala, #paylasimDurdur");
  if (!t || !S) return;
  e.preventDefault();
  const p = dlgProjesi();
  if (!p) return;
  if (t.id === "paylasimKopyala") {
    const link = $("paylasimLink").value;
    try { await navigator.clipboard.writeText(link); bilgiGoster("Bağlantı kopyalandı."); }
    catch (err) { $("paylasimLink").select(); bilgiGoster("Bağlantıyı seçtim, kopyalayabilirsin."); }
    return;
  }
  if (!bulutHesabiMi(db.aktif) || !window.AYVEX_BULUT) { bilgiGoster("Paylaşım için Google ya da e-posta hesabıyla giriş yapmalısın."); return; }
  t.disabled = true;
  try {
    if (t.id === "paylasProje") {
      if (!p.paylasimId) p.paylasimId = window.AYVEX_BULUT.paylasimIdUret();
      await projePaylas(p);
      kaydet();
      paylasimKutusu(p);
      bilgiGoster("Paylaşım bağlantısı hazır.");
    } else {
      await window.AYVEX_BULUT.paylasimSil(p.paylasimId);
      delete sonPaylasim[p.paylasimId];
      delete p.paylasimId;
      kaydet();
      paylasimKutusu(null);
      bilgiGoster("Paylaşım durduruldu; bağlantı artık açılmaz.");
    }
  } catch (err) {
    console.error("[AYVEX] paylaşım hatası:", err);
    bilgiGoster(err && err.code === "permission-denied" ? "Paylaşım izni yok (Firestore kuralları güncel değil olabilir)." : "Paylaşım yapılamadı, tekrar dene.");
  } finally { t.disabled = false; }
});
if ($("dlgProje")) $("dlgProje").addEventListener("close", () => paylasimKutusu(null));

// ---- Paylaşılan projeyi görüntüleme (?paylasim=…) ----
const PAYLASIM_ID = (() => { try { return new URLSearchParams(location.search).get("paylasim"); } catch (e) { return null; } })();
async function paylasimSayfasiAc(id) {
  document.body.setAttribute("data-paylasim", "true");
  if ($("auth")) $("auth").hidden = true;
  const sayfa = $("paylasimSayfa"), el = $("paylasimIcerik");
  sayfa.hidden = false;
  el.innerHTML = `<p class="paylasim-yukleniyor">Yükleniyor…</p>`;
  const bulut = () => new Promise(r => window.AYVEX_BULUT ? r() : addEventListener("ayvex-bulut-hazir", r, { once: true }));
  try {
    await bulut();
    const kayit = await window.AYVEX_BULUT.paylasimOku(id);
    if (!kayit) { el.innerHTML = `<h1>Bağlantı bulunamadı</h1><p>Bu paylaşım kaldırılmış ya da bağlantı hatalı olabilir.</p>`; return; }
    const p = JSON.parse(kayit.veri);
    document.title = `${p.ad} — AYVEX`;
    const kalan = p.bitis ? gunFarki(p.bitis) : NaN;
    const teslim = !p.bitis ? "Teslim tarihi yok" : p.durum === "tamam" ? `Teslim: ${gunEtiket(p.bitis)}`
      : kalan < 0 ? `${-kalan} gün gecikti (${gunEtiket(p.bitis)})` : kalan === 0 ? "Bugün teslim" : `${kalan} gün kaldı (${gunEtiket(p.bitis)})`;
    const liste = (dizi, satir, bos) => dizi.length ? `<ul>${dizi.map(satir).join("")}</ul>` : `<p class="paylasim-bos">${bos}</p>`;
    const ISDURUM = { todo: "Yapılacak", doing: "Devam ediyor", done: "Bitti" };
    el.innerHTML = `
      <div class="paylasim-ust">
        <span class="proje-durum">${esc(PROJE_DURUM[p.durum] || "Aktif")}</span>
        <span class="task-pri-badge pri-${ONCELIK[p.oncelik] ? p.oncelik : "mid"}">${ONCELIK[p.oncelik] || "Orta"}</span>
      </div>
      <h1>${esc(p.ad)}</h1>
      ${p.ekip ? `<p class="paylasim-ekip">👥 ${esc(p.ekip)}</p>` : ""}
      <div class="paylasim-ilerleme"><div class="kurs-bar"><span style="width:${+p.ilerleme || 0}%"></span></div><b>%${+p.ilerleme || 0}</b></div>
      <p class="paylasim-teslim">⏰ ${teslim}</p>
      <h2>Görevler</h2>
      ${liste(p.gorevler || [], g => `<li class="${g.done ? "bitti" : ""}"><span>${g.done ? "✅" : "⬜"}</span> ${esc(g.t)}${g.son ? ` <small>${gunEtiket(g.son)}</small>` : ""}</li>`, "Bu projeye bağlı görev yok.")}
      ${(p.isler || []).length ? `<h2>Sprint işleri</h2>${liste(p.isler, s => `<li><span>${s.durum === "done" ? "✅" : s.durum === "doing" ? "🔄" : "⬜"}</span> ${esc(s.baslik)} <small>${ISDURUM[s.durum] || ""}</small></li>`, "")}` : ""}
      ${(p.toplantilar || []).length ? `<h2>Toplantılar</h2>${liste(p.toplantilar, t => `<li><span>👥</span> ${esc(t.baslik)} <small>${gunEtiket(t.tarih)}${t.saat ? " · " + esc(t.saat) : ""}</small></li>`, "")}` : ""}
      ${kayit.guncelleme ? `<p class="paylasim-guncel">Son güncelleme: ${kayit.guncelleme.toLocaleString("tr-TR")}</p>` : ""}`;
  } catch (err) {
    console.error("[AYVEX] paylaşım okunamadı:", err);
    el.innerHTML = `<h1>Açılamadı</h1><p>Paylaşım yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile.</p>`;
  }
}

let bulutDurumu = {};
function bulutDurumCiz() {
  const el = $("bulutDurum");
  if (!el) return;
  const bulutta = bulutHesabiMi(db.aktif);
  el.hidden = !bulutta;
  if (!bulutta) return;
  const d = bulutDurumu;
  el.className = "bulut-durum" + (d.hata ? " hata" : d.bekleyen || bulutZamani ? " bekliyor" : " tamam");
  el.textContent = d.hata ? `⚠️ ${d.hata}`
    : d.cevrimdisi ? "📴 Çevrimdışı: değişiklikler bağlantı gelince gönderilecek"
    : d.bekleyen || bulutZamani ? "⏳ Buluta kaydediliyor…"
    : "☁️ Tüm değişiklikler buluta kaydedildi";
}

// Uzak veriyi (başka cihazdan gelen) mevcut hesaba uygula
function uzakVeriyiUygula(veriMetni) {
  if (!bulutHesabiMi(db.aktif)) return;
  let v;
  try { v = JSON.parse(veriMetni); } catch (e) { return; }
  const h = db.users[db.aktif];
  v = veriOnar(v, h.tur, h.ad);
  if (!gecerli(v)) return;
  // Bu cihazda henüz gönderilmemiş bir değişiklik varsa onu ezmeyelim; bizim yazmamız kazanır
  if (bulutZamani) return;
  sonBulutVerisi = veriMetni;
  h.data = v; h.tur = v.mode;
  S = v;
  pomoAyarlaraGoreSifirla();
  modUygula();
  goView(aktifView);
  ciz();
}

// Google girişinden sonra hesabı aç (gerekirse yerel veriyi aktarma seçeneği sun)
// Google ya da e-posta girişinden sonra hesabı aç. E-posta hesabı doğrulanmadıysa
// uygulamaya girilmez, doğrulama ekranı gösterilir (Firestore kuralları da bunu zorunlu kılar).
let oturumAciliyor = false; // aynı anda iki akış (ör. form + onAuthStateChanged) hesabı açmasın
// "Google ile devam et" düğmesinde bekleme durumu: Google penceresi ve veri yüklenirken
// kullanıcı bir şeylerin olduğunu görsün (eskiden 2–3 sn hiçbir şey olmuyormuş gibi duruyordu).
function googleBekliyor(acik) {
  const b = $("googleGiris");
  if (!b) return;
  const yazi = b.querySelector("span");
  if (yazi && !b.dataset.metin) b.dataset.metin = yazi.textContent;
  b.disabled = acik;
  b.classList.toggle("bekliyor", acik);
  b.setAttribute("aria-busy", String(acik));
  if (yazi) yazi.textContent = acik ? "Giriş yapılıyor…" : b.dataset.metin;
  if (!acik) { try { sessionStorage.removeItem("ayvex-giris-yonlendirme"); } catch (e) {} }
}
async function googleOturumAc(sonuc) {
  if (!sonuc || !sonuc.kullanici || oturumAciliyor || S) return;
  oturumAciliyor = true;
  googleBekliyor(true);
  try { await oturumAcIc(sonuc); } finally { oturumAciliyor = false; googleBekliyor(false); }
}
async function oturumAcIc(sonuc) {
  const { kullanici, uzak } = sonuc;
  if (kullanici.saglayici === "password" && !kullanici.dogrulandi) { dogrulamaEkrani(kullanici); return; }
  dogrulamaEkrani(null);
  const id = BULUT_ONEK + kullanici.uid;
  const msg = girisMesaji;

  let veri;
  if (uzak && typeof uzak.veri === "string") {
    try { veri = JSON.parse(uzak.veri); } catch (e) { veri = null; }
    veri = veriOnar(veri, uzak.tur, uzak.ad || kullanici.ad);
    if (!gecerli(veri)) { msg("Buluttaki veri okunamadı. Yedekten geri yükleyebilirsin."); veri = yeniVeri(uzak.tur || "student", kullanici.ad); }
    sonBulutVerisi = uzak.veri;
  } else {
    // İlk giriş: bu cihazdaki yerel hesaplardan biri aktarılabilir ya da sıfırdan başlanır.
    // E-posta ile kayıtta mod zaten seçildiyse ve aktarılacak yerel hesap yoksa tekrar sorulmaz.
    let kayitTuru = null;
    try { kayitTuru = localStorage.getItem("ayvex-kayit-tur:" + kullanici.uid); } catch (e) {}
    const yerelVar = Object.keys(db.users).some(k => !bulutHesabiMi(k));
    const secim = MODLAR[kayitTuru] && !yerelVar ? { tur: kayitTuru } : await aktarmaSec(kullanici);
    try { localStorage.removeItem("ayvex-kayit-tur:" + kullanici.uid); } catch (e) {}
    if (!secim) { await window.AYVEX_BULUT.cikisYap(); msg("Giriş iptal edildi."); return; }
    if (secim.yerelId) {
      veri = veriOnar(JSON.parse(JSON.stringify(db.users[secim.yerelId].data)), db.users[secim.yerelId].tur, db.users[secim.yerelId].ad);
    } else {
      veri = yeniVeri(secim.tur, kullanici.ad || "Kullanıcı");
    }
    sonBulutVerisi = null; // ilk kayıt hemen gönderilsin
  }
  db.users[id] = { ad: kullanici.ad || veri.name, email: kullanici.email, saglayici: kullanici.saglayici, tur: veri.mode, bulut: true, data: veri };
  db.aktif = id;
  dbYaz();
  msg("");
  basla();
  bulutKaydetHemen();
  window.AYVEX_BULUT.dinle(kullanici.uid);
}

// İlk Google girişinde: yerel hesaplardan birini aktar ya da mod seçip yeni başla
function aktarmaSec(kullanici) {
  return new Promise(coz => {
    const dlg = $("dlgAktar");
    const yereller = Object.keys(db.users).filter(k => !bulutHesabiMi(k));
    $("aktarAciklama").textContent = yereller.length
      ? `${kullanici.email} hesabıyla ilk kez giriş yapıyorsun. Bu cihazdaki yerel hesabını buluta aktarabilir ya da sıfırdan başlayabilirsin. Yerel hesabın silinmez.`
      : `${kullanici.email} hesabıyla ilk kez giriş yapıyorsun. Hangi modda başlamak istersin?`;
    $("aktarListe").innerHTML =
      yereller.map(k => `<button type="button" class="aktar-btn" data-aktar-yerel="${esc(k)}">
          <b>${esc(db.users[k].ad)}</b><small>${db.users[k].tur === "work" ? "Çalışan" : "Öğrenci"} · yerel hesabı aktar</small></button>`).join("") +
      `<button type="button" class="aktar-btn yeni" data-aktar-yeni="student"><b>Öğrenci olarak yeni başla</b><small>Dersler, sınavlar, kariyer</small></button>
       <button type="button" class="aktar-btn yeni" data-aktar-yeni="work"><b>Çalışan olarak yeni başla</b><small>Projeler, sprint, toplantılar</small></button>`;
    const bitir = deger => {
      dlg.removeEventListener("click", tikla);
      dlg.removeEventListener("cancel", iptal);
      if (dlg.open) dlg.close();
      coz(deger);
    };
    const tikla = e => {
      const y = e.target.closest("[data-aktar-yerel]");
      const n = e.target.closest("[data-aktar-yeni]");
      if (y) bitir({ yerelId: y.dataset.aktarYerel });
      else if (n) bitir({ tur: n.dataset.aktarYeni });
      else if (e.target.closest("[data-aktar-iptal]")) bitir(null);
    };
    const iptal = e => { e.preventDefault(); bitir(null); };
    dlg.addEventListener("click", tikla);
    dlg.addEventListener("cancel", iptal);
    guvenliAc(dlg);
  });
}

// bulut.js'in çağırdığı geri çağrılar
window.AYVEX = {
  authDegisti(kullanici) {
    if (PAYLASIM_ID) return; // paylaşılan proje sayfasında uygulama açılmaz
    if (bulutHesabiMi(db.aktif)) {
      if (kullanici && BULUT_ONEK + kullanici.uid === db.aktif) {
        window.AYVEX_BULUT.dinle(kullanici.uid);
        bulutKaydetPlanla();
      } else if (!kullanici) {
        // Oturum sona ermiş (ör. başka yerden çıkış yapıldı): önbellekteki hesabı kapat
        cikis("Oturumun sona erdi. Lütfen tekrar giriş yap.");
      }
    } else if (kullanici && !S && kullanici.saglayici === "password") {
      // E-posta hesabı açık ama uygulama açılmamış: doğrulama bağlantısından dönülmüş olabilir.
      // Sunucudan güncel durumu al; doğrulandıysa devam et, değilse doğrulama ekranını göster.
      window.AYVEX_BULUT.dogrulamaKontrol()
        .then(k => k && k.dogrulandi ? window.AYVEX_BULUT.kullaniciVerisi({ uid: k.uid }).then(s => googleOturumAc({ ...s, kullanici: k })) : dogrulamaEkrani(k))
        .catch(() => {});
    } else if (kullanici && !S && db.users[BULUT_ONEK + kullanici.uid]) {
      // Daha önce bu cihazda kullanılmış bir Google hesabı açık: otomatik devam et
      window.AYVEX_BULUT.kullaniciVerisi({ uid: kullanici.uid, displayName: kullanici.ad, email: kullanici.email })
        .then(s => googleOturumAc({ ...s, kullanici })).catch(() => {});
    }
  },
  googleGirisSonucu: sonuc => { if (!PAYLASIM_ID) googleOturumAc(sonuc); },
  // Yönlendirmeli girişten kullanıcı olmadan dönüldüyse (vazgeçti / hata) bekleme göstergesini kapat
  googleBeklemeBitti: () => googleBekliyor(false),
  uzakVeriGeldi: veri => { if (!PAYLASIM_ID) uzakVeriyiUygula(veri); },
  bulutDurum(d) { bulutDurumu = d || {}; bulutDurumCiz(); },
};

// ================= E-POSTA İLE GİRİŞ =================
// Şifre kuralları Firebase'deki şifre politikasıyla aynı (sunucu da zorunlu tutuyor)
const SIFRE_KURALLARI = [
  [s => s.length >= 8, "En az 8 karakter"],
  [s => /[A-ZÇĞİÖŞÜ]/.test(s), "Bir büyük harf"],
  [s => /[a-zçğıöşü]/.test(s), "Bir küçük harf"],
  [s => /\d/.test(s), "Bir rakam"],
];
const sifreEksikleri = s => SIFRE_KURALLARI.filter(([kural]) => !kural(s)).map(([, metin]) => metin);
function sifreGucCiz(el, s) {
  if (!el) return;
  el.innerHTML = SIFRE_KURALLARI.map(([kural, metin]) =>
    `<span class="${kural(s) ? "tamam" : ""}">${kural(s) ? "✓" : "○"} ${metin}</span>`).join("");
}
const epostaGecerli = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Firebase hata kodlarını Türkçe, ipucu vermeyen mesajlara çevir
// ("bu e-posta kayıtlı değil" gibi hesap varlığını ele veren ayrım yapılmaz)
function authHataMetni(e, baglam) {
  const kod = (e && e.code) || "";
  const yanlis = baglam === "sifre" ? "Şifre hatalı." : "E-posta veya şifre hatalı.";
  const SIFRE_KURAL = "Şifre kurallara uymuyor: en az 8 karakter, büyük harf, küçük harf ve rakam içermeli.";
  const M = {
    "auth/invalid-credential": yanlis, "auth/invalid-login-credentials": yanlis,
    "auth/wrong-password": yanlis, "auth/user-not-found": yanlis,
    "auth/invalid-email": "Geçerli bir e-posta adresi yaz.",
    "auth/missing-password": "Şifreni yaz.",
    "auth/email-already-in-use": "Bu e-posta ile zaten bir hesap var. Giriş yapmayı ya da Google ile devam etmeyi dene.",
    "auth/password-does-not-meet-requirements": SIFRE_KURAL, "auth/weak-password": SIFRE_KURAL,
    "auth/too-many-requests": "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar dene.",
    "auth/network-request-failed": "İnternet bağlantısı yok gibi görünüyor. Bağlantını kontrol edip tekrar dene.",
    "auth/user-disabled": "Bu hesap devre dışı bırakılmış.",
    "auth/requires-recent-login": "Güvenlik için çıkış yapıp tekrar giriş yapman gerekiyor.",
    "auth/account-exists-with-different-credential": "Bu e-posta başka bir giriş yöntemiyle kayıtlı. Google ile devam etmeyi dene.",
    "auth/operation-not-allowed": "E-posta ile giriş şu an kullanılamıyor.",
    "auth/popup-blocked": "Google giriş penceresi açılamadı çünkü tarayıcın açılır pencereleri engelliyor. Adres çubuğundaki engelleme simgesinden bu siteye izin verip tekrar dene ya da aşağıdan e-posta ile giriş yap.",
    "auth/operation-not-supported-in-this-environment": "Bu tarayıcı Google ile girişi desteklemiyor (ör. bir uygulamanın içinde açılan sayfa). Sayfayı Chrome ya da Safari'de açmayı veya aşağıdan e-posta ile girişi dene.",
    "auth/web-storage-unsupported": "Tarayıcının çerez/depolama ayarları girişi engelliyor. Gizli sekme dışında tekrar dene ya da e-posta ile giriş yap.",
  };
  return M[kod] || `Bir sorun oluştu${kod ? ` (${kod})` : ""}. Lütfen tekrar dene.`;
}

// Doğrulanmamış e-posta hesabı için doğrulama ekranı (null ile kapatılır)
function dogrulamaEkrani(k) {
  const auth = $("auth");
  if (!auth || !$("dogrulaKutu")) return;
  auth.classList.toggle("dogrulama-modu", !!k);
  $("dogrulaKutu").hidden = !k;
  if (k) {
    $("dogrulaMetin").textContent = `${k.email} adresine bir doğrulama bağlantısı gönderdik. E-postandaki bağlantıya tıkla, sonra aşağıdaki düğmeye bas. E-postayı göremiyorsan gereksiz (spam) klasörüne de bak.`;
    $("dogrulaMsg").textContent = "";
  }
}

const mesgul = async (btn, is) => { if (btn) btn.disabled = true; try { return await is(); } finally { if (btn) btn.disabled = false; } };

if ($("epostaForm")) $("epostaForm").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = t => { $("epostaMsg").textContent = t; };
  if (!bulutHazir()) { msg("Bulut bağlantısı yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile."); return; }
  const email = $("eEposta").value.trim();
  const sifre = $("eSifre").value;
  if (!epostaGecerli(email)) { msg("Geçerli bir e-posta adresi yaz."); return; }
  if (!sifre) { msg("Şifreni yaz."); return; }
  msg("");
  await mesgul($("epostaBtn"), async () => {
    try {
      if (sekme === "reg") {
        const ad = $("eAd").value.trim().slice(0, 30);
        if (!ad) { msg("Adını yaz."); return; }
        const eksik = sifreEksikleri(sifre);
        if (eksik.length) { msg("Şifre şunları içermeli: " + eksik.map(x => x.toLocaleLowerCase("tr")).join(", ") + "."); return; }
        if (sifre !== $("eSifre2").value) { msg("Şifreler aynı değil."); return; }
        const tur = (document.querySelector("#epostaForm input[name=eTur]:checked") || {}).value || "student";
        const k = await window.AYVEX_BULUT.epostaKayit(ad, email, sifre);
        try { localStorage.setItem("ayvex-kayit-tur:" + k.uid, tur); } catch (err) {}
        $("epostaForm").reset();
        dogrulamaEkrani(k);
      } else {
        const k = await window.AYVEX_BULUT.epostaGiris(email, sifre);
        $("eSifre").value = "";
        if (!k.dogrulandi) { dogrulamaEkrani(k); return; }
        const s = await window.AYVEX_BULUT.kullaniciVerisi({ uid: k.uid });
        await googleOturumAc({ ...s, kullanici: k });
      }
    } catch (err) { msg(authHataMetni(err)); }
  });
});
if ($("eSifre")) $("eSifre").addEventListener("input", e => { if (sekme === "reg") sifreGucCiz($("sifreGuc"), e.target.value); });

document.addEventListener("click", async e => {
  if (e.target.closest("#sifremiUnuttum")) {
    e.preventDefault();
    const msg = t => { $("epostaMsg").textContent = t; };
    const email = $("eEposta").value.trim();
    if (!epostaGecerli(email)) { msg("Önce e-posta adresini yaz, sonra \"Şifremi unuttum\"a bas."); $("eEposta").focus(); return; }
    if (!bulutHazir()) { msg("Bulut bağlantısı yüklenemedi."); return; }
    await mesgul($("sifremiUnuttum"), async () => {
      try {
        await window.AYVEX_BULUT.sifreSifirla(email);
        msg("Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gereksiz (spam) klasörünü de kontrol et.");
      } catch (err) { msg(authHataMetni(err)); }
    });
  }
  if (e.target.closest("#dogruladimBtn")) {
    e.preventDefault();
    const msg = t => { $("dogrulaMsg").textContent = t; };
    await mesgul($("dogruladimBtn"), async () => {
      try {
        const k = await window.AYVEX_BULUT.dogrulamaKontrol();
        if (!k) { dogrulamaEkrani(null); return; }
        if (!k.dogrulandi) { msg("E-posta adresin henüz doğrulanmamış görünüyor. Bağlantıya tıkladıktan sonra tekrar dene."); return; }
        const s = await window.AYVEX_BULUT.kullaniciVerisi({ uid: k.uid });
        await googleOturumAc({ ...s, kullanici: k });
      } catch (err) { msg(authHataMetni(err)); }
    });
  }
  if (e.target.closest("#tekrarGonderBtn")) {
    e.preventDefault();
    const btn = $("tekrarGonderBtn");
    try {
      btn.disabled = true;
      await window.AYVEX_BULUT.dogrulamaGonder();
      $("dogrulaMsg").textContent = "Doğrulama e-postası tekrar gönderildi.";
      setTimeout(() => { btn.disabled = false; }, 60000); // art arda gönderimi sınırla
    } catch (err) { btn.disabled = false; $("dogrulaMsg").textContent = authHataMetni(err); }
  }
  if (e.target.closest("#dogrulaCikisBtn")) {
    e.preventDefault();
    try { await window.AYVEX_BULUT.cikisYap(); } catch (err) {}
    dogrulamaEkrani(null);
  }
});

// ----- Ayarlar: şifre değiştirme ve e-posta hesabını silme (mevcut şifre ile doğrulanır) -----
function sifrePenceresi(amac) {
  const dlg = $("dlgSifre");
  $("sifreForm").reset();
  $("sifreForm").dataset.amac = amac;
  $("sifreMsg").textContent = "";
  const sil = amac === "sil";
  $("dlgSifreBaslik").textContent = sil ? "Hesabımı sil" : "Şifremi değiştir";
  $("dlgSifreAciklama").textContent = sil
    ? "Hesabın ve buluttaki tüm verilerin kalıcı olarak silinecek; bu işlem geri alınamaz. İstersen önce Ayarlar > \"Verilerimi indir\" ile yedek al. Onaylamak için şifreni yaz."
    : "Güvenlik için önce mevcut şifreni yaz.";
  dlg.querySelectorAll(".sifre-yeni").forEach(el => { el.hidden = sil; });
  $("sifreOnayBtn").textContent = sil ? "Hesabımı kalıcı olarak sil" : "Şifreyi değiştir";
  $("sifreOnayBtn").classList.toggle("btn-danger", sil);
  $("sifreOnayBtn").classList.toggle("btn-primary", !sil);
  sifreGucCiz($("sifreGuc2"), "");
  if ($("settingsDlg").open) $("settingsDlg").close();
  guvenliAc(dlg);
}
if ($("sYeni")) $("sYeni").addEventListener("input", e => sifreGucCiz($("sifreGuc2"), e.target.value));
if ($("sifreDegistirBtn")) $("sifreDegistirBtn").onclick = () => sifrePenceresi("degistir");
if ($("sifreForm")) $("sifreForm").addEventListener("submit", async e => {
  e.preventDefault();
  e.stopImmediatePropagation();
  const msg = t => { $("sifreMsg").textContent = t; };
  const amac = $("sifreForm").dataset.amac;
  const mevcut = $("sMevcut").value;
  if (!mevcut) { msg("Mevcut şifreni yaz."); return; }
  if (!bulutHazir()) { msg("Bulut bağlantısı yok. İnternet bağlantını kontrol et."); return; }
  if (amac === "degistir") {
    const yeni = $("sYeni").value;
    const eksik = sifreEksikleri(yeni);
    if (eksik.length) { msg("Yeni şifre şunları içermeli: " + eksik.map(x => x.toLocaleLowerCase("tr")).join(", ") + "."); return; }
    if (yeni !== $("sYeni2").value) { msg("Yeni şifreler aynı değil."); return; }
    if (yeni === mevcut) { msg("Yeni şifre eskisiyle aynı olamaz."); return; }
    await mesgul($("sifreOnayBtn"), async () => {
      try {
        await window.AYVEX_BULUT.sifreDegistir(mevcut, yeni);
        $("dlgSifre").close();
        alert("Şifren değiştirildi.");
      } catch (err) { msg(authHataMetni(err, "sifre")); }
    });
  } else if (amac === "sil") {
    const id = db.aktif;
    await mesgul($("sifreOnayBtn"), async () => {
      try {
        clearTimeout(bulutZamani); bulutZamani = null;
        await window.AYVEX_BULUT.hesabiTamamenSil(bulutUid(id), mevcut);
        S = null;
        delete db.users[id];
        db.aktif = null; dbYaz();
        location.reload();
      } catch (err) { msg(authHataMetni(err, "sifre")); }
    });
  }
}, true);

async function hashle(sifre, tuz) {
  const metin = tuz + ":" + sifre;
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(metin));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 5381;
  for (const c of metin) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return "x" + h;
}

let sel = todayKey;
let view = { y: now.getFullYear(), m: now.getMonth() };
let q = "";
let sekme = "login";
let aktifView = "home";
let planSekme = "haftalik";
const M = () => (S && MODLAR[S.mode]) || MODLAR.student;
// Türkçe büyük/küçük harf duyarsız arama: "İstanbul"/"istanbul", "ISPARTA"/"ısparta" eşleşsin.
// Hem "ı" hem "i" aynı harf sayılır, böylece "Istanbul" yazan da bulur.
const aramaNorm = s => String(s ?? "").toLocaleLowerCase("tr").replace(/ı/g, "i");
const eslesir = s => !q || aramaNorm(s).includes(q);

function bul(list, id) {
  if (!S) return null;
  if (list === "events") {
    for (const d in S.events) {
      const e = S.events[d].find(e => e.id === id);
      if (e) return e;
    }
    return null;
  }
  return (S[list] || []).find(e => e.id === id);
}
function sil(list, id) {
  if (!S) return;
  if (list === "events") {
    for (const d in S.events) S.events[d] = S.events[d].filter(e => e.id !== id);
  } else {
    S[list] = (S[list] || []).filter(e => e.id !== id);
  }
  // Silinen projeye bağlı görev, sprint işi ve toplantılardaki bağlantıyı temizle
  if (list === "projeler") {
    ["tasks", "sprintIsleri", "toplantilar"].forEach(l => (S[l] || []).forEach(x => { if (x.proje === id) x.proje = ""; }));
  }
  // Silinen kayda bağlı pomodoro seçimi ve bildirimler de kalkmasın diye temizle
  if (S.pomo && S.pomo.bind && S.pomo.bind.id === id) S.pomo.bind = null;
  if (Array.isArray(S.notifications)) S.notifications = S.notifications.filter(n => !String(n.uid || "").includes("::" + id + "::"));
}
// ================= SİLME → GERİ AL =================
const SILME_ADI = {
  tasks: "Görev", events: "Etkinlik", courses: "Kayıt", deadlines: "Teslim", jobs: "İş ilanı", skills: "Beceri",
  hedefler: "Hedef", planItems: "Plan işi", toplantilar: "Toplantı", sprintIsleri: "Sprint işi",
  kariyerHedefler: "Kariyer hedefi", yksDenemeleri: "Deneme", projeler: "Proje",
};
let geriAlZamani = null;
let geriAlVerisi = null;
// Silinecek kaydın ve bağlantılarının kopyası. "Geri al" sadece bunu geri koyar; böylece
// silmeden sonra yapılan diğer değişiklikler kaybolmaz (eskiden tüm veri geri sarılıyordu).
function silmeYedegi(list, id) {
  const kopya = x => JSON.parse(JSON.stringify(x));
  const yedek = { list, id, pomoBind: S.pomo && S.pomo.bind && S.pomo.bind.id === id ? kopya(S.pomo.bind) : null };
  if (list === "events") {
    for (const gun in S.events) {
      const i = S.events[gun].findIndex(e => e.id === id);
      if (i >= 0) return { ...yedek, gun, index: i, kayit: kopya(S.events[gun][i]) };
    }
    return null;
  }
  const i = (S[list] || []).findIndex(e => e.id === id);
  if (i < 0) return null;
  yedek.index = i;
  yedek.kayit = kopya(S[list][i]);
  if (list === "projeler") {
    yedek.baglar = {};
    ["tasks", "sprintIsleri", "toplantilar"].forEach(l => { yedek.baglar[l] = (S[l] || []).filter(x => x.proje === id).map(x => x.id); });
  }
  return yedek;
}
// Bildirimi göster ve ekranın en üst katmanına al: açık bir pencere (dialog) varken bile onun
// üstünde görünsün (eskiden pencerenin arkasında kalıyordu). popover desteklenmeyen eski
// tarayıcılarda normal sabit konumlu kutu olarak kalır.
function toastAc(t) {
  t.hidden = false;
  if (t.showPopover) {
    try { if (t.matches(":popover-open")) t.hidePopover(); t.showPopover(); } catch (e) {}
  }
}
function toastKapat(t) {
  if (t.hidePopover) { try { if (t.matches(":popover-open")) t.hidePopover(); } catch (e) {} }
  t.hidden = true;
}
function geriAlGoster(mesaj, yedek, kayit) {
  const t = $("toast");
  if (!t || !yedek) return;
  geriAlVerisi = { yedek, hesap: db.aktif };
  const ad = kayit && (kayit.t || kayit.baslik || kayit.ad || kayit.n);
  $("toastMetin").textContent = ad ? `${mesaj}: ${String(ad).slice(0, 40)}` : mesaj;
  if ($("toastGeriAl")) $("toastGeriAl").hidden = false;
  toastAc(t);
  clearTimeout(geriAlZamani);
  geriAlZamani = setTimeout(geriAlKapat, 6000);
}
function geriAlKapat() {
  clearTimeout(geriAlZamani);
  geriAlVerisi = null;
  if ($("toast")) toastKapat($("toast"));
}
// Geri al düğmesi olmadan kısa bilgi mesajı (ör. "Görev eklendi", "Görev adı boş olamaz")
function bilgiGoster(mesaj) {
  const t = $("toast");
  if (!t) return;
  geriAlVerisi = null;
  $("toastMetin").textContent = mesaj;
  if ($("toastGeriAl")) $("toastGeriAl").hidden = true;
  toastAc(t);
  clearTimeout(geriAlZamani);
  geriAlZamani = setTimeout(geriAlKapat, 3000);
}
// Boş görev gönderilince tarayıcının kendi uyarısına ek olarak açık bir mesaj göster
document.addEventListener("invalid", e => {
  const f = e.target.closest && e.target.closest('form[data-form="task"], form[data-form="task-quick"]');
  if (f && e.target.name === "t") bilgiGoster("Görev adı boş olamaz.");
}, true);
function geriAl() {
  const g = geriAlVerisi;
  geriAlKapat();
  if (!g || !S || g.hesap !== db.aktif) return;
  const y = g.yedek;
  const yerine = (dizi, kayit, index) => {
    if (dizi.some(x => x.id === kayit.id)) return; // zaten geri gelmiş
    dizi.splice(Math.min(index, dizi.length), 0, kayit);
  };
  if (y.list === "events") {
    yerine(S.events[y.gun] = S.events[y.gun] || [], y.kayit, y.index);
  } else {
    yerine(S[y.list] = S[y.list] || [], y.kayit, y.index);
    // Silinen projeye bağlı kayıtların bağlantısını geri kur (o arada silinmemişlerse)
    if (y.baglar) Object.entries(y.baglar).forEach(([l, idler]) => (S[l] || []).forEach(x => { if (idler.includes(x.id) && !x.proje) x.proje = y.id; }));
  }
  if (y.pomoBind && S.pomo && !S.pomo.bind) S.pomo.bind = y.pomoBind;
  ciz();
}
document.addEventListener("click", e => { if (e.target.closest("#toastGeriAl")) { e.preventDefault(); geriAl(); } });

// ================= TELEFONDA ARAMA =================
function mobilAramaAc(acik) {
  document.body.classList.toggle("arama-acik", acik);
  const btn = $("mobilAraBtn");
  if (btn) btn.setAttribute("aria-expanded", String(acik));
  if (acik) { setTimeout(() => $("q") && $("q").focus(), 0); return; }
  // Kapatınca aramayı temizle; gizli bir filtre listeleri boş gösterip kafa karıştırmasın
  if ($("q") && $("q").value) { $("q").value = ""; $("q").dispatchEvent(new Event("input")); }
}
document.addEventListener("click", e => {
  if (e.target.closest("#mobilAraBtn")) { e.preventDefault(); mobilAramaAc(!document.body.classList.contains("arama-acik")); }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && document.body.classList.contains("arama-acik") && e.target.id === "q") mobilAramaAc(false);
});

const delBtn = (list, id) =>
  `<button type="button" class="x" data-act="del" data-list="${list}" data-id="${id}" aria-label="Sil"><svg width="14" height="14"><use href="#i-x"/></svg></button>`;
const ad = (list, id, field, text) =>
  `<span data-rename data-list="${list}" data-id="${id}" data-field="${field}" title="Çift tıkla: düzenle">${esc(text)}</span>`;
const gunEvents = k => ((S && S.events[k]) || []).slice().sort((a, b) => a.time.localeCompare(b.time));

// ============ MOBİL MENÜ ============
function mobilMenuAc() {
  const sb = $("sidebar"); const ov = $("mobileOverlay");
  if (sb) sb.classList.add("open");
  if (ov) ov.classList.add("on");
  document.body.style.overflow = "hidden";
}
function mobilMenuKapat() {
  const sb = $("sidebar"); const ov = $("mobileOverlay");
  if (sb) sb.classList.remove("open");
  if (ov) ov.classList.remove("on");
  document.body.style.overflow = "";
}

// ============ GÖRÜNÜM ============
function goView(v) {
  // Var olmayan ya da bu moda ait olmayan bir sayfaya gidilirse ana sayfaya dön
  // (aksi halde tüm görünümler gizlenip ekran boş kalıyor).
  const hedefEl = $("v-" + v);
  const mod = S ? S.mode : "student";
  if (!hedefEl || (mod === "work" && hedefEl.classList.contains("menu-ogrenci")) ||
      (mod !== "work" && hedefEl.classList.contains("menu-is"))) v = "home";
  aktifView = v;
  document.querySelectorAll(".view").forEach(el => el.classList.toggle("on", el.id === "v-" + v));
  document.querySelectorAll(".side-nav [data-view]").forEach(a => a.classList.toggle("active", a.dataset.view === v));
  document.querySelectorAll(".mobile-nav-item").forEach(a => a.classList.toggle("active", a.dataset.view === v));
  document.body.dataset.page = v;
  mobilMenuKapat();
  window.scrollTo({ top: 0 });
}

function modUygula() {
  if (!S) return;
  const m = M();
  document.body.dataset.mode = S.mode || "student";
  const ur = $("userRole"); if (ur) ur.textContent = m.rol;
  const na = $("navAc"); if (na) na.textContent = m.ac;
  const at = $("acTitle"); if (at) at.textContent = m.acBaslik;
  const jt = $("jobsTitle"); if (jt) jt.textContent = m.jobs;
  const hs = $("helloSub"); if (hs) hs.textContent = m.sub;
  document.querySelectorAll("select[name=type]").forEach(s => {
    s.innerHTML = m.tur.map(t => `<option>${t}</option>`).join("");
  });
  // Moda özel öğeler CSS ile gizleniyor (body[data-mode] + .menu-ogrenci / .menu-is)
  const qEl = $("q");
  if (qEl) qEl.placeholder = S.mode === "work" ? "Ara... (görev, proje, toplantı)" : "Ara... (etkinlik, ders, görev)";
}

function avatarUygula() {
  const el = $("avatar");
  if (!el || !S) return;
  const i = (typeof S.avatar === "number") ? S.avatar : 0;
  el.innerHTML = avatarHTML(i);
  avatarRenkUygula(el, i);
  const xl = $("avatarXL");
  if (xl) { xl.innerHTML = avatarHTML(i); avatarRenkUygula(xl, i); }
}

function guvenliAc(dlg) {
  if (!dlg) return;
  try { dlg.showModal(); }
  catch (e) { try { dlg.setAttribute("open", ""); } catch (_) {} }
}

function acProfil() {
  if (!S) return;
  const i = (typeof S.avatar === "number") ? S.avatar : 0;
  const pa = $("profileAvatar");
  if (!pa) return;
  pa.innerHTML = avatarHTML(i);
  avatarRenkUygula(pa, i);
  pa.dataset.pending = i;
  const pn = $("profileName"); if (pn) pn.textContent = S.name;
  const pr = $("profileRole"); if (pr) pr.textContent = M().rol;
  const pni = $("profileNameInput"); if (pni) pni.value = S.name;
  const ag = $("avatarGrid");
  if (ag) ag.innerHTML = AVATARLAR.map((a, idx) =>
    `<button type="button" class="avatar-option ${a.renk} ${idx === i ? "cur" : ""}" data-avatar="${idx}" aria-label="Avatar ${idx + 1}">
      <svg width="24" height="24"><use href="#${a.ikon}"/></svg>
    </button>`
  ).join("");
  guvenliAc($("profileDlg"));
}

// ================= KARŞILAMA VE ROZET =================
function karsilamaMetni() {
  const saat = new Date().getHours();
  if (saat >= 5 && saat < 12) return { metin: "Günaydın", emoji: "☀️" };
  if (saat >= 12 && saat < 17) return { metin: "İyi öğlenler", emoji: "🌤️" };
  if (saat >= 17 && saat < 22) return { metin: "İyi akşamlar", emoji: "🌆" };
  return { metin: "İyi geceler", emoji: "🌙" };
}

function bugunRozet() {
  if (!S) return { emoji: "✨", baslik: "Güzel Bir Gün", desc: "Bugün güzel şeyler yapabilirsin.", stil: "rozet-standart" };
  const saat = new Date().getHours();
  const bugunGorev = (S.tasks || []).filter(t => t.done && gorevBitisGunu(t) === todayKey).length;
  const bugunPomo = (S.pomo && S.pomo.stats && S.pomo.stats[todayKey]) ? S.pomo.stats[todayKey].sayi : 0;
  const bugunDers = bugunDersler().length;
  const bugunPlan = (S.planItems || []).filter(p => +p.gun === bugunGunNo).length;
  const bugunToplanti = (S.toplantilar || []).filter(t => t.tarih === todayKey).length;
  const bugunSinav = (S.sinavlar || []).filter(s => s.tarih === todayKey).length;

  if (saat >= 5 && saat < 8) return { emoji: "🌅", baslik: "Erken Kuş", desc: "Sabahın erken saatlerinde başladın!", stil: "rozet-saat" };
  if (saat >= 22 || saat < 2) return { emoji: "🌙", baslik: "Gece Kuşu", desc: "Gece geç saatlerde çalışıyorsun.", stil: "rozet-saat" };
  if (bugunSinav > 0) return { emoji: "📝", baslik: "Sınav Günü", desc: `Bugün ${bugunSinav} sınavın var!`, stil: "rozet-odul" };
  if (bugunGorev >= 5) return { emoji: "🏆", baslik: "Görev Avcısı", desc: `Bugün ${bugunGorev} görev tamamladın!`, stil: "rozet-odul" };
  if (bugunPomo >= 4) return { emoji: "⚡", baslik: "Süper Odak", desc: `Bugün ${bugunPomo} pomodoro tamamladın!`, stil: "rozet-odul" };
  if (bugunGorev >= 3) return { emoji: "🐝", baslik: "Üretken Arı", desc: `Bugün ${bugunGorev} görev tamamladın.`, stil: "rozet-odul" };
  if (bugunPomo >= 2) return { emoji: "🎯", baslik: "Odaklanmış", desc: `Bugün ${bugunPomo} pomodoro tamamladın.`, stil: "rozet-odul" };
  if (bugunDers >= 3) return { emoji: "📚", baslik: "Kitap Kurdu", desc: `Bugün ${bugunDers} dersin var.`, stil: "rozet-odul" };
  if (bugunPlan >= 1) return { emoji: "📋", baslik: "Planlı", desc: `Bugün ${bugunPlan} planlı işin var.`, stil: "rozet-odul" };
  if (bugunToplanti >= 1) return { emoji: "👥", baslik: "Toplantıcı", desc: `Bugün ${bugunToplanti} toplantın var.`, stil: "rozet-odul" };
  return { emoji: "✨", baslik: "Güzel Bir Gün", desc: "Bugün güzel şeyler yapabilirsin.", stil: "rozet-standart" };
}

function rozetCiz() {
  const el = $("welcomeRozet");
  if (!el) return;
  const r = bugunRozet();
  el.innerHTML = `<div class="rozet-badge ${r.stil}">
    <span class="rozet-emoji">${r.emoji}</span>
    <div class="rozet-body">
      <span class="rozet-title">${r.baslik}</span>
      <span class="rozet-desc">${r.desc}</span>
    </div>
  </div>`;
}

// ================= Bildirimler =================
function bildirimEkle(tip, baslik, mesaj, ozelId) {
  if (!S) return;
  S.notifications = S.notifications || [];
  const benzersizId = ozelId || (tip + "::" + baslik + "::" + mesaj);
  if (S.notifications.some(n => n.uid === benzersizId)) return;
  S.notifications.unshift({
    uid: benzersizId, tip, baslik, mesaj,
    zaman: new Date().toISOString(),
    okundu: false,
  });
  if (S.notifications.length > 50) S.notifications.length = 50;
  kaydet();
  sistemBildirimiGoster(baslik, mesaj, benzersizId);
}

// ================= SİSTEM BİLDİRİMLERİ (telefon / masaüstü) =================
// Kullanıcı Ayarlar'dan açarsa yeni uygulama bildirimleri işletim sistemi bildirimi olarak da
// gösterilir. Not: Sunucu olmadığı için bildirimler uygulama açıkken (arka planda bir sekmede
// ya da kurulu uygulama olarak) üretilir; uygulama tamamen kapalıyken bildirim gelmez.
let swKayit = null;
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(k => { swKayit = k; }).catch(e => console.warn("[AYVEX] service worker kaydedilemedi:", e));
  });
}
function sistemBildirimiAcik() {
  try { return "Notification" in window && Notification.permission === "granted" && localStorage.getItem("ayvex-sistem-bildirim") === "acik"; }
  catch (e) { return false; }
}
function sistemBildirimiGoster(baslik, mesaj, etiket) {
  if (!sistemBildirimiAcik()) return;
  const secenek = { body: mesaj || "", tag: etiket, icon: "assets/icon-192.png", badge: "assets/icon-192.png", lang: "tr" };
  try {
    if (swKayit && swKayit.showNotification) swKayit.showNotification(baslik, secenek);
    else new Notification(baslik, secenek);
  } catch (e) {}
}
function sistemBildirimDugmesi() {
  const b = $("sistemBildirimBtn");
  if (!b) return;
  if (!("Notification" in window)) { b.textContent = "🔕 Bu tarayıcı bildirimleri desteklemiyor"; b.disabled = true; return; }
  if (Notification.permission === "denied") { b.textContent = "🔕 Bildirimler tarayıcı ayarlarından engellenmiş"; b.disabled = true; return; }
  b.disabled = false;
  b.textContent = sistemBildirimiAcik() ? "🔔 Cihaz bildirimleri açık (kapatmak için dokun)" : "🔔 Cihaz bildirimlerini aç";
}
document.addEventListener("click", async e => {
  if (!e.target.closest || !e.target.closest("#sistemBildirimBtn")) return;
  if (sistemBildirimiAcik()) {
    try { localStorage.setItem("ayvex-sistem-bildirim", "kapali"); } catch (err) {}
  } else {
    const izin = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (izin === "granted") {
      try { localStorage.setItem("ayvex-sistem-bildirim", "acik"); } catch (err) {}
      sistemBildirimiGoster("Bildirimler açıldı", "Yaklaşan görev, sınav ve toplantılar için haber vereceğiz.", "ayvex-test");
    }
  }
  sistemBildirimDugmesi();
});
// Uygulama uzun süre açık kalırsa (ör. kurulu uygulama) yaklaşan işleri yarım saatte bir yeniden kontrol et
setInterval(() => { if (S) otomatikBildirimler(); }, 30 * 60 * 1000);

function otomatikBildirimler() {
  if (!S) return;
  [todayKey, yarinKey].forEach(gun => {
    const evler = S.events[gun] || [];
    evler.forEach(ev => {
      const zamanMetni = gun === todayKey ? "Bugün" : "Yarın";
      bildirimEkle(gun === todayKey ? "warn" : "info", `${zamanMetni}: ${ev.t}`, `${ev.time} · ${ev.type}`, "ev::" + ev.id + "::" + gun);
    });
  });
  (S.deadlines || []).forEach(d => {
    const fark = gunFarki(d.d);
    if (fark >= 0 && fark <= 3) {
      bildirimEkle(fark === 0 ? "warn" : "info", `Teslim: ${d.t}`, fark === 0 ? "Bugün teslim!" : `${fark} gün kaldı (${gunEtiket(d.d)})`, "dl::" + d.id + "::" + fark);
    }
  });
  const bekleyenSayisi = (S.jobs || []).filter(j => j.st === "Beklemede").length;
  if (bekleyenSayisi > 0) {
    bildirimEkle("purple", "Başvurular", `${bekleyenSayisi} başvurun hâlâ beklemede`, "jobs-beklemede-" + todayKey);
  }
  const bugunSinav = (S.sinavlar || []).filter(s => s.tarih === todayKey || s.tarih === yarinKey);
  bugunSinav.forEach(s => {
    const zamanMetni = s.tarih === todayKey ? "Bugün" : "Yarın";
    bildirimEkle(s.tarih === todayKey ? "warn" : "info", `${zamanMetni}: ${s.ad}`, `${s.tur}${s.saat ? " · " + s.saat : ""}`, "sn::" + s.id + "::" + s.tarih);
  });
  // İş modu: bugünkü/yarınki toplantılar, yaklaşan proje teslimleri, biten sprint
  (S.toplantilar || []).filter(t => t.tarih === todayKey || t.tarih === yarinKey).forEach(t => {
    const bugunMu = t.tarih === todayKey;
    bildirimEkle(bugunMu ? "warn" : "info", `${bugunMu ? "Bugün" : "Yarın"} toplantı: ${t.baslik}`, `${t.saat || ""}${t.sure ? " · " + t.sure + " dk" : ""}`, "tp::" + t.id + "::" + t.tarih + t.saat);
  });
  (S.projeler || []).filter(p => p.durum !== "tamam" && p.bitis).forEach(p => {
    const f = gunFarki(p.bitis);
    if (f >= 0 && f <= 3) bildirimEkle(f === 0 ? "warn" : "info", `Proje teslimi: ${p.ad}`, f === 0 ? "Bugün teslim!" : `${f} gün kaldı (${gunEtiket(p.bitis)})`, "pj::" + p.id + "::" + f);
    else if (f < 0) bildirimEkle("warn", `Gecikmiş proje: ${p.ad}`, `Teslim tarihi ${gunEtiket(p.bitis)} idi`, "pjg::" + p.id + "::" + todayKey);
  });
  if (S.mode === "work" && S.sprint && gunFarki(S.sprint.bit) <= 1 && gunFarki(S.sprint.bit) >= 0) {
    bildirimEkle("purple", `${S.sprint.ad} bitiyor`, gunFarki(S.sprint.bit) === 0 ? "Sprint bugün bitiyor" : "Sprint yarın bitiyor", "sp::" + S.sprint.ad + "::" + S.sprint.bit);
  }
  (S.tasks || []).filter(t => !t.done && t.son).forEach(t => {
    const f = gunFarki(t.son);
    if (f === 0 || f === 1) bildirimEkle(f === 0 ? "warn" : "info", `${f === 0 ? "Bugün" : "Yarın"} son gün: ${t.t}`, "Görev", "gs::" + t.id + "::" + t.son);
    else if (f < 0) bildirimEkle("warn", `Gecikmiş görev: ${t.t}`, `Son tarih ${gunEtiket(t.son)} idi`, "gsg::" + t.id + "::" + todayKey);
  });
  const bugunOdev = (S.odevler || []).filter(o => !o.done && (o.tarih === todayKey || o.tarih === yarinKey));
  bugunOdev.forEach(o => {
    const zamanMetni = o.tarih === todayKey ? "Bugün" : "Yarın";
    bildirimEkle(o.tarih === todayKey ? "warn" : "info", `${zamanMetni} ödev: ${o.ad}`, `${o.ders || ""} teslim`, "od::" + o.id + "::" + o.tarih);
  });
}

function okunmamisSayisi() {
  if (!S || !S.notifications) return 0;
  return S.notifications.filter(n => !n.okundu).length;
}

function bildirimCiz() {
  if (!S) return;
  const list = $("notifList");
  if (!list) return;
  const items = (S.notifications || []).slice(0, 30);
  list.innerHTML = items.length
    ? items.map(n => {
        const zaman = new Date(n.zaman);
        const saat = `${pad(zaman.getHours())}:${pad(zaman.getMinutes())}`;
        const ikonMap = { warn: "#i-bell", info: "#i-clock", success: "#i-check", purple: "#i-target" };
        return `<div class="notif-item ${n.okundu ? "read" : "unread"}">
          <span class="notif-dot"></span>
          <div class="notif-icon ${n.tip}"><svg width="16" height="16"><use href="${ikonMap[n.tip] || "#i-bell"}"/></svg></div>
          <div class="notif-body">
            <div class="notif-title">${esc(n.baslik)}</div>
            <div class="notif-meta">${esc(n.mesaj)} · ${saat}</div>
          </div>
        </div>`;
      }).join("")
    : "";
}

function bildirimRozetiGuncelle() {
  const sayi = okunmamisSayisi();
  const bell = $("bell");
  // Okunmamış yoksa rozeti gizle; çok sayıda bildirimde "9+" göster
  if (bell) { bell.textContent = sayi > 9 ? "9+" : sayi; bell.hidden = sayi === 0; }
  const bellBtn = $("bellBtn");
  if (bellBtn) bellBtn.classList.toggle("has-new", sayi > 0);
}

function panelAc() {
  const panel = $("notifPanel");
  if (!panel || !S) return;
  otomatikBildirimler();
  (S.notifications || []).forEach(n => n.okundu = true);
  bildirimCiz();
  bildirimRozetiGuncelle();
  panel.classList.add("on");
  panel.setAttribute("aria-hidden", "false");
  kaydet();
}

function panelKapat() {
  const panel = $("notifPanel");
  if (!panel) return;
  panel.classList.remove("on");
  panel.setAttribute("aria-hidden", "true");
}

function gunListesi(el, k) {
  if (!el || !S) return;
  const l = gunEvents(k).filter(e => eslesir(e.t));
  el.innerHTML = l.length
    ? l.map(e =>
        `<li><span>${esc(e.time)}</span><div class="ev ${sinif[e.type] || "event"}">${ad("events", e.id, "t", e.t)}${delBtn("events", e.id)}<small>${esc(e.type)}</small></div></li>`
      ).join("")
    : `<li class="empty">Kayıt yok. + butonuyla ekleyebilirsin.</li>`;
}

// ================= KISAYOLLAR =================
function kisayolCiz() {
  const el = $("kisayolGrid");
  if (!el || !S) return;
  let items = [];
  if (S.mode === "student") {
    items = [
      { view: "ders",  ikon: "#i-graduation",   label: "Ders Programı" },
      { view: "ac",    ikon: "#i-book-open",    label: "Akademik" },
      { view: "tasks", ikon: "#i-check-circle", label: "Görevler" },
      { view: "cal",   ikon: "#i-calendar",     label: "Takvim" },
    ];
  } else {
    items = [
      { view: "proje",    ikon: "#i-briefcase",    label: "Projeler" },
      { view: "sprint",   ikon: "#i-zap",          label: "Sprint" },
      { view: "toplanti", ikon: "#i-users",        label: "Toplantılar" },
      { view: "tasks",    ikon: "#i-check-circle", label: "Görevler" },
    ];
  }
  el.innerHTML = items.map(it =>
    `<button type="button" class="kısayol" data-view="${it.view}">
      <svg width="28" height="28"><use href="${it.ikon}"/></svg>
      <span>${it.label}</span>
    </button>`
  ).join("");
}

// ================= POMODORO =================
let pomo = { mod: "focus", kalan: 25*60, toplam: 25*60, calisiyor: false, interval: null, tur: 0 };

function pomoAyarlari() { return (S && S.pomo) ? S.pomo : POMO_DEFAULTS; }
// Veri dışarıdan değiştiğinde (yedekten geri yükleme, başka cihazdan senkron) çalışmayan
// pomodoro sayacını yeni ayarlardaki süreye getir (eskiden eski süreyle devam ediyordu)
function pomoAyarlaraGoreSifirla() {
  if (pomo.calisiyor) return;
  pomo.toplam = pomoSure(pomo.mod);
  pomo.kalan = pomo.toplam;
}
function pomoAyarFormDoldur() {
  const form = $("pomodoroAyarDlg") && $("pomodoroAyarDlg").querySelector("form");
  if (!form) return;
  const a = pomoAyarlari();
  ["focus", "short", "long", "cycle", "sound", "auto"].forEach(k => {
    const el = form.querySelector(`[name=${k}]`);
    if (el && a[k] != null) el.value = a[k];
  });
}
function pomoSure(mod) {
  const a = pomoAyarlari();
  if (mod === "focus") return (+a.focus || 25) * 60;
  if (mod === "short") return (+a.short || 5) * 60;
  if (mod === "long") return (+a.long || 15) * 60;
  return 25 * 60;
}
function pomoModEtiket(mod) { return mod === "focus" ? "Odak" : mod === "short" ? "Kısa Mola" : "Uzun Mola"; }
function pomoBugun() {
  if (!S || !S.pomo || !S.pomo.stats) return { sayi: 0, dk: 0 };
  return S.pomo.stats[todayKey] || { sayi: 0, dk: 0 };
}
// Bu haftanın (Pazartesi başlangıçlı) gün anahtarları ve Pazartesi'nin anahtarı
function haftaGunleriKey() {
  const pzt = tarihOku(todayKey);
  pzt.setDate(pzt.getDate() + (pzt.getDay() === 0 ? -6 : 1 - pzt.getDay()));
  return [...Array(7)].map((_, i) => { const d = new Date(pzt); d.setDate(pzt.getDate() + i); return tarihKey(d); });
}
const haftaBasiKey = () => haftaGunleriKey()[0];
function pomoHaftaToplam(alan = "sayi") {
  if (!S || !S.pomo || !S.pomo.stats) return 0;
  return haftaGunleriKey().reduce((t, k) => t + ((S.pomo.stats[k] && +S.pomo.stats[k][alan]) || 0), 0);
}
function pomoStatsGuncelle() {
  const b = pomoBugun(); const hafta = pomoHaftaToplam();
  if ($("pomoBugun")) $("pomoBugun").textContent = b.sayi;
  if ($("pomoBugunDk")) $("pomoBugunDk").textContent = b.dk;
  if ($("pomoHafta")) $("pomoHafta").textContent = hafta;
}
function pomoKaydet(tamamlananMod) {
  if (!S) return;
  if (!S.pomo) S.pomo = { ...POMO_DEFAULTS, stats: {}, bind: null };
  if (!S.pomo.stats) S.pomo.stats = {};
  if (tamamlananMod === "focus") {
    // Turun bittiği günün anahtarı (sayfa gece yarısından önce açıldıysa todayKey eski kalır)
    const gun = tarihKey(new Date());
    const b = S.pomo.stats[gun] || { sayi: 0, dk: 0 };
    b.sayi += 1;
    // Ayardaki değil, bu turun başladığı andaki gerçek süre (tur sırasında ayar değişebilir)
    const dk = Math.max(1, Math.round((+pomo.toplam || 0) / 60)) || (+pomoAyarlari().focus || 25);
    b.dk += dk;
    S.pomo.stats[gun] = b;
    // Pomodoro bir göreve bağlıysa, odak süresini o göreve de yaz (görev başına toplam çalışma)
    if (S.pomo.bind && S.pomo.bind.tip === "gorev") {
      const g = (S.tasks || []).find(t => t.id === S.pomo.bind.id);
      if (g) { g.odakDk = (+g.odakDk || 0) + dk; g.pomo = (+g.pomo || 0) + 1; }
    }
    pomo.tur += 1;
    bildirimEkle("success", "Pomodoro tamamlandı 🍅", `Bir odak turu bitti. Toplam: ${b.sayi}`, "pomo-" + gun + "-" + b.sayi);
  }
  kaydet();
}
function cevresiHesapla(cevre, oran) { return cevre * (1 - oran); }
const SAYFA_BASLIGI = document.title;
const POMO_CEVRE = 2 * Math.PI * 88;
// Saniyede bir çalışan hafif güncelleme: sadece süre, halka ve sekme başlığı.
// (Eskiden her saniye tüm kart, düğmeler ve istatistikler yeniden çiziliyordu.)
function pomoTick() {
  const timeEl = $("pomoTime");
  const sure = `${pad(Math.floor(pomo.kalan / 60))}:${pad(pomo.kalan % 60)}`;
  if (timeEl) timeEl.textContent = sure;
  const ring = $("pomoRingFg");
  if (ring) {
    const oran = pomo.toplam > 0 ? (pomo.kalan / pomo.toplam) : 1;
    ring.style.strokeDashoffset = cevresiHesapla(POMO_CEVRE, oran);
  }
  document.title = pomo.calisiyor ? `${sure} · ${pomoModEtiket(pomo.mod)} — AYVEX` : SAYFA_BASLIGI;
}
function pomoRender() {
  const card = $("pomodoroCard"); const timeEl = $("pomoTime");
  const labelEl = $("pomoModeLabel"); const ring = $("pomoRingFg");
  if (!card || !timeEl) return;
  card.classList.remove("mode-focus", "mode-short", "mode-long");
  card.classList.add("mode-" + pomo.mod);
  if (labelEl) labelEl.textContent = pomoModEtiket(pomo.mod);
  if (ring) ring.style.strokeDasharray = POMO_CEVRE;
  pomoTick();
  const startBtn = $("pomoStart");
  if (startBtn) {
    startBtn.innerHTML = pomo.calisiyor
      ? `<svg width="18" height="18"><use href="#i-pause"/></svg><span id="pomoStartLabel">Duraklat</span>`
      : `<svg width="18" height="18"><use href="#i-play"/></svg><span id="pomoStartLabel">Başlat</span>`;
  }
  pomoStatsGuncelle();
  pomoBindRender();
}
function pomoModDegistir(mod) {
  pomo.mod = mod;
  pomo.toplam = pomoSure(mod);
  pomo.kalan = pomo.toplam;
  pomoDurdur();
  document.querySelectorAll(".pomo-tab").forEach(t => t.classList.toggle("on", t.dataset.mode === mod));
  pomoRender();
}
function pomoBaslat() {
  if (pomo.calisiyor) return;
  pomo.calisiyor = true;
  // Bitiş anını sakla; kalan süre her tikte saatten hesaplanır. Tarayıcı arka plandaki
  // sekmelerde setInterval'i yavaşlattığı için eski "her saniye -1" yöntemi geri kalıyordu.
  pomo.bitis = Date.now() + pomo.kalan * 1000;
  pomoRender();
  pomo.interval = setInterval(() => {
    pomo.kalan = Math.max(0, Math.round((pomo.bitis - Date.now()) / 1000));
    if (pomo.kalan <= 0) { pomoBitti(true); return; }
    pomoTick();
  }, 250);
}
function pomoDurdur() {
  pomo.calisiyor = false;
  if (pomo.interval) clearInterval(pomo.interval);
  pomo.interval = null;
  pomoRender();
}
function pomoSifirla() { pomoDurdur(); pomo.kalan = pomo.toplam; pomoRender(); }
let sesCtx = null; // Tek bir AudioContext kullan; her seferinde yenisini açmak kaynak sızdırıyordu
function pomoSesCal() {
  try {
    if (!sesCtx) sesCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sesCtx;
    if (ctx.state === "suspended") ctx.resume();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.8);
    setTimeout(() => {
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.connect(g2); g2.connect(ctx.destination);
      o2.type = "sine"; o2.frequency.value = 1100;
      g2.gain.setValueAtTime(0.15, ctx.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      o2.start(ctx.currentTime); o2.stop(ctx.currentTime + 0.6);
    }, 250);
  } catch (e) {}
}
// tamamlandi=false ise kullanıcı "Atla"ya basmıştır: tur istatistiğe sayılmaz, ses çalmaz.
function pomoBitti(tamamlandi) {
  if (pomo.interval) clearInterval(pomo.interval);
  pomo.interval = null;
  pomo.calisiyor = false;
  const a = pomoAyarlari();
  if (tamamlandi && a.sound === "on") pomoSesCal();
  if (tamamlandi && pomo.mod === "focus") pomoKaydet("focus");
  if (pomo.mod === "focus") {
    const turSayi = +a.cycle || 4;
    if (pomo.tur > 0 && pomo.tur % turSayi === 0) pomoModDegistir("long");
    else pomoModDegistir("short");
  } else {
    pomoModDegistir("focus");
  }
  if (tamamlandi && a.auto === "on") setTimeout(() => pomoBaslat(), 600);
  document.title = SAYFA_BASLIGI;
  // Odak süresi, görevin ⏱️ süresi, seri ve aylık rapor hemen güncellensin
  if (tamamlandi && S) ciz();
}
function pomoBindRender() {
  const btn = document.querySelector(".pomo-bind-btn");
  if (!btn) return;
  const label = $("pomoBindLabel");
  if (!label) return;
  if (S && S.pomo && S.pomo.bind) {
    const { tip, id } = S.pomo.bind;
    let ad2 = "";
    if (tip === "gorev") { const t = bul("tasks", id); ad2 = t ? t.t : ""; }
    else if (tip === "ders") { const d = bul("dersler", id); ad2 = d ? d.ad : ""; }
    else if (tip === "proje") ad2 = projeAdi(id);
    if (!ad2) {
      // Bağlı kayıt silinmiş (ör. başka cihazdan): seçimi bırak, "Seçili" yazısı asılı kalmasın
      S.pomo.bind = null;
      label.textContent = "Görev/Ders seç";
      btn.classList.remove("active");
      return;
    }
    label.textContent = ad2;
    btn.classList.add("active");
  } else {
    label.textContent = "Görev/Ders seç";
    btn.classList.remove("active");
  }
}
function pomoBindAc() {
  const list = $("pomoBindList");
  if (!list || !S) return;
  let aktifTab = document.querySelector(".pomo-bind-tab.on");
  // Moda ait olmayan sekme seçili kaldıysa (ör. iş modunda "Dersler") Görevler'e dön
  const yanlisSekme = aktifTab && aktifTab.classList.contains(S.mode === "work" ? "menu-ogrenci" : "menu-is");
  if (!aktifTab || yanlisSekme) {
    document.querySelectorAll(".pomo-bind-tab").forEach(t => t.classList.toggle("on", t.dataset.bindTab === "gorev"));
    aktifTab = document.querySelector(".pomo-bind-tab.on");
  }
  const tip = aktifTab ? aktifTab.dataset.bindTab : "gorev";
  if (tip === "proje") {
    const items = S.projeler.filter(p => p.durum !== "tamam");
    list.innerHTML = items.length
      ? items.map(p => `<button type="button" class="pomo-bind-item ders" data-pomo-bind="proje" data-id="${p.id}"><span class="pbi-dot"></span><span>${esc(p.ad)}</span></button>`).join("")
      : `<p class="pomo-bind-empty">Açık proje yok.</p>`;
    return;
  }
  if (tip === "gorev") {
    const items = (S.tasks || []).filter(t => !t.done);
    list.innerHTML = items.length
      ? items.map(t => `<button type="button" class="pomo-bind-item" data-pomo-bind="gorev" data-id="${t.id}"><span class="pbi-dot"></span><span>${esc(t.t)}</span></button>`).join("")
      : `<p class="pomo-bind-empty">Bekleyen görev yok.</p>`;
  } else {
    const items = (S.dersler || []);
    list.innerHTML = items.length
      ? items.map(d => `<button type="button" class="pomo-bind-item ders" data-pomo-bind="ders" data-id="${d.id}"><span class="pbi-dot"></span><span>${esc(d.ad)}${d.kod ? ` · ${esc(d.kod)}` : ""}</span></button>`).join("")
      : `<p class="pomo-bind-empty">Henüz ders yok.</p>`;
  }
}

// ================= DERS PROGRAMI =================
function dersSirala(a, b) { return saatDk(a.bas) - saatDk(b.bas); }
function bugunDersler() { return ((S && S.dersler) || []).filter(d => +d.gun === bugunGunNo).sort(dersSirala); }
// Tablo varsayılan olarak 08:00-20:00 arasını gösterir; daha erken/geç başlayan ya da biten
// ders varsa aralık genişletilir (eskiden bu dersler tabloda hiç görünmüyordu).
function dersSaatleri(dersler) {
  let ilk = 8, son = 20;
  dersler.forEach(d => {
    const b = Math.floor(saatDk(d.bas) / 60);
    const e = Math.ceil(saatDk(d.bit) / 60) - 1;
    if (b >= 0 && b < ilk) ilk = b;
    if (e > son) son = Math.min(23, e);
    if (b > son) son = Math.min(23, b);
  });
  return Array.from({ length: son - ilk + 1 }, (_, i) => ilk + i);
}

function haftalikGridCiz() {
  const grid = $("haftalikGrid");
  if (!grid || !S) return;
  const empty = $("dersEmpty");
  const dersler = S.dersler || [];
  if ($("statDersSayi")) $("statDersSayi").textContent = dersler.length;
  if ($("statDersBugun")) $("statDersBugun").textContent = bugunDersler().length;
  // "Bu hafta": haftanın 7 günündeki tüm ders saatleri (eskiden hafta sonu sayılmıyordu)
  if ($("statDersHafta")) $("statDersHafta").textContent = dersler.filter(d => +d.gun >= 0 && +d.gun <= 6).length;
  const cerceve = grid.closest(".haftalik-grid-wrap");
  if (!dersler.length) {
    grid.innerHTML = "";
    grid.style.gridTemplateRows = "";
    if (empty) empty.hidden = false;
    if (cerceve) cerceve.hidden = true;
    return;
  }
  if (empty) empty.hidden = true;
  if (cerceve) cerceve.hidden = false;
  const gunSirasi = [1, 2, 3, 4, 5, 6, 0];
  const SAATLER = dersSaatleri(dersler);
  grid.style.gridTemplateRows = `40px repeat(${SAATLER.length}, 60px)`;
  let html = "";
  html += `<div class="hg-bos" style="grid-row:1;grid-column:1"></div>`;
  gunSirasi.forEach((g, idx) => {
    const bugun = g === bugunGunNo;
    const col = idx + 2;
    html += `<div class="hg-gun-head ${bugun ? "bugun" : ""}" style="grid-row:1;grid-column:${col}">${GUNLER_KISA[g]}</div>`;
  });
  SAATLER.forEach((saat, satirIdx) => {
    const row = satirIdx + 2;
    html += `<div class="hg-saat" style="grid-row:${row};grid-column:1">${pad(saat)}:00</div>`;
    gunSirasi.forEach((gunNo, gunIdx) => {
      const col = gunIdx + 2;
      html += `<div class="hg-hucre" style="grid-row:${row};grid-column:${col}"></div>`;
    });
  });
  // Arama yapılıyorsa sadece eşleşen dersler çizilir (istatistikler tüm dersleri sayar)
  dersler.filter(d => eslesir(d.ad) || eslesir(d.kod)).forEach(d => {
    const basSaat = +d.bas.split(":")[0];
    const bitSaat = +d.bit.split(":")[0];
    const bitDk = +d.bit.split(":")[1] || 0;
    const basIdx = SAATLER.indexOf(basSaat);
    if (basIdx < 0) return;
    const bitSaatEtkin = bitDk > 0 ? bitSaat + 1 : bitSaat;
    const sure = Math.min(SAATLER.length - basIdx, Math.max(1, bitSaatEtkin - basSaat));
    const row = basIdx + 2;
    const col = gunSirasi.indexOf(+d.gun) + 2;
    html += `<div class="hg-ders ${d.renk || "teal"}"
      data-act="ders-edit" data-id="${d.id}"
      style="grid-row:${row} / span ${sure};grid-column:${col}"
      title="${esc(d.ad)} (${esc(d.bas)}-${esc(d.bit)})">
      <div class="hg-ders-ad">${esc(d.ad)}</div>
      ${d.kod ? `<div class="hg-ders-kod">${esc(d.kod)}</div>` : ""}
      ${d.sinif ? `<div class="hg-ders-yer"><svg width="10" height="10"><use href="#i-map-pin"/></svg> ${esc(d.sinif)}</div>` : ""}
    </div>`;
  });
  grid.innerHTML = html;
}

function miniDersGridCiz() {
  const el = $("miniDersGrid");
  if (!el || !S) return;
  // Hafta içi her zaman; Cumartesi/Pazar sadece o güne ders varsa gösterilir.
  // Arama yapılıyorsa sadece eşleşen dersler yerleştirilir.
  const tumDersler = S.dersler || [];
  const gunSirasi = [1, 2, 3, 4, 5, 6, 0].filter(g => g >= 1 && g <= 5 || tumDersler.some(d => +d.gun === g));
  const gorunen = tumDersler.filter(d => eslesir(d.ad) || eslesir(d.kod));
  const miniSaatler = [9, 11, 13, 15, 17];
  // Hiç ders yoksa boş gri tablo yerine ne yapılacağını söyleyen bir mesaj göster
  el.classList.toggle("mdg-bos", !tumDersler.length);
  if (!tumDersler.length) {
    el.style.gridTemplateColumns = "";
    el.style.gridAutoRows = "";
    el.innerHTML = `<div class="mdg-bos-mesaj">
      <p>Henüz ders eklemedin. Haftalık programın burada görünecek.</p>
      <button type="button" class="btn-primary" data-open="dlgDers"><svg width="16" height="16"><use href="#i-plus"/></svg> İlk dersini ekle</button>
    </div>`;
    return;
  }
  el.style.gridTemplateColumns = `repeat(${gunSirasi.length}, minmax(0, 1fr))`;
  el.style.gridAutoRows = "32px";
  let html = "";
  gunSirasi.forEach(g => {
    const bugun = g === bugunGunNo;
    html += `<div class="mdg-head ${bugun ? "bugun" : ""}">${GUNLER_KISA[g]}</div>`;
  });
  // Her satır iki saatlik bir dilimi temsil eder (09-11, 11-13, ...); dilimin dışında kalan
  // erken/geç dersler ilk/son satıra yerleşir. Eskiden sadece tam 9/11/13/15/17'de
  // başlayan dersler görünüyordu.
  const dilim = d => Math.min(miniSaatler.length - 1, Math.max(0, Math.floor((saatDk(d.bas) / 60 - 9) / 2)));
  miniSaatler.forEach((saat, satir) => {
    gunSirasi.forEach(gunNo => {
      const hucre = gorunen.filter(d => +d.gun === gunNo && dilim(d) === satir).sort(dersSirala);
      const ders = hucre[0];
      if (ders) {
        const ek = hucre.length > 1 ? ` +${hucre.length - 1}` : "";
        const baslik = hucre.map(d => `${d.ad} (${d.bas})`).join(", ");
        html += `<div class="mdg-ders ${ders.renk || "teal"}" data-act="ders-edit" data-id="${ders.id}" title="${esc(baslik)}">${esc(ders.ad.slice(0, 8))}${ek}</div>`;
      } else {
        html += `<div class="mdg-cell"></div>`;
      }
    });
  });
  el.innerHTML = html;
}

// ================= AKADEMİK =================
function sinavRenkSinif(tarih) {
  const fark = gunFarki(tarih);
  if (!(fark >= 0)) return "sinav-uzak";
  if (fark <= 3) return "sinav-acil";
  if (fark <= 7) return "sinav-yakin";
  return "sinav-uzak";
}
function sinavGeriSayim(tarih) {
  const fark = gunFarki(tarih);
  if (isNaN(fark)) return "";
  if (fark < 0) return "Geçti";
  if (fark === 0) return "Bugün!";
  if (fark === 1) return "Yarın";
  return `${fark} gün kaldı`;
}

function sinavlarCiz() {
  const el = $("sinavList");
  if (!el || !S) return;
  const tum = (S.sinavlar || []).filter(s => eslesir(s.ad));
  // Yaklaşanlar önce; ardından son 3 geçmiş sınav soluk gösterilir ki düzenlenip silinebilsin
  // (eskiden tarihi geçen sınav listeden kayboluyor, bir daha erişilemiyordu)
  const yaklasan = tum.filter(s => s.tarih >= todayKey).sort((a, b) => a.tarih.localeCompare(b.tarih)).slice(0, 6);
  const gecmis = tum.filter(s => s.tarih < todayKey).sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 3);
  const sinavlar = [...yaklasan, ...gecmis];
  if (!sinavlar.length) {
    el.innerHTML = `<li class="sinav-empty">${q && (S.sinavlar || []).length ? "Aramaya uyan sınav yok." : "Yaklaşan sınav yok. + butonuyla ekle."}</li>`;
    return;
  }
  el.innerHTML = sinavlar.map(s => {
    const [, m, d] = s.tarih.split("-");
    const ayKisa = aylar[+m - 1].slice(0, 3);
    const renkSinif = s.tarih < todayKey ? "sinav-gecmis" : sinavRenkSinif(s.tarih);
    return `<li class="sinav-item ${renkSinif}" data-act="sinav-edit" data-id="${s.id}">
      <div class="sinav-tarih">
        <span class="st-gun">${ayKisa}</span>
        <span class="st-sayi">${+d}</span>
      </div>
      <div class="sinav-body">
        <div class="sb-ad">${esc(s.ad)}</div>
        <div class="sb-meta">
          <span class="sinav-tur">${esc(s.tur)}</span>
          ${s.saat ? `<span><svg width="11" height="11"><use href="#i-clock"/></svg> ${esc(s.saat)}</span>` : ""}
          ${s.yer ? `<span><svg width="11" height="11"><use href="#i-map-pin"/></svg> ${esc(s.yer)}</span>` : ""}
        </div>
      </div>
      <span class="sinav-geri">${sinavGeriSayim(s.tarih)}</span>
    </li>`;
  }).join("");
}

function odevlerCiz() {
  const el = $("odevList");
  if (!el || !S) return;
  const odevler = (S.odevler || [])
    .filter(o => eslesir(o.ad) || eslesir(o.ders))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.tarih.localeCompare(b.tarih);
    });
  if (!odevler.length) {
    el.innerHTML = `<li class="odev-empty">${q && (S.odevler || []).length ? "Aramaya uyan ödev yok." : "Henüz ödev yok. + butonuyla ekle."}</li>`;
    return;
  }
  el.innerHTML = odevler.slice(0, 8).map(o => {
    // Teslim tarihi geçmiş, bitmemiş ödev acil (kırmızı) görünsün
    const renkSinif = o.done ? "" : o.tarih < todayKey ? "sinav-acil" : sinavRenkSinif(o.tarih);
    return `<li class="odev-item ${o.done ? "odev-done" : renkSinif}" data-act="odev-edit" data-id="${o.id}">
      <input type="checkbox" class="odev-check" data-act="odev-toggle" data-id="${o.id}" ${o.done ? "checked" : ""} onclick="event.stopPropagation()">
      <div class="odev-body">
        <div class="odev-ad">${esc(o.ad)}</div>
        <div class="odev-meta">
          ${o.ders ? `<span>${esc(o.ders)}</span>` : ""}
          <span><svg width="11" height="11"><use href="#i-clock"/></svg> ${gunEtiket(o.tarih)}</span>
        </div>
      </div>
      ${!o.done ? `<span class="sinav-geri">${sinavGeriSayim(o.tarih)}</span>` : ""}
    </li>`;
  }).join("");
}

function yksGrafikCiz() {
  const el = $("yksGrafik");
  if (!el || !S) return;
  const liste = (S.yksDenemeleri || []).slice().sort((a, b) => a.tarih.localeCompare(b.tarih));
  if (!liste.length) {
    el.innerHTML = `<div class="yks-grafik-empty">Henüz deneme yok. + ile ekle.</div>`;
    return;
  }
  const son = liste.slice(-8);
  const TYT_MAX = 120;
  const AYT_MAX = 80;
  el.innerHTML = son.map(d => {
    const tyt = +d.tyt || 0;
    const ayt = +d.ayt || 0;
    const tytYuzde = Math.max(4, (tyt / TYT_MAX) * 100);
    const aytYuzde = Math.max(4, (ayt / AYT_MAX) * 100);
    const [, m, gun] = d.tarih.split("-");
    const ayKisa = aylar[+m - 1].slice(0, 3);
    return `<div class="yks-bar-wrap" data-act="yks-edit" data-id="${d.id}" title="${esc(d.ad)} — TYT: ${tyt} / AYT: ${ayt} (düzenlemek için tıkla)">
      <span class="yks-bar-num">${tyt}${ayt ? ` / ${ayt}` : ""}</span>
      <div class="yks-bar-inner-wrap">
        ${tyt ? `<div class="yks-bar yks-bar-tyt" style="height:${tytYuzde}%"></div>` : ""}
        ${ayt ? `<div class="yks-bar yks-bar-ayt" style="height:${aytYuzde}%"></div>` : ""}
      </div>
      <span class="yks-bar-label">${ayKisa} ${+gun}</span>
    </div>`;
  }).join("");
}

const YKS_ALAN = { sayisal: "Sayısal", ea: "Eşit Ağırlık", sozel: "Sözel", dil: "Dil" };
function yksListeCiz() {
  const el = $("yksListe");
  if (!el || !S) return;
  const liste = (S.yksDenemeleri || []).slice().sort((a, b) => b.tarih.localeCompare(a.tarih));
  if (!liste.length) {
    el.innerHTML = `<li class="yks-liste-empty">Henüz deneme eklenmedi.</li>`;
    return;
  }
  el.innerHTML = liste.slice(0, 6).map(d => {
    const [, m, gun] = d.tarih.split("-");
    const ayKisa = aylar[+m - 1].slice(0, 3);
    return `<li class="yks-item" data-act="yks-edit" data-id="${d.id}" title="Düzenlemek için tıkla">
      <div class="yks-item-tarih">
        <span class="yt-gun">${ayKisa}</span>
        <span class="yt-ay">${+gun}</span>
      </div>
      <div class="yks-item-body">
        <div class="yks-item-ad">${esc(d.ad)}</div>
        <div class="yks-item-meta">${esc(YKS_ALAN[d.alan] || d.alan || "")}</div>
        <div class="yks-item-nets">
          ${d.tyt ? `<span class="yks-net-badge tyt">TYT ${d.tyt}</span>` : ""}
          ${d.ayt ? `<span class="yks-net-badge ayt">AYT ${d.ayt}</span>` : ""}
        </div>
      </div>
      <button type="button" class="yks-item-del" data-act="del" data-list="yksDenemeleri" data-id="${d.id}" aria-label="Sil">
        <svg width="14" height="14"><use href="#i-trash"/></svg>
      </button>
    </li>`;
  }).join("");
}

function yksOzetCiz() {
  if (!S) return;
  const liste = (S.yksDenemeleri || []).slice().sort((a, b) => b.tarih.localeCompare(a.tarih));
  // TYT ve AYT kartları ayrı ayrı, o netin girildiği en son denemeyi gösterir
  // (eskiden son denemede AYT yoksa önceki AYT'ler varken "Henüz deneme yok" yazıyordu)
  const sonTyt = liste.find(d => +d.tyt > 0);
  const sonAyt = liste.find(d => +d.ayt > 0);
  const tytEl = $("yksTytNet");
  const aytEl = $("yksAytNet");
  const tytTarihEl = $("yksTytTarih");
  const aytTarihEl = $("yksAytTarih");
  if (tytEl) tytEl.textContent = sonTyt ? sonTyt.tyt + " net" : "—";
  if (aytEl) aytEl.textContent = sonAyt ? sonAyt.ayt + " net" : "—";
  if (tytTarihEl) tytTarihEl.textContent = sonTyt ? gunEtiket(sonTyt.tarih) : "Henüz deneme yok";
  if (aytTarihEl) aytTarihEl.textContent = sonAyt ? gunEtiket(sonAyt.tarih) : "Henüz deneme yok";
}

function acOzetCiz() {
  if (!S) return;
  const courses = S.courses || [];
  const ort = courses.length ? courses.reduce((t, c) => t + c.g, 0) / courses.length : 0;
  const ortEl = $("acOrtalama");
  const ortSubEl = $("acOrtalamaSub");
  if (ortEl) ortEl.textContent = courses.length ? ort.toFixed(1) : "—";
  if (ortSubEl) ortSubEl.textContent = courses.length ? `${courses.length} ders üzerinden` : "Henüz not girilmedi";

  // Ders sayısı: ders programındaki ve not girilen derslerin (aynı adlar bir kez) toplamı.
  // Eskiden sadece not girilenleri sayıyordu; programda 4 ders varken 0 görünüyordu.
  if ($("acDersSayi")) {
    const adlar = new Set([...courses.map(c => aramaNorm(c.n)), ...(S.dersler || []).map(d => aramaNorm(d.ad))].filter(Boolean));
    $("acDersSayi").textContent = adlar.size;
  }
  if ($("acSınavSayi")) {
    $("acSınavSayi").textContent = (S.sinavlar || []).filter(s => s.tarih >= todayKey).length;
  }
  if ($("acOdevSayi")) {
    $("acOdevSayi").textContent = (S.odevler || []).filter(o => !o.done).length;
  }
}

// ================= KARİYER =================
const BASVURU_TUR = { staj: "Staj", ilkis: "İlk İş", parttime: "Yarı Zamanlı", gonullu: "Gönüllü" };
const BASVURU_DURUM = { beklemede: "Beklemede", mulakat: "Mülakat", kabul: "Kabul", red: "Red" };
const KURS_PLATFORM = { udemy: "Udemy", coursera: "Coursera", btk: "BTK Akademi", youtube: "YouTube", okul: "Okul", diger: "Diğer" };
const KH_KATEGORI = { beceri: "Beceri", basvuru: "Başvuru", network: "Network", egitim: "Eğitim", diger: "Diğer" };
// Kullanıcının girdiği linki yalnızca http(s) ise kabul et ("javascript:" gibi şemaları engeller).
const guvenliLink = u => {
  const s = String(u || "").trim();
  if (!s) return "";
  const tam = /^https?:\/\//i.test(s) ? s : "https://" + s;
  try { const x = new URL(tam); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch (e) { return ""; }
};

function kariyerCiz() {
  if (!S) return;
  const bv = S.basvurular, kr = S.kurslar, kh = S.kariyerHedefler;

  const sayi = d => bv.filter(b => b.durum === d).length;
  if ($("caStat1")) $("caStat1").textContent = bv.filter(b => b.tur === "staj").length;
  if ($("caStat2")) $("caStat2").textContent = sayi("mulakat");
  if ($("caStat3")) $("caStat3").textContent = sayi("kabul");
  if ($("caStat4")) $("caStat4").textContent = S.skills.length;
  if ($("caHeroVal")) $("caHeroVal").textContent = bv.length;
  if ($("caHeroSub")) {
    const tamamKurs = kr.filter(k => +k.yuzde >= 100).length;
    $("caHeroSub").textContent = bv.length || kr.length
      ? `${bv.length} başvuru · ${sayi("beklemede")} beklemede · ${tamamKurs}/${kr.length} kurs tamamlandı`
      : "Henüz kayıt yok";
  }

  const bl = $("basvuruList");
  if (bl) {
    const liste = bv.slice().sort((a, b) => (b.tarih || "").localeCompare(a.tarih || ""));
    bl.innerHTML = liste.length ? liste.map(b => {
      const durum = BASVURU_DURUM[b.durum] ? b.durum : "beklemede";
      const kalan = b.sontarih ? gunFarki(b.sontarih) : NaN;
      return `<li class="basvuru-item durum-${durum}" data-act="basvuru-edit" data-id="${b.id}" title="Düzenlemek için tıkla">
        <div class="basvuru-body">
          <div class="basvuru-sirket">${esc(b.sirket)}</div>
          <div class="basvuru-pozisyon">${esc(b.pozisyon)}</div>
          <div class="basvuru-meta">
            <span class="basvuru-tur">${BASVURU_TUR[b.tur] || "Diğer"}</span>
            ${b.tarih ? `<span><svg width="11" height="11"><use href="#i-calendar"/></svg> ${gunEtiket(b.tarih)}</span>` : ""}
            ${kalan >= 0 && durum === "beklemede" ? `<span><svg width="11" height="11"><use href="#i-clock"/></svg> Son: ${kalan === 0 ? "bugün" : kalan + " gün"}</span>` : ""}
          </div>
        </div>
        <span class="basvuru-durum durum-${durum}">${BASVURU_DURUM[durum]}</span>
      </li>`;
    }).join("") : `<li class="ca-empty">Henüz başvuru yok. + butonuyla ekle.</li>`;
  }

  const kl = $("kursList");
  if (kl) {
    kl.innerHTML = kr.length ? kr.map(k => {
      const y = Math.min(100, Math.max(0, +k.yuzde || 0));
      const link = guvenliLink(k.link);
      return `<li class="kurs-item" data-act="kurs-edit" data-id="${k.id}" title="Düzenlemek için tıkla">
        <div class="kurs-head"><span class="kurs-ad">${esc(k.ad)}</span><span class="kurs-yuzde">%${y}</span></div>
        <div class="kurs-bar"><span style="width:${y}%"></span></div>
        <div class="kurs-meta">
          <span class="kurs-platform">${KURS_PLATFORM[k.platform] || "Diğer"}</span>
          ${link ? `<a class="kurs-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer" data-stop>Kursa git →</a>` : ""}
        </div>
      </li>`;
    }).join("") : `<li class="ca-empty">Henüz kurs yok. + butonuyla ekle.</li>`;
  }

  const hl = $("kariyerHedefList");
  if (hl) {
    const liste = kh.slice().sort((a, b) => (a.done === b.done ? (a.tarih || "9").localeCompare(b.tarih || "9") : a.done ? 1 : -1));
    hl.innerHTML = liste.length ? liste.map(h => `
      <li class="kh-item ${h.done ? "done" : ""}" data-act="kh-edit" data-id="${h.id}" title="Düzenlemek için tıkla">
        <input type="checkbox" class="kh-check" data-act="kh-toggle" data-id="${h.id}" ${h.done ? "checked" : ""} aria-label="Tamamlandı">
        <div class="kh-body">
          <div class="kh-baslik">${esc(h.baslik)}</div>
          <div class="kh-meta">
            <span class="kh-kategori">${KH_KATEGORI[h.kategori] || "Diğer"}</span>
            ${h.tarih ? `<span>${gunEtiket(h.tarih)}${!h.done ? " · " + sinavGeriSayim(h.tarih) : ""}</span>` : ""}
          </div>
        </div>
        <button type="button" class="kh-del" data-act="del" data-list="kariyerHedefler" data-id="${h.id}" aria-label="Sil"><svg width="14" height="14"><use href="#i-trash"/></svg></button>
      </li>`).join("") : `<li class="ca-empty">Henüz kariyer hedefi yok. + butonuyla ekle.</li>`;
  }
}

// Düzenlenebilir kayıt diyaloglarının tanımı: liste adı, alanlar ve başlıklar.
// Anahtar, listedeki öğenin data-act değerinin önekidir (ör. "proje" → data-act="proje-edit").
const DUZENLE_DLG = {
  proje:    { dlg: "dlgProje",        list: "projeler",        sil: "silProje",        baslik: "dlgProjeTitle",        ekle: "Proje Ekle", duzenle: "Projeyi Düzenle",
              alanlar: ["ad", "ekip", "durum", "oncelik", "bas", "bitis", "ilerleme", "notlar"] },
  plan:     { dlg: "dlgPlanItem",     list: "planItems",       sil: "silPlanItem",     baslik: "dlgPlanItemTitle",     ekle: "Haftalık Plana Ekle", duzenle: "Plan İşini Düzenle",
              alanlar: ["baslik", "gun", "saat", "kategori"] },
  toplanti: { dlg: "dlgToplanti",     list: "toplantilar",     sil: "silToplanti",     baslik: "dlgToplantiTitle",     ekle: "Toplantı Ekle", duzenle: "Toplantıyı Düzenle",
              alanlar: ["baslik", "tarih", "saat", "sure", "proje", "katilimcilar", "link", "notlar"] },
  basvuru:  { dlg: "dlgBasvuru",      list: "basvurular",      sil: "silBasvuru",      baslik: "dlgBasvuruTitle",      ekle: "Başvuru Ekle", duzenle: "Başvuruyu Düzenle",
              alanlar: ["sirket", "pozisyon", "tur", "tarih", "durum", "sontarih", "link", "notlar"] },
  kurs:     { dlg: "dlgKurs",         list: "kurslar",         sil: "silKurs",         baslik: "dlgKursTitle",         ekle: "Kurs Ekle", duzenle: "Kursu Düzenle",
              alanlar: ["ad", "platform", "yuzde", "link", "notlar"] },
  kh:       { dlg: "dlgKariyerHedef", list: "kariyerHedefler", sil: "silKariyerHedef", baslik: "dlgKariyerHedefTitle", ekle: "Kariyer Hedefi Ekle", duzenle: "Kariyer Hedefini Düzenle",
              alanlar: ["baslik", "kategori", "tarih", "notlar"] },
};
function kayitDuzenleAc(tip, id) {
  const c = DUZENLE_DLG[tip];
  const it = bul(c.list, id);
  if (!it) return;
  const form = $(c.dlg).querySelector("form");
  form.reset();
  projeSecenekleriDoldur();
  form.querySelector("[name=id]").value = it.id;
  c.alanlar.forEach(a => {
    const el = form.querySelector(`[name=${a}]`);
    if (!el || it[a] == null) return;
    // Tamamlanmış bir projeye bağlı kayıtta o proje listede olmayabilir: seçeneği ekle
    if (el.tagName === "SELECT" && it[a] && ![...el.options].some(o => o.value === String(it[a]))) {
      const p = a === "proje" && bul("projeler", it[a]);
      if (p) el.insertAdjacentHTML("beforeend", `<option value="${p.id}">${esc(p.ad)}</option>`);
    }
    el.value = it[a];
  });
  $(c.baslik).textContent = c.duzenle;
  $(c.sil).hidden = false;
  if (tip === "proje") paylasimKutusu(it);
  guvenliAc($(c.dlg));
}
const DUZENLE_SECICI = Object.keys(DUZENLE_DLG).map(k => `[data-act='${k}-edit']`).join(",");
function kayitGuncelle(list, kayit) {
  const idx = S[list].findIndex(x => x.id === kayit.id);
  if (idx >= 0) S[list][idx] = { ...S[list][idx], ...kayit };
  else S[list].push(kayit);
}

// ================= İŞ PLANI =================
function planKategoriEtiket(k) {
  return k === "toplanti" ? "Toplantı" : k === "gorev" ? "Görev" : k === "odak" ? "Odak" : k === "mola" ? "Mola" : "Diğer";
}
function planItemSirala(a, b) { return (+a.gun) - (+b.gun) || saatDk(a.saat) - saatDk(b.saat); }

function planHaftalikCiz() {
  const el = $("haftalikPlanList");
  if (!el || !S) return;
  const items = (S.planItems || []).slice().sort(planItemSirala);
  if (!items.length) {
    el.innerHTML = `<p class="plan-empty">Henüz plan yok. Aşağıdaki "Yeni İş Ekle" butonuna bas.</p>`;
    return;
  }
  const gunler = [1, 2, 3, 4, 5, 6, 0];
  const bugunDt = new Date();
  let html = "";
  gunler.forEach(gunNo => {
    const gunItems = items.filter(it => +it.gun === gunNo);
    if (!gunItems.length) return;
    // Haftanın Pazartesi'sinden say: eskiden bugün Pazar iken tarihler bir hafta ileri kayıyordu
    const tarih = tarihOku(haftaGunleriKey()[(gunNo + 6) % 7]);
    const tarihMetni = `${tarih.getDate()} ${aylar[tarih.getMonth()]}`;
    html += `<div class="plan-gun">
      <div class="plan-gun-head">
        <span class="plan-gun-title">${GUNLER[gunNo]}</span>
        <span class="plan-gun-tarih">${tarihMetni}</span>
      </div>
      <ul class="plan-gun-items">` +
      gunItems.map(it => `
        <li class="plan-item ${it.kategori || "gorev"}" data-act="plan-edit" data-id="${it.id}" title="Düzenlemek için tıkla">
          <span class="pi-saat">${esc(it.saat)}</span>
          <span class="pi-baslik">${esc(it.baslik)}</span>
          <span class="pi-kategori">${planKategoriEtiket(it.kategori)}</span>
          <button type="button" class="pi-del" data-act="del" data-list="planItems" data-id="${it.id}" aria-label="Sil">
            <svg width="14" height="14"><use href="#i-x"/></svg>
          </button>
        </li>`).join("") +
      `</ul></div>`;
  });
  el.innerHTML = html || `<p class="plan-empty">Bu hafta için plan yok.</p>`;
}

function planPerformansCiz() {
  if (!S) return;
  const bugunDt = new Date();
  const gunNo = bugunDt.getDay();
  const pazartesiFark = (gunNo === 0 ? -6 : 1 - gunNo);
  let haftaGorev = 0, ayGorev = 0;
  const gunSayilari = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

  // Haftanın günlerini bir kez hesapla (eskiden her görev için 7 Date nesnesi oluşturuluyordu)
  const haftaGunleri = new Map();
  for (let i = 0; i < 7; i++) {
    const d = new Date(bugunDt);
    d.setDate(bugunDt.getDate() + pazartesiFark + i);
    haftaGunleri.set(tarihKey(d), d.getDay());
  }
  const buAy = todayKey.slice(0, 7);
  (S.tasks || []).forEach(t => {
    if (!t.done) return;
    const k = gorevBitisGunu(t);
    if (!k) return;
    if (haftaGunleri.has(k)) { haftaGorev++; gunSayilari[haftaGunleri.get(k)]++; }
    if (k.slice(0, 7) === buAy) ayGorev++;
  });

  if ($("perfHaftaGorev")) $("perfHaftaGorev").textContent = haftaGorev;
  // Odak süresi: kaydedilen gerçek dakikalardan (eskiden tur sayısı × güncel odak süresiydi;
  // ayar değişince geçmiş turlar da yeni süreyle hesaplanıyordu)
  if ($("perfHaftaSaat")) $("perfHaftaSaat").textContent = String(Math.round(pomoHaftaToplam("dk") / 6) / 10).replace(".", ",");
  if ($("perfAyGorev")) $("perfAyGorev").textContent = ayGorev;
  if ($("perfProje")) $("perfProje").textContent = S.projeler.filter(p => p.durum === "aktif").length;

  const chart = $("perfChart");
  if (!chart) return;
  const gunSirasi = [1, 2, 3, 4, 5, 6, 0];
  const maks = Math.max(1, ...Object.values(gunSayilari));
  chart.innerHTML = gunSirasi.map(g => {
    const sayi = gunSayilari[g] || 0;
    const yuzde = (sayi / maks) * 100;
    return `<div class="perf-bar">
      <span class="perf-bar-num">${sayi}</span>
      <div class="perf-bar-inner" style="height:${yuzde}%"></div>
      <span class="perf-bar-label">${GUNLER_KISA[g]}</span>
    </div>`;
  }).join("");
}

function planToplantilarCiz() {
  const yakEl = $("toplantiYaklasan");
  const gecEl = $("toplantiGecmis");
  if (!yakEl || !gecEl || !S) return;
  const now2 = new Date();
  const toplantilar = S.toplantilar || [];
  const yaklasan = []; const gecmis = [];
  toplantilar.forEach(t => {
    if (!eslesir(t.baslik)) return;
    // Toplantı bitene kadar "yaklaşan" listesinde kalsın
    const dt = tarihOku(t.tarih);
    dt.setMinutes(saatDk(t.saat) + (+t.sure || 30));
    if (dt >= now2) yaklasan.push({ ...t, _dt: dt });
    else gecmis.push({ ...t, _dt: dt });
  });
  yaklasan.sort((a, b) => a._dt - b._dt);
  gecmis.sort((a, b) => b._dt - a._dt);
  const renderItem = t => {
    const [, m, d] = t.tarih.split("-");
    const gun = +d;
    const ay = aylar[+m - 1].slice(0, 3);
    const pa = projeAdi(t.proje);
    const link = guvenliLink(t.link);
    return `<li class="toplanti-item" data-act="toplanti-edit" data-id="${t.id}" title="Düzenlemek için tıkla">
      <div class="toplanti-tarih">
        <span class="tt-gun">${gun} ${ay}</span>
        <span class="tt-saat">${esc(t.saat)}</span>
      </div>
      <div class="toplanti-body">
        <div class="tb-baslik">${esc(t.baslik)}</div>
        <div class="tb-meta">
          ${t.sure ? `<span><svg width="11" height="11"><use href="#i-clock"/></svg> ${t.sure} dk</span>` : ""}
          ${t.katilimcilar ? `<span><svg width="11" height="11"><use href="#i-users"/></svg> ${esc(t.katilimcilar)}</span>` : ""}
          ${pa ? `<span><svg width="11" height="11"><use href="#i-briefcase"/></svg> ${esc(pa)}</span>` : ""}
          ${link ? `<a class="kurs-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer" data-stop>Katıl →</a>` : ""}
        </div>
      </div>
      <button type="button" class="toplanti-del" data-act="del" data-list="toplantilar" data-id="${t.id}" aria-label="Sil">
        <svg width="14" height="14"><use href="#i-trash"/></svg>
      </button>
    </li>`;
  };
  yakEl.innerHTML = yaklasan.length ? yaklasan.map(renderItem).join("") : `<li class="toplanti-empty">Yaklaşan toplantı yok.</li>`;
  gecEl.innerHTML = gecmis.length ? gecmis.slice(0, 10).map(renderItem).join("") : `<li class="toplanti-empty">Geçmiş toplantı yok.</li>`;
}

function planSekmeDegistir(s) {
  planSekme = s;
  document.querySelectorAll(".plan-tab").forEach(t => t.classList.toggle("on", t.dataset.planTab === s));
  document.querySelectorAll(".plan-panel").forEach(p => p.classList.toggle("on", p.dataset.planPanel === s));
  if (s === "sprint") sprintCiz();
  if (s === "haftalik") planHaftalikCiz();
  if (s === "performans") { planPerformansCiz(); velocityCiz(); }
}

function miniPlanCiz() {
  const el = $("miniPlanList");
  if (!el || !S) return;
  const items = (S.planItems || []).slice().sort(planItemSirala).slice(0, 5);
  if (!items.length) {
    el.innerHTML = `<li class="mini-plan-empty">Bu hafta plan yok.</li>`;
    return;
  }
  el.innerHTML = items.map(it => {
    const gunKisa = GUNLER_KISA[+it.gun];
    return `<li class="mini-plan-item ${it.kategori || "gorev"}">
      <span class="mp-gun">${gunKisa}</span>
      <span class="mp-saat">${esc(it.saat)}</span>
      <span class="mp-baslik">${esc(it.baslik)}</span>
    </li>`;
  }).join("");
}

// ================= İŞ MODU: PROJELER =================
const PROJE_DURUM = { planlama: "Planlama", aktif: "Aktif", beklemede: "Beklemede", tamam: "Tamamlandı" };
let projeFiltre = "acik";

// Proje seçim kutularını (görev formu, sprint formu, toplantı formu) güncel listeyle doldurur
function projeSecenekleriDoldur() {
  if (!S) return;
  const acik = S.projeler.filter(p => p.durum !== "tamam");
  const html = `<option value="">Proje yok</option>` + acik.map(p => `<option value="${p.id}">${esc(p.ad)}</option>`).join("");
  document.querySelectorAll("select.proje-secim").forEach(sel => {
    const onceki = sel.value;
    sel.innerHTML = html;
    // Düzenlenen kayıt tamamlanmış bir projeye bağlıysa o seçeneği de ekle
    if (onceki && !acik.some(p => p.id === onceki)) {
      const p = bul("projeler", onceki);
      if (p) sel.insertAdjacentHTML("beforeend", `<option value="${p.id}">${esc(p.ad)}</option>`);
    }
    sel.value = onceki;
  });
}
const projeAdi = id => { const p = id && bul("projeler", id); return p ? p.ad : ""; };

// Projeye bağlı görev + sprint işlerinden ilerleme; bağlı iş yoksa manuel değer
function projeIlerleme(p) {
  const gorevler = S.tasks.filter(t => t.proje === p.id);
  const isler = S.sprintIsleri.filter(s => s.proje === p.id);
  const puanToplam = isler.reduce((t, s) => t + (+s.puan || 1), 0);
  const toplam = gorevler.length + puanToplam;
  // Açıklama metni: her görev 1 birim, her sprint işi puanı kadar birim sayılır
  const ozet = [gorevler.length && `${gorevler.length} görev`, isler.length && `${isler.length} sprint işi (${puanToplam} puan)`].filter(Boolean).join(" + ");
  const aciklama = "İlerleme = tamamlanan birim / toplam birim. Her görev 1 birim, her sprint işi puanı kadar birim sayılır.";
  if (p.durum === "tamam") return { yuzde: 100, otomatik: toplam > 0, toplam: gorevler.length + isler.length, ozet, aciklama };
  if (!toplam) return { yuzde: Math.min(100, Math.max(0, +p.ilerleme || 0)), otomatik: false, toplam: 0, ozet: "", aciklama: "Projeye bağlı görev ya da sprint işi yok; ilerleme elle giriliyor." };
  const biten = gorevler.filter(t => t.done).length + isler.filter(s => s.durum === "done").reduce((t, s) => t + (+s.puan || 1), 0);
  return { yuzde: Math.round(biten / toplam * 100), otomatik: true, toplam: gorevler.length + isler.length, ozet, aciklama };
}
const projeGecikti = p => p.durum !== "tamam" && p.bitis && gunFarki(p.bitis) < 0;

function projelerCiz() {
  const el = $("projeList");
  if (!el || !S) return;
  const tum = S.projeler;
  if ($("prjToplam")) $("prjToplam").textContent = tum.length;
  if ($("prjAktif")) $("prjAktif").textContent = tum.filter(p => p.durum === "aktif").length;
  if ($("prjGeciken")) $("prjGeciken").textContent = tum.filter(projeGecikti).length;
  if ($("prjTamam")) $("prjTamam").textContent = tum.filter(p => p.durum === "tamam").length;
  document.querySelectorAll("[data-proje-filtre]").forEach(b => b.classList.toggle("on", b.dataset.projeFiltre === projeFiltre));

  const oncelikSira = { high: 0, mid: 1, low: 2 };
  const liste = tum
    .filter(p => projeFiltre === "hepsi" || (projeFiltre === "tamam" ? p.durum === "tamam" : p.durum !== "tamam"))
    .filter(p => eslesir(p.ad))
    // Geciken projeler, önceliğinden bağımsız olarak en üstte; sonra öncelik, sonra teslim tarihi
    .sort((a, b) => (projeGecikti(b) ? 1 : 0) - (projeGecikti(a) ? 1 : 0)
      || (oncelikSira[a.oncelik] ?? 1) - (oncelikSira[b.oncelik] ?? 1)
      || (a.bitis || "9").localeCompare(b.bitis || "9"));
  if (!liste.length) {
    el.innerHTML = `<p class="plan-empty">${tum.length ? "Bu filtreye uyan proje yok." : "Henüz proje yok. Sağ üstteki \"Proje Ekle\" butonuna bas."}</p>`;
    return;
  }
  el.innerHTML = liste.map(p => {
    const il = projeIlerleme(p);
    const gecikti = projeGecikti(p);
    const kalan = p.bitis ? gunFarki(p.bitis) : NaN;
    const kalanMetin = !p.bitis ? "Teslim tarihi yok" : p.durum === "tamam" ? gunEtiket(p.bitis)
      : gecikti ? `${-kalan} gün gecikti` : kalan === 0 ? "Bugün teslim" : `${kalan} gün kaldı`;
    const oncelik = ONCELIK[p.oncelik] ? p.oncelik : "mid";
    return `<article class="proje-card durum-${PROJE_DURUM[p.durum] ? p.durum : "aktif"} ${gecikti ? "gecikti" : ""}" data-act="proje-edit" data-id="${p.id}" tabindex="0" title="Düzenlemek için tıkla">
      <div class="proje-ust">
        <span class="proje-durum">${PROJE_DURUM[p.durum] || "Aktif"}</span>
        <span class="task-pri-badge pri-${oncelik}"><svg width="10" height="10"><use href="#i-flag"/></svg> ${ONCELIK[oncelik]}</span>
      </div>
      <h3 class="proje-ad">${esc(p.ad)}</h3>
      ${p.ekip ? `<div class="proje-ekip"><svg width="12" height="12"><use href="#i-users"/></svg> ${esc(p.ekip)}</div>` : ""}
      <div class="proje-ilerleme">
        <div class="kurs-bar"><span style="width:${il.yuzde}%"></span></div>
        <span class="proje-yuzde">%${il.yuzde}</span>
      </div>
      <div class="proje-alt">
        <span class="${gecikti ? "proje-gecikme" : ""}"><svg width="11" height="11"><use href="#i-clock"/></svg> ${kalanMetin}</span>
        <span title="${esc(il.aciklama)}">${il.otomatik ? esc(il.ozet) : "Manuel ilerleme"} ⓘ</span>
      </div>
    </article>`;
  }).join("");
}

// ================= İŞ MODU: SPRINT =================
const sprintKalanGun = () => S && S.sprint ? gunFarki(S.sprint.bit) : NaN;
// Bitmiş sprintlerin tamamlanan işleri silinmez, "arsiv" alanıyla saklanır: panoda görünmezler
// ama projelerin ilerleme hesabında kalırlar (eskiden silindikleri için ilerleme düşüyordu).
const aktifSprintIsleri = () => S.sprintIsleri.filter(s => !s.arsiv);
function sprintPuanlari() {
  const isler = aktifSprintIsleri();
  const puan = s => +s.puan || 1;
  const toplam = isler.reduce((t, s) => t + puan(s), 0);
  const biten = isler.filter(s => s.durum === "done").reduce((t, s) => t + puan(s), 0);
  return { toplam, biten, yuzde: toplam ? Math.round(biten / toplam * 100) : 0 };
}

function sprintCiz() {
  if (!S || !$("sprintOzet")) return;
  const sp = S.sprint;
  const p = sprintPuanlari();
  const kalan = sprintKalanGun();
  const kapasite = +sp.kapasite || 20;
  const kalanMetin = kalan < 0 ? `Süresi ${-kalan} gün önce doldu` : kalan === 0 ? "Bugün bitiyor" : `${kalan} gün kaldı`;
  $("sprintOzet").innerHTML = `
    <div class="sprint-ozet-sol">
      <div class="sprint-ad">${esc(sp.ad)}</div>
      <div class="sprint-tarih">${gunEtiket(sp.bas)} – ${gunEtiket(sp.bit)} · <b class="${kalan < 0 ? "proje-gecikme" : ""}">${kalanMetin}</b></div>
      ${sp.hedef ? `<div class="sprint-hedef"><svg width="12" height="12"><use href="#i-target"/></svg> ${esc(sp.hedef)}</div>` : ""}
    </div>
    <div class="sprint-ozet-sag">
      <div class="sprint-puan"><b>${p.biten}</b> / ${p.toplam} puan</div>
      <div class="kurs-bar"><span style="width:${p.yuzde}%"></span></div>
      <div class="sprint-kapasite ${p.toplam > kapasite ? "asim" : ""}">Kapasite: ${kapasite} puan${p.toplam > kapasite ? ` · ${p.toplam - kapasite} puan fazla yük` : ""}</div>
    </div>`;

  const kolonlar = { todo: [], doing: [], done: [] };
  aktifSprintIsleri().filter(s => eslesir(s.baslik)).forEach(s => (kolonlar[s.durum] || kolonlar.todo).push(s));
  const item = s => {
    const pa = projeAdi(s.proje);
    const btn = (to, label, cls) => `<button type="button" class="ki-btn ${cls}" data-act="sprint-move" data-to="${to}" data-id="${s.id}">${label}</button>`;
    const aksiyon = s.durum === "done" ? btn("doing", "Geri", "undo")
      : s.durum === "doing" ? btn("done", "Bitti", "done-btn") + btn("todo", "Geri", "undo")
      : btn("doing", "Başla", "start");
    return `<li class="kanban-item ${s.durum === "done" ? "done" : ""}">
      <div class="ki-text">${esc(s.baslik)}</div>
      ${pa ? `<div class="sp-proje"><svg width="10" height="10"><use href="#i-briefcase"/></svg> ${esc(pa)}</div>` : ""}
      <div class="ki-meta">
        <span class="sp-puan" title="Efor puanı">${+s.puan || 1} p</span>
        <span class="ki-actions">${aksiyon}<button type="button" class="ki-btn x-btn" data-act="del" data-list="sprintIsleri" data-id="${s.id}" aria-label="Sil"><svg width="12" height="12"><use href="#i-x"/></svg></button></span>
      </div>
    </li>`;
  };
  const yaz = (id, liste, bos) => {
    if ($(id)) $(id).innerHTML = liste.length ? liste.map(item).join("") : `<li class="kanban-empty">${bos}</li>`;
    if ($(id + "Count")) $(id + "Count").textContent = liste.length;
  };
  yaz("spTodo", kolonlar.todo, "Yapılacak iş yok");
  yaz("spDoing", kolonlar.doing, "Devam eden yok");
  yaz("spDone", kolonlar.done, "Tamamlanan yok");
  velocityCiz();
}

function sprintMiniCiz() {
  const el = $("sprintMini");
  if (!el || !S) return;
  const p = sprintPuanlari();
  const kalan = sprintKalanGun();
  const devam = aktifSprintIsleri().filter(s => s.durum === "doing");
  el.innerHTML = `
    <div class="sprint-mini-ust"><b>${esc(S.sprint.ad)}</b><span>${kalan < 0 ? "Süresi doldu" : kalan === 0 ? "Bugün bitiyor" : kalan + " gün kaldı"}</span></div>
    <div class="kurs-bar"><span style="width:${p.yuzde}%"></span></div>
    <div class="sprint-mini-alt">%${p.yuzde} tamamlandı · ${p.biten}/${p.toplam} puan</div>
    <ul class="mini-plan-list">${devam.length
      ? devam.slice(0, 4).map(s => `<li class="mini-plan-item odak"><span class="mp-saat">${+s.puan || 1}p</span><span class="mp-baslik">${esc(s.baslik)}</span></li>`).join("")
      : `<li class="mini-plan-empty">Şu an devam eden sprint işi yok.</li>`}</ul>`;
}

function velocityCiz() {
  const el = $("velocityChart");
  if (!el || !S) return;
  const son = S.sprintGecmis.slice(-6);
  if (!son.length) { el.innerHTML = `<p class="plan-empty" style="width:100%">Bir sprinti bitirdiğinde tamamlanan puanlar burada görünür.</p>`; return; }
  const maks = Math.max(1, ...son.map(s => s.toplam || 0));
  el.innerHTML = son.map(s => `<div class="perf-bar" title="${esc(s.ad)}: ${s.biten}/${s.toplam} puan">
      <span class="perf-bar-num">${s.biten}</span>
      <div class="perf-bar-inner" style="height:${(s.biten / maks) * 100}%"></div>
      <span class="perf-bar-label">${esc(s.ad.replace("Sprint ", "S"))}</span>
    </div>`).join("");
}

// Sprinti kapatır: tamamlanan puanı geçmişe yazar, bitmeyen işleri yeni sprinte taşır
function sprintBitir() {
  const sp = S.sprint;
  const p = sprintPuanlari();
  const bitmeyen = aktifSprintIsleri().filter(s => s.durum !== "done").length;
  if (!confirm(`"${sp.ad}" bitirilsin mi?\n\nTamamlanan: ${p.biten}/${p.toplam} puan\n${bitmeyen} bitmemiş iş yeni sprinte taşınacak.`)) return;
  S.sprintGecmis.push({ ad: sp.ad, bas: sp.bas, bit: sp.bit, biten: p.biten, toplam: p.toplam });
  if (S.sprintGecmis.length > 20) S.sprintGecmis.splice(0, S.sprintGecmis.length - 20);
  S.sprintIsleri.forEach(s => { if (!s.arsiv && s.durum === "done") s.arsiv = sp.ad; });
  const sure = Math.max(1, Math.round((tarihOku(sp.bit) - tarihOku(sp.bas)) / GUN_MS) + 1);
  // Erken bitirildiyse yeni sprint bugün başlar; son gününde bitirildiyse yarın;
  // süresi geçtikten sonra bitirildiyse yine bugün (arada sprintsiz boşluk kalmasın).
  const bugun = tarihOku(todayKey);
  const ertesi = tarihOku(sp.bit); ertesi.setDate(ertesi.getDate() + 1);
  const bas = sp.bit === todayKey ? ertesi : bugun;
  const bit = new Date(bas); bit.setDate(bas.getDate() + sure - 1);
  const no = (+sp.no || S.sprintGecmis.length) + 1;
  S.sprint = { no, ad: `Sprint ${no}`, bas: tarihKey(bas), bit: tarihKey(bit), hedef: "", kapasite: sp.kapasite || 20 };
  bildirimEkle("success", `${sp.ad} tamamlandı`, `${p.biten}/${p.toplam} puan bitirildi`, "sprint-bitti-" + sp.ad + sp.bit);
  ciz();
}

// ================= İŞ MODU: TOPLANTI TAKVİMİ =================
let tkHaftaOfset = 0;
function toplantiHaftaCiz() {
  const el = $("tkHafta");
  if (!el || !S) return;
  const bugun = tarihOku(todayKey);
  const pzt = new Date(bugun);
  pzt.setDate(bugun.getDate() + (bugun.getDay() === 0 ? -6 : 1 - bugun.getDay()) + tkHaftaOfset * 7);
  const gunler = [...Array(7)].map((_, i) => { const d = new Date(pzt); d.setDate(pzt.getDate() + i); return d; });
  const son = gunler[6];
  if ($("tkHaftaBaslik")) {
    $("tkHaftaBaslik").textContent = `${pzt.getDate()} ${aylar[pzt.getMonth()]} – ${son.getDate()} ${aylar[son.getMonth()]} ${son.getFullYear()}`;
  }
  // Toplantıları güne göre bir kez grupla
  const gunGrup = {};
  S.toplantilar.forEach(t => { (gunGrup[t.tarih] = gunGrup[t.tarih] || []).push(t); });
  el.innerHTML = gunler.map(d => {
    const k = tarihKey(d);
    const liste = (gunGrup[k] || []).filter(t => eslesir(t.baslik)).sort((a, b) => (a.saat || "").localeCompare(b.saat || ""));
    return `<div class="tk-gun ${k === todayKey ? "bugun" : ""} ${k < todayKey ? "gecmis" : ""}">
      <div class="tk-gun-head"><span>${GUNLER_KISA[d.getDay()]}</span><b>${d.getDate()}</b></div>
      <div class="tk-gun-body">
        ${liste.map(t => `<button type="button" class="tk-toplanti" data-act="toplanti-edit" data-id="${t.id}" title="${esc(t.baslik)}">
            <span class="tk-saat">${esc(t.saat || "")}</span>
            <span class="tk-baslik">${esc(t.baslik)}</span>
          </button>`).join("")}
        <button type="button" class="tk-ekle" data-open="dlgToplanti" data-tarih="${k}" aria-label="${gunEtiket(k)} için toplantı ekle">+</button>
      </div>
    </div>`;
  }).join("");
}

// ================= İŞ MODU: ÖNCELİKLİ İŞLER =================
// Farklı kaynaklardan aciliyete göre sıralanmış tek bir "şimdi neye bakmalıyım" listesi
function oncelikCiz() {
  const el = $("oncelikListe");
  if (!el || !S) return;
  const simdiDk = new Date().getHours() * 60 + new Date().getMinutes();
  const items = [];
  S.projeler.forEach(p => {
    if (p.durum === "tamam" || !p.bitis) return;
    const f = gunFarki(p.bitis);
    if (f < 0) items.push({ skor: 0, tip: "kritik", etiket: "Gecikti", baslik: p.ad, alt: `${-f} gün gecikti`, view: "proje" });
    else if (f <= 3) items.push({ skor: 2 + f / 10, tip: "uyari", etiket: "Teslim", baslik: p.ad, alt: f === 0 ? "Bugün teslim" : `${f} gün kaldı`, view: "proje" });
  });
  S.toplantilar.filter(t => t.tarih === todayKey && saatDk(t.saat) + (+t.sure || 30) >= simdiDk).forEach(t => {
    items.push({ skor: 1 + saatDk(t.saat) / 10000, tip: "toplanti", etiket: "Toplantı", baslik: t.baslik, alt: `Bugün ${t.saat}`, view: "toplanti" });
  });
  S.tasks.filter(t => !t.done && t.p === "high").forEach(t => {
    items.push({ skor: t.doing ? 3 : 3.5, tip: "yuksek", etiket: "Yüksek", baslik: t.t, alt: (t.doing ? "Devam ediyor" : "Bekliyor") + (projeAdi(t.proje) ? " · " + projeAdi(t.proje) : ""), view: "tasks" });
  });
  aktifSprintIsleri().filter(s => s.durum === "doing").forEach(s => {
    items.push({ skor: 4, tip: "sprint", etiket: "Sprint", baslik: s.baslik, alt: `${+s.puan || 1} puan · devam ediyor`, view: "sprint" });
  });
  items.sort((a, b) => a.skor - b.skor);
  el.innerHTML = items.length ? items.slice(0, 6).map(it => `
    <li class="oncelik-item ${it.tip}">
      <button type="button" data-view="${it.view}">
        <span class="oncelik-etiket">${it.etiket}</span>
        <span class="oncelik-body"><b>${esc(it.baslik)}</b><small>${esc(it.alt)}</small></span>
        <svg width="14" height="14"><use href="#i-chevron-right"/></svg>
      </button>
    </li>`).join("")
    : `<li class="is-bugun-empty">Acil bir iş yok. Yüksek öncelikli görevler, yaklaşan teslimler ve bugünkü toplantılar burada görünür.</li>`;
}

// ============ İŞ MODU: BUGÜNÜN ÖZETİ ============
function isBugunCiz() {
  const grid = $("isBugunGrid");
  const liste = $("isBugunListe");
  const tarihEl = $("isBugunTarih");
  if (!grid || !liste || !S) return;

  if (tarihEl) {
    const d = new Date();
    tarihEl.textContent = `${GUNLER[d.getDay()]}, ${d.getDate()} ${aylar[d.getMonth()]}`;
  }

  const bugunToplantilar = (S.toplantilar || [])
    .filter(t => t.tarih === todayKey)
    .sort((a, b) => (a.saat || "").localeCompare(b.saat || ""));

  const bugunPlan = (S.planItems || [])
    .filter(p => +p.gun === bugunGunNo)
    .sort((a, b) => saatDk(a.saat) - saatDk(b.saat));

  // Teslimler: eski "deadlines" kayıtları + 3 gün içinde teslimi olan açık projeler
  // (eskiden sadece arayüzden eklenemeyen deadlines sayıldığı için sayaç hep 0'dı)
  const yaklasanTeslim = [
    ...(S.deadlines || []),
    ...(S.projeler || []).filter(p => p.durum !== "tamam" && p.bitis).map(p => ({ t: p.ad, d: p.bitis })),
  ]
    .filter(d => { const fark = gunFarki(d.d); return fark >= 0 && fark <= 3; })
    .sort((a, b) => a.d.localeCompare(b.d));

  const bekleyenGorev = (S.tasks || []).filter(t => !t.done).length;

  grid.innerHTML = `
    <div class="is-bugun-stat">
      <span class="is-bugun-stat-num">${bugunToplantilar.length}</span>
      <span class="is-bugun-stat-lbl">Toplantı</span>
    </div>
    <div class="is-bugun-stat">
      <span class="is-bugun-stat-num bekleyen">${bekleyenGorev}</span>
      <span class="is-bugun-stat-lbl">Görev</span>
    </div>
    <div class="is-bugun-stat">
      <span class="is-bugun-stat-num ${yaklasanTeslim.length ? 'uyari' : ''}">${yaklasanTeslim.length}</span>
      <span class="is-bugun-stat-lbl">Teslim</span>
    </div>
  `;

  const items = [];

  bugunToplantilar.forEach(t => {
    items.push({
      tip: "toplanti",
      saat: t.saat || "--:--",
      baslik: t.baslik,
      tur: "Toplantı",
      _sort: saatDk(t.saat || "00:00"),
    });
  });

  bugunPlan.forEach(p => {
    items.push({
      tip: p.kategori === "toplanti" ? "toplanti" : "gorev",
      saat: p.saat,
      baslik: p.baslik,
      tur: planKategoriEtiket(p.kategori),
      _sort: saatDk(p.saat),
    });
  });

  yaklasanTeslim.forEach(d => {
    const fark = gunFarki(d.d);
    items.push({
      tip: "teslim",
      saat: fark === 0 ? "Bugün" : `${fark}g`,
      baslik: d.t,
      tur: "Teslim",
      _sort: fark === 0 ? -1 : 10000 + fark,
    });
  });

  items.sort((a, b) => a._sort - b._sort);

  if (!items.length) {
    liste.innerHTML = `<li class="is-bugun-empty">Bugün için planlanmış bir şey yok 😌</li>`;
  } else {
    liste.innerHTML = items.slice(0, 6).map(it => `
      <li class="${it.tip}">
        <span class="ib-saat">${esc(it.saat)}</span>
        <span class="ib-baslik">${esc(it.baslik)}</span>
        <span class="ib-tur">${esc(it.tur)}</span>
      </li>
    `).join("");
  }
}

// ================= GÖREVLER =================
function gorevOncelik(p) { return ONCELIK[p] ? p : "mid"; }
// Görevin tamamlanma durumunu değiştirir ve tamamlanma zamanını kaydeder.
// (İstatistikler eskiden görevin OLUŞTURULMA tarihine bakıyordu.)
function gorevTamamla(t, done) {
  const once = !!t.done;
  t.done = !!done;
  t.doing = false;
  if (t.done) t.bitis = new Date().toISOString();
  else delete t.bitis;
  if (t.done && !once) tekrarUret(t);
  if (!t.done && once) tekrarGeriAl(t);
}

// ---- Alt görevler ----
// t.alt = [{ id, t, done }]. Görev listesinde açılıp kapanan bir kontrol listesi olarak gösterilir.
const acikAltlar = new Set(); // hangi görevin alt listesi açık (sadece bu oturum)
const odakMetni = dk => dk >= 60 ? `${Math.floor(dk / 60)} sa${dk % 60 ? " " + (dk % 60) + " dk" : ""}` : `${dk} dk`;
function altGorevDurum(t) {
  const alt = Array.isArray(t.alt) ? t.alt : [];
  return { toplam: alt.length, biten: alt.filter(a => a.done).length };
}
function altGorevHtml(t) {
  const alt = Array.isArray(t.alt) ? t.alt : [];
  const { toplam, biten } = altGorevDurum(t);
  const acik = acikAltlar.has(t.id);
  const yuzde = toplam ? Math.round(biten / toplam * 100) : 0;
  const dugme = `<button type="button" class="alt-ac" data-act="alt-ac" data-id="${t.id}" aria-expanded="${acik}">
      ${toplam ? `<span class="alt-bar"><span style="width:${yuzde}%"></span></span> ${biten}/${toplam} alt görev` : "+ Alt görev ekle"}
    </button>`;
  if (!acik) return `<div class="alt-gorevler">${dugme}</div>`;
  return `<div class="alt-gorevler acik">${dugme}
    <ul class="alt-liste">${alt.map(a => `<li class="${a.done ? "bitti" : ""}">
        <input type="checkbox" ${a.done ? "checked" : ""} data-act="alt-toggle" data-id="${t.id}" data-alt="${a.id}" aria-label="Alt görevi tamamla">
        <span>${esc(a.t)}</span>
        <button type="button" class="alt-sil" data-act="alt-sil" data-id="${t.id}" data-alt="${a.id}" aria-label="Alt görevi sil">×</button>
      </li>`).join("")}</ul>
    <div class="alt-ekle-satir"><input type="text" class="alt-yeni" data-id="${t.id}" maxlength="120" placeholder="Alt görev yaz, Enter'a bas" aria-label="Yeni alt görev"><button type="button" class="alt-ekle" data-act="alt-ekle" data-id="${t.id}" aria-label="Alt görev ekle">+</button></div>
  </div>`;
}
function altGorevEkle(gorevId, metin) {
  const t = bul("tasks", gorevId);
  metin = (metin || "").trim();
  if (!t || !metin) return false;
  if (!Array.isArray(t.alt)) t.alt = [];
  t.alt.push({ id: uid(), t: metin.slice(0, 120), done: false });
  return true;
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest('[data-act="alt-ac"], [data-act="alt-sil"], [data-act="alt-ekle"]');
  if (!b || !S) return;
  e.preventDefault();
  const t = bul("tasks", b.dataset.id);
  if (!t) return;
  if (b.dataset.act === "alt-ac") {
    if (acikAltlar.has(t.id)) acikAltlar.delete(t.id); else acikAltlar.add(t.id);
    gorevlerCiz();
    if (acikAltlar.has(t.id)) { const i = document.querySelector(`.alt-yeni[data-id="${t.id}"]`); if (i && !(t.alt || []).length) i.focus(); }
    return;
  }
  if (b.dataset.act === "alt-sil") t.alt = (t.alt || []).filter(a => a.id !== b.dataset.alt);
  if (b.dataset.act === "alt-ekle") {
    const i = document.querySelector(`.alt-yeni[data-id="${t.id}"]`);
    if (!altGorevEkle(t.id, i && i.value)) return;
  }
  kaydet(); ciz();
  if (b.dataset.act === "alt-ekle") { const i = document.querySelector(`.alt-yeni[data-id="${t.id}"]`); if (i) i.focus(); }
});
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || !e.target.classList || !e.target.classList.contains("alt-yeni") || !S) return;
  e.preventDefault();
  const id = e.target.dataset.id;
  if (!altGorevEkle(id, e.target.value)) return;
  kaydet(); ciz();
  const i = document.querySelector(`.alt-yeni[data-id="${id}"]`); if (i) i.focus();
});
document.addEventListener("change", e => {
  if (!e.target.dataset || e.target.dataset.act !== "alt-toggle" || !S) return;
  const t = bul("tasks", e.target.dataset.id);
  const a = t && (t.alt || []).find(x => x.id === e.target.dataset.alt);
  if (!a) return;
  a.done = e.target.checked;
  kaydet(); ciz();
});

// ---- Kanban sürükle-bırak ----
// Fare ve dokunmatik için Pointer Events. Farede kartın her yerinden sürüklenir (6px hareketten sonra).
// Dokunmatikte sayfa kaydırmasıyla karışmasın diye sadece kartın sol üstündeki ⋮⋮ tutamacından
// sürüklenir (tutamaçta touch-action:none var, kart üzerinde parmakla kaydırma normal çalışır).
let surukle = null;
const KANBAN_KOLON = { kanbanTodo: "todo", kanbanDoing: "doing", kanbanDone: "done" };
function kanbanTasi(t, kolon) {
  if (kolon === "done") { if (!t.done) gorevTamamla(t, true); }
  else {
    if (t.done) gorevTamamla(t, false);
    t.doing = kolon === "doing";
  }
}
document.addEventListener("pointerdown", e => {
  const kart = e.target.closest && e.target.closest("[data-kanban-id]");
  if (!kart || !S || e.button > 0 || e.target.closest("button, input, a")) return;
  const baslangic = { x: e.clientX, y: e.clientY };
  const dokunmatik = e.pointerType !== "mouse";
  if (dokunmatik && !e.target.closest(".ki-tasi")) return;
  surukle = { kart, id: kart.dataset.kanbanId, baslangic, aktif: false, hayalet: null, zamanlayici: null, pointerId: e.pointerId };
  const baslat = () => {
    if (!surukle || surukle.aktif) return;
    surukle.aktif = true;
    const r = kart.getBoundingClientRect();
    const h = kart.cloneNode(true);
    h.classList.add("kanban-hayalet");
    h.style.width = r.width + "px";
    h.style.left = r.left + "px"; h.style.top = r.top + "px";
    surukle.fark = { x: baslangic.x - r.left, y: baslangic.y - r.top };
    document.body.appendChild(h);
    surukle.hayalet = h;
    kart.classList.add("surukleniyor");
    document.body.classList.add("kanban-surukle");
    if (navigator.vibrate && dokunmatik) navigator.vibrate(15);
  };
  if (dokunmatik) baslat();
  else surukle.baslat = baslat;
});
document.addEventListener("pointermove", e => {
  if (!surukle) return;
  const dx = e.clientX - surukle.baslangic.x, dy = e.clientY - surukle.baslangic.y;
  if (!surukle.aktif) {
    // Fare: 6px hareket edince başla (sadece tıklamada sürükleme başlamasın)
    if (Math.hypot(dx, dy) > 6 && surukle.baslat) surukle.baslat(); else return;
  }
  e.preventDefault();
  surukle.hayalet.style.left = (e.clientX - surukle.fark.x) + "px";
  surukle.hayalet.style.top = (e.clientY - surukle.fark.y) + "px";
  document.querySelectorAll(".kanban-col.hedef").forEach(c => c.classList.remove("hedef"));
  surukle.hayalet.style.visibility = "hidden";
  const altta = document.elementFromPoint(e.clientX, e.clientY);
  surukle.hayalet.style.visibility = "";
  const kolon = altta && altta.closest(".kanban-col");
  if (kolon) kolon.classList.add("hedef");
}, { passive: false });
function surukleBitir(e) {
  if (!surukle) return;
  clearTimeout(surukle.zamanlayici);
  const s = surukle; surukle = null;
  if (!s.aktif) return;
  document.querySelectorAll(".kanban-col.hedef").forEach(c => c.classList.remove("hedef"));
  s.hayalet.remove();
  s.kart.classList.remove("surukleniyor");
  document.body.classList.remove("kanban-surukle");
  if (!e || e.type === "pointercancel") return;
  const altta = document.elementFromPoint(e.clientX, e.clientY);
  const liste = altta && altta.closest(".kanban-col") && altta.closest(".kanban-col").querySelector(".kanban-list");
  const hedef = liste && KANBAN_KOLON[liste.id];
  const t = bul("tasks", s.id);
  if (!t || !hedef) return;
  kanbanTasi(t, hedef);
  kaydet(); ciz();
  // Sürüklemeden sonra gelen tıklama kartın düğmelerini tetiklemesin
  const engelle = ev => { ev.stopPropagation(); ev.preventDefault(); };
  document.addEventListener("click", engelle, { capture: true, once: true });
  setTimeout(() => document.removeEventListener("click", engelle, { capture: true }), 50);
}
document.addEventListener("pointerup", surukleBitir);
document.addEventListener("pointercancel", surukleBitir);
// Dokunmatikte basılı tutarken açılan bağlam menüsünü engelle
document.addEventListener("contextmenu", e => { if (e.target.closest && e.target.closest("[data-kanban-id]")) e.preventDefault(); });

// ---- Tekrarlayan görevler ----
// Tekrarlayan bir görev tamamlanınca bir sonraki tarihli kopyası oluşturulur.
// Tamamlama geri alınırsa (henüz bitirilmemişse) o kopya da silinir.
const TEKRAR = { gunluk: "Her gün", haftalik: "Her hafta", aylik: "Her ay" };
// aylik için "gun": ayın asıl günü (31 Ocak → 28 Şubat → 31 Mart; 28'de takılı kalmasın)
function tekrarIleri(k, tekrar, gun) {
  const d = tarihOku(k);
  if (tekrar === "gunluk") d.setDate(d.getDate() + 1);
  else if (tekrar === "haftalik") d.setDate(d.getDate() + 7);
  else if (tekrar === "aylik") {
    gun = gun || d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + 1);
    d.setDate(Math.min(gun, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); // 31 Ocak → 28/29 Şubat
  }
  return tarihKey(d);
}
function tekrarUret(t) {
  if (!TEKRAR[t.tekrar] || (t.sonraki && S.tasks.some(x => x.id === t.sonraki))) return;
  const tekrarGun = t.tekrarGun || tarihOku(t.son || todayKey).getDate();
  let son = tekrarIleri(t.son || todayKey, t.tekrar, tekrarGun);
  while (son < todayKey) son = tekrarIleri(son, t.tekrar, tekrarGun); // uzun süre beklemiş görevde geçmiş tarih üretme
  const yeni = { id: uid(), t: t.t, done: false, doing: false, p: t.p, proje: t.proje || "", son, tekrar: t.tekrar, zaman: new Date().toISOString() };
  if (t.tekrar === "aylik") yeni.tekrarGun = tekrarGun;
  // Alt görevler bir sonraki tekrara işaretsiz olarak taşınır (ör. her hafta aynı kontrol listesi)
  if (Array.isArray(t.alt) && t.alt.length) yeni.alt = t.alt.map(a => ({ id: uid(), t: a.t, done: false }));
  t.sonraki = yeni.id;
  S.tasks.push(yeni);
}
function tekrarGeriAl(t) {
  if (!t.sonraki) return;
  const i = S.tasks.findIndex(x => x.id === t.sonraki && !x.done);
  if (i >= 0) S.tasks.splice(i, 1);
  delete t.sonraki;
}
const gorevBitisGunu = t => {
  const z = t.bitis || t.zaman;
  return z ? tarihKey(new Date(z)) : "";
};

// Görevin son tarihi için rozet: geçmişse kırmızı, bugün/yarınsa sarı
function gorevSonEtiketi(t) {
  if (!t.son) return "";
  const f = gunFarki(t.son);
  if (isNaN(f)) return "";
  let metin = `Son: ${gunEtiket(t.son)}`, sinif = "";
  if (!t.done) {
    if (f < 0) { metin = `Gecikti: ${gunEtiket(t.son)}`; sinif = "gecikti"; }
    else if (f === 0) { metin = "Son gün: bugün"; sinif = "yakin"; }
    else if (f === 1) { metin = "Son gün: yarın"; sinif = "yakin"; }
  }
  return `<span class="task-son ${sinif}"><svg width="10" height="10"><use href="#i-calendar"/></svg> ${metin}</span>`;
}

function gorevlerCiz() {
  if (!S) return;
  const liste = $("tasksListFull"); const bos = $("tasksEmpty");
  if (!liste) return;
  const tum = S.tasks || [];
  const toplam = tum.length;
  const tamamlanan = tum.filter(t => t.done).length;
  const bekleyen = toplam - tamamlanan;
  if ($("statTotal")) $("statTotal").textContent = toplam;
  if ($("statPending")) $("statPending").textContent = bekleyen;
  if ($("statDone")) $("statDone").textContent = tamamlanan;
  const filtre = S.taskFilter || "all";
  // Kayıtlı filtreyi düğmelere de yansıt (yenilemeden sonra "Tümü" seçili görünüyordu)
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("on", b.dataset.filter === filtre));
  let gosterilecek = tum.slice().filter(t => !q || eslesir(t.t));
  if (filtre === "pending") gosterilecek = gosterilecek.filter(t => !t.done);
  else if (filtre === "done") gosterilecek = gosterilecek.filter(t => t.done);
  const priSirala = { high: 0, mid: 1, low: 2 };
  gosterilecek.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    // "?? 1" kullanılmalı: "|| 1" yüksek önceliğin 0 değerini 1'e çevirip sıralamayı bozuyordu
    const pf = (priSirala[gorevOncelik(a.p)] ?? 1) - (priSirala[gorevOncelik(b.p)] ?? 1);
    if (pf) return pf;
    // Aynı öncelikte son tarihi yakın olan önce; tarihi olmayanlar sona
    return (a.son || "9999") < (b.son || "9999") ? -1 : (a.son || "9999") > (b.son || "9999") ? 1 : 0;
  });
  if (!gosterilecek.length) {
    liste.innerHTML = "";
    if (bos) {
      bos.hidden = false;
      bos.textContent = toplam === 0 ? "Henüz görev yok." : "Bu filtreye uyan görev yok.";
    }
  } else {
    if (bos) bos.hidden = true;
    liste.innerHTML = gosterilecek.map(t => {
      const p = gorevOncelik(t.p);
      return `<li class="task-item pri-${p} ${t.done ? "done" : ""}" data-task-id="${t.id}">
        <input type="checkbox" ${t.done ? "checked" : ""} data-act="task-toggle" data-id="${t.id}" aria-label="${esc(t.done ? "Tamamlanmadı olarak işaretle: " : "Tamamla: ")}${esc(t.t)}">
        <div class="task-body">
          <div class="task-text" data-rename data-list="tasks" data-id="${t.id}" data-field="t" title="Çift tıkla: düzenle">${esc(t.t)}</div>
          <div class="task-meta">
            <span class="task-pri-badge pri-${p}"><svg width="10" height="10"><use href="#i-flag"/></svg> ${ONCELIK[p]}</span>
            ${gorevSonEtiketi(t)}
            ${TEKRAR[t.tekrar] ? `<span class="task-son" title="Tamamlayınca bir sonraki otomatik eklenir">🔁 ${TEKRAR[t.tekrar]}</span>` : ""}
            ${t.zaman ? `<span>${new Date(t.zaman).toLocaleDateString("tr-TR")}</span>` : ""}
            ${S.mode === "work" && projeAdi(t.proje) ? `<span class="task-proje"><svg width="10" height="10"><use href="#i-briefcase"/></svg> ${esc(projeAdi(t.proje))}</span>` : ""}
            ${t.odakDk ? `<span class="task-son" title="Bu göreve bağlı Pomodoro süresi">⏱️ ${odakMetni(t.odakDk)}</span>` : ""}
          </div>
          ${altGorevHtml(t)}
        </div>
        <button type="button" class="task-del" data-act="del" data-list="tasks" data-id="${t.id}" aria-label="Sil">
          <svg width="16" height="16"><use href="#i-trash"/></svg>
        </button>
      </li>`;
    }).join("");
  }
}

function kanbanCiz() {
  const todoEl = $("kanbanTodo"); const doingEl = $("kanbanDoing"); const doneEl = $("kanbanDone");
  if (!todoEl || !S) return;
  const tum = S.tasks || [];
  const bulunan = tum.filter(t => eslesir(t.t));
  const todo = bulunan.filter(t => !t.done && !t.doing);
  const doing = bulunan.filter(t => !t.done && t.doing);
  const done = bulunan.filter(t => t.done);
  if ($("kanbanTodoCount")) $("kanbanTodoCount").textContent = todo.length;
  if ($("kanbanDoingCount")) $("kanbanDoingCount").textContent = doing.length;
  if ($("kanbanDoneCount")) $("kanbanDoneCount").textContent = done.length;
  const renderItem = (t, kolon) => {
    const p = gorevOncelik(t.p);
    let aksiyonlar = "";
    if (kolon === "todo") {
      aksiyonlar = `<button type="button" class="ki-btn start" data-act="task-start" data-id="${t.id}">Başla</button>
        <button type="button" class="ki-btn x-btn" data-act="del" data-list="tasks" data-id="${t.id}"><svg width="12" height="12"><use href="#i-x"/></svg></button>`;
    } else if (kolon === "doing") {
      aksiyonlar = `<button type="button" class="ki-btn done-btn" data-act="task-done" data-id="${t.id}">Bitti</button>
        <button type="button" class="ki-btn undo" data-act="task-undo" data-id="${t.id}">Geri</button>`;
    } else {
      aksiyonlar = `<button type="button" class="ki-btn undo" data-act="task-undo" data-id="${t.id}">Geri Al</button>
        <button type="button" class="ki-btn x-btn" data-act="del" data-list="tasks" data-id="${t.id}"><svg width="12" height="12"><use href="#i-x"/></svg></button>`;
    }
    const alt = altGorevDurum(t);
    return `<li class="kanban-item ${t.done ? "done" : ""}" data-kanban-id="${t.id}" title="Sürükleyip başka sütuna bırakabilirsin">
      <span class="ki-tasi" aria-hidden="true">⋮⋮</span>
      <div class="ki-text">${esc(t.t)}</div>
      ${alt.toplam || t.odakDk ? `<div class="ki-ek">${alt.toplam ? `<span>☑ ${alt.biten}/${alt.toplam}</span>` : ""}${t.odakDk ? `<span>⏱️ ${odakMetni(t.odakDk)}</span>` : ""}</div>` : ""}
      <div class="ki-meta">
        <span class="ki-pri pri-${p}">${ONCELIK[p]}</span>
        <span class="ki-actions">${aksiyonlar}</span>
      </div>
    </li>`;
  };
  // Her sütunda en fazla 5 kart; fazlası için Görevler sayfasına giden "+N daha" bağlantısı
  const kolon = (liste, tur, bos) => {
    if (!liste.length) return `<li class="kanban-empty">${bos}</li>`;
    const fazla = liste.length - 5;
    return liste.slice(0, 5).map(t => renderItem(t, tur)).join("") +
      (fazla > 0 ? `<li class="kanban-more"><button type="button" data-view="tasks">+${fazla} daha · Tümünü gör</button></li>` : "");
  };
  todoEl.innerHTML = kolon(todo, "todo", "Görev yok");
  doingEl.innerHTML = kolon(doing, "doing", "Devam eden yok");
  doneEl.innerHTML = kolon(done, "done", "Tamamlanan yok");
}

function hedeflerCiz() {
  const el = $("hedefList");
  if (!el || !S) return;
  const liste = S.hedefler || [];
  if (!liste.length) {
    el.innerHTML = `<li class="hedef-empty">Henüz hedef yok. + butonuyla ekle.</li>`;
    return;
  }
  // "Haftalık" hedefler her Pazartesi sıfırlanır; geçen haftanın sonucu ayrıca gösterilir.
  // Hafta bilgisi olmayan eski hedefler bu haftaya atanır (ilerlemeleri silinmez).
  const buHafta = haftaBasiKey();
  const gecenHafta = (() => { const d = tarihOku(buHafta); d.setDate(d.getDate() - 7); return tarihKey(d); })();
  liste.forEach(h => {
    if (!h.hafta) h.hafta = buHafta;
    else if (h.hafta !== buHafta) {
      // Hedef en son geçen hafta kullanıldıysa o sonucu sakla; daha eskiyse geçen hafta 0'dır
      // (eskiden haftalarca dokunulmamış hedefte 5 hafta önceki sonuç "geçen hafta" görünüyordu)
      h.gecen = h.hafta === gecenHafta ? h.mevcut : 0;
      h.mevcut = 0;
      h.hafta = buHafta;
    }
  });
  el.innerHTML = liste.map(h => {
    const yuzde = Math.min(100, Math.round((h.mevcut / h.hedef) * 100));
    return `<li class="hedef-item" data-id="${h.id}">
      <div class="hedef-head">
        <span class="hedef-baslik">${esc(h.baslik)}</span>
        <span class="hedef-sayi">${h.mevcut}/${h.hedef} ${esc(h.birim || "")}</span>
      </div>
      <div class="hedef-bar"><span style="width:${yuzde}%"></span></div>
      ${h.gecen != null ? `<div class="hedef-gecen">Geçen hafta: ${h.gecen}/${h.hedef}${h.gecen >= h.hedef ? " ✓" : ""}</div>` : ""}
      <div class="hedef-actions">
        <button type="button" class="hedef-btn minus" data-act="hedef-minus" data-id="${h.id}">−1</button>
        <button type="button" class="hedef-btn" data-act="hedef-plus" data-id="${h.id}">+1</button>
        <button type="button" class="hedef-btn del" data-act="del" data-list="hedefler" data-id="${h.id}">
          <svg width="12" height="12"><use href="#i-trash"/></svg>
        </button>
      </div>
    </li>`;
  }).join("");
}

function ozetCiz() {
  const el = $("welcomeSummary");
  if (!el || !S) return;
  const bugunEtkinlik = (S.events[todayKey] || []).length;
  const bekleyenGorev = (S.tasks || []).filter(t => !t.done).length;
  const bugunDers = bugunDersler().length;
  const bugunPlan = (S.planItems || []).filter(p => +p.gun === bugunGunNo).length;
  const parcalar = [];
  if (S.mode === "student") {
    if (bugunDers) parcalar.push(`<div class="ws-item"><b>${bugunDers}</b> ders</div>`);
  } else {
    const bugunToplanti = (S.toplantilar || []).filter(t => t.tarih === todayKey).length;
    if (bugunToplanti) parcalar.push(`<div class="ws-item"><b>${bugunToplanti}</b> toplantı</div>`);
    if (bugunPlan) parcalar.push(`<div class="ws-item"><b>${bugunPlan}</b> iş</div>`);
  }
  if (bugunEtkinlik) parcalar.push(`<div class="ws-item"><b>${bugunEtkinlik}</b> etkinlik</div>`);
  if (bekleyenGorev) parcalar.push(`<div class="ws-item"><b>${bekleyenGorev}</b> görev</div>`);
  el.innerHTML = parcalar.length ? parcalar.join("") : `<div class="ws-item">Bugün için plan yok 😌</div>`;
}

// ================= Çizim =================
// ================= NOT ORTALAMASI HESAPLAYICI =================
// Ders notu = vize × oran + final × (1 − oran). Harf notu yaygın 4'lük tabloya göre;
// ortalama (GANO) = Σ(katsayı × kredi) / Σ kredi. Notu girilmemiş dersler hesaba katılmaz.
const HARF_TABLOSU = [[90, "AA", 4], [85, "BA", 3.5], [80, "BB", 3], [75, "CB", 2.5], [65, "CC", 2], [58, "DC", 1.5], [50, "DD", 1], [40, "FD", 0.5], [0, "FF", 0]];
function nhDersNotu(n) {
  const oran = (S.vizeOrani ?? 40) / 100;
  if (n.final === "" && n.vize === "") return null;
  if (n.final === "") return null; // final yoksa ders notu henüz belli değil
  return (n.vize === "" ? 0 : +n.vize) * oran + (+n.final) * (1 - oran);
}
const nhHarf = not => HARF_TABLOSU.find(([alt]) => not >= alt - 0.0001);
function nhSonucCiz() {
  const el = $("nhSonuc");
  if (!el || !S) return;
  let krediTop = 0, puanTop = 0, sayi = 0;
  (S.notHesap || []).forEach(n => {
    const not = nhDersNotu(n);
    const satir = document.querySelector(`#nhSatirlar tr[data-id="${n.id}"]`);
    if (satir) {
      const h = not == null ? null : nhHarf(Math.round(not));
      satir.querySelector(".nh-not").textContent = not == null ? "–" : not.toFixed(1);
      const harfEl = satir.querySelector(".nh-harf");
      harfEl.textContent = h ? h[1] : "–";
      harfEl.className = "nh-harf" + (h ? (h[2] >= 2 ? " gecti" : h[2] >= 1 ? " sartli" : " kaldi") : "");
    }
    if (not == null || !(n.kredi > 0)) return;
    krediTop += n.kredi; puanTop += nhHarf(Math.round(not))[2] * n.kredi; sayi++;
  });
  el.innerHTML = sayi
    ? `<div><span>Dönem ortalaması</span><b>${(puanTop / krediTop).toFixed(2)}</b><small>/ 4.00</small></div>
       <div><span>Hesaba katılan</span><b>${sayi}</b><small>ders · ${krediTop} kredi</small></div>`
    : `<p class="nh-bos">Ders ekleyip kredi ve final notunu girince ortalaman burada hesaplanır.</p>`;
}
function notHesapCiz() {
  const govde = $("nhSatirlar");
  if (!govde || !S) return;
  const oranEl = document.querySelector('[data-act="nh-oran"]');
  if (oranEl && document.activeElement !== oranEl) oranEl.value = S.vizeOrani ?? 40;
  const sayiAlani = (n, alan, ust) => `<input type="number" inputmode="decimal" min="0" max="${ust}" value="${n[alan] === "" ? "" : n[alan]}" data-act="nh" data-id="${n.id}" data-alan="${alan}" aria-label="${alan}">`;
  govde.innerHTML = (S.notHesap || []).map(n => `<tr data-id="${n.id}">
      <td><input type="text" maxlength="40" value="${esc(n.ad)}" placeholder="Ders adı" data-act="nh" data-id="${n.id}" data-alan="ad" aria-label="Ders adı"></td>
      <td>${sayiAlani(n, "kredi", 30)}</td>
      <td>${sayiAlani(n, "vize", 100)}</td>
      <td>${sayiAlani(n, "final", 100)}</td>
      <td class="nh-not">–</td>
      <td class="nh-harf">–</td>
      <td><button type="button" class="task-del" data-act="nh-sil" data-id="${n.id}" aria-label="Dersi sil"><svg width="14" height="14"><use href="#i-trash"/></svg></button></td>
    </tr>`).join("") || `<tr><td colspan="7" class="nh-bos">Henüz ders yok. "+ Ders ekle" ile başla.</td></tr>`;
  nhSonucCiz();
}
// Yazarken tabloyu yeniden çizme (odak kaybolmasın); sadece veriyi ve sonuçları güncelle
document.addEventListener("input", e => {
  const a = e.target.dataset && e.target.dataset.act;
  if (!S || (a !== "nh" && a !== "nh-oran")) return;
  if (a === "nh-oran") { S.vizeOrani = Math.min(100, Math.max(0, +e.target.value || 0)); }
  else {
    const n = (S.notHesap || []).find(x => x.id === e.target.dataset.id);
    if (!n) return;
    const alan = e.target.dataset.alan;
    if (alan === "ad") n.ad = e.target.value.slice(0, 40);
    else if (e.target.value === "") n[alan] = alan === "kredi" ? 0 : "";
    else n[alan] = Math.min(alan === "kredi" ? 30 : 100, Math.max(0, +e.target.value || 0));
  }
  nhSonucCiz();
  kaydet();
});
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest('[data-act="nh-ekle"], [data-act="nh-sil"]');
  if (!b || !S) return;
  e.preventDefault();
  if (b.dataset.act === "nh-ekle") {
    const yeni = { id: uid(), ad: "", kredi: 3, vize: "", final: "" };
    S.notHesap.push(yeni);
    notHesapCiz();
    const ilk = document.querySelector(`#nhSatirlar tr[data-id="${yeni.id}"] input`);
    if (ilk) ilk.focus();
  } else {
    S.notHesap = S.notHesap.filter(x => x.id !== b.dataset.id);
    notHesapCiz();
  }
  kaydet();
});

// ================= YKS KONU TAKİBİ =================
// Konu durumları S.yksKonu içinde "sinav|ders|konu" anahtarıyla tutulur:
// "" (başlanmadı) → "calisiyor" → "bitti" → "tekrar" → "" ...
// Konu listesi genel YKS müfredatına göre hazırlanmıştır (arayüzde not olarak belirtilir).
const YKS_KONULAR = {
  tyt: {
    "Türkçe": ["Sözcükte Anlam", "Cümlede Anlam", "Paragraf", "Ses Bilgisi", "Yazım Kuralları", "Noktalama İşaretleri", "Sözcük Yapısı", "İsimler", "Sıfatlar", "Zamirler", "Zarflar", "Edat, Bağlaç, Ünlem", "Fiiller ve Ek Fiil", "Fiilimsiler", "Cümlenin Ögeleri", "Cümle Türleri", "Anlatım Bozuklukları"],
    "Matematik": ["Temel Kavramlar", "Sayı Basamakları", "Bölme ve Bölünebilme", "EBOB - EKOK", "Rasyonel Sayılar", "Basit Eşitsizlikler", "Mutlak Değer", "Üslü Sayılar", "Köklü Sayılar", "Çarpanlara Ayırma", "Oran - Orantı", "Denklem Çözme", "Problemler", "Kümeler", "Mantık", "Fonksiyonlar", "Permütasyon - Kombinasyon", "Olasılık", "Veri ve İstatistik", "Polinomlar"],
    "Geometri": ["Doğruda ve Üçgende Açılar", "Özel Üçgenler", "Açıortay - Kenarortay", "Üçgende Alan", "Benzerlik", "Çokgenler", "Dörtgenler", "Çember ve Daire", "Analitik Geometri", "Katı Cisimler"],
    "Fizik": ["Fizik Bilimine Giriş", "Madde ve Özellikleri", "Hareket ve Kuvvet", "İş, Güç ve Enerji", "Isı ve Sıcaklık", "Basınç", "Kaldırma Kuvveti", "Elektrostatik", "Elektrik Akımı", "Manyetizma", "Dalgalar", "Optik"],
    "Kimya": ["Kimya Bilimi", "Atom ve Periyodik Sistem", "Kimyasal Türler Arası Etkileşimler", "Maddenin Halleri", "Doğa ve Kimya", "Kimyanın Temel Kanunları", "Mol Kavramı", "Kimyasal Tepkimeler", "Karışımlar", "Asitler, Bazlar ve Tuzlar", "Kimya Her Yerde"],
    "Biyoloji": ["Canlıların Ortak Özellikleri", "Canlıların Temel Bileşenleri", "Hücre", "Canlıların Sınıflandırılması", "Hücre Bölünmeleri", "Kalıtım", "Ekosistem Ekolojisi"],
    "Tarih": ["Tarih Bilimi", "İlk Çağ Uygarlıkları", "İlk Türk Devletleri", "İslam Tarihi", "Türk - İslam Devletleri", "Osmanlı Kuruluş ve Yükselme", "Osmanlı Duraklama ve Gerileme", "Osmanlı Dağılma Dönemi", "I. Dünya Savaşı", "Kurtuluş Savaşı", "Atatürk İlke ve İnkılapları"],
    "Coğrafya": ["Doğa ve İnsan", "Dünya'nın Şekli ve Hareketleri", "Harita Bilgisi", "İklim Bilgisi", "Yer Şekilleri", "Nüfus ve Yerleşme", "Ekonomik Faaliyetler", "Bölgeler", "Doğal Afetler"],
    "Felsefe": ["Felsefeye Giriş", "Bilgi Felsefesi", "Varlık Felsefesi", "Ahlak Felsefesi", "Sanat Felsefesi", "Din Felsefesi", "Siyaset Felsefesi", "Bilim Felsefesi"],
    "Din Kültürü": ["Bilgi ve İnanç", "İbadet", "Ahlak ve Değerler", "Hz. Muhammed", "Vahiy ve Akıl", "İslam Düşüncesinde Yorumlar"],
  },
  ayt: {
    "Matematik": ["Fonksiyonlar", "Polinomlar", "İkinci Dereceden Denklemler", "Eşitsizlikler", "Parabol", "Trigonometri", "Logaritma", "Diziler", "Limit ve Süreklilik", "Türev", "İntegral", "Permütasyon, Kombinasyon, Olasılık", "Karmaşık Sayılar"],
    "Geometri": ["Üçgenler", "Dörtgenler", "Çember ve Daire", "Analitik Geometri", "Dönüşümler", "Katı Cisimler", "Çemberin Analitiği"],
    "Fizik": ["Vektörler", "Kuvvet ve Tork", "Denge", "Newton'un Hareket Yasaları", "Atışlar", "İş, Enerji ve Momentum", "Çembersel Hareket", "Basit Harmonik Hareket", "Elektrik ve Manyetizma", "Dalga Mekaniği", "Modern Fizik"],
    "Kimya": ["Modern Atom Teorisi", "Gazlar", "Sıvı Çözeltiler", "Kimyasal Tepkimelerde Enerji", "Tepkime Hızı", "Kimyasal Denge", "Asit - Baz Dengesi", "Çözünürlük Dengesi", "Elektrokimya", "Organik Kimya"],
    "Biyoloji": ["Sinir Sistemi", "Endokrin Sistem", "Duyu Organları", "Destek ve Hareket Sistemi", "Sindirim Sistemi", "Dolaşım Sistemi", "Solunum Sistemi", "Boşaltım Sistemi", "Üreme Sistemi", "Genden Proteine", "Fotosentez ve Kemosentez", "Hücresel Solunum", "Bitki Biyolojisi", "Ekoloji"],
    "Edebiyat": ["Şiir Bilgisi", "Edebi Sanatlar", "İslamiyet Öncesi Türk Edebiyatı", "Divan Edebiyatı", "Halk Edebiyatı", "Tanzimat Edebiyatı", "Servet-i Fünun", "Milli Edebiyat", "Cumhuriyet Dönemi", "Edebi Akımlar"],
    "Tarih": ["Osmanlı Kültür ve Medeniyeti", "XX. Yüzyıl Başlarında Osmanlı", "Milli Mücadele", "Atatürk Dönemi", "II. Dünya Savaşı", "Soğuk Savaş", "Yumuşama Dönemi", "Küreselleşen Dünya"],
    "Coğrafya": ["Ekosistem", "Nüfus Politikaları", "Türkiye Ekonomisi", "Küresel Ortam", "Çevre ve Toplum"],
    "Felsefe Grubu": ["Mantık", "Psikoloji", "Sosyoloji"],
  },
};
// AYT'de alana göre görünen dersler
const YK_ALAN_DERSLER = {
  say: ["Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji"],
  ea: ["Matematik", "Geometri", "Edebiyat", "Tarih", "Coğrafya"],
  soz: ["Edebiyat", "Tarih", "Coğrafya", "Felsefe Grubu"],
};
const YK_SIRA = ["", "calisiyor", "bitti", "tekrar"];
const YK_ETIKET = { "": "Başlanmadı", calisiyor: "Çalışılıyor", bitti: "Bitti", tekrar: "Tekrar gerekli" };
let ykSinav = "tyt";
const ykAcikDersler = new Set();
const ykAnahtar = (sinav, ders, konu) => `${sinav}|${ders}|${konu}`;
function ykDersler(sinav) {
  const hepsi = Object.keys(YKS_KONULAR[sinav]);
  return sinav === "ayt" ? hepsi.filter(d => (YK_ALAN_DERSLER[S.yksAlan] || YK_ALAN_DERSLER.say).includes(d)) : hepsi;
}
function ykIlerleme(sinav, ders) {
  const konular = YKS_KONULAR[sinav][ders];
  const d = konular.map(k => (S.yksKonu || {})[ykAnahtar(sinav, ders, k)] || "");
  return { toplam: konular.length, bitti: d.filter(x => x === "bitti").length, tekrar: d.filter(x => x === "tekrar").length, calisiyor: d.filter(x => x === "calisiyor").length };
}
function yksKonuCiz() {
  const el = $("ykDersler");
  if (!el || !S) return;
  document.querySelectorAll("[data-yk-sinav]").forEach(b => { b.classList.toggle("on", b.dataset.ykSinav === ykSinav); b.setAttribute("aria-selected", String(b.dataset.ykSinav === ykSinav)); });
  if ($("ykAlan")) $("ykAlan").value = S.yksAlan || "say";
  if ($("ykAlanKutu")) $("ykAlanKutu").hidden = ykSinav !== "ayt";
  const dersler = ykDersler(ykSinav);
  // Genel ilerleme (bitti = tam, çalışılıyor = yarım sayılır)
  let toplam = 0, puan = 0, tekrarListe = [];
  dersler.forEach(d => {
    const i = ykIlerleme(ykSinav, d); toplam += i.toplam; puan += i.bitti + i.calisiyor * 0.5;
    YKS_KONULAR[ykSinav][d].forEach(k => { if ((S.yksKonu || {})[ykAnahtar(ykSinav, d, k)] === "tekrar") tekrarListe.push({ d, k }); });
  });
  const genelYuzde = toplam ? Math.round(puan / toplam * 100) : 0;
  if ($("ykGenel")) $("ykGenel").innerHTML = `<div class="yk-genel-bar"><span style="width:${genelYuzde}%"></span></div><b>%${genelYuzde}</b><small>${ykSinav.toUpperCase()} genel ilerleme</small>`;
  const tk = $("ykTekrar");
  if (tk) {
    tk.hidden = !tekrarListe.length;
    tk.innerHTML = tekrarListe.length ? `<b>🔁 Tekrar gereken ${tekrarListe.length} konu:</b> ${tekrarListe.slice(0, 8).map(x => `<span>${esc(x.k)} <small>${esc(x.d)}</small></span>`).join("")}${tekrarListe.length > 8 ? `<span>+${tekrarListe.length - 8} daha</span>` : ""}` : "";
  }
  el.innerHTML = dersler.map(d => {
    const i = ykIlerleme(ykSinav, d);
    const yuzde = Math.round(i.bitti / i.toplam * 100);
    const acik = ykAcikDersler.has(ykSinav + "|" + d);
    return `<div class="yk-ders ${acik ? "acik" : ""}">
      <button type="button" class="yk-ders-bas" data-yk-ders="${esc(d)}" aria-expanded="${acik}">
        <span class="yk-ders-ad">${esc(d)}</span>
        <span class="yk-ders-bar"><span style="width:${yuzde}%"></span></span>
        <span class="yk-ders-sayi">${i.bitti}/${i.toplam}${i.tekrar ? ` <em>· ${i.tekrar} tekrar</em>` : ""}</span>
        <span class="yk-ok" aria-hidden="true">›</span>
      </button>
      ${acik ? `<div class="yk-konular">${YKS_KONULAR[ykSinav][d].map(k => {
        const durum = (S.yksKonu || {})[ykAnahtar(ykSinav, d, k)] || "";
        return `<button type="button" class="yk-konu yk-${durum || "bos"}" data-yk-konu="${esc(k)}" data-yk-d="${esc(d)}" title="${YK_ETIKET[durum]}: dokununca değişir" aria-label="${esc(k)}: ${YK_ETIKET[durum]}">${esc(k)}</button>`;
      }).join("")}</div>` : ""}
    </div>`;
  }).join("");
}
document.addEventListener("click", e => {
  if (!S || !e.target.closest) return;
  const sekme = e.target.closest("[data-yk-sinav]");
  if (sekme) { ykSinav = sekme.dataset.ykSinav; yksKonuCiz(); return; }
  const ders = e.target.closest("[data-yk-ders]");
  if (ders) {
    const k = ykSinav + "|" + ders.dataset.ykDers;
    if (ykAcikDersler.has(k)) ykAcikDersler.delete(k); else ykAcikDersler.add(k);
    yksKonuCiz(); return;
  }
  const konu = e.target.closest("[data-yk-konu]");
  if (konu) {
    if (!S.yksKonu || typeof S.yksKonu !== "object") S.yksKonu = {};
    const anahtar = ykAnahtar(ykSinav, konu.dataset.ykD, konu.dataset.ykKonu);
    const simdiki = S.yksKonu[anahtar] || "";
    const sonraki = YK_SIRA[(YK_SIRA.indexOf(simdiki) + 1) % YK_SIRA.length];
    if (sonraki) S.yksKonu[anahtar] = sonraki; else delete S.yksKonu[anahtar];
    kaydet(); yksKonuCiz();
  }
});
document.addEventListener("change", e => {
  if (e.target.id !== "ykAlan" || !S) return;
  S.yksAlan = YK_ALAN_DERSLER[e.target.value] ? e.target.value : "say";
  kaydet(); yksKonuCiz();
});

// ================= SERİ (STREAK) =================
// "Aktif gün": en az bir görev tamamlanan ya da en az bir Pomodoro yapılan gün.
// Seri bugünden geriye kesintisiz aktif gün sayısıdır; bugün henüz bir şey yapılmadıysa
// dünden itibaren sayılır (gün bitmeden seri "kırılmış" görünmesin).
function aktifGunler() {
  const gunler = new Set();
  (S.tasks || []).forEach(t => { if (t.done && t.bitis) gunler.add(tarihKey(new Date(t.bitis))); });
  Object.entries((S.pomo && S.pomo.stats) || {}).forEach(([k, v]) => { if (v && +v.sayi > 0) gunler.add(k); });
  return gunler;
}
function seriHesapla() {
  const gunler = aktifGunler();
  const onceki = k => { const d = tarihOku(k); d.setDate(d.getDate() - 1); return tarihKey(d); };
  let k = gunler.has(todayKey) ? todayKey : onceki(todayKey);
  let seri = 0;
  while (gunler.has(k)) { seri++; k = onceki(k); }
  // En uzun seri
  let enUzun = 0, sayac = 0, son = null;
  [...gunler].sort().forEach(g => { sayac = son && onceki(g) === son ? sayac + 1 : 1; enUzun = Math.max(enUzun, sayac); son = g; });
  return { seri, enUzun, bugunAktif: gunler.has(todayKey) };
}

// ================= BUGÜN EKRANI =================
// Bugünün dersleri, toplantıları, etkinlikleri, sınav/ödevleri ve son günü gelmiş görevleri
// tek bir zaman akışında gösterir.
function bugunAkisi() {
  const ogeler = [];
  const ekle = o => ogeler.push(o);
  if (S.mode === "student") {
    bugunDersler().forEach(d => ekle({ saat: d.bas, bitis: d.bit, ikon: "🎓", baslik: d.ad, alt: [d.sinif, d.hoca].filter(Boolean).join(" · "), tur: "ders" }));
    (S.sinavlar || []).filter(s => s.tarih === todayKey).forEach(s => ekle({ saat: s.saat || "", ikon: "📝", baslik: s.ad, alt: s.tur + (s.yer ? " · " + s.yer : ""), tur: "sinav", vurgu: true }));
    (S.odevler || []).filter(o => !o.done && o.tarih === todayKey).forEach(o => ekle({ saat: "", ikon: "📚", baslik: o.ad, alt: (o.ders ? o.ders + " · " : "") + "bugün teslim", tur: "odev", vurgu: true }));
  } else {
    (S.toplantilar || []).filter(t => t.tarih === todayKey).forEach(t => ekle({ saat: t.saat || "", ikon: "👥", baslik: t.baslik, alt: t.sure ? t.sure + " dk" : "", tur: "toplanti" }));
    (S.planItems || []).filter(p => +p.gun === bugunGunNo).forEach(p => ekle({ saat: p.saat || "", ikon: "🗂️", baslik: p.baslik, alt: planKategoriEtiket(p.kategori), tur: "plan" }));
  }
  (S.events[todayKey] || []).forEach(e => ekle({ saat: e.time && e.time !== "00:00" ? e.time : "", ikon: "📅", baslik: e.t, alt: e.type, tur: "etkinlik" }));
  (S.tasks || []).filter(t => !t.done && t.son && t.son <= todayKey).forEach(t => ekle({
    saat: "", ikon: "", baslik: t.t, alt: t.son < todayKey ? `Gecikti · ${gunEtiket(t.son)}` : "Son gün bugün",
    tur: "gorev", gorev: t, gecikti: t.son < todayKey,
  }));
  // Saatliler saat sırasıyla önce (dakikaya çevrilerek: "9:00" metin olarak "10:00"dan sonra gelirdi),
  // saatsizler sonra; görevlerde en eski son tarih (en çok gecikmiş) önce
  return ogeler.sort((a, b) => (a.saat ? 0 : 1) - (b.saat ? 0 : 1)
    || (a.saat && b.saat ? saatDk(a.saat) - saatDk(b.saat) : 0)
    || ((a.gorev && a.gorev.son) || "").localeCompare((b.gorev && b.gorev.son) || ""));
}
function bugunCiz() {
  const akisEl = $("bugunAkis");
  if (!akisEl || !S) return;
  const { seri, enUzun, bugunAktif } = seriHesapla();
  const chip = $("seriChip");
  if (chip) {
    chip.hidden = seri === 0;
    chip.textContent = `🔥 ${seri} gün seri`;
    chip.title = `En uzun serin: ${enUzun} gün` + (bugunAktif ? "" : " · Seriyi sürdürmek için bugün bir görev tamamla ya da bir Pomodoro yap");
    chip.classList.toggle("bekliyor", !bugunAktif);
  }
  const akis = bugunAkisi();
  const tamamBugun = (S.tasks || []).filter(t => t.done && t.bitis && tarihKey(new Date(t.bitis)) === todayKey).length;
  const odakDk = (S.pomo && S.pomo.stats && S.pomo.stats[todayKey] && +S.pomo.stats[todayKey].dk) || 0;
  const bekleyen = (S.tasks || []).filter(t => !t.done).length;
  const stat = (sayi, etiket, ikon, view) => `<button type="button" class="bugun-stat" ${view ? `data-view="${view}"` : ""}><span class="bs-ikon">${ikon}</span><b>${sayi}</b><span>${etiket}</span></button>`;
  if ($("bugunStatlar")) $("bugunStatlar").innerHTML =
    stat(akis.length, "bugünün akışı", "🗓️", "") +
    stat(tamamBugun, "bugün tamamlanan", "✅", "tasks") +
    stat(odakDk ? odakDk + " dk" : "0 dk", "bugün odak", "⏱️", "") +
    stat(bekleyen, "bekleyen görev", "📋", "tasks");
  if ($("bugunAkisSayi")) $("bugunAkisSayi").textContent = akis.length ? `${akis.length} öğe` : "Boş";
  if (!akis.length) {
    akisEl.innerHTML = `<li class="bugun-bos"><span>🎉</span><div><b>Bugün için planlanmış bir şey yok.</b><small>Sağ alttaki + ile görev, etkinlik ya da ${S.mode === "work" ? "toplantı" : "sınav"} ekleyebilirsin.</small></div></li>`;
    return;
  }
  const simdi = new Date(); const simdiDk = simdi.getHours() * 60 + simdi.getMinutes();
  akisEl.innerHTML = akis.map(o => {
    const gecti = o.saat && (o.bitis ? saatDk(o.bitis) : saatDk(o.saat) + 60) < simdiDk;
    const suAn = o.saat && o.bitis && saatDk(o.saat) <= simdiDk && simdiDk < saatDk(o.bitis);
    const sol = o.tur === "gorev"
      ? `<input type="checkbox" data-act="task-toggle" data-id="${o.gorev.id}" aria-label="Tamamla: ${esc(o.baslik)}">`
      : `<span class="ba-ikon">${o.ikon}</span>`;
    return `<li class="bugun-oge tur-${o.tur} ${o.vurgu ? "vurgu" : ""} ${o.gecikti ? "gecikti" : ""} ${gecti ? "gecti" : ""} ${suAn ? "su-an" : ""}">
      <span class="ba-saat">${o.saat ? esc(o.saat) + (o.bitis ? `<small>${esc(o.bitis)}</small>` : "") : "—"}</span>
      ${sol}
      <div class="ba-metin"><b>${esc(o.baslik)}</b>${o.alt ? `<small>${esc(o.alt)}</small>` : ""}</div>
      ${suAn ? `<span class="ba-etiket">Şu an</span>` : ""}
    </li>`;
  }).join("");
}

// ================= AYLIK RAPOR =================
let raporAy = null; // { y, m }
function aylikRaporCiz() {
  const el = $("raporIcerik");
  if (!el || !S) return;
  const { y, m } = raporAy;
  const gunSayisi = new Date(y, m + 1, 0).getDate();
  const gunler = [...Array(gunSayisi)].map((_, i) => key(y, m, i + 1));
  const ayAnahtari = (yy, mm) => `${yy}-${String(mm + 1).padStart(2, "0")}`;
  const buAy = ayAnahtari(y, m);
  const oncekiTarih = new Date(y, m - 1, 1), oncekiAy = ayAnahtari(oncekiTarih.getFullYear(), oncekiTarih.getMonth());
  const tamamlanan = ay => (S.tasks || []).filter(t => t.done && t.bitis && tarihKey(new Date(t.bitis)).startsWith(ay));
  const odak = ay => Object.entries((S.pomo && S.pomo.stats) || {}).filter(([k]) => k.startsWith(ay)).reduce((a, [, v]) => a + ((v && +v.dk) || 0), 0);
  const bu = tamamlanan(buAy), once = tamamlanan(oncekiAy);
  const odakBu = odak(buAy), odakOnce = odak(oncekiAy);
  const gunGorev = gunler.map(k => bu.filter(t => tarihKey(new Date(t.bitis)) === k).length);
  const gunOdak = gunler.map(k => (S.pomo.stats[k] && +S.pomo.stats[k].dk) || 0);
  const aktif = aktifGunler();
  const aktifSayi = gunler.filter(k => aktif.has(k)).length;
  const puan = gunler.map((_, i) => gunGorev[i] * 25 + gunOdak[i]);
  const enIyi = puan.some(p => p > 0) ? puan.indexOf(Math.max(...puan)) : -1;
  // Haftanın günlerine göre dağılım (Pzt..Paz)
  const haftaGunu = [0, 0, 0, 0, 0, 0, 0];
  gunler.forEach((k, i) => { haftaGunu[(tarihOku(k).getDay() + 6) % 7] += puan[i]; });
  const enCokHaftaGunu = haftaGunu.some(v => v > 0) ? ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"][haftaGunu.indexOf(Math.max(...haftaGunu))] : "—";
  const sinavSayi = (S.sinavlar || []).filter(s => s.tarih.startsWith(buAy)).length;
  const fark = (a, b) => b === 0 ? (a ? "yeni" : "") : `${a >= b ? "▲" : "▼"} %${Math.round(Math.abs(a - b) / b * 100)}`;
  const saat = dk => dk >= 60 ? `${Math.floor(dk / 60)} sa ${dk % 60 ? (dk % 60) + " dk" : ""}`.trim() : `${dk} dk`;
  if ($("raporBaslik")) $("raporBaslik").textContent = `${aylar[m]} ${y} Raporu`;
  const enCok = Math.max(...puan, 1);
  el.innerHTML = `
    <div class="rapor-kartlar">
      <div><span>Tamamlanan görev</span><b>${bu.length}</b><small class="${bu.length >= once.length ? "artis" : "azalis"}">${fark(bu.length, once.length)}</small></div>
      <div><span>Odak süresi</span><b>${saat(odakBu)}</b><small class="${odakBu >= odakOnce ? "artis" : "azalis"}">${fark(odakBu, odakOnce)}</small></div>
      <div><span>Aktif gün</span><b>${aktifSayi}<em>/${gunSayisi}</em></b></div>
      <div><span>${S.mode === "work" ? "Toplantı" : "Sınav"}</span><b>${S.mode === "work" ? (S.toplantilar || []).filter(t => t.tarih.startsWith(buAy)).length : sinavSayi}</b></div>
    </div>
    <div class="rapor-grafik" aria-label="Günlere göre etkinlik">
      ${gunler.map((k, i) => `<span title="${i + 1} ${aylar[m]}: ${gunGorev[i]} görev, ${gunOdak[i]} dk odak" style="height:${puan[i] ? Math.max(6, Math.round(puan[i] / enCok * 100)) : 2}%" class="${k === todayKey ? "bugun" : ""}"></span>`).join("")}
    </div>
    <ul class="rapor-notlar">
      <li>📈 En verimli gün: <b>${enIyi >= 0 ? `${enIyi + 1} ${aylar[m]}` : "—"}</b>${enIyi >= 0 ? ` (${gunGorev[enIyi]} görev, ${gunOdak[enIyi]} dk odak)` : ""}</li>
      <li>📆 En çok çalıştığın gün: <b>${enCokHaftaGunu}</b></li>
      <li>🔥 En uzun serin: <b>${seriHesapla().enUzun} gün</b></li>
      ${bu.length || odakBu ? "" : "<li>Bu ay için henüz kayıt yok. Görev tamamladıkça ve Pomodoro yaptıkça rapor dolacak.</li>"}
    </ul>`;
  document.querySelector('[data-rapor-ay="1"]').disabled = y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth());
}
document.addEventListener("click", e => {
  if (!S || !e.target.closest) return;
  if (e.target.closest("#aylikRaporBtn")) {
    raporAy = { y: now.getFullYear(), m: now.getMonth() };
    aylikRaporCiz();
    guvenliAc($("dlgRapor"));
    return;
  }
  const ay = e.target.closest("[data-rapor-ay]");
  if (ay && raporAy) {
    const d = new Date(raporAy.y, raporAy.m + +ay.dataset.raporAy, 1);
    raporAy = { y: d.getFullYear(), m: d.getMonth() };
    aylikRaporCiz();
  }
});

// ================= HIZLI EKLE (+) =================
function hizliMenuAc(acik) {
  const menu = $("hizliMenu"), btn = $("hizliBtn");
  if (!menu || !btn) return;
  menu.hidden = !acik;
  btn.setAttribute("aria-expanded", String(acik));
  btn.classList.toggle("acik", acik);
}
document.addEventListener("click", e => {
  if (!e.target.closest) return;
  if (e.target.closest("#hizliBtn")) { hizliMenuAc($("hizliMenu").hidden); return; }
  // Menüden bir şey seçilince ya da dışarı tıklanınca kapat (seçim, data-open ile pencereyi açar)
  if (!e.target.closest("#hizliMenu") || e.target.closest("[data-open]")) hizliMenuAc(false);
});
document.addEventListener("keydown", e => { if (e.key === "Escape") hizliMenuAc(false); });

// ================= HAFTALIK ÖZET =================
// Bu hafta (Pzt–Paz) tamamlanan görevler ve Pomodoro odak dakikaları, gün gün.
function haftalikOzetCiz() {
  const el = $("ozetSayilar");
  if (!el || !S) return;
  const gunler = haftaGunleriKey();
  const gorevSay = gunler.map(k => (S.tasks || []).filter(t => t.done && gorevBitisGunu(t) === k).length);
  const odakDk = gunler.map(k => (S.pomo && S.pomo.stats && S.pomo.stats[k] && +S.pomo.stats[k].dk) || 0);
  const toplamGorev = gorevSay.reduce((a, b) => a + b, 0);
  const toplamDk = odakDk.reduce((a, b) => a + b, 0);
  const gecikmis = (S.tasks || []).filter(t => !t.done && t.son && gunFarki(t.son) < 0).length;
  const ilk = tarihOku(gunler[0]), son = tarihOku(gunler[6]);
  if ($("ozetAralik")) $("ozetAralik").textContent = `${ilk.getDate()} ${aylar[ilk.getMonth()].slice(0, 3)} – ${son.getDate()} ${aylar[son.getMonth()].slice(0, 3)}`;
  const saatMetni = dk => dk >= 60 ? `${Math.floor(dk / 60)} sa ${dk % 60 ? (dk % 60) + " dk" : ""}`.trim() : `${dk} dk`;
  el.innerHTML = `
    <div class="ozet-sayi"><b>${toplamGorev}</b><span>tamamlanan görev</span></div>
    <div class="ozet-sayi"><b>${saatMetni(toplamDk)}</b><span>odak süresi</span></div>
    <div class="ozet-sayi ${gecikmis ? "uyari" : ""}"><b>${gecikmis}</b><span>gecikmiş görev</span></div>`;
  // Günlük çubuk grafik: yükseklik o günün "puanı" (1 görev = 25 dk odak sayılır)
  const puan = gunler.map((_, i) => gorevSay[i] * 25 + odakDk[i]);
  const enCok = Math.max(...puan, 1);
  if ($("ozetGrafik")) $("ozetGrafik").innerHTML = gunler.map((k, i) => {
    const gelecek = k > todayKey;
    const yuzde = Math.round(puan[i] / enCok * 100);
    return `<div class="ozet-gun ${k === todayKey ? "bugun" : ""} ${gelecek ? "gelecek" : ""}" title="${GUNLER_KISA[tarihOku(k).getDay()]}: ${gorevSay[i]} görev, ${odakDk[i]} dk odak">
      <div class="ozet-cubuk"><span style="height:${puan[i] ? Math.max(6, yuzde) : 0}%"></span></div>
      <small>${GUNLER_KISA[tarihOku(k).getDay()]}</small>
    </div>`;
  }).join("");
  let not = "";
  if (puan.some(p => p > 0)) {
    const enIyi = puan.indexOf(Math.max(...puan));
    not = `En verimli günün: <b>${GUNLER_KISA[tarihOku(gunler[enIyi]).getDay()]}</b> (${gorevSay[enIyi]} görev, ${odakDk[enIyi]} dk odak).`;
  } else {
    not = "Bu hafta henüz tamamlanan görev ya da Pomodoro yok. Küçük bir görevle başla!";
  }
  if ($("ozetNot")) $("ozetNot").innerHTML = not;
}

// ================= SINAV GERİ SAYIMI =================
function geriSayimCiz() {
  const kart = $("geriSayimKart"), el = $("geriSayim");
  if (!kart || !el || !S) return;
  const sinav = (S.sinavlar || []).filter(s => gunFarki(s.tarih) >= 0)
    .sort((a, b) => (a.tarih + (a.saat || "")).localeCompare(b.tarih + (b.saat || "")))[0];
  kart.hidden = !sinav;
  if (!sinav) return;
  const fark = gunFarki(sinav.tarih);
  const sayi = fark === 0 ? "Bugün" : fark === 1 ? "Yarın" : fark;
  el.innerHTML = `
    <div class="gs-sayi ${fark <= 3 ? "yakin" : ""}">${sayi}${fark > 1 ? "<small>gün kaldı</small>" : ""}</div>
    <div class="gs-bilgi">
      <b>${esc(sinav.ad)}</b>
      <span>${esc(sinav.tur || "Sınav")} · ${gunEtiket(sinav.tarih)}${sinav.saat ? " · " + esc(sinav.saat) : ""}${sinav.yer ? " · " + esc(sinav.yer) : ""}</span>
    </div>`;
}

function ciz() {
  if (!S) return;
  // Bildirimleri her çizimde güncelle (yinelenenleri bildirimEkle zaten eliyor);
  // eskiden sadece girişte ve zil açılınca üretildiği için rozet geç güncelleniyordu
  otomatikBildirimler();

  const k = karsilamaMetni();
  const ilkAd = S.name.split(" ")[0];
  if ($("hello")) $("hello").textContent = `${k.metin}, ${ilkAd}! ${k.emoji}`;
  if ($("uname")) $("uname").textContent = S.name;
  const bugun = new Date();
  if ($("welcomeDate")) $("welcomeDate").textContent = `${gunlerKisa[bugun.getDay()]}, ${bugun.getDate()} ${aylar[bugun.getMonth()]} ${bugun.getFullYear()}`;

  avatarUygula();
  ozetCiz();
  rozetCiz();
  haftalikOzetCiz();
  geriSayimCiz();
  bugunCiz();
  yksKonuCiz();

  if ($("calTitle")) $("calTitle").textContent = `${aylar[view.m]} ${view.y}`;
  const cal = $("calendar");
  if (cal) {
    // Tek seferde yaz: her gün için ayrı insertAdjacentHTML çağrısı ~40 kez DOM'u yeniden düzenliyordu
    let h = ["P","S","Ç","P","C","C","P"].map(g => `<span class="dow">${g}</span>`).join("");
    const bosluk = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
    const gunler = new Date(view.y, view.m + 1, 0).getDate();
    const onceki = new Date(view.y, view.m, 0).getDate();
    for (let i = bosluk - 1; i >= 0; i--) h += `<span class="dim">${onceki - i}</span>`;
    for (let g = 1; g <= gunler; g++) {
      const kk = key(view.y, view.m, g);
      const cls = ["d", kk === todayKey && "today", kk === sel && "sel", (S.events[kk] || []).length && "has"].filter(Boolean).join(" ");
      h += `<button type="button" class="${cls}" data-act="mini" data-date="${kk}">${g}</button>`;
    }
    cal.innerHTML = h;
  }

  if ($("bigTitle")) $("bigTitle").textContent = `${aylar[view.m]} ${view.y}`;
  const bigGrid = $("bigGrid");
  if (bigGrid) {
    const bosluk = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
    const gunler = new Date(view.y, view.m + 1, 0).getDate();
    const onceki = new Date(view.y, view.m, 0).getDate();
    let h = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(g => `<div class="dow">${g}</div>`).join("");
    for (let i = bosluk - 1; i >= 0; i--) h += `<div class="cell dim"><span class="n">${onceki - i}</span></div>`;
    for (let g = 1; g <= gunler; g++) {
      const kk = key(view.y, view.m, g);
      const ev = gunEvents(kk);
      h += `<button type="button" class="cell ${kk === todayKey ? "today" : ""} ${kk === sel ? "sel" : ""} ${ev.length ? "has" : ""}" data-act="big" data-date="${kk}"><span class="n">${g}</span>` +
        ev.slice(0, 3).map(e => `<span class="ce ${sinif[e.type] || "event"}">${esc(e.time)} ${esc(e.t)}</span>`).join("") +
        (ev.length > 3 ? `<small>+${ev.length - 3} daha</small>` : "") + `</button>`;
    }
    for (let i = (bosluk + gunler) % 7; i && i < 7; i++) h += `<div class="cell dim"></div>`;
    bigGrid.innerHTML = h;
  }

  if ($("dayTitle")) $("dayTitle").textContent = gunEtiket(sel);
  gunListesi($("dayList"), sel);
  gunListesi($("timeline"), todayKey);

  if ($("bars")) {
    $("bars").innerHTML = S.courses.length
      ? S.courses.map((c, i) => `<span title="${esc(c.n)}: ${c.g}" style="background:${renkler[i % renkler.length]};height:${Math.max(c.g, 3)}%"></span>`).join("")
      : `<div class="bars-empty">Ekleyince grafik burada görünür.</div>`;
  }
  const ort = S.courses.length ? S.courses.reduce((t, c) => t + c.g, 0) / S.courses.length : 0;
  if ($("gpa")) {
    $("gpa").textContent = !S.courses.length ? "Henüz kayıt yok"
      : S.mode === "work" ? `Ortalama ilerleme: %${ort.toFixed(0)}`
      : `Ortalama: ${ort.toFixed(0)} / 100  (GP: ${(ort / 25).toFixed(2)})`;
  }
  notHesapCiz();
  if ($("courses")) {
    $("courses").innerHTML = S.courses.map(c =>
      `<li>${ad("courses", c.id, "n", c.n)}<input type="number" min="0" max="100" value="${c.g}" data-act="grade" data-id="${c.id}">${delBtn("courses", c.id)}</li>`
    ).join("") || `<li class="empty">Henüz kayıt yok.</li>`;
  }
  if ($("deadlines")) {
    $("deadlines").innerHTML = [...S.deadlines].sort((a, b) => a.d.localeCompare(b.d)).map(d =>
      `<li>${ad("deadlines", d.id, "t", d.t)}<span>${gunEtiket(d.d)}</span>${delBtn("deadlines", d.id)}</li>`
    ).join("") || `<li class="empty">Teslim yok.</li>`;
  }

  const durumlar = ["Beklemede", "Mülakat", "Kabul", "Red"];
  if ($("jobs")) {
    $("jobs").innerHTML = S.jobs.filter(j => eslesir(j.n)).map(j =>
      `<li>${ad("jobs", j.id, "n", j.n)}` +
      (j.st ? `<select data-act="status" data-id="${j.id}">${durumlar.map(s => `<option ${s === j.st ? "selected" : ""}>${s}</option>`).join("")}</select>`
            : `<button type="button" class="apply" data-act="apply" data-id="${j.id}">Başvur</button>`) +
      delBtn("jobs", j.id) + `</li>`
    ).join("") || `<li class="empty">Henüz kayıt yok.</li>`;
  }
  if ($("skills")) {
    $("skills").innerHTML = S.skills.map((s, i) =>
      `<li>${ad("skills", s.id, "n", s.n)}<input type="range" min="0" max="100" value="${s.p}" data-act="skill" data-id="${s.id}" style="accent-color:${renkler[(i + 4) % renkler.length]}"><span class="pct">%${s.p}</span>${delBtn("skills", s.id)}</li>`
    ).join("") || `<li class="empty">Henüz beceri yok.</li>`;
  }

  bildirimRozetiGuncelle();
  kanbanCiz();
  hedeflerCiz();
  kisayolCiz();
  miniDersGridCiz();
  miniPlanCiz();
  isBugunCiz();
  pomoRender();
  gorevlerCiz();
  haftalikGridCiz();
  planHaftalikCiz();
  planPerformansCiz();
  planToplantilarCiz();
  sinavlarCiz();
  odevlerCiz();
  yksGrafikCiz();
  yksListeCiz();
  yksOzetCiz();
  acOzetCiz();
  kariyerCiz();
  if (S.mode === "work") {
    projeSecenekleriDoldur();
    projelerCiz();
    sprintCiz();
    sprintMiniCiz();
    toplantiHaftaCiz();
    oncelikCiz();
  }
  kaydet();
}

// ================= Tıklama olayları =================
document.addEventListener("click", e => {
  const tab = e.target.closest("[data-tab]");
  if (tab) { sekme = tab.dataset.tab; $("authMsg").textContent = ""; if ($("epostaMsg")) $("epostaMsg").textContent = ""; return authCiz(); }
  const acc = e.target.closest("[data-acc]");
  if (acc) {
    const h = db.users[acc.dataset.acc];
    sekme = "login"; $("aUser").value = h.ad; girisModu(h.tur); authCiz();
    return $("aPass").focus();
  }
  const obTur = e.target.closest("[data-ob-tur]");
  if (obTur) { e.preventDefault(); girisModu(obTur.dataset.obTur); return; }

  const gBtn = e.target.closest("#googleGiris");
  if (gBtn) {
    e.preventDefault();
    const msg = girisMesaji;
    if (!bulutHazir()) { msg("Bulut bağlantısı yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile."); return; }
    msg("");
    googleBekliyor(true);
    window.AYVEX_BULUT.girisYap()
      .then(googleOturumAc)
      .catch(err => { console.warn("[AYVEX] Google girişi:", err); msg(authHataMetni(err)); })
      .finally(() => googleBekliyor(false));
    return;
  }

  if (e.target.closest("[data-logout]")) { e.preventDefault(); cikis(); return; }
  if (e.target.closest("[data-delacc]")) {
    if (bulutHesabiMi(db.aktif)) {
      // E-posta hesabı silinirken mevcut şifre istenir (hesap ve Firebase kaydı birlikte silinir)
      if (db.users[db.aktif].saglayici === "password") { sifrePenceresi("sil"); return; }
      if (confirm("Buluttaki tüm verilerin kalıcı olarak silinecek ve bu işlem geri alınamaz.\n\nİstersen önce Ayarlar > \"Verilerimi indir\" ile yedek al. Devam edilsin mi?")) bulutHesabiSil();
      return;
    }
    if (confirm("Hesabın ve tüm verilerin kalıcı olarak silinecek. Devam edilsin mi?")) { delete db.users[db.aktif]; cikis(); }
    return;
  }

  if (e.target.closest("#menuBtn")) { e.preventDefault(); mobilMenuAc(); return; }
  if (e.target.closest("#sidebarClose")) { e.preventDefault(); mobilMenuKapat(); return; }
  if (e.target.closest("#mobileOverlay")) { e.preventDefault(); mobilMenuKapat(); return; }
  if (e.target.closest("#mobileMoreBtn")) { e.preventDefault(); mobilMenuAc(); return; }
  if (e.target.closest("#backBtn")) { e.preventDefault(); goView("home"); return ciz(); }

  if (e.target.closest("#notifClose")) { panelKapat(); return; }
  const panel = $("notifPanel");
  if (panel && panel.classList.contains("on")) {
    if (!e.target.closest("#notifPanel") && !e.target.closest("#bellBtn")) panelKapat();
  }
  if (e.target.closest("#bellBtn")) {
    e.preventDefault();
    if (panel && panel.classList.contains("on")) panelKapat();
    else panelAc();
    return;
  }
  if (e.target.closest("#notifClear")) {
    if (confirm("Tüm bildirimleri silmek istediğine emin misin?")) {
      S.notifications = []; bildirimCiz(); bildirimRozetiGuncelle(); kaydet();
    }
    return;
  }

  // Pomodoro
  const pomoTab = e.target.closest(".pomo-tab");
  if (pomoTab) {
    e.preventDefault();
    if (pomo.calisiyor && !confirm("Çalışan pomodoro durdurulacak. Devam edilsin mi?")) return;
    pomoModDegistir(pomoTab.dataset.mode);
    return;
  }
  if (e.target.closest("#pomoStart")) {
    e.preventDefault();
    if (pomo.calisiyor) pomoDurdur();
    else pomoBaslat();
    return;
  }
  if (e.target.closest("#pomoReset")) { e.preventDefault(); pomoSifirla(); return; }
  if (e.target.closest("#pomoSkip")) { e.preventDefault(); pomoBitti(false); return; }
  if (e.target.closest(".pomo-bind-btn")) {
    e.preventDefault(); pomoBindAc(); guvenliAc($("dlgPomoBind")); return;
  }
  const bindTab = e.target.closest(".pomo-bind-tab");
  if (bindTab) {
    e.preventDefault();
    document.querySelectorAll(".pomo-bind-tab").forEach(t => t.classList.toggle("on", t === bindTab));
    pomoBindAc();
    return;
  }
  const bindItem = e.target.closest("[data-pomo-bind]");
  if (bindItem) {
    e.preventDefault();
    if (!S.pomo) S.pomo = { ...POMO_DEFAULTS, stats: {}, bind: null };
    S.pomo.bind = { tip: bindItem.dataset.pomoBind, id: bindItem.dataset.id };
    $("dlgPomoBind").close();
    pomoBindRender();
    kaydet();
    return;
  }
  if (e.target.closest("#pomoBindFree")) {
    e.preventDefault();
    if (S.pomo) S.pomo.bind = null;
    $("dlgPomoBind").close();
    pomoBindRender();
    kaydet();
    return;
  }
  if (e.target.closest("#pomoResetStats")) {
    e.preventDefault();
    if (confirm("Tüm pomodoro istatistikleri silinecek. Emin misin?")) {
      if (S.pomo) S.pomo.stats = {};
      pomoStatsGuncelle();
      kaydet();
    }
    return;
  }

  // Plan tab
  const planTab = e.target.closest(".plan-tab");
  if (planTab) {
    e.preventDefault();
    planSekmeDegistir(planTab.dataset.planTab);
    return;
  }

  // Ders Sil
  if (e.target.closest("#silDers")) {
    e.preventDefault();
    const form = $("dlgDers").querySelector("form");
    const id = form.querySelector("[name=id]").value;
    if (!id) { $("dlgDers").close(); return; }
    const d = bul("dersler", id);
    if (!d) { $("dlgDers").close(); return; }
    if (confirm(`"${d.ad}" dersini silmek istediğine emin misin?`)) {
      sil("dersler", id);
      $("dlgDers").close();
      ciz();
    }
    return;
  }

  // Sınav Sil
  if (e.target.closest("#silSinav")) {
    e.preventDefault();
    const form = $("dlgSinav").querySelector("form");
    const id = form.querySelector("[name=id]").value;
    if (!id) { $("dlgSinav").close(); return; }
    const s = bul("sinavlar", id);
    if (!s) { $("dlgSinav").close(); return; }
    if (confirm(`"${s.ad}" sınavını silmek istediğine emin misin?`)) {
      sil("sinavlar", id);
      $("dlgSinav").close();
      ciz();
    }
    return;
  }

  // Ödev Sil
  if (e.target.closest("#silOdev")) {
    e.preventDefault();
    const form = $("dlgOdev").querySelector("form");
    const id = form.querySelector("[name=id]").value;
    if (!id) { $("dlgOdev").close(); return; }
    const o = bul("odevler", id);
    if (!o) { $("dlgOdev").close(); return; }
    if (confirm(`"${o.ad}" ödevini silmek istediğine emin misin?`)) {
      sil("odevler", id);
      $("dlgOdev").close();
      ciz();
    }
    return;
  }

  // YKS Sil (modal içinden)
  if (e.target.closest("#silYks")) {
    e.preventDefault();
    const form = $("dlgYks").querySelector("form");
    const id = form.querySelector("[name=id]").value;
    if (!id) { $("dlgYks").close(); return; }
    const d = bul("yksDenemeleri", id);
    if (!d) { $("dlgYks").close(); return; }
    if (confirm(`"${d.ad}" denemesini silmek istediğine emin misin?`)) {
      sil("yksDenemeleri", id);
      $("dlgYks").close();
      ciz();
      kaydet();
    }
    return;
  }

  // ---- Düzenlenebilir kayıtlar (Kariyer + İş modu) ----
  if (e.target.closest("a[data-stop]")) return; // kurs/toplantı linki: düzenleme penceresini açmadan linke git
  for (const tip in DUZENLE_DLG) {
    const c = DUZENLE_DLG[tip];
    if (e.target.closest("#" + c.sil)) {
      e.preventDefault();
      const id = $(c.dlg).querySelector("[name=id]").value;
      if (id && bul(c.list, id) && confirm("Bu kaydı silmek istediğine emin misin?")) {
        sil(c.list, id);
        $(c.dlg).close();
        ciz();
      }
      return;
    }
  }
  const khToggle = e.target.closest("[data-act='kh-toggle']");
  if (khToggle) {
    const h = bul("kariyerHedefler", khToggle.dataset.id);
    if (h) { h.done = khToggle.checked; kariyerCiz(); kaydet(); }
    return;
  }
  const kayitEdit = e.target.closest(DUZENLE_SECICI);
  if (kayitEdit && !e.target.closest("[data-act='del']")) {
    e.preventDefault();
    kayitDuzenleAc(kayitEdit.dataset.act.replace("-edit", ""), kayitEdit.dataset.id);
    return;
  }

  // ---- İş modu: sprint, proje filtresi, toplantı haftası ----
  const spMove = e.target.closest("[data-act='sprint-move']");
  if (spMove) {
    e.preventDefault();
    const s = bul("sprintIsleri", spMove.dataset.id);
    if (s && ["todo", "doing", "done"].includes(spMove.dataset.to)) {
      s.durum = spMove.dataset.to;
      if (s.durum === "done") s.bitis = new Date().toISOString(); else delete s.bitis;
      ciz();
    }
    return;
  }
  if (e.target.closest("#sprintBitir")) { e.preventDefault(); sprintBitir(); return; }
  const pf = e.target.closest("[data-proje-filtre]");
  if (pf) { e.preventDefault(); projeFiltre = pf.dataset.projeFiltre; projelerCiz(); return; }
  const tkBtn = e.target.closest("[data-tk-hafta]");
  if (tkBtn) {
    e.preventDefault();
    const d = +tkBtn.dataset.tkHafta;
    tkHaftaOfset = d === 0 ? 0 : tkHaftaOfset + d;
    toplantiHaftaCiz();
    return;
  }

  // Ödev Toggle
  if (e.target.closest("[data-act='odev-toggle']")) {
    const cb = e.target.closest("[data-act='odev-toggle']");
    const it = bul("odevler", cb.dataset.id);
    if (it) { it.done = cb.checked; odevlerCiz(); acOzetCiz(); kaydet(); }
    return;
  }

  // YKS Denemesi Sil (liste içindeki çöp kutusu) — EDIT'TEN ÖNCE!
  const yksDel = e.target.closest("[data-act='del'][data-list='yksDenemeleri']");
  if (yksDel) {
    e.preventDefault();
    e.stopPropagation();
    const d = bul("yksDenemeleri", yksDel.dataset.id);
    if (!d) return;
    if (confirm(`"${d.ad}" denemesini silmek istediğine emin misin?`)) {
      sil("yksDenemeleri", yksDel.dataset.id);
      ciz();
      kaydet();
    }
    return;
  }

  // YKS Denemesi Düzenle
  const yksItem = e.target.closest("[data-act='yks-edit']");
  if (yksItem) {
    e.preventDefault();
    const d = bul("yksDenemeleri", yksItem.dataset.id);
    if (!d) return;
    const form = $("dlgYks").querySelector("form");
    form.reset();
    form.querySelector("[name=ad]").value = d.ad || "";
    form.querySelector("[name=tarih]").value = d.tarih || "";
    form.querySelector("[name=alan]").value = d.alan || "sayisal";
    form.querySelector("[name=tyt]").value = d.tyt || "";
    form.querySelector("[name=ayt]").value = d.ayt || "";
    form.querySelector("[name=notlar]").value = d.notlar || "";
    let idInput = form.querySelector("[name=id]");
    if (!idInput) {
      idInput = document.createElement("input");
      idInput.type = "hidden";
      idInput.name = "id";
      form.appendChild(idInput);
    }
    idInput.value = d.id;
    const dlgHead = $("dlgYks").querySelector(".dlg-head h2");
    if (dlgHead) dlgHead.textContent = "YKS Denemesini Düzenle";
    const silBtn = $("silYks");
    if (silBtn) silBtn.hidden = false;
    guvenliAc($("dlgYks"));
    return;
  }

  // Sınav Düzenle
  const sinavItem = e.target.closest("[data-act='sinav-edit']");
  if (sinavItem) {
    e.preventDefault();
    const s = bul("sinavlar", sinavItem.dataset.id);
    if (!s) return;
    const form = $("dlgSinav").querySelector("form");
    form.reset();
    form.querySelector("[name=id]").value = s.id || "";
    form.querySelector("[name=ad]").value = s.ad || "";
    form.querySelector("[name=tur]").value = s.tur || "Vize";
    form.querySelector("[name=tarih]").value = s.tarih || "";
    form.querySelector("[name=saat]").value = s.saat || "";
    form.querySelector("[name=yer]").value = s.yer || "";
    form.querySelector("[name=notlar]").value = s.notlar || "";
    $("dlgSinavTitle").textContent = "Sınavı Düzenle";
    if ($("silSinav")) $("silSinav").hidden = false;
    guvenliAc($("dlgSinav"));
    return;
  }

  // Ödev Düzenle
  const odevItem = e.target.closest("[data-act='odev-edit']");
  if (odevItem) {
    e.preventDefault();
    const o = bul("odevler", odevItem.dataset.id);
    if (!o) return;
    const form = $("dlgOdev").querySelector("form");
    form.reset();
    form.querySelector("[name=id]").value = o.id || "";
    form.querySelector("[name=ad]").value = o.ad || "";
    form.querySelector("[name=ders]").value = o.ders || "";
    form.querySelector("[name=tarih]").value = o.tarih || "";
    form.querySelector("[name=aciklama]").value = o.aciklama || "";
    $("dlgOdevTitle").textContent = "Ödevi Düzenle";
    if ($("silOdev")) $("silOdev").hidden = false;
    guvenliAc($("dlgOdev"));
    return;
  }

  // Ders Düzenle
  const dersItem = e.target.closest("[data-act='ders-edit']");
  if (dersItem) {
    e.preventDefault();
    const d = bul("dersler", dersItem.dataset.id);
    if (!d) return;
    const form = $("dlgDers").querySelector("form");
    form.reset();
    form.querySelector("[name=id]").value = d.id || "";
    form.querySelector("[name=ad]").value = d.ad || "";
    form.querySelector("[name=kod]").value = d.kod || "";
    form.querySelector("[name=hoca]").value = d.hoca || "";
    form.querySelector("[name=sinif]").value = d.sinif || "";
    form.querySelector("[name=gun]").value = d.gun ?? "1";
    form.querySelector("[name=renk]").value = d.renk || "blue";
    form.querySelector("[name=bas]").value = d.bas || "";
    form.querySelector("[name=bit]").value = d.bit || "";
    form.querySelector("[name=notlar]").value = d.notlar || "";
    $("dlgDersTitle").textContent = "Dersi Düzenle";
    if ($("silDers")) $("silDers").hidden = false;
    guvenliAc($("dlgDers"));
    return;
  }

  const filterBtn = e.target.closest(".filter-btn");
  if (filterBtn) {
    S.taskFilter = filterBtn.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("on", b === filterBtn));
    gorevlerCiz();
    kaydet();
    return;
  }
  if (e.target.closest("#btnClearDone")) {
    const sayi = (S.tasks || []).filter(t => t.done).length;
    if (sayi === 0) { alert("Silinecek tamamlanmış görev yok."); return; }
    if (confirm(`${sayi} tamamlanmış görev silinecek. Emin misin?`)) {
      S.tasks = S.tasks.filter(t => !t.done);
      gorevlerCiz(); kanbanCiz(); kaydet();
    }
    return;
  }

  const startBtn = e.target.closest("[data-act='task-start']");
  if (startBtn) {
    e.preventDefault();
    const t = bul("tasks", startBtn.dataset.id);
    if (t) { t.doing = true; kanbanCiz(); gorevlerCiz(); kaydet(); }
    return;
  }
  const doneBtn2 = e.target.closest("[data-act='task-done']");
  if (doneBtn2) {
    e.preventDefault();
    const t = bul("tasks", doneBtn2.dataset.id);
    if (t) { gorevTamamla(t, true); ciz(); }
    return;
  }
  const undoBtn = e.target.closest("[data-act='task-undo']");
  if (undoBtn) {
    e.preventDefault();
    const t = bul("tasks", undoBtn.dataset.id);
    if (t) { gorevTamamla(t, false); ciz(); }
    return;
  }

  const hedefPlus = e.target.closest("[data-act='hedef-plus']");
  if (hedefPlus) {
    e.preventDefault();
    const h = bul("hedefler", hedefPlus.dataset.id);
    if (h) { h.mevcut = Math.min(h.hedef, h.mevcut + 1); hedeflerCiz(); kaydet(); }
    return;
  }
  const hedefMinus = e.target.closest("[data-act='hedef-minus']");
  if (hedefMinus) {
    e.preventDefault();
    const h = bul("hedefler", hedefMinus.dataset.id);
    if (h) { h.mevcut = Math.max(0, h.mevcut - 1); hedeflerCiz(); kaydet(); }
    return;
  }

  const closeBtn = e.target.closest("[data-dialog-close]");
  if (closeBtn) { const d = closeBtn.closest("dialog"); if (d) d.close(); return; }

  const avBtn = e.target.closest("[data-avatar]");
  if (avBtn) {
    e.preventDefault();
    const i = +avBtn.dataset.avatar;
    document.querySelectorAll(".avatar-option").forEach(b => b.classList.remove("cur"));
    avBtn.classList.add("cur");
    const pa = $("profileAvatar");
    pa.innerHTML = avatarHTML(i);
    avatarRenkUygula(pa, i);
    pa.dataset.pending = i;
    return;
  }

  const opener = e.target.closest("[data-open]");
  if (opener) {
    e.preventDefault();
    const dlg = $(opener.dataset.open);
    if (!dlg) return;
    const form = dlg.querySelector("form");
    if (form) {
      form.reset();
      if (opener.dataset.open === "dlgDers") {
        form.querySelector("[name=id]").value = "";
        $("dlgDersTitle").textContent = "Ders Ekle";
        if ($("silDers")) $("silDers").hidden = true;
      }
      if (opener.dataset.open === "dlgSinav") {
        form.querySelector("[name=id]").value = "";
        $("dlgSinavTitle").textContent = "Sınav Ekle";
        if ($("silSinav")) $("silSinav").hidden = true;
      }
      if (opener.dataset.open === "dlgOdev") {
        form.querySelector("[name=id]").value = "";
        $("dlgOdevTitle").textContent = "Ödev Ekle";
        if ($("silOdev")) $("silOdev").hidden = true;
      }
      if (opener.dataset.open === "dlgYks") {
        const idInp = form.querySelector("[name=id]");
        if (idInp) idInp.value = "";
        const dlgHead = $("dlgYks").querySelector(".dlg-head h2");
        if (dlgHead) dlgHead.textContent = "YKS Denemesi Ekle";
        const silBtn = $("silYks");
        if (silBtn) silBtn.hidden = true;
      }
      for (const tip in DUZENLE_DLG) {
        const c = DUZENLE_DLG[tip];
        if (opener.dataset.open !== c.dlg) continue;
        form.querySelector("[name=id]").value = "";
        $(c.baslik).textContent = c.ekle;
        $(c.sil).hidden = true;
        const tarihEl = form.querySelector("[name=tarih]");
        if (tip === "basvuru" && tarihEl) tarihEl.value = todayKey;
        if (tip === "toplanti" && tarihEl) tarihEl.value = opener.dataset.tarih || todayKey;
        if (tip === "proje" && form.querySelector("[name=bas]")) form.querySelector("[name=bas]").value = todayKey;
      }
      projeSecenekleriDoldur();
      if (opener.dataset.open === "dlgSprint" && S.sprint) {
        ["ad", "bas", "bit", "hedef", "kapasite"].forEach(a => { const el = form.querySelector(`[name=${a}]`); if (el) el.value = S.sprint[a] ?? ""; });
      }
      if (opener.dataset.open === "dlgEvent") form.dataset.day = opener.dataset.day || "today";
      const selEl = form.querySelector("select[name=type]");
      if (selEl) selEl.innerHTML = M().tur.map(t => `<option>${t}</option>`).join("");
      if (opener.dataset.open === "dlgEvent") {
        // Tarih alanı: takvimden açıldıysa seçili gün, başka yerden (ör. hızlı ekle) açıldıysa bugün
        const gunEl = form.querySelector("[name=gun]");
        if (gunEl) gunEl.value = form.dataset.day === "sel" ? sel : todayKey;
        // Tür varsayılanı "Etkinlik" (eskiden listedeki ilk seçenek "Ders" / "Toplantı" geliyordu)
        if (selEl && [...selEl.options].some(o => o.value === "Etkinlik")) selEl.value = "Etkinlik";
      }
    }
    if (opener.dataset.open === "pomodoroAyarDlg") pomoAyarFormDoldur();
    guvenliAc(dlg);
    return;
  }

  const dlgBtn = e.target.closest("[data-dlg]");
  if (dlgBtn) {
    e.preventDefault();
    // Pomodoro ayar düğmesi data-dlg kullanıyor; kayıtlı ayarları forma burada doldur
    // (eskiden sadece data-open dalında dolduruluyordu, form hep varsayılanları gösteriyordu)
    if (dlgBtn.dataset.dlg === "pomodoroAyarDlg") pomoAyarFormDoldur();
    if (dlgBtn.dataset.dlg === "settingsDlg" && S) {
      $("setName").value = S.name;
      sistemBildirimDugmesi();
      const h = db.users[db.aktif];
      const modAdi = S.mode === "work" ? "Çalışan" : "Öğrenci";
      const epostaHesabi = bulutHesabiMi(db.aktif) && h.saglayici === "password";
      $("setAcc").textContent = !bulutHesabiMi(db.aktif)
        ? `Yerel hesap (sadece bu tarayıcı) · ${h.ad} · ${modAdi}`
        : `${epostaHesabi ? "E-posta hesabı" : "Google hesabı"} · ${h.email || h.ad} · ${modAdi}`;
      if ($("sifreDegistirBtn")) $("sifreDegistirBtn").hidden = !epostaHesabi;
      bulutDurumCiz();
    }
    return guvenliAc($(dlgBtn.dataset.dlg));
  }

  const nav = e.target.closest("[data-view]");
  if (nav) {
    e.preventDefault();
    if (nav.hasAttribute("data-today")) { sel = todayKey; view = { y: now.getFullYear(), m: now.getMonth() }; }
    goView(nav.dataset.view);
    return ciz();
  }

  const b = e.target.closest("[data-act]");
  if (!b) return;
  if (["done", "grade", "status", "skill", "task-toggle", "ders-edit", "sinav-edit", "odev-edit", "odev-toggle",
       "task-start", "task-done", "task-undo", "hedef-plus", "hedef-minus", "yks-edit",
       "nh", "nh-oran", "nh-ekle", "nh-sil", "paylas-proje", "alt-ac", "alt-sil", "alt-ekle", "alt-toggle"].includes(b.dataset.act)) return;
  e.preventDefault();
  const { act, id, list } = b.dataset;
  if (act === "mini") {
    sel = b.dataset.date;
    const [y, m] = sel.split("-");
    view = { y: +y, m: +m - 1 };
    goView("cal");
  }
  if (act === "big") sel = b.dataset.date;
  if (act === "del") {
    // Silmeden önce kaydın kopyasını al; "Geri al" sadece bu kaydı geri koyar
    const yedek = silmeYedegi(list, id);
    sil(list, id);
    geriAlGoster(SILME_ADI[list] ? `${SILME_ADI[list]} silindi` : "Silindi", yedek, yedek && yedek.kayit);
  }
  if (act === "apply") { const j = bul("jobs", id); if (j) j.st = "Beklemede"; }
  ciz();
});

// ================= Ay gezinme =================
const ayGit = d => {
  view.m += d;
  if (view.m < 0) { view.m = 11; view.y--; }
  if (view.m > 11) { view.m = 0; view.y++; }
  ciz();
};
if ($("prev")) $("prev").onclick = () => ayGit(-1);
if ($("next")) $("next").onclick = () => ayGit(1);
if ($("bPrev")) $("bPrev").onclick = () => ayGit(-1);
if ($("bNext")) $("bNext").onclick = () => ayGit(1);
if ($("bToday")) $("bToday").onclick = () => { sel = todayKey; view = { y: now.getFullYear(), m: now.getMonth() }; ciz(); };
if ($("closeSettings")) $("closeSettings").onclick = () => $("settingsDlg").close();

let aramaZamani;
if ($("q")) {
  $("q").oninput = e => {
    q = aramaNorm(e.target.value.trim());
    // Telefonda büyüteç düğmesi, aktif bir arama olduğunu renkle göstersin
    if ($("mobilAraBtn")) $("mobilAraBtn").classList.toggle("aktif", !!q);
    clearTimeout(aramaZamani);
    aramaZamani = setTimeout(ciz, 150);
  };
}
if ($("miniCalToggle")) {
  $("miniCalToggle").onclick = () => {
    const mc = $("miniCal");
    const collapsed = mc.dataset.collapsed === "true";
    mc.dataset.collapsed = collapsed ? "false" : "true";
    $("miniCalToggle").setAttribute("aria-expanded", String(collapsed));
  };
}
// ================= TEMA (açık / koyu / sistem) =================
// Cihaza özel bir tercih: hesap verisine değil bu tarayıcıya kaydedilir.
function temaSecimi() { try { return localStorage.getItem("ayvex-tema") || "sistem"; } catch (e) { return "sistem"; } }
const koyuSistem = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
function temaUygula() {
  const s = temaSecimi();
  const koyu = s === "koyu" || (s === "sistem" && koyuSistem && koyuSistem.matches);
  document.documentElement.setAttribute("data-tema", koyu ? "koyu" : "acik");
  document.querySelectorAll("[data-tema-sec]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.temaSec === s)));
}
if (koyuSistem && koyuSistem.addEventListener) koyuSistem.addEventListener("change", temaUygula);
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-tema-sec]");
  if (!b) return;
  try { localStorage.setItem("ayvex-tema", b.dataset.temaSec); } catch (err) {}
  temaUygula();
});
temaUygula();

if ($("setName")) $("setName").onchange =e => { const ad = e.target.value.trim().slice(0, 30); if (ad && S) { S.name = ad; ciz(); } };
if ($("reset")) $("reset").onclick = () => {
  if (confirm("Bu hesabın tüm verileri silinecek. Devam edilsin mi?")) {
    db.users[db.aktif].data = S = yeniVeri(S.mode, S.name);
    $("settingsDlg").close();
    ciz();
  }
};
// ================= YEDEKLE / GERİ YÜKLE =================
// Tüm hesap verisini bir JSON dosyası olarak indirir; aynı dosyadan geri yüklenebilir.
// Bulut hesabında geri yükleme, normal kayıt akışıyla buluta da gönderilir.
if ($("yedekIndir")) $("yedekIndir").onclick = () => {
  if (!S) return;
  const icerik = { uygulama: "AYVEX", surum: 1, tarih: new Date().toISOString(), hesap: { ad: S.name, tur: S.mode }, veri: S };
  const blob = new Blob([JSON.stringify(icerik, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ayvex-yedek-${todayKey}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
// ================= TAKVİME AKTAR (.ics) =================
// Google Takvim, Outlook ve Apple Takvim'in okuduğu iCalendar dosyası üretir.
// Saatli kayıtlar "yüzen" yerel saatle yazılır (saat dilimi dönüşümü olmasın), saatsizler tüm gün olur.
function icsMetin(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function icsSatirKatla(satir) {
  // RFC 5545: satırlar 75 bayttan uzun olmamalı; devam satırı bir boşlukla başlar
  const parcalar = []; let kalan = satir;
  while (new TextEncoder().encode(kalan).length > 73) {
    let n = 73; while (new TextEncoder().encode(kalan.slice(0, n)).length > 73) n--;
    parcalar.push(kalan.slice(0, n)); kalan = " " + kalan.slice(n);
  }
  parcalar.push(kalan);
  return parcalar.join("\r\n");
}
function takvimDosyasi() {
  const gunStr = k => k.replace(/-/g, "");
  const saatStr = h => { const [s, d] = (h || "00:00").split(":"); return `${String(+s).padStart(2, "0")}${String(+d || 0).padStart(2, "0")}00`; };
  const dkEkle = (k, h, dk) => { const d = tarihOku(k); const [s, m] = (h || "00:00").split(":"); d.setHours(+s, (+m || 0) + dk); return `${tarihKey(d).replace(/-/g, "")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`; };
  const ertesi = k => { const d = tarihOku(k); d.setDate(d.getDate() + 1); return gunStr(tarihKey(d)); };
  const damga = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const olaylar = [];
  const ekle = (id, baslik, k, saat, sureDk, aciklama, ek = []) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k || "")) return;
    const s = ["BEGIN:VEVENT", `UID:${id}@ayvex`, `DTSTAMP:${damga}`, `SUMMARY:${icsMetin(baslik)}`];
    if (saat) s.push(`DTSTART:${gunStr(k)}T${saatStr(saat)}`, `DTEND:${dkEkle(k, saat, sureDk || 60)}`);
    else s.push(`DTSTART;VALUE=DATE:${gunStr(k)}`, `DTEND;VALUE=DATE:${ertesi(k)}`);
    if (aciklama) s.push(`DESCRIPTION:${icsMetin(aciklama)}`);
    s.push(...ek, "END:VEVENT");
    olaylar.push(...s);
  };
  (S.sinavlar || []).forEach(x => ekle("sinav-" + x.id, `📝 ${x.ad} (${x.tur || "Sınav"})`, x.tarih, x.saat, 90, x.notlar, x.yer ? [`LOCATION:${icsMetin(x.yer)}`] : []));
  (S.odevler || []).filter(x => !x.done).forEach(x => ekle("odev-" + x.id, `📚 Ödev: ${x.ad}`, x.tarih, "", 0, [x.ders, x.aciklama].filter(Boolean).join(" · ")));
  (S.toplantilar || []).forEach(x => ekle("toplanti-" + x.id, `👥 ${x.baslik}`, x.tarih, x.saat, x.sure || 30, [x.katilimcilar, x.notlar, x.link].filter(Boolean).join("\n"), x.link ? [`URL:${icsMetin(x.link)}`] : []));
  (S.deadlines || []).forEach(x => ekle("teslim-" + x.id, `⏰ Teslim: ${x.t}`, x.d, "", 0, ""));
  (S.tasks || []).filter(x => !x.done && x.son).forEach(x => ekle("gorev-" + x.id, `📌 ${x.t}`, x.son, "", 0, `Öncelik: ${ONCELIK[gorevOncelik(x.p)]}`));
  (S.projeler || []).filter(x => x.bitis && x.durum !== "tamam").forEach(x => ekle("proje-" + x.id, `📦 Proje teslimi: ${x.ad}`, x.bitis, "", 0, ""));
  Object.entries(S.events || {}).forEach(([k, liste]) => (liste || []).forEach(x => ekle("etkinlik-" + x.id, x.t, k, x.time && x.time !== "00:00" ? x.time : "", 60, x.type)));
  // Ders programı: her hafta tekrarlayan olay (bu haftanın ilgili gününden başlar)
  const RRGUN = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  (S.dersler || []).forEach(x => {
    const gun = haftaGunleriKey().find(k => tarihOku(k).getDay() === +x.gun);
    if (!gun) return;
    const sure = Math.max(15, saatDk(x.bit) - saatDk(x.bas));
    ekle("ders-" + x.id, `🎓 ${x.ad}${x.kod ? " (" + x.kod + ")" : ""}`, gun, x.bas, sure, x.hoca ? "Hoca: " + x.hoca : "",
      [`RRULE:FREQ=WEEKLY;BYDAY=${RRGUN[+x.gun]}`, ...(x.sinif ? [`LOCATION:${icsMetin(x.sinif)}`] : [])]);
  });
  const satirlar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AYVEX//Planlama//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:AYVEX", ...olaylar, "END:VCALENDAR"];
  return { metin: satirlar.map(icsSatirKatla).join("\r\n") + "\r\n", sayi: olaylar.filter(s => s === "BEGIN:VEVENT").length };
}
if ($("takvimAktar")) $("takvimAktar").onclick = () => {
  if (!S) return;
  const { metin, sayi } = takvimDosyasi();
  if (!sayi) { bilgiGoster("Aktarılacak tarihli kayıt yok."); return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([metin], { type: "text/calendar;charset=utf-8" }));
  a.download = `ayvex-takvim-${todayKey}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  bilgiGoster(`${sayi} kayıt takvim dosyasına aktarıldı.`);
};
if ($("yedekYukle")) $("yedekYukle").onclick =() => { if ($("yedekDosya")) { $("yedekDosya").value = ""; $("yedekDosya").click(); } };
if ($("yedekDosya")) $("yedekDosya").onchange = async e => {
  const dosya = e.target.files && e.target.files[0];
  if (!dosya || !S) return;
  if (dosya.size > 5 * 1024 * 1024) { alert("Dosya çok büyük; bu bir AYVEX yedeği değil gibi görünüyor."); return; }
  let icerik;
  try { icerik = JSON.parse(await dosya.text()); } catch (err) { alert("Dosya okunamadı: geçerli bir yedek dosyası değil."); return; }
  if (!icerik || icerik.uygulama !== "AYVEX" || !icerik.veri) { alert("Bu dosya bir AYVEX yedeği değil."); return; }
  const v = veriOnar(icerik.veri, S.mode, S.name);
  if (!gecerli(v)) { alert("Yedek dosyasındaki veri bozuk ya da eksik."); return; }
  const tarih = icerik.tarih ? new Date(icerik.tarih).toLocaleString("tr-TR") : "bilinmiyor";
  const modUyari = v.mode !== S.mode ? `\n\nDikkat: yedek ${v.mode === "work" ? "Çalışan" : "Öğrenci"} modunda; hesabın bu moda geçecek.` : "";
  if (!confirm(`Yedek tarihi: ${tarih}\n\nMevcut tüm verilerin bu yedektekilerle değiştirilecek.${modUyari}\n\nDevam edilsin mi?`)) return;
  const h = db.users[db.aktif];
  const eski = h.data, eskiTur = h.tur;
  $("settingsDlg").close();
  try {
    h.data = v; h.tur = v.mode;
    S = v;
    pomoAyarlaraGoreSifirla();
    modUygula();
    goView("home");
    ciz();
  } catch (err) {
    // Beklenmedik bozuk veri: eski hale dön, bozuk veriyi kaydetme
    console.error("[AYVEX] yedek uygulanamadı:", err);
    clearTimeout(kaydetZamani); clearTimeout(bulutZamani); bulutZamani = null;
    h.data = eski; h.tur = eskiTur; S = eski;
    modUygula(); goView("home"); ciz();
    alert("Yedek dosyasındaki veri bozuk olduğu için yüklenemedi. Mevcut verilerin değişmedi.");
    return;
  }
  dbYaz();
  alert("Yedek geri yüklendi.");
};

if ($("userBox")) $("userBox").onclick = () => acProfil();
if ($("profileSave")) $("profileSave").onclick = () => {
  if (!S) return;
  const yeniIsim = $("profileNameInput").value.trim();
  if (yeniIsim) S.name = yeniIsim;
  const pending = $("profileAvatar").dataset.pending;
  if (pending !== undefined && pending !== "") S.avatar = +pending;
  $("profileDlg").close();
  ciz();
  kaydet();
};

document.addEventListener("change", e => {
  if (e.target.matches && e.target.matches("#authForm input[name=tur], #epostaForm input[name=eTur]")) { girisModu(e.target.value); return; }
  const act = e.target.dataset ? e.target.dataset.act : null;
  const id = e.target.dataset ? e.target.dataset.id : null;
  if (!act) return;
  if (act === "grade") { const it = bul("courses", id); if (it) it.g = Math.min(100, Math.max(0, +e.target.value || 0)); }
  else if (act === "status") { const it = bul("jobs", id); if (it) it.st = e.target.value; }
  else if (act === "done" || act === "task-toggle") { const it = bul("tasks", id); if (it) gorevTamamla(it, e.target.checked); }
  else if (act === "odev-toggle") {
    const it = bul("odevler", id);
    if (it) { it.done = e.target.checked; odevlerCiz(); acOzetCiz(); kaydet(); return; }
  }
  else return;
  ciz();
});

document.addEventListener("input", e => {
  if (!e.target.dataset || e.target.dataset.act !== "skill") return;
  const it = bul("skills", e.target.dataset.id);
  if (it) it.p = +e.target.value;
  const pct = e.target.parentElement.querySelector(".pct");
  if (pct) pct.textContent = `%${e.target.value}`;
  kaydet();
});

// Çift tıklayınca yerinde düzenleme: metin bir giriş kutusuna dönüşür. Enter ya da dışarı tıklama
// kaydeder, Esc vazgeçer. (Eskiden tarayıcının prompt() kutusu kullanılıyordu; bazı ortamlarda
// engelleniyor ve telefonda kullanışsızdı.)
function adDegistir(e) {
  const el = e.target.closest && e.target.closest("[data-rename]");
  if (!el || el.querySelector(".yerinde-duzenle")) return;
  const item = bul(el.dataset.list, el.dataset.id);
  if (!item) return;
  const alan = el.dataset.field;
  const giris = document.createElement("input");
  giris.type = "text";
  giris.className = "yerinde-duzenle";
  giris.value = item[alan] || "";
  giris.maxLength = 200;
  giris.setAttribute("aria-label", "Yeni ad");
  const eski = el.innerHTML;
  el.innerHTML = "";
  el.appendChild(giris);
  giris.focus();
  giris.select();
  let bitti = false;
  const bitir = kaydetsin => {
    if (bitti) return;
    bitti = true;
    const yeni = giris.value.trim();
    if (kaydetsin && yeni && yeni !== item[alan]) {
      item[alan] = yeni;
      kaydet();
      ciz();
      if (el.dataset.list === "tasks") { gorevlerCiz(); kanbanCiz(); }
    } else {
      el.innerHTML = eski;
    }
  };
  giris.addEventListener("keydown", ev => {
    if (ev.key === "Enter") { ev.preventDefault(); bitir(true); }
    else if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); bitir(false); }
  });
  giris.addEventListener("blur", () => bitir(true));
  // Kutunun içindeki tıklamalar satırın kendi davranışlarını (seçme, sürükleme) tetiklemesin
  giris.addEventListener("click", ev => ev.stopPropagation());
}
document.addEventListener("dblclick", adDegistir);

// Form hatasını açılır uyarı kutusu (alert) yerine ilgili alanın yanında göster.
// Alan değiştirilince hata kendiliğinden temizlenir.
function alanHatasi(form, alanAdi, mesaj) {
  const el = form.querySelector(`[name="${alanAdi}"]`);
  if (!el) { bilgiGoster(mesaj); return; }
  el.setCustomValidity(mesaj);
  el.reportValidity();
  el.focus();
  // Tarayıcının balonu birkaç saniyede kaybolur; mesaj alanın altında da kalsın
  const kap = el.closest("label") || el.parentElement;
  let yazi = kap.querySelector(".alan-hata");
  if (!yazi) { yazi = document.createElement("span"); yazi.className = "alan-hata"; yazi.setAttribute("role", "alert"); kap.appendChild(yazi); }
  yazi.textContent = mesaj;
  el.setAttribute("aria-invalid", "true");
  const temizle = () => {
    el.setCustomValidity(""); el.removeAttribute("aria-invalid"); yazi.remove();
    el.removeEventListener("input", temizle); el.removeEventListener("change", temizle);
  };
  el.addEventListener("input", temizle);
  el.addEventListener("change", temizle);
}

// Pencere kapanınca içindeki alan hatalarını temizle (yeniden açıldığında eski hata görünmesin)
document.addEventListener("close", e => {
  if (!e.target || e.target.tagName !== "DIALOG") return;
  e.target.querySelectorAll(".alan-hata").forEach(x => x.remove());
  e.target.querySelectorAll('[aria-invalid="true"]').forEach(x => { x.setCustomValidity(""); x.removeAttribute("aria-invalid"); });
}, true);

const AUTOCLOSE = ["dlgGorev","dlgEvent","dlgLink","dlgCourse","dlgDeadline","dlgJob","dlgSkill","dlgNote","dlgDers","dlgHedef","pomodoroAyarDlg","dlgPlanItem","dlgToplanti","dlgSinav","dlgOdev","dlgYks","dlgBasvuru","dlgKurs","dlgKariyerHedef","dlgProje","dlgSprint"];
document.addEventListener("submit", e => {
  e.preventDefault();
  if (!e.target.dataset || !e.target.dataset.form) return;
  // Oturum yokken yazılanı sessizce kaybetme; kullanıcıya neden eklenmediğini söyle
  if (!S) { bilgiGoster("Kaydetmek için önce giriş yapmalısın."); return; }
  const f = e.target;
  // "required" alanlar sadece boşluktan oluşuyorsa kabul etme (tarayıcı boşluğu geçerli sayıyor)
  const bosAlan = [...f.querySelectorAll("input[required], textarea[required]")]
    .find(el => !["date", "time", "number"].includes(el.type) && !el.value.trim());
  if (bosAlan) { bosAlan.value = ""; f.reportValidity(); bosAlan.focus(); return; }
  const v = Object.fromEntries(new FormData(f));
  const id = v.id || uid();

  switch (f.dataset.form) {
    case "ev": {
      const k = /^\d{4}-\d{2}-\d{2}$/.test(v.gun || "") ? v.gun : (f.dataset.day === "today") ? todayKey : sel;
      (S.events[k] = S.events[k] || []).push({ id, t: v.t.trim(), time: v.time, type: v.type });
      break;
    }
    case "course": S.courses.push({ id, n: v.n.trim(), g: Math.min(100, Math.max(0, +v.g)) }); break;
    case "deadline": S.deadlines.push({ id, t: v.t.trim(), d: v.d }); break;
    case "job": S.jobs.push({ id, n: v.n.trim(), st: "" }); break;
    case "skill": S.skills.push({ id, n: v.n.trim(), p: 50 }); break;
    case "task":
    case "task-quick":
      S.tasks.push({ id, t: v.t.trim(), done: false, doing: false, p: v.p || "mid", proje: v.proje || "", son: v.son || "", tekrar: TEKRAR[v.tekrar] ? v.tekrar : "", zaman: new Date().toISOString() });
      break;
    case "note": S.notes.push({ id, title: v.title.trim(), text: v.text.trim(), color: v.color || "yellow" }); break;
    case "link": S.links.push({ id, n: v.n.trim(), u: /^https?:\/\//.test(v.u) ? v.u.trim() : "https://" + v.u.trim() }); break;
    case "ders": {
      if (saatDk(v.bit) <= saatDk(v.bas)) { alanHatasi(f, "bit", "Dersin bitiş saati başlangıç saatinden sonra olmalı."); return; }
      const ders = { id, ad: v.ad.trim(), kod: (v.kod||"").trim(), hoca: (v.hoca||"").trim(), sinif: (v.sinif||"").trim(), gun: v.gun, renk: v.renk || "blue", bas: v.bas, bit: v.bit, notlar: (v.notlar||"").trim() };
      const idx = S.dersler.findIndex(d => d.id === id);
      if (idx >= 0) S.dersler[idx] = ders;
      else S.dersler.push(ders);
      break;
    }
    case "sinav": {
      const sinav = { id, ad: v.ad.trim(), tur: v.tur || "Vize", tarih: v.tarih, saat: (v.saat||"").trim(), yer: (v.yer||"").trim(), notlar: (v.notlar||"").trim() };
      const idx = S.sinavlar.findIndex(s => s.id === id);
      if (idx >= 0) S.sinavlar[idx] = sinav;
      else S.sinavlar.push(sinav);
      break;
    }
    case "odev": {
      const odev = { id, ad: v.ad.trim(), ders: (v.ders||"").trim(), tarih: v.tarih, aciklama: (v.aciklama||"").trim(), done: false };
      const idx = S.odevler.findIndex(o => o.id === id);
      if (idx >= 0) {
        const eski = S.odevler[idx];
        S.odevler[idx] = { ...odev, done: eski.done || false };
      }
      else S.odevler.push(odev);
      break;
    }
    case "yks": {
      const deneme = {
        id,
        ad: v.ad.trim(),
        tarih: v.tarih,
        alan: v.alan || "sayisal",
        tyt: parseFloat(v.tyt) || 0,
        ayt: parseFloat(v.ayt) || 0,
        notlar: (v.notlar || "").trim()
      };
      const idx = S.yksDenemeleri.findIndex(x => x.id === id);
      if (idx >= 0) S.yksDenemeleri[idx] = deneme;
      else S.yksDenemeleri.push(deneme);
      break;
    }
    case "basvuru":
      kayitGuncelle("basvurular", {
        id, sirket: v.sirket.trim(), pozisyon: v.pozisyon.trim(),
        tur: BASVURU_TUR[v.tur] ? v.tur : "staj", durum: BASVURU_DURUM[v.durum] ? v.durum : "beklemede",
        tarih: v.tarih || "", sontarih: v.sontarih || "", link: (v.link || "").trim(), notlar: (v.notlar || "").trim(),
      });
      break;
    case "kurs":
      kayitGuncelle("kurslar", {
        id, ad: v.ad.trim(), platform: KURS_PLATFORM[v.platform] ? v.platform : "diger",
        yuzde: Math.min(100, Math.max(0, Math.round(+v.yuzde || 0))), link: (v.link || "").trim(), notlar: (v.notlar || "").trim(),
      });
      break;
    case "kariyer-hedef": {
      const eski = bul("kariyerHedefler", id);
      kayitGuncelle("kariyerHedefler", {
        id, baslik: v.baslik.trim(), kategori: KH_KATEGORI[v.kategori] ? v.kategori : "diger",
        tarih: v.tarih || "", notlar: (v.notlar || "").trim(), done: eski ? !!eski.done : false,
      });
      break;
    }
    case "hedef":
      S.hedefler.push({ id, baslik: v.baslik.trim(), hedef: Math.max(1, +v.hedef || 1), birim: (v.birim || "kez").trim(), mevcut: 0, hafta: haftaBasiKey(), zaman: new Date().toISOString() });
      break;
    case "plan-item": {
      const eski = bul("planItems", id);
      kayitGuncelle("planItems", { id, baslik: v.baslik.trim(), gun: v.gun, saat: v.saat, kategori: v.kategori || "gorev", zaman: eski ? eski.zaman : new Date().toISOString() });
      break;
    }
    case "toplanti":
      kayitGuncelle("toplantilar", {
        id, baslik: v.baslik.trim(), tarih: v.tarih, saat: v.saat, katilimcilar: (v.katilimcilar || "").trim(),
        sure: Math.max(5, +v.sure || 30), proje: v.proje || "", link: (v.link || "").trim(), notlar: (v.notlar || "").trim(),
      });
      break;
    case "proje": {
      if (v.bas && v.bitis && v.bitis < v.bas) { alanHatasi(f, "bitis", "Teslim tarihi başlangıç tarihinden önce olamaz."); return; }
      const eski = bul("projeler", id);
      kayitGuncelle("projeler", {
        id, ad: v.ad.trim(), ekip: (v.ekip || "").trim(),
        durum: PROJE_DURUM[v.durum] ? v.durum : "aktif", oncelik: ONCELIK[v.oncelik] ? v.oncelik : "mid",
        bas: v.bas || "", bitis: v.bitis || "", ilerleme: Math.min(100, Math.max(0, Math.round(+v.ilerleme || 0))),
        notlar: (v.notlar || "").trim(), zaman: eski ? eski.zaman : new Date().toISOString(),
      });
      break;
    }
    case "sprint": {
      if (v.bit < v.bas) { alanHatasi(f, "bit", "Bitiş tarihi başlangıçtan önce olamaz."); return; }
      S.sprint = { ...S.sprint, ad: v.ad.trim() || S.sprint.ad, bas: v.bas, bit: v.bit, hedef: (v.hedef || "").trim(), kapasite: Math.max(1, +v.kapasite || 20) };
      break;
    }
    case "sprint-is":
      S.sprintIsleri.push({ id, baslik: v.baslik.trim(), puan: [1, 2, 3, 5, 8].includes(+v.puan) ? +v.puan : 3, proje: v.proje || "", durum: "todo", zaman: new Date().toISOString() });
      break;
    case "pomo-ayar": {
      if (!S.pomo) S.pomo = { ...POMO_DEFAULTS, stats: {}, bind: null };
      S.pomo.focus = Math.max(1, +v.focus || 25);
      S.pomo.short = Math.max(1, +v.short || 5);
      S.pomo.long = Math.max(1, +v.long || 15);
      S.pomo.cycle = Math.max(2, +v.cycle || 4);
      S.pomo.sound = v.sound || "on";
      S.pomo.auto = v.auto || "off";
      if (!pomo.calisiyor) { pomo.toplam = pomoSure(pomo.mod); pomo.kalan = pomo.toplam; }
      pomoRender();
      break;
    }
    default: return;
  }
  if (f.dataset.form === "task" || f.dataset.form === "task-quick") bilgiGoster(`Görev eklendi: ${v.t.trim().slice(0, 40)}`);
  f.reset();
  const parentDlg = f.closest("dialog");
  if (parentDlg && AUTOCLOSE.includes(parentDlg.id)) parentDlg.close();
  ciz();
});

// Sadece gerçekten diyalogun DIŞINA (arka plana) tıklanınca kapat. Eskiden diyalog içindeki
// boşluğa tıklamak da pencereyi kapatıp yazılanları kaybettiriyordu.
document.addEventListener("click", e => {
  if (e.target.tagName !== "DIALOG" || !e.clientX && !e.clientY) return;
  const r = e.target.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close();
});

// Gün değiştiyse "bugün" verilerini tazelemek için sayfayı yenile (çalışan pomodoro varsa bölme)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && tarihKey(new Date()) !== todayKey && !pomo.calisiyor) location.reload();
});

// ================= Giriş / çıkış =================
// Not: Eski yerel hesaplar (kullanıcı adı + şifre) silinmez; Google ya da e-posta ile ilk
// girişte açılan aktarma penceresinden buluta taşınabilirler.

// Giriş ekranının rengini ve tanıtım içeriğini moda göre ayarlar (kayıt formundaki seçimle senkron)
function girisModu(tur) {
  if (!MODLAR[tur]) tur = "student";
  const auth = $("auth");
  if (auth) auth.dataset.tur = tur;
  document.querySelectorAll("[data-ob-tur]").forEach(b => {
    b.classList.toggle("on", b.dataset.obTur === tur);
    b.setAttribute("aria-pressed", String(b.dataset.obTur === tur));
  });
  document.querySelectorAll(`#authForm input[name=tur][value="${tur}"], #epostaForm input[name=eTur][value="${tur}"]`).forEach(r => { r.checked = true; });
}

function authCiz() {
  document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("cur", b.dataset.tab === sekme));
  if ($("authBaslik")) $("authBaslik").textContent = sekme === "reg" ? "AYVEX'e katıl" : "Tekrar hoş geldin";
  if ($("authAlt")) $("authAlt").textContent = sekme === "reg"
    ? "Hesabını oluştur, sana uygun modu seç."
    : "Hesabına giriş yap ve kaldığın yerden devam et.";
  if ($("regOnly")) $("regOnly").hidden = sekme !== "reg";
  if ($("authBtn")) $("authBtn").textContent = sekme === "reg" ? "Hesap oluştur" : "Giriş yap";
  if ($("aPass")) $("aPass").autocomplete = sekme === "reg" ? "new-password" : "current-password";
  // E-posta formu: kayıtta ad, şifre tekrarı, şifre gücü ve mod seçimi; girişte "Şifremi unuttum"
  document.querySelectorAll("#epostaForm .kayit-alan").forEach(el => { el.hidden = sekme !== "reg"; });
  document.querySelectorAll("#epostaForm .giris-alan").forEach(el => { el.hidden = sekme === "reg"; });
  if ($("epostaBtn")) $("epostaBtn").textContent = sekme === "reg" ? "Hesap oluştur" : "Giriş yap";
  if ($("eSifre")) {
    $("eSifre").autocomplete = sekme === "reg" ? "new-password" : "current-password";
    $("eSifre").placeholder = sekme === "reg" ? "Şifre (en az 8 karakter, büyük/küçük harf ve rakam)" : "Şifre";
    if (sekme === "reg") sifreGucCiz($("sifreGuc"), $("eSifre").value);
  }
  // Bulut hesaplarının önbellek kopyaları listede gösterilmez; onlar Google ile açılır
  const ids = Object.keys(db.users).filter(id => !bulutHesabiMi(id));
  if ($("yerelGiris")) $("yerelGiris").hidden = !YEREL_GIRIS_AKTIF;
  if ($("accList")) {
    $("accList").innerHTML = ids.length
      ? `<p class="lbl">Bu cihazdaki hesaplar</p><div class="acc">` +
        ids.map(id => `<button type="button" data-acc="${esc(id)}">${db.users[id].tur === "work" ? "İş" : "Öğrenci"} · ${esc(db.users[id].ad)}</button>`).join("") + `</div>`
      : "";
  }
}
if ($("authForm")) {
  $("authForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!YEREL_GIRIS_AKTIF) return;
    const ad = $("aUser").value.trim();
    const id = ad.toLowerCase();
    const sifre = $("aPass").value;
    const msg = t => ($("authMsg").textContent = t);
    if (!ad || sifre.length < 4) return msg("Kullanıcı adını yaz, şifre en az 4 karakter olsun.");
    if (ad.includes(":")) return msg("Kullanıcı adında \":\" karakteri kullanılamaz.");
    if (sekme === "reg") {
      if (db.users[id]) return msg("Bu kullanıcı adı zaten var.");
      const turEl = document.querySelector("#authForm input[name=tur]:checked");
      const tur = turEl && MODLAR[turEl.value] ? turEl.value : "student";
      const tuz = uid() + uid();
      db.users[id] = { ad, tur, tuz, hash: await hashle(sifre, tuz), data: yeniVeri(tur, ad) };
    } else {
      const h = db.users[id];
      if (!h || h.hash !== await hashle(sifre, h.tuz)) return msg("Kullanıcı adı veya şifre yanlış.");
    }
    db.aktif = id; dbYaz(); msg(""); $("aPass").value = ""; basla();
  });
}

function basla() {
  document.body.setAttribute("data-logged-in", "true");
  const h = db.users[db.aktif];
  if (!h) { db.aktif = null; dbYaz(); if ($("auth")) $("auth").hidden = false; document.body.removeAttribute("data-logged-in"); return; }
  h.data = veriOnar(h.data, h.tur, h.ad);
  if (!gecerli(h.data)) h.data = yeniVeri(h.tur, h.ad);
  S = h.data;

  pomo.mod = "focus";
  pomo.toplam = pomoSure("focus");
  pomo.kalan = pomo.toplam;
  pomo.tur = 0;
  pomo.calisiyor = false;
  if (pomo.interval) clearInterval(pomo.interval);
  pomo.interval = null;

  sel = todayKey;
  view = { y: now.getFullYear(), m: now.getMonth() };
  q = "";
  if ($("q")) $("q").value = "";
  if ($("auth")) $("auth").hidden = true;
  modUygula();
  goView("home");
  ciz();
  otomatikBildirimler();
  bildirimRozetiGuncelle();
}

async function cikis(mesaj) {
  const bulutId = bulutHesabiMi(db.aktif) ? db.aktif : null;
  if (bulutId && S) {
    // Önce bekleyen değişiklikleri buluta gönder; oturum kapandıktan sonra gönderilemezler
    dbYaz();
    bulutKaydetHemen();
    if (bulutHazir() && !mesaj) {
      const gitti = await window.AYVEX_BULUT.bekleyenleriGonder();
      if (!gitti && !confirm("Bazı değişiklikler henüz buluta gönderilemedi (internet bağlantısı olmayabilir).\n\nYine de çıkılsın mı? Gönderilmemiş değişiklikler kaybolabilir.")) return;
    }
  }
  document.body.removeAttribute("data-logged-in");
  clearTimeout(kaydetZamani);
  clearTimeout(bulutZamani);
  if (pomo.interval) clearInterval(pomo.interval);
  S = null;
  if (bulutId) {
    // Bulut hesabının bu cihazdaki kopyasını sil (veriler bulutta duruyor)
    delete db.users[bulutId];
    try { if (bulutHazir()) await window.AYVEX_BULUT.cikisYap(); } catch (e) {}
  }
  db.aktif = null; dbYaz();
  if (mesaj) { try { sessionStorage.setItem("ayvex-giris-mesaji", mesaj); } catch (e) {} }
  location.reload();
}

async function bulutHesabiSil() {
  const id = db.aktif;
  if (!bulutHazir()) { alert("Bulut bağlantısı yok. İnternet bağlantını kontrol edip tekrar dene."); return; }
  try {
    clearTimeout(bulutZamani); bulutZamani = null;
    S = null;
    await window.AYVEX_BULUT.verimiSil(bulutUid(id));
    delete db.users[id];
    db.aktif = null; dbYaz();
    location.reload();
  } catch (e) {
    alert("Bulut verilerin silinemedi: " + (e.message || e));
    location.reload();
  }
}

// Favicon: logo dosyasındaki işareti (A + takvim) kare olarak kırpıp sekme simgesi yap
(function faviconUret() {
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      c.getContext("2d").drawImage(img, 512, 165, 500, 500, 0, 0, 64, 64);
      const link = $("favicon");
      if (link) { link.type = "image/png"; link.href = c.toDataURL("image/png"); }
    } catch (e) {}
  };
  img.src = "assets/ayvex-logo.webp";
})();

try {
  girisModu("student");
  authCiz();
  // Google'dan yönlendirmeyle dönüldüyse giriş tamamlanana kadar düğmede "Giriş yapılıyor…" göster
  try { if (sessionStorage.getItem("ayvex-giris-yonlendirme") === "1") googleBekliyor(true); } catch (e) {}
  try {
    const m = sessionStorage.getItem("ayvex-giris-mesaji");
    if (m) { girisMesaji(m); sessionStorage.removeItem("ayvex-giris-mesaji"); }
  } catch (e) {}
  // Yerel giriş kapalıyken açık kalmış bir yerel oturumu kapat
  if (!YEREL_GIRIS_AKTIF && db.aktif && !bulutHesabiMi(db.aktif)) {
    db.aktif = null;
    dbYaz();
    girisMesaji("Yerel hesaplarla giriş güvenlik nedeniyle geçici olarak kapatıldı. Lütfen Google ile devam et; verilerin silinmedi.");
  }
  if (PAYLASIM_ID) {
    paylasimSayfasiAc(PAYLASIM_ID);
  } else if (db.aktif && db.users[db.aktif]) {
    basla();
  } else {
    if ($("auth")) $("auth").hidden = false;
    document.body.removeAttribute("data-logged-in");
  }
  console.log("[AYVEX] başlatıldı");
} catch (err) {
  console.error("[AYVEX] başlatma hatası:", err);
}
