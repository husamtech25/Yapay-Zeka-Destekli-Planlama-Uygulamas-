console.log("[Planla] v19 + YKS düzenleme");

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
const saatDk = s => { const [h, m] = (s || "00:00").split(":"); return +h * 60 + +m; };

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
    pomo: { ...POMO_DEFAULTS, stats: {}, bind: null },
  };
}
const DB_KEY = "planla-v3";
const DIZI = ["courses", "deadlines", "jobs", "skills", "tasks", "links", "notes", "notifications", "dersler", "hedefler", "planItems", "toplantilar", "sinavlar", "odevler", "yksDenemeleri"];
const gecerli = v => v && MODLAR[v.mode] && typeof v.name === "string" && v.events && typeof v.events === "object" && DIZI.every(k => Array.isArray(v[k]));
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
}
addEventListener("pagehide", () => { if (S) dbYaz(); });

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
const M = () => MODLAR[S.mode] || MODLAR.student;
const eslesir = s => String(s).toLowerCase().includes(q);

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
  if (list === "events") {
    for (const d in S.events) S.events[d] = S.events[d].filter(e => e.id !== id);
  } else {
    S[list] = S[list].filter(e => e.id !== id);
  }
}
const delBtn = (list, id) =>
  `<button type="button" class="x" data-act="del" data-list="${list}" data-id="${id}" aria-label="Sil"><svg width="14" height="14"><use href="#i-x"/></svg></button>`;
const ad = (list, id, field, text) =>
  `<span data-rename data-list="${list}" data-id="${id}" data-field="${field}" title="Çift tıkla: düzenle">${esc(text)}</span>`;
const gunEvents = k => (S.events[k] || []).slice().sort((a, b) => a.time.localeCompare(b.time));

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
  aktifView = v;
  document.querySelectorAll(".view").forEach(el => el.classList.toggle("on", el.id === "v-" + v));
  document.querySelectorAll(".side-nav [data-view]").forEach(a => a.classList.toggle("active", a.dataset.view === v));
  document.querySelectorAll(".mobile-nav-item").forEach(a => a.classList.toggle("active", a.dataset.view === v));
  document.body.dataset.page = v;
  mobilMenuKapat();
  window.scrollTo({ top: 0 });
}

