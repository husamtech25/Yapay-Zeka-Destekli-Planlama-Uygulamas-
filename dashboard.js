console.log("[Planla] v6 + ders programı yüklendi");

// ================= Moda göre metinler =================
const MODLAR = {
  student: { rol: "Üniversite Öğrencisi", ac: "Akademik", acSub: "Dersler  Sınavlar", caSub: "Stajlar  İşler", acBaslik: "Akademik Genel Bakış",
    tur: ["Ders", "Etkinlik", "Ödev"], isim: "Ders adı", deger: "Not (0-100)", jobs: "Önerilen Stajlar", sub: "Akademik ve kariyer planlaman tek yerde." },
  work: { rol: "Çalışan", ac: "Projeler", acSub: "Projeler  Teslimler", caSub: "Hedefler  Fırsatlar", acBaslik: "Projelerim",
    tur: ["Toplantı", "Etkinlik", "Görev"], isim: "Proje adı", deger: "İlerleme (%)", jobs: "Fırsatlar & Başvurular", sub: "İşlerin, toplantıların ve hedeflerin tek yerde." },
};
const sinif = { Ders: "course", Toplantı: "course", Etkinlik: "event", Ödev: "hw", Görev: "hw" };
const ONCELIK = { low: "Düşük", mid: "Orta", high: "Yüksek" };
const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const RENKLER = ["blue", "green", "yellow", "purple", "red", "orange", "pink", "teal"];

// ================= Yardımcılar =================
const aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const gunlerKisa = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
const renkler = ["#2bb8a8","#f0b840","#7c5cf0","#ff6b5b","#2fbf7f","#1d5e72","#d97706","#e8585a"];
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const key = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const gunEtiket = k => { const [y, m, d] = k.split("-"); return `${+d} ${aylar[+m - 1]} ${y}`; };
// "HH:MM" → dakika (karşılaştırma için)
const saatDk = s => { const [h, m] = (s || "00:00").split(":"); return +h * 60 + +m; };

const now = new Date();
const todayKey = key(now.getFullYear(), now.getMonth(), now.getDate());
const yarin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
const yarinKey = key(yarin.getFullYear(), yarin.getMonth(), yarin.getDate());
const bugunGunNo = now.getDay(); // 0=Pazar, 1=Pazartesi...

// ================= Avatar tanımları =================
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

// ================= Veri =================
function yeniVeri(mod, name) {
  return {
    mode: mod,
    name: name || (mod === "work" ? "Kullanıcı" : "Öğrenci"),
    avatar: 0,
    events: {}, courses: [], deadlines: [], jobs: [], skills: [], tasks: [], notes: [], links: [],
    notifications: [],
    taskFilter: "all",
    dersler: [], // YENİ: ders programı
  };
}
const DB_KEY = "planla-v3";
const DIZI = ["courses", "deadlines", "jobs", "skills", "tasks", "links", "notes", "notifications", "dersler"];
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

// ================= Görünüm / mod =================
function goView(v) {
  document.querySelectorAll(".view").forEach(el => el.classList.toggle("on", el.id === "v-" + v));
  document.querySelectorAll(".side-nav [data-view]").forEach(a => a.classList.toggle("active", a.dataset.view === v));
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
}

