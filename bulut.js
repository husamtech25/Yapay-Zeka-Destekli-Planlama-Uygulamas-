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
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp, waitForPendingWrites,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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
// Kalıcı yerel önbellek: internetsiz yapılan yazmalar sıraya alınır ve
// bağlantı gelince (sayfa kapatılıp açılsa bile) gönderilir.
const fs = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

const kullaniciBilgi = u => u && { uid: u.uid, ad: u.displayName || "", email: u.email || "" };
const belge = uid => doc(fs, "users", uid);

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
    snap = await getDoc(belge(user.uid));
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
    // Açılır pencere engellendiyse yönlendirme ile dene (sonuç sayfa yenilenince gelir)
    if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) {
      await signInWithRedirect(auth, saglayici);
      return null;
    }
    if (e && (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request")) return null;
    throw e;
  }
}

function dinle(uid) {
  if (dinlenenUid === uid && aboneIptal) return;
  dinlemeyiBirak();
  dinlenenUid = uid;
  aboneIptal = onSnapshot(belge(uid), { includeMetadataChanges: true }, snap => {
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
  return setDoc(belge(uid), { veri, ad: String(ad || "").slice(0, 80), tur, surum: 1, guncelleme: serverTimestamp() })
    .catch(e => {
      console.error("[AYVEX] bulut kayıt hatası:", e);
      durumBildir({ hata: e.code === "permission-denied" ? "Buluta kaydetme izni reddedildi." : "Buluta kaydedilemedi." });
    });
}

// Bekleyen yazmaların gönderilmesini en fazla `ms` kadar bekle
async function bekleyenleriGonder(ms = 4000) {
  try {
    await Promise.race([waitForPendingWrites(fs), new Promise((_, r) => setTimeout(() => r(new Error("zaman aşımı")), ms))]);
    return true;
  } catch (e) { return false; }
}

async function cikisYap() {
  dinlemeyiBirak();
  await signOut(auth);
}

async function verimiSil(uid) {
  dinlemeyiBirak();
  await deleteDoc(belge(uid));
  await signOut(auth);
}

window.AYVEX_BULUT = { girisYap, kullaniciVerisi, dinle, kaydet, bekleyenleriGonder, cikisYap, verimiSil, mevcutKullanici: () => kullaniciBilgi(auth.currentUser) };

// Yönlendirmeyle yapılan girişin sonucu (açılır pencere engellendiyse)
getRedirectResult(auth)
  .then(async sonuc => { if (sonuc && sonuc.user && window.AYVEX) window.AYVEX.googleGirisSonucu(await kullaniciVerisi(sonuc.user)); })
  .catch(e => console.error("[AYVEX] yönlendirme sonucu hatası:", e));

onAuthStateChanged(auth, user => {
  if (window.AYVEX && window.AYVEX.authDegisti) window.AYVEX.authDegisti(kullaniciBilgi(user));
});

console.log("[AYVEX] bulut modülü hazır");
