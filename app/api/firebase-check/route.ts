import { NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase/firebase-admin";

export async function GET() {
  try {
    const { adminAuth, adminDb } = getAdminServices();

    const authResult = await (async () => {
      try {
        const testEmail = `health-${Date.now()}@example.com`;
        const testPassword = `Health-${Date.now()}`;

        const testUser = await adminAuth.createUser({
          email: testEmail,
          password: testPassword,
        });

        await adminAuth.deleteUser(testUser.uid);

        return {
          ok: true,
          message: "Firebase Auth siap dipakai",
          detail: "User test berhasil dibuat dan dihapus dengan akun email/password.",
        };
      } catch (error) {
        return {
          ok: false,
          message: "Firebase Auth gagal",
          detail: error instanceof Error ? error.message : "Tidak ada detail",
        };
      }
    })();

    const firestoreResult = await (async () => {
      try {
        const testDocRef = adminDb.collection("health-checks").doc(`probe-${Date.now()}`);
        await testDocRef.set({ source: "server-check", checkedAt: new Date().toISOString() });
        await testDocRef.delete();

        return {
          ok: true,
          message: "Firestore siap dipakai",
          detail: "Operasi write/delete berhasil dijalankan dengan aturan yang mengharuskan auth.",
        };
      } catch (error) {
        return {
          ok: false,
          message: "Firestore gagal",
          detail: error instanceof Error ? error.message : "Tidak ada detail",
        };
      }
    })();

    return NextResponse.json({
      ok: true,
      checks: {
        auth: authResult,
        firestore: firestoreResult,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Tidak ada detail",
        checks: {
          auth: { ok: false, message: "Firebase Admin tidak siap", detail: "Cek variabel Firebase Admin di Vercel" },
          firestore: { ok: false, message: "Firebase Admin tidak siap", detail: "Cek variabel Firebase Admin di Vercel" },
        },
      },
      { status: 500 },
    );
  }
}
