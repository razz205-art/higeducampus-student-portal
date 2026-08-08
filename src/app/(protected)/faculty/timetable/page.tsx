import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getFacultyTimetableSlots } from "@/lib/data/timetable";
import TimetableView from "@/components/timetable/TimetableView";

export const metadata = { title: "Timetable" };

export default async function FacultyTimetablePage({
  searchParams,
}: {
  searchParams: { view?: string; month?: string; date?: string };
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "FACULTY" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const slots = await getFacultyTimetableSlots(session!.user.id);

  return (
    <TimetableView
      basePath="/faculty/timetable"
      slots={slots}
      searchParams={searchParams}
      subtitle="Your teaching schedule across every course."
    />
  );
}
