"use client";

import { useMemo, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

type CheckStatus = "idle" | "running" | "success" | "error";

type CheckResult = {
  label: string;
  status: CheckStatus;
  message: string;
  detail?: string;
};

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const hasRequiredFields = Object.values(config).every((value) => Boolean(value));

  return hasRequiredFields ? config : null;
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
  const [results, setResults] = useState<CheckResult[]>([
    { label: "Vercel deployment", status: "idle", message: "Belum diperiksa" },
    { label: "Firebase Auth", status: "idle", message: "Belum diperiksa" },
    { label: "Firestore", status: "idle", message: "Belum diperiksa" },
  ]);
  const [busy, setBusy] = useState(false);

  async function runChecks() {
    setBusy(true);

    const nextResults: CheckResult[] = [
      { label: "Vercel deployment", status: "running", message: "Memeriksa endpoint kesehatan..." },
      { label: "Firebase Auth", status: "running", message: "Mencoba login anonim..." },
      { label: "Firestore", status: "running", message: "Menguji koneksi write/delete..." },
    ];
    setResults(nextResults);

    try {
      const healthResponse = await fetch("/api/health");
      const healthData = await healthResponse.json();

      if (!healthResponse.ok || !healthData?.ok) {
        throw new Error(healthData?.error ?? "Endpoint kesehatan gagal direspons");
      }

      nextResults[0] = {
        label: "Vercel deployment",
        status: "success",
        message: "Deployment sehat",
        detail: healthData?.vercel?.url ?? "Endpoint /api/health berhasil diakses",
      };
    } catch (error) {
      nextResults[0] = {
        label: "Vercel deployment",
        status: "error",
        message: "Deployment bermasalah atau tidak bisa dijangkau",
        detail: error instanceof Error ? error.message : "Tidak ada detail",
      };
    }

    if (!firebaseConfig) {
      nextResults[1] = {
        label: "Firebase Auth",
        status: "error",
        message: "Konfigurasi Firebase belum lengkap",
        detail: "Isi variabel NEXT_PUBLIC_FIREBASE_* di environment aplikasi.",
      };
      nextResults[2] = {
        label: "Firestore",
        status: "error",
        message: "Konfigurasi Firebase belum lengkap",
        detail: "Isi variabel NEXT_PUBLIC_FIREBASE_* di environment aplikasi.",
      };
      setResults(nextResults);
      setBusy(false);
      return;
    }

    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    try {
      const userCredential = await signInAnonymously(auth);
      await signOut(auth);

      nextResults[1] = {
        label: "Firebase Auth",
        status: "success",
        message: "Login anonim berhasil",
        detail: `User ${userCredential.user.uid.slice(0, 8)}... siap dipakai`,
      };
    } catch (error) {
      nextResults[1] = {
        label: "Firebase Auth",
        status: "error",
        message: "Login anonim gagal",
        detail: error instanceof Error ? error.message : "Tidak ada detail",
      };
    }

    try {
      const testDocRef = doc(collection(db, "health-checks"), `probe-${Date.now()}`);
      await setDoc(testDocRef, {
        source: "web-ui",
        checkedAt: serverTimestamp(),
      });
      await deleteDoc(testDocRef);

      nextResults[2] = {
        label: "Firestore",
        status: "success",
        message: "Write dan delete berhasil",
        detail: "Koneksi Firestore dapat digunakan untuk uji sederhana.",
      };
    } catch (error) {
      nextResults[2] = {
        label: "Firestore",
        status: "error",
        message: "Koneksi Firestore gagal",
        detail: error instanceof Error ? error.message : "Tidak ada detail",
      };
    }

    setResults(nextResults);
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_45%),linear-gradient(135deg,_#020617,_#0f172a)] px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">CG Management</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Halaman uji Auth, Firestore, dan status Vercel</h1>
              <p className="mt-3 text-base leading-7 text-slate-300">
                Halaman ini memeriksa apakah koneksi Firebase Auth, Firestore, dan deployment Vercel Anda sedang sehat.
              </p>
            </div>
            <button
              onClick={runChecks}
              disabled={busy}
              className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {busy ? "Memeriksa..." : "Jalankan pemeriksaan"}
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {results.map((result) => (
            <article key={result.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{result.label}</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(result.status)}`}>
                  {result.status === "idle" ? "Belum diuji" : result.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{result.message}</p>
              {result.detail ? <p className="mt-2 text-xs leading-5 text-slate-400">{result.detail}</p> : null}
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm leading-7 text-slate-300 shadow-xl shadow-slate-950/30">
          <h3 className="text-lg font-semibold text-white">Yang akan diperiksa</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Endpoint kesehatan aplikasi di deployment saat ini untuk memastikan Vercel merespons.</li>
            <li>Firebase Auth melalui login anonim sebagai uji koneksi awal.</li>
            <li>Firestore melalui operasi tulis dan hapus sederhana di koleksi temporary.</li>
          </ul>
          <p className="mt-4 text-slate-400">
            Pastikan variabel lingkungan Firebase sudah tersedia seperti NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, dan NEXT_PUBLIC_FIREBASE_APP_ID.
          </p>
        </section>
      </div>
    </main>
  );
}
