"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { addDoc, collection, deleteDoc, getFirestore } from "firebase/firestore";

type CheckStatus = "idle" | "running" | "success" | "error";

type CheckResult = {
  label: string;
  status: CheckStatus;
  message: string;
  detail?: string;
};

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyDyBKZ5ZS9QvdV6LQfV6xqCgAxj1oY7unM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "cgmanagement.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "cgmanagement",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "cgmanagement.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "347897744849",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:347897744849:web:833ec327e5077fc330e4f0",
};

function getFirebaseConfig() {
  const hasRequiredFields = Object.values(FIREBASE_CONFIG).every((value) => Boolean(value));
  return hasRequiredFields ? FIREBASE_CONFIG : null;
}

function statusBadgeClass(status: CheckStatus) {
  switch (status) {
    case "success":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "error":
      return "border-rose-500/30 bg-rose-500/10 text-rose-300";
    case "running":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    default:
      return "border-slate-700 bg-slate-800/70 text-slate-300";
  }
}

export default function Home() {
  const firebaseConfig = useMemo(() => getFirebaseConfig(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [vercelStatus, setVercelStatus] = useState<CheckResult>({
    label: "Vercel deployment",
    status: "idle",
    message: "Belum diperiksa",
  });
  const [authStatus, setAuthStatus] = useState<CheckResult>({
    label: "Firebase Auth",
    status: "idle",
    message: "Belum login",
  });
  const [firestoreStatus, setFirestoreStatus] = useState<CheckResult>({
    label: "Firestore",
    status: "idle",
    message: "Belum diuji",
  });

  useEffect(() => {
    if (!firebaseConfig) {
      setAuthStatus({
        label: "Firebase Auth",
        status: "error",
        message: "Konfigurasi Firebase belum siap",
        detail: "Isi NEXT_PUBLIC_FIREBASE_* di Vercel atau .env.local.",
      });
      return;
    }

    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthStatus({
          label: "Firebase Auth",
          status: "success",
          message: "Sudah login",
          detail: currentUser.email ?? "Email tidak tersedia",
        });
      } else {
        setAuthStatus({
          label: "Firebase Auth",
          status: "idle",
          message: "Belum login",
          detail: "Gunakan form login untuk menguji Auth.",
        });
      }
    });

    return () => unsubscribe();
  }, [firebaseConfig]);

  async function handleAuth(action: "login" | "register") {
    if (!firebaseConfig) {
      setAuthStatus({
        label: "Firebase Auth",
        status: "error",
        message: "Konfigurasi Firebase belum siap",
        detail: "Isi NEXT_PUBLIC_FIREBASE_* di Vercel atau .env.local.",
      });
      return;
    }

    if (!email || !password) {
      setAuthStatus({
        label: "Firebase Auth",
        status: "error",
        message: "Email dan password wajib diisi",
      });
      return;
    }

    setBusy(true);
    setAuthStatus({
      label: "Firebase Auth",
      status: "running",
      message: action === "login" ? "Mencoba login..." : "Membuat akun...",
    });

    try {
      const app = getApps()[0] ?? initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const credential =
        action === "login"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);

      setUser(credential.user);
      setAuthStatus({
        label: "Firebase Auth",
        status: "success",
        message: action === "login" ? "Login berhasil" : "Akun berhasil dibuat",
        detail: credential.user.email ?? "Email tidak tersedia",
      });
    } catch (error) {
      setAuthStatus({
        label: "Firebase Auth",
        status: "error",
        message: action === "login" ? "Login gagal" : "Pembuatan akun gagal",
        detail: error instanceof Error ? error.message : "Tidak ada detail",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (!firebaseConfig) {
      return;
    }

    setBusy(true);
    try {
      const app = getApps()[0] ?? initializeApp(firebaseConfig);
      const auth = getAuth(app);
      await signOut(auth);
      setUser(null);
      setAuthStatus({
        label: "Firebase Auth",
        status: "idle",
        message: "Berhasil logout",
      });
    } catch (error) {
      setAuthStatus({
        label: "Firebase Auth",
        status: "error",
        message: "Logout gagal",
        detail: error instanceof Error ? error.message : "Tidak ada detail",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleFirestoreTest() {
    if (!firebaseConfig) {
      setFirestoreStatus({
        label: "Firestore",
        status: "error",
        message: "Konfigurasi Firebase belum siap",
        detail: "Isi NEXT_PUBLIC_FIREBASE_* di Vercel atau .env.local.",
      });
      return;
    }

    if (!user) {
      setFirestoreStatus({
        label: "Firestore",
        status: "error",
        message: "Harus login dulu",
        detail: "Login menggunakan email/password sebelum menguji Firestore.",
      });
      return;
    }

    setBusy(true);
    setFirestoreStatus({
      label: "Firestore",
      status: "running",
      message: "Membuat data test lalu menghapusnya...",
    });

    try {
      const app = getApps()[0] ?? initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const docRef = await addDoc(collection(db, "health-checks"), {
        source: "client-ui",
        createdBy: user.uid,
        email: user.email,
        createdAt: new Date().toISOString(),
      });
      await deleteDoc(docRef);

      setFirestoreStatus({
        label: "Firestore",
        status: "success",
        message: "Add dan delete berhasil",
        detail: `Dokumen ${docRef.id.slice(0, 8)}... dibuat lalu dihapus.`,
      });
    } catch (error) {
      setFirestoreStatus({
        label: "Firestore",
        status: "error",
        message: "Operasi Firestore gagal",
        detail: error instanceof Error ? error.message : "Tidak ada detail",
      });
    } finally {
      setBusy(false);
    }
  }

  async function runVercelCheck() {
    setBusy(true);
    setVercelStatus({
      label: "Vercel deployment",
      status: "running",
      message: "Memeriksa endpoint kesehatan...",
    });

    try {
      const healthResponse = await fetch("/api/health");
      const healthData = await healthResponse.json();

      if (!healthResponse.ok || !healthData?.ok) {
        throw new Error(healthData?.error ?? "Endpoint kesehatan gagal direspons");
      }

      setVercelStatus({
        label: "Vercel deployment",
        status: "success",
        message: "Deployment sehat",
        detail: healthData?.vercel?.url ?? "Endpoint /api/health berhasil diakses",
      });
    } catch (error) {
      setVercelStatus({
        label: "Vercel deployment",
        status: "error",
        message: "Deployment bermasalah atau tidak bisa dijangkau",
        detail: error instanceof Error ? error.message : "Tidak ada detail",
      });
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void handleAuth("login");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_45%),linear-gradient(135deg,_#020617,_#0f172a)] px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">CG Management</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Uji login Firebase dan operasi Firestore</h1>
              <p className="mt-3 text-base leading-7 text-slate-300">
                Login dulu dengan email/password, lalu uji apakah Firestore bisa menerima add dan delete data untuk user yang sedang login.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={runVercelCheck}
                disabled={busy}
                className="rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {busy ? "Memeriksa..." : "Cek Vercel"}
              </button>
              <button
                onClick={handleFirestoreTest}
                disabled={busy || !user}
                className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {busy ? "Memproses..." : "Test add/delete Firestore"}
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
            <h2 className="text-xl font-semibold text-white">Login ke Firebase</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Pastikan Email/Password sign-in sudah diaktifkan di Firebase Authentication. Firestore rules harus mengizinkan request.auth != null.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0"
                  placeholder="nama@example.com"
                />
              </label>
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0"
                  placeholder="Minimal 6 karakter"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => void handleAuth("register")}
                  disabled={busy}
                  className="rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  Daftar akun
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={busy || !user}
                  className="rounded-full border border-rose-600/40 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  Logout
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-4">
            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{vercelStatus.label}</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(vercelStatus.status)}`}>
                  {vercelStatus.status === "idle" ? "Belum diuji" : vercelStatus.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{vercelStatus.message}</p>
              {vercelStatus.detail ? <p className="mt-2 text-xs leading-5 text-slate-400">{vercelStatus.detail}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{authStatus.label}</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(authStatus.status)}`}>
                  {authStatus.status === "idle" ? "Belum login" : authStatus.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{authStatus.message}</p>
              {authStatus.detail ? <p className="mt-2 text-xs leading-5 text-slate-400">{authStatus.detail}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{firestoreStatus.label}</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(firestoreStatus.status)}`}>
                  {firestoreStatus.status === "idle" ? "Belum diuji" : firestoreStatus.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{firestoreStatus.message}</p>
              {firestoreStatus.detail ? <p className="mt-2 text-xs leading-5 text-slate-400">{firestoreStatus.detail}</p> : null}
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
