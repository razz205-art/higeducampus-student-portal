import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getStudentTimetableSlots } from "@/lib/data/timetable";
import TimetableView from "@/components/timetable/TimetableView";

export const metadata = { title: "Timetable" };

export default async function StudentTimetablePage({
  searchParams,
}: {
  searchParams: { view?: string; month?: string; date?: string };
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const slots = await getStudentTimetableSlots(session!.user.id);

  return (
    <TimetableView
      basePath="/student/timetable"
      slots={slots}
      searchParams={searchParams}
      subtitle="Your enrolled courses' weekly schedule."
    />
  );
}
