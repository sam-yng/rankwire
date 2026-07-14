import { fileURLToPath } from "node:url";
import { db } from "../lib/db";
import { DEFAULT_TAG_WEIGHTS } from "../lib/tags";

export { DEFAULT_TAG_WEIGHTS } from "../lib/tags";

// Design spec §9: fifteen tags; per-user defaults seeded on first sign-in
// (M2) and editable on /preferences.
export async function seedTagWeights(userId: string): Promise<void> {
  await db.tagWeight.createMany({
    data: Object.entries(DEFAULT_TAG_WEIGHTS).map(([tag, weight]) => ({
      userId,
      tag,
      weight,
    })),
    skipDuplicates: true,
  });
}

// `prisma db seed` (or running this file directly) seeds a dev user with the
// default weights for local testing.
async function main() {
  const dev = await db.user.upsert({
    where: { email: "dev@rankwire.local" },
    update: {},
    create: { email: "dev@rankwire.local", name: "Dev User" },
  });
  await seedTagWeights(dev.id);
  console.log(`Seeded dev user ${dev.id} with default tag weights.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
