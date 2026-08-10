import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllTimetableSlotsForAdmin } from "@/lib/data/timetable";
import { getAllCourses, getBatches } from "@/lib/data/attendance";
import TimetableAdminView from "@/components/timetable/TimetableAdminView";

export const metadata = { title: "Timetable Management" };

export default async function AdminTimetablePage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const [slots, courses, batches] = await Promise.all([
    getAllTimetableSlotsForAdmin(),
    getAllCourses(),
    getBatches(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Timetable Management</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Add, edit, or disable recurring weekly classes. Students and faculty see this schedule
          under Today / Tomorrow / This Week / Next Week / Calendar View.
        </p>
      </div>
      <TimetableAdminView slots={slots} courses={courses} batches={batches} />
    </div>
  );
}