function modUygula() {
  const m = M();
  document.body.dataset.mode = S.mode || "student";
  $("userRole").textContent = m.rol;
  $("navAc").textContent = m.ac;
  $("acTitle").textContent = m.acBaslik;
  $("jobsTitle").textContent = m.jobs;
  $("helloSub").textContent = m.sub;
  document.querySelectorAll("select[name=type]").forEach(s => {
    s.innerHTML = m.tur.map(t => `<option>${t}</option>`).join("");
  });
  document.querySelectorAll(".menu-ogrenci").forEach(el => { el.hidden = S.mode !== "student"; });
  document.querySelectorAll(".menu-is").forEach(el => { el.hidden = S.mode !== "work"; });
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
  pa.innerHTML = avatarHTML(i);
  avatarRenkUygula(pa, i);
  pa.dataset.pending = i;
  $("profileName").textContent = S.name;
  $("profileRole").textContent = M().rol;
  $("profileNameInput").value = S.name;
  $("avatarGrid").innerHTML = AVATARLAR.map((a, idx) =>
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
  const saat = new Date().getHours();
  const bugunGorev = (S.tasks || []).filter(t => {
    if (!t.done || !t.zaman) return false;
    const z = new Date(t.zaman);
    return z.toDateString() === new Date().toDateString();
  }).length;
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
}

function otomatikBildirimler() {
  if (!S) return;
  [todayKey, yarinKey].forEach(gun => {
    const evler = S.events[gun] || [];
    evler.forEach(ev => {
      const zamanMetni = gun === todayKey ? "Bugün" : "Yarın";
      bildirimEkle(gun === todayKey ? "warn" : "info", `${zamanMetni}: ${ev.t}`, `${ev.time} · ${ev.type}`, "ev::" + ev.id + "::" + gun);
    });
  });
  const bugun = new Date();
  (S.deadlines || []).forEach(d => {
    const hedef = new Date(d.d);
    const fark = Math.ceil((hedef - bugun) / (1000 * 60 * 60 * 24));
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
  if (bell) bell.textContent = sayi;
  const bellBtn = $("bellBtn");
  if (bellBtn) bellBtn.classList.toggle("has-new", sayi > 0);
}

function panelAc() {
  const panel = $("notifPanel");
  if (!panel) return;
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
  if (!el) return;
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
      { view: "plan",  ikon: "#i-bar-chart",    label: "İş Planı" },
      { view: "cal",   ikon: "#i-calendar",     label: "Takvim" },
      { view: "tasks", ikon: "#i-check-circle", label: "Görevler" },
      { view: "ac",    ikon: "#i-briefcase",    label: "Projeler" },
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
function pomoHaftaToplam() {
  if (!S || !S.pomo || !S.pomo.stats) return 0;
  const bugun = new Date();
  const gunNo = bugun.getDay();
  const pazartesiFark = (gunNo === 0 ? -6 : 1 - gunNo);
  let toplam = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(bugun);
    d.setDate(bugun.getDate() + pazartesiFark + i);
    const k = key(d.getFullYear(), d.getMonth(), d.getDate());
    if (S.pomo.stats[k]) toplam += S.pomo.stats[k].sayi;
  }
  return toplam;
}
function pomoStatsGuncelle() {
  const b = pomoBugun(); const hafta = pomoHaftaToplam();
  if ($("pomoBugun")) $("pomoBugun").textContent = b.sayi;
  if ($("pomoBugunDk")) $("pomoBugunDk").textContent = b.dk;
  if ($("pomoHafta")) $("pomoHafta").textContent = hafta;
}
function pomoKaydet(tamamlananMod) {
  if (!S.pomo) S.pomo = { ...POMO_DEFAULTS, stats: {}, bind: null };
  if (!S.pomo.stats) S.pomo.stats = {};
  if (tamamlananMod === "focus") {
    const b = S.pomo.stats[todayKey] || { sayi: 0, dk: 0 };
    b.sayi += 1;
    b.dk += (+pomoAyarlari().focus || 25);
    S.pomo.stats[todayKey] = b;
    pomo.tur += 1;
    bildirimEkle("success", "Pomodoro tamamlandı 🍅", `Bir odak turu bitti. Toplam: ${b.sayi}`, "pomo-" + todayKey + "-" + b.sayi);
  }
  kaydet();
}
function cevresiHesapla(cevre, oran) { return cevre * (1 - oran); }
function pomoRender() {
  const card = $("pomodoroCard"); const timeEl = $("pomoTime");
  const labelEl = $("pomoModeLabel"); const ring = $("pomoRingFg");
  if (!card || !timeEl) return;
  card.classList.remove("mode-focus", "mode-short", "mode-long");
  card.classList.add("mode-" + pomo.mod);
  timeEl.textContent = `${pad(Math.floor(pomo.kalan / 60))}:${pad(pomo.kalan % 60)}`;
  if (labelEl) labelEl.textContent = pomoModEtiket(pomo.mod);
  if (ring) {
    const cevre = 2 * Math.PI * 88;
    ring.style.strokeDasharray = cevre;
    const oran = pomo.toplam > 0 ? (pomo.kalan / pomo.toplam) : 1;
    ring.style.strokeDashoffset = cevresiHesapla(cevre, oran);
  }
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
  pomoRender();
  pomo.interval = setInterval(() => {
    pomo.kalan -= 1;
    if (pomo.kalan <= 0) { pomoBitti(); return; }
    pomoRender();
  }, 1000);
}
function pomoDurdur() {
  pomo.calisiyor = false;
  if (pomo.interval) clearInterval(pomo.interval);
  pomo.interval = null;
  pomoRender();
}
function pomoSifirla() { pomoDurdur(); pomo.kalan = pomo.toplam; pomoRender(); }
function pomoSesCal() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
function pomoBitti() {
  if (pomo.interval) clearInterval(pomo.interval);
  pomo.interval = null;
  pomo.calisiyor = false;
  if (pomoAyarlari().sound === "on") pomoSesCal();
  if (pomo.mod === "focus") pomoKaydet("focus");
  const a = pomoAyarlari();
  if (pomo.mod === "focus") {
    const turSayi = +a.cycle || 4;
    if (pomo.tur > 0 && pomo.tur % turSayi === 0) pomoModDegistir("long");
    else pomoModDegistir("short");
  } else {
    pomoModDegistir("focus");
  }
  if (a.auto === "on") setTimeout(() => pomoBaslat(), 600);
  document.title = "Planla — Yapay Zeka Destekli Planlama";
}
function pomoBindRender() {
  const btn = document.querySelector(".pomo-bind-btn");
  if (!btn) return;
  const label = $("pomoBindLabel");
  if (!label) return;
  if (S.pomo && S.pomo.bind) {
    const { tip, id } = S.pomo.bind;
    let ad = "";
    if (tip === "gorev") { const t = bul("tasks", id); ad = t ? t.t : ""; }
    else if (tip === "ders") { const d = bul("dersler", id); ad = d ? d.ad : ""; }
    label.textContent = ad || "Seçili";
    btn.classList.add("active");
  } else {
    label.textContent = "Görev/Ders seç";
    btn.classList.remove("active");
  }
}
function pomoBindAc() {
  const list = $("pomoBindList");
  if (!list) return;
  const aktifTab = document.querySelector(".pomo-bind-tab.on");
  const tip = aktifTab ? aktifTab.dataset.bindTab : "gorev";
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
function bugunDersler() { return (S.dersler || []).filter(d => +d.gun === bugunGunNo).sort(dersSirala); }
const SAATLER = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function haftalikGridCiz() {
  const grid = $("haftalikGrid");
  if (!grid) return;
  const empty = $("dersEmpty");
  const dersler = S.dersler || [];
  if ($("statDersSayi")) $("statDersSayi").textContent = dersler.length;
  if ($("statDersBugun")) $("statDersBugun").textContent = bugunDersler().length;
  if ($("statDersHafta")) $("statDersHafta").textContent = dersler.filter(d => +d.gun >= 1 && +d.gun <= 5).length;
  if (!dersler.length) {
    grid.innerHTML = "";
    grid.style.gridTemplateRows = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  const gunSirasi = [1, 2, 3, 4, 5, 6, 0];
  grid.style.gridTemplateRows = `40px repeat(${SAATLER.length}, 60px)`;
  let html = "";
  html += `<div class="hg-bos" style="grid-row:1;grid-column:1"></div>`;
  gunSirasi.forEach((g, idx) => {
    const bugun = g === bugunGunNo;
    const col = idx + 2;
    html += `<div class="hg-gun-head ${bugun ? "bugun" : ""}" style="grid-row:1;grid-column:${col}">${GUNLER[g].slice(0, 3)}</div>`;
  });
  SAATLER.forEach((saat, satirIdx) => {
    const row = satirIdx + 2;
    html += `<div class="hg-saat" style="grid-row:${row};grid-column:1">${pad(saat)}:00</div>`;
    gunSirasi.forEach((gunNo, gunIdx) => {
      const col = gunIdx + 2;
      html += `<div class="hg-hucre" style="grid-row:${row};grid-column:${col}"></div>`;
    });
  });
  dersler.forEach(d => {
    const basSaat = +d.bas.split(":")[0];
    const bitSaat = +d.bit.split(":")[0];
    const bitDk = +d.bit.split(":")[1] || 0;
    const basIdx = SAATLER.indexOf(basSaat);
    if (basIdx < 0) return;
    const bitSaatEtkin = bitDk > 0 ? bitSaat + 1 : bitSaat;
    const sure = Math.max(1, bitSaatEtkin - basSaat);
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
  if (!el) return;
  const gunSirasi = [1, 2, 3, 4, 5];
  const miniSaatler = [9, 11, 13, 15, 17];
  el.style.gridTemplateColumns = "repeat(5, minmax(0, 1fr))";
  el.style.gridAutoRows = "32px";
  let html = "";
  gunSirasi.forEach(g => {
    const bugun = g === bugunGunNo;
    html += `<div class="mdg-head ${bugun ? "bugun" : ""}">${GUNLER_KISA[g]}</div>`;
  });
  miniSaatler.forEach(saat => {
    gunSirasi.forEach(gunNo => {
      const ders = (S.dersler || []).find(d => +d.gun === gunNo && +d.bas.split(":")[0] === saat);
      if (ders) {
        html += `<div class="mdg-ders ${ders.renk || "teal"}" data-act="ders-edit" data-id="${ders.id}" title="${esc(ders.ad)}">${esc(ders.ad.slice(0, 8))}</div>`;
      } else {
        html += `<div class="mdg-cell"></div>`;
      }
    });
  });
  el.innerHTML = html;
}

// ================= AKADEMİK (YENİ) =================

function sinavRenkSinif(tarih) {
  const bugun = new Date();
  bugun.setHours(0,0,0,0);
  const hedef = new Date(tarih);
  hedef.setHours(0,0,0,0);
  const fark = Math.round((hedef - bugun) / (1000 * 60 * 60 * 24));
  if (fark < 0) return "sinav-uzak";
  if (fark <= 3) return "sinav-acil";
  if (fark <= 7) return "sinav-yakin";
  return "sinav-uzak";
}
function sinavGeriSayim(tarih) {
  const bugun = new Date();
  bugun.setHours(0,0,0,0);
  const hedef = new Date(tarih);
  hedef.setHours(0,0,0,0);
  const fark = Math.round((hedef - bugun) / (1000 * 60 * 60 * 24));
  if (fark < 0) return "Geçti";
  if (fark === 0) return "Bugün!";
  if (fark === 1) return "Yarın";
  return `${fark} gün kaldı`;
}

function sinavlarCiz() {
  const el = $("sinavList");
  if (!el) return;
  const simdi = new Date();
  simdi.setHours(0,0,0,0);
  const sinavlar = (S.sinavlar || [])
    .filter(s => new Date(s.tarih) >= simdi)
    .sort((a, b) => a.tarih.localeCompare(b.tarih));
  if (!sinavlar.length) {
    el.innerHTML = `<li class="sinav-empty">Yaklaşan sınav yok. + butonuyla ekle.</li>`;
    return;
  }
  el.innerHTML = sinavlar.slice(0, 6).map(s => {
    const [, m, d] = s.tarih.split("-");
    const ayKisa = aylar[+m - 1].slice(0, 3);
    const renkSinif = sinavRenkSinif(s.tarih);
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
  if (!el) return;
  const simdi = new Date();
  simdi.setHours(0,0,0,0);
  const odevler = (S.odevler || [])
    .slice()
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.tarih.localeCompare(b.tarih);
    });
  if (!odevler.length) {
    el.innerHTML = `<li class="odev-empty">Henüz ödev yok. + butonuyla ekle.</li>`;
    return;
  }
  el.innerHTML = odevler.slice(0, 8).map(o => {
    const renkSinif = o.done ? "" : sinavRenkSinif(o.tarih);
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
  if (!el) return;
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

function yksListeCiz() {
  const el = $("yksListe");
  if (!el) return;
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
        <div class="yks-item-meta">${esc(d.alan || "")}</div>
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
  const liste = (S.yksDenemeleri || []).slice().sort((a, b) => b.tarih.localeCompare(a.tarih));
  const son = liste[0];
  const tytEl = $("yksTytNet");
  const aytEl = $("yksAytNet");
  const tytTarihEl = $("yksTytTarih");
  const aytTarihEl = $("yksAytTarih");
  if (tytEl) tytEl.textContent = son && son.tyt ? son.tyt + " net" : "—";
  if (aytEl) aytEl.textContent = son && son.ayt ? son.ayt + " net" : "—";
  if (tytTarihEl) tytTarihEl.textContent = son && son.tyt ? gunEtiket(son.tarih) : "Henüz deneme yok";
  if (aytTarihEl) aytTarihEl.textContent = son && son.ayt ? gunEtiket(son.tarih) : "Henüz deneme yok";
}

function acOzetCiz() {
  const courses = S.courses || [];
  const ort = courses.length ? courses.reduce((t, c) => t + c.g, 0) / courses.length : 0;
  const ortEl = $("acOrtalama");
  const ortSubEl = $("acOrtalamaSub");
  if (ortEl) ortEl.textContent = courses.length ? ort.toFixed(1) : "—";
  if (ortSubEl) ortSubEl.textContent = courses.length ? `${courses.length} ders üzerinden` : "Henüz not girilmedi";

  if ($("acDersSayi")) $("acDersSayi").textContent = courses.length;
  const simdi = new Date();
  simdi.setHours(0,0,0,0);
  if ($("acSınavSayi")) {
    $("acSınavSayi").textContent = (S.sinavlar || []).filter(s => new Date(s.tarih) >= simdi).length;
  }
  if ($("acOdevSayi")) {
    $("acOdevSayi").textContent = (S.odevler || []).filter(o => !o.done).length;
  }
}
// ================= İŞ PLANI =================
function planKategoriEtiket(k) {
  return k === "toplanti" ? "Toplantı" : k === "gorev" ? "Görev" : k === "odak" ? "Odak" : k === "mola" ? "Mola" : "Diğer";
}
function planItemSirala(a, b) { return (+a.gun) - (+b.gun) || saatDk(a.saat) - saatDk(b.saat); }

function planHaftalikCiz() {
  const el = $("haftalikPlanList");
  if (!el) return;
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
    const offset = (gunNo === 0 ? 7 - bugunDt.getDay() : gunNo - bugunDt.getDay());
    const tarih = new Date(bugunDt);
    tarih.setDate(bugunDt.getDate() + offset);
    const tarihMetni = `${tarih.getDate()} ${aylar[tarih.getMonth()]}`;
    html += `<div class="plan-gun">
      <div class="plan-gun-head">
        <span class="plan-gun-title">${GUNLER[gunNo]}</span>
        <span class="plan-gun-tarih">${tarihMetni}</span>
      </div>
      <ul class="plan-gun-items">` +
      gunItems.map(it => `
        <li class="plan-item ${it.kategori || "gorev"}">
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
  const bugunDt = new Date();
  const gunNo = bugunDt.getDay();
  const pazartesiFark = (gunNo === 0 ? -6 : 1 - gunNo);
  let haftaGorev = 0, ayGorev = 0;
  const gunSayilari = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

  (S.tasks || []).forEach(t => {
    if (!t.done || !t.zaman) return;
    const tz = new Date(t.zaman);
    for (let i = 0; i < 7; i++) {
      const d = new Date(bugunDt);
      d.setDate(bugunDt.getDate() + pazartesiFark + i);
      if (tz.toDateString() === d.toDateString()) {
        haftaGorev++;
        gunSayilari[d.getDay()]++;
      }
    }
    if (tz.getMonth() === bugunDt.getMonth() && tz.getFullYear() === bugunDt.getFullYear()) ayGorev++;
  });

  if ($("perfHaftaGorev")) $("perfHaftaGorev").textContent = haftaGorev;
  if ($("perfHaftaSaat")) $("perfHaftaSaat").textContent = Math.round(pomoHaftaToplam() * (+(pomoAyarlari().focus || 25)) / 60);
  if ($("perfAyGorev")) $("perfAyGorev").textContent = ayGorev;
  if ($("perfProje")) $("perfProje").textContent = (S.courses || []).length;

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
  if (!yakEl || !gecEl) return;
  const now2 = new Date();
  const toplantilar = S.toplantilar || [];
  const yaklasan = []; const gecmis = [];
  toplantilar.forEach(t => {
    const dt = new Date(t.tarih + "T" + (t.saat || "00:00"));
    if (dt >= now2) yaklasan.push({ ...t, _dt: dt });
    else gecmis.push({ ...t, _dt: dt });
  });
  yaklasan.sort((a, b) => a._dt - b._dt);
  gecmis.sort((a, b) => b._dt - a._dt);
  const renderItem = t => {
    const [, m, d] = t.tarih.split("-");
    const gun = +d;
    const ay = aylar[+m - 1].slice(0, 3);
    return `<li class="toplanti-item">
      <div class="toplanti-tarih">
        <span class="tt-gun">${gun} ${ay}</span>
        <span class="tt-saat">${esc(t.saat)}</span>
      </div>
      <div class="toplanti-body">
        <div class="tb-baslik">${esc(t.baslik)}</div>
        <div class="tb-meta">
          ${t.sure ? `<span><svg width="11" height="11"><use href="#i-clock"/></svg> ${t.sure} dk</span>` : ""}
          ${t.katilimcilar ? `<span><svg width="11" height="11"><use href="#i-users"/></svg> ${esc(t.katilimcilar)}</span>` : ""}
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
  if (s === "haftalik") planHaftalikCiz();
  if (s === "performans") planPerformansCiz();
  if (s === "toplantilar") planToplantilarCiz();
}

function miniPlanCiz() {
  const el = $("miniPlanList");
  if (!el) return;
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

// ================= GÖREVLER =================
function gorevOncelik(p) { return ONCELIK[p] ? p : "mid"; }

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
  let gosterilecek = tum.slice().filter(t => !q || eslesir(t.t));
  if (filtre === "pending") gosterilecek = gosterilecek.filter(t => !t.done);
  else if (filtre === "done") gosterilecek = gosterilecek.filter(t => t.done);
  const priSirala = { high: 0, mid: 1, low: 2 };
  gosterilecek.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (priSirala[gorevOncelik(a.p)] || 1) - (priSirala[gorevOncelik(b.p)] || 1);
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
        <input type="checkbox" ${t.done ? "checked" : ""} data-act="task-toggle" data-id="${t.id}" aria-label="Tamamla">
        <div class="task-body">
          <div class="task-text" data-rename data-list="tasks" data-id="${t.id}" data-field="t" title="Çift tıkla: düzenle">${esc(t.t)}</div>
          <div class="task-meta">
            <span class="task-pri-badge pri-${p}"><svg width="10" height="10"><use href="#i-flag"/></svg> ${ONCELIK[p]}</span>
            ${t.zaman ? `<span>${new Date(t.zaman).toLocaleDateString("tr-TR")}</span>` : ""}
          </div>
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
  if (!todoEl) return;
  const tum = S.tasks || [];
  const todo = tum.filter(t => !t.done && !t.doing);
  const doing = tum.filter(t => !t.done && t.doing);
  const done = tum.filter(t => t.done);
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
    return `<li class="kanban-item ${t.done ? "done" : ""}">
      <div class="ki-text">${esc(t.t)}</div>
      <div class="ki-meta">
        <span class="ki-pri pri-${p}">${ONCELIK[p]}</span>
        <span class="ki-actions">${aksiyonlar}</span>
      </div>
    </li>`;
  };
  todoEl.innerHTML = todo.length ? todo.slice(0, 5).map(t => renderItem(t, "todo")).join("") : `<li class="kanban-empty">Görev yok</li>`;
  doingEl.innerHTML = doing.length ? doing.slice(0, 5).map(t => renderItem(t, "doing")).join("") : `<li class="kanban-empty">Devam eden yok</li>`;
  doneEl.innerHTML = done.length ? done.slice(0, 5).map(t => renderItem(t, "done")).join("") : `<li class="kanban-empty">Tamamlanan yok</li>`;
}

function hedeflerCiz() {
  const el = $("hedefList");
  if (!el) return;
  const liste = S.hedefler || [];
  if (!liste.length) {
    el.innerHTML = `<li class="hedef-empty">Henüz hedef yok. + butonuyla ekle.</li>`;
    return;
  }
  el.innerHTML = liste.map(h => {
    const yuzde = Math.min(100, Math.round((h.mevcut / h.hedef) * 100));
    return `<li class="hedef-item" data-id="${h.id}">
      <div class="hedef-head">
        <span class="hedef-baslik">${esc(h.baslik)}</span>
        <span class="hedef-sayi">${h.mevcut}/${h.hedef} ${esc(h.birim || "")}</span>
      </div>
      <div class="hedef-bar"><span style="width:${yuzde}%"></span></div>
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
  if (!el) return;
  const bugunEtkinlik = (S.events[todayKey] || []).length;
  const bekleyenGorev = (S.tasks || []).filter(t => !t.done).length;
  const bugunDers = bugunDersler().length;
  const bugunPlan = (S.planItems || []).filter(p => +p.gun === bugunGunNo).length;
  const parcalar = [];
  if (S.mode === "student") {
    if (bugunDers) parcalar.push(`<div class="ws-item"><b>${bugunDers}</b> ders</div>`);
  } else {
    if (bugunPlan) parcalar.push(`<div class="ws-item"><b>${bugunPlan}</b> iş</div>`);
  }
  if (bugunEtkinlik) parcalar.push(`<div class="ws-item"><b>${bugunEtkinlik}</b> etkinlik</div>`);
  if (bekleyenGorev) parcalar.push(`<div class="ws-item"><b>${bekleyenGorev}</b> görev</div>`);
  el.innerHTML = parcalar.length ? parcalar.join("") : `<div class="ws-item">Bugün için plan yok 😌</div>`;
}

// ================= Çizim =================
function ciz() {
  if (!S) return;

  const k = karsilamaMetni();
  const ilkAd = S.name.split(" ")[0];
  if ($("hello")) $("hello").textContent = `${k.metin}, ${ilkAd}! ${k.emoji}`;
  if ($("uname")) $("uname").textContent = S.name;
  const bugun = new Date();
  if ($("welcomeDate")) $("welcomeDate").textContent = `${gunlerKisa[bugun.getDay()]}, ${bugun.getDate()} ${aylar[bugun.getMonth()]} ${bugun.getFullYear()}`;

  avatarUygula();
  ozetCiz();
  rozetCiz();

  if ($("calTitle")) $("calTitle").textContent = `${aylar[view.m]} ${view.y}`;
  const cal = $("calendar");
  if (cal) {
    cal.innerHTML = "";
    ["P","S","Ç","P","C","C","P"].forEach(g => cal.insertAdjacentHTML("beforeend", `<span class="dow">${g}</span>`));
    const bosluk = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
    const gunler = new Date(view.y, view.m + 1, 0).getDate();
    const onceki = new Date(view.y, view.m, 0).getDate();
    for (let i = bosluk - 1; i >= 0; i--) cal.insertAdjacentHTML("beforeend", `<span class="dim">${onceki - i}</span>`);
    for (let g = 1; g <= gunler; g++) {
      const kk = key(view.y, view.m, g);
      const cls = ["d", kk === todayKey && "today", kk === sel && "sel", (S.events[kk] || []).length && "has"].filter(Boolean).join(" ");
      cal.insertAdjacentHTML("beforeend", `<button type="button" class="${cls}" data-act="mini" data-date="${kk}">${g}</button>`);
    }
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
  kaydet();
}

// ================= Tıklama olayları =================
document.addEventListener("click", e => {
  const tab = e.target.closest("[data-tab]");
  if (tab) { sekme = tab.dataset.tab; $("authMsg").textContent = ""; return authCiz(); }
  const acc = e.target.closest("[data-acc]");
  if (acc) { sekme = "login"; $("aUser").value = db.users[acc.dataset.acc].ad; authCiz(); return $("aPass").focus(); }

  if (e.target.closest("[data-logout]")) { e.preventDefault(); return cikis(); }
  if (e.target.closest("[data-delacc]")) {
    if (confirm("Hesabın ve tüm verilerin kalıcı olarak silinecek. Devam edilsin mi?")) { delete db.users[db.aktif]; return cikis(); }
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
  if (e.target.closest("#pomoSkip")) { e.preventDefault(); pomoBitti(); return; }
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

  // Ödev Toggle
  if (e.target.closest("[data-act='odev-toggle']")) {
    const cb = e.target.closest("[data-act='odev-toggle']");
    const it = bul("odevler", cb.dataset.id);
    if (it) { it.done = cb.checked; odevlerCiz(); kaydet(); }
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
    if (t) { t.done = true; t.doing = false; kanbanCiz(); gorevlerCiz(); kaydet(); }
    return;
  }
  const undoBtn = e.target.closest("[data-act='task-undo']");
  if (undoBtn) {
    e.preventDefault();
    const t = bul("tasks", undoBtn.dataset.id);
    if (t) { t.done = false; t.doing = false; kanbanCiz(); gorevlerCiz(); kaydet(); }
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
      }
      if (opener.dataset.open === "dlgEvent") form.dataset.day = opener.dataset.day || "today";
      const selEl = form.querySelector("select[name=type]");
      if (selEl) selEl.innerHTML = M().tur.map(t => `<option>${t}</option>`).join("");
    }
    if (opener.dataset.open === "pomodoroAyarDlg") {
      const a = pomoAyarlari();
      form.querySelector("[name=focus]").value = a.focus;
      form.querySelector("[name=short]").value = a.short;
      form.querySelector("[name=long]").value = a.long;
      form.querySelector("[name=cycle]").value = a.cycle;
      form.querySelector("[name=sound]").value = a.sound;
      form.querySelector("[name=auto]").value = a.auto;
    }
    guvenliAc(dlg);
    return;
  }

  const dlgBtn = e.target.closest("[data-dlg]");
  if (dlgBtn) {
    e.preventDefault();
    if (dlgBtn.dataset.dlg === "settingsDlg" && S) {
      $("setName").value = S.name;
      $("setAcc").textContent = `${db.users[db.aktif].ad} · ${S.mode === "work" ? "İş" : "Öğrenci"}`;
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
       "task-start", "task-done", "task-undo", "hedef-plus", "hedef-minus", "yks-edit", "yks-del"].includes(b.dataset.act)) return;
  e.preventDefault();
  const { act, id, list } = b.dataset;
  if (act === "mini") {
    sel = b.dataset.date;
    const [y, m] = sel.split("-");
    view = { y: +y, m: +m - 1 };
    goView("cal");
  }
  if (act === "big") sel = b.dataset.date;
  if (act === "del") sil(list, id);
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
    q = e.target.value.toLowerCase();
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
if ($("setName")) $("setName").onchange = e => { if (e.target.value.trim()) { S.name = e.target.value.trim(); ciz(); } };
if ($("reset")) $("reset").onclick = () => {
  if (confirm("Bu hesabın tüm verileri silinecek. Devam edilsin mi?")) {
    db.users[db.aktif].data = S = yeniVeri(S.mode, S.name);
    $("settingsDlg").close();
    ciz();
  }
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
  const act = e.target.dataset ? e.target.dataset.act : null;
  const id = e.target.dataset ? e.target.dataset.id : null;
  if (!act) return;
  if (act === "grade") { const it = bul("courses", id); if (it) it.g = Math.min(100, Math.max(0, +e.target.value || 0)); }
  else if (act === "status") { const it = bul("jobs", id); if (it) it.st = e.target.value; }
  else if (act === "done") { const it = bul("tasks", id); if (it) it.done = e.target.checked; }
  else if (act === "task-toggle") {
    const it = bul("tasks", id);
    if (it) { it.done = e.target.checked; if (it.done) it.doing = false; gorevlerCiz(); kanbanCiz(); kaydet(); return; }
  }
  else if (act === "odev-toggle") {
    const it = bul("odevler", id);
    if (it) { it.done = e.target.checked; odevlerCiz(); kaydet(); return; }
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

function adDegistir(e) {
  const el = e.target.closest("[data-rename]");
  if (!el) return;
  const item = bul(el.dataset.list, el.dataset.id);
  if (!item) return;
  const yeni = prompt("Yeni metin:", item[el.dataset.field]);
  if (yeni && yeni.trim()) {
    item[el.dataset.field] = yeni.trim();
    ciz();
    if (el.dataset.list === "tasks") { gorevlerCiz(); kanbanCiz(); }
  }
}
document.addEventListener("dblclick", adDegistir);

const AUTOCLOSE = ["dlgEvent","dlgLink","dlgCourse","dlgDeadline","dlgJob","dlgSkill","dlgNote","dlgDers","dlgHedef","pomodoroAyarDlg","dlgPlanItem","dlgToplanti","dlgSinav","dlgOdev","dlgYks"];
document.addEventListener("submit", e => {
  e.preventDefault();
  if (!e.target.dataset || !e.target.dataset.form || !S) return;
  const f = e.target;
  const v = Object.fromEntries(new FormData(f));
  const id = v.id || uid();

  switch (f.dataset.form) {
    case "ev": {
      const k = (f.dataset.day === "today") ? todayKey : sel;
      (S.events[k] = S.events[k] || []).push({ id, t: v.t.trim(), time: v.time, type: v.type });
      break;
    }
    case "course": S.courses.push({ id, n: v.n.trim(), g: Math.min(100, Math.max(0, +v.g)) }); break;
    case "deadline": S.deadlines.push({ id, t: v.t.trim(), d: v.d }); break;
    case "job": S.jobs.push({ id, n: v.n.trim(), st: "" }); break;
    case "skill": S.skills.push({ id, n: v.n.trim(), p: 50 }); break;
    case "task":
    case "task-quick":
      S.tasks.push({ id, t: v.t.trim(), done: false, doing: false, p: v.p || "mid", zaman: new Date().toISOString() });
      break;
    case "note": S.notes.push({ id, title: v.title.trim(), text: v.text.trim(), color: v.color || "yellow" }); break;
    case "link": S.links.push({ id, n: v.n.trim(), u: /^https?:\/\//.test(v.u) ? v.u.trim() : "https://" + v.u.trim() }); break;
    case "ders": {
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
    case "hedef":
      S.hedefler.push({ id, baslik: v.baslik.trim(), hedef: Math.max(1, +v.hedef || 1), birim: (v.birim || "kez").trim(), mevcut: 0, zaman: new Date().toISOString() });
      break;
    case "plan-item":
      S.planItems.push({ id, baslik: v.baslik.trim(), gun: v.gun, saat: v.saat, kategori: v.kategori || "gorev", zaman: new Date().toISOString() });
      break;
    case "toplanti":
      S.toplantilar.push({ id, baslik: v.baslik.trim(), tarih: v.tarih, saat: v.saat, katilimcilar: (v.katilimcilar||"").trim(), sure: +(v.sure || 30), notlar: (v.notlar||"").trim(), zaman: new Date().toISOString() });
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
  f.reset();
  const parentDlg = f.closest("dialog");
  if (parentDlg && AUTOCLOSE.includes(parentDlg.id)) parentDlg.close();
  ciz();
});

document.addEventListener("click", e => { if (e.target.tagName === "DIALOG") e.target.close(); });

document.addEventListener("visibilitychange", () => {
  const d = new Date();
  if (!document.hidden && key(d.getFullYear(), d.getMonth(), d.getDate()) !== todayKey) location.reload();
});

// ================= Giriş / çıkış =================
function authCiz() {
  document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("cur", b.dataset.tab === sekme));
  if ($("regOnly")) $("regOnly").hidden = sekme !== "reg";
  if ($("authBtn")) $("authBtn").textContent = sekme === "reg" ? "Hesap oluştur" : "Giriş yap";
  if ($("aPass")) $("aPass").autocomplete = sekme === "reg" ? "new-password" : "current-password";
  const ids = Object.keys(db.users);
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
    const ad = $("aUser").value.trim();
    const id = ad.toLowerCase();
    const sifre = $("aPass").value;
    const msg = t => ($("authMsg").textContent = t);
    if (!ad || sifre.length < 4) return msg("Kullanıcı adını yaz, şifre en az 4 karakter olsun.");
    if (sekme === "reg") {
      if (db.users[id]) return msg("Bu kullanıcı adı zaten var.");
      const tur = document.querySelector("input[name=tur]:checked").value;
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
  if (!gecerli(h.data)) h.data = yeniVeri(h.tur, h.ad);
  if (typeof h.data.avatar !== "number") h.data.avatar = 0;
  if (!Array.isArray(h.data.notifications)) h.data.notifications = [];
  if (!h.data.taskFilter) h.data.taskFilter = "all";
  if (!Array.isArray(h.data.dersler)) h.data.dersler = [];
  if (!Array.isArray(h.data.hedefler)) h.data.hedefler = [];
  if (!Array.isArray(h.data.planItems)) h.data.planItems = [];
  if (!Array.isArray(h.data.toplantilar)) h.data.toplantilar = [];
  if (!Array.isArray(h.data.sinavlar)) h.data.sinavlar = [];
  if (!Array.isArray(h.data.odevler)) h.data.odevler = [];
  if (!Array.isArray(h.data.yksDenemeleri)) h.data.yksDenemeleri = [];
  if (!h.data.pomo) h.data.pomo = { ...POMO_DEFAULTS, stats: {}, bind: null };
  if (!h.data.pomo.stats) h.data.pomo.stats = {};
  (h.data.tasks || []).forEach(t => { if (typeof t.doing !== "boolean") t.doing = false; });
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

function cikis() {
  document.body.removeAttribute("data-logged-in");
  clearTimeout(kaydetZamani);
  db.aktif = null; dbYaz(); S = null;
  if (pomo.interval) clearInterval(pomo.interval);
  location.reload();
}

try {
  authCiz();
  if (db.aktif && db.users[db.aktif]) {
    basla();
  } else {
    if ($("auth")) $("auth").hidden = false;
    document.body.removeAttribute("data-logged-in");
  }
  console.log("[Planla] başlatıldı");
} catch (err) {
  console.error("[Planla] başlatma hatası:", err);
}
