import { FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/firebase/firebase-admin";

type SeedOrganizationInput = {
  name: string;
  orgId: string;
};

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidOrgId(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(value);
}

function resolveInput(): SeedOrganizationInput {
  const nameArg = process.argv[2]?.trim();
  const orgIdArg = process.argv[3]?.trim();

  const name = nameArg || process.env.ORG_NAME?.trim() || "";
  const orgIdOverride = orgIdArg || process.env.ORG_ID?.trim() || "";

  if (!name) {
    throw new Error(
      'Nama organisasi wajib diisi. Contoh: npx tsx scripts/seed-organization.ts "South Youth"',
    );
  }

  const orgId = orgIdOverride || slugify(name);

  if (!isValidOrgId(orgId)) {
    throw new Error(
      `orgId "${orgId}" tidak valid. Gunakan huruf kecil, angka, dan tanda hubung, 3-63 karakter.`,
    );
  }

  return { name, orgId };
}

async function seedOrganization({ name, orgId }: SeedOrganizationInput): Promise<void> {
  const { adminDb } = getAdminServices();

  const existingOrgsSnapshot = await adminDb.collection("organizations").limit(1).get();
  if (!existingOrgsSnapshot.empty && existingOrgsSnapshot.docs[0].id !== orgId) {
    throw new Error(
      `Organisasi lain sudah ada (orgId: "${existingOrgsSnapshot.docs[0].id}"). Platform ini single-tenant di v1, jadi hanya boleh ada satu dokumen organisasi.`,
    );
  }

  const orgRef = adminDb.collection("organizations").doc(orgId);
  const existing = await orgRef.get();

  if (existing.exists) {
    throw new Error(
      `Dokumen organisasi dengan orgId "${orgId}" sudah ada. Gunakan orgId lain lewat argumen kedua atau env ORG_ID kalau ingin membuat ulang.`,
    );
  }

  await orgRef.set({
    name,
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log("Organisasi berhasil dibuat.");
  console.log(`orgId: ${orgId}`);
  console.log(`name: ${name}`);
  console.log("");
  console.log("Custom claims untuk akun Coach pertama di organisasi ini:");
  console.log(
    JSON.stringify(
      {
        role: "coach",
        orgId,
        cgGroupId: null,
      },
      null,
      2,
    ),
  );
}

async function main(): Promise<void> {
  const input = resolveInput();
  await seedOrganization(input);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
  console.error(message);
  process.exitCode = 1;
});