// ================= Avatar işlemleri =================
function avatarUygula() {
  const el = $("avatar");
  if (!el || !S) return;
  const i = (typeof S.avatar === "number") ? S.avatar : 0;
  el.innerHTML = avatarHTML(i);
  avatarRenkUygula(el, i);
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
      bildirimEkle(
        gun === todayKey ? "warn" : "info",
        `${zamanMetni}: ${ev.t}`,
        `${ev.time} · ${ev.type}`,
        "ev::" + ev.id + "::" + gun
      );
    });
  });

  const bugun = new Date();
  (S.deadlines || []).forEach(d => {
    const hedef = new Date(d.d);
    const fark = Math.ceil((hedef - bugun) / (1000 * 60 * 60 * 24));
    if (fark >= 0 && fark <= 3) {
      bildirimEkle(
        fark === 0 ? "warn" : "info",
        `Teslim: ${d.t}`,
        fark === 0 ? "Bugün teslim!" : `${fark} gün kaldı (${gunEtiket(d.d)})`,
        "dl::" + d.id + "::" + fark
      );
    }
  });

  const bekleyenSayisi = (S.jobs || []).filter(j => j.st === "Beklemede").length;
  if (bekleyenSayisi > 0) {
    bildirimEkle("purple", "Başvurular", `${bekleyenSayisi} başvurun hâlâ beklemede`, "jobs-beklemede-" + todayKey);
  }

  // Bugünün dersleri için bildirim
  const bugunDers = (S.dersler || []).filter(d => +d.gun === bugunGunNo);
  if (bugunDers.length > 0) {
    bildirimEkle("info", "Bugünkü dersler", `Bugün ${bugunDers.length} dersin var`, "ders-bugun-" + todayKey);
  }
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

// ================= Çizim: günlük liste =================
function gunListesi(el, k) {
  const l = gunEvents(k).filter(e => eslesir(e.t));
  el.innerHTML = l.length
    ? l.map(e =>
        `<li><span>${esc(e.time)}</span><div class="ev ${sinif[e.type] || "event"}">${ad("events", e.id, "t", e.t)}${delBtn("events", e.id)}<small>${esc(e.type)}</small></div></li>`
      ).join("")
    : `<li class="empty">Kayıt yok. + butonuyla ekleyebilirsin.</li>`;
}

// ================= Ders Programı =================
function dersOncelikSirala(a, b) {
  // Saate göre sırala
  return saatDk(a.bas) - saatDk(b.bas);
}

function bugunDersler() {
  return (S.dersler || [])
    .filter(d => +d.gun === bugunGunNo)
    .sort(dersOncelikSirala);
}

function bugunDersleriCiz() {
  const el = $("dersBugunList");
  if (!el) return;
  const liste = bugunDersler();
  if (!liste.length) {
    el.innerHTML = `<li class="ders-bugun-empty">Bugün dersin yok 🎉</li>`;
    return;
  }
  el.innerHTML = liste.map(d =>
    `<li class="ders-bugun-item ${d.renk || "teal"}" data-act="ders-edit" data-id="${d.id}">
      <div class="db-saat">
        ${esc(d.bas)} - ${esc(d.bit)}
        <small>${esc((+d.bit - +d.bas) || "")} saat</small>
      </div>
      <div class="db-body">
        <div class="db-ad">${esc(d.ad)}</div>
        <div class="db-meta">
          ${d.kod ? `<span>${esc(d.kod)}</span>` : ""}
          ${d.hoca ? `<span><svg width="11" height="11"><use href="#i-user"/></svg> ${esc(d.hoca)}</span>` : ""}
          ${d.sinif ? `<span><svg width="11" height="11"><use href="#i-map-pin"/></svg> ${esc(d.sinif)}</span>` : ""}
        </div>
      </div>
      <button type="button" class="x" data-act="del" data-list="dersler" data-id="${d.id}" aria-label="Sil" onclick="event.stopPropagation()">
        <svg width="14" height="14"><use href="#i-x"/></svg>
      </button>
    </li>`
  ).join("");
}

// Haftalık grid
const SAATLER = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; // 08:00 - 20:00

