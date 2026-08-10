import Image from "next/image";
import { GraduationCap, IdCard, Layers } from "lucide-react";
import { getInitials } from "@/lib/utils/user";
import type { StudentProfile } from "@/types/student-dashboard";

export default function ProfileSummaryCard({
  name,
  image,
  profile,
}: {
  name?: string | null;
  image?: string | null;
  profile: StudentProfile;
}) {
  const initials = getInitials(name, null);

  return (
    <section className="rounded-sm border border-ink-900/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {image ? (
          <Image
            src={image}
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-ink-900 text-xl font-semibold text-parchment-50">
            {initials}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-xl font-extrabold text-ink-900 sm:text-2xl">
            {name ?? "Student"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-900/60">
            <span className="flex items-center gap-1.5">
              <IdCard size={15} aria-hidden="true" />
              {profile.studentId}
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap size={15} aria-hidden="true" />
              {profile.program}
            </span>
            <span className="flex items-center gap-1.5">
              <Layers size={15} aria-hidden="true" />
              Batch {profile.batch}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
