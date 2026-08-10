import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getActiveSessionDetails, getCheckinEligibility } from "@/lib/data/attendance";
import { formatDisplayDate, parseISODate } from "@/lib/utils/date";
import Alert from "@/components/ui/Alert";
import MarkAttendanceButton from "@/components/attendance/MarkAttendanceButton";

export const metadata = { title: "Attendance Portal" };

// This route is intentionally NOT under (protected) — it's the one
// permanent link ("https://.../attendance") that must never change, shared
// alongside the meeting link for every live class. It still requires
// login (see middleware.ts), which is what actually prevents fake
// submissions — see the module's security notes for why a fully
// anonymous version of this form was not built.
export default async function AttendancePortalPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/attendance");
  }

  const active = await getActiveSessionDetails();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/hig-educampus-mark.png"
            alt="HiG EDUCAMPUS"
            width={44}
            height={44}
            className="mx-auto mb-3 h-11 w-11"
          />
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            HiG EDUCAMPUS
          </p>
          <h1 className="font-serif text-2xl font-extrabold text-parchment-50">
            Attendance Portal
          </h1>
        </div>

        <div className="rounded-sm border border-white/10 bg-parchment-50 p-8 shadow-2xl">
          {!active ? (
            <Alert variant="error">Attendance is currently closed.</Alert>
          ) : session.user.role !== "STUDENT" ? (
            <div className="space-y-3 text-sm text-ink-900/70">
              <p>
                An attendance session is open for <strong>{active.subjectLabel}</strong> (
                {active.courseCode}). This page is for students to mark their own attendance — staff
                accounts don&rsquo;t submit here.
              </p>
            </div>
          ) : (
            <StudentCheckinForm studentId={session.user.id} active={active} />
          )}
        </div>
      </div>
    </div>
  );
}

async function StudentCheckinForm({
  studentId,
  active,
}: {
  studentId: string;
  active: NonNullable<Awaited<ReturnType<typeof getActiveSessionDetails>>>;
}) {
  const [student, eligibility] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, email: true, registrationNumber: true },
    }),
    getCheckinEligibility(studentId, active),
  ]);

  if (!eligibility.eligible) {
    return <Alert variant="error">{eligibility.reason}</Alert>;
  }

  const rows: [string, string][] = [
    ["Registration Number", student?.registrationNumber ?? "Not on file"],
    ["Student Name", student?.name ?? student?.email ?? "—"],
    ["Course", `${active.courseCode} — ${active.courseName}`],
    ["Batch", active.batchName ?? "All batches"],
    ["Subject", active.subjectLabel],
    ["Faculty", active.facultyName],
    ["Date", formatDisplayDate(parseISODate(active.date))],
    ["Time", active.startTime],
  ];

  return (
    <div className="space-y-5">
      <dl className="space-y-2.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <dt className="text-ink-900/50">{label}</dt>
            <dd className="font-medium text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-ink-900/10 pt-5">
        <MarkAttendanceButton alreadyCheckedIn={eligibility.alreadyCheckedIn} />
      </div>
    </div>
  );
}
