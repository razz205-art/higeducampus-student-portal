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
import { randomBytes } from "crypto";

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

  // --- Progress tracker demo data -----------------------------------------
  // Two modules of four lessons each; the first three students complete a
  // realistic, staggered subset so Overall/Subject/Module progress, the
  // streak, and the weekly/monthly activity graphs all have real variation
  // to display (not just "0%" or "100%" everywhere).
  const moduleDefs = [
    {
      title: "Module 1: Foundations",
      lessons: ["Variables & Types", "Control Flow", "Functions", "Arrays"],
    },
    {
      title: "Module 2: Data Structures",
      lessons: ["Lists & Stacks", "Queues", "Trees", "Hash Maps"],
    },
  ];

  const createdModules = [];
  for (let mi = 0; mi < moduleDefs.length; mi++) {
    const def = moduleDefs[mi]!;
    const mod = await prisma.module.create({
      data: { courseId: course.id, title: def.title, order: mi },
    });
    const lessons = await Promise.all(
      def.lessons.map((title, li) =>
        prisma.lesson.create({ data: { moduleId: mod.id, title, order: li } })
      )
    );
    createdModules.push({ mod, lessons });
  }

  const allLessons = createdModules.flatMap((m) => m.lessons);
  const completionRecords: { studentId: string; lessonId: string; completedAt: Date }[] = [];
  // student[0]: finished everything. student[1]: about halfway. student[2]: just started.
  const completionCounts = [allLessons.length, Math.ceil(allLessons.length / 2), 2, 0, 0, 0];
  students.forEach((student, si) => {
    const count = completionCounts[si] ?? 0;
    for (let li = 0; li < count; li++) {
      const daysAgo = (count - li) * 2; // spread completions out over time
      const completedAt = new Date(today);
      completedAt.setUTCDate(completedAt.getUTCDate() - daysAgo);
      completionRecords.push({ studentId: student.id, lessonId: allLessons[li]!.id, completedAt });
    }
  });
  await prisma.lessonCompletion.createMany({ data: completionRecords, skipDuplicates: true });

  const quizDefs = [
    { title: "Internal Assessment 1", maxScore: 20, kind: "INTERNAL" as const },
    { title: "Internal Assessment 2", maxScore: 20, kind: "INTERNAL" as const },
    { title: "Mock Test — Programming Basics", maxScore: 50, kind: "MOCK_TEST" as const },
  ];
  const createdQuizzes = await Promise.all(
    quizDefs.map((q) => prisma.quiz.create({ data: { courseId: course.id, ...q } }))
  );
  // Per-student score on [Internal 1, Mock Test] — nulls = not attempted.
  const quizScores: { internal: number | null; mock: number | null }[] = [
    { internal: 18, mock: 44 },
    { internal: 17, mock: 39 },
    { internal: 12, mock: 30 },
    { internal: null, mock: null },
    { internal: null, mock: null },
    { internal: null, mock: null },
  ];
  const quizAttempts: { studentId: string; quizId: string; score: number; takenAt: Date }[] = [];
  students.forEach((student, si) => {
    const { internal, mock } = quizScores[si]!;
    const takenAt = new Date(today);
    takenAt.setUTCDate(takenAt.getUTCDate() - 5);
    if (internal !== null) {
      quizAttempts.push({
        studentId: student.id,
        quizId: createdQuizzes[0]!.id,
        score: internal,
        takenAt,
      });
    }
    if (mock !== null) {
      const mockTakenAt = new Date(today);
      mockTakenAt.setUTCDate(mockTakenAt.getUTCDate() - 2);
      quizAttempts.push({
        studentId: student.id,
        quizId: createdQuizzes[2]!.id,
        score: mock,
        takenAt: mockTakenAt,
      });
    }
  });
  await prisma.quizAttempt.createMany({ data: quizAttempts });

  const dueDate1 = new Date(today);
  dueDate1.setUTCDate(dueDate1.getUTCDate() - 3);
  const dueDate2 = new Date(today);
  dueDate2.setUTCDate(dueDate2.getUTCDate() + 4);
  const createdAssignments = await Promise.all([
    prisma.assignment.create({
      data: {
        courseId: course.id,
        title: "Assignment 1: Variables Practice",
        dueDate: dueDate1,
        maxScore: 100,
      },
    }),
    prisma.assignment.create({
      data: {
        courseId: course.id,
        title: "Assignment 2: Sorting Exercise",
        dueDate: dueDate2,
        maxScore: 100,
      },
    }),
  ]);
  // [submitted?, graded score or null] per student, for Assignment 1.
  const submissionPlan: { submitted: boolean; score: number | null }[] = [
    { submitted: true, score: 92 },
    { submitted: true, score: 81 },
    { submitted: false, score: null },
    { submitted: false, score: null },
    { submitted: false, score: null },
    { submitted: false, score: null },
  ];
  const submissions = students
    .map((student, si) => ({ student, plan: submissionPlan[si]! }))
    .filter((s) => s.plan.submitted)
    .map((s) => ({
      studentId: s.student.id,
      assignmentId: createdAssignments[0]!.id,
      submittedAt: today,
      status: s.plan.score !== null ? ("GRADED" as const) : ("SUBMITTED" as const),
      score: s.plan.score,
    }));
  await prisma.assignmentSubmission.createMany({ data: submissions, skipDuplicates: true });

  // --- Results module: semester results (for Semester Result + Batch Rank) -
  const semesterResultPlan: { studentIndex: number; gpa: number; percentage: number }[] = [
    { studentIndex: 0, gpa: 3.8, percentage: 92 },
    { studentIndex: 1, gpa: 3.2, percentage: 78 },
    { studentIndex: 2, gpa: 2.6, percentage: 65 },
  ];
  for (const plan of semesterResultPlan) {
    const student = students[plan.studentIndex]!;
    const semesterResult = await prisma.semesterResult.upsert({
      where: { studentId_semesterLabel: { studentId: student.id, semesterLabel: "Semester 1" } },
      update: {},
      create: {
        studentId: student.id,
        semesterLabel: "Semester 1",
        gpa: plan.gpa,
        percentage: plan.percentage,
        status: "PASS",
        createdById: faculty.id,
      },
    });
    await prisma.semesterCourseResult.upsert({
      where: { id: `${semesterResult.id}-${course.id}` },
      update: {},
      create: {
        id: `${semesterResult.id}-${course.id}`,
        semesterResultId: semesterResult.id,
        courseId: course.id,
        marksObtained: plan.percentage,
        maxMarks: 100,
        grade: plan.percentage >= 90 ? "A+" : plan.percentage >= 75 ? "A" : "B",
      },
    });
  }

  // --- Exam countdown demo data -------------------------------------------
  const daysFromNow = (n: number, hour = 10) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  await prisma.exam.createMany({
    data: [
      {
        title: "CUET PG 2026",
        description: "Common University Entrance Test — Postgraduate",
        examDate: daysFromNow(21, 9),
        createdById: faculty.id,
      },
      {
        title: "UGC NET Paper I",
        description: "General teaching & research aptitude",
        examDate: daysFromNow(45, 14),
        createdById: faculty.id,
      },
      {
        title: "UGC NET Psychology",
        description: "Subject paper — Psychology",
        examDate: daysFromNow(45, 14),
        createdById: faculty.id,
      },
      {
        title: "Internal Mock Test — CS101",
        description: "Practice test covering Modules 1–2",
        examDate: daysFromNow(2, 11),
        createdById: faculty.id,
      },
    ],
  });

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

  // --- Notification center demo data --------------------------------------
  const notificationDefs = [
    {
      title: "Welcome to the new semester",
      body: "We're excited to kick off the new semester! Please review your course schedule and reach out to your faculty advisor with any questions.",
      category: "ANNOUNCEMENT" as const,
      isPinned: true,
      attachments: [] as { type: "IMAGE" | "PDF" | "VIDEO"; url: string; label?: string }[],
    },
    {
      title: "CUET PG 2026 admit cards released",
      body: "Admit cards for CUET PG 2026 are now available. Download yours from the official portal before the exam date.",
      category: "EXAM_UPDATE" as const,
      isPinned: true,
      attachments: [],
    },
    {
      title: "CS101 lecture moved to Room 118",
      body: "Monday's Introduction to Programming lecture has been relocated from Room 204 to Room 118 for this week only.",
      category: "SCHEDULE_CHANGE" as const,
      isPinned: false,
      attachments: [],
    },
    {
      title: "Assignment 2 due Friday",
      body: "A reminder that the Sorting Exercise assignment for CS101 is due this Friday at 11:59 PM. Late submissions will not be accepted.",
      category: "ASSIGNMENT_REMINDER" as const,
      isPinned: false,
      attachments: [],
    },
    {
      title: "Semester fee payment reminder",
      body: "This is a reminder that semester fees are due by the end of the month. Please contact the accounts office if you need a payment plan.",
      category: "FEE_REMINDER" as const,
      isPinned: false,
      attachments: [],
    },
    {
      title: "Campus closed for Independence Day",
      body: "The campus will be closed on August 15th in observance of Independence Day. Classes resume the following day.",
      category: "HOLIDAY_NOTICE" as const,
      isPinned: false,
      attachments: [],
    },
    {
      title: "Placement drive: TechCorp hiring",
      body: "TechCorp will be conducting an on-campus placement drive next month for final-year students. Registration details and eligibility criteria are attached.",
      category: "PLACEMENT_UPDATE" as const,
      isPinned: false,
      attachments: [
        {
          type: "PDF" as const,
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          label: "Eligibility criteria (PDF)",
        },
      ],
    },
  ];

  for (const def of notificationDefs) {
    await prisma.notification.create({
      data: {
        title: def.title,
        body: def.body,
        category: def.category,
        isPinned: def.isPinned,
        createdById: faculty.id,
        attachments: { create: def.attachments },
      },
    });
  }

  // --- Timetable demo data -------------------------------------------------
  // CS101 meets Monday/Wednesday/Friday mornings, plus a Tuesday online lab.
  await prisma.timetableSlot.createMany({
    data: [
      {
        courseId: course.id,
        batchId: batch.id,
        dayOfWeek: 1, // Monday
        startTime: "09:00",
        endTime: "10:30",
        location: "Room 118, CS Building",
        meetingLink: "https://zoom.us/j/1234567890",
        createdById: faculty.id,
      },
      {
        courseId: course.id,
        batchId: batch.id,
        dayOfWeek: 3, // Wednesday
        startTime: "09:00",
        endTime: "10:30",
        location: "Room 118, CS Building",
        meetingLink: "https://zoom.us/j/1234567890",
        createdById: faculty.id,
      },
      {
        courseId: course.id,
        batchId: batch.id,
        dayOfWeek: 5, // Friday
        startTime: "09:00",
        endTime: "10:30",
        location: "Room 118, CS Building",
        meetingLink: "https://zoom.us/j/1234567890",
        createdById: faculty.id,
      },
      {
        courseId: course.id,
        batchId: batch.id,
        dayOfWeek: 2, // Tuesday
        startTime: "14:00",
        endTime: "15:30",
        location: null,
        meetingLink: "https://meet.google.com/abc-defg-hij",
        createdById: faculty.id,
      },
    ],
  });

  // --- Certificate module demo data ----------------------------------------
  // demo.student1 completed every seeded lesson (see progress demo data
  // above), so they're eligible for a real certificate on CS101.
  const topStudent = students[0]!;
  await prisma.certificate.upsert({
    where: { studentId_courseId: { studentId: topStudent.id, courseId: course.id } },
    update: {},
    create: {
      studentId: topStudent.id,
      courseId: course.id,
      certificateNumber: `HEC-${new Date().getFullYear()}-00001`,
      verificationCode: randomBytes(16).toString("hex"),
      studentName: topStudent.name ?? topStudent.email,
      courseName: course.name,
      courseCode: course.code,
    },
  });

  console.log("Seeded demo attendance data:");
  console.log(`  faculty:  demo.faculty@lms-portal.edu / DemoPass!123`);
  console.log(
    `  students: demo.student1@lms-portal.edu .. demo.student6@lms-portal.edu / DemoPass!123`
  );
  console.log(`            (registration numbers STU-2026-0001 .. 0006, batch "2024 - 2028")`);
  console.log(`  course:   CS101 — Introduction to Programming`);
  console.log(
    `  progress: 2 modules / 8 lessons, 2 quizzes, 2 assignments — demo.student1 has completed`
  );
  console.log(
    `            everything; demo.student2 is about halfway; the rest are just starting.`
  );
  console.log(`  exams:    4 exam countdowns seeded (CUET PG, UGC NET Paper I, UGC NET`);
  console.log(`            Psychology, an internal mock test) — see /student/exams.`);
  console.log(`  notifications: 7 seeded across every category, 2 pinned — see /notifications.`);
  console.log(`  timetable: CS101 meets Mon/Wed/Fri 9-10:30am + Tue 2-3:30pm — see`);
  console.log(`             /student/timetable, /faculty/timetable, or /academic-admin/timetable.`);
  console.log(`  results:  Semester 1 published for student1/2/3 (92%/78%/65%) — see`);
  console.log(`            /student/results (log in as demo.student1 for the top rank).`);
  console.log(`  certificates: 1 issued for demo.student1 (CS101) — see /student/certificates.`);
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
