// Testler için ortak yardımcı: index.html + dashboard.js'i jsdom içinde yükler ve
// yerel bir test hesabıyla oturum açar. Firebase (bulut.js) yüklenmez; ağ kullanılmaz.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

const KOK = path.join(__dirname, "..");
const oku = dosya => fs.readFileSync(path.join(KOK, dosya), "utf8");
// Açılan sanal tarayıcılar: uygulamanın zamanlayıcıları (ör. 30 dk'lık bildirim kontrolü)
// test sürecini açık tutmasın diye her testten sonra kapatılır.
const acikPencereler = [];
function hepsiniKapat() { while (acikPencereler.length) acikPencereler.pop().close(); }

function uygulamaYukle({ mod = "student" } = {}) {
  // Dış betikleri çıkar: dashboard.js'i aşağıda kendimiz çalıştıracağız, bulut.js ağ ister.
  const html = oku("index.html").replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g, "");
  const dom = new JSDOM(html, { url: "https://ayvex.test/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  acikPencereler.push(w);

  // jsdom'da olmayan tarayıcı özellikleri için basit yedekler
  const D = w.HTMLDialogElement && w.HTMLDialogElement.prototype;
  if (D) {
    if (!D.showModal) D.showModal = function () { this.setAttribute("open", ""); };
    if (!D.show) D.show = function () { this.setAttribute("open", ""); };
    if (!D.close) D.close = function () { this.removeAttribute("open"); this.dispatchEvent(new w.Event("close")); };
  }
  if (!w.Element.prototype.scrollIntoView) w.Element.prototype.scrollIntoView = () => {};
  if (!w.TextEncoder) w.TextEncoder = require("node:util").TextEncoder; // takvim dosyası satır uzunluğu için
  if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.scrollTo = () => {};
  w.alert = () => {};
  w.confirm = () => true;
  const hatalar = [];
  w.addEventListener("error", e => hatalar.push(e.error || e.message));
  w.console.error = (...a) => hatalar.push(a.join(" "));

  // Kodu sayfanın kendi çalışma ortamında normal bir <script> gibi çalıştır.
  // (eval kullanılamaz: eval içindeki let/const tanımları, ör. "db" ve "S", dışarıdan görünmez.)
  const ortam = dom.getInternalVMContext();
  const js = kod => vm.runInContext(kod, ortam);
  js(oku("dashboard.js"));

  // Yerel test hesabıyla oturum aç (sadece bu sanal tarayıcıda; buluta bir şey gitmez)
  js(`db.users["test"] = { ad: "Test Kullanıcı", tur: ${JSON.stringify(mod)}, data: null }; db.aktif = "test"; basla();`);

  // Yardımcılar: uygulamanın global değişkenlerine erişim
  const gunEkle = n => js(`(() => { const d = new Date(); d.setDate(d.getDate() + (${n})); return tarihKey(d); })()`);
  return { dom, w, js, gunEkle, hatalar, belge: w.document };
}

module.exports = { uygulamaYukle, hepsiniKapat, oku, KOK };
