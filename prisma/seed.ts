/**
 * Seeds a single Super Admin account so the system is bootstrappable, and
 * optionally a demo course + roster + attendance history so the Attendance
 * module has something to display locally.
 * Run with: npm run prisma:seed
 *
 * SECURITY NOTE: Change SEED_SUPER_ADMIN_PASSWORD immediately after first
 * login. Never leave the default seed credentials in a production database.
 */
import { PrismaClient, Role, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* eslint-disable no-console -- this is a CLI script; console output is the intended UX */
async function seedSuperAdmin() {
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

/**
 * Demo data for local development only. Skipped unless SEED_DEMO_ATTENDANCE
 * is explicitly set truthy — this must never run against a real database by
 * accident. Creates one faculty member, six students, one course, full
 * enrollment, and ~6 weeks of weekday attendance history so the Attendance
 * module's calendar, trend chart, and history table all have real data to
 * render on first run.
 */
async function seedDemoAttendance() {
  if (process.env.SEED_DEMO_ATTENDANCE !== "true") {
    console.log("SEED_DEMO_ATTENDANCE not set — skipping demo course/attendance data.");
    return;
  }

  const existingCourse = await prisma.course.findUnique({ where: { code: "CS101" } });
  if (existingCourse) {
    console.log("Demo course CS101 already exists — skipping demo seed.");
    return;
  }

  const demoPassword = await bcrypt.hash("DemoPass!123", 12);

  const batch = await prisma.batch.upsert({
    where: { name: "2024 - 2028" },
    update: {},
    create: { name: "2024 - 2028", startYear: 2024, endYear: 2028 },
  });

  const faculty = await prisma.user.upsert({
    where: { email: "demo.faculty@lms-portal.edu" },
    update: {},
    create: {
      email: "demo.faculty@lms-portal.edu",
      name: "Dr. Amara Chen",
      passwordHash: demoPassword,
      role: Role.FACULTY,
      emailVerified: new Date(),
    },
  });

  const studentNames = [
    "Jordan Lee",
    "Priya Nair",
    "Marcus Webb",
    "Sofia Torres",
    "Ken Watanabe",
    "Aaliyah Brooks",
  ];

  const students = await Promise.all(
    studentNames.map((name, i) =>
      prisma.user.upsert({
        where: { email: `demo.student${i + 1}@lms-portal.edu` },
        update: {},
        create: {
          email: `demo.student${i + 1}@lms-portal.edu`,
          name,
          passwordHash: demoPassword,
          role: Role.STUDENT,
          emailVerified: new Date(),
          registrationNumber: `STU-2026-${String(i + 1).padStart(4, "0")}`,
          batchId: batch.id,
        },
      })
    )
  );

  const course = await prisma.course.create({
    data: {
      code: "CS101",
      name: "Introduction to Programming",
      facultyId: faculty.id,
    },
  });

  await prisma.enrollment.createMany({
    data: students.map((s) => ({ studentId: s.id, courseId: course.id })),
    skipDuplicates: true,
  });

  // ~6 weeks of weekday attendance, skewed toward PRESENT, deterministic
  // (no Math.random) so re-running the seed against a fresh DB is stable.
  const STATUS_CYCLE: AttendanceStatus[] = [
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "PRESENT",
    "ABSENT",
    "PRESENT",
    "LEAVE",
  ];

  const records: {
    studentId: string;
    courseId: string;
    date: Date;
    status: AttendanceStatus;
    markedById: string;
  }[] = [];

  // Postgres DATE columns have no timezone; normalize to UTC midnight so
  // this is stable regardless of the machine running the seed script.
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let cursor = 0;
  for (let daysAgo = 42; daysAgo >= 1; daysAgo--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - daysAgo);
    const dayOfWeek = date.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // weekdays only

    for (const student of students) {
      const status = STATUS_CYCLE[cursor % STATUS_CYCLE.length]!;
      cursor++;
      records.push({
        studentId: student.id,
        courseId: course.id,
        date,
        status,
        markedById: faculty.id,
      });
    }
  }

  await prisma.attendanceRecord.createMany({ data: records, skipDuplicates: true });

  // One inactive sample session — an admin can activate it from
  // /academic-admin/attendance to try the live check-in flow end to end.
  await prisma.liveClassSession.create({
    data: {
      courseId: course.id,
      batchId: batch.id,
      facultyId: faculty.id,
      subjectLabel: "Introduction to Programming — Lecture 7",
      date: today,
      startTime: "10:00",
      platform: "ZOOM",
      meetingLink: "https://zoom.us/j/1234567890",
      isActive: false,
    },
  });

  console.log("Seeded demo attendance data:");
  console.log(`  faculty:  demo.faculty@lms-portal.edu / DemoPass!123`);
  console.log(
    `  students: demo.student1@lms-portal.edu .. demo.student6@lms-portal.edu / DemoPass!123`
  );
  console.log(`            (registration numbers STU-2026-0001 .. 0006, batch "2024 - 2028")`);
  console.log(`  course:   CS101 — Introduction to Programming`);
  console.log(`  ${records.length} attendance records created.`);
  console.log(`  1 sample live class session created (inactive) — activate it from`);
  console.log(`  /academic-admin/attendance to try the /attendance check-in flow.`);
}

async function main() {
  await seedSuperAdmin();
  await seedDemoAttendance();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
