// Söz dizimi ve HTML kontrolleri: yayına çıkmadan önce sayfayı tamamen bozan hataları yakalar
// (ör. aynı isimle iki kez tanımlanan sabit — bir keresinde tüm uygulamayı durdurmuştu).
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const os = require("node:os");
const { oku, KOK } = require("./yardimci");

test("dashboard.js söz dizimi geçerli (tekrarlanan tanım yok)", () => {
  assert.doesNotThrow(() => new vm.Script(oku("dashboard.js"), { filename: "dashboard.js" }));
});

for (const dosya of ["bulut.js", "sw.js"]) {
  test(`${dosya} söz dizimi geçerli`, () => {
    // bulut.js bir ES modülü: .mjs kopyası üzerinden node --check ile kontrol et
    const gecici = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ayvex-")), dosya.replace(/\.js$/, ".mjs"));
    fs.writeFileSync(gecici, oku(dosya));
    assert.doesNotThrow(() => execFileSync(process.execPath, ["--check", gecici], { stdio: "pipe" }));
  });
}

test("index.html'de aynı id iki kez kullanılmıyor", () => {
  const idler = [...oku("index.html").matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const tekrar = idler.filter((id, i) => idler.indexOf(id) !== i);
  assert.deepEqual([...new Set(tekrar)], []);
});

test("data-open ile açılan her pencere index.html'de var", () => {
  const html = oku("index.html");
  const hedefler = new Set([...html.matchAll(/data-open="([^"]+)"/g)].map(m => m[1]));
  const eksik = [...hedefler].filter(id => !new RegExp(`<dialog[^>]*\\sid="${id}"`).test(html));
  assert.deepEqual(eksik, []);
});

test("CSS ve JS dosyalarının sürüm numaraları (?v=) aynı", () => {
  const surumler = new Set([...oku("index.html").matchAll(/(?:dashboard\.css|dashboard\.js|bulut\.js)\?v=([\d.]+)/g)].map(m => m[1]));
  assert.equal(surumler.size, 1, `Farklı sürümler: ${[...surumler].join(", ")}`);
});

test("manifest ve simge dosyaları mevcut", () => {
  const manifest = JSON.parse(oku("manifest.webmanifest"));
  for (const ikon of manifest.icons) assert.ok(fs.existsSync(path.join(KOK, ikon.src)), `${ikon.src} yok`);
});

test("service worker'ın önbelleğe aldığı dosyalar mevcut", () => {
  const kabuk = JSON.parse(oku("sw.js").match(/const KABUK = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"').replace(/,\s*\]/, "]"));
  for (const d of kabuk) if (d !== "./") assert.ok(fs.existsSync(path.join(KOK, d)), `${d} yok`);
});
