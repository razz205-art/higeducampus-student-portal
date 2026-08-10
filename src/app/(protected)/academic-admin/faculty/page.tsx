import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllFaculty } from "@/lib/data/admin-users";
import UserManagementView from "@/components/admin/UserManagementView";

export const metadata = { title: "Manage Faculty" };

export default async function AdminFacultyPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const faculty = await getAllFaculty(searchParams.q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Manage Faculty</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Faculty accounts can only be created here — there is no faculty self-registration.
        </p>
      </div>
      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search by name or email…"
          className="w-full max-w-xs rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
        <button
          type="submit"
          className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-parchment-50 hover:bg-ink-800"
        >
          Search
        </button>
      </form>
      <UserManagementView users={faculty} role="FACULTY" batches={[]} courses={[]} />
    </div>
  );
}
