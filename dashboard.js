console.log("[Planla] v18 + akademik güncelleme");

const MODLAR = {
  student: { rol: "Üniversite Öğrencisi", ac: "Akademik", acSub: "Dersler  Sınavlar", caSub: "Stajlar  İşler", acBaslik: "Akademik Genel Bakış",
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
