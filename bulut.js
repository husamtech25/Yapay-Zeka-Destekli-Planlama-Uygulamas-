// =====================================================================
// AYVEX — Bulut senkronizasyonu (Firebase Auth + Firestore)
//
// dashboard.js uygulamanın tüm mantığını yürütür ve veriyi localStorage'da
// tutar. Bu modül yalnızca köprüdür: Google ile giriş, veriyi Firestore'a
// yazma ve başka cihazlardan gelen değişiklikleri dinleme.
//   dashboard.js → window.AYVEX_BULUT.*  (bu dosyanın sunduğu işlevler)
//   bu dosya     → window.AYVEX.*        (dashboard.js'in sunduğu geri çağrılar)
//
// Veri modeli: users/{uid} = { veri: <S nesnesinin JSON metni>, ad, tur,
// surum, guncelleme }. Veri tek bir JSON metni olarak saklanır; böylece
// Firestore'un iç içe dizi / alan adı kısıtlamalarına takılmaz.
// Erişim güvenliği firestore.rules dosyasındaki kurallarla sağlanır.
// =====================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  getRedirectResult, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification,
  sendPasswordResetEmail, updateProfile, reauthenticateWithCredential, EmailAuthProvider,
  updatePassword, deleteUser,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
// Firestore (en büyük kütüphane) giriş ekranında gerekmiyor: ilk ihtiyaçta yüklenir, bkz. firestore()
const FIRESTORE_URL = "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Bu değerler gizli değildir; her Firebase web uygulamasında istemci kodunda durur.
const firebaseConfig = {
  apiKey: "AIzaSyAFLqqEhxe50ZQwwzNRtSdIu-csUDNRfuc",
  authDomain: "ayvex-7697a.firebaseapp.com",
  projectId: "ayvex-7697a",
  storageBucket: "ayvex-7697a.firebasestorage.app",
  messagingSenderId: "49717477149",
  appId: "1:49717477149:web:77188c912ce57de294abf4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Doğrulama ve şifre sıfırlama e-postaları Türkçe gönderilsin
auth.languageCode = "tr";
// Firestore'u bir kez yükleyip başlatır; sonraki çağrılar aynı sözü (promise) döndürür.
// Kalıcı yerel önbellek: internetsiz yapılan yazmalar sıraya alınır ve
// bağlantı gelince (sayfa kapatılıp açılsa bile) gönderilir.
let firestoreSozu = null;
function firestore() {
  if (!firestoreSozu) {
    firestoreSozu = import(FIRESTORE_URL).then(F => {
      const fs = F.initializeFirestore(app, {
        localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
      });
      return { fs, F };
    }).catch(e => { firestoreSozu = null; throw e; }); // ağ hatasında sonra tekrar denenebilsin
  }
  return firestoreSozu;
}

// saglayici: "google.com" ya da "password" (e-posta/şifre). Google hesapları her zaman
// doğrulanmış sayılır; e-posta hesapları doğrulanana kadar uygulamaya giremez.
const kullaniciBilgi = u => u && {
  uid: u.uid, ad: u.displayName || "", email: u.email || "",
  saglayici: (u.providerData && u.providerData[0] && u.providerData[0].providerId) || "password",
  dogrulandi: !!u.emailVerified,
};
const belge = ({ fs, F }, uid) => F.doc(fs, "users", uid);

let aboneIptal = null;
let dinlenenUid = null;
let sonYazilan = null; // kendi yazdığımız veri geri geldiğinde yok saymak için

function durumBildir(durum) {
  if (window.AYVEX && window.AYVEX.bulutDurum) window.AYVEX.bulutDurum(durum);
}

// Giriş yapan kullanıcının buluttaki kaydını getir (yoksa uzak = null)
async function kullaniciVerisi(user) {
  let snap;
  try {
    const db = await firestore();
    snap = await db.F.getDoc(belge(db, user.uid));
  } catch (e) {
    // İnternet yoksa sunucuya ulaşılamaz; önbellekte de yoksa yeni kullanıcı sanılmasın
    if (e && e.code === "unavailable") throw new Error("Bulut sunucusuna ulaşılamadı. İnternet bağlantını kontrol et.");
    throw e;
  }
  return { kullanici: kullaniciBilgi(user), uzak: snap.exists() ? snap.data() : null };
}

async function girisYap() {
  const saglayici = new GoogleAuthProvider();
  saglayici.setCustomParameters({ prompt: "select_account" });
  try {
    const sonuc = await signInWithPopup(auth, saglayici);
    return await kullaniciVerisi(sonuc.user);
  } catch (e) {
    // Not: Açılır pencere engellenince eskiden yönlendirmeyle (signInWithRedirect) deneniyordu.
    // Site github.io'da, giriş işleyicisi firebaseapp.com'da olduğu için güncel tarayıcılar
    // (Chrome 115+, Safari, Firefox) iki alan adı arasındaki depolamayı ayırıyor ve yönlendirme
    // dönüşünde oturum sessizce kayboluyordu. Artık hata çağırana iletilir ve kullanıcıya
    // ne yapacağı söylenir (bkz. dashboard.js authHataMetni).
    if (e && (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request")) return null;
    throw e;
  }
}

// ---------- E-posta / şifre ----------
// Doğrulama bağlantısına tıklandıktan sonra uygulamaya geri dönülsün
const donusAdresi = () => ({ url: location.origin + location.pathname });

async function epostaKayit(ad, email, sifre) {
  const sonuc = await createUserWithEmailAndPassword(auth, email, sifre);
  if (ad) await updateProfile(sonuc.user, { displayName: ad });
  await sendEmailVerification(sonuc.user, donusAdresi());
  return kullaniciBilgi(sonuc.user);
}

async function epostaGiris(email, sifre) {
  const sonuc = await signInWithEmailAndPassword(auth, email, sifre);
  return kullaniciBilgi(sonuc.user);
}

function dogrulamaGonder() {
  if (!auth.currentUser) return Promise.reject(new Error("Oturum yok"));
  return sendEmailVerification(auth.currentUser, donusAdresi());
}

// Kullanıcıyı sunucudan yeniden yükle; doğrulandıysa kimlik belirtecini yenile ki
// Firestore kuralları email_verified bilgisini görsün
async function dogrulamaKontrol() {
  const u = auth.currentUser;
  if (!u) return null;
  await u.reload();
  if (auth.currentUser.emailVerified) await auth.currentUser.getIdToken(true);
  return kullaniciBilgi(auth.currentUser);
}

// Kayıtlı olmayan e-postada da hata vermeden başarılı döner (hangi e-postanın kayıtlı
// olduğu bu yolla öğrenilemesin)
async function sifreSifirla(email) {
  try { await sendPasswordResetEmail(auth, email, donusAdresi()); }
  catch (e) { if (e && e.code !== "auth/user-not-found") throw e; }
}

async function yenidenDogrula(sifre) {
  const u = auth.currentUser;
  await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, sifre));
}

async function sifreDegistir(eskiSifre, yeniSifre) {
  await yenidenDogrula(eskiSifre);
  await updatePassword(auth.currentUser, yeniSifre);
}

// E-posta hesabını tamamen sil: buluttaki veri + Firebase'deki kullanıcı kaydı
async function hesabiTamamenSil(uid, sifre) {
  await yenidenDogrula(sifre);
  dinlemeyiBirak();
  const db = await firestore();
  await db.F.deleteDoc(belge(db, uid));
  await deleteUser(auth.currentUser);
}

async function dinle(uid) {
  if (dinlenenUid === uid) return;
  dinlemeyiBirak();
  dinlenenUid = uid;
  let db;
  try { db = await firestore(); } catch (e) {
    if (dinlenenUid === uid) dinlenenUid = null;
    durumBildir({ hata: "Bulut bağlantısında sorun var." });
    return;
  }
  // Yükleme sürerken çıkış yapıldıysa ya da başka hesaba geçildiyse dinlemeye başlama
  if (dinlenenUid !== uid || aboneIptal) return;
  aboneIptal = db.F.onSnapshot(belge(db, uid), { includeMetadataChanges: true }, snap => {
    durumBildir({
      bekleyen: snap.metadata.hasPendingWrites,
      cevrimdisi: snap.metadata.fromCache && !navigator.onLine,
    });
    if (!snap.exists() || snap.metadata.hasPendingWrites) return;
    const veri = snap.data().veri;
    if (typeof veri !== "string" || veri === sonYazilan) return;
    sonYazilan = veri;
    if (window.AYVEX && window.AYVEX.uzakVeriGeldi) window.AYVEX.uzakVeriGeldi(veri);
  }, hata => {
    console.error("[AYVEX] bulut dinleme hatası:", hata);
    durumBildir({ hata: hata.code === "permission-denied" ? "Bulut verisine erişim reddedildi." : "Bulut bağlantısında sorun var." });
  });
}

function dinlemeyiBirak() {
  if (aboneIptal) aboneIptal();
  aboneIptal = null;
  dinlenenUid = null;
}

// Yazma; promise sunucu onayını bekler, internet yoksa sıraya alınır.
// Arayüz bu promise'i beklemez.
function kaydet(uid, { veri, ad, tur }) {
  sonYazilan = veri;
  return firestore()
    .then(db => db.F.setDoc(belge(db, uid), { veri, ad: String(ad || "").slice(0, 80), tur, surum: 1, guncelleme: db.F.serverTimestamp() }))
    .catch(e => {
      console.error("[AYVEX] bulut kayıt hatası:", e);
      durumBildir({ hata: e.code === "permission-denied" ? "Buluta kaydetme izni reddedildi." : "Buluta kaydedilemedi." });
    });
}

// Bekleyen yazmaların gönderilmesini en fazla `ms` kadar bekle
async function bekleyenleriGonder(ms = 4000) {
  // Firestore hiç yüklenmediyse gönderilmeyi bekleyen yazma da yoktur
  if (!firestoreSozu) return true;
  try {
    const db = await firestoreSozu;
    await Promise.race([db.F.waitForPendingWrites(db.fs), new Promise((_, r) => setTimeout(() => r(new Error("zaman aşımı")), ms))]);
    return true;
  } catch (e) { return false; }
}

async function cikisYap() {
  dinlemeyiBirak();
  await signOut(auth);
}

async function verimiSil(uid) {
  dinlemeyiBirak();
  const db = await firestore();
  await db.F.deleteDoc(belge(db, uid));
  // Google hesabında Firebase kullanıcı kaydını da silmeyi dene; yakın zamanda giriş
  // yapılmadıysa Firebase izin vermez, o durumda sadece oturum kapatılır (veri zaten silindi)
  try { await deleteUser(auth.currentUser); } catch (e) { await signOut(auth); }
}

// ---- Salt okunur paylaşım bağlantıları ----
// paylasimlar/{id} = { sahip: uid, tur: "proje", baslik, veri: <JSON metni>, guncelleme }.
// Bağlantıyı bilen herkes okuyabilir (giriş gerekmez); sadece sahibi yazıp silebilir (firestore.rules).
// id tahmin edilemeyecek kadar uzun ve rastgeledir.
const paylasimBelge = ({ fs, F }, id) => F.doc(fs, "paylasimlar", id);
function paylasimIdUret() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map(x => x.toString(36).padStart(2, "0")).join("").slice(0, 24);
}
async function paylasimYaz(id, { baslik, veri }) {
  const u = auth.currentUser;
  if (!u) throw new Error("Oturum yok");
  const db = await firestore();
  await db.F.setDoc(paylasimBelge(db, id), {
    sahip: u.uid, tur: "proje", baslik: String(baslik || "").slice(0, 120), veri, guncelleme: db.F.serverTimestamp(),
  });
}
async function paylasimSil(id) {
  const db = await firestore();
  await db.F.deleteDoc(paylasimBelge(db, id));
}
async function paylasimOku(id) {
  const db = await firestore();
  const snap = await db.F.getDoc(paylasimBelge(db, id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { baslik: d.baslik, veri: d.veri, guncelleme: d.guncelleme && d.guncelleme.toDate ? d.guncelleme.toDate() : null };
}

window.AYVEX_BULUT = {
  girisYap, kullaniciVerisi, dinle, kaydet, bekleyenleriGonder, cikisYap, verimiSil,
  epostaKayit, epostaGiris, dogrulamaGonder, dogrulamaKontrol, sifreSifirla, sifreDegistir, hesabiTamamenSil,
  paylasimIdUret, paylasimYaz, paylasimSil, paylasimOku,
  mevcutKullanici: () => kullaniciBilgi(auth.currentUser),
};
window.dispatchEvent(new Event("ayvex-bulut-hazir"));

// Yönlendirmeyle yapılan girişin sonucu (açılır pencere engellendiyse)
getRedirectResult(auth)
  .then(async sonuc => { if (sonuc && sonuc.user && window.AYVEX) window.AYVEX.googleGirisSonucu(await kullaniciVerisi(sonuc.user)); })
  .catch(e => console.error("[AYVEX] yönlendirme sonucu hatası:", e));

onAuthStateChanged(auth, user => {
  // Oturum açıksa veritabanı kütüphanesini hemen yüklemeye başla (veri okunurken beklenmesin)
  if (user) firestore().catch(() => {});
  if (window.AYVEX && window.AYVEX.authDegisti) window.AYVEX.authDegisti(kullaniciBilgi(user));
});

console.log("[AYVEX] bulut modülü hazır");
