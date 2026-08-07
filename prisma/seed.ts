/**
 * Seeds a single Super Admin account so the system is bootstrappable.
 * Run with: npm run prisma:seed
 *
 * SECURITY NOTE: Change SEED_SUPER_ADMIN_PASSWORD immediately after first
 * login. Never leave the default seed credentials in a production database.
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* eslint-disable no-console -- this is a CLI script; console output is the intended UX */
async function main() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@lms-portal.edu";
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "ChangeMe!12345";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: "Super Admin",
      passwordHash,
      role: Role.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log("Seeded super admin:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log("  -> Log in and change this password immediately.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