function haftalikGridCiz() {
  const grid = $("haftalikGrid");
  const empty = $("dersEmpty");
  if (!grid) return;

  const dersler = S.dersler || [];

  // İstatistikler
  $("statDersSayi").textContent = dersler.length;
  $("statDersBugun").textContent = bugunDersler().length;
  $("statDersHafta").textContent = dersler.filter(d => +d.gun >= 1 && +d.gun <= 5).length;

  if (!dersler.length) {
    grid.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  // 7 gün x N saat grid
  // Sütun 1 = saat, sütun 2-8 = Pzt..Paz
  const gunSirasi = [1, 2, 3, 4, 5, 6, 0]; // Pzt başlangıç

  let html = "";

  // Başlık satırı
  html += `<div class="hg-bos"></div>`;
  gunSirasi.forEach(g => {
    const bugun = g === bugunGunNo;
    html += `<div class="hg-gun-head ${bugun ? "bugun" : ""}">${GUNLER[g].slice(0, 3)}</div>`;
  });

  // Saat satırları
  SAATLER.forEach(saat => {
    html += `<div class="hg-saat">${pad(saat)}:00</div>`;
    gunSirasi.forEach(gunNo => {
      // Bu saatte bu günde ders var mı?
      const ders = dersler.find(d => +d.gun === gunNo && +d.bas.split(":")[0] === saat);
      if (ders) {
        // Kaç saat sürüyor?
        const sure = Math.max(1, Math.round((saatDk(ders.bit) - saatDk(ders.bas)) / 60));
        html += `<div class="hg-ders ${ders.renk || "teal"}" data-act="ders-edit" data-id="${ders.id}" style="grid-row:span ${sure}">
          <div class="hg-ders-ad">${esc(ders.ad)}</div>
          ${ders.kod ? `<div class="hg-ders-kod">${esc(ders.kod)}</div>` : ""}
          ${ders.sinif ? `<div class="hg-ders-yer"><svg width="10" height="10"><use href="#i-map-pin"/></svg> ${esc(ders.sinif)}</div>` : ""}
        </div>`;
      } else {
        // Bu saatte başka bir dersin devamı mı? (yani önceki saatte başlamış ve devam ediyor)
        const devam = dersler.find(d => {
          if (+d.gun !== gunNo) return false;
          const basSaat = +d.bas.split(":")[0];
          const bitSaat = +d.bit.split(":")[0];
          const bitDk = saatDk(d.bit);
          return basSaat < saat && saatDk(`${pad(saat)}:00`) < bitDk;
        });
        if (devam) {
          // Boş bırak (grid-row span zaten yukarıda hesaplandı)
          html += `<div class="hg-bos"></div>`;
        } else {
          html += `<div class="hg-hucre"></div>`;
        }
      }
    });
  });

  grid.innerHTML = html;
}
// ================= Görevler tam sayfa =================
function gorevOncelik(p) {
  return ONCELIK[p] ? p : "mid";
}

function gorevlerCiz() {
  if (!S) return;
  const liste = $("tasksListFull");
  const bos = $("tasksEmpty");
  if (!liste) return;

  const tum = S.tasks || [];
  const toplam = tum.length;
  const tamamlanan = tum.filter(t => t.done).length;
  const bekleyen = toplam - tamamlanan;

  $("statTotal").textContent = toplam;
  $("statPending").textContent = bekleyen;
  $("statDone").textContent = tamamlanan;

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
      bos.textContent = toplam === 0
        ? "Henüz görev yok. Yukarıdaki kutuya yazıp Enter'a bas."
        : "Bu filtreye uyan görev yok.";
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

// ================= Çizim: ana fonksiyon =================
function ciz() {
  if (!S) return;

  // Karşılama
  $("hello").textContent = `Hoş Geldin, ${S.name.split(" ")[0]}!`;
  $("uname").textContent = S.name;
  const bugun = new Date();
  $("welcomeDate").textContent = `${gunlerKisa[bugun.getDay()]}, ${bugun.getDate()} ${aylar[bugun.getMonth()]} ${bugun.getFullYear()}`;

  // Avatarı güncelle
  avatarUygula();

  // Mini takvim
  $("calTitle").textContent = `${aylar[view.m]} ${view.y}`;
  const cal = $("calendar");
  cal.innerHTML = "";
  ["P","S","Ç","P","C","C","P"].forEach(g =>
    cal.insertAdjacentHTML("beforeend", `<span class="dow">${g}</span>`)
  );
  const bosluk = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const gunler = new Date(view.y, view.m + 1, 0).getDate();
  const onceki = new Date(view.y, view.m, 0).getDate();
  for (let i = bosluk - 1; i >= 0; i--)
    cal.insertAdjacentHTML("beforeend", `<span class="dim">${onceki - i}</span>`);
  for (let g = 1; g <= gunler; g++) {
    const k = key(view.y, view.m, g);
    const cls = ["d",
      k === todayKey && "today",
      k === sel && "sel",
      (S.events[k] || []).length && "has"
    ].filter(Boolean).join(" ");
    cal.insertAdjacentHTML("beforeend",
      `<button type="button" class="${cls}" data-act="mini" data-date="${k}">${g}</button>`);
  }

  // Büyük takvim
  $("bigTitle").textContent = `${aylar[view.m]} ${view.y}`;
  let h = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"]
    .map(g => `<div class="dow">${g}</div>`).join("");
  for (let i = bosluk - 1; i >= 0; i--)
    h += `<div class="cell dim"><span class="n">${onceki - i}</span></div>`;
  for (let g = 1; g <= gunler; g++) {
    const k = key(view.y, view.m, g);
    const ev = gunEvents(k);
    h += `<button type="button" class="cell ${k === todayKey ? "today" : ""} ${k === sel ? "sel" : ""} ${ev.length ? "has" : ""}" data-act="big" data-date="${k}"><span class="n">${g}</span>` +
      ev.slice(0, 3).map(e =>
        `<span class="ce ${sinif[e.type] || "event"}">${esc(e.time)} ${esc(e.t)}</span>`
      ).join("") +
      (ev.length > 3 ? `<small>+${ev.length - 3} daha</small>` : "") +
      `</button>`;
  }
  for (let i = (bosluk + gunler) % 7; i && i < 7; i++)
    h += `<div class="cell dim"></div>`;
  $("bigGrid").innerHTML = h;

  // Günlük listeler
  $("dayTitle").textContent = gunEtiket(sel);
  gunListesi($("dayList"), sel);
  gunListesi($("timeline"), todayKey);

  // Akademik
  $("bars").innerHTML = S.courses.length
    ? S.courses.map((c, i) =>
        `<span title="${esc(c.n)}: ${c.g}" style="background:${renkler[i % renkler.length]};height:${Math.max(c.g, 3)}%"></span>`
      ).join("")
    : `<div class="bars-empty">Ekleyince grafik burada görünür.</div>`;
  const ort = S.courses.length
    ? S.courses.reduce((t, c) => t + c.g, 0) / S.courses.length
    : 0;
  $("gpa").textContent = !S.courses.length
    ? "Henüz kayıt yok"
    : S.mode === "work"
      ? `Ortalama ilerleme: %${ort.toFixed(0)}`
      : `Ortalama: ${ort.toFixed(0)} / 100  (GP: ${(ort / 25).toFixed(2)})`;
  $("courses").innerHTML = S.courses.map(c =>
    `<li>${ad("courses", c.id, "n", c.n)}<input type="number" min="0" max="100" value="${c.g}" data-act="grade" data-id="${c.id}">${delBtn("courses", c.id)}</li>`
  ).join("") || `<li class="empty">Henüz kayıt yok. + butonuyla ekleyebilirsin.</li>`;
  $("deadlines").innerHTML = [...S.deadlines].sort((a, b) => a.d.localeCompare(b.d)).map(d =>
    `<li>${ad("deadlines", d.id, "t", d.t)}<span>${gunEtiket(d.d)}</span>${delBtn("deadlines", d.id)}</li>`
  ).join("") || `<li class="empty">Teslim yok.</li>`;

  // Kariyer
  const durumlar = ["Beklemede", "Mülakat", "Kabul", "Red"];
  $("jobs").innerHTML = S.jobs.filter(j => eslesir(j.n)).map(j =>
    `<li>${ad("jobs", j.id, "n", j.n)}` +
    (j.st
      ? `<select data-act="status" data-id="${j.id}">${durumlar.map(s => `<option ${s === j.st ? "selected" : ""}>${s}</option>`).join("")}</select>`
      : `<button type="button" class="apply" data-act="apply" data-id="${j.id}">Başvur</button>`) +
    delBtn("jobs", j.id) + `</li>`
  ).join("") || `<li class="empty">Henüz kayıt yok. + butonuyla ekleyebilirsin.</li>`;
  $("skills").innerHTML = S.skills.map((s, i) =>
    `<li>${ad("skills", s.id, "n", s.n)}<input type="range" min="0" max="100" value="${s.p}" data-act="skill" data-id="${s.id}" style="accent-color:${renkler[(i + 4) % renkler.length]}"><span class="pct">%${s.p}</span>${delBtn("skills", s.id)}</li>`
  ).join("") || `<li class="empty">Henüz beceri yok.</li>`;

  // Yaklaşanlar
  const yakin = [];
  for (const d in S.events) {
    if (d >= todayKey) S.events[d].forEach(e => yakin.push({ ...e, d }));
  }
  yakin.sort((a, b) => (a.d + a.time).localeCompare(b.d + b.time));
  $("upcoming").innerHTML = yakin.slice(0, 4).map(e =>
    `<li><span><b>${esc(e.t)}</b></span><span>${gunEtiket(e.d)}, ${esc(e.time)}</span></li>`
  ).join("") || `<li class="empty">Yaklaşan kayıt yok.</li>`;
  $("applied").innerHTML = S.jobs.filter(j => j.st).map(j =>
    `<li><span><b>${esc(j.n)}</b></span><span class="badge">${j.st}</span></li>`
  ).join("") || `<li class="empty">Henüz başvuru yok.</li>`;

  // Bildirim rozeti
  bildirimRozetiGuncelle();

  // Notlar
  const notlar = (S.notes || []).filter(n => !q || eslesir(n.title) || eslesir(n.text));
  $("notes").innerHTML = notlar.length
    ? notlar.map(n =>
        `<div class="note ${n.color || "yellow"}">
          <div class="note-title">${esc(n.title)}</div>
          <div class="note-text">${esc(n.text)}</div>
          <button type="button" class="x" data-act="del" data-list="notes" data-id="${n.id}" aria-label="Sil">
            <svg width="14" height="14"><use href="#i-x"/></svg>
          </button>
        </div>`
      ).join("")
    : `<p class="notes-empty">Henüz not yok. + butonuyla ekleyebilirsin.</p>`;

  // Ana sayfadaki mini görev listesi
  $("homeTaskList").innerHTML = S.tasks.slice(0, 4).map(t =>
    `<li><input type="checkbox" data-act="done" data-id="${t.id}" ${t.done ? "checked" : ""}><span class="${t.done ? "done-t" : ""}" data-rename data-list="tasks" data-id="${t.id}" data-field="t">${esc(t.t)}</span></li>`
  ).join("") || `<li class="empty">Henüz görev yok.</li>`;

  // Görevler tam sayfa
  gorevlerCiz();

  // Ders programı
  bugunDersleriCiz();
  haftalikGridCiz();

  kaydet();
}
// ================= Tıklama olayları =================
document.addEventListener("click", e => {
  // Giriş sekmeleri
  const tab = e.target.closest("[data-tab]");
  if (tab) { sekme = tab.dataset.tab; $("authMsg").textContent = ""; return authCiz(); }
  const acc = e.target.closest("[data-acc]");
  if (acc) {
    sekme = "login";
    $("aUser").value = db.users[acc.dataset.acc].ad;
    authCiz();
    return $("aPass").focus();
  }

  if (e.target.closest("[data-logout]")) { e.preventDefault(); return cikis(); }
  if (e.target.closest("[data-delacc]")) {
    if (confirm("Hesabın ve tüm verilerin kalıcı olarak silinecek. Devam edilsin mi?")) {
      delete db.users[db.aktif];
      return cikis();
    }
    return;
  }

  // Bildirim paneli kapatma
  if (e.target.closest("#notifClose")) { panelKapat(); return; }

  // Bildirim paneli dışına tıklayınca kapat
  const panel = $("notifPanel");
  if (panel && panel.classList.contains("on")) {
    if (!e.target.closest("#notifPanel") && !e.target.closest("#bellBtn")) {
      panelKapat();
    }
  }

  // Bildirim panelini aç
  if (e.target.closest("#bellBtn")) {
    e.preventDefault();
    if (panel && panel.classList.contains("on")) panelKapat();
    else panelAc();
    return;
  }

  // Tümünü temizle
  if (e.target.closest("#notifClear")) {
    if (confirm("Tüm bildirimleri silmek istediğine emin misin?")) {
      S.notifications = [];
      bildirimCiz();
      bildirimRozetiGuncelle();
      kaydet();
    }
    return;
  }

  // Görev filtresi
  const filterBtn = e.target.closest(".filter-btn");
  if (filterBtn) {
    S.taskFilter = filterBtn.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("on", b === filterBtn));
    gorevlerCiz();
    kaydet();
    return;
  }

  // Tamamlananları temizle
  if (e.target.closest("#btnClearDone")) {
    const sayi = (S.tasks || []).filter(t => t.done).length;
    if (sayi === 0) { alert("Silinecek tamamlanmış görev yok."); return; }
    if (confirm(`${sayi} tamamlanmış görev silinecek. Emin misin?`)) {
      S.tasks = S.tasks.filter(t => !t.done);
      gorevlerCiz();
      kaydet();
    }
    return;
  }

  // Modal kapatma
  const closeBtn = e.target.closest("[data-dialog-close]");
  if (closeBtn) {
    const d = closeBtn.closest("dialog");
    if (d) d.close();
    return;
  }

  // Avatar seçimi
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

  // Ders düzenleme — önce bunu yakala, diğer data-act'ten önce
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
    guvenliAc($("dlgDers"));
    return;
  }

  // Modal açma (data-open)
  const opener = e.target.closest("[data-open]");
  if (opener) {
    e.preventDefault();
    const dlg = $(opener.dataset.open);
    if (!dlg) return;
    const form = dlg.querySelector("form");
    if (form) {
      form.reset();
      // Ders ekleme modalında ID'yi sıfırla, başlığı "Ders Ekle" yap
      if (opener.dataset.open === "dlgDers") {
        form.querySelector("[name=id]").value = "";
        $("dlgDersTitle").textContent = "Ders Ekle";
      }
      if (opener.dataset.open === "dlgEvent") form.dataset.day = opener.dataset.day || "today";
      const selEl = form.querySelector("select[name=type]");
      if (selEl) selEl.innerHTML = M().tur.map(t => `<option>${t}</option>`).join("");
    }
    guvenliAc(dlg);
    return;
  }

  // Sidebar data-dlg (sadece settingsDlg kaldı)
  const dlgBtn = e.target.closest("[data-dlg]");
  if (dlgBtn) {
    e.preventDefault();
    if (dlgBtn.dataset.dlg === "settingsDlg" && S) {
      $("setName").value = S.name;
      $("setAcc").textContent = `${db.users[db.aktif].ad} · ${S.mode === "work" ? "İş" : "Öğrenci"}`;
    }
    return guvenliAc($(dlgBtn.dataset.dlg));
  }

  // Görünüm değiştir (sidebar + butonlar)
  const nav = e.target.closest("[data-view]");
  if (nav) {
    e.preventDefault();
    if (nav.hasAttribute("data-today")) {
      sel = todayKey;
      view = { y: now.getFullYear(), m: now.getMonth() };
    }
    goView(nav.dataset.view);
    return ciz();
  }

  // Satır içi aksiyonlar
  const b = e.target.closest("[data-act]");
  if (!b) return;
  if (["done", "grade", "status", "skill", "task-toggle", "ders-edit"].includes(b.dataset.act)) return;
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
$("prev").onclick = $("bPrev").onclick = () => ayGit(-1);
$("next").onclick = $("bNext").onclick = () => ayGit(1);
$("bToday").onclick = () => {
  sel = todayKey;
  view = { y: now.getFullYear(), m: now.getMonth() };
  ciz();
};
$("closeSettings").onclick = () => $("settingsDlg").close();

// ================= Arama =================
let aramaZamani;
$("q").oninput = e => {
  q = e.target.value.toLowerCase();
  clearTimeout(aramaZamani);
  aramaZamani = setTimeout(ciz, 150);
};

// ================= Mini takvim katla/aç =================
$("miniCalToggle").onclick = () => {
  const mc = $("miniCal");
  const collapsed = mc.dataset.collapsed === "true";
  mc.dataset.collapsed = collapsed ? "false" : "true";
  $("miniCalToggle").setAttribute("aria-expanded", String(collapsed));
};

// ================= Ayarlar =================
$("setName").onchange = e => {
  if (e.target.value.trim()) { S.name = e.target.value.trim(); ciz(); }
};
$("reset").onclick = () => {
  if (confirm("Bu hesabın tüm verileri silinecek. Devam edilsin mi?")) {
    db.users[db.aktif].data = S = yeniVeri(S.mode, S.name);
    $("settingsDlg").close();
    ciz();
  }
};

// ================= Profil modalı =================
$("userBox").onclick = () => acProfil();

$("profileSave").onclick = () => {
  if (!S) return;
  const yeniIsim = $("profileNameInput").value.trim();
  if (yeniIsim) S.name = yeniIsim;
  const pending = $("profileAvatar").dataset.pending;
  if (pending !== undefined && pending !== "") S.avatar = +pending;
  $("profileDlg").close();
  ciz();
  kaydet();
};

// ================= Change olayları =================
document.addEventListener("change", e => {
  const act = e.target.dataset ? e.target.dataset.act : null;
  const id = e.target.dataset ? e.target.dataset.id : null;
  if (!act) return;
  if (act === "grade") {
    const it = bul("courses", id);
    if (it) it.g = Math.min(100, Math.max(0, +e.target.value || 0));
  } else if (act === "status") {
    const it = bul("jobs", id); if (it) it.st = e.target.value;
  } else if (act === "done") {
    const it = bul("tasks", id); if (it) it.done = e.target.checked;
  } else if (act === "task-toggle") {
    const it = bul("tasks", id);
    if (it) { it.done = e.target.checked; gorevlerCiz(); kaydet(); return; }
  } else return;
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

// ================= Ad değiştirme (çift tıkla) =================
function adDegistir(e) {
  const el = e.target.closest("[data-rename]");
  if (!el) return;
  const item = bul(el.dataset.list, el.dataset.id);
  if (!item) return;
  const yeni = prompt("Yeni metin:", item[el.dataset.field]);
  if (yeni && yeni.trim()) {
    item[el.dataset.field] = yeni.trim();
    ciz();
    if (el.dataset.list === "tasks") gorevlerCiz();
  }
}
document.addEventListener("dblclick", adDegistir);

// ================= Form gönderimleri =================
const AUTOCLOSE = ["dlgEvent", "dlgLink", "dlgCourse", "dlgDeadline", "dlgJob", "dlgSkill", "dlgNote", "dlgDers"];
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
    case "course":
      S.courses.push({ id, n: v.n.trim(), g: Math.min(100, Math.max(0, +v.g)) });
      break;
    case "deadline":
      S.deadlines.push({ id, t: v.t.trim(), d: v.d });
      break;
    case "job":
      S.jobs.push({ id, n: v.n.trim(), st: "" });
      break;
    case "skill":
      S.skills.push({ id, n: v.n.trim(), p: 50 });
      break;
    case "task":
      S.tasks.push({ id, t: v.t.trim(), done: false, p: "mid", zaman: new Date().toISOString() });
      break;
    case "task-quick":
      S.tasks.push({ id, t: v.t.trim(), done: false, p: v.p || "mid", zaman: new Date().toISOString() });
      break;
    case "note":
      S.notes.push({ id, title: v.title.trim(), text: v.text.trim(), color: v.color || "yellow" });
      break;
    case "link":
      S.links.push({ id, n: v.n.trim(), u: /^https?:\/\//.test(v.u) ? v.u.trim() : "https://" + v.u.trim() });
      break;
    case "ders": {
      // Ders programı: aynı ders adı + gün + saat varsa güncelle, yoksa ekle
      const ders = {
        id,
        ad: v.ad.trim(),
        kod: (v.kod || "").trim(),
        hoca: (v.hoca || "").trim(),
        sinif: (v.sinif || "").trim(),
        gun: v.gun,
        renk: v.renk || "blue",
        bas: v.bas,
        bit: v.bit,
        notlar: (v.notlar || "").trim(),
      };
      const idx = S.dersler.findIndex(d => d.id === id);
      if (idx >= 0) {
        S.dersler[idx] = ders;
      } else {
        S.dersler.push(ders);
      }
      break;
    }
    default: return;
  }
  f.reset();
  const parentDlg = f.closest("dialog");
  if (parentDlg && AUTOCLOSE.includes(parentDlg.id)) parentDlg.close();
  ciz();
});

// Backdrop'a tıklayınca kapat
document.addEventListener("click", e => { if (e.target.tagName === "DIALOG") e.target.close(); });

// Gece yarısı geçince yenile
document.addEventListener("visibilitychange", () => {
  const d = new Date();
  if (!document.hidden && key(d.getFullYear(), d.getMonth(), d.getDate()) !== todayKey) location.reload();
});

// ================= Giriş / çıkış =================
function authCiz() {
  document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("cur", b.dataset.tab === sekme));
  $("regOnly").hidden = sekme !== "reg";
  $("authBtn").textContent = sekme === "reg" ? "Hesap oluştur" : "Giriş yap";
  $("aPass").autocomplete = sekme === "reg" ? "new-password" : "current-password";
  const ids = Object.keys(db.users);
  $("accList").innerHTML = ids.length
    ? `<p class="lbl">Bu cihazdaki hesaplar</p><div class="acc">` +
      ids.map(id =>
        `<button type="button" data-acc="${esc(id)}">${db.users[id].tur === "work" ? "İş" : "Öğrenci"} · ${esc(db.users[id].ad)}</button>`
      ).join("") + `</div>`
    : "";
}
$("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  const ad = $("aUser").value.trim();
  const id = ad.toLowerCase();
  const sifre = $("aPass").value;
  const msg = t => ($("authMsg").textContent = t);
  if (!ad || sifre.length < 4) return msg("Kullanıcı adını yaz, şifre en az 4 karakter olsun.");
  if (sekme === "reg") {
    if (db.users[id]) return msg("Bu kullanıcı adı zaten var. Giriş yapmayı dene.");
    const tur = document.querySelector("input[name=tur]:checked").value;
    const tuz = uid() + uid();
    db.users[id] = { ad, tur, tuz, hash: await hashle(sifre, tuz), data: yeniVeri(tur, ad) };
  } else {
    const h = db.users[id];
    if (!h || h.hash !== await hashle(sifre, h.tuz)) return msg("Kullanıcı adı veya şifre yanlış.");
  }
  db.aktif = id;
  dbYaz();
  msg("");
  $("aPass").value = "";
  basla();
});
function basla() {
  const h = db.users[db.aktif];
  if (!h) { db.aktif = null; dbYaz(); $("auth").hidden = false; return; }
  if (!gecerli(h.data)) h.data = yeniVeri(h.tur, h.ad);
  if (typeof h.data.avatar !== "number") h.data.avatar = 0;
  if (!Array.isArray(h.data.notifications)) h.data.notifications = [];
  if (!h.data.taskFilter) h.data.taskFilter = "all";
  if (!Array.isArray(h.data.dersler)) h.data.dersler = [];
  S = h.data;
  sel = todayKey;
  view = { y: now.getFullYear(), m: now.getMonth() };
  q = "";
  $("q").value = "";
  $("auth").hidden = true;
  modUygula();
  goView("home");
  ciz();
  otomatikBildirimler();
  bildirimRozetiGuncelle();
}
function cikis() {
  clearTimeout(kaydetZamani);
  db.aktif = null;
  dbYaz();
  S = null;
  location.reload();
}

// ================= Başlangıç =================
try {
  authCiz();
  if (db.aktif && db.users[db.aktif]) basla();
  else $("auth").hidden = false;
  console.log("[Planla] başlatıldı");
} catch (err) {
  console.error("[Planla] başlatma hatası:", err);
}
